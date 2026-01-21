// components/EditBillingModal.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Billing, Customer, Equipment } from '../types';
import { safeParseFloat } from '../utils';
import { AlertIcon } from './icons/AlertIcon';

interface EditBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (billing: Billing) => void;
  billing: Billing;
  customers: Customer[];
  billings: Billing[];
}

const EditBillingModal: React.FC<EditBillingModalProps> = ({ isOpen, onClose, onConfirm, billing, customers, billings }) => {
    const [formState, setFormState] = useState({
        relogioAtual: '',
        descontoPartidas: '',
        totalArrecadadoJukebox: '',
    });
    const [paymentState, setPaymentState] = useState({
        dinheiro: '',
        pix: '',
        negativo: '',
        bonus: '',
    });
    const [error, setError] = useState('');
    const isInitialMount = useRef(true);

    const customer = useMemo(() => customers.find(c => c.id === billing.customerId), [customers, billing.customerId]);
    const equipment = useMemo(() => customer?.equipment.find(e => e.id === billing.equipmentId), [customer, billing.equipmentId]);
    
    const isMostRecentBilling = useMemo(() => {
        if (!equipment) return false;
        const equipmentBillings = billings.filter(b => b.equipmentId === equipment.id);
        if (equipmentBillings.length === 0) return true;
        const latestBillingDate = Math.max(...equipmentBillings.map(b => new Date(b.settledAt).getTime()));
        return new Date(billing.settledAt).getTime() >= latestBillingDate;
    }, [billings, billing, equipment]);
  
    useEffect(() => {
      if (isOpen) {
        isInitialMount.current = true;
        setFormState({
            relogioAtual: String(billing.relogioAtual || 0),
            descontoPartidas: String(billing.descontoPartidas || 0),
            totalArrecadadoJukebox: String(billing.valorBruto || billing.valorTotal),
        });
        setPaymentState({
            dinheiro: String(billing.valorPagoDinheiro || 0),
            pix: String(billing.valorPagoPix || 0),
            negativo: String(billing.valorDebitoNegativo || 0),
            bonus: String(billing.valorBonus || 0),
        });
        setError('');
      }
    }, [isOpen, billing]);

    const calculation = useMemo(() => {
        if (!equipment) return {};
        let result: Partial<Billing> = {};
        const relogioAtual = safeParseFloat(formState.relogioAtual);
        const relogioAnterior = billing.relogioAnterior;
        const isInvalidReading = relogioAtual < relogioAnterior;
        const partidasJogadas = isInvalidReading ? 0 : Math.round(relogioAtual) - Math.round(relogioAnterior);

        if (billing.equipmentType === 'mesa') {
             if (billing.billingType === 'monthly') {
                 result = { valorTotal: equipment.monthlyFeeValue || 0, partidasJogadas };
             } else {
                const descontoPartidas = safeParseFloat(formState.descontoPartidas);
                const partidasCobradas = Math.max(0, partidasJogadas - descontoPartidas);
                const valorFicha = equipment.valorFicha || 0;
                const valorBruto = partidasCobradas * valorFicha;
                const parteFirma = Math.round((valorBruto * ((equipment.parteFirma || 0) / 100)) * 100) / 100;
                const parteCliente = valorBruto - parteFirma;
                result = { partidasJogadas, descontoPartidas, partidasCobradas, valorBruto, parteFirma, parteCliente, valorTotal: parteFirma };
             }
        } else if (billing.equipmentType === 'jukebox') {
            const valorBruto = safeParseFloat(formState.totalArrecadadoJukebox);
            const parteFirma = Math.round((valorBruto * ((equipment.porcentagemJukeboxFirma || 0) / 100)) * 100) / 100;
            const parteCliente = valorBruto - parteFirma;
            result = { valorBruto, parteFirma, parteCliente, valorTotal: parteFirma, partidasJogadas };
        } else {
            result = { partidasJogadas }; // Grua editing not implemented here, keeps original values
        }
        
        return result;
    }, [formState, billing, equipment]);

    const valorTotalRecalculado = calculation.valorTotal || 0;
    
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        // This effect re-balances the payment fields whenever the total amount changes.
        // It preserves user input for bonus/negativo/pix and adjusts 'dinheiro'.
        setPaymentState(prev => {
            const newValues = { ...prev };
            const vTotal = valorTotalRecalculado;
            const vBonus = safeParseFloat(newValues.bonus);
            const vNegativo = safeParseFloat(newValues.negativo);
            const vPix = safeParseFloat(newValues.pix);

            const liquidoAReceber = vTotal - vBonus - vNegativo;
            const newDinheiro = liquidoAReceber - vPix;
            
            newValues.dinheiro = newDinheiro >= 0 ? String(newDinheiro) : '0';

            return newValues;
        });
    }, [valorTotalRecalculado]);


    const remainingAmount = useMemo(() => {
        const totalPago = safeParseFloat(paymentState.dinheiro) + safeParseFloat(paymentState.pix) + safeParseFloat(paymentState.negativo) + safeParseFloat(paymentState.bonus);
        return valorTotalRecalculado - totalPago;
    }, [paymentState, valorTotalRecalculado]);

    const handleConfirm = useCallback(() => {
        if (remainingAmount !== 0) {
            setError(`A soma dos pagamentos (R$ ${(valorTotalRecalculado - remainingAmount).toFixed(2)}) não corresponde ao novo valor total (R$ ${valorTotalRecalculado.toFixed(2)}).`);
            return;
        }

        const vDinheiro = safeParseFloat(paymentState.dinheiro);
        const vPix = safeParseFloat(paymentState.pix);
        const vNegativo = safeParseFloat(paymentState.negativo);
        const vBonus = safeParseFloat(paymentState.bonus);

        let paymentMethod: Billing['paymentMethod'] = 'dinheiro';
        const methodsUsed = [vDinheiro > 0 && 'dinheiro', vPix > 0 && 'pix', vNegativo > 0 && 'debito_negativo'].filter(Boolean);
        if (methodsUsed.length > 1) { paymentMethod = 'misto'; }
        else if (methodsUsed.length === 1) { paymentMethod = methodsUsed[0] as Billing['paymentMethod']; }

        const updatedBilling: Billing = {
            ...billing,
            ...calculation,
            relogioAtual: Math.round(safeParseFloat(formState.relogioAtual)),
            valorPagoDinheiro: vDinheiro,
            valorPagoPix: vPix,
            valorDebitoNegativo: vNegativo,
            valorBonus: vBonus,
            paymentMethod,
        };
        onConfirm(updatedBilling);
    }, [remainingAmount, onConfirm, billing, calculation, formState, paymentState, valorTotalRecalculado]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handlePaymentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        setPaymentState(prev => {
            const newValues = { ...prev, [name]: value };

            const vTotal = valorTotalRecalculado;
            const vBonus = safeParseFloat(newValues.bonus);
            const vNegativo = safeParseFloat(newValues.negativo);
            
            const liquidoAReceber = vTotal - vBonus - vNegativo;
            
            if (name === 'dinheiro') {
                const newDinheiro = safeParseFloat(newValues.dinheiro);
                const newPix = liquidoAReceber - newDinheiro;
                newValues.pix = newPix >= 0 ? String(newPix) : '0';
            } else if (name === 'pix') {
                const newPix = safeParseFloat(newValues.pix);
                const newDinheiro = liquidoAReceber - newPix;
                newValues.dinheiro = newDinheiro >= 0 ? String(newDinheiro) : '0';
            } else { // bonus or negativo changed
                const currentPix = safeParseFloat(newValues.pix);
                const newDinheiro = liquidoAReceber - currentPix;
                newValues.dinheiro = newDinheiro >= 0 ? String(newDinheiro) : '0';
            }
            
            return newValues;
        });
    }, [valorTotalRecalculado]);


    if (!isOpen || !equipment) return null;
    const isMesa = billing.equipmentType === 'mesa';
    const isJukebox = billing.equipmentType === 'jukebox';
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg border border-slate-700 animate-fade-in-up max-h-[90vh] flex flex-col">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">Editar Cobrança</h2>
            <p className="text-slate-400 break-words">{billing.customerName} - {isMesa ? `Mesa ${billing.equipmentNumero}` : `Jukebox ${billing.equipmentNumero}`}</p>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto">
            
            <h3 className="font-bold text-lime-400">Dados da Cobrança</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Leitura Atual</label>
                    <input type="text" inputMode="numeric" name="relogioAtual" value={formState.relogioAtual} onChange={handleFormChange} readOnly={!isMostRecentBilling} className={`w-full bg-slate-700 border rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500 ${!isMostRecentBilling ? 'cursor-not-allowed bg-slate-600' : 'border-slate-600'}`} />
                    {!isMostRecentBilling && <p className="text-xs text-amber-400 mt-1">Apenas a cobrança mais recente pode ter a leitura alterada.</p>}
                </div>

                {isMesa && billing.billingType !== 'monthly' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Desconto (Partidas)</label>
                        <input type="text" inputMode="numeric" name="descontoPartidas" value={formState.descontoPartidas} onChange={handleFormChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                    </div>
                )}

                 {isJukebox && (
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Total Arrecadado (R$)</label>
                        <input type="text" inputMode="decimal" name="totalArrecadadoJukebox" value={formState.totalArrecadadoJukebox} onChange={handleFormChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                    </div>
                )}
            </div>

            <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
                <p className="text-slate-400">Novo Valor Total (Firma):</p>
                <p className="text-3xl font-mono font-bold text-lime-400">R$ {valorTotalRecalculado.toFixed(2)}</p>
            </div>
            
            <h3 className="font-bold text-lime-400 pt-4 border-t border-slate-700">Pagamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Valor em Dinheiro (R$)</label>
                    <input type="text" inputMode="decimal" name="dinheiro" value={paymentState.dinheiro} onChange={handlePaymentChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Valor em PIX (R$)</label>
                    <input type="text" inputMode="decimal" name="pix" value={paymentState.pix} onChange={handlePaymentChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Bônus / Desconto (R$)</label>
                    <input type="text" inputMode="decimal" name="bonus" value={paymentState.bonus} onChange={handlePaymentChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Deixar Negativo (R$)</label>
                    <input type="text" inputMode="decimal" name="negativo" value={paymentState.negativo} onChange={handlePaymentChange} className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
                </div>
            </div>

            {Math.abs(remainingAmount) > 0.001 && (
                <div className={`mt-2 text-center text-sm p-2 rounded-md ${remainingAmount > 0 ? 'bg-amber-900/50 text-amber-300' : 'bg-red-900/50 text-red-300'}`}>
                    {remainingAmount > 0 ? `Falta alocar: R$ ${remainingAmount.toFixed(2)}` : `Valor excedido: R$ ${Math.abs(remainingAmount).toFixed(2)}`}
                </div>
            )}
            {error && <p className="text-red-400 text-xs mt-1 text-center p-2 rounded-md bg-red-900/50 flex items-center gap-2"><AlertIcon className="w-4 h-4" />{error}</p>}
          </div>
          <div className="p-6 bg-slate-800/50 rounded-b-lg flex justify-end gap-4">
            <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">Cancelar</button>
            <button onClick={handleConfirm} disabled={Math.abs(remainingAmount) > 0.001} className="bg-lime-500 text-white font-bold py-2 px-6 rounded-md hover:bg-lime-600 disabled:bg-slate-500 disabled:cursor-not-allowed">Salvar Alterações</button>
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
