// components/SignatureModal.tsx
import React, { useRef } from 'react';
import SignaturePad, { SignaturePadRef } from './SignaturePad';
import { SaveIcon } from './icons/SaveIcon';
import { TrashIcon } from './icons/TrashIcon';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  title: string;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onSave, title }) => {
  const signaturePadRef = useRef<SignaturePadRef>(null);

  const handleSave = () => {
    const signature = signaturePadRef.current?.getSignature();
    if (signature) {
      onSave(signature);
    } else {
      onClose();
    }
  };

  const handleClear = () => {
    signaturePadRef.current?.clear();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl border border-slate-700 animate-fade-in-up h-[70vh] max-h-[600px] flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">{title}</h2>
        </div>
        <div className="p-4 flex-grow relative">
          <SignaturePad ref={signaturePadRef} />
        </div>
        <div className="p-4 bg-slate-800/50 rounded-b-lg flex justify-between gap-4 border-t border-slate-700">
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-2 bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-500 transition-colors"
          >
            <TrashIcon className="w-5 h-5" /> Limpar
          </button>
          <div>
            <button onClick={onClose} className="bg-slate-500 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-400 transition-colors mr-4">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 bg-lime-500 text-white font-bold py-2 px-6 rounded-md hover:bg-lime-600 transition-colors"
            >
              <SaveIcon className="w-5 h-5" /> Salvar Assinatura
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

export default SignatureModal;