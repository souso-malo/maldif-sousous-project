'use client';

import { useState } from 'react';
import { History, Trash2, TrendingUp, TrendingDown, ShoppingCart, Calendar, Euro } from 'lucide-react';
import { Transaction } from '@/types';
import { format } from 'date-fns';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onDeleteTransaction: (transactionId: string) => void;
  onClearAllHistory: () => void;
}

export default function TransactionHistory({
  transactions,
  onDeleteTransaction,
  onClearAllHistory
}: TransactionHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'order'>('all');

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'withdrawal': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'order': return <ShoppingCart className="h-4 w-4 text-purple-600" />;
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return 'border-l-green-500 bg-green-50';
      case 'withdrawal': return 'border-l-red-500 bg-red-50';
      case 'order': return 'border-l-purple-500 bg-purple-50';
    }
  };

  const getTransactionText = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return 'Dépôt';
      case 'withdrawal': return 'Retrait';
      case 'order': return 'Commande';
    }
  };

  const getAmountDisplay = (transaction: Transaction) => {
    const sign = transaction.type === 'deposit' ? '+' : '-';
    const color = transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600';
    return (
      <span className={`font-medium ${color}`}>
        {sign}{transaction.amount.toFixed(2)} DA
      </span>
    );
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <History className="mr-2 h-5 w-5" />
          Historique des Transactions
        </h2>
        {transactions.length > 0 && (
          <button
            onClick={onClearAllHistory}
            className="btn-danger flex items-center"
            title="Supprimer tout l'historique"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Tout supprimer
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Toutes ({transactions.length})
        </button>
        <button
          onClick={() => setFilter('deposit')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filter === 'deposit'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Dépôts ({transactions.filter(t => t.type === 'deposit').length})
        </button>
        <button
          onClick={() => setFilter('withdrawal')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filter === 'withdrawal'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Retraits ({transactions.filter(t => t.type === 'withdrawal').length})
        </button>
        <button
          onClick={() => setFilter('order')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filter === 'order'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Commandes ({transactions.filter(t => t.type === 'order').length})
        </button>
      </div>

      {/* Liste des transactions */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>
              {filter === 'all' 
                ? 'Aucune transaction enregistrée' 
                : `Aucune transaction de type "${getTransactionText(filter as Transaction['type'])}" trouvée`
              }
            </p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className={`border-l-4 rounded-lg p-4 ${getTransactionColor(transaction.type)} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getTransactionIcon(transaction.type)}
                    <span className="font-medium text-gray-800">
                      {getTransactionText(transaction.type)}
                    </span>
                    {getAmountDisplay(transaction)}
                  </div>
                  
                  <p className="text-gray-600 mb-2">{transaction.description}</p>
                  
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{format(transaction.date, 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => onDeleteTransaction(transaction.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded ml-4"
                  title="Supprimer cette transaction"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}