// components/ShareCustomerModal.tsx
import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { PrinterIcon } from './icons/PrinterIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { ImageIcon } from './icons/ImageIcon';
import CustomerSheet from './CustomerSheet';
import { createRoot } from 'react-dom/client';

// Declara html2canvas para TypeScript, já que é carregado via tag de script global.
declare const html2canvas: any;

interface ShareCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  onPrintCustomer: (customer: Customer) => void;
}

const ShareCustomerModal: React.FC<ShareCustomerModalProps> = ({ isOpen, onClose, customer, showNotification, onPrintCustomer }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const canShareFiles = !!(navigator.share && navigator.canShare);

  useEffect(() => {
    if (!isOpen || !canShareFiles) {
        setImageFile(null);
        return;
    }

    const generateImage = async () => {
        setIsGenerating(true);
        setImageFile(null);

        const sheetContainer = document.createElement('div');
        sheetContainer.style.position = 'absolute';
        sheetContainer.style.left = '-9999px';
        sheetContainer.style.width = '210mm';
        document.body.appendChild(sheetContainer);

        const root = createRoot(sheetContainer);
        root.render(<CustomerSheet customer={customer} />);
        
        const cleanup = () => {
            root.unmount();
            if (document.body.contains(sheetContainer)) {
                document.body.removeChild(sheetContainer);
            }
            setIsGenerating(false);
        };

        try {
            await document.fonts.ready;
            await new Promise(resolve => requestAnimationFrame(resolve));
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const elementToCapture = sheetContainer.firstChild as HTMLElement;
            if (!elementToCapture) {
                throw new Error("O componente da ficha do cliente não renderizou para captura.");
            }

            const canvas = await html2canvas(elementToCapture, {
                scale: 1.5, // Reduced scale for faster generation on large elements
                useCORS: true,
                backgroundColor: '#f1f5f9'
            });

            canvas.toBlob((blob) => {
                if (!blob) {
                    showNotification('Falha ao gerar a imagem.', 'error');
                    cleanup();
                    return;
                }
                const file = new File([blob], `ficha_${customer.name.replace(/\s/g, '_')}.jpg`, { type: 'image/jpeg' });
                setImageFile(file);
                cleanup();
            }, 'image/jpeg', 0.9);

        } catch (error) {
            console.error('Erro ao gerar imagem com html2canvas:', error);
            showNotification('Ocorreu um erro ao gerar a imagem.', 'error');
            cleanup();
        }
    };

    generateImage();
  }, [isOpen, customer, showNotification, canShareFiles]);


  const handleCopyJson = () => {
    const customerDataToShare = {
      name: customer.name,
      cpfRg: customer.cpfRg,
      cidade: customer.cidade,
      endereco: customer.endereco,
      telefone: customer.telefone,
      linhaNumero: customer.linhaNumero,
      latitude: customer.latitude,
      longitude: customer.longitude,
      equipment: customer.equipment.map(({ id, ...rest }) => rest) // Remove runtime ID
    };

    const textToCopy = JSON.stringify(customerDataToShare, null, 2);

    navigator.clipboard.writeText(textToCopy).then(() => {
        showNotification('Dados do cliente copiados para a área de transferência!');
    }).catch(err => {
        showNotification('Erro ao copiar dados.', 'error');
        console.error('Could not copy text: ', err);
    });
    onClose();
  };
  
  const handlePrint = () => {
    onPrintCustomer(customer);
    onClose();
  };

  const handleShareAsImage = async () => {
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
        if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
            await navigator.share({
                title: `Ficha Cadastral - ${customer.name}`,
                text: `Segue a ficha cadastral de ${customer.name}.`,
                files: [imageFile],
            });
            onClose();
        } else {
            showNotification('Compartilhamento de arquivo não suportado. Baixando imagem...', 'success');
            downloadFallback();
        }
    } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
            console.error('Share API error:', error);
            showNotification('O compartilhamento falhou. Iniciando download...', 'success');
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
      aria-labelledby="share-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <div className="p-6">
          <h2 id="share-modal-title" className="text-2xl font-bold text-white">Exportar Cliente</h2>
          <p className="text-slate-400 mt-2">Como você deseja exportar os dados de {customer.name}?</p>
        </div>
        <div className="p-6 space-y-4">
            <button
                onClick={handlePrint}
                className="w-full flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-left hover:bg-slate-700/50 hover:border-cyan-500 transition-colors"
            >
                <PrinterIcon className="w-8 h-8 text-cyan-400 flex-shrink-0" />
                <div>
                    <h3 className="font-bold text-white">Gerar Ficha (PDF/Impressão)</h3>
                    <p className="text-sm text-slate-400">Abre a opção de impressão para salvar como PDF ou imprimir.</p>
                </div>
            </button>
            <button
                onClick={handleCopyJson}
                className="w-full flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-left hover:bg-slate-700/50 hover:border-lime-500 transition-colors"
            >
                <DocumentDuplicateIcon className="w-8 h-8 text-lime-400 flex-shrink-0" />
                <div>
                    <h3 className="font-bold text-white">Copiar Dados (JSON)</h3>
                    <p className="text-sm text-slate-400">Copia os dados brutos. Útil para backups ou importação em texto.</p>
                </div>
            </button>
            <button
                onClick={handleShareAsImage}
                disabled={isGenerating || !imageFile}
                className="w-full flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-left hover:bg-slate-700/50 hover:border-green-500 transition-colors disabled:opacity-50 disabled:cursor-wait"
                title={!canShareFiles ? "Seu navegador não suporta compartilhamento de arquivos" : "Compartilhar como imagem JPG"}
            >
                <ImageIcon className="w-8 h-8 text-green-400 flex-shrink-0" />
                <div>
                    <h3 className="font-bold text-white">{isGenerating || !imageFile ? 'Gerando Imagem...' : 'Compartilhar Imagem (JPG)'}</h3>
                    <p className="text-sm text-slate-400">Gera uma imagem da ficha para enviar via WhatsApp ou outros apps.</p>
                </div>
            </button>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500 transition-colors"
          >
            Fechar
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

export default ShareCustomerModal;
