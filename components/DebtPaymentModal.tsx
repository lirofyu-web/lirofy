// components/DebtPaymentModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Customer } from '../types';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { safeParseFloat } from '../utils';

interface DebtPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (details: { amountPaidDinheiro: number; amountPaidPix: number } | { amountToAdd: number }) => void;
  onForgiveDebt: (customer: Customer) => void;
  customer: Customer;
}

const DebtPaymentModal: React.FC<DebtPaymentModalProps> = ({ isOpen, onClose, onConfirm, onForgiveDebt, customer }) => {
  const [paymentValues, setPaymentValues] = useState({ dinheiro: '', pix: '' });
  const [amountToAdd, setAmountToAdd] = useState('');
  const [error, setError] = useState('');
  
  const isAddingDebt = customer.debtAmount <= 0;
  const hasDebt = customer.debtAmount > 0;

  useEffect(() => {
    if (isOpen) {
      setPaymentValues({ dinheiro: '', pix: '' });
      setAmountToAdd('');
      setError('');
    }
  }, [isOpen, customer]);

  const totalPaid = safeParseFloat(paymentValues.dinheiro) + safeParseFloat(paymentValues.pix);

  useEffect(() => {
    if (!isOpen || isAddingDebt) return;
    
    if (totalPaid <= 0) {
        setError('O valor total pago deve ser maior que zero.');
    } else if (totalPaid > customer.debtAmount) {
        const excess = totalPaid - customer.debtAmount;
        setError(`Valor pago excede a dívida em R$ ${excess.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
    } else {
        setError('');
    }
  }, [totalPaid, customer.debtAmount, isOpen, isAddingDebt]);

  const handleConfirm = useCallback(() => {
    if (error) return;

    if (isAddingDebt) {
        const amountNum = safeParseFloat(amountToAdd);
        if (amountNum <= 0) {
            setError('O valor a adicionar deve ser maior que zero.');
            return;
        }
        onConfirm({ amountToAdd: amountNum });
    } else {
        onConfirm({ 
            amountPaidDinheiro: safeParseFloat(paymentValues.dinheiro), 
            amountPaidPix: safeParseFloat(paymentValues.pix) 
        });
    }
  }, [error, isAddingDebt, amountToAdd, paymentValues, onConfirm]);
  
  const handlePaymentChange = (field: keyof typeof paymentValues, value: string) => {
    setPaymentValues(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="debt-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <div className="p-6 border-b border-slate-700">
          <h2 id="debt-modal-title" className="text-2xl font-bold text-white">{isAddingDebt ? 'Adicionar Dívida Avulsa' : 'Pagar Dívida'}</h2>
          <p className="text-slate-400 break-words">Cliente: {customer.name}</p>
        </div>
        <div className="p-6 space-y-6">
            <div className="text-center">
                <p className="text-slate-400">Dívida Atual</p>
                <p className={`text-3xl font-mono font-bold ${hasDebt ? 'text-red-400' : 'text-slate-400'}`}>R$ {customer.debtAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            {isAddingDebt ? (
                <div>
                    <label htmlFor="amountToAdd" className="block text-sm font-medium text-slate-300 mb-1">Valor a Adicionar (R$)</label>
                    <input type="text" inputMode="decimal" id="amountToAdd" value={amountToAdd} onChange={(e) => setAmountToAdd(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white text-lg text-center font-mono focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Valor em Dinheiro (R$)</label>
                            <input type="text" inputMode="decimal" value={paymentValues.dinheiro} onChange={(e) => handlePaymentChange('dinheiro', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Valor em PIX (R$)</label>
                            <input type="text" inputMode="decimal" value={paymentValues.pix} onChange={(e) => handlePaymentChange('pix', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                        </div>
                    </div>
                     <div className="text-center pt-2">
                        <p className="text-slate-400">Total Pago</p>
                        <p className="text-xl font-mono font-bold text-lime-400">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                </div>
            )}
             {error && <p className="text-red-400 text-xs mt-1 text-center">{error}</p>}
        </div>
        <div className="p-6 bg-slate-800/50 rounded-b-lg flex justify-between items-center gap-4">
          {hasDebt ? (
            <button 
              onClick={() => onForgiveDebt(customer)}
              className="bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-500 transition-colors text-sm"
            >
              Perdoar Dívida
            </button>
          ) : <div />}
          <div className="flex gap-4">
            <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500 transition-colors">Cancelar</button>
            <button 
              onClick={handleConfirm} 
              disabled={!!error || (isAddingDebt ? !amountToAdd : totalPaid <= 0)}
              className="bg-amber-600 text-white font-bold py-2 px-6 rounded-md hover:bg-amber-500 transition-colors inline-flex items-center gap-2 disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
              <CurrencyDollarIcon className="w-5 h-5" />
              {isAddingDebt ? 'Adicionar Dívida' : 'Confirmar Pagamento'}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default DebtPaymentModal;