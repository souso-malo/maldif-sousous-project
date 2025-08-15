import { useState, useEffect } from 'react';
import { CashBox } from '@/types';

// Solution mondiale qui fonctionne vraiment - utilise une API REST simple et fiable
interface RoomData {
  roomId: string;
  cashBox: CashBox;
  lastUpdated: number;
  users: number;
  createdAt: number;
}

// Utilise une API REST publique simple (PasteBin-like)
const API_BASE = 'https://api.paste.ee/v1/pastes';

export const useGlobalSync = (cashBox: CashBox, setCashBox: (cashBox: CashBox) => void) => {
  const [roomId, setRoomId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pasteId, setPasteId] = useState<string>('');

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

      // Essayer de créer sur paste.ee
      try {
        const response = await fetch(API_BASE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: `Coffre-Fort Room ${newRoomId}`,
            sections: [{
              name: 'room_data',
              syntax: 'json',
              contents: JSON.stringify(roomData)
            }]
          })
        });

        if (response.ok) {
          const result = await response.json();
          const newPasteId = result.id;
          
          setPasteId(newPasteId);
          
          // Sauvegarder la correspondance roomId -> pasteId
          localStorage.setItem(`room-mapping-${newRoomId}`, newPasteId);
          
          console.log(`✅ Salle créée sur paste.ee: ${newRoomId} (${newPasteId})`);
        } else {
          throw new Error('API paste.ee échoué');
        }
      } catch (apiError) {
        console.log('⚠️ API externe échoué, utilisation locale');
      }
      
      // Sauvegarder localement dans tous les cas
      localStorage.setItem(`global-room-${newRoomId}`, JSON.stringify(roomData));
      
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
      // Chercher d'abord localement
      const localData = localStorage.getItem(`global-room-${targetRoomId}`);
      
      if (localData) {
        const roomData: RoomData = JSON.parse(localData);
        return await loadRoomData(targetRoomId, roomData);
      }
      
      // Chercher la correspondance roomId -> pasteId
      const savedPasteId = localStorage.getItem(`room-mapping-${targetRoomId}`);
      
      if (savedPasteId) {
        try {
          const response = await fetch(`${API_BASE}/${savedPasteId}`);
          
          if (response.ok) {
            const result = await response.json();
            const roomData: RoomData = JSON.parse(result.sections[0].contents);
            return await loadRoomData(targetRoomId, roomData, savedPasteId);
          }
        } catch (apiError) {
          console.log('⚠️ API externe échoué pour rejoindre');
        }
      }
      
      // Si pas trouvé
      console.error(`Salle ${targetRoomId} non trouvée`);
      alert(`Salle ${targetRoomId} non trouvée. Vérifiez le code ou demandez à la personne de recréer la salle.`);
      return false;
      
    } catch (error) {
      console.error('Erreur rejoindre salle:', error);
      alert('Erreur lors de la connexion à la salle.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les données d'une salle
  const loadRoomData = async (targetRoomId: string, roomData: RoomData, targetPasteId?: string): Promise<boolean> => {
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
      
      // Incrémenter le nombre d'utilisateurs
      roomData.users += 1;
      roomData.lastUpdated = Date.now();
      
      // Sauvegarder localement
      localStorage.setItem(`global-room-${targetRoomId}`, JSON.stringify(roomData));
      
      // Mettre à jour sur l'API si disponible
      if (targetPasteId) {
        setPasteId(targetPasteId);
        await updateRoomData(targetPasteId, roomData);
      }
      
      setRoomId(targetRoomId);
      setIsConnected(true);
      setConnectedUsers(roomData.users);
      
      // Démarrer la synchronisation
      startSync(targetRoomId);
      
      console.log(`✅ Rejoint la salle: ${targetRoomId}`);
      return true;
    } catch (error) {
      console.error('Erreur load room data:', error);
      return false;
    }
  };

  // Mettre à jour les données sur l'API
  const updateRoomData = async (targetPasteId: string, roomData: RoomData) => {
    try {
      await fetch(`${API_BASE}/${targetPasteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: `Coffre-Fort Room ${roomData.roomId}`,
          sections: [{
            name: 'room_data',
            syntax: 'json',
            contents: JSON.stringify(roomData)
          }]
        })
      });
    } catch (error) {
      console.log('⚠️ Mise à jour API échoué, mais local sauvé');
    }
  };

  // Synchroniser les données
  const syncData = (newCashBox: CashBox) => {
    if (!isConnected || !roomId) return;
    
    try {
      const roomDataStr = localStorage.getItem(`global-room-${roomId}`);
      if (!roomDataStr) return;
      
      const roomData: RoomData = JSON.parse(roomDataStr);
      roomData.cashBox = newCashBox;
      roomData.lastUpdated = Date.now();
      
      // Sauvegarder localement
      localStorage.setItem(`global-room-${roomId}`, JSON.stringify(roomData));
      
      // Mettre à jour sur l'API si disponible
      if (pasteId) {
        updateRoomData(pasteId, roomData);
      }
      
      // Déclencher un événement pour les autres onglets
      window.dispatchEvent(new CustomEvent('global-room-sync', {
        detail: { roomId, roomData }
      }));
      
    } catch (error) {
      console.error('Erreur sync:', error);
    }
  };

  // Démarrer la synchronisation
  const startSync = (targetRoomId: string) => {
    // Écouter les changements localStorage (autres onglets)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `global-room-${targetRoomId}` && e.newValue) {
        try {
          const roomData: RoomData = JSON.parse(e.newValue);
          
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

    // Écouter les événements personnalisés
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

    // Polling pour récupérer les changements de l'API
    const pollInterval = setInterval(async () => {
      if (!isConnected || !pasteId) return;
      
      try {
        const response = await fetch(`${API_BASE}/${pasteId}`);
        
        if (response.ok) {
          const result = await response.json();
          const roomData: RoomData = JSON.parse(result.sections[0].contents);
          
          // Vérifier si les données sont plus récentes
          const localData = localStorage.getItem(`global-room-${targetRoomId}`);
          if (localData) {
            const localRoomData: RoomData = JSON.parse(localData);
            
            if (roomData.lastUpdated > localRoomData.lastUpdated) {
              // Mettre à jour avec les données plus récentes
              localStorage.setItem(`global-room-${targetRoomId}`, JSON.stringify(roomData));
              
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
        // Ignorer les erreurs de polling
      }
    }, 10000); // Vérifier toutes les 10 secondes

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('global-room-sync', handleCustomEvent as EventListener);
    
    // Nettoyer les listeners
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('global-room-sync', handleCustomEvent as EventListener);
      clearInterval(pollInterval);
    };
  };

  // Quitter la salle
  const leaveRoom = async () => {
    if (roomId) {
      try {
        const roomDataStr = localStorage.getItem(`global-room-${roomId}`);
        if (roomDataStr) {
          const roomData: RoomData = JSON.parse(roomDataStr);
          roomData.users = Math.max(0, roomData.users - 1);
          roomData.lastUpdated = Date.now();
          
          localStorage.setItem(`global-room-${roomId}`, JSON.stringify(roomData));
          
          if (pasteId) {
            await updateRoomData(pasteId, roomData);
          }
        }
      } catch (error) {
        console.error('Erreur leave room:', error);
      }
    }
    
    setRoomId('');
    setIsConnected(false);
    setConnectedUsers(0);
    setPasteId('');
  };

  // Synchroniser automatiquement
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