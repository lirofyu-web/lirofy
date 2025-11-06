
// components/BillingModal.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Customer, Equipment, Billing } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { AlertIcon } from './icons/AlertIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { PrinterIcon } from './icons/PrinterIcon';

type FormState = {
  relogioAtual: string;
  descontoPartidas: string; // Mesa specific
  // Grua specific
  aluguelPercentual: string;
  aluguelValor: string;
  saldo: string;
  quantidadePelucia: string;
  sobraPelucia: string;
  reposicaoPelucia: string;
  recebimentoEspecie: string;
  recebimentoPix: string;
};

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (billing: Billing) => void;
  customer: Customer;
  equipment: Equipment;
  onTriggerProvisionalReceiptAction: (billing: Billing, onComplete: () => void) => void;
}

const BillingModal: React.FC<BillingModalProps> = ({ isOpen, onClose, onConfirm, customer, equipment, onTriggerProvisionalReceiptAction }) => {
  const [formState, setFormState] = useState<FormState>({} as FormState);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro' | 'fiado'>('dinheiro');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      const initialState: FormState = {
        relogioAtual: '',
        descontoPartidas: '0',
        aluguelPercentual: String(equipment.aluguelPercentual || ''),
        aluguelValor: String(equipment.aluguelValor || '0'),
        saldo: '',
        quantidadePelucia: String(equipment.quantidadePelucia || ''),
        sobraPelucia: '',
        reposicaoPelucia: String(equipment.reposicaoPelucia || ''),
        recebimentoEspecie: '',
        recebimentoPix: '',
      };
      setFormState(initialState);
      setError(null);
      setPaymentMethod('dinheiro');
      setStep(1);
    }
  }, [isOpen, equipment]);

  const calculation = useMemo(() => {
    let result: Partial<Billing> = {};
    const relogioAtual = parseInt(formState.relogioAtual, 10) || 0;
    const relogioAnterior = equipment.relogioAnterior;

    if (relogioAtual < relogioAnterior) {
        return { valorTotal: 0 };
    }
    
    const partidasJogadas = relogioAtual - relogioAnterior;

    if (equipment.type === 'mesa') {
      const descontoPartidas = parseInt(formState.descontoPartidas || '0', 10);
      const partidasCobradas = Math.max(0, partidasJogadas - descontoPartidas);
      const valorBruto = partidasCobradas * (equipment.valorFicha || 0);
      const parteFirma = valorBruto * ((equipment.parteFirma || 0) / 100);
      const parteCliente = valorBruto * ((equipment.parteCliente || 0) / 100);
      result = { partidasJogadas, descontoPartidas, partidasCobradas, valorTotal: parteFirma, parteFirma, parteCliente };
    } else if (equipment.type === 'jukebox') {
      const valorBruto = partidasJogadas; // Assume 1 tick = R$ 1,00
      const parteFirma = valorBruto * ((equipment.porcentagemJukeboxFirma || 0) / 100);
      const parteCliente = valorBruto * ((equipment.porcentagemJukeboxCliente || 0) / 100);
      result = { partidasJogadas, valorTotal: parteFirma, parteFirma, parteCliente };
    } else if (equipment.type === 'grua') {
      const saldo = parseFloat(formState.saldo || '0');
      const recebimentoEspecie = parseFloat(formState.recebimentoEspecie || '0');
      const recebimentoPix = parseFloat(formState.recebimentoPix || '0');
      let aluguelValor = parseFloat(formState.aluguelValor || '0');
      
      if(equipment.aluguelPercentual && equipment.aluguelPercentual > 0){
          aluguelValor = saldo * (equipment.aluguelPercentual / 100);
      }

      const valorTotal = saldo - aluguelValor;
      result = { 
          partidasJogadas,
          saldo,
          aluguelValor,
          valorTotal,
          recebimentoEspecie,
          recebimentoPix,
          sobraPelucia: parseInt(formState.sobraPelucia || '0', 10),
          reposicaoPelucia: parseInt(formState.reposicaoPelucia || '0', 10),
          quantidadePelucia: parseInt(formState.quantidadePelucia || '0', 10),
      };
    }
    return result;
  }, [formState, equipment]);
  
  const handleFormChange = useCallback((field: keyof FormState, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);

  const generateBillingObject = useCallback((): Billing | null => {
    const relogioAtual = parseInt(formState.relogioAtual, 10) || 0;
    if (!formState || !calculation || relogioAtual < equipment.relogioAnterior) {
      return null;
    }
    return {
      id: uuidv4(),
      customerId: customer.id,
      customerName: customer.name,
      equipmentId: equipment.id,
      equipmentType: equipment.type,
      equipmentNumero: equipment.numero,
      relogioAnterior: equipment.relogioAnterior,
      relogioAtual: relogioAtual,
      settledAt: new Date(),
      paymentMethod,
      ...calculation,
      valorTotal: calculation.valorTotal || 0
    };
  }, [formState, calculation, equipment, customer, paymentMethod]);

  const validateAndProceed = useCallback(() => {
    const relogioAtual = parseInt(formState.relogioAtual, 10) || 0;
    if (relogioAtual <= 0 && equipment.type !== 'grua') {
      setError("Nenhuma leitura inserida. Preencha o campo de Leitura Atual.");
      return false;
    }
    if (relogioAtual < equipment.relogioAnterior) {
      setError(`Leitura atual (${relogioAtual}) não pode ser menor que a anterior (${equipment.relogioAnterior}).`);
      return false;
    }
    setError(null);
    return true;
  }, [formState, equipment]);

  const handleProvisionalAction = () => {
    if (!validateAndProceed()) return;
    const billing = generateBillingObject();
    if (billing) {
        onTriggerProvisionalReceiptAction(billing, () => setStep(2));
    }
  };

  const handleFinalize = () => {
    if (!validateAndProceed()) return;
    const billing = generateBillingObject();
    if (billing) {
        onConfirm(billing);
    }
  };

  if (!isOpen) return null;

  const isGrua = equipment.type === 'grua';
  const isReadingInvalid = (parseInt(formState.relogioAtual, 10) || 0) < equipment.relogioAnterior;

  const FormField = ({ label, name, value, type = 'text', step }: { label: string, name: keyof FormState, value: string, type?: string, step?: string }) => (
      <div>
          <label htmlFor={`${equipment.id}-${name}`} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
          <input
              type={type}
              id={`${equipment.id}-${name}`}
              value={value}
              step={step}
              onChange={(e) => handleFormChange(name, e.target.value)}
              className={`w-full bg-slate-700 border rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 ${isReadingInvalid && name==='relogioAtual' ? 'border-red-500 ring-red-500' : 'border-slate-600 focus:ring-emerald-500'}`}
          />
      </div>
  );

  const PaymentButton = ({ method, label }: { method: 'pix' | 'dinheiro' | 'fiado', label: string }) => (
    <button
        onClick={() => setPaymentMethod(method)}
        className={`flex-1 p-3 rounded-md text-center transition-all text-sm font-bold ${paymentMethod === method ? 'bg-emerald-600 text-white shadow' : 'bg-slate-700 hover:bg-slate-600'}`}
    >
        {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Faturamento: {equipment.type} {equipment.numero}</h2>
          <p className="text-slate-400">Cliente: {customer.name}</p>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-md font-bold text-emerald-400">Leitura Anterior: {equipment.relogioAnterior}</h4>
              <FormField label="Leitura Atual" name="relogioAtual" value={formState.relogioAtual} type="number" />
              {equipment.type === 'mesa' && <FormField label="Desconto (Partidas)" name="descontoPartidas" value={formState.descontoPartidas} type="number" />}
              {isGrua && <>
                  <FormField label="Saldo (R$)" name="saldo" value={formState.saldo} type="number" step="0.01" />
                  {equipment.aluguelPercentual && equipment.aluguelPercentual > 0
                      ? <FormField label="Aluguel (%)" name="aluguelPercentual" value={formState.aluguelPercentual} type="number" />
                      : <FormField label="Aluguel Fixo (R$)" name="aluguelValor" value={formState.aluguelValor} type="number" step="0.01" />
                  }
                  <div className="col-span-2"><hr className="border-slate-700" /></div>
                  <FormField label="Recebido Espécie (R$)" name="recebimentoEspecie" value={formState.recebimentoEspecie} type="number" step="0.01" />
                  <FormField label="Recebido PIX (R$)" name="recebimentoPix" value={formState.recebimentoPix} type="number" step="0.01" />
                  <div className="col-span-2"><hr className="border-slate-700" /></div>
                  <FormField label="Sobra Pelúcias" name="sobraPelucia" value={formState.sobraPelucia} type="number" />
                  <FormField label="Reposição Pelúcias" name="reposicaoPelucia" value={formState.reposicaoPelucia} type="number" />
              </>}
            </div>
          )}

          {step === 2 && !isGrua && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Definir Método de Pagamento</label>
              <div className="flex gap-2">
                  <PaymentButton method="dinheiro" label="Dinheiro" />
                  <PaymentButton method="pix" label="PIX" />
                  <PaymentButton method="fiado" label="Fiado" />
              </div>
            </div>
          )}
          
          {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 text-sm p-3 rounded-md flex items-center gap-2">
                  <AlertIcon className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
              </div>
          )}
        </div>

        <div className="p-6 mt-auto bg-slate-800/50 rounded-b-lg flex flex-col gap-4 border-t border-slate-700">
           <div className="text-right">
                <p className="text-slate-400">Total para a Firma: <span className="font-mono font-bold text-emerald-400 text-lg">R$ {(calculation?.valorTotal || 0).toFixed(2)}</span></p>
            </div>
            <div className="flex justify-end gap-4">
              <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">Cancelar</button>
              {step === 1 && !isGrua && (
                  <button onClick={handleProvisionalAction} className="inline-flex items-center gap-2 bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-500">
                      Imprimir Via Cliente
                  </button>
              )}
              {(step === 2 || isGrua) && (
                  <button onClick={handleFinalize} className="bg-emerald-600 text-white font-bold py-2 px-6 rounded-md hover:bg-emerald-500">Finalizar Cobrança</button>
              )}
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

export default BillingModal;
