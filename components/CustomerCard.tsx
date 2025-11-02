// components/CustomerCard.tsx
import React, { useState } from 'react';
import { Customer } from '../types';
import BillingModal from './BillingModal';
import ActionModal from './ActionModal';
import DebtPaymentModal from './DebtPaymentModal';
import EditCustomerModal from './EditCustomerModal';
import { TrashIcon } from './icons/TrashIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { BilliardIcon } from './icons/BilliardIcon';
import { JukeboxIcon } from './icons/JukeboxIcon';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { PencilIcon } from './icons/PencilIcon';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { VisitedIcon } from './icons/VisitedIcon';
import { NotVisitedIcon } from './icons/NotVisitedIcon';


interface CustomerCardProps {
  customer: Customer;
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

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onSettleBill, onDeleteCustomer, onPayDebt, onUpdateCustomer, isSaving }) => {
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleConfirmDelete = () => {
    onDeleteCustomer(customer.id);
    setIsDeleteModalOpen(false);
  };
  
  const handleConfirmSettle = (billingData: { equipment: 'mesa' | 'jukebox'; relogioAtual: number; descontoPartidas: number; paymentMethod: 'pix' | 'dinheiro' | 'fiado'; }) => {
    onSettleBill({ ...billingData, customerId: customer.id });
    setIsBillingModalOpen(false);
  };

  const handleConfirmPayDebt = (amount: number, paymentMethod: 'pix' | 'dinheiro') => {
    onPayDebt(customer.id, amount, paymentMethod);
    setIsDebtModalOpen(false);
  };

  const handleConfirmUpdate = async (updatedCustomer: Customer) => {
    await onUpdateCustomer(updatedCustomer);
    setIsEditModalOpen(false);
  };

  // Helper for map URL
  const fullAddress = `${customer.endereco}, ${customer.cidade}`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  // Helper for WhatsApp URL
  const sanitizePhoneNumber = (phone: string) => {
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length <= 11) { // Assume DDD + Number for Brazil
          return `55${digitsOnly}`;
      }
      return digitsOnly;
  };
  const whatsappUrl = `https://wa.me/${sanitizePhoneNumber(customer.telefone)}`;

  // --- Visited Status Logic ---
  const twentyFiveDaysInMs = 25 * 24 * 60 * 60 * 1000;
  const isVisitedRecently = customer.lastVisitedAt && (new Date().getTime() - new Date(customer.lastVisitedAt).getTime()) <= twentyFiveDaysInMs;
  const visitedStatusTitle = isVisitedRecently 
    ? `Visitado em ${new Date(customer.lastVisitedAt!).toLocaleDateString('pt-BR')}` 
    : "Visita pendente (mais de 25 dias)";

  return (
    <>
      <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden flex flex-col h-full">
        <div className="p-5 flex-grow">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{customer.name}</h3>
                    <span title={visitedStatusTitle}>
                      {isVisitedRecently ? <VisitedIcon className="w-5 h-5" /> : <NotVisitedIcon className="w-5 h-5" />}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-slate-500 hover:text-cyan-400 transition-colors p-2 rounded-full flex-shrink-0"
                    aria-label="Editar cliente"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsDeleteModalOpen(true)} 
                    className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-full flex-shrink-0"
                    aria-label="Deletar cliente"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
            </div>
            {customer.endereco && customer.cidade && (
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5 mt-1">
                  <LocationMarkerIcon className="w-4 h-4" />
                  <span>{fullAddress}</span>
              </a>
            )}
            
            {customer.debtAmount > 0 && (
                <div className="mt-4 p-2.5 rounded-md bg-red-900/50 border border-red-700 text-center">
                    <p className="text-sm text-red-300">Saldo Devedor</p>
                    <p className="text-lg font-bold text-white font-mono">R$ {customer.debtAmount.toFixed(2)}</p>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-700 space-y-3 text-sm">
                 {customer.telefone && (
                    <div className="flex items-center gap-3 text-slate-300">
                        <WhatsAppIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-300 transition-colors font-mono">
                            {customer.telefone}
                        </a>
                    </div>
                 )}
                 <div className="flex items-center gap-3 text-slate-300">
                    <BilliardIcon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <div>
                        <span>Mesa: <span className="font-semibold text-white">{customer.mesaNumero || 'N/A'}</span></span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span>Últ. Leitura: <span className="font-mono text-cyan-400">{customer.relogioMesaAnterior}</span></span>
                    </div>
                 </div>
                 <div className="flex items-center gap-3 text-slate-300">
                    <JukeboxIcon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <div>
                        <span>Jukebox: <span className="font-semibold text-white">{customer.jukeboxNumero || 'N/A'}</span></span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span>Últ. Leitura: <span className="font-mono text-cyan-400">{customer.relogioJukeboxAnterior}</span></span>
                    </div>
                </div>
            </div>
        </div>
        <div className="mt-auto bg-slate-800/50 p-4 border-t border-slate-700 space-y-2">
           {customer.debtAmount > 0 && (
              <button 
                  onClick={() => setIsDebtModalOpen(true)}
                  className="flex items-center justify-center gap-2 w-full bg-amber-600 text-white font-bold py-2 px-4 rounded-md hover:bg-amber-500 transition-colors text-sm"
              >
                  <CurrencyDollarIcon className="w-4 h-4" />
                  <span>Pagar Dívida</span>
              </button>
           )}
          <button 
              onClick={() => setIsBillingModalOpen(true)}
              className="flex items-center justify-center gap-2 w-full bg-emerald-600 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-500 transition-colors text-sm"
          >
              <CreditCardIcon className="w-4 h-4" />
              <span>Realizar Cobrança</span>
          </button>
        </div>
      </div>
      
      <BillingModal 
        isOpen={isBillingModalOpen}
        onClose={() => setIsBillingModalOpen(false)}
        onConfirm={handleConfirmSettle}
        customer={customer}
      />
      
      <DebtPaymentModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        onConfirm={handleConfirmPayDebt}
        customer={customer}
      />

      <EditCustomerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onConfirm={handleConfirmUpdate}
        customer={customer}
        isSaving={isSaving}
      />

      <ActionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Deletar Cliente"
        confirmText="Deletar"
      >
        <p>
            Tem certeza que deseja deletar <strong>{customer.name}</strong>? Esta ação é irreversível e removerá todo o histórico de cobranças e pagamentos.
        </p>
      </ActionModal>
    </>
  );
};

export default CustomerCard;