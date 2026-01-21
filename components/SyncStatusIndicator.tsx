// components/SyncStatusIndicator.tsx
import React from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { SaveIcon } from './icons/SaveIcon';
import { CloudUploadIcon } from './icons/CloudUploadIcon';
import { AlertIcon } from './icons/AlertIcon';

interface SyncStatusIndicatorProps {
  status: 'idle' | 'syncing' | 'synced' | 'offline';
  onSync: () => void;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ status, onSync }) => {
  const getStatusContent = () => {
    switch (status) {
      case 'syncing':
        return { icon: <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>, text: 'Sincronizando...', color: 'bg-sky-500' };
      case 'synced':
        return { icon: <CheckCircleIcon className="w-5 h-5" />, text: 'Sincronizado', color: 'bg-lime-500' };
      case 'offline':
        return { icon: <AlertIcon className="w-5 h-5" />, text: 'Offline', color: 'bg-amber-500' };
      case 'idle':
      default:
        return null; // Don't show anything when idle
    }
  };

  const content = getStatusContent();
  if (!content) return null;

  return (
    <button
      onClick={status === 'offline' ? onSync : undefined}
      disabled={status !== 'offline'}
      className={`fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-2 rounded-full shadow-lg transition-all duration-300 ease-out ${content.color} text-white`}
      role="status"
    >
      {content.icon}
      <span className="text-sm font-semibold">{content.text}</span>
    </button>
  );
};

export default SyncStatusIndicator;