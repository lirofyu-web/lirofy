// components/EquipmentQrCodeModal.tsx
import React, { useRef } from 'react';
import { Equipment } from '../types';
import { PrinterIcon } from './icons/PrinterIcon';
import EquipmentLabel from './EquipmentLabel';

interface EquipmentQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment;
}

const EquipmentQrCodeModal: React.FC<EquipmentQrCodeModalProps> = ({ isOpen, onClose, equipment }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (printContent) {
      const printWindow = window.open('', '', 'height=400,width=300');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Etiqueta de Equipamento</title>');
        printWindow.document.write(`
          <style>
            @page { margin: 0; size: 57mm 32mm; }
            body { 
              margin: 0; 
              font-family: 'Courier New', Courier, monospace;
            }
          </style>
        `);
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
      aria-labelledby="equipment-label-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-xs border border-slate-700 animate-fade-in-up">
        <div className="p-4 border-b border-slate-700 text-center">
            <h2 id="equipment-label-modal-title" className="text-lg font-bold text-white">Etiqueta de Equipamento</h2>
        </div>
        <div className="p-4 bg-gray-300 flex justify-center">
            <div ref={printRef}>
                <EquipmentLabel equipment={equipment} />
            </div>
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

export default EquipmentQrCodeModal;