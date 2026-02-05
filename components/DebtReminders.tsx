// components/DebtReminders.tsx
import React, { useMemo } from 'react';
import { Customer } from '../types';
import { BellAlertIcon } from './icons/BellAlertIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';

interface DebtRemindersProps {
  customers: Customer[];
  areValuesHidden: boolean;
}

const DebtReminders: React.FC<DebtRemindersProps> = ({ customers, areValuesHidden }) => {
  const debtors = useMemo(() => {
    return customers
      .filter(c => c.debtAmount > 0)
      .sort((a, b) => b.debtAmount - a.debtAmount);
  }, [customers]);

  if (debtors.length === 0) {
    return null; // Don't render the component if there are no debtors
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/40 p-6 rounded-lg shadow-lg border-2 border-amber-400 dark:border-amber-600">
      <h3 className="text-xl font-semibold text-amber-900 dark:text-amber-200 mb-4 border-b border-amber-300 dark:border-amber-700 pb-3 flex items-center gap-2">
        <BellAlertIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        Lembretes de Dívidas Pendentes
      </h3>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {debtors.map(customer => (
          <div key={customer.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center gap-4">
            <div>
              <p className="font-bold text-slate-800 dark:text-white break-words">{customer.name}</p>
              <p className="text-sm font-mono font-semibold text-red-600 dark:text-red-400">
                Dívida: {areValuesHidden ? 'R$ •••,••' : `R$ ${customer.debtAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
            </div>
            <a
              href={`https://wa.me/55${customer.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${customer.name}, tudo bem? Passando para lembrar sobre o valor de R$ ${customer.debtAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} que ficou pendente. Quando seria uma boa data para acertarmos?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-shrink-0 inline-flex items-center gap-2 text-white text-xs font-bold py-1.5 px-3 rounded-md transition-colors ${
                customer.telefone
                  ? 'bg-green-600 hover:bg-green-500'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
              title={customer.telefone ? 'Cobrar via WhatsApp' : 'Cliente sem telefone cadastrado'}
              onClick={(e) => !customer.telefone && e.preventDefault()}
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>Cobrar</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebtReminders;
