// components/BackupReminder.tsx
import React, { useState, useMemo } from 'react';
import { AlertIcon } from './icons/AlertIcon';
import { CloudUploadIcon } from './icons/CloudUploadIcon';

interface BackupReminderProps {
  lastBackupDate: string | null;
  onNavigate: () => void;
}

const BackupReminder: React.FC<BackupReminderProps> = ({ lastBackupDate, onNavigate }) => {
  const [isVisible, setIsVisible] = useState(true);

  const shouldShowReminder = useMemo(() => {
    if (!lastBackupDate) {
      return true; // Show if they've never backed up
    }
    const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
    const lastBackupTime = new Date(lastBackupDate).getTime();
    const now = new Date().getTime();
    return (now - lastBackupTime > sevenDaysInMillis);
  }, [lastBackupDate]);

  if (!shouldShowReminder || !isVisible) {
    return null;
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/40 p-6 rounded-lg shadow-lg border-2 border-amber-400 dark:border-amber-600">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-shrink-0 text-amber-500 dark:text-amber-400">
          <AlertIcon className="w-8 h-8" />
        </div>
        <div className="flex-grow">
          <h3 className="text-xl font-semibold text-amber-900 dark:text-amber-200">Lembrete de Backup</h3>
          <p className="text-amber-800 dark:text-amber-300 mt-1">
            Faz mais de uma semana que você não salva seus dados. Para evitar perdas, faça um backup regularmente.
          </p>
        </div>
        <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-4 sm:mt-0">
          <button
            onClick={() => setIsVisible(false)}
            className="w-full sm:w-auto px-4 py-2 text-sm font-bold rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            Lembrar Depois
          </button>
          <button
            onClick={onNavigate}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-md bg-sky-600 text-white hover:bg-sky-500"
          >
            <CloudUploadIcon className="w-5 h-5 transform rotate-180" />
            Fazer Backup Agora
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupReminder;
