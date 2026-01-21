// components/AddPhoneModal.tsx
import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { PhoneIcon } from './icons/PhoneIcon';

interface AddPhoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (phone: string) => void;
  customer: Customer;
}

const AddPhoneModal: React.FC<AddPhoneModalProps> = ({ isOpen, onClose, onConfirm, customer }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPhone('');
      setError('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      setError('Por favor, insira um número de telefone válido com DDD.');
      return;
    }
    onConfirm(phoneDigits);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-phone-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <div className="p-6 border-b border-slate-700">
          <h2 id="add-phone-modal-title" className="text-2xl font-bold text-white">Adicionar Telefone</h2>
          <p className="text-slate-400 break-words">Cliente: {customer.name}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="phone-input" className="block text-sm font-medium text-slate-300 mb-1">Número de Telefone (com DDD)</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="w-5 h-5 text-slate-400" />
                </div>
                <input
                    type="tel"
                    id="phone-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-10 pr-3 text-white text-lg font-mono focus:outline-none focus:ring-2 focus:ring-lime-500"
                    placeholder="(XX) 9XXXX-XXXX"
                />
            </div>
            {error && <p className="text-red-400 text-xs mt-1 text-center">{error}</p>}
          </div>
        </div>
        <div className="p-6 bg-slate-800/50 rounded-b-lg flex justify-end gap-4">
          <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500 transition-colors">Cancelar</button>
          <button
            onClick={handleConfirm}
            className="bg-lime-500 text-white font-bold py-2 px-6 rounded-md hover:bg-lime-600 transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AddPhoneModal;
