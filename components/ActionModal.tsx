import React from 'react';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  confirmText?: string;
  children: React.ReactNode;
  isConfirming?: boolean;
}

const ActionModal: React.FC<ActionModalProps> = ({ isOpen, onClose, onConfirm, title, confirmText = 'Confirmar', children, isConfirming = false }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-modal-title"
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 animate-fade-in-up">
        <div className="p-6">
          <h2 id="action-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
          <div className="text-slate-600 dark:text-slate-400 mt-4 break-words">{children}</div>
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-white font-bold py-2 px-6 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-slate-500 transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className="bg-lime-500 text-white font-bold py-2 px-6 rounded-md hover:bg-lime-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-lime-500 transition-colors duration-200 disabled:bg-slate-500 disabled:cursor-wait"
          >
            {isConfirming ? 'Salvando...' : confirmText}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ActionModal;