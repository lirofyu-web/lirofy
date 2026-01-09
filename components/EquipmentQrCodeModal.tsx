// components/EquipmentQrCodeModal.tsx
import React, { useState, useEffect } from 'react';
import { Equipment } from '../types';
import { ShareIcon } from './icons/ShareIcon';
import EquipmentLabel from './EquipmentLabel';
import { createRoot } from 'react-dom/client';

declare const html2canvas: any;

interface EquipmentQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

const EquipmentQrCodeModal: React.FC<EquipmentQrCodeModalProps> = ({ isOpen, onClose, equipment, showNotification }) => {
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

      const labelContainer = document.createElement('div');
      labelContainer.style.position = 'absolute';
      labelContainer.style.left = '-9999px';

      const renderContainer = document.createElement('div');
      renderContainer.style.backgroundColor = '#d1d5db';
      renderContainer.style.display = 'inline-block';
      renderContainer.style.padding = '1rem';
      renderContainer.appendChild(labelContainer);
      document.body.appendChild(renderContainer);

      const root = createRoot(labelContainer);
      root.render(<EquipmentLabel equipment={equipment} />);
      
      const cleanup = () => {
        root.unmount();
        if (document.body.contains(renderContainer)) {
          document.body.removeChild(renderContainer);
        }
        setIsGenerating(false);
      };

      try {
        await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure render completes

        const canvas = await html2canvas(renderContainer, { 
            scale: 3,
            useCORS: true,
            logging: false
        });

        canvas.toBlob((blob) => {
          if (!blob) {
            showNotification('Falha ao gerar a imagem da etiqueta.', 'error');
            cleanup();
            return;
          }
          const file = new File([blob], `etiqueta_${equipment.numero}.png`, { type: 'image/png' });
          setImageFile(file);
          cleanup();
        }, 'image/png');
      } catch (error: any) {
        console.error('Erro ao gerar imagem da etiqueta:', error);
        showNotification(`Erro ao gerar imagem: ${error.message || 'Tente novamente'}`, 'error');
        cleanup();
      }
    };

    generateImage();
  }, [isOpen, equipment, showNotification]);
  
  const handleShare = async () => {
    if (!imageFile) {
        showNotification('A imagem da etiqueta ainda está sendo gerada, aguarde.', 'error');
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
                title: `Etiqueta Equipamento Nº ${equipment.numero}`,
                files: [imageFile],
            });
            onClose();
        } else {
            showNotification('Compartilhamento não suportado. Baixando arquivo...', 'success');
            downloadFallback();
        }
    } catch (error: any) {
        if (error.name !== 'AbortError') {
            console.error('Share API error:', error);
            showNotification('Falha ao compartilhar. Iniciando download do arquivo.', 'success');
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
      aria-labelledby="equipment-label-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-xs border border-slate-700 animate-fade-in-up">
        <div className="p-4 border-b border-slate-700 text-center">
            <h2 id="equipment-label-modal-title" className="text-lg font-bold text-white">Etiqueta de Equipamento</h2>
        </div>
        <div className="p-4 bg-gray-300 flex justify-center">
            <div>
                <EquipmentLabel equipment={equipment} />
            </div>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-b-lg flex justify-between items-center gap-4">
          <button onClick={onClose} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">Fechar</button>
          <button onClick={handleShare} disabled={isGenerating || !imageFile} className="inline-flex items-center gap-2 bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500 disabled:bg-slate-500 disabled:cursor-wait">
            <ShareIcon className="w-5 h-5"/> <span>{isGenerating || !imageFile ? 'Gerando...' : 'Compartilhar'}</span>
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

export default EquipmentQrCodeModal;