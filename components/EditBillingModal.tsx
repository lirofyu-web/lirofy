// components/EditBillingModal.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Billing } from '../types';
import { safeParseFloat } from '../utils';

interface EditBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (billing: Billing) => void;
  billing: Billing;
}

const EditBillingModal: React.FC<EditBillingModalProps> = ({ isOpen, onClose, onConfirm, billing }) => {
  const [dinheiro, setDinheiro] = useState('');
  const [pix, setPix] = useState('');
  const [negativo, setNegativo] = useState('');
  const [recebimentoEspecie, setRecebimentoEspecie] = useState('');
  const [recebimentoPix, setRecebimentoPix] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDinheiro((billing.valorPagoDinheiro || 0).toFixed(2).replace('.', ','));
      setPix((billing.valorPagoPix || 0).toFixed(2).replace('.', ','));
      setNegativo((billing.valorDebitoNegativo || 0).toFixed(2).replace('.', ','));
      setRecebimentoEspecie((billing.recebimentoEspecie || 0).toFixed(2).replace('.', ','));
      setRecebimentoPix((billing.recebimentoPix || 0).toFixed(2).replace('.', ','));
      setError('');
    }
  }, [isOpen, billing]);

  const valorTotal = billing.valorTotal;
  const isGrua = billing.equipmentType === 'grua';

  const remainingAmount = useMemo(() => {
    if (isGrua) {
        const totalPago = safeParseFloat(recebimentoEspecie) + safeParseFloat(recebimentoPix);
        return valorTotal - totalPago;
    } else {
        const totalPago = safeParseFloat(dinheiro) + safeParseFloat(pix) + safeParseFloat(negativo);
        return valorTotal - totalPago;
    }
  }, [dinheiro, pix, negativo, recebimentoEspecie, recebimentoPix, valorTotal, isGrua]);

  const handleConfirm = useCallback(() => {
    if (Math.abs(remainingAmount) > 0.01) {
      setError('A soma dos pagamentos deve ser igual ao valor total.');
      return;
    }
    
    let updatedBilling: Billing;

    if (isGrua) {
      const vEspecie = safeParseFloat(recebimentoEspecie);
      const vPix = safeParseFloat(recebimentoPix);
      let paymentMethod: Billing['paymentMethod'] = 'dinheiro';
      if(vEspecie > 0 && vPix > 0) paymentMethod = 'misto';
      else if(vPix > 0) paymentMethod = 'pix';
      
      updatedBilling = { ...billing, recebimentoEspecie: vEspecie, recebimentoPix: vPix, paymentMethod };
    } else {
      const vDinheiro = safeParseFloat(dinheiro);
      const vPix = safeParseFloat(pix);
      const vNegativo = safeParseFloat(negativo);
      
      let paymentMethod: Billing['paymentMethod'] = 'dinheiro';
      const methodsUsed = [vDinheiro > 0 && 'dinheiro', vPix > 0 && 'pix', vNegativo > 0 && 'debito_negativo'].filter(Boolean);
      if (methodsUsed.length > 1) { paymentMethod = 'misto'; }
      else if (methodsUsed.length === 1) { paymentMethod = methodsUsed[0] as Billing['paymentMethod']; }

      updatedBilling = { ...billing, valorPagoDinheiro: vDinheiro, valorPagoPix: vPix, valorDebitoNegativo: vNegativo, paymentMethod };
    }
    
    onConfirm(updatedBilling);
  }, [remainingAmount, billing, onConfirm, dinheiro, pix, negativo, recebimentoEspecie, recebimentoPix, isGrua]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Editar Pagamento da Cobrança</h2>
          <p className="text-slate-400 break-words">{billing.customerName}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-slate-400">Total da Cobrança (Firma)</p>
            <p className="text-3xl font-mono font-bold text-lime-400">R$ {valorTotal.toFixed(2).replace('.', ',')}</p>
          </div>
          {isGrua ? (
            <>
              <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Recebido em Espécie (R$)</label>
                  <input type="text" value={recebimentoEspecie} onChange={(e) => setRecebimentoEspecie(e.target.value)} inputMode="decimal" className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Recebido em PIX (R$)</label>
                  <input type="text" value={recebimentoPix} onChange={(e) => setRecebimentoPix(e.target.value)} inputMode="decimal" className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
              </div>
            </>
          ) : (
            <>
              <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Valor em Dinheiro (R$)</label>
                  <input type="text" value={dinheiro} onChange={(e) => setDinheiro(e.target.value)} inputMode="decimal" className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Valor em PIX (R$)</label>
                  <input type="text" value={pix} onChange={(e) => setPix(e.target.value)} inputMode="decimal" className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Deixar Negativo (R$)</label>
                  <input type="text" value={negativo} onChange={(e) => setNegativo(e.target.value)} inputMode="decimal" className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
              </div>
            </>
          )}

          {Math.abs(remainingAmount) > 0.01 && (
              <div className={`mt-2 text-center text-sm p-2 rounded-md ${remainingAmount > 0 ? 'bg-amber-900/50 text-amber-300' : 'bg-red-900/50 text-red-300'}`}>
                  {remainingAmount > 0 ? `Falta alocar: R$ ${remainingAmount.toFixed(2).replace('.', ',')}` : `Valor excedido: R$ ${Math.abs(remainingAmount).toFixed(2).replace('.', ',')}`}
              </div>
          )}
          {error && <p className="text-red-400 text-xs mt-1 text-center">{error}</p>}
        </div>
        <div className="p-6 bg-slate-800/50 rounded-b-lg flex justify-end gap-4">
          <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">Cancelar</button>
          <button onClick={handleConfirm} disabled={Math.abs(remainingAmount) > 0.01} className="bg-lime-500 text-white font-bold py-2 px-6 rounded-md hover:bg-lime-600 disabled:bg-slate-500 disabled:cursor-not-allowed">Salvar</button>
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
