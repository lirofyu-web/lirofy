// components/DebtReceiptActionsModal.tsx
import React, { useState, useEffect } from 'react';
import { ShareIcon } from './icons/ShareIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { DebtPayment } from '../types';
import { createRoot } from 'react-dom/client';
import DebtReceiptSheet from './DebtReceiptSheet';

// Declara html2canvas para TypeScript
declare const html2canvas: any;

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setImageFile(null);
      return;
    }

    const generateImage = async () => {
      setIsGenerating(true);
      setImageFile(null);

      const sheetContainer = document.createElement('div');
      sheetContainer.style.position = 'absolute';
      sheetContainer.style.left = '-9999px';
      sheetContainer.style.width = '320px';
      document.body.appendChild(sheetContainer);

      const root = createRoot(sheetContainer);
      root.render(
        <div className="p-4 bg-white text-black font-mono text-sm">
          <DebtReceiptSheet debtPayment={debtPayment} />
        </div>
      );
      
      const cleanup = () => {
        root.unmount();
        if (document.body.contains(sheetContainer)) {
          document.body.removeChild(sheetContainer);
        }
        setIsGenerating(false);
      };

      try {
        await new Promise(resolve => setTimeout(resolve, 300));

        const elementToCapture = sheetContainer.firstChild as HTMLElement;
        if (!elementToCapture) throw new Error("Falha ao renderizar comprovante para captura.");

        const canvas = await html2canvas(elementToCapture, { scale: 2, backgroundColor: '#ffffff' });

        canvas.toBlob((blob) => {
          if (!blob) {
            showNotification('Falha ao gerar a imagem.', 'error');
            cleanup();
            return;
          }
          const file = new File([blob], `comprovante_divida_${debtPayment.customerName.replace(/\s/g, '_')}.png`, { type: 'image/png' });
          setImageFile(file);
          cleanup();
        }, 'image/png');
      } catch (error: any) {
        console.error('Erro ao gerar imagem do comprovante:', error);
        showNotification(`Erro ao gerar imagem: ${error.message}`, 'error');
        cleanup();
      }
    };

    generateImage();
  }, [isOpen, debtPayment, showNotification]);

  const handleShare = async () => {
    if (!imageFile) {
        showNotification('A imagem ainda está sendo gerada, por favor aguarde.', 'error');
        return;
    }

    const downloadFallback = () => {
      const link = document.createElement('a');
      const url = URL.createObjectURL(imageFile);
      link.href = url;
      link.download = imageFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    try {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
            await navigator.share({
                title: `Comprovante de Dívida - ${debtPayment.customerName}`,
                files: [imageFile],
            });
            onClose();
        } else {
            showNotification('Compartilhamento não suportado. Baixando imagem...', 'success');
            downloadFallback();
        }
    } catch (error: any) {
        if (error.name !== 'AbortError') {
            console.error('Share API error:', error);
            showNotification('Falha ao compartilhar. Iniciando download...', 'success');
            downloadFallback();
        }
    }
  };


  if (!isOpen) return null;

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
            onClick={handleShare}
            disabled={isGenerating || !imageFile}
            className="inline-flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-2 px-6 rounded-md hover:bg-cyan-500 transition-colors order-1 sm:order-3 disabled:bg-slate-500 disabled:cursor-wait"
          >
            <ShareIcon className="w-5 h-5" />
            <span>{isGenerating ? 'Gerando...' : 'Compartilhar'}</span>
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