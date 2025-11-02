// components/ReceiptModal.tsx
import React, { useRef } from 'react';
import { Billing } from '../types';
import { PrinterIcon } from './icons/PrinterIcon';
import { LogoIcon } from './icons/LogoIcon';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  billing: Billing;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, billing }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (printContent) {
      const printWindow = window.open('', '', 'height=800,width=400');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Recibo de Cobrança</title>');
        printWindow.document.write(`
          <style>
            body { 
              font-family: 'Courier New', Courier, monospace;
              width: 300px; /* Standard thermal printer width */
              font-size: 12px;
              color: #000;
              margin: 0;
              padding: 10px;
            }
            .header { text-align: center; margin-bottom: 15px; }
            .header h3 { margin: 0; font-size: 14px; }
            .header p { margin: 2px 0; }
            .item { display: flex; justify-content: space-between; }
            .item-left { text-align: left; }
            .item-right { text-align: right; }
            hr.dashed { border-top: 1px dashed #000; margin: 10px 0; }
            .total { font-weight: bold; font-size: 14px; }
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

  const isMesa = billing.equipment === 'mesa';
  
  const paymentMethodText = {
      pix: 'PIX',
      dinheiro: 'DINHEIRO',
      fiado: 'FIADO (ANOTADO)',
  };

  const ReceiptRow: React.FC<{label: string, value: string | number}> = ({ label, value }) => (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 no-print">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-sm border border-slate-700 animate-fade-in-up max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Recibo</h2>
            <button onClick={handlePrint} className="inline-flex items-center gap-2 bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500">
                <PrinterIcon className="w-5 h-5"/> <span>Imprimir</span>
            </button>
        </div>

        <div className="p-4 overflow-y-auto bg-white text-black font-mono text-sm">
            <div ref={printRef}>
              <div className="header text-center mb-4">
                  <h3 className="font-bold text-base">MONTANHA BILHAR & JUKEBOX</h3>
                  <p>ACERTO DE CONTAS</p>
                  <p>--------------------------------</p>
              </div>
              
              <div className="space-y-1">
                  <p>CLIENTE: {billing.customerName}</p>
                  <p>DATA: {new Date(billing.settledAt).toLocaleString('pt-BR')}</p>
                  <hr className="border-dashed border-black my-2" />
                  
                  <p className="font-bold">EQUIPAMENTO: {isMesa ? 'MESA SINUCA' : 'JUKEBOX'}</p>
                  <ReceiptRow label="Leitura Anterior:" value={billing.relogioAnterior} />
                  <ReceiptRow label="Leitura Atual:" value={billing.relogioAtual} />
                  
                  {isMesa && (
                    <>
                      <hr className="border-dashed border-black my-2" />
                      <ReceiptRow label="Partidas Jogadas:" value={billing.partidasJogadas} />
                      <ReceiptRow label="Partidas Desconto:" value={billing.descontoPartidas} />
                      <ReceiptRow label="Partidas Cobradas:" value={billing.partidasCobradas} />
                      <ReceiptRow label="Valor Ficha:" value={`R$ ${billing.valorFicha?.toFixed(2)}`} />
                    </>
                  )}
                  
                  <hr className="border-dashed border-black my-2" />

                  <ReceiptRow label="Valor Bruto:" value={`R$ ${(billing.parteFirma + billing.parteCliente).toFixed(2)}`} />
                  <ReceiptRow label="Parte Cliente:" value={`R$ ${billing.parteCliente.toFixed(2)}`} />
                  
                  <div className="flex justify-between font-bold text-base pt-2 mt-2 border-t border-dashed border-black">
                      <span>TOTAL (FIRMA):</span>
                      <span>R$ {billing.valorTotal.toFixed(2)}</span>
                  </div>
                   <div className="flex justify-between pt-1">
                      <span>Pagamento:</span>
                      <span>{paymentMethodText[billing.paymentMethod]}</span>
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

export default ReceiptModal;