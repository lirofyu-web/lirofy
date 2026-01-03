// components/CustomerCard.tsx
import React, { useState } from 'react';
import { Customer, Equipment } from '../types';
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
import { QrCodeIcon } from './icons/QrCodeIcon';
import CustomerQrCodeModal from './CustomerQrCodeModal';

interface CustomerCardProps {
  customer: Customer;
  onBill: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  onPayDebt: (customer: Customer) => void;
  onHistory: (customer: Customer) => void;
  onShare: (customer: Customer) => void;
  hasActiveWarning: boolean;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onBill, onEdit, onDelete, onPayDebt, onHistory, onShare, hasActiveWarning }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);

    const hasDebt = customer.debtAmount > 0;
    const twentyFiveDaysInMs = 25 * 24 * 60 * 60 * 1000;
    const visitIsPending = !customer.lastVisitedAt || (new Date().getTime() - new Date(customer.lastVisitedAt).getTime()) > twentyFiveDaysInMs;

    const EquipmentIcon: React.FC<{type: Equipment['type']}> = ({ type }) => {
        switch(type) {
            case 'mesa': return <BilliardIcon className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />;
            case 'jukebox': return <JukeboxIcon className="w-5 h-5 text-fuchsia-500 dark:text-fuchsia-400" />;
            case 'grua': return <CraneIcon className="w-5 h-5 text-orange-500 dark:text-orange-400" />;
            default: return null;
        }
    };
    
    const ActionButton: React.FC<{onClick: () => void, icon: React.ReactNode, label: string, colorClass: string, disabled?: boolean}> = ({onClick, icon, label, colorClass, disabled}) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex-1 flex flex-col items-center justify-center p-2 rounded-md text-xs font-medium transition-colors text-white ${
                disabled ? 'bg-slate-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed' : `${colorClass} hover:opacity-90`
            }`}
        >
            {icon}
            <span className="mt-1">{label}</span>
        </button>
    );

    return (
        <>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-300">
                <div className="p-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {customer.name}
                                {hasActiveWarning && (
                                    <div title="Aviso pendente">
                                        <PurpleBilliardBallIcon className="w-4 h-4 pulse-indicator" />
                                    </div>
                                )}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{customer.cidade} - Linha: {customer.linhaNumero}</p>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-3">
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
                                <div title={`Dívida: R$ ${customer.debtAmount.toFixed(2)}`} className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-sm bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-600">
                                   <YellowBilliardBallIcon className="w-4 h-4 text-amber-500 pulse-indicator" />
                                   <span>R$ {customer.debtAmount.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                        <ActionButton onClick={() => onBill(customer)} icon={<ReceiptIcon className="w-5 h-5" />} label="Faturar" colorClass="bg-lime-500" />
                        <ActionButton onClick={() => onEdit(customer)} icon={<PencilIcon className="w-5 h-5" />} label="Editar" colorClass="bg-sky-600" />
                        <ActionButton onClick={() => setIsQrModalOpen(true)} icon={<QrCodeIcon className="w-5 h-5" />} label="QR Code" colorClass="bg-slate-600" />
                        <ActionButton onClick={() => onPayDebt(customer)} icon={<CurrencyDollarIcon className="w-5 h-5" />} label="Pagar Fiado" colorClass="bg-amber-600" disabled={!hasDebt} />
                        <ActionButton onClick={() => onHistory(customer)} icon={<HistoryIcon className="w-5 h-5" />} label="Histórico" colorClass="bg-indigo-600" />
                        <ActionButton onClick={() => onDelete(customer.id)} icon={<TrashIcon className="w-5 h-5" />} label="Excluir" colorClass="bg-red-600" />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-white">
                        <a href={`https://wa.me/55${customer.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className={`flex-1 flex flex-col items-center justify-center p-2 rounded-md text-xs font-medium transition-colors ${customer.telefone ? 'bg-green-700 hover:bg-green-600' : 'bg-slate-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed'}`}>
                            <WhatsAppIcon className="w-5 h-5" />
                            <span className="mt-1">WhatsApp</span>
                        </a>
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${customer.latitude},${customer.longitude}`} target="_blank" rel="noopener noreferrer" className={`flex-1 flex flex-col items-center justify-center p-2 rounded-md text-xs font-medium transition-colors ${customer.latitude ? 'bg-blue-700 hover:bg-blue-600' : 'bg-slate-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed'}`}>
                            <LocationArrowIcon className="w-5 h-5" />
                            <span className="mt-1">Localização</span>
                        </a>
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
                                    <div key={equip.id} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-slate-800 rounded-md">
                                        <div className="flex items-center gap-2">
                                            <EquipmentIcon type={equip.type} />
                                            <span className="font-medium text-slate-800 dark:text-white capitalize">{equip.type} {equip.numero}</span>
                                        </div>
                                        <div className="text-slate-500 dark:text-slate-400 font-mono">
                                            {equip.type === 'mesa' && equip.billingType === 'monthly' ? (
                                                <span>Mensal: R$ {(equip.monthlyFeeValue || 0).toFixed(2)}</span>
                                            ) : (
                                                <span>Leitura: {equip.relogioAnterior}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {isQrModalOpen && (
                <CustomerQrCodeModal
                    isOpen={isQrModalOpen}
                    onClose={() => setIsQrModalOpen(false)}
                    customer={customer}
                />
            )}
        </>
    );
};

export default CustomerCard;