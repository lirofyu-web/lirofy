// components/LocationActionsModal.tsx
import React from 'react';
import { Customer } from '../types';
import { LocationArrowIcon } from './icons/LocationArrowIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { XIcon } from './icons/XIcon';

interface LocationActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
}

const LocationActionsModal: React.FC<LocationActionsModalProps> = ({ isOpen, onClose, customer }) => {
  if (!isOpen) return null;

  const handleShare = async () => {
    const text = `Localização do cliente ${customer.name}:\n${customer.endereco}, ${customer.cidade}\n\nLink do mapa:\nhttps://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`;
    const shareData = {
      title: `Localização - ${customer.name}`,
      text: text,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
            console.error('Share API error:', error);
        }
    } finally {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-actions-modal-title"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 id="location-actions-modal-title" className="text-2xl font-bold text-white">Localização</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><XIcon className="w-6 h-6" /></button>
        </div>
        <div className="p-6">
          <p className="text-slate-400 mb-4">O que você deseja fazer com a localização de <strong className="text-white">{customer.name}</strong>?</p>
          <div className="space-y-4">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${customer.latitude},${customer.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="w-full flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-left hover:bg-slate-700/50 hover:border-blue-500 transition-colors"
            >
              <LocationArrowIcon className="w-8 h-8 text-blue-400 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-white">Abrir no Mapa</h3>
                <p className="text-sm text-slate-400">Ver rotas para o endereço no Google Maps.</p>
              </div>
            </a>
            <button
              onClick={handleShare}
              className="w-full flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 text-left hover:bg-slate-700/50 hover:border-green-500 transition-colors"
            >
              <WhatsAppIcon className="w-8 h-8 text-green-400 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-white">Compartilhar Localização</h3>
                <p className="text-sm text-slate-400">Enviar link do mapa via WhatsApp ou outro app.</p>
              </div>
            </button>
          </div>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default LocationActionsModal;