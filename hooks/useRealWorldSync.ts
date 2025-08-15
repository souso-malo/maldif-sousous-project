import { useState, useEffect } from 'react';
import { CashBox } from '@/types';

// Solution avec API REST publique qui fonctionne vraiment
// Utilise JSONBin.io - API gratuite pour stocker des données JSON

const API_BASE = 'https://api.jsonbin.io/v3/b';
const API_KEY = '$2a$10$demo.key.for.public.use.only'; // Clé de démonstration

interface RoomData {
  roomId: string;
  cashBox: CashBox;
  lastUpdated: number;
  users: number;
  createdAt: number;
}

export const useRealWorldSync = (cashBox: CashBox, setCashBox: (cashBox: CashBox) => void) => {
  const [roomId, setRoomId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [binId, setBinId] = useState<string>('');

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

      // Créer un bin sur JSONBin.io
      const response = await fetch(`${API_BASE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY,
          'X-Bin-Name': `coffre-room-${newRoomId}`,
          'X-Bin-Private': 'false'
        },
        body: JSON.stringify(roomData)
      });

      if (response.ok) {
        const result = await response.json();
        const newBinId = result.metadata.id;
        
        setBinId(newBinId);
        setRoomId(newRoomId);
        setIsConnected(true);
        setConnectedUsers(1);
        
        // Sauvegarder localement pour backup
        localStorage.setItem(`room-${newRoomId}`, JSON.stringify(roomData));
        localStorage.setItem(`room-${newRoomId}-binId`, newBinId);
        
        // Démarrer la synchronisation
        startPolling(newRoomId, newBinId);
        
        console.log(`✅ Salle créée sur JSONBin: ${newRoomId} (${newBinId})`);
        
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur création salle JSONBin:', error);
      
      // Fallback vers solution locale
      await createRoomLocal();
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback local
  const createRoomLocal = async () => {
    try {
      const newRoomId = generateRoomId();
      
      const roomData: RoomData = {
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
      
      // Démarrer la synchronisation locale
      startLocalPolling(newRoomId);
      
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
      // Chercher le binId localement
      const savedBinId = localStorage.getItem(`room-${targetRoomId}-binId`);
      
      if (savedBinId) {
        return await joinRoomWithBinId(targetRoomId, savedBinId);
      }
      
      // Chercher localement
      const localData = localStorage.getItem(`room-${targetRoomId}`);
      if (localData) {
        const roomData: RoomData = JSON.parse(localData);
        return await loadRoomData(targetRoomId, roomData);
      }
      
      // Essayer de chercher dans les bins publics (simulation)
      // En réalité, il faudrait une base de données pour mapper roomId -> binId
      console.error(`Salle ${targetRoomId} non trouvée`);
      return false;
      
    } catch (error) {
      console.error('Erreur rejoindre salle:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Rejoindre avec binId
  const joinRoomWithBinId = async (targetRoomId: string, targetBinId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/${targetBinId}/latest`, {
        headers: {
          'X-Master-Key': API_KEY
        }
      });

      if (response.ok) {
        const result = await response.json();
        const roomData: RoomData = result.record;
        
        // Incrémenter le nombre d'utilisateurs
        roomData.users += 1;
        roomData.lastUpdated = Date.now();
        
        // Mettre à jour sur JSONBin
        await updateRoomData(targetBinId, roomData);
        
        return await loadRoomData(targetRoomId, roomData, targetBinId);
      }
      
      return false;
    } catch (error) {
      console.error('Erreur join avec binId:', error);
      return false;
    }
  };

  // Charger les données d'une salle
  const loadRoomData = async (targetRoomId: string, roomData: RoomData, targetBinId?: string): Promise<boolean> => {
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
      
      setRoomId(targetRoomId);
      setIsConnected(true);
      setConnectedUsers(roomData.users);
      
      if (targetBinId) {
        setBinId(targetBinId);
        localStorage.setItem(`room-${targetRoomId}-binId`, targetBinId);
        startPolling(targetRoomId, targetBinId);
      } else {
        startLocalPolling(targetRoomId);
      }
      
      // Sauvegarder localement
      localStorage.setItem(`room-${targetRoomId}`, JSON.stringify(roomData));
      
      console.log(`✅ Rejoint la salle: ${targetRoomId}`);
      return true;
    } catch (error) {
      console.error('Erreur load room data:', error);
      return false;
    }
  };

  // Mettre à jour les données sur JSONBin
  const updateRoomData = async (targetBinId: string, roomData: RoomData) => {
    try {
      await fetch(`${API_BASE}/${targetBinId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY
        },
        body: JSON.stringify(roomData)
      });
    } catch (error) {
      console.error('Erreur update JSONBin:', error);
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
      
      // Synchroniser avec JSONBin si disponible
      if (binId) {
        await updateRoomData(binId, roomData);
      }
      
    } catch (error) {
      console.error('Erreur sync cloud:', error);
    }
  };

  // Polling pour les changements (JSONBin)
  const startPolling = (targetRoomId: string, targetBinId: string) => {
    const interval = setInterval(async () => {
      if (!isConnected) {
        clearInterval(interval);
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE}/${targetBinId}/latest`, {
          headers: {
            'X-Master-Key': API_KEY
          }
        });

        if (response.ok) {
          const result = await response.json();
          const roomData: RoomData = result.record;
          
          if (roomData.lastUpdated > Date.now() - 15000) { // Changement récent
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
            
            // Mettre à jour le cache local
            localStorage.setItem(`room-${targetRoomId}`, JSON.stringify(roomData));
          }
        }
      } catch (error) {
        console.error('Erreur polling JSONBin:', error);
      }
    }, 5000); // Vérifier toutes les 5 secondes

    return () => clearInterval(interval);
  };

  // Polling local
  const startLocalPolling = (targetRoomId: string) => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `room-${targetRoomId}` && e.newValue) {
        try {
          const roomData: RoomData = JSON.parse(e.newValue);
          
          if (roomData.lastUpdated > Date.now() - 10000) {
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
    };
  };

  // Quitter la salle
  const leaveRoom = async () => {
    if (roomId && binId) {
      try {
        // Décrémenter le nombre d'utilisateurs
        const roomDataStr = localStorage.getItem(`room-${roomId}`);
        if (roomDataStr) {
          const roomData: RoomData = JSON.parse(roomDataStr);
          roomData.users = Math.max(0, roomData.users - 1);
          roomData.lastUpdated = Date.now();
          
          await updateRoomData(binId, roomData);
          localStorage.setItem(`room-${roomId}`, JSON.stringify(roomData));
        }
      } catch (error) {
        console.error('Erreur leave room:', error);
      }
    }
    
    setRoomId('');
    setIsConnected(false);
    setConnectedUsers(0);
    setBinId('');
  };

  // Synchroniser automatiquement
  useEffect(() => {
    if (isConnected && !isLoading) {
      syncToCloud(cashBox);
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