'use client';

import { useState } from 'react';
import { ShoppingCart, Plus, Edit, Trash2, User, Calendar, Euro } from 'lucide-react';
import { Order } from '@/types';
import { format } from 'date-fns';

interface OrderManagerProps {
  orders: Order[];
  balance: number;
  onAddOrder: (clientName: string, description: string, amount: number) => void;
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
  onDeleteOrder: (orderId: string) => void;
  onClearAllOrders: () => void;
}

export default function OrderManager({
  orders,
  balance,
  onAddOrder,
  onUpdateOrder,
  onDeleteOrder,
  onClearAllOrders
}: OrderManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const openModal = (order?: Order) => {
    if (order) {
      setEditingOrder(order);
      setClientName(order.clientName);
      setDescription(order.description);
      setAmount(order.amount.toString());
    } else {
      setEditingOrder(null);
      setClientName('');
      setDescription('');
      setAmount('');
    }
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
    setClientName('');
    setDescription('');
    setAmount('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Veuillez entrer un montant valide');
      return;
    }

    if (!clientName.trim()) {
      setError('Veuillez entrer le nom du client');
      return;
    }



    try {
      if (editingOrder) {
        onUpdateOrder(editingOrder.id, {
          clientName: clientName.trim(),
          description: 'Commande',
          amount: numAmount
        });
      } else {
        onAddOrder(clientName.trim(), 'Commande', numAmount);
      }
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Gestion des Commandes
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => openModal()}
              className="btn-primary flex items-center"
              disabled={balance <= 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle commande
            </button>
            {orders.length > 0 && (
              <button
                onClick={onClearAllOrders}
                className="btn-danger"
                title="Supprimer toutes les commandes"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {balance <= 0 && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            Solde insuffisant pour passer de nouvelles commandes
          </div>
        )}

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>Aucune commande enregistrée</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-800">{order.clientName}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-2">{order.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Euro className="h-4 w-4" />
                        <span className="font-medium">{order.amount.toFixed(2)} DA</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(order.date, 'dd/MM/yyyy HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => openModal(order)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteOrder(order.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editingOrder ? 'Modifier la commande' : 'Nouvelle commande'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du client
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="input-field"
                  placeholder="Nom du client"
                  required
                />
              </div>
              

              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (DA)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field"
                  placeholder="0.00"
                  required
                />
              </div>

              {editingOrder && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={editingOrder.status}
                    onChange={(e) => setEditingOrder({
                      ...editingOrder,
                      status: e.target.value as Order['status']
                    })}
                    className="input-field"
                  >
                    <option value="pending">En attente</option>
                    <option value="completed">Terminée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>
              )}
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  {editingOrder ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}