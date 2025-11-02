// components/ReceiptModal.tsx
import React, { useRef } from 'react';
import { Billing } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  billing: Billing;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, billing }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (printContent) {
      const newWindow = window.open('', '', 'height=500, width=500');
      if (newWindow) {
        newWindow.document.write('<html><head><title>Recibo</title>');
        // Optional: Add some basic styling for printing
        newWindow.document.write('<style>body { font-family: Georgia, serif; margin: 20px; } .receipt { border: 1px solid #ccc; padding: 15px; } h2, h3, p { margin: 0; } h3 { text-align: center; } hr { border: 0; border-top: 1px dashed #000; margin: 8px 0; } .details div { display: flex; justify-content: space-between; } .total { font-weight: bold; border-top: 1px dashed #000; padding-top: 8px; } .shares { font-size: 12px; } </style>');
        newWindow.document.write('</head><body>');
        newWindow.document.write(printContent.innerHTML);
        newWindow.document.write('</body></html>');
        newWindow.document.close();
        newWindow.focus();
        newWindow.print();
        newWindow.close();
      }
    }
  };

  if (!isOpen) return null;

  const paymentMethodText = {
    pix: 'PIX',
    dinheiro: 'Dinheiro',
    fiado: 'Fiado'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-sm border border-slate-700 animate-fade-in-up">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white text-center mb-4">Recibo de Cobrança</h2>
          <div ref={receiptRef} className="bg-white text-black p-4 rounded-md font-sans text-sm">
            <h3 className="text-center font-bold text-lg">Montanha Bilhar e Jukebox</h3>
            <p className="text-center text-xs">Comprovante de Serviço</p>
            <hr />
            <div className="details">
              <div><span>Cliente:</span><span>{billing.customerName}</span></div>
              <div><span>Data:</span><span>{billing.settledAt.toLocaleString('pt-BR')}</span></div>
              <div><span>Equip.:</span><span>{billing.equipment === 'mesa' ? 'Mesa de Sinuca' : 'Jukebox'}</span></div>
              <div><span>Pgto:</span><span>{paymentMethodText[billing.paymentMethod]}</span></div>
            </div>
            <hr />
            
            {billing.equipment === 'mesa' ? (
                <div className="details">
                <div><span>Leitura Anterior:</span><span>{billing.relogioAnterior}</span></div>
                <div><span>Leitura Atual:</span><span>{billing.relogioAtual}</span></div>
                <div><span>Partidas Jogadas:</span><span>{billing.partidasJogadas}</span></div>
                <div><span>Desconto:</span><span>{billing.descontoPartidas}</span></div>
                <div className="font-bold"><span>Partidas Cobradas:</span><span>{billing.partidasCobradas}</span></div>
                <div><span>Valor Ficha:</span><span>R$ {billing.valorFicha?.toFixed(2)}</span></div>
                </div>
            ) : (
                <div className="details">
                <div><span>Leitura Anterior:</span><span>{billing.relogioAnterior}</span></div>
                <div><span>Leitura Atual:</span><span>{billing.relogioAtual}</span></div>
                </div>
            )}

            <hr />
            <div className="details total">
              <div>
                <span>TOTAL:</span>
                <span>
                  R$ {billing.valorTotal.toFixed(2)}
                  {billing.paymentMethod === 'fiado' && <span className="ml-2 font-bold">(DÉBITO)</span>}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-800/50 rounded-b-lg flex justify-end gap-4">
          <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">Fechar</button>
          <button onClick={handlePrint} className="bg-cyan-600 text-white font-bold py-2 px-6 rounded-md hover:bg-cyan-500">Imprimir</button>
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