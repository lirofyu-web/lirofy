// components/MobileHeader.tsx
import React from 'react';
import { MenuIcon } from './icons/MenuIcon';
import { InstallIcon } from './icons/InstallIcon';

interface MobileHeaderProps {
    title: string;
    onMenuClick: () => void;
    deferredPrompt: any;
    onInstallPrompt: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ title, onMenuClick, deferredPrompt, onInstallPrompt }) => {
    return (
        <header className="md:hidden flex items-center gap-4 mb-6 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm -mx-4 px-4 py-3 z-10 border-b border-slate-200/50 dark:border-slate-700/50">
            <button
                onClick={onMenuClick}
                className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                aria-label="Abrir menu"
            >
                <MenuIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex-grow">{title}</h1>
            {deferredPrompt && (
                <button
                    onClick={onInstallPrompt}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:text-lime-500 dark:hover:text-lime-400"
                    aria-label="Instalar Aplicativo"
                >
                    <InstallIcon className="w-6 h-6" />
                </button>
            )}
        </header>
    );
};

export default MobileHeader;