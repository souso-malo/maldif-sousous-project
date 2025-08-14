'use client';

import { useState } from 'react';
import { Plus, Minus, Edit3 } from 'lucide-react';

interface MoneyManagerProps {
  balance: number;
  onAddMoney: (amount: number, description: string) => void;
  onWithdrawMoney: (amount: number, description: string) => void;
}

export default function MoneyManager({ balance, onAddMoney, onWithdrawMoney }: MoneyManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'withdraw'>('add');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const openModal = (type: 'add' | 'withdraw') => {
    setModalType(type);
    setIsModalOpen(true);
    setAmount('');
    setDescription('');
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setAmount('');
    setDescription('');
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



    try {
      if (modalType === 'add') {
        onAddMoney(numAmount, 'Dépôt');
      } else {
        onWithdrawMoney(numAmount, 'Retrait');
      }
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  return (
    <>
      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Edit3 className="mr-2 h-5 w-5" />
          Gestion de l'Argent
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => openModal('add')}
            className="btn-success flex items-center justify-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter de l'argent
          </button>
          
          <button
            onClick={() => openModal('withdraw')}
            className="btn-danger flex items-center justify-center"
            disabled={balance <= 0}
          >
            <Minus className="mr-2 h-4 w-4" />
            Retirer de l'argent
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {modalType === 'add' ? 'Ajouter de l\'argent' : 'Retirer de l\'argent'}
            </h3>
            
            <form onSubmit={handleSubmit}>
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
              

              
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className={modalType === 'add' ? 'btn-success flex-1' : 'btn-danger flex-1'}
                >
                  {modalType === 'add' ? 'Ajouter' : 'Retirer'}
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