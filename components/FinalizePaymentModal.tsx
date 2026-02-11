// components/FinalizePaymentModal.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Billing } from '../types';
import { safeParseFloat } from '../utils';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';

interface FinalizePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (updatedBilling: Billing) => void;
  billing: Billing;
}

const FinalizePaymentModal: React.FC<FinalizePaymentModalProps> = ({ isOpen, onClose, onConfirm, billing }) => {
  const [paymentValues, setPaymentValues] = useState({
    dinheiro: '',
    pix: '',
    bonus: '',
    negativo: ''
  });
  const [error, setError] = useState('');

  const valorTotalParaFirma = useMemo(() => billing.valorTotal - (billing.valorBonus || 0), [billing]);

  useEffect(() => {
    if (isOpen) {
      const initialBonus = billing.valorBonus || 0;
      const valorFinal = billing.valorTotal - initialBonus;
      setPaymentValues({
        dinheiro: String(valorFinal > 0 ? valorFinal : '0'),
        pix: '0',
        bonus: String(initialBonus > 0 ? initialBonus : ''),
        negativo: '0'
      });
      setError('');
    }
  }, [isOpen, billing]);

  const handlePaymentChange = useCallback((field: keyof typeof paymentValues, value: string) => {
    setPaymentValues(prev => ({ ...prev, [field]: value }));
  }, []);
  
  useEffect(() => {
    const vBonus = safeParseFloat(paymentValues.bonus);
    const totalDevido = billing.valorTotal - vBonus;
    
    const vDinheiro = safeParseFloat(paymentValues.dinheiro);
    const vPix = safeParseFloat(paymentValues.pix);
    const vNegativo = safeParseFloat(paymentValues.negativo);

    const totalDeclarado = vDinheiro + vPix + vNegativo;
    const difference = totalDeclarado - totalDevido;

    if (Math.abs(difference) > 0.01) { // Tolera 1 centavo
        setError(`A soma dos pagamentos (R$ ${totalDeclarado.toFixed(2)}) não corresponde ao total devido (R$ ${totalDevido.toFixed(2)}).`);
    } else {
        setError('');
    }
  }, [paymentValues, billing.valorTotal]);


  const handleConfirm = useCallback(() => {
    if (error) return;
    
    const valorPagoDinheiro = safeParseFloat(paymentValues.dinheiro);
    const valorPagoPix = safeParseFloat(paymentValues.pix);
    const valorDebitoNegativo = safeParseFloat(paymentValues.negativo);
    const valorBonus = safeParseFloat(paymentValues.bonus);

    const methodsUsed: ('dinheiro' | 'pix' | 'debito_negativo')[] = [];
    if (valorPagoDinheiro > 0) methodsUsed.push('dinheiro');
    if (valorPagoPix > 0) methodsUsed.push('pix');
    if (valorDebitoNegativo > 0) methodsUsed.push('debito_negativo');

    let paymentMethod: Billing['paymentMethod'] = 'dinheiro'; // Default
    if (methodsUsed.length > 1) {
        paymentMethod = 'misto';
    } else if (methodsUsed.length === 1) {
        paymentMethod = methodsUsed[0];
    }

    const updatedBilling: Billing = {
        ...billing,
        settledAt: new Date(), // Update the date to when it was finalized
        paymentMethod,
        valorPagoDinheiro: valorPagoDinheiro > 0 ? valorPagoDinheiro : undefined,
        valorPagoPix: valorPagoPix > 0 ? valorPagoPix : undefined,
        valorDebitoNegativo: valorDebitoNegativo > 0 ? valorDebitoNegativo : undefined,
        valorBonus: valorBonus > 0 ? valorBonus : undefined,
    };
    
    onConfirm(updatedBilling);
  }, [error, paymentValues, billing, onConfirm]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      role="dialog"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Finalizar Pagamento</h2>
          <p className="text-slate-400 break-words">Cliente: {billing.customerName}</p>
        </div>
        <div className="p-6 space-y-6">
            <div className="text-center">
                <p className="text-slate-400">Total a Pagar</p>
                <p className="text-3xl font-mono font-bold text-lime-400">R$ {valorTotalParaFirma.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Bônus / Desconto (R$)</label>
                  <input type="text" inputMode="decimal" value={paymentValues.bonus} onChange={(e) => handlePaymentChange('bonus', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Deixar Negativo (R$)</label>
                  <input type="text" inputMode="decimal" value={paymentValues.negativo} onChange={(e) => handlePaymentChange('negativo', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Valor em Dinheiro (R$)</label>
                  <input type="text" inputMode="decimal" value={paymentValues.dinheiro} onChange={(e) => handlePaymentChange('dinheiro', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Valor em PIX (R$)</label>
                  <input type="text" inputMode="decimal" value={paymentValues.pix} onChange={(e) => handlePaymentChange('pix', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                </div>
            </div>
            {error && <p className="text-red-400 text-xs mt-1 text-center">{error}</p>}
        </div>
        <div className="p-6 bg-slate-800/50 rounded-b-lg flex justify-end gap-4">
          <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500 transition-colors">Cancelar</button>
          <button onClick={handleConfirm} disabled={!!error} className="bg-lime-500 text-white font-bold py-2 px-6 rounded-md hover:bg-lime-600 transition-colors inline-flex items-center gap-2 disabled:bg-slate-500 disabled:cursor-not-allowed">
            <CurrencyDollarIcon className="w-5 h-5" />
            Finalizar Cobrança
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

export default FinalizePaymentModal;