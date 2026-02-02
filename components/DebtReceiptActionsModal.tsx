// components/DebtReceiptActionsModal.tsx
import React from 'react';
import { ShareIcon } from './icons/ShareIcon';
import { DebtPayment } from '../types';
import { PrinterIcon } from './icons/PrinterIcon';
import { sunmiPrinterService } from '../utils/sunmiPrinter';
import { SunmiIcon } from './icons/SunmiIcon';

interface DebtReceiptActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: () => Promise<void>;
  onPrint: () => void;
  onPrintSunmi: () => Promise<void>;
  debtPayment: DebtPayment;
  isSharing: boolean;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

const DebtReceiptActionsModal: React.FC<DebtReceiptActionsModalProps> = ({
  isOpen,
  onClose,
  onShare,
  onPrint,
  onPrintSunmi,
  isSharing,
}) => {
  if (!isOpen) return null;

  const isSunmiAvailable = sunmiPrinterService.isPrinterAvailable();

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
        <div className="p-6 bg-slate-800/50 rounded-b-lg flex flex-col gap-3">
          {isSunmiAvailable && (
             <button
              onClick={onPrintSunmi}
              disabled={isSharing}
              className="w-full inline-flex items-center justify-center gap-2 bg-orange-600 text-white font-bold py-3 px-6 rounded-md hover:bg-orange-500 transition-colors disabled:bg-slate-500"
              title="Imprimir na impressora interna Sunmi"
            >
              <SunmiIcon className="w-5 h-5" />
              <span>{isSharing ? 'Imprimindo...' : 'Imprimir (Sunmi)'}</span>
            </button>
          )}
          <button
            onClick={onPrint}
            disabled={isSharing}
            className="w-full inline-flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-3 px-6 rounded-md hover:bg-cyan-500 transition-colors disabled:bg-slate-500"
          >
            <PrinterIcon className="w-5 h-5" />
            <span>Salvar / Imprimir (PDF)</span>
          </button>
          <button
            onClick={onShare}
            disabled={isSharing}
            className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-6 rounded-md hover:bg-green-500 transition-colors disabled:bg-slate-500"
            title="Compartilhar comprovante como texto"
          >
            <ShareIcon className="w-5 h-5" />
            <span>{isSharing ? 'Aguarde...' : 'Compartilhar (Texto)'}</span>
          </button>
          <button
            onClick={onClose}
            disabled={isSharing}
            className="w-full mt-2 bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500 transition-colors disabled:bg-slate-500"
          >
            Fechar
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

export default DebtReceiptActionsModal;
