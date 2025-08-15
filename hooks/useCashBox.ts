'use client';

import { useState, useEffect } from 'react';
import { CashBox, Transaction, Order } from '@/types';
import { useUniversalSync } from './useUniversalSync';
import { cleanOldRoomData } from '@/utils/cleanStorage';

const STORAGE_KEY = 'cashbox-data';

const initialState: CashBox = {
  balance: 0,
  transactions: [],
  orders: []
};

export const useCashBox = () => {
  const [cashBox, setCashBox] = useState<CashBox>(initialState);
  
  // Nettoyer les anciennes données de partage au démarrage
  useEffect(() => {
    cleanOldRoomData();
  }, []);
  
  // Intégrer solution universelle PC ↔ Téléphone ↔ Tablette
  const {
    roomId,
    isConnected,
    connectedUsers,
    isLoading,
    createRoom,
    joinRoom,
    leaveRoom
  } = useUniversalSync(cashBox, setCashBox);

  // Charger les données depuis localStorage au démarrage
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        // Convertir les dates string en objets Date
        const processedData = {
          ...parsed,
          transactions: parsed.transactions.map((t: any) => ({
            ...t,
            date: new Date(t.date)
          })),
          orders: parsed.orders.map((o: any) => ({
            ...o,
            date: new Date(o.date)
          }))
        };
        setCashBox(processedData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    }
  }, []);

  // Sauvegarder les données dans localStorage à chaque changement (seulement si pas connecté)
  useEffect(() => {
    if (!isConnected) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cashBox));
    }
  }, [cashBox, isConnected]);

  const addMoney = (amount: number, description: string) => {
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'deposit',
      amount,
      description,
      date: new Date()
    };

    setCashBox(prev => ({
      ...prev,
      balance: prev.balance + amount,
      transactions: [transaction, ...prev.transactions]
    }));
  };

  const withdrawMoney = (amount: number, description: string) => {
    if (amount > cashBox.balance) {
      throw new Error('Solde insuffisant');
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: 'withdrawal',
      amount,
      description,
      date: new Date()
    };

    setCashBox(prev => ({
      ...prev,
      balance: prev.balance - amount,
      transactions: [transaction, ...prev.transactions]
    }));
  };

  const addOrder = (clientName: string, description: string, amount: number) => {
    if (amount > cashBox.balance) {
      throw new Error('Solde insuffisant pour cette commande');
    }

    const order: Order = {
      id: Date.now().toString(),
      clientName,
      description,
      amount,
      status: 'pending',
      date: new Date()
    };

    const transaction: Transaction = {
      id: (Date.now() + 1).toString(),
      type: 'order',
      amount,
      description: `Commande: ${description} (Client: ${clientName})`,
      date: new Date(),
      orderId: order.id
    };

    setCashBox(prev => ({
      ...prev,
      balance: prev.balance - amount,
      orders: [order, ...prev.orders],
      transactions: [transaction, ...prev.transactions]
    }));
  };

  const updateOrder = (orderId: string, updates: Partial<Order>) => {
    setCashBox(prev => ({
      ...prev,
      orders: prev.orders.map(order =>
        order.id === orderId ? { ...order, ...updates } : order
      )
    }));
  };

  const deleteOrder = (orderId: string) => {
    const order = cashBox.orders.find(o => o.id === orderId);
    if (!order) return;

    // Rembourser le montant si la commande était en attente
    const refundAmount = order.status === 'pending' ? order.amount : 0;

    setCashBox(prev => ({
      ...prev,
      balance: prev.balance + refundAmount,
      orders: prev.orders.filter(o => o.id !== orderId),
      transactions: prev.transactions.filter(t => t.orderId !== orderId)
    }));

    // Ajouter une transaction de remboursement si nécessaire
    if (refundAmount > 0) {
      const refundTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'deposit',
        amount: refundAmount,
        description: `Remboursement commande annulée: ${order.description}`,
        date: new Date()
      };

      setCashBox(prev => ({
        ...prev,
        transactions: [refundTransaction, ...prev.transactions]
      }));
    }
  };

  const deleteTransaction = (transactionId: string) => {
    const transaction = cashBox.transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    // Ajuster le solde en fonction du type de transaction
    let balanceAdjustment = 0;
    if (transaction.type === 'deposit') {
      balanceAdjustment = -transaction.amount;
    } else if (transaction.type === 'withdrawal' || transaction.type === 'order') {
      balanceAdjustment = transaction.amount;
    }

    setCashBox(prev => ({
      ...prev,
      balance: prev.balance + balanceAdjustment,
      transactions: prev.transactions.filter(t => t.id !== transactionId)
    }));
  };

  const clearAllHistory = () => {
    setCashBox(prev => ({
      ...prev,
      transactions: []
    }));
  };

  const clearAllOrders = () => {
    // Calculer le remboursement total des commandes en attente
    const refundAmount = cashBox.orders
      .filter(order => order.status === 'pending')
      .reduce((total, order) => total + order.amount, 0);

    setCashBox(prev => ({
      ...prev,
      balance: prev.balance + refundAmount,
      orders: [],
      transactions: prev.transactions.filter(t => !t.orderId)
    }));

    // Ajouter une transaction de remboursement global si nécessaire
    if (refundAmount > 0) {
      const refundTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'deposit',
        amount: refundAmount,
        description: `Remboursement global - Suppression de toutes les commandes`,
        date: new Date()
      };

      setCashBox(prev => ({
        ...prev,
        transactions: [refundTransaction, ...prev.transactions]
      }));
    }
  };

  const updateBalance = (newBalance: number) => {
    setCashBox(prev => ({
      ...prev,
      balance: newBalance
    }));
  };

  const deleteBalance = () => {
    setCashBox(prev => ({
      ...prev,
      balance: 0
    }));
  };

  return {
    cashBox,
    addMoney,
    withdrawMoney,
    addOrder,
    updateOrder,
    deleteOrder,
    deleteTransaction,
    clearAllHistory,
    clearAllOrders,
    updateBalance,
    deleteBalance,
    // Fonctions de partage cloud
    roomId,
    isConnected,
    connectedUsers,
    isLoading,
    createRoom,
    joinRoom,
    leaveRoom
  };
};