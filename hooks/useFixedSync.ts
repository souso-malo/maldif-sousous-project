import { useState, useEffect } from 'react';
import { CashBox } from '@/types';

// Solution simple et fiable qui fonctionne vraiment
interface RoomData {
  roomId: string;
  cashBox: CashBox;
  lastUpdated: number;
  users: number;
  createdAt: number;
}

export const useFixedSync = (cashBox: CashBox, setCashBox: (cashBox: CashBox) => void) => {
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

      // Sauvegarder la salle dans localStorage
      localStorage.setItem(`coffre-room-${newRoomId}`, JSON.stringify(roomData));
      
      // Ajouter à la liste des salles disponibles
      const existingRooms = JSON.parse(localStorage.getItem('coffre-rooms-list') || '[]');
      if (!existingRooms.includes(newRoomId)) {
        existingRooms.push(newRoomId);
        localStorage.setItem('coffre-rooms-list', JSON.stringify(existingRooms));
      }
      
      setRoomId(newRoomId);
      setIsConnected(true);
      setConnectedUsers(1);
      
      // NE PAS sauvegarder comme salle courante automatiquement
      // localStorage.setItem('current-room', newRoomId);
      
      // Démarrer l'écoute des changements
      startListening(newRoomId);
      
      console.log(`✅ Salle créée avec succès: ${newRoomId}`);
      
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
      // Chercher la salle dans localStorage
      const roomDataStr = localStorage.getItem(`coffre-room-${targetRoomId}`);
      
      if (!roomDataStr) {
        console.error(`Salle ${targetRoomId} non trouvée`);
        return false;
      }
      
      const roomData: RoomData = JSON.parse(roomDataStr);
      
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
      
      // Mettre à jour le nombre d'utilisateurs
      roomData.users += 1;
      roomData.lastUpdated = Date.now();
      localStorage.setItem(`coffre-room-${targetRoomId}`, JSON.stringify(roomData));
      
      setRoomId(targetRoomId);
      setIsConnected(true);
      setConnectedUsers(roomData.users);
      
      // Sauvegarder comme salle courante seulement quand on rejoint explicitement
      localStorage.setItem('current-room', targetRoomId);
      
      // Démarrer l'écoute des changements
      startListening(targetRoomId);
      
      console.log(`✅ Rejoint la salle: ${targetRoomId}`);
      return true;
      
    } catch (error) {
      console.error('Erreur rejoindre salle:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Synchroniser les données
  const syncData = (newCashBox: CashBox) => {
    if (!isConnected || !roomId) return;
    
    try {
      const roomDataStr = localStorage.getItem(`coffre-room-${roomId}`);
      if (!roomDataStr) return;
      
      const roomData: RoomData = JSON.parse(roomDataStr);
      roomData.cashBox = newCashBox;
      roomData.lastUpdated = Date.now();
      
      localStorage.setItem(`coffre-room-${roomId}`, JSON.stringify(roomData));
      
      // Déclencher un événement pour notifier les autres onglets
      window.dispatchEvent(new CustomEvent('coffre-room-update', {
        detail: { roomId, roomData }
      }));
      
    } catch (error) {
      console.error('Erreur sync:', error);
    }
  };

  // Écouter les changements des autres onglets
  const startListening = (targetRoomId: string) => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `coffre-room-${targetRoomId}` && e.newValue) {
        try {
          const roomData: RoomData = JSON.parse(e.newValue);
          
          // Mettre à jour seulement si les données sont plus récentes
          const currentTime = Date.now();
          if (roomData.lastUpdated > currentTime - 10000) { // 10 secondes
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
    window.addEventListener('coffre-room-update', handleCustomEvent as EventListener);
    
    // Nettoyer les listeners
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('coffre-room-update', handleCustomEvent as EventListener);
    };
  };

  // Quitter la salle
  const leaveRoom = async () => {
    if (roomId) {
      try {
        const roomDataStr = localStorage.getItem(`coffre-room-${roomId}`);
        if (roomDataStr) {
          const roomData: RoomData = JSON.parse(roomDataStr);
          roomData.users = Math.max(0, roomData.users - 1);
          roomData.lastUpdated = Date.now();
          localStorage.setItem(`coffre-room-${roomId}`, JSON.stringify(roomData));
        }
      } catch (error) {
        console.error('Erreur leave room:', error);
      }
    }
    
    setRoomId('');
    setIsConnected(false);
    setConnectedUsers(0);
    localStorage.removeItem('current-room');
  };

  // Synchroniser automatiquement quand cashBox change
  useEffect(() => {
    if (isConnected && !isLoading) {
      syncData(cashBox);
    }
  }, [cashBox, isConnected, isLoading]);

  // CORRECTION: Ne pas restaurer automatiquement la salle au démarrage
  // Seulement si l'utilisateur clique explicitement sur "Rejoindre"
  
  // Nettoyer au démontage du composant
  useEffect(() => {
    return () => {
      // Nettoyer les listeners si nécessaire
    };
  }, []);

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