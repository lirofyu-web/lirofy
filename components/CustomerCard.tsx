// components/CustomerCard.tsx
import React, { useState, useMemo } from 'react';
import { Customer, Equipment, Billing } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CurrencyDollarIcon } from './icons/CurrencyDollarIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { LocationArrowIcon } from './icons/LocationArrowIcon';
import { BilliardIcon } from './icons/BilliardIcon';
import { JukeboxIcon } from './icons/JukeboxIcon';
import { CraneIcon } from './icons/CraneIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ShareIcon } from './icons/ShareIcon';
import { ReceiptIcon } from './icons/ReceiptIcon';
import { RedBilliardBallIcon } from './icons/RedBilliardBallIcon';
import { GreenBilliardBallIcon } from './icons/GreenBilliardBallIcon';
import { YellowBilliardBallIcon } from './icons/YellowBilliardBallIcon';
import { PurpleBilliardBallIcon } from './icons/PurpleBilliardBallIcon';

interface CustomerCardProps {
  customer: Customer;
  billings: Billing[];
  onBill: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onPayDebt: (customer: Customer) => void;
  onHistory: (customer: Customer) => void;
  onShare: (customer: Customer) => void;
  onLocationActions: (customer: Customer) => void;
  onWhatsAppActions: (customer: Customer) => void;
  onFinalizePendingPayment: (billing: Billing) => void;
  onPendingPaymentAction: (customer: Customer, billing: Billing) => void;
  hasActiveWarning: boolean;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  onFocusCustomer: (customer: Customer) => void;
  areValuesHidden: boolean;
}

const EquipmentIcon: React.FC<{ type: Equipment['type'], className?: string }> = ({ type, className }) => {
    const finalClassName = className || 'w-5 h-5';
    const colorMap = {
        mesa: 'text-cyan-400',
        jukebox: 'text-fuchsia-400',
        grua: 'text-orange-400',
    };
    const colors = colorMap[type] || '';
    switch (type) {
        case 'mesa': return <BilliardIcon className={`${finalClassName} ${colors}`} />;
        case 'jukebox': return <JukeboxIcon className={`${finalClassName} ${colors}`} />;
        case 'grua': return <CraneIcon className={`${finalClassName} ${colors}`} />;
        default: return null;
    }
};

const EquipmentDetailRow: React.FC<{ label: string; value: string | number | undefined | null; areValuesHidden?: boolean }> = ({ label, value, areValuesHidden }) => {
  if (value === undefined || value === null || value === '') return null;
  const isCurrency = typeof value === 'string' && value.startsWith('R$');

  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-400">{label}:</span>
      <span className="font-semibold text-slate-200">{areValuesHidden && isCurrency ? 'R$ •••,••' : String(value)}</span>
    </div>
  );
};


const CustomerCard: React.FC<CustomerCardProps> = ({ customer, billings, onBill, onEdit, onDelete, onPayDebt, onHistory, onShare, onLocationActions, onWhatsAppActions, hasActiveWarning, showNotification, onFocusCustomer, onFinalizePendingPayment, onPendingPaymentAction, areValuesHidden }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const pendingBilling = useMemo(() => {
        return billings.find(b => 
            b.customerId === customer.id && 
            b.paymentMethod === 'pending_payment' &&
            (b.equipmentType === 'mesa' || b.equipmentType === 'jukebox')
        );
    }, [billings, customer.id]);

    const hasDebt = customer.debtAmount > 0;
    const twentyFiveDaysInMs = 25 * 24 * 60 * 60 * 1000;
    const visitIsPending = !customer.lastVisitedAt || (new Date().getTime() - new Date(customer.lastVisitedAt).getTime()) > twentyFiveDaysInMs;

    const handleBillingAction = () => {
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
    
    const ActionButton: React.FC<{onClick: () => void, icon: React.ReactNode, label: string, colorClass: string, disabled?: boolean, isPrimary?: boolean, title?: string}> = ({onClick, icon, label, colorClass, disabled, isPrimary, title}) => (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg text-sm font-medium transition-colors ${
                disabled 
                ? 'bg-slate-400 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed' 
                : isPrimary 
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)]'
                : `${colorClass} text-white hover:opacity-90`
            }`}
        >
            {icon}
            <span className="mt-1.5">{label}</span>
        </button>
    );

    const equipmentTypeText = {
        'mesa': 'Mesa de Sinuca',
        'jukebox': 'Jukebox',
        'grua': 'Grua de Pelúcia'
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 transition-transform duration-300 hover:scale-105 hover:shadow-xl" style={{ willChange: 'transform, box-shadow' }}>
                <div className="p-3">
                    <div
                        className="flex flex-wrap justify-between items-start gap-2 cursor-pointer group"
                        onClick={() => onFocusCustomer(customer)}
                    >
                        <div className="flex-grow">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 break-words group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors">
                                {customer.name}
                                {hasActiveWarning && (
                                    <div title="Aviso pendente">
                                        <PurpleBilliardBallIcon className="w-4 h-4 pulse-indicator" />
                                    </div>
                                )}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 break-words">{customer.cidade} - Cobrador: {customer.linhaNumero}</p>
                        </div>
                        <div className="flex items-center flex-wrap justify-end gap-3">
                            {visitIsPending ? (
                                <div title="Visita Pendente">
                                    <RedBilliardBallIcon className="w-4 h-4 text-red-500 pulse-indicator" />
                                </div>
                            ) : (
                                <div title={`Visitado em ${new Date(customer.lastVisitedAt!).toLocaleDateString('pt-BR')}`}>
                                    <GreenBilliardBallIcon className="w-4 h-4 text-green-500 pulse-indicator" />
                                </div>
                            )}
                            {hasDebt && (
                                <div title={areValuesHidden ? "Dívida Pendente" : `Dívida: R$ ${customer.debtAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-sm bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-600">
                                <YellowBilliardBallIcon className="w-4 h-4 text-amber-500 pulse-indicator" />
                                <span>{areValuesHidden ? 'Dívida' : `R$ ${customer.debtAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                         <ActionButton 
                            onClick={handleBillingAction} 
                            icon={<ReceiptIcon className="w-5 h-5" />} 
                            label={pendingBilling ? (customer.equipment && customer.equipment.length > 1 ? "Pgto. Pendente" : "Finalizar Pgto.") : "Faturar"}
                            colorClass={pendingBilling ? "bg-amber-600" : ""}
                            isPrimary={!pendingBilling}
                            title={pendingBilling ? `Ações para pagamento pendente de ${pendingBilling.equipmentType === 'mesa' ? 'Mesa' : 'Jukebox'} ${pendingBilling.equipmentNumero}` : "Faturar novo equipamento"}
                        />
                        <ActionButton onClick={() => onEdit(customer)} icon={<PencilIcon className="w-5 h-5" />} label="Editar" colorClass="bg-sky-600" title='Editar Cliente' />
                        <ActionButton 
                            onClick={() => onPayDebt(customer)} 
                            icon={<CurrencyDollarIcon className="w-5 h-5" />} 
                            label={hasDebt ? "Pagar Dívida" : "Adic. Dívida"} 
                            colorClass={hasDebt ? "bg-amber-600" : "bg-orange-500"}
                            title={hasDebt ? "Registrar pagamento de dívida" : "Adicionar uma dívida avulsa"}
                        />
                        <ActionButton onClick={() => onHistory(customer)} icon={<HistoryIcon className="w-5 h-5" />} label="Histórico" colorClass="bg-indigo-600" />
                        <ActionButton onClick={() => onDelete(customer)} icon={<TrashIcon className="w-5 h-5" />} label="Excluir" colorClass="bg-red-600" title='Excluir Cliente' />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-white">
                        <button onClick={() => onWhatsAppActions(customer)} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-md text-xs font-medium transition-colors ${customer.telefone ? 'bg-green-700 hover:bg-green-600' : 'bg-slate-600 hover:bg-slate-500'}`}>
                            <WhatsAppIcon className="w-5 h-5" />
                            <span className="mt-1">WhatsApp</span>
                        </button>
                         <button onClick={() => onLocationActions(customer)} className={`flex-1 flex flex-col items-center justify-center p-2 rounded-md text-xs font-medium transition-colors ${customer.latitude ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-slate-600 hover:bg-slate-500 text-white'}`}>
                            <LocationArrowIcon className="w-5 h-5" />
                            <span className="mt-1">Localização</span>
                        </button>
                        <button onClick={() => onShare(customer)} className="flex-1 flex flex-col items-center justify-center p-2 rounded-md text-xs font-medium transition-colors bg-pink-600 hover:bg-pink-500">
                            <ShareIcon className="w-5 h-5" />
                            <span className="mt-1">Exportar</span>
                        </button>
                    </div>

                </div>

                {customer.equipment && customer.equipment.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-slate-700">
                        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center p-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50">
                            <span className="font-semibold">Equipamentos ({customer.equipment.length})</span>
                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 space-y-3">
                                {customer.equipment.map((equip) => (
                                    <div key={equip.id} className="p-3 bg-slate-800 rounded-lg">
                                        <div className="flex items-center gap-3 mb-3">
                                            <EquipmentIcon type={equip.type} className="w-5 h-5" />
                                            <span className="font-bold text-md text-white">{equipmentTypeText[equip.type]} {equip.numero}</span>
                                        </div>
                                        <div className="space-y-1 font-mono">
                                            <EquipmentDetailRow label="Nº Relógio" value={equip.relogioNumero} />
                                            <EquipmentDetailRow label="Leitura Anterior" value={equip.relogioAnterior} />
                                            {equip.type === 'mesa' && (
                                                equip.billingType === 'monthly' ? (
                                                    <EquipmentDetailRow label="Mensalidade" value={`R$ ${(equip.monthlyFeeValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} areValuesHidden={areValuesHidden} />
                                                ) : (
                                                    <>
                                                        <EquipmentDetailRow label="Vlr. Ficha" value={`R$ ${(equip.valorFicha || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} areValuesHidden={areValuesHidden} />
                                                        <EquipmentDetailRow label="Parte Firma" value={`${equip.parteFirma || 0}%`} />
                                                    </>
                                                )
                                            )}
                                            {equip.type === 'jukebox' && (
                                                <EquipmentDetailRow label="Parte Firma" value={`${equip.porcentagemJukeboxFirma || 0}%`} />
                                            )}
                                            {equip.type === 'grua' && (
                                                <>
                                                    {equip.aluguelPercentual != null && <EquipmentDetailRow label="Aluguel" value={`${equip.aluguelPercentual}%`} />}
                                                    {equip.aluguelValor != null && <EquipmentDetailRow label="Aluguel" value={`R$ ${(equip.aluguelValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} areValuesHidden={areValuesHidden} />}
                                                    <EquipmentDetailRow label="Capacidade Pelúcias" value={equip.quantidadePelucia} />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default React.memo(CustomerCard);