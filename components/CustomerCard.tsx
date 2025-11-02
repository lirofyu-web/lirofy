
// components/CustomerCard.tsx
import React, { useState, useMemo } from 'react';
import { Customer, Billing, DebtPayment } from '../types';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PencilIcon } from './icons/PencilIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { AlertIcon } from './icons/AlertIcon';
import { RulerIcon } from './icons/RulerIcon';

import BillingModal from './BillingModal';
import DebtPaymentModal from './DebtPaymentModal';
import ActionModal from './ActionModal';
import EditCustomerModal from './EditCustomerModal';
import HistoryModal from './HistoryModal';

interface CustomerCardProps {
  customer: Customer & { distance?: number };
  billings: Billing[];
  debtPayments: DebtPayment[];
  onSettleBill: (billingData: {
    customerId: string;
    equipment: 'mesa' | 'jukebox';
    relogioAtual: number;
    descontoPartidas: number;
    paymentMethod: 'pix' | 'dinheiro' | 'fiado';
  }) => void;
  onDeleteCustomer: (customerId: string) => void;
  onPayDebt: (customerId: string, amount: number, paymentMethod: 'pix' | 'dinheiro') => void;
  onUpdateCustomer: (customer: Customer) => Promise<void>;
  isSaving: boolean;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, billings, debtPayments, onSettleBill, onDeleteCustomer, onPayDebt, onUpdateCustomer, isSaving }) => {
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const handleSettleBill = (data: Omit<Parameters<typeof onSettleBill>[0], 'customerId'>) => {
    onSettleBill({ ...data, customerId: customer.id });
    setIsBillingModalOpen(false);
  };
  
  const handlePayDebt = (amount: number, paymentMethod: 'pix' | 'dinheiro') => {
    onPayDebt(customer.id, amount, paymentMethod);
    setIsDebtModalOpen(false);
  };

  const handleDeleteCustomer = () => {
    onDeleteCustomer(customer.id);
    setIsDeleteModalOpen(false);
  };
  
  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    await onUpdateCustomer(updatedCustomer);
    setIsEditModalOpen(false);
  };

  const twentyFiveDaysInMs = 25 * 24 * 60 * 60 * 1000;
  const visitIsPending = !customer.lastVisitedAt || (new Date().getTime() - new Date(customer.lastVisitedAt).getTime()) > twentyFiveDaysInMs;

  const googleMapsUrl = customer.latitude && customer.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${customer.latitude},${customer.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${customer.endereco}, ${customer.cidade}`)}`;

  const whatsAppUrl = customer.telefone 
    ? `https://wa.me/55${customer.telefone.replace(/\D/g, '')}`
    : '';

  return (
    <>
      <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 flex flex-col h-full transition-shadow hover:shadow-emerald-500/10">
        <div className="p-5 flex-grow">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-white mb-1">{customer.name}</h3>
            {visitIsPending && <div className="flex-shrink-0 ml-2" title="Visita pendente há mais de 25 dias"><AlertIcon className="w-6 h-6 text-amber-400" /></div>}
          </div>
          <p className="text-sm text-slate-400 mb-4">{customer.endereco}</p>
          
          <div className="space-y-2 text-sm">
            {customer.debtAmount > 0 && (
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <CurrencyDollarIcon className="w-5 h-5" />
                <span>Dívida: R$ {customer.debtAmount.toFixed(2)}</span>
              </div>
            )}
            {customer.distance !== Infinity && customer.distance !== undefined && (
                 <div className="flex items-center gap-2 text-sky-400">
                    <RulerIcon className="w-5 h-5" />
                    <span>Distância: {customer.distance.toFixed(1)} km</span>
                </div>
            )}
             <div className="text-xs text-slate-500 pt-2">
                Última Visita: {customer.lastVisitedAt ? new Date(customer.lastVisitedAt).toLocaleDateString('pt-BR') : 'Nenhuma'}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 p-3 flex flex-wrap gap-2 justify-center border-t border-slate-700">
            <button onClick={() => setIsBillingModalOpen(true)} className="flex-1 text-sm bg-emerald-600 text-white font-bold py-2 px-3 rounded-md hover:bg-emerald-500 transition-colors min-w-[120px]">Cobrança</button>
            {customer.debtAmount > 0 && (
                 <button onClick={() => setIsDebtModalOpen(true)} className="flex-1 text-sm bg-amber-600 text-white font-bold py-2 px-3 rounded-md hover:bg-amber-500 transition-colors min-w-[120px]">Pagar Dívida</button>
            )}
        </div>
        
        <div className="bg-slate-900/40 p-2 flex justify-around items-center rounded-b-lg">
          <button onClick={() => setIsHistoryModalOpen(true)} title="Histórico" className="text-slate-400 hover:text-white"><HistoryIcon className="w-5 h-5" /></button>
          <button onClick={() => setIsEditModalOpen(true)} title="Editar" className="text-slate-400 hover:text-white"><PencilIcon className="w-5 h-5" /></button>
          {whatsAppUrl && <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer" title="WhatsApp" className="text-slate-400 hover:text-white"><WhatsAppIcon className="w-5 h-5" /></a>}
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" title="Ver no Mapa" className="text-slate-400 hover:text-white"><LocationMarkerIcon className="w-5 h-5" /></a>
          <button onClick={() => setIsDeleteModalOpen(true)} title="Excluir" className="text-slate-400 hover:text-red-500"><TrashIcon className="w-5 h-5" /></button>
        </div>
      </div>
      
      {/* Modals */}
      <BillingModal isOpen={isBillingModalOpen} onClose={() => setIsBillingModalOpen(false)} onConfirm={handleSettleBill} customer={customer} />
      {customer.debtAmount > 0 && <DebtPaymentModal isOpen={isDebtModalOpen} onClose={() => setIsDebtModalOpen(false)} onConfirm={handlePayDebt} customer={customer} />}
      <EditCustomerModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onConfirm={handleUpdateCustomer} customer={customer} isSaving={isSaving} />
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} customer={customer} billings={billings} debtPayments={debtPayments} />
      <ActionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCustomer}
        title="Confirmar Exclusão"
        confirmText="Excluir"
      >
        <p>Tem certeza que deseja excluir o cliente <strong>{customer.name}</strong>? Esta ação não pode ser desfeita.</p>
      </ActionModal>
    </>
  );
};

export default CustomerCard;
