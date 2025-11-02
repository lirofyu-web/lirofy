// components/BillingModal.tsx
import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { BilliardIcon } from './icons/BilliardIcon';
import { JukeboxIcon } from './icons/JukeboxIcon';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    equipment: 'mesa' | 'jukebox';
    relogioAtual: number;
    descontoPartidas: number;
    paymentMethod: 'pix' | 'dinheiro' | 'fiado';
  }) => void;
  customer: Customer;
}

const BillingModal: React.FC<BillingModalProps> = ({ isOpen, onClose, onConfirm, customer }) => {
  const [equipment, setEquipment] = useState<'mesa' | 'jukebox'>('mesa');
  const [relogioAtual, setRelogioAtual] = useState('');
  const [descontoPartidas, setDescontoPartidas] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro' | 'fiado'>('dinheiro');

  useEffect(() => {
    if (isOpen) {
      setRelogioAtual('');
      setDescontoPartidas('0');
      setPaymentMethod('dinheiro');
      // Default to mesa if available, otherwise jukebox
      if (customer.mesaNumero && customer.relogioMesaNumero) {
        setEquipment('mesa');
      } else if (customer.jukeboxNumero && customer.relogioJukeboxNumero) {
        setEquipment('jukebox');
      }
    }
  }, [isOpen, customer]);

  if (!isOpen) return null;

  const relogioAtualNum = parseInt(relogioAtual, 10) || 0;
  const descontoPartidasNum = parseInt(descontoPartidas, 10) || 0;

  let relogioAnterior = 0;
  let partidasJogadas = 0;
  let partidasCobradas = 0;
  let valorTotal = 0;
  let parteFirma = 0;
  let parteCliente = 0;
  
  const canSettleMesa = !!(customer.mesaNumero && customer.relogioMesaNumero);
  const canSettleJukebox = !!(customer.jukeboxNumero && customer.relogioJukeboxNumero);

  if (equipment === 'mesa') {
    relogioAnterior = customer.relogioMesaAnterior;
    partidasJogadas = relogioAtualNum > relogioAnterior ? relogioAtualNum - relogioAnterior : 0;
    partidasCobradas = partidasJogadas > descontoPartidasNum ? partidasJogadas - descontoPartidasNum : 0;
    valorTotal = partidasCobradas * customer.valorFicha;
    parteFirma = valorTotal * (customer.parteFirma / 100);
    parteCliente = valorTotal * (customer.parteCliente / 100);
  } else {
    relogioAnterior = customer.relogioJukeboxAnterior;
    valorTotal = relogioAtualNum > relogioAnterior ? relogioAtualNum - relogioAnterior : 0;
    parteFirma = valorTotal * (customer.porcentagemJukeboxFirma / 100);
    parteCliente = valorTotal * (customer.porcentagemJukeboxCliente / 100);
  }

  const handleConfirm = () => {
    if (relogioAtualNum <= relogioAnterior) {
        alert('A leitura atual do relógio deve ser maior que a anterior.');
        return;
    }
    onConfirm({
      equipment,
      relogioAtual: relogioAtualNum,
      descontoPartidas: equipment === 'mesa' ? descontoPartidasNum : 0,
      paymentMethod,
    });
  };

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
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg border border-slate-700 animate-fade-in-up">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Realizar Cobrança</h2>
          <p className="text-slate-400">Cliente: {customer.name}</p>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Selecione o Equipamento</label>
            <div className="flex gap-4">
                {canSettleMesa && (
                  <button onClick={() => setEquipment('mesa')} className={`flex-1 p-3 rounded-md text-left transition-all flex items-center gap-3 ${equipment === 'mesa' ? 'bg-sky-600 text-white shadow' : 'bg-slate-700 hover:bg-slate-600'}`}>
                    <BilliardIcon className="w-6 h-6" />
                    <div>
                      <p className="font-bold">Mesa de Sinuca</p>
                      <p className="text-xs">{customer.mesaNumero}</p>
                    </div>
                  </button>
                )}
                {canSettleJukebox && (
                  <button onClick={() => setEquipment('jukebox')} className={`flex-1 p-3 rounded-md text-left transition-all flex items-center gap-3 ${equipment === 'jukebox' ? 'bg-sky-600 text-white shadow' : 'bg-slate-700 hover:bg-slate-600'}`}>
                     <JukeboxIcon className="w-6 h-6" />
                     <div>
                        <p className="font-bold">Jukebox</p>
                        <p className="text-xs">{customer.jukeboxNumero}</p>
                     </div>
                  </button>
                )}
            </div>
            {!canSettleMesa && !canSettleJukebox && <p className="text-red-400 text-sm mt-2">Nenhum equipamento cadastrado para este cliente.</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="relogioAnterior" className="block text-sm font-medium text-slate-300 mb-1">Leitura Anterior</label>
              <input type="text" id="relogioAnterior" value={relogioAnterior} disabled className="w-full bg-slate-700/50 border border-slate-600 rounded-md py-2 px-3 text-slate-400" />
            </div>
            <div>
              <label htmlFor="relogioAtual" className="block text-sm font-medium text-slate-300 mb-1">Leitura Atual</label>
              <input type="number" id="relogioAtual" value={relogioAtual} onChange={(e) => setRelogioAtual(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {equipment === 'mesa' && (
              <div className="col-span-2">
                <label htmlFor="descontoPartidas" className="block text-sm font-medium text-slate-300 mb-1">Partidas de Desconto</label>
                <input type="number" id="descontoPartidas" value={descontoPartidas} onChange={(e) => setDescontoPartidas(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
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
            {equipment === 'mesa' && (
              <>
                <p className="flex justify-between text-sm text-slate-300"><span>Partidas Jogadas:</span> <span className="font-mono">{partidasJogadas}</span></p>
                <p className="flex justify-between text-sm text-slate-300"><span>Partidas Cobradas:</span> <span className="font-mono">{partidasCobradas}</span></p>
                <p className="flex justify-between text-sm text-slate-300"><span>Valor por Ficha:</span> <span className="font-mono">R$ {customer.valorFicha.toFixed(2)}</span></p>
              </>
            )}
            <p className="flex justify-between text-lg text-white font-bold border-t border-slate-600 pt-2"><span>Valor Total:</span> <span className="font-mono text-emerald-400">R$ {valorTotal.toFixed(2)}</span></p>
            <p className="flex justify-between text-sm text-slate-400"><span>Parte da Firma ({equipment === 'mesa' ? customer.parteFirma : customer.porcentagemJukeboxFirma}%):</span> <span className="font-mono">R$ {parteFirma.toFixed(2)}</span></p>
            <p className="flex justify-between text-sm text-slate-400"><span>Parte do Cliente ({equipment === 'mesa' ? customer.parteCliente : customer.porcentagemJukeboxCliente}%):</span> <span className="font-mono">R$ {parteCliente.toFixed(2)}</span></p>
          </div>
        </div>
        <div className="p-6 bg-slate-800/50 rounded-b-lg flex justify-end gap-4">
          <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500 transition-colors">Cancelar</button>
          <button onClick={handleConfirm} disabled={relogioAtualNum <= relogioAnterior} className="bg-emerald-600 text-white font-bold py-2 px-6 rounded-md hover:bg-emerald-500 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed inline-flex items-center gap-2">
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