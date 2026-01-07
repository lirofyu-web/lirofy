// components/WarningsReminders.tsx
import React, { useMemo } from 'react';
import { Warning } from '../types';
import { AlertIcon } from './icons/AlertIcon';

interface WarningsRemindersProps {
  warnings: Warning[];
}

const WarningsReminders: React.FC<WarningsRemindersProps> = ({ warnings }) => {
  const activeWarnings = useMemo(() => {
    return warnings
      .filter(w => !w.isResolved)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [warnings]);

  if (activeWarnings.length === 0) {
    return null;
  }

  return (
    <div className="bg-purple-50 dark:bg-purple-900/40 p-6 rounded-lg shadow-lg border-2 border-purple-400 dark:border-purple-600">
      <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-200 mb-4 border-b border-purple-300 dark:border-purple-700 pb-3 flex items-center gap-2">
        <AlertIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        Lembretes de Avisos Pendentes
      </h3>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {activeWarnings.map(warning => (
          <div key={warning.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="font-bold text-slate-800 dark:text-white">{warning.customerName}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{warning.message}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {new Date(warning.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WarningsReminders;