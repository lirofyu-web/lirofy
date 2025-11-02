// components/CustomerCard.tsx
import React, { useState } from 'react';
import { Customer, Billing, DebtPayment } from '../types';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { TrashIcon } from './icons/TrashIcon';
import { PencilIcon } from './icons/PencilIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { AlertIcon } from './icons/AlertIcon';
import { VisitedIcon } from './icons/VisitedIcon';
import { NotVisitedIcon } from './icons/NotVisitedIcon';
import { ShareIcon } from './icons/ShareIcon';
import { BilliardIcon } from './icons/BilliardIcon';
import { JukeboxIcon } from './icons/JukeboxIcon';


import BillingModal from './BillingModal';
import DebtPaymentModal from './DebtPaymentModal';
import EditCustomerModal from './EditCustomerModal';
import HistoryModal from './HistoryModal';
// FIX: Import ActionModal component to resolve 'Cannot find name' error.
import ActionModal from './ActionModal';

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
  const lastVisitedDate = customer.lastVisitedAt ? new Date(customer.lastVisitedAt).toLocaleDateString('pt-BR') : 'Nenhuma';

  const hasHighDebt = customer.debtAmount > 50;

  const googleMapsUrl = customer.latitude && customer.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${customer.latitude},${customer.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${customer.endereco}, ${customer.cidade}`)}`;

  const whatsAppUrl = customer.telefone 
    ? `https://wa.me/55${customer.telefone.replace(/\D/g, '')}`
    : '';

  const handleShare = () => {
    const customerDataString = `
--- INÍCIO DADOS CLIENTE ---
Nome: ${customer.name}
CPF/RG: ${customer.cpfRg}
Cidade: ${customer.cidade}
Endereço: ${customer.endereco}
Telefone: ${customer.telefone}
Linha/Rota: ${customer.linhaNumero}
Nº Mesa: ${customer.mesaNumero}
Nº Relógio Mesa: ${customer.relogioMesaNumero}
Leitura Ant. Mesa: ${customer.relogioMesaAnterior}
Valor Ficha: R$ ${customer.valorFicha.toFixed(2)}
% Firma (Mesa): ${customer.parteFirma}
% Cliente (Mesa): ${customer.parteCliente}
Nº Jukebox: ${customer.jukeboxNumero}
Nº Relógio Jukebox: ${customer.relogioJukeboxNumero}
Leitura Ant. Jukebox: ${customer.relogioJukeboxAnterior}
% Firma (Jukebox): ${customer.porcentagemJukeboxFirma}
% Cliente (Jukebox): ${customer.porcentagemJukeboxCliente}
--- FIM DADOS CLIENTE ---
    `.trim();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(customerDataString)}`;
    window.open(whatsappUrl, '_blank');
  };

  const ActionButton: React.FC<{onClick?: () => void; href?: string; title: string; children: React.ReactNode; isLink?: boolean; className?: string}> = 
    ({onClick, href, title, children, isLink, className}) => {
    const commonClasses = "p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors duration-200";
    if (isLink) {
        return <a href={href} target="_blank" rel="noopener noreferrer" title={title} className={`${commonClasses} ${className}`}>{children}</a>
    }
    return <button onClick={onClick} title={title} className={`${commonClasses} ${className}`}>{children}</button>;
  };

  return (
    <>
      <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 flex flex-col h-full transition-shadow hover:shadow-emerald-500/10">
        <div className="p-5 flex-grow">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <span title={visitIsPending ? 'Visita Pendente' : `Visitado em ${lastVisitedDate}`}>
                {visitIsPending ? <NotVisitedIcon className="w-5 h-5" /> : <VisitedIcon className="w-5 h-5" />}
              </span>
              <span>{customer.name}</span>
            </h3>
            {hasHighDebt && (
              <div className="flex-shrink-0" title={`Dívida pendente: R$ ${customer.debtAmount.toFixed(2)}`}>
                <AlertIcon className="w-6 h-6 text-amber-400" />
              </div>
            )}
          </div>
          <p className="text-sm text-slate-400 mb-4">{customer.endereco}</p>
          
           {customer.distance !== undefined && customer.distance !== Infinity && (
                 <p className="text-sm text-sky-400 font-medium mb-2">
                    Aprox. {customer.distance.toFixed(1)} km de distância
                </p>
            )}

            <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3 text-sm">
                {customer.mesaNumero && (
                    <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-2"><BilliardIcon className="w-4 h-4 text-cyan-400" /> Mesa {customer.mesaNumero}</span>
                        <span className="font-mono">{customer.relogioMesaAnterior}</span>
                    </div>
                )}
                {customer.jukeboxNumero && (
                    <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-2"><JukeboxIcon className="w-4 h-4 text-cyan-400" /> Jukebox {customer.jukeboxNumero}</span>
                        <span className="font-mono">{customer.relogioJukeboxAnterior}</span>
                    </div>
                )}
                {customer.debtAmount > 0 && (
                    <div className="flex items-center justify-between text-amber-400 font-semibold">
                        <span className="flex items-center gap-2">Saldo Devedor</span>
                        <span className="font-mono">R$ {customer.debtAmount.toFixed(2)}</span>
                    </div>
                )}
            </div>

        </div>

        <div className="bg-slate-800/50 p-3 flex flex-wrap gap-2 justify-center border-t border-slate-700">
            <button onClick={() => setIsBillingModalOpen(true)} className="flex-1 text-sm bg-emerald-600 text-white font-bold py-2 px-3 rounded-md hover:bg-emerald-500 transition-colors min-w-[120px]">Cobrança</button>
            {customer.debtAmount > 0 && (
                 <button onClick={() => setIsDebtModalOpen(true)} className="flex-1 text-sm bg-amber-600 text-white font-bold py-2 px-3 rounded-md hover:bg-amber-500 transition-colors min-w-[120px]">Pagar Dívida</button>
            )}
        </div>
        
        <div className="bg-slate-900/40 p-1 flex justify-around items-center rounded-b-lg">
          <ActionButton onClick={() => setIsHistoryModalOpen(true)} title="Histórico"><HistoryIcon className="w-5 h-5" /></ActionButton>
          {whatsAppUrl && <ActionButton href={whatsAppUrl} title="WhatsApp" isLink><WhatsAppIcon className="w-5 h-5" /></ActionButton>}
          <ActionButton onClick={handleShare} title="Compartilhar Dados"><ShareIcon className="w-5 h-5" /></ActionButton>
          <ActionButton href={googleMapsUrl} title="Ver no Mapa" isLink><LocationMarkerIcon className="w-5 h-5" /></ActionButton>
          <ActionButton onClick={() => setIsEditModalOpen(true)} title="Editar"><PencilIcon className="w-5 h-5" /></ActionButton>
          <ActionButton onClick={() => setIsDeleteModalOpen(true)} title="Excluir" className="hover:text-red-500"><TrashIcon className="w-5 h-5" /></ActionButton>
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
        <p>Tem certeza que deseja excluir o cliente <strong>{customer.name}</strong> e todo o seu histórico? Esta ação não pode ser desfeita.</p>
      </ActionModal>
    </>
  );
};

export default CustomerCard;