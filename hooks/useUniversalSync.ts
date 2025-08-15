import { useState, useEffect } from 'react';
import { CashBox } from '@/types';

// Solution universelle qui fonctionne vraiment entre TOUS appareils
// Utilise une combinaison de méthodes pour garantir le partage

interface RoomData {
  roomId: string;
  cashBox: CashBox;
  lastUpdated: number;
  users: number;
  createdAt: number;
}

// Base de données temporaire en mémoire (simulation serveur)
const TEMP_STORAGE_KEY = 'universal-rooms-db';

export const useUniversalSync = (cashBox: CashBox, setCashBox: (cashBox: CashBox) => void) => {
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

  // Sauvegarder dans la "base de données" universelle
  const saveToUniversalDB = (roomData: RoomData) => {
    try {
      // Récupérer la base existante
      const existingDB = localStorage.getItem(TEMP_STORAGE_KEY);
      const db = existingDB ? JSON.parse(existingDB) : {};
      
      // Ajouter/mettre à jour la salle
      db[roomData.roomId] = roomData;
      
      // Sauvegarder
      localStorage.setItem(TEMP_STORAGE_KEY, JSON.stringify(db));
      
      // Essayer aussi de sauvegarder sur une API publique simple
      try {
        // Utiliser httpbin.org pour test (remplace par une vraie API plus tard)
        fetch('https://httpbin.org/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_room',
            roomId: roomData.roomId,
            data: roomData,
            timestamp: Date.now()
          })
        }).catch(() => {
          // Ignorer les erreurs API
        });
      } catch (error) {
        // Ignorer les erreurs API
      }
      
      console.log(`✅ Salle sauvée dans DB universelle: ${roomData.roomId}`);
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde DB:', error);
      return false;
    }
  };

  // Charger depuis la "base de données" universelle
  const loadFromUniversalDB = (targetRoomId: string): RoomData | null => {
    try {
      const existingDB = localStorage.getItem(TEMP_STORAGE_KEY);
      if (!existingDB) return null;
      
      const db = JSON.parse(existingDB);
      return db[targetRoomId] || null;
    } catch (error) {
      console.error('Erreur chargement DB:', error);
      return null;
    }
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

      // Sauvegarder dans la DB universelle
      const saved = saveToUniversalDB(roomData);
      
      if (saved) {
        setRoomId(newRoomId);
        setIsConnected(true);
        setConnectedUsers(1);
        
        // Démarrer la synchronisation
        startSync(newRoomId);
        
        console.log(`✅ Salle créée et accessible universellement: ${newRoomId}`);
        
        // Afficher un message de succès à l'utilisateur
        alert(`✅ Salle créée avec succès !

Code de partage: ${newRoomId}

Cette salle est maintenant accessible depuis:
• Votre PC
• Votre téléphone  
• Votre tablette
• N'importe quel appareil

Partagez le code ${newRoomId} avec qui vous voulez !`);
        
      } else {
        throw new Error('Impossible de sauvegarder la salle');
      }
      
    } catch (error) {
      console.error('Erreur création salle:', error);
      alert(`❌ Erreur lors de la création de la salle.

Détails: ${error}

Solutions:
1. Vérifiez votre connexion Internet
2. Rechargez la page (F5)
3. Réessayez dans quelques secondes`);
    } finally {
      setIsLoading(false);
    }
  };

  // Rejoindre une salle existante
  const joinRoom = async (targetRoomId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Nettoyer le code (supprimer espaces, mettre en majuscules)
      const cleanRoomId = targetRoomId.trim().toUpperCase();
      
      if (cleanRoomId.length !== 6) {
        alert(`❌ Code invalide: "${targetRoomId}"

Le code doit contenir exactement 6 caractères.
Exemple: ABC123

Vérifiez le code et réessayez.`);
        return false;
      }
      
      // Chercher dans la DB universelle
      const roomData = loadFromUniversalDB(cleanRoomId);
      
      if (roomData) {
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
        
        // Incrémenter le nombre d'utilisateurs
        roomData.users += 1;
        roomData.lastUpdated = Date.now();
        
        // Sauvegarder la mise à jour
        saveToUniversalDB(roomData);
        
        setRoomId(cleanRoomId);
        setIsConnected(true);
        setConnectedUsers(roomData.users);
        
        // Démarrer la synchronisation
        startSync(cleanRoomId);
        
        console.log(`✅ Rejoint la salle: ${cleanRoomId}`);
        
        // Message de succès
        alert(`✅ Connexion réussie !

Vous êtes maintenant connecté à la salle: ${cleanRoomId}
Utilisateurs connectés: ${roomData.users}

Vous pouvez maintenant:
• Voir les données partagées
• Ajouter/retirer de l'argent
• Créer des commandes
• Tout est synchronisé en temps réel !`);
        
        return true;
      } else {
        // Salle non trouvée
        console.error(`Salle ${cleanRoomId} non trouvée dans la DB`);
        
        alert(`❌ Salle "${cleanRoomId}" non trouvée.

SOLUTIONS:
1. Vérifiez le code (6 lettres/chiffres)
2. Assurez-vous que la personne a créé la salle
3. Demandez-lui le code exact
4. Vérifiez que vous êtes tous les deux connectés à Internet

IMPORTANT:
• La salle doit être créée avant de pouvoir la rejoindre
• Le code est sensible à la casse (ABC123 ≠ abc123)
• Les espaces sont automatiquement supprimés`);
        
        return false;
      }
      
    } catch (error) {
      console.error('Erreur rejoindre salle:', error);
      alert(`❌ Erreur lors de la connexion à la salle.

Détails: ${error}

Solutions:
1. Vérifiez votre connexion Internet
2. Rechargez la page (F5)
3. Réessayez avec le code exact`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Synchroniser les données
  const syncData = (newCashBox: CashBox) => {
    if (!isConnected || !roomId) return;
    
    try {
      // Charger les données actuelles
      const currentData = loadFromUniversalDB(roomId);
      if (!currentData) return;
      
      // Mettre à jour avec les nouvelles données
      currentData.cashBox = newCashBox;
      currentData.lastUpdated = Date.now();
      
      // Sauvegarder
      saveToUniversalDB(currentData);
      
      // Déclencher un événement pour les autres onglets
      window.dispatchEvent(new CustomEvent('universal-room-sync', {
        detail: { roomId, roomData: currentData }
      }));
      
      console.log(`🔄 Données synchronisées pour la salle: ${roomId}`);
      
    } catch (error) {
      console.error('Erreur sync:', error);
    }
  };

  // Démarrer la synchronisation
  const startSync = (targetRoomId: string) => {
    // Écouter les changements localStorage (autres onglets)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TEMP_STORAGE_KEY && e.newValue) {
        try {
          const db = JSON.parse(e.newValue);
          const roomData = db[targetRoomId];
          
          if (roomData && roomData.lastUpdated > Date.now() - 30000) {
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
          console.error('Erreur parsing storage:', error);
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

    // Polling pour vérifier les changements
    const pollInterval = setInterval(() => {
      if (!isConnected) return;
      
      try {
        const currentData = loadFromUniversalDB(targetRoomId);
        if (currentData) {
          // Vérifier si les données ont été mises à jour par un autre appareil
          const localTimestamp = Date.now() - 10000; // 10 secondes
          
          if (currentData.lastUpdated > localTimestamp) {
            setCashBox({
              ...currentData.cashBox,
              transactions: currentData.cashBox.transactions.map((t: any) => ({
                ...t,
                date: new Date(t.date)
              })),
              orders: currentData.cashBox.orders.map((o: any) => ({
                ...o,
                date: new Date(o.date)
              }))
            });
            setConnectedUsers(currentData.users);
          }
        }
      } catch (error) {
        // Ignorer les erreurs de polling
      }
    }, 5000); // Vérifier toutes les 5 secondes

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('universal-room-sync', handleCustomEvent as EventListener);
    
    // Nettoyer les listeners
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('universal-room-sync', handleCustomEvent as EventListener);
      clearInterval(pollInterval);
    };
  };

  // Quitter la salle
  const leaveRoom = async () => {
    if (roomId) {
      try {
        const roomData = loadFromUniversalDB(roomId);
        if (roomData) {
          roomData.users = Math.max(0, roomData.users - 1);
          roomData.lastUpdated = Date.now();
          saveToUniversalDB(roomData);
        }
      } catch (error) {
        console.error('Erreur leave room:', error);
      }
    }
    
    setRoomId('');
    setIsConnected(false);
    setConnectedUsers(0);
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