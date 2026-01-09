// components/CustomerQrCodeModal.tsx
import React, { useState } from 'react';
import { Customer } from '../types';
import { ShareIcon } from './icons/ShareIcon';
import CustomerQrLabel from './CustomerQrLabel';
import { generateCustomerLabelText } from '../utils/receiptGenerator';

interface CustomerQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

const CustomerQrCodeModal: React.FC<CustomerQrCodeModalProps> = ({ isOpen, onClose, customer, showNotification }) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleShareTxt = async () => {
    setIsSharing(true);
    try {
      const textContent = generateCustomerLabelText(customer);
      const file = new File([textContent], `etiqueta_${customer.name.replace(/\s/g, '_')}.txt`, { type: 'text/plain' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Etiqueta Cliente ${customer.name}`,
          files: [file],
        });
        showNotification('Etiqueta compartilhada.', 'success');
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-code-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-xs border border-slate-700 animate-fade-in-up">
        <div className="p-4 border-b border-slate-700 text-center">
            <h2 id="qr-code-modal-title" className="text-lg font-bold text-white">QR Code de Identificação</h2>
        </div>
        <div className="p-4 bg-gray-300 flex justify-center">
            <CustomerQrLabel customer={customer} />
        </div>
        <div className="p-4 bg-slate-800/50 rounded-b-lg flex justify-between items-center gap-4">
          <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">Fechar</button>
          <button 
            onClick={handleShareTxt} 
            disabled={isSharing} 
            className="inline-flex items-center gap-2 bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500 disabled:bg-slate-500 disabled:cursor-wait"
          >
            <ShareIcon className="w-5 h-5"/> 
            <span>{isSharing ? 'Gerando...' : 'Compartilhar'}</span>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default CustomerQrCodeModal;