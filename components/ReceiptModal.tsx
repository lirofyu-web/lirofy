// components/ReceiptModal.tsx
import React, { useRef, useState, useEffect } from 'react';
import { Billing } from '../types';
import { PrinterIcon } from './icons/PrinterIcon';
import ReceiptSheet from './ReceiptSheet';
import { bluetoothPrinter } from '../utils/bluetoothPrinter';
import { generateBillingEscpos } from '../utils/receiptGenerator';
import { BluetoothIcon } from './icons/BluetoothIcon';
import { ShareIcon } from './icons/ShareIcon';

declare const html2canvas: any;

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  billing: Billing;
  isProvisional?: boolean;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

const BtStatusIndicator: React.FC<{ status: string }> = ({ status }) => {
    const info = {
        disconnected: { text: 'Desconectada', color: 'text-slate-400' },
        connecting: { text: 'Conectando...', color: 'text-amber-400' },
        connected: { text: 'Conectada', color: 'text-green-400' },
        failed: { text: 'Falha', color: 'text-red-400' },
    }[status] || { text: 'Desconhecido', color: 'text-slate-500' };

    return (
        <span className={`text-xs font-mono flex items-center gap-1.5 ${info.color}`}>
            <BluetoothIcon className="w-4 h-4" />
            <span>{info.text}</span>
        </span>
    );
};

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, billing, isProvisional, showNotification }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [btStatus, setBtStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected');

  useEffect(() => {
      if (isOpen) {
          setBtStatus(bluetoothPrinter.isConnected() ? 'connected' : 'disconnected');
      }
  }, [isOpen]);

  const handleConnectBt = async () => {
      setBtStatus('connecting');
      const result = await bluetoothPrinter.connect();
      if (result === 'connected') {
          showNotification('Impressora conectada!', 'success');
          setBtStatus('connected');
      } else if (result === 'cancelled') {
          setBtStatus('disconnected');
      } else {
          showNotification('Falha ao conectar impressora.', 'error');
          setBtStatus('failed');
      }
  };

  const handlePrintBluetooth = async () => {
      if (!bluetoothPrinter.isConnected()) {
          showNotification('Impressora não está conectada.', 'error');
          return;
      }
      try {
          const commands = generateBillingEscpos(billing, isProvisional || false);
          await bluetoothPrinter.print(commands);
          showNotification('Enviado para a impressora.', 'success');
      } catch (error) {
          console.error("Bluetooth print error:", error);
          showNotification('Erro ao imprimir via Bluetooth.', 'error');
          setBtStatus('failed');
      }
  };
  
  const handleShareImage = async () => {
    if (!printRef.current) return;
    if (!navigator.share) {
        showNotification('Seu navegador não suporta compartilhamento.', 'error');
        return;
    }
    try {
        const canvas = await html2canvas(printRef.current, { backgroundColor: '#ffffff', scale: 2 });
        canvas.toBlob(async (blob) => {
            if (!blob) {
                showNotification('Falha ao gerar imagem.', 'error');
                return;
            }
            const file = new File([blob], 'comprovante.png', { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `Comprovante - ${billing.customerName}`,
                    text: `Segue o comprovante de cobrança para ${billing.customerName}.`,
                });
            } else {
                showNotification('Não é possível compartilhar arquivos neste navegador.', 'error');
            }
        }, 'image/png');
    } catch (error) {
        console.error("Error sharing image:", error);
        showNotification('Ocorreu um erro ao tentar compartilhar.', 'error');
    }
  };


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
              width: 72mm; /* 80mm paper width minus margins */
              font-size: 10pt;
              color: #000;
              margin: 0;
              padding: 3mm;
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

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-sm border border-slate-700 animate-fade-in-up max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-700">
            <h2 id="receipt-modal-title" className="text-xl font-bold text-white">{isProvisional ? 'Demonstrativo de Cobrança' : 'Recibo'}</h2>
            <div className="mt-2 flex items-center justify-between">
                <BtStatusIndicator status={btStatus} />
                {btStatus !== 'connected' && (
                    <button onClick={handleConnectBt} disabled={btStatus === 'connecting'} className="text-xs bg-sky-600 text-white font-bold py-1 px-2 rounded-md hover:bg-sky-500 disabled:bg-slate-500">
                        Conectar Impressora
                    </button>
                )}
            </div>
        </div>

        <div className="p-4 overflow-y-auto bg-white text-black font-mono text-sm">
            <div ref={printRef}>
              <ReceiptSheet billing={billing} isProvisional={isProvisional} />
            </div>
        </div>

        <div className="p-4 mt-auto bg-slate-800/50 rounded-b-lg flex flex-col gap-3 border-t border-slate-700">
          <div className="grid grid-cols-2 gap-3">
              <button onClick={handleShareImage} className="inline-flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-500">
                  <ShareIcon className="w-5 h-5"/> <span>Compartilhar</span>
              </button>
              <button onClick={handlePrint} className="inline-flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500">
                  <PrinterIcon className="w-5 h-5"/> <span>Salvar/Imprimir</span>
              </button>
          </div>
          <button onClick={handlePrintBluetooth} disabled={btStatus !== 'connected'} className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-500 disabled:bg-slate-500 disabled:cursor-not-allowed">
              <BluetoothIcon className="w-5 h-5"/> <span>Imprimir (Bluetooth)</span>
          </button>
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

export default ReceiptModal;