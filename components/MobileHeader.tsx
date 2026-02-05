// components/MobileHeader.tsx
import React from 'react';
import { MenuIcon } from './icons/MenuIcon';
import { InstallIcon } from './icons/InstallIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { LockOpenIcon } from './icons/LockOpenIcon';

interface MobileHeaderProps {
    title: string;
    onMenuClick: () => void;
    deferredPrompt: any;
    onInstallPrompt: () => void;
    isPrivacyModeEnabled: boolean;
    isPrivacyUnlocked: boolean;
    onToggleLock: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ title, onMenuClick, deferredPrompt, onInstallPrompt, isPrivacyModeEnabled, isPrivacyUnlocked, onToggleLock }) => {
    return (
        <header className="md:hidden flex items-center gap-4 fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 h-20 z-10 border-b border-slate-200/50 dark:border-slate-700/50 pt-[env(safe-area-inset-top)]">
            <button
                onClick={onMenuClick}
                className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                aria-label="Abrir menu"
            >
                <MenuIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex-grow">{title}</h1>
            
            {isPrivacyModeEnabled && (
                 <button onClick={onToggleLock} className="p-2 text-slate-600 dark:text-slate-300" aria-label={isPrivacyUnlocked ? "Ocultar valores" : "Mostrar valores"}>
                    {isPrivacyUnlocked ? <LockOpenIcon className="w-6 h-6 text-lime-400" /> : <LockClosedIcon className="w-6 h-6 text-slate-400" />}
                </button>
            )}

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