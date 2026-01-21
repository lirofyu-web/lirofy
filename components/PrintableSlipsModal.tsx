// components/PrintableSlipsModal.tsx
import React, { useRef } from 'react';
import BillingSlipSheet from './BillingSlipSheet';
import { PrinterIcon } from './icons/PrinterIcon';
import { Customer, Equipment } from '../types';

interface PrintableSlipsModalProps {
  slips: { customer: Customer; equipment: Equipment; lastBillingAmount: number | null; }[];
  onClose: () => void;
}

const PrintableSlipsModal: React.FC<PrintableSlipsModalProps> = ({ slips, onClose }) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML;
    if (!printContent) {
        alert("Não foi possível encontrar o conteúdo para impressão.");
        return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>Talões de Cobrança</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                            background-color: #808080; /* Fundo cinza para a pré-visualização */
                        }
                        .print-page {
                            page-break-after: always;
                            margin: 1rem auto; /* Centraliza a página na pré-visualização */
                        }
                        .print-page:last-child {
                            page-break-after: auto;
                        }
                        @page {
                            size: A4 portrait;
                            margin: 0;
                        }
                        @media print {
                            body {
                                background-color: #fff;
                            }
                            .print-page {
                                margin: 0;
                                box-shadow: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="space-y-4">
                        ${printContent}
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500); // Um pequeno atraso para garantir que tudo seja carregado
    } else {
        alert("Por favor, habilite pop-ups para impressão.");
    }
  };
  
  const slipsPerPage = 3;
  const pages = [];
  for (let i = 0; i < slips.length; i += slipsPerPage) {
      pages.push(slips.slice(i, i + slipsPerPage));
  }

  return (
    <div 
      className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex flex-col items-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <header className="w-full max-w-[210mm] flex justify-between items-center mb-4">
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
          <div id="print-area" ref={printAreaRef} className="space-y-4">
              {pages.map((pageSlips, pageIndex) => (
                  <div key={pageIndex} className="bg-white shadow-2xl print-page mx-auto" style={{ width: '210mm', height: '297mm' }}>
                      <div className="flex flex-col h-full w-full">
                          {pageSlips.map(({ customer, equipment, lastBillingAmount }) => (
                              <div key={equipment.id} className="w-full h-1/3">
                                  <BillingSlipSheet customer={customer} equipment={equipment} lastBillingAmount={lastBillingAmount} />
                              </div>
                          ))}
                          {Array(slipsPerPage - pageSlips.length).fill(0).map((_, i) => (
                            <div key={`placeholder-${i}`} className="w-full h-1/3"></div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default PrintableSlipsModal;