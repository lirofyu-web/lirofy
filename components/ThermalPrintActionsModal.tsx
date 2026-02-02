// components/ThermalPrintActionsModal.tsx
import React from 'react';
import { ShareIcon } from './icons/ShareIcon';
import { SunmiIcon } from './icons/SunmiIcon';
import { sunmiPrinterService } from '../utils/sunmiPrinter';

interface ThermalPrintActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  onShare: (text: string, title: string) => Promise<void>;
  onPrintSunmi: (text: string) => Promise<void>;
  isSharing: boolean;
}

const ThermalPrintActionsModal: React.FC<ThermalPrintActionsModalProps> = ({
  isOpen, onClose, title, content, onShare, onPrintSunmi, isSharing,
}) => {
  if (!isOpen) return null;

  const isSunmiAvailable = sunmiPrinterService.isPrinterAvailable();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 no-print">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-slate-400 mt-4">O que você deseja fazer com o relatório?</p>
        </div>
        <div className="p-6 bg-slate-800/50 rounded-b-lg flex flex-col gap-3">
          {isSunmiAvailable && (
            <button
              onClick={() => onPrintSunmi(content)}
              disabled={isSharing}
              className="w-full inline-flex items-center justify-center gap-2 bg-orange-600 text-white font-bold py-3 px-6 rounded-md hover:bg-orange-500 disabled:bg-slate-500"
            >
              <SunmiIcon className="w-5 h-5" />
              <span>{isSharing ? 'Imprimindo...' : 'Imprimir (Sunmi)'}</span>
            </button>
          )}
          <button
            onClick={() => onShare(content, title)}
            disabled={isSharing}
            className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-6 rounded-md hover:bg-green-500 disabled:bg-slate-500"
          >
            <ShareIcon className="w-5 h-5" />
            <span>{isSharing ? 'Aguarde...' : 'Compartilhar (Texto)'}</span>
          </button>
          <button
            onClick={onClose}
            disabled={isSharing}
            className="w-full mt-2 bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500 disabled:bg-slate-500"
          >
            Fechar
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

export default ThermalPrintActionsModal;
