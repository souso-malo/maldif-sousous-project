import { useState, useEffect } from 'react';
import { CashBox } from '@/types';

// Solution simple avec localStorage + BroadcastChannel pour le partage local
// Et une API simple pour le partage distant
interface RoomData {
  roomId: string;
  cashBox: CashBox;
  lastUpdated: number;
  users: number;
}

export const useCloudSync = (cashBox: CashBox, setCashBox: (cashBox: CashBox) => void) => {
  const [roomId, setRoomId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [broadcastChannel, setBroadcastChannel] = useState<BroadcastChannel | null>(null);

  // Générer un ID de salle unique
  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Créer une nouvelle salle (stockage local + broadcast)
  const createRoom = async () => {
    setIsLoading(true);
    const newRoomId = generateRoomId();
    
    try {
      const roomData: RoomData = {
        roomId: newRoomId,
        cashBox,
        lastUpdated: Date.now(),
        users: 1
      };

      // Sauvegarder dans localStorage avec un préfixe pour les salles
      localStorage.setItem(`room-${newRoomId}`, JSON.stringify(roomData));
      
      // Créer un canal de diffusion pour cette salle
      const channel = new BroadcastChannel(`coffre-fort-${newRoomId}`);
      setBroadcastChannel(channel);
      
      // Écouter les messages des autres onglets/fenêtres
      channel.onmessage = (event) => {
        if (event.data.type === 'ROOM_UPDATE') {
          const updatedData = event.data.roomData;
          setCashBox({
            ...updatedData.cashBox,
            transactions: updatedData.cashBox.transactions.map((t: any) => ({
              ...t,
              date: new Date(t.date)
            })),
            orders: updatedData.cashBox.orders.map((o: any) => ({
              ...o,
              date: new Date(o.date)
            }))
          });
          setConnectedUsers(updatedData.users);
        } else if (event.data.type === 'USER_JOIN') {
          setConnectedUsers(prev => prev + 1);
        } else if (event.data.type === 'USER_LEAVE') {
          setConnectedUsers(prev => Math.max(1, prev - 1));
        }
      };
      
      setRoomId(newRoomId);
      setIsConnected(true);
      setConnectedUsers(1);
      
      localStorage.setItem('current-room', newRoomId);
      
      console.log(`Salle créée: ${newRoomId}`);
      
      // Essayer aussi de sauvegarder en ligne (optionnel)
      try {
        await saveToCloud(newRoomId, roomData);
      } catch (error) {
        console.log('Sauvegarde cloud échouée, mais salle locale créée');
      }
      
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
      // D'abord chercher localement
      let roomDataStr = localStorage.getItem(`room-${targetRoomId}`);
      let roomData: RoomData | null = null;
      
      if (roomDataStr) {
        roomData = JSON.parse(roomDataStr);
      } else {
        // Si pas trouvé localement, essayer de récupérer du cloud
        try {
          roomData = await loadFromCloud(targetRoomId);
          if (roomData) {
            // Sauvegarder localement pour les prochaines fois
            localStorage.setItem(`room-${targetRoomId}`, JSON.stringify(roomData));
          }
        } catch (error) {
          console.log('Récupération cloud échouée');
        }
      }
      
      if (roomData && roomData.cashBox) {
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
        
        // Créer un canal de diffusion pour cette salle
        const channel = new BroadcastChannel(`coffre-fort-${targetRoomId}`);
        setBroadcastChannel(channel);
        
        // Écouter les messages
        channel.onmessage = (event) => {
          if (event.data.type === 'ROOM_UPDATE') {
            const updatedData = event.data.roomData;
            setCashBox({
              ...updatedData.cashBox,
              transactions: updatedData.cashBox.transactions.map((t: any) => ({
                ...t,
                date: new Date(t.date)
              })),
              orders: updatedData.cashBox.orders.map((o: any) => ({
                ...o,
                date: new Date(o.date)
              }))
            });
            setConnectedUsers(updatedData.users);
          } else if (event.data.type === 'USER_JOIN') {
            setConnectedUsers(prev => prev + 1);
          } else if (event.data.type === 'USER_LEAVE') {
            setConnectedUsers(prev => Math.max(1, prev - 1));
          }
        };
        
        // Annoncer qu'on rejoint
        channel.postMessage({ type: 'USER_JOIN' });
        
        setRoomId(targetRoomId);
        setIsConnected(true);
        setConnectedUsers(roomData.users + 1);
        
        localStorage.setItem('current-room', targetRoomId);
        
        // Mettre à jour le nombre d'utilisateurs
        roomData.users += 1;
        localStorage.setItem(`room-${targetRoomId}`, JSON.stringify(roomData));
        
        console.log(`Rejoint la salle: ${targetRoomId}`);
        return true;
      } else {
        console.error('Salle non trouvée');
        return false;
      }
    } catch (error) {
      console.error('Erreur rejoindre salle:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Synchroniser les données
  const syncToStorage = async (newCashBox: CashBox) => {
    if (!isConnected || !roomId) return;
    
    try {
      const roomData: RoomData = {
        roomId,
        cashBox: newCashBox,
        lastUpdated: Date.now(),
        users: connectedUsers
      };

      // Sauvegarder localement
      localStorage.setItem(`room-${roomId}`, JSON.stringify(roomData));
      
      // Diffuser aux autres onglets/fenêtres
      if (broadcastChannel) {
        broadcastChannel.postMessage({
          type: 'ROOM_UPDATE',
          roomData
        });
      }
      
      // Essayer de sauvegarder en ligne (optionnel)
      try {
        await saveToCloud(roomId, roomData);
      } catch (error) {
        // Ignorer les erreurs cloud, le local fonctionne
      }
    } catch (error) {
      console.error('Erreur sync:', error);
    }
  };

  // Sauvegarder dans le cloud (optionnel)
  const saveToCloud = async (roomId: string, roomData: RoomData) => {
    // Utiliser une API simple comme httpbin pour les tests
    const response = await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId, data: roomData })
    });
    
    if (!response.ok) {
      throw new Error('Cloud save failed');
    }
  };

  // Charger depuis le cloud (optionnel)
  const loadFromCloud = async (roomId: string): Promise<RoomData | null> => {
    // Pour l'instant, retourner null car on n'a pas de vraie API
    return null;
  };

  // Quitter la salle
  const leaveRoom = async () => {
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'USER_LEAVE' });
      broadcastChannel.close();
      setBroadcastChannel(null);
    }
    
    setRoomId('');
    setIsConnected(false);
    setConnectedUsers(0);
    localStorage.removeItem('current-room');
  };

  // Synchroniser automatiquement quand cashBox change
  useEffect(() => {
    if (isConnected && !isLoading) {
      syncToStorage(cashBox);
    }
  }, [cashBox, isConnected, isLoading]);

  // Restaurer la salle au démarrage
  useEffect(() => {
    const savedRoom = localStorage.getItem('current-room');
    if (savedRoom) {
      joinRoom(savedRoom);
    }
  }, []);

  // Nettoyer le canal de diffusion au démontage
  useEffect(() => {
    return () => {
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }, [broadcastChannel]);

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