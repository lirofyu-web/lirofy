// components/HistoryModal.tsx
import React, { useMemo } from 'react';
import { Customer, Billing, DebtPayment } from '../types';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { ReceiptIcon } from './icons/ReceiptIcon';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  billings: Billing[];
  debtPayments: DebtPayment[];
}

type HistoryItem = {
    id: string;
    date: Date;
    type: 'billing' | 'payment';
    description: string;
    amount: number;
    paymentMethod: 'pix' | 'dinheiro' | 'fiado' | 'misto';
    equipmentType?: 'mesa' | 'jukebox' | 'grua';
};

const PaymentMethodDisplay: React.FC<{ method: 'pix' | 'dinheiro' | 'fiado' | 'misto' }> = React.memo(({ method }) => {
    const styles = {
        pix: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600',
        dinheiro: 'bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-600',
        fiado: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-600',
        misto: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-600',
    };
    const text = {
        pix: 'PIX',
        dinheiro: 'Dinheiro',
        fiado: 'Fiado',
        misto: 'Misto',
    };

    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[method]}`}>
            {text[method]}
        </span>
    );
});


const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, customer, billings, debtPayments }) => {
    
    const historyItems = useMemo(() => {
        const customerBillings: HistoryItem[] = billings
            .filter(b => b.customerId === customer.id)
            .map(b => {
                let description = 'Cobrança';
                if (b.equipmentType === 'mesa') description += ' - Mesa';
                if (b.equipmentType === 'jukebox') description += ' - Jukebox';
                if (b.equipmentType === 'grua') description += ' - Grua';

                return {
                    id: b.id,
                    date: new Date(b.settledAt),
                    type: 'billing' as 'billing',
                    description: description,
                    amount: b.valorTotal,
                    paymentMethod: b.paymentMethod,
                    equipmentType: b.equipmentType,
                };
            });

        const customerPayments: HistoryItem[] = debtPayments
            .filter(p => p.customerId === customer.id)
            .map(p => ({
                id: p.id,
                date: new Date(p.paidAt),
                type: 'payment',
                description: `Pagamento de Dívida (${p.paymentMethod === 'pix' ? 'PIX' : 'Dinheiro'})`,
                amount: p.amountPaid,
                paymentMethod: p.paymentMethod,
            }));

        return [...customerBillings, ...customerPayments].sort((a, b) => b.date.getTime() - a.date.getTime());

    }, [customer, billings, debtPayments]);

    if (!isOpen) return null;

    const colorStyles = {
        mesa: { bg: 'bg-cyan-100 dark:bg-cyan-900/50', text: 'text-cyan-600 dark:text-cyan-400' },
        jukebox: { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/50', text: 'text-fuchsia-600 dark:text-fuchsia-400' },
        grua: { bg: 'bg-orange-100 dark:bg-orange-900/50', text: 'text-orange-600 dark:text-orange-400' },
        payment: { bg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-600 dark:text-emerald-400' }
    };

    return (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="history-modal-title"
        >
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 animate-fade-in-up max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 id="history-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white">Histórico do Cliente</h2>
                    <p className="text-slate-500 dark:text-slate-400">{customer.name}</p>
                </div>
                <div className="p-6 overflow-y-auto">
                    {historyItems.length > 0 ? (
                        <ul className="space-y-4">
                            {historyItems.map(item => {
                                const style = item.type === 'billing' ? colorStyles[item.equipmentType || 'mesa'] : colorStyles.payment;
                                return (
                                <li key={item.id} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className={`mt-1 flex-shrink-0 p-2 rounded-full ${style.bg}`}>
                                        {item.type === 'billing' 
                                            ? <ReceiptIcon className={`w-5 h-5 ${style.text}`} />
                                            : <CurrencyDollarIcon className={`w-5 h-5 ${style.text}`} />
                                        }
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">{item.description}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{item.date.toLocaleDateString('pt-BR')}</p>
                                            </div>
                                            <p className={`font-mono font-bold text-lg ${style.text}`}>
                                                R$ {item.amount.toFixed(2)}
                                            </p>
                                        </div>
                                        {item.paymentMethod && (
                                            <div className="mt-2">
                                                <PaymentMethodDisplay method={item.paymentMethod} />
                                            </div>
                                        )}
                                    </div>
                                </li>
                            )})}
                        </ul>
                    ) : (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                            <p>Nenhuma transação registrada para este cliente.</p>
                        </div>
                    )}
                </div>
                <div className="p-6 mt-auto bg-slate-50 dark:bg-slate-800/50 rounded-b-lg flex justify-end gap-4 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={onClose} className="bg-slate-500 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500 transition-colors">Fechar</button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default HistoryModal;