// components/FullScreenCustomerView.tsx
import React, { useMemo } from 'react';
import { Customer, Equipment, Billing, DebtPayment } from '../types';
import { XIcon } from './icons/XIcon';
import { BilliardIcon } from './icons/BilliardIcon';
import { JukeboxIcon } from './icons/JukeboxIcon';
import { CraneIcon } from './icons/CraneIcon';
import { RedBilliardBallIcon } from './icons/RedBilliardBallIcon';
import { GreenBilliardBallIcon } from './icons/GreenBilliardBallIcon';
import { YellowBilliardBallIcon } from './icons/YellowBilliardBallIcon';
import { PurpleBilliardBallIcon } from './icons/PurpleBilliardBallIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { LocationArrowIcon } from './icons/LocationArrowIcon';
import { ShareIcon } from './icons/ShareIcon';
import { ReceiptIcon } from './icons/ReceiptIcon';

interface FullScreenCustomerViewProps {
  customer: Customer | null;
  onClose: () => void;
  hasActiveWarning: boolean;
  onBill: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onPayDebt: (customer: Customer) => void;
  onHistory: (customer: Customer) => void;
  onShare: (customer: Customer) => void;
  onLocationActions: (customer: Customer) => void;
  onWhatsAppActions: (customer: Customer) => void;
  billings: Billing[];
  debtPayments: DebtPayment[];
  onFinalizePendingPayment: (billing: Billing) => void;
  onPendingPaymentAction: (customer: Customer, billing: Billing) => void;
}

type HistoryItem = {
    id: string;
    date: Date;
    type: 'billing' | 'payment';
    description: string;
    amount: number;
    paymentMethod: 'pix' | 'dinheiro' | 'debito_negativo' | 'misto' | 'pending_payment';
    equipmentType?: 'mesa' | 'jukebox' | 'grua';
};

const PaymentMethodDisplay: React.FC<{ method: HistoryItem['paymentMethod'] }> = React.memo(({ method }) => {
    const displayMethod = method === 'debito_negativo' ? 'negativo' : method === 'pending_payment' ? 'pendente' : method;
    const styles: Record<string, string> = {
        pix: 'bg-emerald-900/50 text-emerald-300 border-emerald-600',
        dinheiro: 'bg-sky-900/50 text-sky-300 border-sky-600',
        negativo: 'bg-amber-900/50 text-amber-300 border-amber-600',
        misto: 'bg-indigo-900/50 text-indigo-300 border-indigo-600',
        pendente: 'bg-slate-600/50 text-slate-300 border-slate-500',
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


const ActionButton: React.FC<{onClick: () => void, icon: React.ReactNode, label: string, colorClass: string, disabled?: boolean, isPrimary?: boolean, title?: string}> = ({onClick, icon, label, colorClass, disabled, isPrimary, title}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`flex-1 w-full flex flex-col items-center justify-center p-3 rounded-lg text-sm font-bold transition-colors ${
            disabled 
            ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed' 
            : isPrimary 
            ? 'bg-lime-600 text-white hover:bg-lime-500'
            : `${colorClass} text-white hover:opacity-90`
        }`}
    >
        {icon}
        <span className="mt-1.5">{label}</span>
    </button>
);

const FullScreenCustomerView: React.FC<FullScreenCustomerViewProps> = ({ customer, onClose, hasActiveWarning, onBill, onEdit, onDelete, onPayDebt, onHistory, onShare, onLocationActions, onWhatsAppActions, billings, debtPayments, onFinalizePendingPayment, onPendingPaymentAction }) => {
  if (!customer) return null;
  
  const pendingBilling = useMemo(() => {
    if (!customer) return null;
    return billings.find(b => 
        b.customerId === customer.id && 
        b.paymentMethod === 'pending_payment' &&
        (b.equipmentType === 'mesa' || b.equipmentType === 'jukebox')
    );
  }, [billings, customer]);

  const hasDebt = customer.debtAmount > 0;
  const twentyFiveDaysInMs = 25 * 24 * 60 * 60 * 1000;
  const visitIsPending = !customer.lastVisitedAt || (new Date().getTime() - new Date(customer.lastVisitedAt).getTime()) > twentyFiveDaysInMs;
  
  const historyItems = useMemo(() => {
    if (!customer) return [];
    
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


  const EquipmentIcon: React.FC<{type: Equipment['type']}> = ({ type }) => {
    switch(type) {
        case 'mesa': return <BilliardIcon className="w-5 h-5 text-cyan-400" />;
        case 'jukebox': return <JukeboxIcon className="w-5 h-5 text-fuchsia-400" />;
        case 'grua': return <CraneIcon className="w-5 h-5 text-orange-400" />;
        default: return null;
    }
  };
  
  const handleBillingAction = () => {
    if (!customer) return;
    if (!pendingBilling) {
        onBill(customer);
        return;
    }

    const hasMultipleEquipment = customer.equipment && customer.equipment.length > 1;

    if (hasMultipleEquipment) {
        onPendingPaymentAction(customer, pendingBilling);
    } else {
        onFinalizePendingPayment(pendingBilling);
    }
  };

  const colorStyles = {
    mesa: { bg: 'bg-cyan-900/50', text: 'text-cyan-400' },
    jukebox: { bg: 'bg-fuchsia-900/50', text: 'text-fuchsia-400' },
    grua: { bg: 'bg-orange-900/50', text: 'text-orange-400' },
    payment: { bg: 'bg-emerald-900/50', text: 'text-emerald-400' }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 p-4 animate-fade-in no-print"
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/50 rounded-full p-2"
        aria-label="Fechar"
      >
        <XIcon className="w-8 h-8" />
      </button>

      <div className="bg-slate-800 border-2 border-slate-700 rounded-2xl shadow-2xl w-full max-w-6xl h-full max-h-[95vh] flex flex-col p-6 lg:p-8">
        
        {/* Header */}
        <header className="flex-shrink-0 mb-6">
            <h1 className="text-4xl lg:text-6xl font-black text-white break-words">
                {customer.name}
            </h1>
            <p className="text-xl lg:text-2xl text-slate-400 mt-1">
                {customer.cidade} - Cobrador: {customer.linhaNumero}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 items-center">
                {visitIsPending ? (
                    <div title="Visita Pendente" className="flex items-center gap-1.5 text-red-400 font-semibold text-sm">
                        <RedBilliardBallIcon className="w-4 h-4 text-red-500" /> Visita Pendente
                    </div>
                ) : (
                    <div title={`Visitado em ${new Date(customer.lastVisitedAt!).toLocaleDateString('pt-BR')}`} className="flex items-center gap-1.5 text-green-400 font-semibold text-sm">
                        <GreenBilliardBallIcon className="w-4 h-4 text-green-500" /> Visitado em {new Date(customer.lastVisitedAt!).toLocaleDateString('pt-BR')}
                    </div>
                )}
                {hasDebt && (
                    <div title={`Dívida: R$ ${customer.debtAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} className="flex items-center gap-1.5 text-amber-400 font-semibold text-sm">
                        <YellowBilliardBallIcon className="w-4 h-4 text-amber-500" /> Dívida de R$ {customer.debtAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                )}
                {hasActiveWarning && (
                     <div title="Aviso pendente" className="flex items-center gap-1.5 text-purple-400 font-semibold text-sm">
                        <PurpleBilliardBallIcon className="w-4 h-4 text-purple-500" /> Aviso Pendente
                    </div>
                )}
            </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
            
            {/* Left Column: Actions & Info */}
            <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2">
                 <div className="bg-slate-900/50 p-4 rounded-xl">
                    <h3 className="text-lg font-bold text-slate-300 mb-3">Ações Principais</h3>
                    <div className="grid grid-cols-3 gap-3">
                       <ActionButton 
                            onClick={handleBillingAction} 
                            icon={<ReceiptIcon className="w-6 h-6" />} 
                            label={pendingBilling ? (customer.equipment && customer.equipment.length > 1 ? "Pgto. Pendente" : "Finalizar Pgto.") : "Faturar"}
                            colorClass={pendingBilling ? "bg-amber-600" : ""}
                            isPrimary={!pendingBilling}
                            title={pendingBilling ? `Ações para pagamento pendente` : "Faturar novo equipamento"}
                        />
                       <ActionButton onClick={() => onEdit(customer)} icon={<PencilIcon className="w-6 h-6" />} label="Editar" colorClass="bg-sky-600" />
                       <ActionButton onClick={() => onHistory(customer)} icon={<HistoryIcon className="w-6 h-6" />} label="Histórico" colorClass="bg-indigo-600" />
                       <ActionButton onClick={() => onPayDebt(customer)} icon={<CurrencyDollarIcon className="w-6 h-6" />} label="Pagar Dívida" colorClass="bg-amber-600" disabled={!hasDebt} />
                       <ActionButton onClick={() => onShare(customer)} icon={<ShareIcon className="w-6 h-6" />} label="Exportar" colorClass="bg-pink-600" />
                       <ActionButton onClick={() => onDelete(customer)} icon={<TrashIcon className="w-6 h-6" />} label="Excluir" colorClass="bg-red-600" />
                    </div>
                </div>
                 <div className="bg-slate-900/50 p-4 rounded-xl">
                    <h3 className="text-lg font-bold text-slate-300 mb-3">Contato e Localização</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => onWhatsAppActions(customer)} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg text-sm font-bold transition-colors ${customer.telefone ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-sky-700 hover:bg-sky-600 text-white'}`}>
                            <WhatsAppIcon className="w-6 h-6" />
                            <span className="mt-1.5">{customer.telefone ? 'WhatsApp' : 'Adicionar Fone'}</span>
                        </button>
                        <button 
                            onClick={() => onLocationActions(customer)} 
                            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg text-sm font-bold transition-colors ${customer.latitude ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-sky-700 hover:bg-sky-600 text-white'}`}
                        >
                            <LocationArrowIcon className="w-6 h-6" />
                            <span className="mt-1.5">{customer.latitude ? 'Localização' : 'Salvar Local'}</span>
                        </button>
                    </div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl">
                    <h3 className="text-lg font-bold text-slate-300 mb-2">Detalhes</h3>
                    <p className="text-sm text-slate-400">Endereço: <span className="text-slate-200 font-medium">{customer.endereco || 'Não informado'}</span></p>
                    <p className="text-sm text-slate-400">Telefone: <span className="text-slate-200 font-medium">{customer.telefone || 'Não informado'}</span></p>
                    <p className="text-sm text-slate-400">CPF/RG: <span className="text-slate-200 font-medium">{customer.cpfRg || 'Não informado'}</span></p>
                </div>
            </div>

            {/* Right Column: Equipment & History */}
            <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
                <div className="bg-slate-900/50 p-4 rounded-xl">
                    <h3 className="text-lg font-bold text-slate-300 mb-3">Equipamentos ({(customer.equipment || []).length})</h3>
                    <div className="space-y-3">
                        {(customer.equipment || []).length > 0 ? (customer.equipment || []).map((equip) => (
                            <div key={equip.id} className="flex justify-between items-center text-sm p-3 bg-slate-800/60 rounded-lg border border-slate-700">
                                <div className="flex items-center gap-3">
                                    <EquipmentIcon type={equip.type} />
                                    <div>
                                        <span className="font-bold text-white capitalize text-base">{equip.type} {equip.numero}</span>
                                        <p className="text-slate-400 text-xs">Relógio: {equip.relogioNumero || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="text-slate-400 font-mono text-right">
                                    <p className="text-xs">Leitura Anterior</p>
                                    <p className="font-bold text-base text-white">{equip.relogioAnterior}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center py-10 text-slate-500">Nenhum equipamento cadastrado.</p>
                        )}
                    </div>
                </div>
                
                <div className="bg-slate-900/50 p-4 rounded-xl">
                    <h3 className="text-lg font-bold text-slate-300 mb-3">Histórico Completo</h3>
                     {historyItems.length > 0 ? (
                        <ul className="space-y-3">
                            {historyItems.map(item => {
                                const style = item.type === 'billing' ? colorStyles[item.equipmentType || 'mesa'] : colorStyles.payment;
                                return (
                                <li key={item.id} className="flex items-start gap-4 p-3 bg-slate-800/60 rounded-lg border border-slate-700">
                                    <div className={`mt-1 flex-shrink-0 p-2 rounded-full ${style.bg}`}>
                                        {item.type === 'billing' 
                                            ? <ReceiptIcon className={`w-5 h-5 ${style.text}`} />
                                            : <CurrencyDollarIcon className={`w-5 h-5 ${style.text}`} />
                                        }
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-white">{item.description}</p>
                                                <p className="text-sm text-slate-400">{item.date.toLocaleDateString('pt-BR')}</p>
                                            </div>
                                            <p className={`font-mono font-bold text-lg ${style.text}`}>
                                                R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        <div className="text-center py-10 text-slate-500">
                            <p>Nenhuma transação registrada para este cliente.</p>
                        </div>
                    )}
                </div>

            </div>

        </main>
      </div>
       <style>{`
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default FullScreenCustomerView;
