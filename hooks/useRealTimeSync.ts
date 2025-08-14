import { useState, useEffect } from 'react';
import { CashBox } from '@/types';

// Simuler un serveur simple avec localStorage partagé
const SYNC_KEY = 'cashbox-sync';
const ROOM_KEY = 'cashbox-room-id';

export const useRealTimeSync = (cashBox: CashBox, setCashBox: (cashBox: CashBox) => void) => {
  const [roomId, setRoomId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);

  // Générer un ID de salle unique
  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Créer une nouvelle salle
  const createRoom = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    localStorage.setItem(ROOM_KEY, newRoomId);
    
    // Sauvegarder les données initiales
    const syncData = {
      roomId: newRoomId,
      cashBox,
      lastUpdated: Date.now(),
      users: 1
    };
    
    localStorage.setItem(`${SYNC_KEY}-${newRoomId}`, JSON.stringify(syncData));
    setIsConnected(true);
    setConnectedUsers(1);
    
    // Démarrer l'écoute des changements
    startListening(newRoomId);
  };

  // Rejoindre une salle existante
  const joinRoom = (targetRoomId: string) => {
    const syncData = localStorage.getItem(`${SYNC_KEY}-${targetRoomId}`);
    
    if (syncData) {
      const data = JSON.parse(syncData);
      
      // Charger les données de la salle
      setCashBox({
        ...data.cashBox,
        transactions: data.cashBox.transactions.map((t: any) => ({
          ...t,
          date: new Date(t.date)
        })),
        orders: data.cashBox.orders.map((o: any) => ({
          ...o,
          date: new Date(o.date)
        }))
      });
      
      setRoomId(targetRoomId);
      localStorage.setItem(ROOM_KEY, targetRoomId);
      setIsConnected(true);
      
      // Incrémenter le nombre d'utilisateurs
      data.users = (data.users || 0) + 1;
      localStorage.setItem(`${SYNC_KEY}-${targetRoomId}`, JSON.stringify(data));
      setConnectedUsers(data.users);
      
      // Démarrer l'écoute des changements
      startListening(targetRoomId);
      
      return true;
    }
    
    return false;
  };

  // Synchroniser les données
  const syncData = (newCashBox: CashBox) => {
    if (!isConnected || !roomId) return;
    
    const syncData = {
      roomId,
      cashBox: newCashBox,
      lastUpdated: Date.now(),
      users: connectedUsers
    };
    
    localStorage.setItem(`${SYNC_KEY}-${roomId}`, JSON.stringify(syncData));
    
    // Déclencher un événement personnalisé pour notifier les autres onglets
    window.dispatchEvent(new CustomEvent('cashbox-sync', { 
      detail: { roomId, cashBox: newCashBox } 
    }));
  };

  // Écouter les changements
  const startListening = (targetRoomId: string) => {
    // Écouter les changements dans localStorage (autres onglets)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `${SYNC_KEY}-${targetRoomId}` && e.newValue) {
        const data = JSON.parse(e.newValue);
        
        setCashBox({
          ...data.cashBox,
          transactions: data.cashBox.transactions.map((t: any) => ({
            ...t,
            date: new Date(t.date)
          })),
          orders: data.cashBox.orders.map((o: any) => ({
            ...o,
            date: new Date(o.date)
          }))
        });
        
        setConnectedUsers(data.users || 1);
      }
    };

    // Écouter les événements personnalisés (même onglet)
    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail.roomId === targetRoomId) {
        setCashBox(e.detail.cashBox);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cashbox-sync', handleCustomEvent as EventListener);

    // Nettoyer les écouteurs
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cashbox-sync', handleCustomEvent as EventListener);
    };
  };

  // Quitter la salle
  const leaveRoom = () => {
    if (roomId) {
      const syncData = localStorage.getItem(`${SYNC_KEY}-${roomId}`);
      if (syncData) {
        const data = JSON.parse(syncData);
        data.users = Math.max(0, (data.users || 1) - 1);
        
        if (data.users === 0) {
          // Supprimer la salle si plus d'utilisateurs
          localStorage.removeItem(`${SYNC_KEY}-${roomId}`);
        } else {
          localStorage.setItem(`${SYNC_KEY}-${roomId}`, JSON.stringify(data));
        }
      }
    }
    
    setRoomId('');
    setIsConnected(false);
    setConnectedUsers(0);
    localStorage.removeItem(ROOM_KEY);
  };

  // Charger la salle sauvegardée au démarrage
  useEffect(() => {
    const savedRoomId = localStorage.getItem(ROOM_KEY);
    if (savedRoomId) {
      joinRoom(savedRoomId);
    }
  }, []);

  // Synchroniser automatiquement quand cashBox change
  useEffect(() => {
    if (isConnected) {
      syncData(cashBox);
    }
  }, [cashBox, isConnected]);

  return {
    roomId,
    isConnected,
    connectedUsers,
    createRoom,
    joinRoom,
    leaveRoom
  };
};