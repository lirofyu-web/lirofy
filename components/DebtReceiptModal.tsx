// components/DebtReceiptModal.tsx
import React, { useRef } from 'react';
import { DebtPayment } from '../types';
import { PrinterIcon } from './icons/PrinterIcon';
import DebtReceiptSheet from './DebtReceiptSheet';
import { CameraIcon } from './icons/CameraIcon';

interface DebtReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtPayment: DebtPayment;
  showNotification: (message: string, type: 'success' | 'error') => void;
  onOpenForScreenshot: () => void;
}

const DebtReceiptModal: React.FC<DebtReceiptModalProps> = ({ isOpen, onClose, debtPayment, onOpenForScreenshot }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (printContent) {
      const printWindow = window.open('', '', 'height=800,width=400');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Comprovante de Pagamento de Dívida</title>');
        printWindow.document.write(`
          <style>
            body { 
              font-family: 'Courier New', Courier, monospace;
              width: 72mm; /* 80mm paper width minus margins */
              font-size: 10pt;
              color: #000;
              margin: 0;
              padding: 3mm;
            }
            .header { text-align: center; margin-bottom: 15px; }
            .header h3 { margin: 0; font-size: 14px; }
            .header p { margin: 2px 0; }
            hr.dashed { border-top: 1px dashed #000; margin: 10px 0; }
          </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="debt-receipt-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-sm border border-slate-700 animate-fade-in-up max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-700">
            <h2 id="debt-receipt-modal-title" className="text-xl font-bold text-white">Comprovante de Pagamento</h2>
        </div>

        <div className="p-4 overflow-y-auto bg-white text-black font-mono text-sm">
            <div ref={printRef}>
              <DebtReceiptSheet debtPayment={debtPayment} />
            </div>
        </div>

        <div className="p-4 mt-auto bg-slate-800/50 rounded-b-lg flex flex-col gap-3 border-t border-slate-700">
          <div className="grid grid-cols-2 gap-3">
              <button onClick={onOpenForScreenshot} className="inline-flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-500">
                  <CameraIcon className="w-5 h-5"/> <span>Capturar Tela</span>
              </button>
              <button onClick={handlePrint} className="inline-flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500">
                  <PrinterIcon className="w-5 h-5"/> <span>Salvar/Imprimir</span>
              </button>
          </div>
          <button onClick={onClose} className="w-full bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">Fechar</button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default DebtReceiptModal;