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

type PaymentState = {
  dinheiro: string;
  pix: string;
  fiado: string;
};

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (billing: Billing) => void;
  customer: Customer;
  equipment: Equipment;
  onTriggerProvisionalReceiptAction: (billing: Billing, onComplete: () => void) => void;
}

const FormField: React.FC<{
    label: string;
    name: keyof FormState;
    value: string;
    type?: string;
    step?: string;
    equipmentId: string;
    isReadingInvalid?: boolean;
    readOnly?: boolean;
    onChange: (field: keyof FormState, value: string) => void;
}> = React.memo(({ label, name, value, type = 'text', step, equipmentId, isReadingInvalid, readOnly, onChange }) => (
    <div>
        <label htmlFor={`${equipmentId}-${name}`} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        <input
            type={type}
            id={`${equipmentId}-${name}`}
            value={value}
            step={step}
            inputMode={type === 'number' ? 'numeric' : 'text'}
            readOnly={readOnly}
            onChange={(e) => !readOnly && onChange(name, e.target.value)}
            className={`w-full bg-slate-700 border rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 ${isReadingInvalid && name === 'relogioAtual' ? 'border-red-500 ring-red-500' : 'border-slate-600 focus:ring-emerald-500'} ${readOnly ? 'bg-slate-600 cursor-not-allowed' : ''}`}
        />
    </div>
));

const PaymentField: React.FC<{
    label: string;
    name: keyof PaymentState;
    value: string;
    onChange: (field: keyof PaymentState, value: string) => void;
}> = React.memo(({ label, name, value, onChange }) => (
    <div>
        <label htmlFor={`payment-${name}`} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        <input
            type="number"
            step="0.01"
            id={`payment-${name}`}
            value={value}
            placeholder="0.00"
            inputMode="decimal"
            onChange={(e) => onChange(name, e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
    </div>
));


const BillingModal: React.FC<BillingModalProps> = ({ isOpen, onClose, onConfirm, customer, equipment, onTriggerProvisionalReceiptAction }) => {
  const [formState, setFormState] = useState<FormState>({} as FormState);
  const [paymentValues, setPaymentValues] = useState<PaymentState>({ dinheiro: '', pix: '', fiado: ''});
  const [error, setError] = useState<string | null>(null);
  const [mesaStep, setMesaStep] = useState(1);
  const [gruaStep, setGruaStep] = useState(1);


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
      setPaymentValues({ dinheiro: '', pix: '', fiado: ''});
      setError(null);
      setMesaStep(1);
      setGruaStep(1);
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
      const valorFicha = equipment.valorFicha || 0;
      const valorBruto = partidasCobradas * valorFicha;
      const parteFirma = valorBruto * ((equipment.parteFirma || 0) / 100);
      const parteCliente = valorBruto * ((equipment.parteCliente || 0) / 100);
      result = { partidasJogadas, descontoPartidas, partidasCobradas, valorTotal: parteFirma, parteFirma, parteCliente, valorFicha, valorBruto };
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

  useEffect(() => {
    if (mesaStep === 2 && calculation.valorTotal && equipment.type !== 'grua') {
        setPaymentValues(prev => ({ ...prev, dinheiro: calculation.valorTotal!.toFixed(2), pix: '', fiado: '' }));
    }
  }, [mesaStep, calculation.valorTotal, equipment.type]);
  
  const handleFormChange = useCallback((field: keyof FormState, value: string) => {
    setFormState(prev => {
        const newState = { ...prev, [field]: value };

        if (equipment.type === 'grua') {
            // Plushie logic
            const isPlushieTriggerField = ['sobraPelucia', 'quantidadePelucia'].includes(field);
            if (isPlushieTriggerField) {
                const quantidadeTotal = parseInt(newState.quantidadePelucia || '0', 10);
                const sobras = parseInt(newState.sobraPelucia || '0', 10);
                if (!isNaN(quantidadeTotal) && !isNaN(sobras)) {
                    newState.reposicaoPelucia = String(Math.max(0, quantidadeTotal - sobras));
                }
            }

            // Financial Calculations
            const relogioAtualNum = parseInt(newState.relogioAtual, 10) || 0;
            const relogioAnteriorNum = equipment.relogioAnterior || 0;
            const saldoBruto = (relogioAtualNum >= relogioAnteriorNum) ? relogioAtualNum - relogioAnteriorNum : 0;
            newState.saldo = String(saldoBruto);

            // Calculate 'Total para a Firma' (Net Amount) based on current state
            let aluguelValorNum = parseFloat(newState.aluguelValor || '0');
            if (equipment.aluguelPercentual && equipment.aluguelPercentual > 0) {
                aluguelValorNum = saldoBruto * (equipment.aluguelPercentual / 100);
            }
            const totalParaFirma = saldoBruto - aluguelValorNum;

            // The sum of cash and PIX should equal the NET amount (totalParaFirma)
            const recebidoEspecieNum = parseFloat(newState.recebimentoEspecie || '0');

            // Allow user to manually edit the PIX field, otherwise auto-calculate it
            if (field !== 'recebimentoPix') {
                const recebidoPix = totalParaFirma - recebidoEspecieNum;
                newState.recebimentoPix = recebidoPix >= 0 ? recebidoPix.toFixed(2) : '0.00';
            }
        }
        
        return newState;
    });
  }, [equipment]);

  const handlePaymentChange = useCallback((field: keyof PaymentState, value: string) => {
    setPaymentValues(prev => {
        const newValues = { ...prev, [field]: value };
        if (field === 'dinheiro') {
            return newValues;
        }

        const valorTotal = calculation.valorTotal || 0;
        const pixValue = parseFloat(newValues.pix) || 0;
        const fiadoValue = parseFloat(newValues.fiado) || 0;
        const dinheiroRestante = valorTotal - pixValue - fiadoValue;
        
        newValues.dinheiro = Math.max(0, dinheiroRestante).toFixed(2);
        
        return newValues;
    });
  }, [calculation.valorTotal]);

  const generateBillingObject = useCallback((): Billing | null => {
    const relogioAtual = parseInt(formState.relogioAtual, 10) || 0;
    if (!formState || !calculation || relogioAtual < equipment.relogioAnterior) {
      return null;
    }

    let billingData: Partial<Billing> = {};
    if (equipment.type === 'grua') {
        billingData = {
          paymentMethod: 'dinheiro', // Not really relevant for grua
          recebimentoEspecie: parseFloat(formState.recebimentoEspecie || '0'),
          recebimentoPix: parseFloat(formState.recebimentoPix || '0'),
        };
    } else {
        const valorPagoDinheiro = parseFloat(paymentValues.dinheiro) || 0;
        const valorPagoPix = parseFloat(paymentValues.pix) || 0;
        const valorPagoFiado = parseFloat(paymentValues.fiado) || 0;
        let paymentMethod: Billing['paymentMethod'] = 'dinheiro';
        const methodsUsed = [valorPagoDinheiro > 0 && 'dinheiro', valorPagoPix > 0 && 'pix', valorPagoFiado > 0 && 'fiado'].filter(Boolean);
        if (methodsUsed.length > 1) { paymentMethod = 'misto'; }
        else if (methodsUsed.length === 1) { paymentMethod = methodsUsed[0] as Billing['paymentMethod']; }
        
        billingData = {
          paymentMethod,
          valorPagoDinheiro: valorPagoDinheiro > 0 ? valorPagoDinheiro : undefined,
          valorPagoPix: valorPagoPix > 0 ? valorPagoPix : undefined,
          valorPagoFiado: valorPagoFiado > 0 ? valorPagoFiado : undefined,
        };
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
      ...calculation,
      ...billingData,
      valorTotal: calculation.valorTotal || 0,
    };
  }, [formState, calculation, equipment, customer, paymentValues]);

  const validateAndProceed = useCallback(() => {
    const relogioAtual = parseInt(formState.relogioAtual, 10) || 0;
    if (relogioAtual <= 0) {
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
        onTriggerProvisionalReceiptAction(billing, () => setMesaStep(2));
    }
  };

  const totalPaid = useMemo(() => (parseFloat(paymentValues.dinheiro) || 0) + (parseFloat(paymentValues.pix) || 0) + (parseFloat(paymentValues.fiado) || 0), [paymentValues]);
  const remainingAmount = useMemo(() => (calculation.valorTotal || 0) - totalPaid, [calculation.valorTotal, totalPaid]);

  const handleFinalize = () => {
    if (!validateAndProceed()) return;
    if (equipment.type !== 'grua' && Math.abs(remainingAmount) > 0.01) {
      setError("A soma dos pagamentos deve ser igual ao valor total para a firma.");
      return;
    }
    const billing = generateBillingObject();
    if (billing) onConfirm(billing);
  };
  
  const handleGruaNextStep = useCallback(() => {
    if (gruaStep === 1) {
      if (!validateAndProceed()) return;
      setGruaStep(2);
    } else if (gruaStep === 2) {
      setGruaStep(3);
    }
  }, [gruaStep, validateAndProceed]);
  
  const handleGruaPrevStep = useCallback(() => {
    setGruaStep(prev => Math.max(1, prev - 1));
  }, []);

  if (!isOpen) return null;

  const isGrua = equipment.type === 'grua';
  const isReadingInvalid = (parseInt(formState.relogioAtual, 10) || 0) < equipment.relogioAnterior;

  const renderGruaStep1 = () => (
    <div className="space-y-4">
      <h4 className="text-md font-bold text-emerald-400">Leitura Anterior: {equipment.relogioAnterior}</h4>
      <FormField label="Leitura Atual" name="relogioAtual" value={formState.relogioAtual} type="number" equipmentId={equipment.id} isReadingInvalid={isReadingInvalid} onChange={handleFormChange} />
      <FormField label="Saldo Bruto (R$)" name="saldo" value={formState.saldo} type="number" step="0.01" equipmentId={equipment.id} onChange={handleFormChange} readOnly />
      {equipment.aluguelPercentual && equipment.aluguelPercentual > 0
          ? <FormField label="Aluguel (%)" name="aluguelPercentual" value={formState.aluguelPercentual} type="number" equipmentId={equipment.id} onChange={handleFormChange} readOnly/>
          : <FormField label="Aluguel Fixo (R$)" name="aluguelValor" value={formState.aluguelValor} type="number" step="0.01" equipmentId={equipment.id} onChange={handleFormChange} />
      }
    </div>
  );

  const renderGruaStep2 = () => (
    <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg space-y-2 text-sm animate-fade-in">
        <h4 className="text-lg font-bold text-white mb-3 text-center">Conferência para o Cliente</h4>
        <div className="flex justify-between text-slate-300 text-base">
            <span>Saldo Bruto:</span>
            <span className="font-mono">R$ {(calculation.saldo || 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-300 text-base">
            <span>Parte da Firma:</span>
            <span className="font-mono text-amber-400">- R$ {(calculation.valorTotal || 0).toFixed(2)}</span>
        </div>
        <hr className="border-dashed border-slate-600 my-2" />
        <div className="flex justify-between font-bold text-xl text-emerald-400">
            <span>TOTAL PARA O CLIENTE:</span>
            <span className="font-mono">R$ {(calculation.aluguelValor || 0).toFixed(2)}</span>
        </div>
    </div>
  );
  
  const renderGruaStep3 = () => (
      <div className="space-y-4">
          <h4 className="text-md font-bold text-emerald-400">Detalhes Finais</h4>
          <FormField label="Recebido em Espécie (R$)" name="recebimentoEspecie" value={formState.recebimentoEspecie} type="number" step="0.01" equipmentId={equipment.id} onChange={handleFormChange} />
          <FormField label="Recebido em PIX (Automático)" name="recebimentoPix" value={formState.recebimentoPix} type="number" step="0.01" equipmentId={equipment.id} onChange={handleFormChange} readOnly/>
          <div className="col-span-2 pt-2"><hr className="border-slate-700" /></div>
          <FormField label="Qtd. Pelúcias (Capacidade)" name="quantidadePelucia" value={formState.quantidadePelucia} type="number" equipmentId={equipment.id} onChange={handleFormChange} />
          <FormField label="Sobra de Pelúcias" name="sobraPelucia" value={formState.sobraPelucia} type="number" equipmentId={equipment.id} onChange={handleFormChange} />
          <FormField label="Reposição (Automático)" name="reposicaoPelucia" value={formState.reposicaoPelucia} type="number" equipmentId={equipment.id} onChange={handleFormChange} readOnly />
      </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Faturamento: {equipment.type} {equipment.numero}</h2>
          <p className="text-slate-400">Cliente: {customer.name}</p>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
          {isGrua ? (
            <>
              {gruaStep === 1 && renderGruaStep1()}
              {gruaStep === 2 && renderGruaStep2()}
              {gruaStep === 3 && renderGruaStep3()}
            </>
          ) : (
             mesaStep === 1 ? (
                <div className="space-y-4">
                  <h4 className="text-md font-bold text-emerald-400">Leitura Anterior: {equipment.relogioAnterior}</h4>
                  <FormField label="Leitura Atual" name="relogioAtual" value={formState.relogioAtual} type="number" equipmentId={equipment.id} isReadingInvalid={isReadingInvalid} onChange={handleFormChange} />
                  {equipment.type === 'mesa' && <FormField label="Desconto (Partidas)" name="descontoPartidas" value={formState.descontoPartidas} type="number" equipmentId={equipment.id} onChange={handleFormChange} />}
                  {equipment.type === 'mesa' && !isReadingInvalid && formState.relogioAtual && (
                    <div className="mt-6 p-4 bg-slate-900/50 border border-slate-700 rounded-lg space-y-2 text-sm animate-fade-in">
                      <h4 className="text-md font-bold text-white mb-3 text-center">Resumo do Cálculo</h4>
                      <div className="flex justify-between text-slate-300"><span>Leitura Anterior:</span><span className="font-mono">{equipment.relogioAnterior}</span></div>
                      <div className="flex justify-between text-slate-300"><span>Leitura Atual:</span><span className="font-mono">{parseInt(formState.relogioAtual, 10) || 0}</span></div>
                      <hr className="border-slate-700/50 my-2" /><div className="flex justify-between text-slate-300"><span>Total de Fichas:</span><span className="font-mono">{calculation.partidasJogadas || 0}</span></div>
                      <div className="flex justify-between text-slate-300"><span>Desconto (Fichas):</span><span className="font-mono text-amber-400">-{calculation.descontoPartidas || 0}</span></div>
                      <div className="flex justify-between font-semibold text-white"><span>Fichas Cobradas:</span><span className="font-mono">{calculation.partidasCobradas || 0}</span></div>
                      <div className="flex justify-between text-slate-300"><span>Valor da Ficha:</span><span className="font-mono">R$ {(calculation.valorFicha || 0).toFixed(2)}</span></div>
                      <hr className="border-dashed border-slate-600 my-2" /><div className="flex justify-between font-bold text-lg text-white"><span>VALOR BRUTO TOTAL:</span><span className="font-mono">R$ {(calculation.valorBruto || 0).toFixed(2)}</span></div>
                      <hr className="border-slate-700/50 my-2" /><div className="flex justify-between text-slate-300"><span>Parte Cliente ({equipment.parteCliente}%):</span><span className="font-mono">R$ {(calculation.parteCliente || 0).toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold text-emerald-400"><span>Parte Firma ({equipment.parteFirma}%):</span><span className="font-mono">R$ {(calculation.parteFirma || 0).toFixed(2)}</span></div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="block text-md font-bold text-emerald-400 mb-2">Observações e Pagamento Dividido</h4>
                  <PaymentField label="Valor em Dinheiro (R$)" name="dinheiro" value={paymentValues.dinheiro} onChange={handlePaymentChange} />
                  <PaymentField label="Valor em PIX (R$)" name="pix" value={paymentValues.pix} onChange={handlePaymentChange} />
                  <PaymentField label="Deixar Fiado (R$)" name="fiado" value={paymentValues.fiado} onChange={handlePaymentChange} />
                  {Math.abs(remainingAmount) > 0.01 && (
                      <div className={`mt-2 text-center text-sm p-2 rounded-md ${remainingAmount > 0 ? 'bg-amber-900/50 text-amber-300' : 'bg-red-900/50 text-red-300'}`}>
                          {remainingAmount > 0 ? `Falta alocar: R$ ${remainingAmount.toFixed(2)}` : `Valor excedido: R$ ${Math.abs(remainingAmount).toFixed(2)}`}
                      </div>
                  )}
                </div>
              )
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
              
              {isGrua ? (
                <>
                  {gruaStep > 1 && <button onClick={handleGruaPrevStep} className="bg-slate-500 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-400">Voltar</button>}
                  {gruaStep === 1 && <button onClick={handleGruaNextStep} className="bg-sky-600 text-white font-bold py-2 px-6 rounded-md hover:bg-sky-500">Avançar</button>}
                  {gruaStep === 2 && <button onClick={handleGruaNextStep} className="bg-sky-600 text-white font-bold py-2 px-6 rounded-md hover:bg-sky-500">Confirmar e Continuar</button>}
                  {gruaStep === 3 && <button onClick={handleFinalize} className="bg-emerald-600 text-white font-bold py-2 px-6 rounded-md hover:bg-emerald-500">Finalizar Cobrança</button>}
                </>
              ) : (
                 mesaStep === 1 ? (
                  <button onClick={handleProvisionalAction} className="inline-flex items-center gap-2 bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-500">
                      Imprimir Via Cliente
                  </button>
                 ) : (
                  <button 
                    onClick={handleFinalize} 
                    disabled={Math.abs(remainingAmount) > 0.01}
                    className="bg-emerald-600 text-white font-bold py-2 px-6 rounded-md hover:bg-emerald-500 disabled:bg-slate-500 disabled:cursor-not-allowed"
                  >
                    Finalizar Cobrança
                  </button>
                 )
              )}
            </div>
        </div>

      </div>
      <style>{`
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default BillingModal;