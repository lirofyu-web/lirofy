import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';

interface DebtPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, paymentMethod: 'pix' | 'dinheiro') => void;
  customer: Customer;
}

const DebtPaymentModal: React.FC<DebtPaymentModalProps> = ({ isOpen, onClose, onConfirm, customer }) => {
  const [amountStr, setAmountStr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro'>('dinheiro');

  useEffect(() => {
    if (isOpen) {
      setAmountStr(customer.debtAmount.toFixed(2).replace('.', ','));
      setPaymentMethod('dinheiro');
    }
  }, [isOpen, customer]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const amountNum = parseFloat(amountStr.replace(',', '.')) || 0;
    if (amountNum <= 0) {
      alert('O valor do pagamento deve ser maior que zero.');
      return;
    }
    if (amountNum > customer.debtAmount) {
      alert('O valor do pagamento não pode ser maior que a dívida total.');
      return;
    }
    onConfirm(amountNum, paymentMethod);
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const sanitizedValue = value.replace(/[^0-9,]/g, '').replace(/,(?=.*,)/g, '');
    setAmountStr(sanitizedValue);
  };

  const PaymentButton = ({ method, label }: { method: 'pix' | 'dinheiro', label: string }) => (
    <button
        onClick={() => setPaymentMethod(method)}
        className={`flex-1 p-3 rounded-md text-center transition-all text-sm font-bold ${paymentMethod === method ? 'bg-amber-600 text-white shadow' : 'bg-slate-700 hover:bg-slate-600'}`}
    >
        {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Pagar Dívida</h2>
          <p className="text-slate-400">Cliente: {customer.name}</p>
        </div>
        <div className="p-6 space-y-6">
            <div className="text-center">
                <p className="text-slate-400">Dívida Atual</p>
                <p className="text-3xl font-mono font-bold text-red-400">R$ {customer.debtAmount.toFixed(2)}</p>
            </div>
            <div>
              <label htmlFor="paymentAmount" className="block text-sm font-medium text-slate-300 mb-1">Valor a Pagar (R$)</label>
              <input 
                type="text" 
                id="paymentAmount" 
                value={amountStr} 
                onChange={handleAmountChange}
                inputMode="decimal"
                required 
                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white text-lg text-center font-mono focus:outline-none focus:ring-2 focus:ring-amber-500" 
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Método de Pagamento</label>
                <div className="flex gap-2">
                    <PaymentButton method="dinheiro" label="Dinheiro" />
                    <PaymentButton method="pix" label="PIX" />
                </div>
            </div>
        </div>
        <div className="p-6 bg-slate-800/50 rounded-b-lg flex justify-end gap-4">
          <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500 transition-colors">Cancelar</button>
          <button onClick={handleConfirm} className="bg-amber-600 text-white font-bold py-2 px-6 rounded-md hover:bg-amber-500 transition-colors inline-flex items-center gap-2">
            <CurrencyDollarIcon className="w-5 h-5" />
            Confirmar Pagamento
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

export default DebtPaymentModal;
