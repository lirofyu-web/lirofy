// components/ShareCustomerModal.tsx
import React, { useState } from 'react';
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
}

const ShareCustomerModal: React.FC<ShareCustomerModalProps> = ({ isOpen, onClose, customer, showNotification }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [isSavingPng, setIsSavingPng] = useState(false);

  // Verifica se o navegador suporta a API de compartilhamento Web Share.
  const canShareFiles = !!(navigator.share && navigator.canShare);

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
  
  const handleSaveAsPng = async () => {
    setIsSavingPng(true);
    showNotification('Gerando imagem PNG, por favor aguarde...', 'success');

    const sheetContainer = document.createElement('div');
    sheetContainer.style.position = 'absolute';
    sheetContainer.style.left = '-9999px';
    sheetContainer.style.width = '210mm';
    document.body.appendChild(sheetContainer);

    const root = createRoot(sheetContainer);
    root.render(<CustomerSheet customer={customer} />);

    try {
        await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => setTimeout(resolve, 200)); // Pequeno atraso para garantir a renderização completa
        
        const elementToCapture = sheetContainer.firstChild as HTMLElement;
        if (!elementToCapture) {
            throw new Error("O componente da ficha do cliente não renderizou para captura.");
        }

        const canvas = await html2canvas(elementToCapture, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#f1f5f9'
        });

        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `ficha_${customer.name.replace(/\s/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('Erro ao gerar imagem PNG:', error);
        showNotification('Ocorreu um erro ao gerar a imagem PNG.', 'error');
    } finally {
        root.unmount();
        document.body.removeChild(sheetContainer);
        setIsSavingPng(false);
        onClose();
    }
  };

  const handleShareAsImage = async () => {
    if (!canShareFiles) {
        showNotification('Seu navegador não suporta o compartilhamento de arquivos.', 'error');
        return;
    }

    setIsSharing(true);
    showNotification('Gerando imagem, por favor aguarde...', 'success');

    const sheetContainer = document.createElement('div');
    sheetContainer.style.position = 'absolute';
    sheetContainer.style.left = '-9999px';
    sheetContainer.style.width = '210mm';
    document.body.appendChild(sheetContainer);

    const root = createRoot(sheetContainer);
    root.render(<CustomerSheet customer={customer} />);

    try {
        await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => setTimeout(resolve, 200)); // Pequeno atraso para garantir a renderização completa
        
        const elementToCapture = sheetContainer.firstChild as HTMLElement;
        if (!elementToCapture) {
            throw new Error("O componente da ficha do cliente não renderizou para captura.");
        }

        const canvas = await html2canvas(elementToCapture, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#f1f5f9'
        });

        canvas.toBlob(async (blob) => {
            if (!blob) {
                showNotification('Falha ao gerar a imagem.', 'error');
                setIsSharing(false);
                root.unmount();
                document.body.removeChild(sheetContainer);
                return;
            }

            const file = new File([blob], `ficha_${customer.name.replace(/\s/g, '_')}.jpg`, { type: 'image/jpeg' });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: `Ficha Cadastral - ${customer.name}`,
                        text: `Segue a ficha cadastral de ${customer.name}.`,
                        files: [file],
                    });
                } catch (error) {
                    if ((error as DOMException).name !== 'AbortError') {
                        console.error('Share API error:', error);
                        showNotification('O compartilhamento falhou.', 'error');
                    }
                }
            } else {
                 showNotification('Não é possível compartilhar este tipo de arquivo ou o navegador não suporta a função.', 'error');
            }
            
            root.unmount();
            document.body.removeChild(sheetContainer);
            setIsSharing(false);
            onClose();

        }, 'image/jpeg', 0.9);

    } catch (error) {
        console.error('Erro ao gerar imagem com html2canvas:', error);
        showNotification('Ocorreu um erro ao gerar a imagem.', 'error');
        root.unmount();
        document.body.removeChild(sheetContainer);
        setIsSharing(false);
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
                onClick={handleSaveAsPng}
                disabled={isSavingPng}
                className="w-full flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-left hover:bg-slate-700/50 hover:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
                <PrinterIcon className="w-8 h-8 text-cyan-400 flex-shrink-0" />
                <div>
                    <h3 className="font-bold text-white">{isSavingPng ? 'Salvando PNG...' : 'Salvar como PNG'}</h3>
                    <p className="text-sm text-slate-400">Salva uma imagem de alta qualidade da ficha do cliente em formato PNG.</p>
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
                disabled={isSharing || !canShareFiles}
                className="w-full flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-left hover:bg-slate-700/50 hover:border-green-500 transition-colors disabled:opacity-50 disabled:cursor-wait"
                title={!canShareFiles ? "Seu navegador não suporta compartilhamento de arquivos" : "Compartilhar como imagem JPG"}
            >
                <ImageIcon className="w-8 h-8 text-green-400 flex-shrink-0" />
                <div>
                    <h3 className="font-bold text-white">{isSharing ? 'Gerando Imagem...' : 'Compartilhar Imagem (JPG)'}</h3>
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