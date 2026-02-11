// components/PendingPaymentActionModal.tsx
import React from 'react';
import { ReceiptIcon } from './icons/ReceiptIcon';
import { PlusIcon } from './icons/PlusIcon';

interface PendingPaymentActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBillNew: () => void;
  onContinuePending: () => void;
}

const PendingPaymentActionModal: React.FC<PendingPaymentActionModalProps> = ({ isOpen, onClose, onBillNew, onContinuePending }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pending-action-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <div className="p-6">
          <h2 id="pending-action-modal-title" className="text-2xl font-bold text-white">Pagamento Pendente Encontrado</h2>
          <p className="text-slate-400 mt-4">Este cliente já possui um faturamento aguardando pagamento. O que você gostaria de fazer?</p>
        </div>
        <div className="p-6 bg-slate-800/50 rounded-b-lg flex flex-col gap-4">
          <button
            onClick={onContinuePending}
            className="w-full inline-flex items-center justify-center gap-3 bg-amber-600 text-white font-bold py-3 px-4 rounded-md hover:bg-amber-500 transition-colors"
          >
            <ReceiptIcon className="w-5 h-5" />
            <span>Finalizar Pagamento Pendente</span>
          </button>
          <button
            onClick={onBillNew}
            className="w-full inline-flex items-center justify-center gap-3 bg-sky-600 text-white font-bold py-3 px-4 rounded-md hover:bg-sky-500 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Faturar Novo Equipamento</span>
          </button>
          <button
            onClick={onClose}
            className="w-full mt-2 bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-500 transition-colors"
          >
            Cancelar
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

export default PendingPaymentActionModal;
