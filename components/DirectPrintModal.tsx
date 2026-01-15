// components/DirectPrintModal.tsx
import React, { useEffect, useRef } from 'react';
import { Billing, DebtPayment } from '../types';
import ReceiptSheet from './ReceiptSheet';
import DebtReceiptSheet from './DebtReceiptSheet';

interface DirectPrintModalProps {
  data: (Billing & { isProvisional?: boolean }) | DebtPayment;
  type: 'billing' | 'debt';
  onClose: () => void;
}

const DirectPrintModal: React.FC<DirectPrintModalProps> = ({ data, type, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Small delay to ensure content is rendered before printing
    const timer = setTimeout(() => {
        const printContent = printRef.current?.innerHTML;
        if (printContent) {
            const printWindow = window.open('', '_blank', 'width=400');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Recibo</title>');
                printWindow.document.write(`
                  <style>
                    body { 
                      font-family: 'Courier New', Courier, monospace;
                      width: 72mm;
                      font-size: 10pt;
                      color: #000;
                      margin: 0;
                      padding: 3mm;
                    }
                    @page {
                        size: auto;
                        margin: 0mm;
                    }
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
                
                const afterPrint = () => {
                    printWindow.close();
                    window.removeEventListener('afterprint', afterPrint);
                    onClose();
                };
                printWindow.addEventListener('afterprint', afterPrint);

                printWindow.print();
            } else {
                alert("Por favor, habilite pop-ups para impressão.");
                onClose();
            }
        }
    }, 100);

    return () => clearTimeout(timer);
  }, [data, type, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99]">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg text-slate-900 dark:text-white">
          Preparando para impressão...
          <div className="hidden">
              <div ref={printRef}>
                  {type === 'billing' ? (
                      <ReceiptSheet billing={data as Billing} isProvisional={(data as any).isProvisional} />
                  ) : (
                      <DebtReceiptSheet debtPayment={data as DebtPayment} />
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default DirectPrintModal;