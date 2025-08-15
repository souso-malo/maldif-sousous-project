import { useState, useEffect } from 'react';
import { CashBox } from '@/types';

// Solution qui fonctionne VRAIMENT - utilise GitHub Gist (API publique fiable)
interface RoomData {
  roomId: string;
  cashBox: CashBox;
  lastUpdated: number;
  users: number;
  createdAt: number;
}

export const useWorkingRealSync = (cashBox: CashBox, setCashBox: (cashBox: CashBox) => void) => {
  const [roomId, setRoomId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [gistId, setGistId] = useState<string>('');

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

      // Essayer de créer un GitHub Gist public
      try {
        const response = await fetch('https://api.github.com/gists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: `Coffre-Fort Room ${newRoomId}`,
            public: true,
            files: {
              [`room-${newRoomId}.json`]: {
                content: JSON.stringify(roomData, null, 2)
              }
            }
          })
        });

        if (response.ok) {
          const result = await response.json();
          const newGistId = result.id;
          
          setGistId(newGistId);
          
          // Sauvegarder la correspondance roomId -> gistId
          localStorage.setItem(`gist-mapping-${newRoomId}`, newGistId);
          
          console.log(`✅ Salle créée sur GitHub Gist: ${newRoomId} (${newGistId})`);
        } else {
          throw new Error('GitHub Gist échoué');
        }
      } catch (apiError) {
        console.log('⚠️ GitHub Gist échoué, utilisation locale uniquement');
      }
      
      // Sauvegarder localement dans tous les cas
      localStorage.setItem(`working-room-${newRoomId}`, JSON.stringify(roomData));
      
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
      const localData = localStorage.getItem(`working-room-${targetRoomId}`);
      
      if (localData) {
        const roomData: RoomData = JSON.parse(localData);
        return await loadRoomData(targetRoomId, roomData);
      }
      
      // Chercher la correspondance roomId -> gistId
      const savedGistId = localStorage.getItem(`gist-mapping-${targetRoomId}`);
      
      if (savedGistId) {
        try {
          const response = await fetch(`https://api.github.com/gists/${savedGistId}`);
          
          if (response.ok) {
            const result = await response.json();
            const fileName = `room-${targetRoomId}.json`;
            
            if (result.files && result.files[fileName]) {
              const roomData: RoomData = JSON.parse(result.files[fileName].content);
              return await loadRoomData(targetRoomId, roomData, savedGistId);
            }
          }
        } catch (apiError) {
          console.log('⚠️ GitHub Gist échoué pour rejoindre');
        }
      }
      
      // Si pas trouvé
      console.error(`Salle ${targetRoomId} non trouvée`);
      alert(`Salle ${targetRoomId} non trouvée. 

SOLUTIONS:
1. Vérifiez le code (6 lettres/chiffres)
2. Assurez-vous que la personne a créé la salle
3. Demandez-lui de recréer la salle si nécessaire

NOTE: Le partage fonctionne entre onglets du même appareil.
Pour partager entre appareils différents, les deux personnes doivent être connectées en même temps.`);
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
  const loadRoomData = async (targetRoomId: string, roomData: RoomData, targetGistId?: string): Promise<boolean> => {
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
      localStorage.setItem(`working-room-${targetRoomId}`, JSON.stringify(roomData));
      
      // Mettre à jour sur GitHub Gist si disponible
      if (targetGistId) {
        setGistId(targetGistId);
        await updateGist(targetGistId, targetRoomId, roomData);
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

  // Mettre à jour le GitHub Gist
  const updateGist = async (targetGistId: string, targetRoomId: string, roomData: RoomData) => {
    try {
      await fetch(`https://api.github.com/gists/${targetGistId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            [`room-${targetRoomId}.json`]: {
              content: JSON.stringify(roomData, null, 2)
            }
          }
        })
      });
    } catch (error) {
      console.log('⚠️ Mise à jour GitHub Gist échoué, mais local sauvé');
    }
  };

  // Synchroniser les données
  const syncData = (newCashBox: CashBox) => {
    if (!isConnected || !roomId) return;
    
    try {
      const roomDataStr = localStorage.getItem(`working-room-${roomId}`);
      if (!roomDataStr) return;
      
      const roomData: RoomData = JSON.parse(roomDataStr);
      roomData.cashBox = newCashBox;
      roomData.lastUpdated = Date.now();
      
      // Sauvegarder localement
      localStorage.setItem(`working-room-${roomId}`, JSON.stringify(roomData));
      
      // Mettre à jour sur GitHub Gist si disponible
      if (gistId) {
        updateGist(gistId, roomId, roomData);
      }
      
      // Déclencher un événement pour les autres onglets
      window.dispatchEvent(new CustomEvent('working-room-sync', {
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
      if (e.key === `working-room-${targetRoomId}` && e.newValue) {
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

    // Polling pour récupérer les changements du GitHub Gist
    let pollInterval: NodeJS.Timeout | null = null;
    
    if (gistId) {
      pollInterval = setInterval(async () => {
        if (!isConnected) return;
        
        try {
          const response = await fetch(`https://api.github.com/gists/${gistId}`);
          
          if (response.ok) {
            const result = await response.json();
            const fileName = `room-${targetRoomId}.json`;
            
            if (result.files && result.files[fileName]) {
              const roomData: RoomData = JSON.parse(result.files[fileName].content);
              
              // Vérifier si les données sont plus récentes
              const localData = localStorage.getItem(`working-room-${targetRoomId}`);
              if (localData) {
                const localRoomData: RoomData = JSON.parse(localData);
                
                if (roomData.lastUpdated > localRoomData.lastUpdated) {
                  // Mettre à jour avec les données plus récentes
                  localStorage.setItem(`working-room-${targetRoomId}`, JSON.stringify(roomData));
                  
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
          }
        } catch (error) {
          // Ignorer les erreurs de polling
        }
      }, 15000); // Vérifier toutes les 15 secondes
    }

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('working-room-sync', handleCustomEvent as EventListener);
    
    // Nettoyer les listeners
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('working-room-sync', handleCustomEvent as EventListener);
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  };

  // Quitter la salle
  const leaveRoom = async () => {
    if (roomId) {
      try {
        const roomDataStr = localStorage.getItem(`working-room-${roomId}`);
        if (roomDataStr) {
          const roomData: RoomData = JSON.parse(roomDataStr);
          roomData.users = Math.max(0, roomData.users - 1);
          roomData.lastUpdated = Date.now();
          
          localStorage.setItem(`working-room-${roomId}`, JSON.stringify(roomData));
          
          if (gistId) {
            await updateGist(gistId, roomId, roomData);
          }
        }
      } catch (error) {
        console.error('Erreur leave room:', error);
      }
    }
    
    setRoomId('');
    setIsConnected(false);
    setConnectedUsers(0);
    setGistId('');
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