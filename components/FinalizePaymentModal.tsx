// components/FinalizePaymentModal.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Billing, Equipment } from '../types';
import { safeParseFloat } from '../utils';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';

interface FinalizePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (updatedBilling: Billing) => void;
  billing: Billing;
  equipment: Equipment; // Essential for grua defaults
}

const FinalizePaymentModal: React.FC<FinalizePaymentModalProps> = ({ isOpen, onClose, onConfirm, billing, equipment }) => {
  const [mesaJukeboxPayment, setMesaJukeboxPayment] = useState({ dinheiro: '', pix: '', bonus: '', negativo: '' });
  const [gruaPayment, setGruaPayment] = useState({ recebimentoEspecie: '', recebimentoPix: '', sobraPelucia: '', reposicaoPelucia: '' });
  const [error, setError] = useState('');
  
  const isGrua = billing.equipmentType === 'grua';

  const valorTotalParaFirma = useMemo(() => {
      if (isGrua) return billing.valorTotal;
      const bonus = safeParseFloat(mesaJukeboxPayment.bonus);
      return billing.valorTotal - bonus;
  }, [billing.valorTotal, mesaJukeboxPayment.bonus, isGrua]);

  useEffect(() => {
    if (isOpen) {
        if (isGrua) {
            const totalFirma = billing.valorTotal || 0;
            setGruaPayment({
                recebimentoEspecie: '0',
                recebimentoPix: String(totalFirma > 0 ? parseFloat(totalFirma.toFixed(2)) : '0'),
                sobraPelucia: '',
                reposicaoPelucia: String(equipment.quantidadePelucia || ''),
            });
        } else {
            const initialBonus = billing.valorBonus || 0;
            const valorFinal = billing.valorTotal - initialBonus;
            setMesaJukeboxPayment({
                dinheiro: '',
                pix: String(valorFinal > 0 ? valorFinal : '0'),
                bonus: String(initialBonus > 0 ? initialBonus : ''),
                negativo: '0'
            });
        }
        setError('');
    }
  }, [isOpen, billing, equipment, isGrua]);

  const handleMesaJukeboxChange = (field: keyof typeof mesaJukeboxPayment, value: string) => {
    setMesaJukeboxPayment(prev => {
        const newState = { ...prev, [field]: value };
        const vTotal = billing.valorTotal;

        if (field === 'dinheiro' || field === 'bonus') {
            const vBonus = safeParseFloat(newState.bonus);
            const vDinheiro = safeParseFloat(newState.dinheiro);
            const newPix = vTotal - vBonus - vDinheiro;

            if (newPix < -0.01) {
                setError(`Valor excedido em R$ ${Math.abs(newPix).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
                const finalNegativo = vTotal - vBonus - vDinheiro - safeParseFloat(newState.pix);
                 return { ...newState, negativo: finalNegativo >= -0.01 ? String(parseFloat(finalNegativo.toFixed(2))) : '0' };
            } else {
                setError('');
                return { ...newState, pix: String(parseFloat(newPix.toFixed(2))), negativo: '0' };
            }
        }
        
        const vBonus = safeParseFloat(newState.bonus);
        const vDinheiro = safeParseFloat(newState.dinheiro);
        const vPix = safeParseFloat(newState.pix);
        const newNegativo = vTotal - vBonus - vDinheiro - vPix;
        
        if (newNegativo < -0.01) {
            setError(`Valor excedido em R$ ${Math.abs(newNegativo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
        } else {
            setError('');
        }
        return { ...newState, negativo: newNegativo >= -0.01 ? String(parseFloat(newNegativo.toFixed(2))) : '0' };
    });
  };

  const handleGruaChange = (field: keyof typeof gruaPayment, value: string) => {
    setGruaPayment(prev => {
        const newState = { ...prev, [field]: value };
        const totalFirma = billing.valorTotal;

        if (field === 'recebimentoEspecie') {
            const recebimentoEspecieNum = safeParseFloat(value);
            const pixCalculado = totalFirma - recebimentoEspecieNum;
            newState.recebimentoPix = String(parseFloat(pixCalculado.toFixed(2)));
        } else if (field === 'recebimentoPix') {
            const recebimentoPixNum = safeParseFloat(value);
            const especieCalculado = totalFirma - recebimentoPixNum;
            newState.recebimentoEspecie = String(parseFloat(especieCalculado.toFixed(2)));
        }
        
        if (field === 'sobraPelucia') {
            const quantidadeTotal = equipment.quantidadePelucia || 0;
            const sobras = safeParseFloat(value);
            newState.reposicaoPelucia = String(Math.max(0, Math.round(quantidadeTotal - sobras)));
        }

        const finalEspecie = safeParseFloat(newState.recebimentoEspecie);
        const finalPix = safeParseFloat(newState.recebimentoPix);
        if (Math.abs(finalEspecie + finalPix - totalFirma) > 0.01) {
             setError('A soma de Espécie e PIX deve ser igual ao Total da Firma.');
        } else {
             setError('');
        }
        return newState;
    });
  };


  const handleConfirm = useCallback(() => {
    if (error) return;
    
    let updatedBilling: Billing;

    if (isGrua) {
        const recebimentoEspecie = safeParseFloat(gruaPayment.recebimentoEspecie);
        const recebimentoPix = safeParseFloat(gruaPayment.recebimentoPix);
        let paymentMethod: Billing['paymentMethod'] = 'dinheiro';
        if (recebimentoEspecie > 0 && recebimentoPix > 0) paymentMethod = 'misto';
        else if (recebimentoPix > 0) paymentMethod = 'pix';
        
        updatedBilling = {
            ...billing,
            settledAt: new Date(),
            paymentMethod,
            recebimentoEspecie,
            recebimentoPix,
            sobraPelucia: safeParseFloat(gruaPayment.sobraPelucia),
            reposicaoPelucia: safeParseFloat(gruaPayment.reposicaoPelucia),
            quantidadePelucia: equipment.quantidadePelucia,
        };
    } else {
        const valorPagoDinheiro = safeParseFloat(mesaJukeboxPayment.dinheiro);
        const valorPagoPix = safeParseFloat(mesaJukeboxPayment.pix);
        const valorDebitoNegativo = safeParseFloat(mesaJukeboxPayment.negativo);
        const valorBonus = safeParseFloat(mesaJukeboxPayment.bonus);
        
        const methodsUsed = [];
        if (valorPagoDinheiro > 0) methodsUsed.push('dinheiro');
        if (valorPagoPix > 0) methodsUsed.push('pix');
        if (valorDebitoNegativo > 0) methodsUsed.push('debito_negativo');

        let paymentMethod: Billing['paymentMethod'] = 'dinheiro';
        if (methodsUsed.length > 1) paymentMethod = 'misto';
        else if (methodsUsed.length === 1) paymentMethod = methodsUsed[0] as 'dinheiro' | 'pix' | 'debito_negativo';
        else if (valorTotalParaFirma <= 0) paymentMethod = 'dinheiro';

        updatedBilling = {
            ...billing,
            settledAt: new Date(),
            paymentMethod,
            valorPagoDinheiro: valorPagoDinheiro > 0 ? valorPagoDinheiro : undefined,
            valorPagoPix: valorPagoPix > 0 ? valorPagoPix : undefined,
            valorDebitoNegativo: valorDebitoNegativo > 0 ? valorDebitoNegativo : undefined,
            valorBonus: valorBonus > 0 ? valorBonus : undefined,
        };
    }
    
    onConfirm(updatedBilling);
  }, [error, isGrua, gruaPayment, mesaJukeboxPayment, billing, equipment, onConfirm, valorTotalParaFirma]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Finalizar Pagamento</h2>
          <p className="text-slate-400 break-words">{billing.customerName} - <span className="capitalize">{billing.equipmentType}</span> {billing.equipmentNumero}</p>
        </div>
        <div className="p-6 space-y-6">
            <div className="text-center">
                <p className="text-slate-400">Total a Pagar</p>
                <p className="text-3xl font-mono font-bold text-lime-400">R$ {valorTotalParaFirma.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            {isGrua ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Recebido em Espécie (R$)</label>
                        <input type="text" inputMode="decimal" value={gruaPayment.recebimentoEspecie} onChange={(e) => handleGruaChange('recebimentoEspecie', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Recebido em PIX (R$)</label>
                        <input type="text" inputMode="decimal" value={gruaPayment.recebimentoPix} onChange={(e) => handleGruaChange('recebimentoPix', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Sobra de Pelúcias</label>
                        <input type="number" inputMode="numeric" value={gruaPayment.sobraPelucia} onChange={(e) => handleGruaChange('sobraPelucia', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                     </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Reposição (Automático)</label>
                        <input type="number" value={gruaPayment.reposicaoPelucia} readOnly className="w-full bg-slate-600 cursor-not-allowed border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none" />
                     </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Bônus / Desconto (R$)</label>
                        <input type="text" inputMode="decimal" value={mesaJukeboxPayment.bonus} onChange={(e) => handleMesaJukeboxChange('bonus', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Deixar Negativo (R$)</label>
                        <input type="text" value={mesaJukeboxPayment.negativo} readOnly className="w-full bg-slate-600 cursor-not-allowed border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Valor em Dinheiro (R$)</label>
                        <input type="text" inputMode="decimal" value={mesaJukeboxPayment.dinheiro} onChange={(e) => handleMesaJukeboxChange('dinheiro', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Valor em PIX (R$)</label>
                        <input type="text" inputMode="decimal" value={mesaJukeboxPayment.pix} onChange={(e) => handleMesaJukeboxChange('pix', e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                    </div>
                </div>
            )}
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