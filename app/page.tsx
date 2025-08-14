'use client';

import { useState } from 'react';
import { Lock, Settings, BarChart3, Database, RotateCcw } from 'lucide-react';
import { useCashBox } from '@/hooks/useCashBox';
import CashBoxSummary from '@/components/CashBoxSummary';
import MoneyManager from '@/components/MoneyManager';
import OrderManager from '@/components/OrderManager';
import TransactionHistory from '@/components/TransactionHistory';
import ShareManager from '@/components/ShareManager';
import { loadDemoData, resetData } from '@/utils/demoData';

type ActiveTab = 'dashboard' | 'money' | 'orders' | 'history';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const {
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
    roomId,
    isConnected,
    connectedUsers,
    createRoom,
    joinRoom,
    leaveRoom
  } = useCashBox();

  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Tableau de bord', icon: BarChart3 },
    { id: 'money' as ActiveTab, label: 'Gestion Argent', icon: Lock },
    { id: 'orders' as ActiveTab, label: 'Commandes', icon: Settings },
    { id: 'history' as ActiveTab, label: 'Historique', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Lock className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">
                Gestionnaire de Coffre-Fort
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Solde: <span className="font-bold text-green-600">{cashBox.balance.toFixed(2)} DA</span>
              </div>
              <div className="flex gap-2 items-center">
                <ShareManager
                  roomId={roomId}
                  isConnected={isConnected}
                  connectedUsers={connectedUsers}
                  onCreateRoom={createRoom}
                  onJoinRoom={joinRoom}
                  onLeaveRoom={leaveRoom}
                />
                <button
                  onClick={loadDemoData}
                  className="flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  title="Charger des données de démonstration"
                >
                  <Database className="h-3 w-3 mr-1" />
                  Démo
                </button>
                <button
                  onClick={resetData}
                  className="flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  title="Réinitialiser toutes les données"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <CashBoxSummary 
              cashBox={cashBox} 
              onUpdateBalance={updateBalance}
              onDeleteBalance={deleteBalance}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <MoneyManager
                balance={cashBox.balance}
                onAddMoney={addMoney}
                onWithdrawMoney={withdrawMoney}
              />
              
              <div className="card">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Commandes Récentes
                </h2>
                {cashBox.orders.slice(0, 3).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Aucune commande récente
                  </p>
                ) : (
                  <div className="space-y-3">
                    {cashBox.orders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{order.clientName}</p>
                          <p className="text-sm text-gray-600">{order.description}</p>
                        </div>
                        <span className="font-bold text-purple-600">
                          {order.amount.toFixed(2)} DA
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'money' && (
          <MoneyManager
            balance={cashBox.balance}
            onAddMoney={addMoney}
            onWithdrawMoney={withdrawMoney}
          />
        )}

        {activeTab === 'orders' && (
          <OrderManager
            orders={cashBox.orders}
            balance={cashBox.balance}
            onAddOrder={addOrder}
            onUpdateOrder={updateOrder}
            onDeleteOrder={deleteOrder}
            onClearAllOrders={clearAllOrders}
          />
        )}

        {activeTab === 'history' && (
          <TransactionHistory
            transactions={cashBox.transactions}
            onDeleteTransaction={deleteTransaction}
            onClearAllHistory={clearAllHistory}
          />
        )}
      </main>
    </div>
  );
}