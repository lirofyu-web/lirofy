// components/EditBillingModal.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Billing, Customer, Equipment } from '../types';
import { safeParseFloat } from '../utils';
import { AlertIcon } from './icons/AlertIcon';

interface EditBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (billing: Billing) => void;
  billing: Billing;
  customers: Customer[];
  billings: Billing[]; // To check for next billing
}

// FIX: Destructure 'customers' and 'billings' props to resolve 'Cannot find name' error.
const EditBillingModal: React.FC<EditBillingModalProps> = ({ isOpen, onClose, onConfirm, billing, customers, billings }) => {
    const [paymentState, setPaymentState] = useState({
        recebimentoEspecie: '',
        recebimentoPix: '',
    });
    const [error, setError] = useState('');

    const customer = useMemo(() => customers.find(c => c.id === billing.customerId), [customers, billing.customerId]);
    const equipment = useMemo(() => customer?.equipment.find(e => e.id === billing.equipmentId), [customer, billing.equipmentId]);
    
    useEffect(() => {
      if (isOpen) {
        setPaymentState({
            recebimentoEspecie: String(billing.recebimentoEspecie || 0),
            recebimentoPix: String(billing.recebimentoPix || 0),
        });
        setError('');
      }
    }, [isOpen, billing]);

    const valorTotalFirma = billing.valorTotal;

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        let newEspecieStr = paymentState.recebimentoEspecie;
        let newPixStr = paymentState.recebimentoPix;
        
        if (name === 'recebimentoEspecie') {
            const newEspecie = Math.max(0, safeParseFloat(value));
            const newPix = Math.max(0, parseFloat((valorTotalFirma - newEspecie).toFixed(2)));
            newEspecieStr = value;
            newPixStr = String(newPix);
        } else if (name === 'recebimentoPix') {
            const newPix = Math.max(0, safeParseFloat(value));
            const newEspecie = Math.max(0, parseFloat((valorTotalFirma - newPix).toFixed(2)));
            newPixStr = value;
            newEspecieStr = String(newEspecie);
        }
        
        setPaymentState({
            recebimentoEspecie: newEspecieStr,
            recebimentoPix: newPixStr,
        });
    };

    const handleConfirm = useCallback(() => {
        const recebimentoEspecie = safeParseFloat(paymentState.recebimentoEspecie);
        const recebimentoPix = safeParseFloat(paymentState.recebimentoPix);
        
        if (Math.abs(recebimentoEspecie + recebimentoPix - valorTotalFirma) > 0.01) {
            setError("A soma dos pagamentos não corresponde ao total da firma.");
            return;
        }
        setError('');

        let paymentMethod: Billing['paymentMethod'] = 'dinheiro';
        if (recebimentoEspecie > 0 && recebimentoPix > 0) {
            paymentMethod = 'misto';
        } else if (recebimentoPix > 0) {
            paymentMethod = 'pix';
        }

        const updatedBilling: Billing = {
            ...billing,
            recebimentoEspecie,
            recebimentoPix,
            paymentMethod,
        };

        onConfirm(updatedBilling);
    }, [onConfirm, billing, paymentState, valorTotalFirma]);

    if (!isOpen || !equipment || billing.equipmentType !== 'grua') return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg border border-slate-700 animate-fade-in-up max-h-[90vh] flex flex-col">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">Editar Cobrança - Grua</h2>
            <p className="text-slate-400 break-words">{billing.customerName} - Grua {billing.equipmentNumero}</p>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto">
            
            <div className="p-4 bg-slate-900/50 rounded-lg grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <h3 className="col-span-2 font-bold text-lime-400 mb-2">Dados Originais (Não Editável)</h3>
                <div><p className="text-slate-400">Leitura Anterior:</p><p className="font-mono text-white text-lg">{billing.relogioAnterior}</p></div>
                <div><p className="text-slate-400">Leitura Atual:</p><p className="font-mono text-white text-lg">{billing.relogioAtual}</p></div>
                <div><p className="text-slate-400">Jogadas:</p><p className="font-mono text-white text-lg">{billing.partidasJogadas}</p></div>
                <div><p className="text-slate-400">Saldo Bruto:</p><p className="font-mono text-white text-lg">R$ {(billing.saldo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
                <div><p className="text-slate-400">Aluguel (Cliente):</p><p className="font-mono text-white text-lg">R$ {(billing.aluguelValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
                <div className="mt-2 pt-2 border-t border-slate-700"><p className="text-slate-400">Total (Firma):</p><p className="font-mono font-bold text-lime-400 text-xl">R$ {valorTotalFirma.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
            </div>

            <h3 className="font-bold text-lime-400 pt-4 border-t border-slate-700">Editar Pagamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Recebido em Espécie (R$)</label>
                    <input type="text" inputMode="decimal" name="recebimentoEspecie" value={paymentState.recebimentoEspecie} onChange={handleFormChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Recebido em PIX (R$)</label>
                    <input type="text" inputMode="decimal" name="recebimentoPix" value={paymentState.recebimentoPix} onChange={handleFormChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                </div>
            </div>

            {error && <div className="mt-2 text-center text-sm p-2 rounded-md bg-red-900/50 text-red-300 flex items-center gap-2"><AlertIcon className="w-5 h-5"/>{error}</div>}
          </div>
          <div className="p-6 bg-slate-800/50 rounded-b-lg flex justify-end gap-4">
            <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">Cancelar</button>
            <button onClick={handleConfirm} disabled={!!error} className="bg-lime-500 text-white font-bold py-2 px-6 rounded-md hover:bg-lime-600 disabled:bg-slate-500 disabled:cursor-not-allowed">Salvar Alterações</button>
          </div>
        </div>
        <style>{`
          @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
          .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
        `}</style>
      </div>
    );
  };
  
  export default EditBillingModal;