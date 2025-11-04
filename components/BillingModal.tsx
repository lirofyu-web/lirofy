// components/BillingModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Customer, Equipment } from '../types';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { BilliardIcon } from './icons/BilliardIcon';
import { JukeboxIcon } from './icons/JukeboxIcon';
import { CraneIcon } from './icons/CraneIcon';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    equipmentId: string;
    relogioAtual: number;
    paymentMethod: 'pix' | 'dinheiro' | 'fiado';
    descontoPartidas?: number;
    aluguelPercentual?: number;
    aluguelValor?: number;
    saldo?: number;
    quantidadePelucia?: number;
    sobraPelucia?: number;
    reposicaoPelucia?: number;
    recebimentoEspecie?: number;
    recebimentoPix?: number;
  }) => void;
  customer: Customer;
}

const BillingModal: React.FC<BillingModalProps> = ({ isOpen, onClose, onConfirm, customer }) => {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  
  // States for Mesa/Jukebox
  const [relogioAtual, setRelogioAtual] = useState('');
  const [descontoPartidas, setDescontoPartidas] = useState('0');
  
  // States for Grua
  const [gruaState, setGruaState] = useState({
      relogioAtual: '',
      sobraPelucia: '0',
      recebimentoEspecie: '0',
  });

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro' | 'fiado'>('dinheiro');

  const selectedEquipment = customer.equipment?.find(e => e.id === selectedEquipmentId);

  useEffect(() => {
    if (isOpen) {
      // Reset common fields
      setPaymentMethod('dinheiro');

      // Pre-select the first equipment and set initial states
      const firstEquipment = customer.equipment?.[0];
      if (firstEquipment) {
        setSelectedEquipmentId(firstEquipment.id);
        if (firstEquipment.type === 'grua') {
            setGruaState({
                relogioAtual: '',
                sobraPelucia: '0',
                recebimentoEspecie: '0'
            });
        } else {
            setRelogioAtual('');
            setDescontoPartidas('0');
        }
      } else {
        setSelectedEquipmentId(null);
      }
    }
  }, [isOpen, customer]);

  const relogioAnterior = selectedEquipment?.relogioAnterior || 0;

  // Calculations for Mesa/Jukebox
  const relogioAtualNum = parseInt(relogioAtual, 10) || 0;
  const descontoPartidasNum = parseInt(descontoPartidas, 10) || 0;
  
  let partidasJogadas = 0, partidasCobradas = 0, valorBruto = 0, parteFirma = 0, parteCliente = 0, discountError = false;

  if (selectedEquipment && (selectedEquipment.type === 'mesa' || selectedEquipment.type === 'jukebox')) {
      partidasJogadas = relogioAtualNum > relogioAnterior ? relogioAtualNum - relogioAnterior : 0;
      if (selectedEquipment.type === 'mesa') {
          if (descontoPartidasNum > partidasJogadas) {
              discountError = true;
              partidasCobradas = 0;
          } else {
              partidasCobradas = partidasJogadas - descontoPartidasNum;
          }
          valorBruto = partidasCobradas * (selectedEquipment.valorFicha || 0);
          parteFirma = valorBruto * ((selectedEquipment.parteFirma || 0) / 100);
          parteCliente = valorBruto * ((selectedEquipment.parteCliente || 0) / 100);
      } else { // Jukebox
          valorBruto = partidasJogadas;
          parteFirma = valorBruto * ((selectedEquipment.porcentagemJukeboxFirma || 0) / 100);
          parteCliente = valorBruto * ((selectedEquipment.porcentagemJukeboxCliente || 0) / 100);
      }
  }

  // Calculations for Grua
  const gruaRelogioAtualNum = parseInt(gruaState.relogioAtual, 10) || 0;
  const gruaSobraPeluciaNum = parseInt(gruaState.sobraPelucia, 10) || 0;
  const gruaRecebimentoEspecieNum = parseFloat(gruaState.recebimentoEspecie.replace(',', '.')) || 0;

  let saldoRS = 0, clienteShareRS = 0, firmaShareRS = 0, reposicaoPelucia = 0, recebimentoPixRS = 0, sobraError = false, recebimentoError = false;

  if (selectedEquipment?.type === 'grua') {
      saldoRS = gruaRelogioAtualNum > relogioAnterior ? gruaRelogioAtualNum - relogioAnterior : 0;
      const aluguelPercentual = selectedEquipment.aluguelPercentual || 0;
      // 'aluguelValor' is the amount paid TO the client
      clienteShareRS = saldoRS * (aluguelPercentual / 100); 
      firmaShareRS = saldoRS - clienteShareRS;

      const quantidadePeluciaAnterior = selectedEquipment.quantidadePelucia || 0;
      if (gruaSobraPeluciaNum > quantidadePeluciaAnterior) {
          sobraError = true;
          reposicaoPelucia = 0;
      } else {
          reposicaoPelucia = quantidadePeluciaAnterior - gruaSobraPeluciaNum;
      }
      
      if (gruaRecebimentoEspecieNum > firmaShareRS) {
         recebimentoError = true;
         recebimentoPixRS = 0;
      } else {
         recebimentoPixRS = firmaShareRS - gruaRecebimentoEspecieNum;
      }
  }

  const isConfirmDisabled = !selectedEquipmentId || 
    (selectedEquipment?.type !== 'grua' && (relogioAtualNum <= relogioAnterior || discountError)) ||
    (selectedEquipment?.type === 'grua' && (gruaRelogioAtualNum <= relogioAnterior || sobraError || recebimentoError));

  const handleConfirm = useCallback(() => {
    if (isConfirmDisabled || !selectedEquipmentId || !selectedEquipment) return;
    
    if (selectedEquipment.type === 'grua') {
        onConfirm({
            equipmentId: selectedEquipmentId,
            relogioAtual: gruaRelogioAtualNum,
            paymentMethod: 'dinheiro', // Not applicable in the same way, but required by type
            aluguelPercentual: selectedEquipment.aluguelPercentual,
            aluguelValor: clienteShareRS, // This is now the client's share
            saldo: saldoRS,
            quantidadePelucia: selectedEquipment.quantidadePelucia,
            sobraPelucia: gruaSobraPeluciaNum,
            reposicaoPelucia: reposicaoPelucia,
            recebimentoEspecie: gruaRecebimentoEspecieNum,
            recebimentoPix: recebimentoPixRS,
        });
    } else {
        onConfirm({
          equipmentId: selectedEquipmentId,
          relogioAtual: relogioAtualNum,
          descontoPartidas: selectedEquipment.type === 'mesa' ? descontoPartidasNum : 0,
          paymentMethod,
        });
    }
  }, [isConfirmDisabled, selectedEquipmentId, onConfirm, relogioAtualNum, descontoPartidasNum, paymentMethod, selectedEquipment, gruaRelogioAtualNum, clienteShareRS, saldoRS, gruaSobraPeluciaNum, reposicaoPelucia, gruaRecebimentoEspecieNum, recebimentoPixRS]);

  const handleGruaStateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setGruaState(prev => ({...prev, [name]: value}));
  }, []);
  
  const handleGruaCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^0-9,]/g, '');
    const parts = value.split(',');
    if (parts.length > 2) {
        value = parts[0] + ',' + parts.slice(1).join('');
    }
    setGruaState(prev => ({...prev, recebimentoEspecie: value}));
  };

  if (!isOpen) return null;

  const PaymentButton = ({ method, label, hidden = false }: { method: 'pix' | 'dinheiro' | 'fiado', label: string, hidden?: boolean }) => {
    if (hidden) return null;
    return (
        <button
            onClick={() => setPaymentMethod(method)}
            className={`flex-1 p-3 rounded-md text-center transition-all text-sm font-bold ${paymentMethod === method ? 'bg-emerald-600 text-white shadow' : 'bg-slate-700 hover:bg-slate-600'}`}
        >
            {label}
        </button>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="billing-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg border border-slate-700 animate-fade-in-up max-h-[95vh] flex flex-col">
        <div className="p-6 border-b border-slate-700 flex-shrink-0">
          <h2 id="billing-modal-title" className="text-2xl font-bold text-white">Realizar Cobrança</h2>
          <p className="text-slate-400">Cliente: {customer.name}</p>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Selecione o Equipamento</label>
            <div className="space-y-2">
                {customer.equipment?.map(equip => (
                    <button key={equip.id} onClick={() => setSelectedEquipmentId(equip.id)} className={`w-full p-3 rounded-md text-left transition-all flex items-center gap-3 ${selectedEquipmentId === equip.id ? 'bg-sky-600 text-white shadow' : 'bg-slate-700 hover:bg-slate-600'}`}>
                      {equip.type === 'mesa' ? <BilliardIcon className="w-6 h-6" /> : 
                       equip.type === 'jukebox' ? <JukeboxIcon className="w-6 h-6" /> : 
                       <CraneIcon className="w-6 h-6" />}
                      <div>
                        <p className="font-bold capitalize">{equip.type === 'mesa' ? 'Mesa de Sinuca' : equip.type === 'jukebox' ? 'Jukebox' : 'Grua de Pelúcia'}</p>
                        <p className="text-xs">Nº: {equip.numero} / Relógio: {equip.relogioNumero}</p>
                      </div>
                    </button>
                ))}
            </div>
            {(!customer.equipment || customer.equipment.length === 0) && <p className="text-red-400 text-sm mt-2">Nenhum equipamento cadastrado para este cliente.</p>}
          </div>

          {selectedEquipment && selectedEquipment.type !== 'grua' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="relogioAnterior" className="block text-sm font-medium text-slate-300 mb-1">Leitura Anterior</label>
                  <input type="text" id="relogioAnterior" value={relogioAnterior} disabled className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-slate-400" />
                </div>
                <div>
                  <label htmlFor="relogioAtual" className="block text-sm font-medium text-slate-300 mb-1">Leitura Atual</label>
                  <input type="number" id="relogioAtual" value={relogioAtual} onChange={(e) => setRelogioAtual(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                {selectedEquipment.type === 'mesa' && (
                  <div className="col-span-2">
                    <label htmlFor="descontoPartidas" className="block text-sm font-medium text-slate-300 mb-1">Partidas de Desconto</label>
                    <input type="number" id="descontoPartidas" value={descontoPartidas} onChange={(e) => setDescontoPartidas(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    {discountError && <p className="text-red-400 text-xs mt-1">O desconto não pode ser maior que as partidas jogadas ({partidasJogadas}).</p>}
                  </div>
                )}
              </div>
              
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-2">
                <h4 className="font-semibold text-white">Resumo da Cobrança</h4>
                {selectedEquipment.type === 'mesa' && (
                  <>
                    <p className="flex justify-between text-sm text-slate-300"><span>Partidas Jogadas:</span> <span className="font-mono">{partidasJogadas}</span></p>
                    <p className="flex justify-between text-sm text-slate-300"><span>Partidas Cobradas:</span> <span className="font-mono">{partidasCobradas}</span></p>
                    <p className="flex justify-between text-sm text-slate-300"><span>Valor por Ficha:</span> <span className="font-mono">R$ {selectedEquipment.valorFicha?.toFixed(2)}</span></p>
                  </>
                )}
                <p className="flex justify-between text-sm text-slate-300"><span>Valor Bruto Cobrado:</span> <span className="font-mono">R$ {valorBruto.toFixed(2)}</span></p>
                <p className="flex justify-between text-sm text-slate-400"><span>Parte do Cliente ({selectedEquipment.type === 'mesa' ? selectedEquipment.parteCliente : selectedEquipment.porcentagemJukeboxCliente}%):</span> <span className="font-mono">R$ {parteCliente.toFixed(2)}</span></p>
                <p className="flex justify-between text-lg text-white font-bold border-t border-slate-600 pt-2"><span>Valor p/ Firma ({selectedEquipment.type === 'mesa' ? selectedEquipment.parteFirma : selectedEquipment.porcentagemJukeboxFirma}%):</span> <span className="font-mono text-emerald-400">R$ {parteFirma.toFixed(2)}</span></p>
              </div>
            </>
          )}

           {selectedEquipment && selectedEquipment.type === 'grua' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-300 mb-1">Leitura Anterior</label><input type="text" value={relogioAnterior} disabled className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-slate-400" /></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-1">Leitura Atual</label><input type="number" name="relogioAtual" value={gruaState.relogioAtual} onChange={handleGruaStateChange} required className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-1">Qtd. Pelúcias (Anterior)</label><input type="text" value={selectedEquipment.quantidadePelucia} disabled className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-slate-400" /></div>
                <div><label className="block text-sm font-medium text-slate-300 mb-1">Sobra de Pelúcias</label><input type="number" name="sobraPelucia" value={gruaState.sobraPelucia} onChange={handleGruaStateChange} required className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                <div className="col-span-2"><label className="block text-sm font-medium text-slate-300 mb-1">Recebimento em Espécie (R$)</label><input type="text" name="recebimentoEspecie" value={gruaState.recebimentoEspecie} onChange={handleGruaCurrencyChange} inputMode="decimal" required className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                {sobraError && <p className="col-span-2 text-red-400 text-xs text-center">A sobra não pode ser maior que a quantidade anterior.</p>}
                {recebimentoError && <p className="col-span-2 text-red-400 text-xs text-center">O recebimento em espécie não pode ser maior que o valor da firma.</p>}
              </div>
               <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 space-y-2">
                  <h4 className="font-semibold text-white">Resumo da Cobrança (Grua)</h4>
                  <p className="flex justify-between text-sm text-slate-300"><span>Saldo Bruto (Fichas):</span> <span className="font-mono">R$ {saldoRS.toFixed(2)}</span></p>
                  <p className="flex justify-between text-sm text-slate-300"><span>Reposição de Pelúcias:</span> <span className="font-mono">{reposicaoPelucia}</span></p>
                  <p className="flex justify-between text-sm text-slate-300"><span>Recebimento PIX (Calculado):</span> <span className="font-mono">R$ {recebimentoPixRS.toFixed(2)}</span></p>
                  <p className="flex justify-between text-sm text-slate-400 pt-2 border-t border-slate-600"><span>Aluguel (Pago ao Cliente {selectedEquipment.aluguelPercentual}%):</span> <span className="font-mono">R$ {clienteShareRS.toFixed(2)}</span></p>
                  <p className="flex justify-between text-lg text-white font-bold"><span>Valor p/ Firma:</span> <span className="font-mono text-emerald-400">R$ {firmaShareRS.toFixed(2)}</span></p>
              </div>
            </>
          )}

           {selectedEquipment && selectedEquipment.type !== 'grua' && (
             <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Método de Pagamento</label>
                <div className="flex gap-2">
                    <PaymentButton method="dinheiro" label="Dinheiro" />
                    <PaymentButton method="pix" label="PIX" />
                    <PaymentButton method="fiado" label="Fiado" hidden={selectedEquipment.type === 'grua'} />
                </div>
              </div>
           )}

        </div>
        <div className="p-6 bg-slate-800/50 rounded-b-lg flex justify-end gap-4 flex-shrink-0">
          <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500 transition-colors">Cancelar</button>
          <button onClick={handleConfirm} disabled={isConfirmDisabled} className="bg-emerald-600 text-white font-bold py-2 px-6 rounded-md hover:bg-emerald-500 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed inline-flex items-center gap-2">
            <CurrencyDollarIcon className="w-5 h-5" />
            Confirmar Cobrança
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

export default BillingModal;