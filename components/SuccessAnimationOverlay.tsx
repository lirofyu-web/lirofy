// components/ActionFeedbackOverlay.tsx
import React, { useEffect, useMemo } from 'react';
import { LogoIcon } from './icons/LogoIcon';
import { PencilIcon } from './icons/PencilIcon';
import { AlertIcon } from './icons/AlertIcon';

interface ActionFeedbackOverlayProps {
  isOpen: boolean;
  onEnd: () => void;
  variant: 'success' | 'edit' | 'delete' | 'pending';
  message: string;
}

const ActionFeedbackOverlay: React.FC<ActionFeedbackOverlayProps> = ({ isOpen, onEnd, variant, message }) => {
  useEffect(() => {
    let timer: number;
    if (isOpen) {
      timer = window.setTimeout(() => {
        onEnd();
      }, 2000); // Animation duration
    }
    return () => clearTimeout(timer);
  }, [isOpen, onEnd]);

  const config = useMemo(() => {
    switch (variant) {
      case 'edit':
        return {
          borderColorClass: 'border-amber-500',
          iconColor: '#f59e0b',
          icon: <div className="icon-wrapper animate-pulse-icon"><PencilIcon className="w-12 h-12 text-amber-500" /></div>
        };
      case 'delete':
        return {
          borderColorClass: 'border-red-500',
          iconColor: '#ef4444',
          icon: (
            <svg className="feedback-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="feedback-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="feedback-line" fill="none" d="M16 16 36 36" />
              <path className="feedback-line" fill="none" d="M36 16 16 36" />
            </svg>
          )
        };
      case 'pending':
        return {
          borderColorClass: 'border-amber-500',
          iconColor: '#f59e0b',
          icon: <div className="icon-wrapper animate-pulse-icon"><AlertIcon className="w-12 h-12 text-amber-500" /></div>
        };
      case 'success':
      default:
        return {
          borderColorClass: 'border-lime-500',
          iconColor: '#84cc16',
          icon: (
            <svg className="feedback-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="feedback-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="feedback-line" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          )
        };
    }
  }, [variant]);
  
  const styleVars = { '--icon-color': config.iconColor } as React.CSSProperties;

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in"
      role="alert"
      style={styleVars}
    >
      <div className={`bg-slate-800 border-2 ${config.borderColorClass} rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-scale-in`}>
        {config.icon}
        <h2 className="text-2xl font-bold text-white mt-6 animate-text-fade-in">
          {message}
        </h2>
        <div className="mt-4 animate-logo-fade-in">
          <LogoIcon className="h-20 w-auto mx-auto" />
        </div>
      </div>
      <style>{`
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        
        @keyframes scale-in { 
          0% { opacity: 0; transform: scale(0.8); } 
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scale-in 0.4s 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
        
        .feedback-svg {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: block;
          stroke-width: 3;
          stroke: var(--icon-color);
          stroke-miterlimit: 10;
          margin: 0 auto;
        }

        .feedback-circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.3s forwards;
        }

        .feedback-line {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: stroke 0.4s cubic-bezier(0.65, 0, 0.45, 1) 0.9s forwards;
        }
        
        @keyframes stroke {
          100% { stroke-dashoffset: 0; }
        }
        
        @keyframes text-fade-in { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-text-fade-in { opacity: 0; animation: text-fade-in 0.5s 1.2s ease-out forwards; }
        
        @keyframes logo-fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-logo-fade-in { opacity: 0; animation: logo-fade-in 0.6s 1.5s ease-out forwards; }
        
        @keyframes pulse-icon-anim {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .icon-wrapper { display: inline-block; }
        .animate-pulse-icon { animation: pulse-icon-anim 1s cubic-bezier(0.4, 0, 0.6, 1) 2; }
      `}</style>
    </div>
  );
};

export default ActionFeedbackOverlay;
