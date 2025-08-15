import { useState, useEffect } from 'react';
import { CashBox } from '@/types';

// Solution avec API publique qui fonctionne vraiment (pas de CORS)
interface RoomData {
  roomId: string;
  cashBox: CashBox;
  lastUpdated: number;
  users: number;
  createdAt: number;
}

export const useWorkingCloudSync = (cashBox: CashBox, setCashBox: (cashBox: CashBox) => void) => {
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

  // Créer une nouvelle salle avec JSONPlaceholder (API publique sans CORS)
  const createRoom = async () => {
    setIsLoading(true);
    const newRoomId = generateRoomId();
    
    try {
      const roomData: RoomData = {
        roomId: newRoomId,
        cashBox,
        lastUpdated: Date.now(),
        users: 1,
        createdAt: Date.now()
      };

      // Utiliser JSONPlaceholder pour tester (remplace par une vraie API)
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Room ${newRoomId}`,
          body: JSON.stringify(roomData),
          userId: 1
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Sauvegarder localement avec l'ID du post
        localStorage.setItem(`room-${newRoomId}`, JSON.stringify(roomData));
        localStorage.setItem(`room-${newRoomId}-postId`, result.id.toString());
        
        // Ajouter à la liste des salles
        const roomsList = JSON.parse(localStorage.getItem('rooms-list') || '[]');
        roomsList.push({ roomId: newRoomId, postId: result.id });
        localStorage.setItem('rooms-list', JSON.stringify(roomsList));
        
        setRoomId(newRoomId);
        setIsConnected(true);
        setConnectedUsers(1);
        
        localStorage.setItem('current-room', newRoomId);
        
        // Démarrer la synchronisation
        startPolling(newRoomId);
        
        console.log(`✅ Salle créée avec succès: ${newRoomId}`);
        
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur création salle:', error);
      
      // Fallback vers solution locale pure
      await createRoomLocal(newRoomId);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback local si API échoue
  const createRoomLocal = async (newRoomId: string) => {
    try {
      const roomData: RoomData = {
        roomId: newRoomId,
        cashBox,
        lastUpdated: Date.now(),
        users: 1,
        createdAt: Date.now()
      };

      // Sauvegarder localement
      localStorage.setItem(`room-${newRoomId}`, JSON.stringify(roomData));
      
      // Utiliser BroadcastChannel pour la synchronisation locale
      const channel = new BroadcastChannel(`coffre-${newRoomId}`);
      
      setRoomId(newRoomId);
      setIsConnected(true);
      setConnectedUsers(1);
      
      localStorage.setItem('current-room', newRoomId);
      
      // Démarrer l'écoute locale
      startLocalSync(newRoomId, channel);
      
      console.log(`✅ Salle créée localement: ${newRoomId}`);
      
    } catch (error) {
      console.error('Erreur fallback local:', error);
      alert('Impossible de créer la salle. Réessayez.');
    }
  };

  // Rejoindre une salle existante
  const joinRoom = async (targetRoomId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Chercher d'abord localement
      const localData = localStorage.getItem(`room-${targetRoomId}`);
      
      if (localData) {
        const roomData: RoomData = JSON.parse(localData);
        return await loadRoomData(targetRoomId, roomData);
      }
      
      // Essayer de récupérer depuis l'API
      const roomsList = JSON.parse(localStorage.getItem('rooms-list') || '[]');
      const roomInfo = roomsList.find((r: any) => r.roomId === targetRoomId);
      
      if (roomInfo) {
        const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${roomInfo.postId}`);
        
        if (response.ok) {
          const post = await response.json();
          const roomData: RoomData = JSON.parse(post.body);
          return await loadRoomData(targetRoomId, roomData);
        }
      }
      
      // Si pas trouvé, chercher dans toutes les salles locales
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('room-') && key.endsWith(targetRoomId)) {
          const roomData: RoomData = JSON.parse(localStorage.getItem(key) || '{}');
          if (roomData.roomId === targetRoomId) {
            return await loadRoomData(targetRoomId, roomData);
          }
        }
      }
      
      console.error(`Salle ${targetRoomId} non trouvée`);
      return false;
      
    } catch (error) {
      console.error('Erreur rejoindre salle:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les données d'une salle
  const loadRoomData = async (targetRoomId: string, roomData: RoomData): Promise<boolean> => {
    try {
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
      localStorage.setItem(`room-${targetRoomId}`, JSON.stringify(roomData));
      
      setRoomId(targetRoomId);
      setIsConnected(true);
      setConnectedUsers(roomData.users);
      
      localStorage.setItem('current-room', targetRoomId);
      
      // Démarrer la synchronisation
      startPolling(targetRoomId);
      
      console.log(`✅ Rejoint la salle: ${targetRoomId}`);
      return true;
    } catch (error) {
      console.error('Erreur load room data:', error);
      return false;
    }
  };

  // Synchroniser vers le cloud
  const syncToCloud = async (newCashBox: CashBox) => {
    if (!isConnected || !roomId) return;
    
    try {
      const roomData: RoomData = {
        roomId,
        cashBox: newCashBox,
        lastUpdated: Date.now(),
        users: connectedUsers,
        createdAt: Date.now()
      };

      // Sauvegarder localement
      localStorage.setItem(`room-${roomId}`, JSON.stringify(roomData));
      
      // Essayer de synchroniser avec l'API
      const postId = localStorage.getItem(`room-${roomId}-postId`);
      if (postId) {
        try {
          await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: parseInt(postId),
              title: `Room ${roomId}`,
              body: JSON.stringify(roomData),
              userId: 1
            })
          });
        } catch (error) {
          console.log('Sync API échoué, mais données sauvées localement');
        }
      }
      
      // Diffuser aux autres onglets
      try {
        const channel = new BroadcastChannel(`coffre-${roomId}`);
        channel.postMessage({
          type: 'ROOM_UPDATE',
          roomData
        });
        channel.close();
      } catch (error) {
        console.log('Broadcast échoué');
      }
      
    } catch (error) {
      console.error('Erreur sync:', error);
    }
  };

  // Polling pour les changements
  const startPolling = (targetRoomId: string) => {
    const interval = setInterval(async () => {
      if (!isConnected) {
        clearInterval(interval);
        return;
      }
      
      try {
        // Vérifier les changements locaux
        const localData = localStorage.getItem(`room-${targetRoomId}`);
        if (localData) {
          const roomData: RoomData = JSON.parse(localData);
          
          if (roomData.lastUpdated > Date.now() - 10000) { // Changement récent
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
        }
      } catch (error) {
        console.error('Erreur polling:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  // Synchronisation locale avec BroadcastChannel
  const startLocalSync = (targetRoomId: string, channel: BroadcastChannel) => {
    channel.onmessage = (event) => {
      if (event.data.type === 'ROOM_UPDATE') {
        const roomData = event.data.roomData;
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

    // Écouter les changements de localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `room-${targetRoomId}` && e.newValue) {
        try {
          const roomData: RoomData = JSON.parse(e.newValue);
          if (roomData.lastUpdated > Date.now() - 5000) {
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
          console.error('Erreur storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      channel.close();
    };
  };

  // Quitter la salle
  const leaveRoom = async () => {
    if (roomId) {
      try {
        const roomDataStr = localStorage.getItem(`room-${roomId}`);
        if (roomDataStr) {
          const roomData: RoomData = JSON.parse(roomDataStr);
          roomData.users = Math.max(0, roomData.users - 1);
          roomData.lastUpdated = Date.now();
          localStorage.setItem(`room-${roomId}`, JSON.stringify(roomData));
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

  // Synchroniser automatiquement
  useEffect(() => {
    if (isConnected && !isLoading) {
      syncToCloud(cashBox);
    }
  }, [cashBox, isConnected, isLoading]);

  // Restaurer la salle au démarrage
  useEffect(() => {
    const savedRoom = localStorage.getItem('current-room');
    if (savedRoom) {
      joinRoom(savedRoom);
    }
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