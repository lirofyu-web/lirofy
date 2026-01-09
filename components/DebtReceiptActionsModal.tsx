// components/DebtReceiptActionsModal.tsx
import React, { useState } from 'react';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { DebtPayment } from '../types';
import { ShareIcon } from './icons/ShareIcon';
import { generateDebtEscpos, generateDebtText } from '../utils/receiptGenerator';
import { BluetoothIcon } from './icons/BluetoothIcon';
import { bluetoothPrinter } from '../utils/bluetoothPrinter';

interface DebtReceiptActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWhatsApp: () => void;
  customerHasPhone: boolean;
  debtPayment: DebtPayment;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

const DebtReceiptActionsModal: React.FC<DebtReceiptActionsModalProps> = ({
  isOpen,
  onClose,
  onWhatsApp,
  customerHasPhone,
  debtPayment,
  showNotification,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [btStatus, setBtStatus] = useState<'idle' | 'connecting' | 'printing' | 'failed'>('idle');
  
  const handleShareTxt = async () => {
    setIsSharing(true);
    try {
      const textContent = generateDebtText(debtPayment);
      const file = new File([textContent], `pagamento_${debtPayment.customerName.replace(/\s/g, '_')}.txt`, { type: 'text/plain' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Comprovante - ${debtPayment.customerName}`,
          files: [file],
        });
        showNotification('Comprovante compartilhado.', 'success');
        onClose();
      } else {
        throw new Error('Seu navegador não suporta o compartilhamento de arquivos.');
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        showNotification(`Erro ao compartilhar: ${error.message}`, 'error');
        console.error("Share error:", error);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleBluetoothPrint = async () => {
    setBtStatus('connecting');
    try {
      if (!bluetoothPrinter.isConnected()) {
        const status = await bluetoothPrinter.connect();
        if (status !== 'connected') {
          throw new Error(status === 'cancelled' ? 'Seleção de impressora cancelada.' : 'Falha ao conectar na impressora.');
        }
      }

      setBtStatus('printing');
      const commands = generateDebtEscpos(debtPayment);
      await bluetoothPrinter.print(commands);
      
      showNotification('Comprovante enviado para a impressora.', 'success');
      onClose();
    } catch (error: any) {
      console.error('Bluetooth print error:', error);
      showNotification(error.message || 'Erro na impressão Bluetooth.', 'error');
      setBtStatus('failed');
    } finally {
      if (btStatus !== 'failed') {
          setTimeout(() => setBtStatus('idle'), 1000);
      }
    }
  };

  if (!isOpen) return null;

  const getBtButtonText = () => {
    switch (btStatus) {
        case 'connecting': return 'Conectando...';
        case 'printing': return 'Imprimindo...';
        case 'failed': return 'Tentar Novamente';
        default: return 'Bluetooth';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="debt-receipt-actions-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <div className="p-6">
          <h2 id="debt-receipt-actions-modal-title" className="text-2xl font-bold text-white">Pagamento Registrado</h2>
          <p className="text-slate-400 mt-4">Deseja enviar um comprovante?</p>
        </div>
        <div className="p-6 bg-slate-800/50 rounded-b-lg flex flex-col sm:flex-row justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500 transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={onWhatsApp}
            disabled={!customerHasPhone}
            className="inline-flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-6 rounded-md hover:bg-green-500 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
            title={!customerHasPhone ? 'Cliente sem telefone cadastrado' : 'Enviar texto via WhatsApp'}
          >
            <WhatsAppIcon className="w-5 h-5" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={handleBluetoothPrint}
            disabled={btStatus === 'connecting' || btStatus === 'printing'}
            className={`inline-flex items-center justify-center gap-2 text-white font-bold py-2 px-6 rounded-md transition-colors ${btStatus === 'failed' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} disabled:bg-slate-500 disabled:cursor-wait`}
          >
            <BluetoothIcon className="w-5 h-5" />
            <span>{getBtButtonText()}</span>
          </button>
          <button
            onClick={handleShareTxt}
            disabled={isSharing}
            className="inline-flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-2 px-6 rounded-md hover:bg-cyan-500 transition-colors disabled:bg-slate-500 disabled:cursor-wait"
          >
            <ShareIcon className="w-5 h-5" />
            <span>{isSharing ? 'Gerando...' : 'TXT'}</span>
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

export default DebtReceiptActionsModal;