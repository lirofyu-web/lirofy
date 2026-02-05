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
  areValuesHidden: boolean;
}

type HistoryItem = {
    id: string;
    date: Date;
    type: 'billing' | 'payment';
    description: string;
    amount: number; // For payments, this is the amount paid. For billings, it's the net amount received.
    debtChange: number; // Positive for new debt, negative for payment.
    paymentMethod: 'pix' | 'dinheiro' | 'debito_negativo' | 'misto' | 'pending_payment';
    equipmentType?: 'mesa' | 'jukebox' | 'grua';
    paymentDetails?: {dinheiro?: number, pix?: number};
};

const PaymentMethodDisplay: React.FC<{ method: HistoryItem['paymentMethod'] }> = React.memo(({ method }) => {
    const displayMethod = method === 'debito_negativo' ? 'negativo' : method === 'pending_payment' ? 'pendente' : method;
    const styles: Record<string, string> = {
        pix: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600',
        dinheiro: 'bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-600',
        negativo: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-600',
        misto: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-600',
        pendente: 'bg-slate-100 dark:bg-slate-600/50 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-500',
    };
    const text: Record<string, string> = {
        pix: 'PIX',
        dinheiro: 'Dinheiro',
        negativo: 'Negativo',
        misto: 'Misto',
        pendente: 'Pendente',
    };

    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[displayMethod]}`}>
            {text[displayMethod]}
        </span>
    );
});


const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, customer, billings, debtPayments, areValuesHidden }) => {
    
    const historyItems = useMemo(() => {
        const customerBillings: HistoryItem[] = billings
            .filter(b => b.customerId === customer.id)
            .map(b => {
                let description = 'Cobrança';
                if (b.equipmentType === 'mesa') description += ` - Mesa ${b.equipmentNumero}`;
                if (b.equipmentType === 'jukebox') description += ` - Jukebox ${b.equipmentNumero}`;
                if (b.equipmentType === 'grua') description += ` - Grua ${b.equipmentNumero}`;

                const receivedAmount = (b.valorPagoDinheiro || 0) + (b.valorPagoPix || 0) + (b.recebimentoEspecie || 0) + (b.recebimentoPix || 0);
                
                return {
                    id: b.id,
                    date: new Date(b.settledAt),
                    type: 'billing' as 'billing',
                    description: description,
                    amount: receivedAmount,
                    debtChange: b.valorDebitoNegativo || 0,
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
                description: `Pagamento de Dívida`,
                amount: p.amountPaid,
                debtChange: -p.amountPaid,
                paymentMethod: p.paymentMethod,
                paymentDetails: {
                    dinheiro: p.amountPaidDinheiro,
                    pix: p.amountPaidPix,
                },
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
                                <li key={item.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-start gap-4">
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
                                                <div className="text-right">
                                                    {item.type === 'payment' && (
                                                        <p className="font-mono font-bold text-lg text-emerald-400">
                                                           {areValuesHidden ? 'R$ •••,••' : `+ R$ ${item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                        </p>
                                                    )}
                                                     {item.type === 'billing' && item.amount > 0 && (
                                                        <p className="font-mono font-bold text-lg text-lime-400">
                                                            {areValuesHidden ? 'R$ •••,••' : `R$ ${item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                        </p>
                                                    )}
                                                     {item.type === 'billing' && item.debtChange > 0 && (
                                                        <p className="font-mono text-sm text-red-400">
                                                            (Dívida: {areValuesHidden ? 'R$ •••,••' : `R$ ${item.debtChange.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`})
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2">
                                                <PaymentMethodDisplay method={item.paymentMethod} />
                                                {item.paymentMethod === 'misto' && item.paymentDetails && (
                                                    <span className="text-xs text-slate-400">
                                                        ({item.paymentDetails.dinheiro && `Dinheiro: R$${item.paymentDetails.dinheiro.toFixed(2)}`}
                                                        {item.paymentDetails.dinheiro && item.paymentDetails.pix && ', '}
                                                        {item.paymentDetails.pix && `PIX: R$${item.paymentDetails.pix.toFixed(2)}`})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
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