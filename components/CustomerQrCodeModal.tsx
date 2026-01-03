// components/CustomerQrCodeModal.tsx
import React, { useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { Customer } from '../types';
import { PrinterIcon } from './icons/PrinterIcon';

interface CustomerQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
}

const CustomerQrCodeModal: React.FC<CustomerQrCodeModalProps> = ({ isOpen, onClose, customer }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, customer.id, {
        width: 256,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#FFFFFF',
          light: '#1e293b'
        }
      }, (error) => {
        if (error) console.error('Erro ao gerar QR Code:', error);
      });
    }
  }, [isOpen, customer.id]);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (printContent) {
      const printWindow = window.open('', '', 'height=400,width=400');
      if (printWindow) {
        printWindow.document.write('<html><head><title>QR Code Cliente</title>');
        printWindow.document.write('<style> body { text-align: center; font-family: sans-serif; } canvas { width: 250px !important; height: 250px !important; } </style>');
        printWindow.document.write('</head><body onload="window.print();window.close()">');
        printWindow.document.write(printContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-code-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-sm border border-slate-700 animate-fade-in-up">
        <div className="p-6 border-b border-slate-700 text-center">
            <h2 id="qr-code-modal-title" className="text-xl font-bold text-white">QR Code de Identificação</h2>
            <p className="text-slate-400">{customer.name}</p>
        </div>
        <div className="p-6 flex justify-center bg-slate-900" ref={printRef}>
            <canvas ref={canvasRef} className="rounded-lg"></canvas>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-b-lg flex justify-between items-center gap-4">
          <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">Fechar</button>
          <button onClick={handlePrint} className="inline-flex items-center gap-2 bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500">
            <PrinterIcon className="w-5 h-5"/> <span>Imprimir</span>
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

export default CustomerQrCodeModal;