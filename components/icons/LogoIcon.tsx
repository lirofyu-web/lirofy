// components/icons/LogoIcon.tsx
import React from 'react';

export const LogoIcon = ({ className }: { className?: string }) => (
  <div className={`text-center ${className}`}>
    <h1 className="text-lg font-black leading-tight text-slate-800 dark:text-white tracking-tighter">
      MONTANHA BILHAR & JUKEBOX
    </h1>
    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 uppercase tracking-widest">
      SISTEMA DE LOCAÇÃO E COBRANÇAS
    </p>
  </div>
);