// components/DebtReceiptActionsModal.tsx
import React from 'react';
import { PrinterIcon } from './icons/PrinterIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { DebtPayment } from '../types';

interface DebtReceiptActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  onWhatsApp: () => void;
  customerHasPhone: boolean;
  debtPayment: DebtPayment;
}

const DebtReceiptActionsModal: React.FC<DebtReceiptActionsModalProps> = ({
  isOpen,
  onClose,
  onPrint,
  onWhatsApp,
  customerHasPhone,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="debt-receipt-actions-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <div className="p-6">
          <h2 id="debt-receipt-actions-modal-title" className="text-2xl font-bold text-white">Pagamento Registrado</h2>
          <p className="text-slate-400 mt-4">Deseja enviar um comprovante?</p>
        </div>
        <div className="p-6 bg-slate-800/50 rounded-b-lg flex flex-col sm:flex-row justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500 transition-colors order-3 sm:order-1"
          >
            Fechar
          </button>
          <button
            onClick={onWhatsApp}
            disabled={!customerHasPhone}
            className="inline-flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-6 rounded-md hover:bg-green-500 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed order-2"
            title={!customerHasPhone ? 'Cliente sem telefone cadastrado' : 'Enviar via WhatsApp'}
          >
            <WhatsAppIcon className="w-5 h-5" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={onPrint}
            className="inline-flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-2 px-6 rounded-md hover:bg-cyan-500 transition-colors order-1 sm:order-3"
          >
            <PrinterIcon className="w-5 h-5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default DebtReceiptActionsModal;
