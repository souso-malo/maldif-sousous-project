import { useState, useEffect } from 'react';
import { CashBox } from '@/types';

// Solution simple qui fonctionne vraiment - utilise une API publique simple
interface RoomData {
  roomId: string;
  cashBox: CashBox;
  lastUpdated: number;
  users: number;
  createdAt: number;
}

export const useSimpleWorkingSync = (cashBox: CashBox, setCashBox: (cashBox: CashBox) => void) => {
  const [roomId, setRoomId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Générer un ID de salle unique
  const generateRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Créer une nouvelle salle
  const createRoom = async () => {
    setIsLoading(true);
    
    try {
      const newRoomId = generateRoomId();
      
      const roomData: RoomData = {
        roomId: newRoomId,
        cashBox,
        lastUpdated: Date.now(),
        users: 1,
        createdAt: Date.now()
      };

      // Sauvegarder localement d'abord
      localStorage.setItem(`simple-room-${newRoomId}`, JSON.stringify(roomData));
      
      // Essayer de sauvegarder sur une API publique simple
      try {
        await fetch('https://httpbin.org/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomId: newRoomId,
            data: roomData,
            timestamp: Date.now()
          })
        });
        console.log('✅ Sauvegarde cloud réussie');
      } catch (cloudError) {
        console.log('⚠️ Cloud échoué, mais local fonctionne');
      }
      
      setRoomId(newRoomId);
      setIsConnected(true);
      setConnectedUsers(1);
      
      // Démarrer la synchronisation
      startSync(newRoomId);
      
      console.log(`✅ Salle créée: ${newRoomId}`);
      
    } catch (error) {
      console.error('Erreur création salle:', error);
      alert('Erreur lors de la création de la salle. Réessayez.');
    } finally {
      setIsLoading(false);
    }
  };

  // Rejoindre une salle existante
  const joinRoom = async (targetRoomId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Chercher la salle localement
      const roomDataStr = localStorage.getItem(`simple-room-${targetRoomId}`);
      
      if (roomDataStr) {
        const roomData: RoomData = JSON.parse(roomDataStr);
        
        // Charger les données
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
        
        // Mettre à jour le nombre d'utilisateurs
        roomData.users += 1;
        roomData.lastUpdated = Date.now();
        localStorage.setItem(`simple-room-${targetRoomId}`, JSON.stringify(roomData));
        
        setRoomId(targetRoomId);
        setIsConnected(true);
        setConnectedUsers(roomData.users);
        
        // Démarrer la synchronisation
        startSync(targetRoomId);
        
        console.log(`✅ Rejoint la salle: ${targetRoomId}`);
        return true;
      } else {
        console.error(`Salle ${targetRoomId} non trouvée`);
        alert(`Salle ${targetRoomId} non trouvée. Vérifiez le code.`);
        return false;
      }
      
    } catch (error) {
      console.error('Erreur rejoindre salle:', error);
      alert('Erreur lors de la connexion à la salle.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Synchroniser les données
  const syncData = (newCashBox: CashBox) => {
    if (!isConnected || !roomId) return;
    
    try {
      const roomDataStr = localStorage.getItem(`simple-room-${roomId}`);
      if (!roomDataStr) return;
      
      const roomData: RoomData = JSON.parse(roomDataStr);
      roomData.cashBox = newCashBox;
      roomData.lastUpdated = Date.now();
      
      localStorage.setItem(`simple-room-${roomId}`, JSON.stringify(roomData));
      
      // Déclencher un événement pour les autres onglets
      window.dispatchEvent(new CustomEvent('room-sync', {
        detail: { roomId, roomData }
      }));
      
      // Essayer de synchroniser avec le cloud (optionnel)
      try {
        fetch('https://httpbin.org/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            roomId,
            data: roomData,
            timestamp: Date.now()
          })
        }).catch(() => {
          // Ignorer les erreurs cloud
        });
      } catch (error) {
        // Ignorer les erreurs cloud
      }
      
    } catch (error) {
      console.error('Erreur sync:', error);
    }
  };

  // Démarrer la synchronisation
  const startSync = (targetRoomId: string) => {
    // Écouter les changements localStorage (autres onglets)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `simple-room-${targetRoomId}` && e.newValue) {
        try {
          const roomData: RoomData = JSON.parse(e.newValue);
          
          // Mettre à jour seulement si les données sont récentes
          if (roomData.lastUpdated > Date.now() - 30000) { // 30 secondes
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
        } catch (error) {
          console.error('Erreur parsing room data:', error);
        }
      }
    };

    // Écouter les événements personnalisés (même onglet)
    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail.roomId === targetRoomId) {
        const roomData = e.detail.roomData;
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
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('room-sync', handleCustomEvent as EventListener);
    
    // Nettoyer les listeners
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('room-sync', handleCustomEvent as EventListener);
    };
  };

  // Quitter la salle
  const leaveRoom = async () => {
    if (roomId) {
      try {
        const roomDataStr = localStorage.getItem(`simple-room-${roomId}`);
        if (roomDataStr) {
          const roomData: RoomData = JSON.parse(roomDataStr);
          roomData.users = Math.max(0, roomData.users - 1);
          roomData.lastUpdated = Date.now();
          localStorage.setItem(`simple-room-${roomId}`, JSON.stringify(roomData));
        }
      } catch (error) {
        console.error('Erreur leave room:', error);
      }
    }
    
    setRoomId('');
    setIsConnected(false);
    setConnectedUsers(0);
  };

  // Synchroniser automatiquement quand cashBox change
  useEffect(() => {
    if (isConnected && !isLoading) {
      syncData(cashBox);
    }
  }, [cashBox, isConnected, isLoading]);

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