// components/PrivacyPinModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { XIcon } from './icons/XIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';

interface PrivacyPinModalProps {
  isOpen: boolean;
  mode: 'create' | 'enter';
  title: string;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  error?: string;
}

const PrivacyPinModal: React.FC<PrivacyPinModalProps> = ({ isOpen, mode, title, onClose, onConfirm, error }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [internalError, setInternalError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setConfirmPin('');
      setInternalError('');
      // Focus the input when the modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  useEffect(() => {
      setInternalError(error || '');
  }, [error]);

  const handlePinChange = (value: string) => {
    // Allow only numeric input up to 6 digits
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 6) {
      setPin(numericValue);
      setInternalError('');
    }
  };
  
  const handleConfirmPinChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 6) {
      setConfirmPin(numericValue);
      setInternalError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') {
      if (pin.length < 4) {
        setInternalError('O PIN deve ter entre 4 e 6 dígitos.');
        return;
      }
      if (pin !== confirmPin) {
        setInternalError('Os PINs não coincidem.');
        return;
      }
    } else { // 'enter' mode
        if (pin.length < 4) {
             setInternalError('PIN inválido.');
             return;
        }
    }
    onConfirm(pin);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[101] p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-sm border border-slate-700 animate-fade-in-up">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LockClosedIcon className="w-6 h-6 text-lime-400" />
            {title}
          </h2>
          <button onClick={onClose} className="p-1 -mr-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1 text-center">{mode === 'create' ? 'Digite o novo PIN (4-6 dígitos)' : 'Digite seu PIN'}</label>
            <input 
              ref={inputRef}
              type="password" 
              inputMode="numeric"
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              maxLength={6}
              className="w-full bg-slate-700 border border-slate-600 rounded-md py-3 px-4 text-white text-2xl text-center font-mono tracking-[0.5em] focus:ring-lime-500 focus:outline-none"
            />
          </div>
          
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1 text-center">Confirme o PIN</label>
              <input 
                type="password" 
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => handleConfirmPinChange(e.target.value)}
                maxLength={6}
                className="w-full bg-slate-700 border border-slate-600 rounded-md py-3 px-4 text-white text-2xl text-center font-mono tracking-[0.5em] focus:ring-lime-500 focus:outline-none"
              />
            </div>
          )}

          {(internalError) && <p className="text-red-400 text-sm text-center">{internalError}</p>}

          <div className="pt-4 flex justify-end gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-lime-600 text-white font-bold py-2 px-6 rounded-md hover:bg-lime-500"
            >
              Confirmar
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default PrivacyPinModal;
