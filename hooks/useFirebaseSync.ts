import { useState, useEffect } from 'react';
import { CashBox } from '@/types';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  updateDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface RoomData {
  roomId: string;
  cashBox: CashBox;
  lastUpdated: any; // Firestore timestamp
  users: number;
  createdAt: any; // Firestore timestamp
}

export const useFirebaseSync = (cashBox: CashBox, setCashBox: (cashBox: CashBox) => void) => {
  const [roomId, setRoomId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Générer un ID de salle unique
  const generateRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Créer une nouvelle salle dans Firebase
  const createRoom = async () => {
    setIsLoading(true);
    
    try {
      const newRoomId = generateRoomId();
      
      const roomData: RoomData = {
        roomId: newRoomId,
        cashBox,
        lastUpdated: serverTimestamp(),
        users: 1,
        createdAt: serverTimestamp()
      };

      // Créer le document dans Firestore
      const roomRef = doc(db, 'rooms', newRoomId);
      await setDoc(roomRef, roomData);
      
      setRoomId(newRoomId);
      setIsConnected(true);
      setConnectedUsers(1);
      
      // Démarrer l'écoute en temps réel
      startRealtimeListener(newRoomId);
      
      console.log(`✅ Salle créée dans Firebase: ${newRoomId}`);
      
    } catch (error) {
      console.error('Erreur création salle Firebase:', error);
      
      // Fallback vers solution locale si Firebase échoue
      await createRoomLocal();
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback local si Firebase échoue
  const createRoomLocal = async () => {
    try {
      const newRoomId = generateRoomId();
      
      const roomData = {
        roomId: newRoomId,
        cashBox,
        lastUpdated: Date.now(),
        users: 1,
        createdAt: Date.now()
      };

      localStorage.setItem(`room-${newRoomId}`, JSON.stringify(roomData));
      
      setRoomId(newRoomId);
      setIsConnected(true);
      setConnectedUsers(1);
      
      console.log(`✅ Salle créée localement (fallback): ${newRoomId}`);
      
    } catch (error) {
      console.error('Erreur fallback local:', error);
      alert('Impossible de créer la salle. Vérifiez votre connexion.');
    }
  };

  // Rejoindre une salle existante
  const joinRoom = async (targetRoomId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Essayer de récupérer la salle depuis Firebase
      const roomRef = doc(db, 'rooms', targetRoomId);
      const roomSnap = await getDoc(roomRef);
      
      if (roomSnap.exists()) {
        const roomData = roomSnap.data() as RoomData;
        
        // Charger les données de la salle
        setCashBox({
          ...roomData.cashBox,
          transactions: roomData.cashBox.transactions.map((t: any) => ({
            ...t,
            date: new Date(t.date)
          })),
          orders: roomData.cashBox.orders.map((o: any) => ({
            ...o,
            date: new Date(o.date)
          }))
        });
        
        // Incrémenter le nombre d'utilisateurs
        await updateDoc(roomRef, {
          users: increment(1),
          lastUpdated: serverTimestamp()
        });
        
        setRoomId(targetRoomId);
        setIsConnected(true);
        setConnectedUsers(roomData.users + 1);
        
        // Démarrer l'écoute en temps réel
        startRealtimeListener(targetRoomId);
        
        console.log(`✅ Rejoint la salle Firebase: ${targetRoomId}`);
        return true;
        
      } else {
        // Essayer le fallback local
        return await joinRoomLocal(targetRoomId);
      }
      
    } catch (error) {
      console.error('Erreur rejoindre salle Firebase:', error);
      return await joinRoomLocal(targetRoomId);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback local pour rejoindre
  const joinRoomLocal = async (targetRoomId: string): Promise<boolean> => {
    try {
      const roomDataStr = localStorage.getItem(`room-${targetRoomId}`);
      
      if (roomDataStr) {
        const roomData = JSON.parse(roomDataStr);
        
        setCashBox({
          ...roomData.cashBox,
          transactions: roomData.cashBox.transactions.map((t: any) => ({
            ...t,
            date: new Date(t.date)
          })),
          orders: roomData.cashBox.orders.map((o: any) => ({
            ...o,
            date: new Date(o.date)
          }))
        });
        
        setRoomId(targetRoomId);
        setIsConnected(true);
        setConnectedUsers(roomData.users + 1);
        
        console.log(`✅ Rejoint la salle locale: ${targetRoomId}`);
        return true;
      }
      
      console.error(`Salle ${targetRoomId} non trouvée`);
      return false;
      
    } catch (error) {
      console.error('Erreur rejoindre salle locale:', error);
      return false;
    }
  };

  // Démarrer l'écoute en temps réel avec Firebase
  const startRealtimeListener = (targetRoomId: string) => {
    const roomRef = doc(db, 'rooms', targetRoomId);
    
    const unsubscribeFn = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const roomData = doc.data() as RoomData;
        
        // Mettre à jour les données en temps réel
        setCashBox({
          ...roomData.cashBox,
          transactions: roomData.cashBox.transactions.map((t: any) => ({
            ...t,
            date: new Date(t.date)
          })),
          orders: roomData.cashBox.orders.map((o: any) => ({
            ...o,
            date: new Date(o.date)
          }))
        });
        
        setConnectedUsers(roomData.users);
      }
    }, (error) => {
      console.error('Erreur écoute temps réel:', error);
    });
    
    setUnsubscribe(() => unsubscribeFn);
  };

  // Synchroniser vers Firebase
  const syncToFirebase = async (newCashBox: CashBox) => {
    if (!isConnected || !roomId) return;
    
    try {
      const roomRef = doc(db, 'rooms', roomId);
      
      await updateDoc(roomRef, {
        cashBox: newCashBox,
        lastUpdated: serverTimestamp()
      });
      
    } catch (error) {
      console.error('Erreur sync Firebase:', error);
      
      // Fallback local
      try {
        const roomData = {
          roomId,
          cashBox: newCashBox,
          lastUpdated: Date.now(),
          users: connectedUsers,
          createdAt: Date.now()
        };
        
        localStorage.setItem(`room-${roomId}`, JSON.stringify(roomData));
      } catch (localError) {
        console.error('Erreur sync local:', localError);
      }
    }
  };

  // Quitter la salle
  const leaveRoom = async () => {
    if (roomId && isConnected) {
      try {
        // Décrémenter le nombre d'utilisateurs dans Firebase
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          users: increment(-1),
          lastUpdated: serverTimestamp()
        });
      } catch (error) {
        console.error('Erreur leave room Firebase:', error);
      }
    }
    
    // Arrêter l'écoute temps réel
    if (unsubscribe) {
      unsubscribe();
      setUnsubscribe(null);
    }
    
    setRoomId('');
    setIsConnected(false);
    setConnectedUsers(0);
  };

  // Synchroniser automatiquement quand cashBox change
  useEffect(() => {
    if (isConnected && !isLoading) {
      syncToFirebase(cashBox);
    }
  }, [cashBox, isConnected, isLoading]);

  // Nettoyer l'écoute au démontage
  useEffect(() => {
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [unsubscribe]);

  return {
    roomId,
    isConnected,
    connectedUsers,
    isLoading,
    createRoom,
    joinRoom,
    leaveRoom
  };
};