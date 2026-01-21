// components/InstallPwaBanner.tsx
import React from 'react';
import { LogoIcon } from './icons/LogoIcon';
import { InstallIcon } from './icons/InstallIcon';
import { XIcon } from './icons/XIcon';

interface InstallPwaBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

const InstallPwaBanner: React.FC<InstallPwaBannerProps> = ({ onInstall, onDismiss }) => {
  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 p-4 no-print animate-fade-in-up" role="dialog" aria-labelledby="install-banner-title">
      <div className="max-w-4xl mx-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"
          aria-label="Dispensar banner de instalação"
        >
          <XIcon className="w-5 h-5" />
        </button>
        
        <div className="hidden sm:block flex-shrink-0">
          <LogoIcon className="w-16 h-16" />
        </div>
        
        <div className="flex-grow">
          <h3 id="install-banner-title" className="font-bold text-slate-900 dark:text-white">Instale o App na Tela Inicial</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">Acesso rápido e uso offline, como um aplicativo nativo.</p>
        </div>
        
        <div className="flex-shrink-0">
          <button
            onClick={onInstall}
            className="inline-flex items-center gap-2 bg-lime-500 text-white font-bold py-2 px-4 rounded-md hover:bg-lime-600 transition-colors"
          >
            <InstallIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Instalar Agora</span>
            <span className="sm:hidden">Instalar</span>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(100%); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default InstallPwaBanner;