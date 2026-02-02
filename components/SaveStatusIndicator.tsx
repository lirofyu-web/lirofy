// components/SaveStatusIndicator.tsx
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { SaveIcon } from './icons/SaveIcon';

type Status = 'hidden' | 'dirty' | 'saved';

interface SaveStatusIndicatorProps {
  isDirty: boolean;
}

const usePrevious = <T,>(value: T): T | undefined => {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};


const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ isDirty }) => {
  const [status, setStatus] = useState<Status>('hidden');
  const prevIsDirty = usePrevious(isDirty);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // Clear any existing timers when props change
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (isDirty) {
      // Data was changed, indicate saving is imminent
      setStatus('dirty');
    } else if (prevIsDirty === true && !isDirty) {
      // Data was just saved
      setStatus('saved');
      // Hide the 'saved' message after a delay
      timerRef.current = window.setTimeout(() => {
        setStatus('hidden');
      }, 2500);
    }

    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isDirty, prevIsDirty]);
  
  const getStatusContent = () => {
    switch(status) {
      case 'dirty':
        return {
          icon: <SaveIcon className="w-5 h-5 animate-pulse" />,
          text: 'Salvando alterações...',
          color: 'bg-amber-500 text-white'
        };
      case 'saved':
        return {
          icon: <CheckCircleIcon className="w-5 h-5" />,
          text: 'Salvo com sucesso!',
          color: 'bg-lime-500 text-white'
        };
      case 'hidden':
      default:
        return null;
    }
  };
  
  const content = getStatusContent();
  const isVisible = status !== 'hidden';

  return (
    <div 
      className={`fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-2 rounded-full shadow-lg transition-all duration-300 ease-out ${content?.color || ''} ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}
      role="status"
    >
      {content?.icon}
      <span className="text-sm font-semibold">{content?.text}</span>
    </div>
  );
};

export default SaveStatusIndicator;