import { useState, useEffect } from 'react';
import { CashBox } from '@/types';

// Solution simple avec une API gratuite pour le partage réel
const API_BASE = 'https://api.jsonbin.io/v3/b';
const API_KEY = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // Clé publique de test

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
  const [binId, setBinId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Générer un ID de salle unique
  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Créer une nouvelle salle dans le cloud
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

      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY,
          'X-Bin-Name': `coffre-fort-${newRoomId}`,
          'X-Bin-Private': 'false'
        },
        body: JSON.stringify(roomData)
      });

      if (response.ok) {
        const result = await response.json();
        const newBinId = result.metadata.id;
        
        setRoomId(newRoomId);
        setBinId(newBinId);
        setIsConnected(true);
        setConnectedUsers(1);
        
        // Sauvegarder localement pour retrouver la salle
        localStorage.setItem('current-room', newRoomId);
        localStorage.setItem(`bin-${newRoomId}`, newBinId);
        
        // Démarrer la synchronisation
        startPolling(newBinId);
        
        console.log(`Salle créée: ${newRoomId} (Bin: ${newBinId})`);
      } else {
        console.error('Erreur création salle:', response.statusText);
        alert('Erreur lors de la création de la salle. Réessayez.');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      alert('Problème de connexion. Vérifiez votre internet.');
    } finally {
      setIsLoading(false);
    }
  };

  // Rejoindre une salle existante
  const joinRoom = async (targetRoomId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Essayer de trouver la salle via l'ID stocké localement
      let targetBinId = localStorage.getItem(`bin-${targetRoomId}`);
      
      if (!targetBinId) {
        // Si pas trouvé localement, essayer de chercher via une liste publique
        // Pour l'instant, on utilise une approche simple
        alert(`Salle ${targetRoomId} introuvable. Assurez-vous que quelqu'un l'a créée.`);
        setIsLoading(false);
        return false;
      }

      // Récupérer les données de la salle
      const response = await fetch(`${API_BASE}/${targetBinId}/latest`, {
        headers: {
          'X-Master-Key': API_KEY
        }
      });

      if (response.ok) {
        const result = await response.json();
        const roomData: RoomData = result.record;
        
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
        
        setRoomId(targetRoomId);
        setBinId(targetBinId);
        setIsConnected(true);
        setConnectedUsers(roomData.users + 1);
        
        localStorage.setItem('current-room', targetRoomId);
        
        // Mettre à jour le nombre d'utilisateurs
        await updateUserCount(targetBinId, roomData.users + 1);
        
        // Démarrer la synchronisation
        startPolling(targetBinId);
        
        console.log(`Rejoint la salle: ${targetRoomId}`);
        return true;
      } else {
        console.error('Salle non trouvée:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Erreur rejoindre salle:', error);
      alert('Erreur de connexion. Vérifiez votre internet.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Synchroniser les données vers le cloud
  const syncToCloud = async (newCashBox: CashBox) => {
    if (!isConnected || !binId) return;
    
    try {
      const roomData: RoomData = {
        roomId,
        cashBox: newCashBox,
        lastUpdated: Date.now(),
        users: connectedUsers
      };

      await fetch(`${API_BASE}/${binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': API_KEY
        },
        body: JSON.stringify(roomData)
      });
    } catch (error) {
      console.error('Erreur sync cloud:', error);
    }
  };

  // Mettre à jour le nombre d'utilisateurs
  const updateUserCount = async (targetBinId: string, userCount: number) => {
    try {
      const response = await fetch(`${API_BASE}/${targetBinId}/latest`, {
        headers: { 'X-Master-Key': API_KEY }
      });
      
      if (response.ok) {
        const result = await response.json();
        const roomData = result.record;
        roomData.users = userCount;
        
        await fetch(`${API_BASE}/${targetBinId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': API_KEY
          },
          body: JSON.stringify(roomData)
        });
      }
    } catch (error) {
      console.error('Erreur update users:', error);
    }
  };

  // Polling pour récupérer les changements
  const startPolling = (targetBinId: string) => {
    const interval = setInterval(async () => {
      if (!isConnected) {
        clearInterval(interval);
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE}/${targetBinId}/latest`, {
          headers: { 'X-Master-Key': API_KEY }
        });
        
        if (response.ok) {
          const result = await response.json();
          const roomData: RoomData = result.record;
          
          // Vérifier si les données ont changé
          if (roomData.lastUpdated > Date.now() - 5000) { // Changement récent
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
    }, 3000); // Vérifier toutes les 3 secondes

    // Nettoyer l'interval quand le composant se démonte
    return () => clearInterval(interval);
  };

  // Quitter la salle
  const leaveRoom = async () => {
    if (binId && connectedUsers > 1) {
      await updateUserCount(binId, connectedUsers - 1);
    }
    
    setRoomId('');
    setBinId('');
    setIsConnected(false);
    setConnectedUsers(0);
    localStorage.removeItem('current-room');
  };

  // Synchroniser automatiquement quand cashBox change
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