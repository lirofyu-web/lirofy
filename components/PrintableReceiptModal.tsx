// components/PrintableReceiptModal.tsx
import React from 'react';
import { Billing, DebtPayment } from '../types';
import ReceiptSheet from './ReceiptSheet';
import DebtReceiptSheet from './DebtReceiptSheet';
import { XIcon } from './icons/XIcon';

interface PrintableReceiptModalProps {
  receipt: {
    type: 'billing' | 'debt';
    data: Billing | DebtPayment;
    isProvisional?: boolean;
  };
  onClose: () => void;
}

const PrintableReceiptModal: React.FC<PrintableReceiptModalProps> = ({ receipt, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-slate-900/95 z-[70] flex flex-col items-center justify-center p-4 animate-fade-in no-print"
      role="dialog"
      aria-modal="true"
    >
      <header className="absolute top-0 left-0 right-0 p-4 bg-slate-900/50 flex justify-between items-center">
        <div className="text-white text-center flex-grow">
          <p className="font-bold text-lg">Pronto para Capturar</p>
          <p className="text-sm text-slate-300">Pressione os botões do seu celular para capturar a tela e compartilhar a imagem.</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-300 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-700/50"
          aria-label="Fechar"
        >
          <XIcon className="w-6 h-6" />
        </button>
      </header>
      
      <main className="w-full max-w-sm">
        <div className="bg-white text-black p-4 rounded-lg shadow-2xl font-mono text-sm">
          {receipt.type === 'billing' ? (
            <ReceiptSheet billing={receipt.data as Billing} isProvisional={receipt.isProvisional} />
          ) : (
            <DebtReceiptSheet debtPayment={receipt.data as DebtPayment} />
          )}
        </div>
      </main>
      
      <style>{`
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default PrintableReceiptModal;