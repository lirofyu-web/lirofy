// components/EquipmentQrCodeModal.tsx
import React, { useState } from 'react';
import { Equipment } from '../types';
import { ShareIcon } from './icons/ShareIcon';
import EquipmentLabel from './EquipmentLabel';
import { generateEquipmentLabelText } from '../utils/receiptGenerator';

interface EquipmentQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

const EquipmentQrCodeModal: React.FC<EquipmentQrCodeModalProps> = ({ isOpen, onClose, equipment, showNotification }) => {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Gera o texto formatado para a etiqueta
      const text = generateEquipmentLabelText(equipment);

      // Usa a API de Compartilhamento da Web para texto
      if (navigator.share) {
        await navigator.share({
          title: `Etiqueta Equipamento ${equipment.numero}`,
          text: text,
        });
        onClose(); // Fecha a modal após o compartilhamento ser iniciado
      } else {
        // Fallback para navegadores sem a API de compartilhamento (copia para a área de transferência)
        await navigator.clipboard.writeText(text);
        showNotification('Etiqueta copiada! O compartilhamento não é suportado.', 'success');
        onClose();
      }
    } catch (error: any) {
       if (error.name !== 'AbortError') { // Ignora o erro se o usuário cancelar o compartilhamento
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
          <button 
            onClick={handleShare} 
            disabled={isSharing} 
            className="inline-flex items-center gap-2 bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500 disabled:bg-slate-500 disabled:cursor-wait"
          >
            <ShareIcon className="w-5 h-5"/> 
            <span>{isSharing ? 'Aguardando...' : 'Compartilhar'}</span>
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