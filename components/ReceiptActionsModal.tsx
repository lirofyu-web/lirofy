// components/ReceiptActionsModal.tsx
import React, { useState, useRef } from 'react';
import { PrinterIcon } from './icons/PrinterIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { Billing } from '../types';
import { BluetoothPrinter } from '../utils/bluetoothPrinter';
import { generateEscPosFromReceipt, generatePixPayload } from '../utils/receiptGenerator';

interface ReceiptActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWhatsApp: () => void;
  customerHasPhone: boolean;
  billing: Billing;
  isProvisional: boolean;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

const ReceiptActionsModal: React.FC<ReceiptActionsModalProps> = ({
  isOpen,
  onClose,
  onWhatsApp,
  customerHasPhone,
  billing,
  isProvisional,
  showNotification,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const printer = useRef(new BluetoothPrinter());

  const handleBluetoothPrint = async () => {
    setIsPrinting(true);
    
    try {
        if (!printer.current.isConnected()) {
            showNotification('Conectando à impressora...', 'success');
            const connected = await printer.current.connect();
            if (!connected) {
                showNotification('Conexão com impressora falhou ou foi cancelada.', 'error');
                setIsPrinting(false);
                return;
            }
        }

        showNotification('Enviando para impressão...', 'success');
        
        const pixPayload = isProvisional ? generatePixPayload() : undefined;
        const commands = generateEscPosFromReceipt(billing, isProvisional, pixPayload);

        await printer.current.print(commands);
        showNotification('Impresso com sucesso!', 'success');
        onClose();

    } catch (error: any) {
        console.error('Bluetooth print error:', error);
        showNotification(`Erro de impressão: ${error.message}`, 'error');
        if (printer.current.isConnected()) {
            await printer.current.disconnect();
        }
    } finally {
        setIsPrinting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-actions-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <div className="p-6">
          <h2 id="receipt-actions-modal-title" className="text-2xl font-bold text-white">Comprovante Gerado</h2>
          <p className="text-slate-400 mt-4">O que você deseja fazer?</p>
        </div>
        <div className="p-6 bg-slate-800/50 rounded-b-lg flex flex-col sm:flex-row justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500 transition-colors order-3 sm:order-1"
          >
            Fechar
          </button>
          <button
            onClick={onWhatsApp}
            disabled={!customerHasPhone}
            className="inline-flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-6 rounded-md hover:bg-green-500 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed order-2"
            title={!customerHasPhone ? 'Cliente sem telefone cadastrado' : 'Enviar via WhatsApp'}
          >
            <WhatsAppIcon className="w-5 h-5" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={handleBluetoothPrint}
            disabled={isPrinting}
            className="inline-flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-2 px-6 rounded-md hover:bg-cyan-500 transition-colors order-1 sm:order-3 disabled:bg-slate-500 disabled:cursor-wait"
          >
            <PrinterIcon className="w-5 h-5" />
            <span>{isPrinting ? 'Imprimindo...' : 'Imprimir'}</span>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ReceiptActionsModal;