import { useState, useEffect } from 'react';
import { CashBox } from '@/types';

// Solution cloud RÉELLE avec Firestore REST API (gratuit et mondial)
const FIREBASE_PROJECT_ID = 'coffre-fort-sharing';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

interface RoomData {
  roomId: string;
  cashBox: CashBox;
  lastUpdated: number;
  users: number;
  createdAt: number;
}

export const useRealCloudSync = (cashBox: CashBox, setCashBox: (cashBox: CashBox) => void) => {
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

  // Créer une nouvelle salle dans Firestore
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

      // Convertir les données pour Firestore
      const firestoreData = {
        fields: {
          roomId: { stringValue: roomData.roomId },
          cashBox: { stringValue: JSON.stringify(roomData.cashBox) },
          lastUpdated: { integerValue: roomData.lastUpdated.toString() },
          users: { integerValue: roomData.users.toString() },
          createdAt: { integerValue: roomData.createdAt.toString() }
        }
      };

      const response = await fetch(`${FIRESTORE_URL}/rooms/${newRoomId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(firestoreData)
      });

      if (response.ok) {
        setRoomId(newRoomId);
        setIsConnected(true);
        setConnectedUsers(1);
        
        localStorage.setItem('current-room', newRoomId);
        
        // Démarrer la synchronisation
        startPolling(newRoomId);
        
        console.log(`✅ Salle créée dans le cloud: ${newRoomId}`);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur création salle:', error);
      
      // Fallback vers solution locale si cloud échoue
      await createRoomLocal(newRoomId);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback local si cloud échoue
  const createRoomLocal = async (newRoomId: string) => {
    try {
      const roomData: RoomData = {
        roomId: newRoomId,
        cashBox,
        lastUpdated: Date.now(),
        users: 1,
        createdAt: Date.now()
      };

      // Utiliser une API publique simple comme fallback
      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: `Coffre-fort room ${newRoomId}`,
          public: true,
          files: {
            [`room-${newRoomId}.json`]: {
              content: JSON.stringify(roomData)
            }
          }
        })
      });

      if (response.ok) {
        const gist = await response.json();
        localStorage.setItem(`gist-${newRoomId}`, gist.id);
        
        setRoomId(newRoomId);
        setIsConnected(true);
        setConnectedUsers(1);
        
        localStorage.setItem('current-room', newRoomId);
        startPollingGist(newRoomId, gist.id);
        
        console.log(`✅ Salle créée via GitHub Gist: ${newRoomId}`);
      } else {
        throw new Error('Gist creation failed');
      }
    } catch (error) {
      console.error('Erreur fallback:', error);
      alert('Impossible de créer la salle. Vérifiez votre connexion Internet.');
    }
  };

  // Rejoindre une salle existante
  const joinRoom = async (targetRoomId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Essayer Firestore d'abord
      const response = await fetch(`${FIRESTORE_URL}/rooms/${targetRoomId}`);
      
      if (response.ok) {
        const doc = await response.json();
        
        if (doc.fields) {
          const roomData: RoomData = {
            roomId: doc.fields.roomId.stringValue,
            cashBox: JSON.parse(doc.fields.cashBox.stringValue),
            lastUpdated: parseInt(doc.fields.lastUpdated.integerValue),
            users: parseInt(doc.fields.users.integerValue),
            createdAt: parseInt(doc.fields.createdAt.integerValue)
          };
          
          return await loadRoomData(targetRoomId, roomData);
        }
      }
      
      // Fallback vers GitHub Gist
      const gistId = localStorage.getItem(`gist-${targetRoomId}`);
      if (gistId) {
        return await joinRoomGist(targetRoomId, gistId);
      }
      
      // Essayer de chercher dans les gists publics
      return await searchPublicGists(targetRoomId);
      
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
      
      setRoomId(targetRoomId);
      setIsConnected(true);
      setConnectedUsers(roomData.users + 1);
      
      localStorage.setItem('current-room', targetRoomId);
      
      // Mettre à jour le nombre d'utilisateurs
      await updateUserCount(targetRoomId, roomData.users + 1);
      
      // Démarrer la synchronisation
      startPolling(targetRoomId);
      
      console.log(`✅ Rejoint la salle: ${targetRoomId}`);
      return true;
    } catch (error) {
      console.error('Erreur load room data:', error);
      return false;
    }
  };

  // Rejoindre via GitHub Gist
  const joinRoomGist = async (targetRoomId: string, gistId: string): Promise<boolean> => {
    try {
      const response = await fetch(`https://api.github.com/gists/${gistId}`);
      
      if (response.ok) {
        const gist = await response.json();
        const fileName = `room-${targetRoomId}.json`;
        
        if (gist.files[fileName]) {
          const roomData: RoomData = JSON.parse(gist.files[fileName].content);
          return await loadRoomData(targetRoomId, roomData);
        }
      }
      
      return false;
    } catch (error) {
      console.error('Erreur join gist:', error);
      return false;
    }
  };

  // Chercher dans les gists publics
  const searchPublicGists = async (targetRoomId: string): Promise<boolean> => {
    try {
      const response = await fetch(`https://api.github.com/gists/public?per_page=100`);
      
      if (response.ok) {
        const gists = await response.json();
        
        for (const gist of gists) {
          if (gist.description && gist.description.includes(`room ${targetRoomId}`)) {
            localStorage.setItem(`gist-${targetRoomId}`, gist.id);
            return await joinRoomGist(targetRoomId, gist.id);
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Erreur search gists:', error);
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

      // Essayer Firestore
      const firestoreData = {
        fields: {
          roomId: { stringValue: roomData.roomId },
          cashBox: { stringValue: JSON.stringify(roomData.cashBox) },
          lastUpdated: { integerValue: roomData.lastUpdated.toString() },
          users: { integerValue: roomData.users.toString() },
          createdAt: { integerValue: roomData.createdAt.toString() }
        }
      };

      const response = await fetch(`${FIRESTORE_URL}/rooms/${roomId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(firestoreData)
      });

      if (!response.ok) {
        // Fallback vers Gist
        await syncToGist(roomData);
      }
    } catch (error) {
      console.error('Erreur sync cloud:', error);
      // Essayer le fallback
      await syncToGist({
        roomId,
        cashBox: newCashBox,
        lastUpdated: Date.now(),
        users: connectedUsers,
        createdAt: Date.now()
      });
    }
  };

  // Synchroniser vers GitHub Gist
  const syncToGist = async (roomData: RoomData) => {
    try {
      const gistId = localStorage.getItem(`gist-${roomId}`);
      if (!gistId) return;

      await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            [`room-${roomId}.json`]: {
              content: JSON.stringify(roomData)
            }
          }
        })
      });
    } catch (error) {
      console.error('Erreur sync gist:', error);
    }
  };

  // Mettre à jour le nombre d'utilisateurs
  const updateUserCount = async (targetRoomId: string, userCount: number) => {
    try {
      const firestoreData = {
        fields: {
          users: { integerValue: userCount.toString() },
          lastUpdated: { integerValue: Date.now().toString() }
        }
      };

      await fetch(`${FIRESTORE_URL}/rooms/${targetRoomId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(firestoreData)
      });
    } catch (error) {
      console.error('Erreur update users:', error);
    }
  };

  // Polling Firestore
  const startPolling = (targetRoomId: string) => {
    const interval = setInterval(async () => {
      if (!isConnected) {
        clearInterval(interval);
        return;
      }
      
      try {
        const response = await fetch(`${FIRESTORE_URL}/rooms/${targetRoomId}`);
        
        if (response.ok) {
          const doc = await response.json();
          
          if (doc.fields) {
            const lastUpdated = parseInt(doc.fields.lastUpdated.integerValue);
            
            if (lastUpdated > Date.now() - 10000) { // Changement récent
              const roomData: RoomData = {
                roomId: doc.fields.roomId.stringValue,
                cashBox: JSON.parse(doc.fields.cashBox.stringValue),
                lastUpdated,
                users: parseInt(doc.fields.users.integerValue),
                createdAt: parseInt(doc.fields.createdAt.integerValue)
              };
              
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
        } else {
          // Fallback vers Gist
          await pollGist(targetRoomId);
        }
      } catch (error) {
        console.error('Erreur polling:', error);
        await pollGist(targetRoomId);
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  // Polling GitHub Gist
  const startPollingGist = (targetRoomId: string, gistId: string) => {
    const interval = setInterval(() => pollGist(targetRoomId), 5000);
    return () => clearInterval(interval);
  };

  const pollGist = async (targetRoomId: string) => {
    try {
      const gistId = localStorage.getItem(`gist-${targetRoomId}`);
      if (!gistId) return;

      const response = await fetch(`https://api.github.com/gists/${gistId}`);
      
      if (response.ok) {
        const gist = await response.json();
        const fileName = `room-${targetRoomId}.json`;
        
        if (gist.files[fileName]) {
          const roomData: RoomData = JSON.parse(gist.files[fileName].content);
          
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
          }
        }
      }
    } catch (error) {
      console.error('Erreur poll gist:', error);
    }
  };

  // Quitter la salle
  const leaveRoom = async () => {
    if (roomId && connectedUsers > 1) {
      await updateUserCount(roomId, connectedUsers - 1);
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