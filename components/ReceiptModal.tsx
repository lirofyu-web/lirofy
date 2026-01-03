// components/ReceiptModal.tsx
import React, { useRef } from 'react';
import { Billing } from '../types';
import { PrinterIcon } from './icons/PrinterIcon';
import { LogoIcon } from './icons/LogoIcon';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  billing: Billing;
  isProvisional?: boolean;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, billing, isProvisional }) => {
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

  const isMesa = billing.equipmentType === 'mesa';
  const isGrua = billing.equipmentType === 'grua';
  
  const paymentMethodText = {
      pix: 'PIX',
      dinheiro: 'DINHEIRO',
      fiado: 'FIADO (ANOTADO)',
      misto: 'MISTO',
  };

  const ReceiptRow: React.FC<{label: string, value: string | number}> = ({ label, value }) => (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );

  const renderGruaDetails = () => {
    const saldo = billing.saldo || 0;
    const aluguelCliente = billing.aluguelValor || 0;
    const parteFirma = billing.valorTotal;

    return (
        <>
            <p className="font-bold">EQUIPAMENTO: GRUA {billing.equipmentNumero}</p>
            <ReceiptRow label="Leitura Anterior:" value={billing.relogioAnterior} />
            <ReceiptRow label="Leitura Atual:" value={billing.relogioAtual} />
            <hr className="border-dashed border-black my-2" />
            <ReceiptRow label="SALDO:" value={`R$ ${saldo.toFixed(2)}`} />
            <ReceiptRow label="Recebido Espécie:" value={`R$ ${(billing.recebimentoEspecie || 0).toFixed(2)}`} />
            <ReceiptRow label="Recebido PIX:" value={`R$ ${(billing.recebimentoPix || 0).toFixed(2)}`} />
            <hr className="border-dashed border-black my-2" />
            <ReceiptRow label="Qtd. Pelúcias (Capacidade):" value={billing.quantidadePelucia || 0} />
            <ReceiptRow label="Sobra de Pelúcias:" value={billing.sobraPelucia || 0} />
            <ReceiptRow label="Reposição de Pelúcias:" value={billing.reposicaoPelucia || 0} />
            <hr className="border-dashed border-black my-2" />
            <ReceiptRow label="ALUGUEL (PAGO AO CLIENTE):" value={`R$ ${aluguelCliente.toFixed(2)}`} />
            <div className="flex justify-between font-bold text-base pt-2 mt-2 border-t border-dashed border-black">
                <span>TOTAL (FIRMA):</span>
                <span>R$ {parteFirma.toFixed(2)}</span>
            </div>
        </>
    );
  };

  const renderMesaJukeboxDetails = () => {
    if (isMesa && billing.billingType === 'monthly') {
      return (
        <>
          <p className="font-bold">EQUIPAMENTO: MESA {billing.equipmentNumero} (MENSAL)</p>
          <hr className="border-dashed border-black my-2" />
          <div className="flex justify-between font-bold text-base pt-2 mt-2">
            <span>MENSALIDADE FIXA:</span>
            <span>R$ {billing.valorTotal.toFixed(2)}</span>
          </div>
        </>
      );
    }
    
    return (
      <>
        <p className="font-bold">EQUIPAMENTO: {isMesa ? `MESA ${billing.equipmentNumero}` : `JUKEBOX ${billing.equipmentNumero}`}</p>
        <ReceiptRow label="Leitura Anterior:" value={billing.relogioAnterior} />
        <ReceiptRow label="Leitura Atual:" value={billing.relogioAtual} />
        
        {isMesa && (
          <>
            <hr className="border-dashed border-black my-2" />
            <ReceiptRow label="Partidas Jogadas:" value={billing.partidasJogadas} />
            <ReceiptRow label="Partidas Desconto:" value={billing.descontoPartidas || 0} />
            <ReceiptRow label="Partidas Cobradas:" value={billing.partidasCobradas || 0} />
            <ReceiptRow label="Valor Ficha:" value={`R$ ${(billing.valorFicha ?? 0).toFixed(2)}`} />
          </>
        )}
        
        <hr className="border-dashed border-black my-2" />
        <ReceiptRow label="Valor Bruto:" value={`R$ ${((billing.parteFirma ?? 0) + (billing.parteCliente ?? 0)).toFixed(2)}`} />
        <ReceiptRow label="Parte Cliente:" value={`R$ ${(billing.parteCliente ?? 0).toFixed(2)}`} />
        
        <div className="flex justify-between font-bold text-base pt-2 mt-2 border-t border-dashed border-black">
            <span>TOTAL (FIRMA):</span>
            <span>R$ {billing.valorTotal.toFixed(2)}</span>
        </div>
      </>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-sm border border-slate-700 animate-fade-in-up max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h2 id="receipt-modal-title" className="text-xl font-bold text-white">{isProvisional ? 'Demonstrativo de Cobrança' : 'Recibo'}</h2>
            <button onClick={handlePrint} className="inline-flex items-center gap-2 bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500">
                <PrinterIcon className="w-5 h-5"/> <span>Imprimir</span>
            </button>
        </div>

        <div className="p-4 overflow-y-auto bg-white text-black font-mono text-sm">
            <div ref={printRef}>
              <div className="header text-center mb-4">
                  <h3 className="font-bold text-base">MONTANHA BILHAR & JUKEBOX</h3>
                  <p>{isProvisional ? 'DEMONSTRATIVO DE COBRANÇA' : 'ACERTO DE CONTAS'}</p>
                  <p>--------------------------------</p>
              </div>
              
              <div className="space-y-1">
                  <p>CLIENTE: {billing.customerName}</p>
                  <p>DATA: {new Date(billing.settledAt).toLocaleString('pt-BR')}</p>
                  <hr className="border-dashed border-black my-2" />
                  
                  {isGrua ? renderGruaDetails() : renderMesaJukeboxDetails()}
                  
                  {!isProvisional && !isGrua && (
                    billing.paymentMethod === 'misto' ? (
                        <div className="pt-1">
                            <p className="font-bold">PAGAMENTO:</p>
                            {billing.valorPagoDinheiro && billing.valorPagoDinheiro > 0 && <ReceiptRow label="- Dinheiro:" value={`R$ ${billing.valorPagoDinheiro.toFixed(2)}`} />}
                            {billing.valorPagoPix && billing.valorPagoPix > 0 && <ReceiptRow label="- PIX:" value={`R$ ${billing.valorPagoPix.toFixed(2)}`} />}
                            {billing.valorPagoFiado && billing.valorPagoFiado > 0 && <ReceiptRow label="- Fiado:" value={`R$ ${billing.valorPagoFiado.toFixed(2)}`} />}
                        </div>
                    ) : (
                        <div className="flex justify-between pt-1">
                            <span>Pagamento:</span>
                            <span>{paymentMethodText[billing.paymentMethod]}</span>
                        </div>
                    )
                  )}
                  
                  {isProvisional && (
                     <div className="text-center font-bold mt-4 border-t border-b border-dashed border-black py-1">
                         <p>*** COMPROVANTE PARA CONFERÊNCIA ***</p>
                         <p>*** SEM VALOR FISCAL ***</p>
                     </div>
                  )}

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