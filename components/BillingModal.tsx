// components/BillingModal.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Customer, Equipment, Billing } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { AlertIcon } from './icons/AlertIcon';
import { safeParseFloat } from '../utils';

type FormState = {
  relogioAtual: string;
  totalArrecadadoJukebox: string; // Jukebox specific
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
  negativo: string;
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
    autoFocus?: boolean;
    inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
    onChange: (field: keyof FormState, value: string) => void;
}> = React.memo(({ label, name, value, type = 'text', step, equipmentId, isReadingInvalid, readOnly, autoFocus, inputMode, onChange }) => (
    <div>
        <label htmlFor={`${equipmentId}-${name}`} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
        <input
            type={type}
            id={`${equipmentId}-${name}`}
            value={value}
            step={step}
            inputMode={inputMode}
            readOnly={readOnly}
            autoFocus={autoFocus}
            onChange={(e) => !readOnly && onChange(name, e.target.value)}
            className={`w-full bg-slate-700 border rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 ${isReadingInvalid && name === 'relogioAtual' ? 'border-red-500 ring-red-500' : 'border-slate-600 focus:ring-lime-500'} ${readOnly ? 'bg-slate-600 cursor-not-allowed' : ''}`}
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
            type="text"
            id={`payment-${name}`}
            value={value}
            placeholder="0,00"
            inputMode="decimal"
            onChange={(e) => onChange(name, e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
        />
    </div>
));


const BillingModal: React.FC<BillingModalProps> = ({ isOpen, onClose, onConfirm, customer, equipment, onTriggerProvisionalReceiptAction }) => {
  const [formState, setFormState] = useState<FormState>({} as FormState);
  const [paymentValues, setPaymentValues] = useState<PaymentState>({ dinheiro: '', pix: '', negativo: ''});
  const [error, setError] = useState<string | null>(null);
  const [mesaStep, setMesaStep] = useState(1);
  const [jukeboxStep, setJukeboxStep] = useState(1);
  const [gruaStep, setGruaStep] = useState(1);
  
  const isMonthlyFee = equipment.type === 'mesa' && equipment.billingType === 'monthly';

  const colorMap = {
      mesa: 'text-cyan-400',
      jukebox: 'text-fuchsia-400',
      grua: 'text-orange-400',
  };

  useEffect(() => {
    if (isOpen) {
      const initialState: FormState = {
        relogioAtual: '',
        totalArrecadadoJukebox: '',
        descontoPartidas: '0',
        aluguelPercentual: String(equipment.aluguelPercentual || ''),
        aluguelValor: String(equipment.aluguelValor || '0').replace('.',','),
        saldo: '',
        quantidadePelucia: String(equipment.quantidadePelucia || ''),
        sobraPelucia: '',
        reposicaoPelucia: String(equipment.reposicaoPelucia || ''),
        recebimentoEspecie: '',
        recebimentoPix: '',
      };
      setFormState(initialState);
      setPaymentValues({ dinheiro: '', pix: '', negativo: ''});
      setError(null);
      setGruaStep(1);
      setMesaStep(1);
      setJukeboxStep(1);
    }
  }, [isOpen, equipment]);

  const calculation = useMemo(() => {
    let result: Partial<Billing> = {};
    const relogioAtual = parseInt(formState.relogioAtual, 10) || 0;
    const relogioAnterior = equipment.relogioAnterior;

    const isInvalidReading = relogioAtual < relogioAnterior;
    
    const partidasJogadas = isInvalidReading ? 0 : relogioAtual - relogioAnterior;

    if (equipment.type === 'mesa') {
      if (equipment.billingType === 'monthly') {
          result = {
            valorTotal: equipment.monthlyFeeValue || 0,
            billingType: 'monthly',
            partidasJogadas: partidasJogadas,
            relogioAnterior: equipment.relogioAnterior,
            relogioAtual: relogioAtual,
          };
      } else {
        const descontoPartidas = parseInt(formState.descontoPartidas || '0', 10);
        const partidasCobradas = Math.max(0, partidasJogadas - descontoPartidas);
        const valorFicha = equipment.valorFicha || 0;
        const valorBruto = partidasCobradas * valorFicha;
        const parteFirma = valorBruto * ((equipment.parteFirma || 0) / 100);
        const parteCliente = valorBruto * ((equipment.parteCliente || 0) / 100);
        result = { billingType: 'perPlay', partidasJogadas, descontoPartidas, partidasCobradas, valorTotal: parteFirma, parteFirma, parteCliente, valorFicha, valorBruto };
      }
    } else if (equipment.type === 'jukebox') {
        const valorBruto = safeParseFloat(formState.totalArrecadadoJukebox);
        const parteFirma = valorBruto * ((equipment.porcentagemJukeboxFirma || 0) / 100);
        const parteCliente = valorBruto * ((equipment.porcentagemJukeboxCliente || 0) / 100);
        
        // This part is for record keeping and will update in step 2
        const relogioAtualJukebox = parseInt(formState.relogioAtual, 10) || 0;
        const partidasJogadasJukebox = (formState.relogioAtual !== '' && relogioAtualJukebox >= equipment.relogioAnterior) 
                                ? relogioAtualJukebox - equipment.relogioAnterior 
                                : 0;

        result = { 
            valorBruto,
            parteFirma, 
            parteCliente, 
            valorTotal: parteFirma,
            partidasJogadas: partidasJogadasJukebox
        };
    } else if (equipment.type === 'grua') {
      const saldo = safeParseFloat(formState.saldo);
      const recebimentoEspecie = safeParseFloat(formState.recebimentoEspecie);
      const recebimentoPix = safeParseFloat(formState.recebimentoPix);
      let aluguelValor = safeParseFloat(formState.aluguelValor);
      
      if(equipment.aluguelPercentual != null){
          aluguelValor = saldo * (equipment.aluguelPercentual / 100);
      }
      
      const valorTotalFirma = saldo - aluguelValor;

      result = { 
          partidasJogadas,
          saldo,
          aluguelValor,
          valorTotal: valorTotalFirma,
          recebimentoEspecie,
          recebimentoPix,
          sobraPelucia: parseInt(formState.sobraPelucia || '0', 10),
          reposicaoPelucia: parseInt(formState.reposicaoPelucia || '0', 10),
          quantidadePelucia: parseInt(formState.quantidadePelucia || '0', 10),
      };
    }
    
    if (result.partidasJogadas === undefined) {
        result.partidasJogadas = partidasJogadas;
    }
    return result;
  }, [formState, equipment]);
  
  const valorTotalParaFirma = useMemo(() => calculation.valorTotal || 0, [calculation]);
  const valorNegativo = useMemo(() => safeParseFloat(paymentValues.negativo), [paymentValues.negativo]);
  const liquidoAReceber = useMemo(() => Math.max(0, valorTotalParaFirma - valorNegativo), [valorTotalParaFirma, valorNegativo]);
  const valorDinheiro = useMemo(() => safeParseFloat(paymentValues.dinheiro), [paymentValues.dinheiro]);
  const valorPix = useMemo(() => safeParseFloat(paymentValues.pix), [paymentValues.pix]);
  const totalPagoEmCaixa = useMemo(() => valorDinheiro + valorPix, [valorDinheiro, valorPix]);
  const remainingAmountLiquido = useMemo(() => liquidoAReceber - totalPagoEmCaixa, [liquidoAReceber, totalPagoEmCaixa]);

  useEffect(() => {
    if ((mesaStep === 2 || jukeboxStep === 2) && equipment.type !== 'grua') {
      const initialTotal = calculation.valorTotal || 0;
      setPaymentValues({ dinheiro: initialTotal > 0 ? initialTotal.toFixed(2).replace('.', ',') : '', pix: '', negativo: '' });
    }
  }, [mesaStep, jukeboxStep, equipment.type, calculation.valorTotal]);
  
  const handleFormChange = useCallback((field: keyof FormState, value: string) => {
    setFormState(prev => {
        const newState = { ...prev, [field]: value };

        if (equipment.type === 'grua') {
            if (['sobraPelucia', 'quantidadePelucia'].includes(field)) {
                const quantidadeTotal = parseInt(newState.quantidadePelucia || '0', 10);
                const sobras = parseInt(newState.sobraPelucia || '0', 10);
                newState.reposicaoPelucia = String(Math.max(0, quantidadeTotal - sobras));
            }

            const relogioAtualNum = parseInt(newState.relogioAtual, 10) || 0;
            const relogioAnteriorNum = equipment.relogioAnterior || 0;
            const saldoBruto = (relogioAtualNum >= relogioAnteriorNum) ? relogioAtualNum - relogioAnteriorNum : 0;
            newState.saldo = String(saldoBruto.toFixed(2).replace('.', ','));

            let aluguelValorNum = safeParseFloat(newState.aluguelValor);
            if (equipment.aluguelPercentual != null) {
                aluguelValorNum = saldoBruto * (equipment.aluguelPercentual / 100);
                newState.aluguelValor = String(aluguelValorNum.toFixed(2).replace('.', ','));
            }
            
            const valorTotalFirma = saldoBruto - aluguelValorNum;
            const recebimentoEspecieNum = safeParseFloat(newState.recebimentoEspecie);
            const pixCalculado = Math.max(0, valorTotalFirma - recebimentoEspecieNum);
            newState.recebimentoPix = String(pixCalculado.toFixed(2).replace('.', ','));
        }
        
        return newState;
    });
  }, [equipment]);

  const handlePaymentChange = useCallback((field: keyof PaymentState, value: string) => {
    setPaymentValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const generateBillingObject = useCallback((): Billing | null => {
    const relogioAtual = parseInt(formState.relogioAtual, 10) || 0;

    if (equipment.type !== 'jukebox' && relogioAtual < equipment.relogioAnterior) {
        return null; // Safeguard for non-jukebox
    }

    let billingData: Partial<Billing>;
    if (equipment.type === 'grua') {
        const recebimentoEspecie = safeParseFloat(formState.recebimentoEspecie);
        const recebimentoPix = safeParseFloat(formState.recebimentoPix);
        let paymentMethod: Billing['paymentMethod'] = 'dinheiro';
        if (recebimentoEspecie > 0 && recebimentoPix > 0) {
            paymentMethod = 'misto';
        } else if (recebimentoPix > 0) {
            paymentMethod = 'pix';
        }
        billingData = {
          paymentMethod,
          recebimentoEspecie: recebimentoEspecie,
          recebimentoPix: recebimentoPix,
        };
    } else {
        const valorPagoDinheiro = safeParseFloat(paymentValues.dinheiro);
        const valorPagoPix = safeParseFloat(paymentValues.pix);
        const valorDebitoNegativo = safeParseFloat(paymentValues.negativo);

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

        // FIX: Constrói o objeto de dados de pagamento condicionalmente para evitar
        // a inclusão de campos com valor 'undefined', que o Firestore rejeita.
        const data: Partial<Billing> = { paymentMethod };
        if (valorPagoDinheiro > 0) data.valorPagoDinheiro = valorPagoDinheiro;
        if (valorPagoPix > 0) data.valorPagoPix = valorPagoPix;
        if (valorDebitoNegativo > 0) data.valorDebitoNegativo = valorDebitoNegativo;
        billingData = data;
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
      partidasJogadas: calculation.partidasJogadas || 0,
    };
  }, [formState, calculation, equipment, customer, paymentValues]);

  const validateAndProceed = useCallback(() => {
    if(equipment.type === 'jukebox') return true;

    if (!formState.relogioAtual && formState.relogioAtual !== '0') {
      setError("Nenhuma leitura inserida. Preencha o campo de Leitura Atual.");
      return false;
    }
    const relogioAtual = parseInt(formState.relogioAtual, 10) || 0;
    if (relogioAtual < equipment.relogioAnterior) {
      setError(`Leitura atual (${relogioAtual}) não pode ser menor que a anterior (${equipment.relogioAnterior}).`);
      return false;
    }
    setError(null);
    return true;
  }, [formState.relogioAtual, equipment.relogioAnterior, equipment.type]);

  const handleProvisionalAction = () => {
    if (!validateAndProceed()) return;
    const billing = generateBillingObject();
    if (billing) {
        onTriggerProvisionalReceiptAction(billing, () => setMesaStep(2));
    }
  };
  
  const handleGoToPayment = () => {
    if (validateAndProceed()) {
        setMesaStep(2);
    }
  };

  const validateJukeboxStep1 = useCallback(() => {
    const valorBruto = safeParseFloat(formState.totalArrecadadoJukebox);
    if (valorBruto <= 0) {
      setError("O total arrecadado deve ser maior que zero.");
      return false;
    }
    setError(null);
    return true;
  }, [formState.totalArrecadadoJukebox]);

  const handleJukeboxNextStep = () => {
      if (validateJukeboxStep1()) {
          setJukeboxStep(2);
      }
  };

  const handleFinalize = () => {
    if (equipment.type === 'jukebox') {
        if (!validateJukeboxStep1()) return;
        const relogioAtual = parseInt(formState.relogioAtual, 10);
        if (isNaN(relogioAtual) || formState.relogioAtual.trim() === '') {
            setError("Por favor, insira a Leitura Atual para confirmação.");
            return;
        }
        if (relogioAtual < equipment.relogioAnterior) {
            setError(`Leitura atual (${relogioAtual}) não pode ser menor que a anterior (${equipment.relogioAnterior}).`);
            return;
        }
    } else {
        if (!validateAndProceed()) return;
    }

    if (equipment.type === 'grua') {
        const recebimentoEspecie = safeParseFloat(formState.recebimentoEspecie);
        const recebimentoPix = safeParseFloat(formState.recebimentoPix);
        const totalRecebido = recebimentoEspecie + recebimentoPix;

        const saldo = safeParseFloat(formState.saldo);
        let aluguelValor = safeParseFloat(formState.aluguelValor);
        if (equipment.aluguelPercentual != null) {
            aluguelValor = saldo * (equipment.aluguelPercentual / 100);
        }
        const baseValorTotalFirma = saldo - aluguelValor;

        if (Math.round(totalRecebido * 100) !== Math.round(baseValorTotalFirma * 100)) {
            setError("O valor recebido (espécie + PIX) deve ser igual ao total calculado para a firma.");
            return;
        }
    } else if (Math.round(remainingAmountLiquido * 100) !== 0) {
      setError("A soma dos pagamentos (Dinheiro, PIX, Negativo) deve ser igual ao valor total para a firma.");
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
  const isJukebox = equipment.type === 'jukebox';
  const isReadingInvalid = (parseInt(formState.relogioAtual, 10) || 0) < equipment.relogioAnterior;

  const renderJukeboxStep1 = () => (
    <div className="space-y-4">
        <FormField 
            label="Total Arrecadado na Jukebox (R$)" 
            name="totalArrecadadoJukebox" 
            value={formState.totalArrecadadoJukebox} 
            type="text" 
            inputMode="decimal"
            equipmentId={equipment.id} 
            onChange={(field, val) => handleFormChange(field, val)} 
            autoFocus 
        />
        {formState.totalArrecadadoJukebox && (
            <div className="mt-6 p-4 bg-slate-900/50 border border-slate-700 rounded-lg space-y-2 text-sm animate-fade-in">
                <h4 className="text-md font-bold text-white mb-3 text-center">Resumo do Rateio</h4>
                <div className="flex justify-between font-bold text-lg text-white">
                    <span>VALOR BRUTO TOTAL:</span>
                    <span className="font-mono">R$ {(calculation.valorBruto || 0).toFixed(2).replace('.', ',')}</span>
                </div>
                <hr className="border-dashed border-slate-600 my-2" />
                <div className="flex justify-between text-slate-300">
                    <span>Parte Cliente ({equipment.porcentagemJukeboxCliente}%):</span>
                    <span className="font-mono">R$ {(calculation.parteCliente || 0).toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between font-bold text-lime-400">
                    <span>Parte Firma ({equipment.porcentagemJukeboxFirma}%):</span>
                    <span className="font-mono">R$ {(calculation.parteFirma || 0).toFixed(2).replace('.', ',')}</span>
                </div>
            </div>
        )}
    </div>
  );

  const renderJukeboxStep2 = () => (
      <div className="space-y-4 animate-fade-in">
          <div>
              <h4 className="text-md font-bold text-lime-400">Leitura Anterior: {equipment.relogioAnterior}</h4>
              <FormField 
                  label="Leitura Atual (Confirmação)" 
                  name="relogioAtual" 
                  value={formState.relogioAtual} 
                  type="number" 
                  inputMode="numeric"
                  equipmentId={equipment.id}
                  isReadingInvalid={isReadingInvalid && !!formState.relogioAtual}
                  onChange={(field, val) => handleFormChange(field, val)}
              />
              <p className="text-xs text-slate-400 mt-1">Este valor é apenas para registro e não afeta o cálculo financeiro.</p>
          </div>
          <hr className="border-slate-700" />
          <h4 className="block text-md font-bold text-lime-400 mb-2">Pagamento</h4>
          <PaymentField label="Deixar Negativo (R$)" name="negativo" value={paymentValues.negativo} onChange={handlePaymentChange} />
          {valorNegativo > 0 && (
              <div className="text-right py-2 border-t border-b border-slate-700">
                  <p className="text-slate-400">Líquido a Receber: <span className="font-mono font-bold text-sky-400 text-lg">R$ {liquidoAReceber.toFixed(2).replace('.', ',')}</span></p>
              </div>
          )}
          <PaymentField label="Valor em Dinheiro (R$)" name="dinheiro" value={paymentValues.dinheiro} onChange={handlePaymentChange} />
          <PaymentField label="Valor em PIX (R$)" name="pix" value={paymentValues.pix} onChange={handlePaymentChange} />
          {Math.round(remainingAmountLiquido * 100) !== 0 && (
              <div className={`mt-2 text-center text-sm p-2 rounded-md ${remainingAmountLiquido > 0 ? 'bg-amber-900/50 text-amber-300' : 'bg-red-900/50 text-red-300'}`}>
                  {remainingAmountLiquido > 0 ? `Falta alocar: R$ ${remainingAmountLiquido.toFixed(2).replace('.', ',')}` : `Valor excedido: R$ ${Math.abs(remainingAmountLiquido).toFixed(2).replace('.', ',')}`}
              </div>
          )}
      </div>
  );

  const renderGruaStep1 = () => (
    <div className="space-y-4">
      <h4 className="text-md font-bold text-lime-400">Leitura Anterior: {equipment.relogioAnterior}</h4>
      <FormField label="Leitura Atual" name="relogioAtual" value={formState.relogioAtual} type="number" inputMode="numeric" equipmentId={equipment.id} isReadingInvalid={isReadingInvalid} onChange={(field, val) => handleFormChange(field, val)} autoFocus/>
      <FormField label="Saldo Bruto (R$)" name="saldo" value={formState.saldo} type="text" inputMode="decimal" equipmentId={equipment.id} onChange={(field, val) => handleFormChange(field, val)} readOnly />
      {equipment.aluguelPercentual != null ? (
        <>
            <FormField label="Aluguel (%)" name="aluguelPercentual" value={formState.aluguelPercentual} type="number" inputMode="numeric" equipmentId={equipment.id} onChange={(field, val) => handleFormChange(field, val)} readOnly/>
            <FormField label="Aluguel Calculado (R$)" name="aluguelValor" value={formState.aluguelValor} type="text" inputMode="decimal" equipmentId={equipment.id} onChange={(field, val) => handleFormChange(field, val)} readOnly />
        </>
      ) : (
        <FormField label="Aluguel Fixo (R$)" name="aluguelValor" value={formState.aluguelValor} type="text" inputMode="decimal" equipmentId={equipment.id} onChange={(field, val) => handleFormChange(field, val)} />
      )}
    </div>
  );

  const renderGruaStep2 = () => (
    <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg space-y-2 text-sm animate-fade-in">
        <h4 className="text-lg font-bold text-white mb-3 text-center">Conferência para o Cliente</h4>
        <div className="flex justify-between text-slate-300 text-base">
            <span>Saldo Bruto:</span>
            <span className="font-mono">R$ {(calculation.saldo || 0).toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="flex justify-between text-slate-300 text-base">
            <span>Parte da Firma:</span>
            <span className="font-mono text-amber-400">- R$ {(calculation.valorTotal || 0).toFixed(2).replace('.', ',')}</span>
        </div>
        <hr className="border-dashed border-slate-600 my-2" />
        <div className="flex justify-between font-bold text-xl text-lime-400">
            <span>TOTAL PARA O CLIENTE:</span>
            <span className="font-mono">R$ {(calculation.aluguelValor || 0).toFixed(2).replace('.', ',')}</span>
        </div>
    </div>
  );
  
  const renderGruaStep3 = () => (
      <div className="space-y-4">
          <h4 className="text-md font-bold text-lime-400">Detalhes Finais</h4>
          <FormField label="Recebido em Espécie (R$)" name="recebimentoEspecie" value={formState.recebimentoEspecie} type="text" inputMode="decimal" equipmentId={equipment.id} onChange={(field, val) => handleFormChange(field, val)} />
          <FormField label="Recebido em PIX (R$)" name="recebimentoPix" value={formState.recebimentoPix} type="text" inputMode="decimal" equipmentId={equipment.id} onChange={(field, val) => handleFormChange(field, val)} readOnly />
          <div className="col-span-2 pt-2"><hr className="border-slate-700" /></div>
          <FormField label="Qtd. Pelúcias (Capacidade)" name="quantidadePelucia" value={formState.quantidadePelucia} type="number" inputMode="numeric" equipmentId={equipment.id} onChange={(field, val) => handleFormChange(field, val)} />
          <FormField label="Sobra de Pelúcias" name="sobraPelucia" value={formState.sobraPelucia} type="number" inputMode="numeric" equipmentId={equipment.id} onChange={(field, val) => handleFormChange(field, val)} />
          <FormField label="Reposição (Automático)" name="reposicaoPelucia" value={formState.reposicaoPelucia} type="number" inputMode="numeric" equipmentId={equipment.id} onChange={(field, val) => handleFormChange(field, val)} readOnly />
      </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">
            Faturamento: <span className={`${colorMap[equipment.type]} capitalize`}>{equipment.type}</span> {equipment.numero}
          </h2>
          <p className="text-slate-400 break-words">Cliente: {customer.name}</p>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
          {isGrua ? (
            <>
              {gruaStep === 1 && renderGruaStep1()}
              {gruaStep === 2 && renderGruaStep2()}
              {gruaStep === 3 && renderGruaStep3()}
            </>
          ) : isJukebox ? (
             <>
              {jukeboxStep === 1 && renderJukeboxStep1()}
              {jukeboxStep === 2 && renderJukeboxStep2()}
            </>
          ) : (
             mesaStep === 1 ? (
                <div className="space-y-4">
                  <h4 className="text-md font-bold text-lime-400">Leitura Anterior: {equipment.relogioAnterior}</h4>
                  <FormField label="Leitura Atual" name="relogioAtual" value={formState.relogioAtual} type="number" inputMode="numeric" equipmentId={equipment.id} isReadingInvalid={isReadingInvalid} onChange={(field, val) => handleFormChange(field, val)} autoFocus/>
                  {equipment.type === 'mesa' && !isMonthlyFee && <FormField label="Desconto (Partidas)" name="descontoPartidas" value={formState.descontoPartidas} type="number" inputMode="numeric" equipmentId={equipment.id} onChange={(field, val) => handleFormChange(field, val)} />}
                  
                  {equipment.type === 'mesa' && !isMonthlyFee && !isReadingInvalid && formState.relogioAtual && (
                    <div className="mt-6 p-4 bg-slate-900/50 border border-slate-700 rounded-lg space-y-2 text-sm animate-fade-in">
                      <h4 className="text-md font-bold text-white mb-3 text-center">Resumo do Cálculo</h4>
                      <div className="flex justify-between text-slate-300"><span>Leitura Anterior:</span><span className="font-mono">{equipment.relogioAnterior}</span></div>
                      <div className="flex justify-between text-slate-300"><span>Leitura Atual:</span><span className="font-mono">{parseInt(formState.relogioAtual, 10) || 0}</span></div>
                      <hr className="border-slate-700/50 my-2" /><div className="flex justify-between text-slate-300"><span>Total de Fichas:</span><span className="font-mono">{calculation.partidasJogadas || 0}</span></div>
                      <div className="flex justify-between text-slate-300"><span>Desconto (Fichas):</span><span className="font-mono text-amber-400">-{calculation.descontoPartidas || 0}</span></div>
                      <div className="flex justify-between font-semibold text-white"><span>Fichas Cobradas:</span><span className="font-mono">{calculation.partidasCobradas || 0}</span></div>
                      <div className="flex justify-between text-slate-300"><span>Valor da Ficha:</span><span className="font-mono">R$ {(calculation.valorFicha || 0).toFixed(2).replace('.', ',')}</span></div>
                      <hr className="border-dashed border-slate-600 my-2" /><div className="flex justify-between font-bold text-lg text-white"><span>VALOR BRUTO TOTAL:</span><span className="font-mono">R$ {(calculation.valorBruto || 0).toFixed(2).replace('.', ',')}</span></div>
                      <hr className="border-slate-700/50 my-2" /><div className="flex justify-between text-slate-300"><span>Parte Cliente ({equipment.parteCliente}%):</span><span className="font-mono">R$ {(calculation.parteCliente || 0).toFixed(2).replace('.', ',')}</span></div>
                      <div className="flex justify-between font-bold text-lime-400"><span>Parte Firma ({equipment.parteFirma}%):</span><span className="font-mono">R$ {(calculation.parteFirma || 0).toFixed(2).replace('.', ',')}</span></div>
                    </div>
                  )}

                  {equipment.type === 'mesa' && isMonthlyFee && !isReadingInvalid && formState.relogioAtual && (
                    <div className="mt-6 p-4 bg-slate-900/50 border border-slate-700 rounded-lg space-y-2 text-sm animate-fade-in">
                        <h4 className="text-md font-bold text-white mb-3 text-center">Resumo do Mês</h4>
                        <div className="flex justify-between text-slate-300"><span>Partidas Jogadas no Período:</span><span className="font-mono">{calculation.partidasJogadas || 0}</span></div>
                        <hr className="border-dashed border-slate-600 my-2" />
                        <div className="flex justify-between font-bold text-lg text-lime-400"><span>VALOR MENSAL FIXO:</span><span className="font-mono">R$ {(calculation.valorTotal || 0).toFixed(2).replace('.', ',')}</span></div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <h4 className="block text-md font-bold text-lime-400 mb-2">Observações e Pagamento Dividido</h4>
                  <PaymentField label="Deixar Negativo (R$)" name="negativo" value={paymentValues.negativo} onChange={handlePaymentChange} />
                  
                  {valorNegativo > 0 && (
                    <div className="text-right py-2 border-t border-b border-slate-700">
                        <p className="text-slate-400">Líquido a Receber: <span className="font-mono font-bold text-sky-400 text-lg">R$ {liquidoAReceber.toFixed(2).replace('.', ',')}</span></p>
                    </div>
                  )}

                  <PaymentField label="Valor em Dinheiro (R$)" name="dinheiro" value={paymentValues.dinheiro} onChange={handlePaymentChange} />
                  <PaymentField label="Valor em PIX (R$)" name="pix" value={paymentValues.pix} onChange={handlePaymentChange} />
                  
                  {Math.round(remainingAmountLiquido * 100) !== 0 && (
                      <div className={`mt-2 text-center text-sm p-2 rounded-md ${remainingAmountLiquido > 0 ? 'bg-amber-900/50 text-amber-300' : 'bg-red-900/50 text-red-300'}`}>
                          {remainingAmountLiquido > 0 ? `Falta alocar: R$ ${remainingAmountLiquido.toFixed(2).replace('.', ',')}` : `Valor excedido: R$ ${Math.abs(remainingAmountLiquido).toFixed(2).replace('.', ',')}`}
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
                <p className="text-slate-400">Total para a Firma: <span className="font-mono font-bold text-lime-400 text-lg">R$ {valorTotalParaFirma.toFixed(2).replace('.', ',')}</span></p>
            </div>
            <div className="flex justify-end gap-4">
              <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">Cancelar</button>
              
              {isGrua ? (
                <>
                  {gruaStep > 1 && <button onClick={handleGruaPrevStep} className="bg-slate-500 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-400">Voltar</button>}
                  {gruaStep === 1 && <button onClick={handleGruaNextStep} className="bg-sky-600 text-white font-bold py-2 px-6 rounded-md hover:bg-sky-500">Avançar</button>}
                  {gruaStep === 2 && <button onClick={handleGruaNextStep} className="bg-sky-600 text-white font-bold py-2 px-6 rounded-md hover:bg-sky-500">Confirmar e Continuar</button>}
                  {gruaStep === 3 && <button onClick={handleFinalize} className="bg-lime-500 text-white font-bold py-2 px-6 rounded-md hover:bg-lime-600">Finalizar Cobrança</button>}
                </>
              ) : isJukebox ? (
                 <>
                    {jukeboxStep === 1 && (
                      <button onClick={handleJukeboxNextStep} className="inline-flex items-center gap-2 bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-500">
                          Ir para Pagamento &rarr;
                      </button>
                    )}
                    {jukeboxStep === 2 && (
                      <>
                        <button onClick={() => setJukeboxStep(1)} className="bg-slate-500 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-400">&larr; Voltar</button>
                        <button 
                          onClick={handleFinalize} 
                          disabled={!!error || Math.round(remainingAmountLiquido * 100) !== 0}
                          className="bg-lime-500 text-white font-bold py-2 px-6 rounded-md hover:bg-lime-600 disabled:bg-slate-500 disabled:cursor-not-allowed"
                        >
                          Finalizar Cobrança
                        </button>
                      </>
                    )}
                 </>
              ) : (
                 mesaStep === 1 ? (
                  <>
                    <button onClick={handleProvisionalAction} className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-500">
                        Imprimir Via Cliente
                    </button>
                    <button onClick={handleGoToPayment} className="inline-flex items-center gap-2 bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-500">
                        Ir para Pagamento &rarr;
                    </button>
                  </>
                 ) : (
                  <>
                    <button onClick={() => setMesaStep(1)} className="bg-slate-500 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-400">&larr; Voltar</button>
                    <button 
                      onClick={handleFinalize} 
                      disabled={Math.round(remainingAmountLiquido * 100) !== 0}
                      className="bg-lime-500 text-white font-bold py-2 px-6 rounded-md hover:bg-lime-600 disabled:bg-slate-500 disabled:cursor-not-allowed"
                    >
                      Finalizar Cobrança
                    </button>
                  </>
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