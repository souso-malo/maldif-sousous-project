import { CashBox, Transaction, Order } from '@/types';

// Données de démonstration pour tester l'application
export const demoData: CashBox = {
  balance: 1250.75,
  transactions: [
    {
      id: '1',
      type: 'deposit',
      amount: 1500.00,
      description: 'Dépôt initial - Capital de départ',
      date: new Date('2024-01-15T09:00:00')
    },
    {
      id: '2',
      type: 'order',
      amount: 150.00,
      description: 'Commande: Réparation ordinateur (Client: Marie Dupont)',
      date: new Date('2024-01-15T10:30:00'),
      orderId: 'order-1'
    },
    {
      id: '3',
      type: 'order',
      amount: 75.50,
      description: 'Commande: Installation logiciel (Client: Jean Martin)',
      date: new Date('2024-01-15T14:15:00'),
      orderId: 'order-2'
    },
    {
      id: '4',
      type: 'withdrawal',
      amount: 50.00,
      description: 'Frais bancaires mensuels',
      date: new Date('2024-01-16T08:00:00')
    },
    {
      id: '5',
      type: 'deposit',
      amount: 200.00,
      description: 'Paiement client - Facture #001',
      date: new Date('2024-01-16T11:20:00')
    },
    {
      id: '6',
      type: 'order',
      amount: 300.00,
      description: 'Commande: Site web vitrine (Client: Boulangerie Moderne)',
      date: new Date('2024-01-17T09:45:00'),
      orderId: 'order-3'
    },
    {
      id: '7',
      type: 'withdrawal',
      amount: 25.75,
      description: 'Achat fournitures bureau',
      date: new Date('2024-01-17T16:30:00')
    }
  ],
  orders: [
    {
      id: 'order-1',
      clientName: 'Marie Dupont',
      description: 'Réparation ordinateur portable - Remplacement disque dur',
      amount: 150.00,
      status: 'completed',
      date: new Date('2024-01-15T10:30:00')
    },
    {
      id: 'order-2',
      clientName: 'Jean Martin',
      description: 'Installation et configuration logiciel comptabilité',
      amount: 75.50,
      status: 'completed',
      date: new Date('2024-01-15T14:15:00')
    },
    {
      id: 'order-3',
      clientName: 'Boulangerie Moderne',
      description: 'Création site web vitrine avec galerie photos',
      amount: 300.00,
      status: 'pending',
      date: new Date('2024-01-17T09:45:00')
    },
    {
      id: 'order-4',
      clientName: 'Sophie Leroy',
      description: 'Formation bureautique - 3 sessions',
      amount: 180.00,
      status: 'pending',
      date: new Date('2024-01-18T14:00:00')
    }
  ]
};

// Fonction pour charger les données de démonstration
export const loadDemoData = () => {
  const STORAGE_KEY = 'cashbox-data';
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demoData));
  window.location.reload(); // Recharger la page pour appliquer les données
};

// Fonction pour réinitialiser les données
export const resetData = () => {
  const STORAGE_KEY = 'cashbox-data';
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
};