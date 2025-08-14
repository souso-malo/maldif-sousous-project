'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ShoppingCart, Edit, Trash2 } from 'lucide-react';
import { CashBox } from '@/types';

interface CashBoxSummaryProps {
  cashBox: CashBox;
  onUpdateBalance: (newBalance: number) => void;
  onDeleteBalance: () => void;
}

export default function CashBoxSummary({ cashBox, onUpdateBalance, onDeleteBalance }: CashBoxSummaryProps) {
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState(cashBox.balance.toString());

  const handleUpdateBalance = () => {
    const numBalance = parseFloat(newBalance);
    if (!isNaN(numBalance) && numBalance >= 0) {
      onUpdateBalance(numBalance);
      setIsEditingBalance(false);
    }
  };

  const handleDeleteBalance = () => {
    if (confirm('Êtes-vous sûr de vouloir remettre le solde à zéro ?')) {
      onDeleteBalance();
    }
  };
  const totalDeposits = cashBox.transactions
    .filter(t => t.type === 'deposit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = cashBox.transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOrders = cashBox.transactions
    .filter(t => t.type === 'order')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingOrders = cashBox.orders.filter(o => o.status === 'pending').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-green-100 text-sm font-medium">Solde Actuel</p>
            {isEditingBalance ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="text-black px-2 py-1 rounded text-lg font-bold w-32"
                  step="0.01"
                />
                <button
                  onClick={handleUpdateBalance}
                  className="bg-white text-green-600 px-2 py-1 rounded text-sm font-medium hover:bg-green-50"
                >
                  ✓
                </button>
                <button
                  onClick={() => setIsEditingBalance(false)}
                  className="bg-white text-red-600 px-2 py-1 rounded text-sm font-medium hover:bg-red-50"
                >
                  ✗
                </button>
              </div>
            ) : (
              <p className="text-2xl font-bold">{cashBox.balance.toFixed(2)} DA</p>
            )}
          </div>
          <div className="flex flex-col items-center gap-2">
            <DollarSign className="h-8 w-8 text-green-200" />
            {!isEditingBalance && (
              <div className="flex gap-1">
                <button
                  onClick={() => setIsEditingBalance(true)}
                  className="p-1 bg-green-400 hover:bg-green-300 rounded"
                  title="Modifier le solde"
                >
                  <Edit className="h-3 w-3" />
                </button>
                <button
                  onClick={handleDeleteBalance}
                  className="p-1 bg-red-500 hover:bg-red-400 rounded"
                  title="Remettre à zéro"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Dépôts</p>
            <p className="text-2xl font-bold">{totalDeposits.toFixed(2)} DA</p>
          </div>
          <TrendingUp className="h-8 w-8 text-blue-200" />
        </div>
      </div>

      <div className="card bg-gradient-to-r from-red-500 to-red-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-100 text-sm font-medium">Total Retraits</p>
            <p className="text-2xl font-bold">{totalWithdrawals.toFixed(2)} DA</p>
          </div>
          <TrendingDown className="h-8 w-8 text-red-200" />
        </div>
      </div>

      <div className="card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm font-medium">Commandes</p>
            <p className="text-2xl font-bold">{pendingOrders}</p>
            <p className="text-xs text-purple-200">{totalOrders.toFixed(2)} DA total</p>
          </div>
          <ShoppingCart className="h-8 w-8 text-purple-200" />
        </div>
      </div>
    </div>
  );
}