// components/BillingModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Customer, Equipment } from '../types';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { BilliardIcon } from './icons/BilliardIcon';
import { JukeboxIcon } from './icons/JukeboxIcon';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    equipmentId: string;
    relogioAtual: number;
    descontoPartidas: number;
    paymentMethod: 'pix' | 'dinheiro' | 'fiado';
  }) => void;
  customer: Customer;
}

const BillingModal: React.FC<BillingModalProps> = ({ isOpen, onClose, onConfirm, customer }) => {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [relogioAtual, setRelogioAtual] = useState('');
  const [descontoPartidas, setDescontoPartidas] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro' | 'fiado'>('dinheiro');

  useEffect(() => {
    if (isOpen) {
      setRelogioAtual('');
      setDescontoPartidas('0');
      setPaymentMethod('dinheiro');
      // Pre-select the first available equipment
      if (customer.equipment && customer.equipment.length > 0) {
        setSelectedEquipmentId(customer.equipment[0].id);
      } else {
        setSelectedEquipmentId(null);
      }
    }
  }, [isOpen, customer]);

  if (!isOpen) return null;
  
  const selectedEquipment = customer.equipment.find(e => e.id === selectedEquipmentId);

  const relogioAtualNum = parseInt(relogioAtual, 10) || 0;
  const descontoPartidasNum = parseInt(descontoPartidas, 10) || 0;

  let relogioAnterior = 0;
  let partidasJogadas = 0;
  let partidasCobradas = 0;
  let valorBruto = 0;
  let parteFirma = 0;
  let parteCliente = 0;
  let discountError = false;

  if (selectedEquipment) {
    relogioAnterior = selectedEquipment.relogioAnterior;
    if (selectedEquipment.type === 'mesa') {
      partidasJogadas = relogioAtualNum > relogioAnterior ? relogioAtualNum - relogioAnterior : 0;
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
      partidasJogadas = relogioAtualNum > relogioAnterior ? relogioAtualNum - relogioAnterior : 0;
      valorBruto = partidasJogadas; // Assuming 1 pulse = R$1.00 for jukebox
      parteFirma = valorBruto * ((selectedEquipment.porcentagemJukeboxFirma || 0) / 100);
      parteCliente = valorBruto * ((selectedEquipment.porcentagemJukeboxCliente || 0) / 100);
    }
  }


  const isConfirmDisabled = !selectedEquipmentId || relogioAtualNum <= relogioAnterior || discountError;

  const handleConfirm = useCallback(() => {
    if (isConfirmDisabled || !selectedEquipmentId) return;
    onConfirm({
      equipmentId: selectedEquipmentId,
      relogioAtual: relogioAtualNum,
      descontoPartidas: selectedEquipment?.type === 'mesa' ? descontoPartidasNum : 0,
      paymentMethod,
    });
  }, [isConfirmDisabled, selectedEquipmentId, onConfirm, relogioAtualNum, descontoPartidasNum, paymentMethod, selectedEquipment]);

  const PaymentButton = ({ method, label }: { method: 'pix' | 'dinheiro' | 'fiado', label: string }) => (
    <button
        onClick={() => setPaymentMethod(method)}
        className={`flex-1 p-3 rounded-md text-center transition-all text-sm font-bold ${paymentMethod === method ? 'bg-emerald-600 text-white shadow' : 'bg-slate-700 hover:bg-slate-600'}`}
    >
        {label}
    </button>
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="billing-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg border border-slate-700 animate-fade-in-up">
        <div className="p-6 border-b border-slate-700">
          <h2 id="billing-modal-title" className="text-2xl font-bold text-white">Realizar Cobrança</h2>
          <p className="text-slate-400">Cliente: {customer.name}</p>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Selecione o Equipamento</label>
            <div className="space-y-2">
                {customer.equipment?.map(equip => (
                    <button key={equip.id} onClick={() => setSelectedEquipmentId(equip.id)} className={`w-full p-3 rounded-md text-left transition-all flex items-center gap-3 ${selectedEquipmentId === equip.id ? 'bg-sky-600 text-white shadow' : 'bg-slate-700 hover:bg-slate-600'}`}>
                      {equip.type === 'mesa' ? <BilliardIcon className="w-6 h-6" /> : <JukeboxIcon className="w-6 h-6" />}
                      <div>
                        <p className="font-bold capitalize">{equip.type === 'mesa' ? 'Mesa de Sinuca' : 'Jukebox'}</p>
                        <p className="text-xs">Nº: {equip.numero} / Relógio: {equip.relogioNumero}</p>
                      </div>
                    </button>
                ))}
            </div>
            {(!customer.equipment || customer.equipment.length === 0) && <p className="text-red-400 text-sm mt-2">Nenhum equipamento cadastrado para este cliente.</p>}
          </div>

          {selectedEquipment && (
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
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Método de Pagamento</label>
                <div className="flex gap-2">
                    <PaymentButton method="dinheiro" label="Dinheiro" />
                    <PaymentButton method="pix" label="PIX" />
                    <PaymentButton method="fiado" label="Fiado" />
                </div>
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
        </div>
        <div className="p-6 bg-slate-800/50 rounded-b-lg flex justify-end gap-4">
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