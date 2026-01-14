// components/CityCustomersModal.tsx
import React from 'react';
import { Customer, Warning } from '../types';
import CustomerCard from './CustomerCard';
import { XIcon } from './icons/XIcon';

interface CityCustomersModalProps {
  city: string;
  customers: Customer[];
  warnings: Warning[];
  onClose: () => void;
  // Pass down all the handlers CustomerCard needs
  onBillCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
  onPayDebtCustomer: (customer: Customer) => void;
  onHistoryCustomer: (customer: Customer) => void;
  onShareCustomer: (customer: Customer) => void;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  onFocusCustomer: (customer: Customer) => void;
}

const CityCustomersModal: React.FC<CityCustomersModalProps> = ({
  city,
  customers,
  warnings,
  onClose,
  ...customerCardProps // Spread the rest of the props for CustomerCard
}) => {
  return (
    <div
      className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 p-4 animate-fade-in no-print"
      role="dialog"
      aria-modal="true"
    >
      <header className="sticky top-0 z-10 flex items-center justify-between mb-6 pb-4 border-b border-slate-700 bg-slate-900/90 -mx-4 px-4 -mt-4 pt-4">
        <h1 className="text-4xl lg:text-5xl font-black text-white break-words">
          {city}
        </h1>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full"
          aria-label="Fechar"
        >
          <XIcon className="w-8 h-8" />
        </button>
      </header>

      <main className="overflow-y-auto h-full pb-16 -mx-4 px-4">
        {customers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {customers.map(customer => {
              const hasActiveWarning = warnings.some(w => w.customerId === customer.id && !w.isResolved);
              return (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  hasActiveWarning={hasActiveWarning}
                  onBill={customerCardProps.onBillCustomer}
                  onEdit={customerCardProps.onEditCustomer}
                  onDelete={customerCardProps.onDeleteCustomer}
                  onPayDebt={customerCardProps.onPayDebtCustomer}
                  onHistory={customerCardProps.onHistoryCustomer}
                  onShare={customerCardProps.onShareCustomer}
                  showNotification={customerCardProps.showNotification}
                  onFocusCustomer={customerCardProps.onFocusCustomer}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-center py-10 text-slate-500 dark:text-slate-400">
            Nenhum cliente encontrado para esta cidade com os filtros atuais.
          </p>
        )}
      </main>
      
      <style>{`
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default CityCustomersModal;
