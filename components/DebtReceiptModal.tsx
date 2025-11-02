// components/DebtReceiptModal.tsx
import React, { useRef } from 'react';
import { DebtPayment } from '../types';
import { PrinterIcon } from './icons/PrinterIcon';

interface DebtReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtPayment: DebtPayment;
}

const DebtReceiptModal: React.FC<DebtReceiptModalProps> = ({ isOpen, onClose, debtPayment }) => {
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
              width: 300px;
              font-size: 12px;
              color: #000;
              margin: 0;
              padding: 10px;
            }
            .header { text-align: center; margin-bottom: 15px; }
            .header h3 { margin: 0; font-size: 14px; }
            .header p { margin: 2px 0; }
            hr.dashed { border-top: 1px dashed #000; margin: 10px 0; }
            .signatures { margin-top: 40px; }
            .signature-line { border-top: 1px solid #000; margin-top: 30px; }
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
  
  const paymentMethodText = {
      pix: 'PIX',
      dinheiro: 'DINHEIRO',
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="debt-receipt-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-sm border border-slate-700 animate-fade-in-up max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h2 id="debt-receipt-modal-title" className="text-xl font-bold text-white">Comprovante de Pagamento</h2>
            <button onClick={handlePrint} className="inline-flex items-center gap-2 bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500">
                <PrinterIcon className="w-5 h-5"/> <span>Imprimir</span>
            </button>
        </div>

        <div className="p-4 overflow-y-auto bg-white text-black font-mono text-sm">
            <div ref={printRef}>
              <div className="header text-center mb-4">
                  <h3 className="font-bold text-base">MONTANHA BILHAR & JUKEBOX</h3>
                  <p>COMPROVANTE DE PAGAMENTO DE DÍVIDA</p>
                  <p>--------------------------------</p>
              </div>
              
              <div className="space-y-1">
                  <p>CLIENTE: {debtPayment.customerName}</p>
                  <p>DATA: {new Date(debtPayment.paidAt).toLocaleString('pt-BR')}</p>
                  <hr className="border-dashed border-black my-2" />
                  
                  <div className="flex justify-between font-bold text-base pt-2 mt-2">
                      <span>VALOR PAGO:</span>
                      <span>R$ {debtPayment.amountPaid.toFixed(2)}</span>
                  </div>
                   <div className="flex justify-between pt-1">
                      <span>Pagamento:</span>
                      <span>{paymentMethodText[debtPayment.paymentMethod]}</span>
                  </div>

                  <div className="signatures text-center mt-10">
                    <div className="signature-line w-4/5 mx-auto mt-12"></div>
                    <p>Assinatura Firma</p>
                    <div className="signature-line w-4/5 mx-auto mt-12"></div>
                    <p>Assinatura Cliente</p>
                  </div>
              </div>
            </div>
        </div>

        <div className="p-4 mt-auto bg-slate-800/50 rounded-b-lg flex justify-end gap-4 border-t border-slate-700">
          <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">Fechar</button>
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