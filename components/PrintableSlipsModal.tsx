// components/PrintableSlipsModal.tsx
import React from 'react';
import BillingSlipSheet from './BillingSlipSheet';
import { PrinterIcon } from './icons/PrinterIcon';
import { Customer, Equipment } from '../types';

interface PrintableSlipsModalProps {
  slips: { customer: Customer; equipment: Equipment; lastBillingAmount: number | null; }[];
  onClose: () => void;
}

const PrintableSlipsModal: React.FC<PrintableSlipsModalProps> = ({ slips, onClose }) => {
  const handlePrint = () => {
    window.print();
  };
  
  const slipsPerPage = 3;
  const pages = [];
  for (let i = 0; i < slips.length; i += slipsPerPage) {
      pages.push(slips.slice(i, i + slipsPerPage));
  }

  return (
    <div 
      className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex flex-col items-center p-4 print-overlay no-print"
      role="dialog"
      aria-modal="true"
    >
      <header className="w-full max-w-[210mm] flex justify-between items-center mb-4 print-controls no-print">
          <h2 className="text-xl font-bold text-white">Pré-visualização dos Talões ({slips.length} talões)</h2>
          <div className="flex gap-4">
            <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">Fechar</button>
            <button onClick={handlePrint} className="inline-flex items-center gap-2 bg-cyan-600 text-white font-bold py-2 px-6 rounded-md hover:bg-cyan-500">
                <PrinterIcon className="w-5 h-5"/> <span>Imprimir {slipsPerPage} por Página</span>
            </button>
          </div>
      </header>

      {/* A4 Portrait Preview - Scrollable container */}
      <div className="overflow-y-auto w-full">
          <div id="print-area" className="print-content space-y-4">
              {pages.map((pageSlips, pageIndex) => (
                  <div key={pageIndex} className="bg-white shadow-2xl print-page" style={{ width: '210mm', height: '297mm' }}>
                      <div className="flex flex-col h-full w-full">
                          {pageSlips.map(({ customer, equipment, lastBillingAmount }) => (
                              <div key={equipment.id} className="w-full h-1/3">
                                  <BillingSlipSheet customer={customer} equipment={equipment} lastBillingAmount={lastBillingAmount} />
                              </div>
                          ))}
                          {/* Fill remaining space if less than 3 slips on the page */}
                          {Array(slipsPerPage - pageSlips.length).fill(0).map((_, i) => (
                            <div key={`placeholder-${i}`} className="w-full h-1/3"></div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      </div>

      <style>{`
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .no-print {
                display: none !important;
            }
            .print-overlay {
                position: static !important;
                background: none !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
            }
            .print-content {
                overflow: visible !important;
                space-y: 0 !important;
            }
            .print-page {
                page-break-after: always;
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
            }
            .print-page:last-child {
                page-break-after: auto;
            }
        }
        @page {
            size: A4 portrait;
            margin: 0;
        }
      `}</style>
    </div>
  );
};

export default PrintableSlipsModal;
