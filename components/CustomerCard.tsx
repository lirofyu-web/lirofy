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

interface CustomerCardProps {
  customer: Customer;
  onBill: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  onPayDebt: (customer: Customer) => void;
  onHistory: (customer: Customer) => void;
  onShare: (customer: Customer) => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onBill, onEdit, onDelete, onPayDebt, onHistory, onShare }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasDebt = customer.debtAmount > 0;
    const twentyFiveDaysInMs = 25 * 24 * 60 * 60 * 1000;
    const visitIsPending = !customer.lastVisitedAt || (new Date().getTime() - new Date(customer.lastVisitedAt).getTime()) > twentyFiveDaysInMs;

    const EquipmentIcon: React.FC<{type: Equipment['type']}> = ({ type }) => {
        switch(type) {
            case 'mesa': return <BilliardIcon className="w-5 h-5 text-cyan-400" />;
            case 'jukebox': return <JukeboxIcon className="w-5 h-5 text-fuchsia-400" />;
            case 'grua': return <CraneIcon className="w-5 h-5 text-orange-400" />;
            default: return null;
        }
    };
    
    const ActionButton: React.FC<{onClick: () => void, icon: React.ReactNode, label: string, colorClass: string, disabled?: boolean}> = ({onClick, icon, label, colorClass, disabled}) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex-1 flex flex-col items-center justify-center p-2 rounded-md text-xs font-medium transition-colors ${
                disabled ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : `${colorClass} hover:opacity-90`
            }`}
        >
            {icon}
            <span className="mt-1">{label}</span>
        </button>
    );

    return (
        <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 transition-all duration-300">
            <div className="p-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-white">{customer.name}</h3>
                        <p className="text-sm text-slate-400">{customer.cidade} - Linha: {customer.linhaNumero}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                        {visitIsPending && <span title="Visita Pendente" className="block w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>}
                        {hasDebt && (
                            <div title={`Dívida: R$ ${customer.debtAmount.toFixed(2)}`} className="text-amber-400 font-bold text-sm bg-amber-900/50 px-2 py-0.5 rounded-full border border-amber-600">
                                R$ {customer.debtAmount.toFixed(2)}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2 text-white">
                    <ActionButton onClick={() => onBill(customer)} icon={<ReceiptIcon className="w-5 h-5" />} label="Faturar" colorClass="bg-emerald-600" />
                    <ActionButton onClick={() => onEdit(customer)} icon={<PencilIcon className="w-5 h-5" />} label="Editar" colorClass="bg-sky-600" />
                    <ActionButton onClick={() => onPayDebt(customer)} icon={<CurrencyDollarIcon className="w-5 h-5" />} label="Pagar Fiado" colorClass="bg-amber-600" disabled={!hasDebt} />
                    <ActionButton onClick={() => onHistory(customer)} icon={<HistoryIcon className="w-5 h-5" />} label="Histórico" colorClass="bg-indigo-600" />
                    <ActionButton onClick={() => onDelete(customer.id)} icon={<TrashIcon className="w-5 h-5" />} label="Excluir" colorClass="bg-red-600" />
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-white">
                    <a href={`https://wa.me/55${customer.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className={`flex-1 flex flex-col items-center justify-center p-2 rounded-md text-xs font-medium transition-colors ${customer.telefone ? 'bg-green-700 hover:bg-green-600' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
                        <WhatsAppIcon className="w-5 h-5" />
                        <span className="mt-1">WhatsApp</span>
                    </a>
                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${customer.latitude},${customer.longitude}`} target="_blank" rel="noopener noreferrer" className={`flex-1 flex flex-col items-center justify-center p-2 rounded-md text-xs font-medium transition-colors ${customer.latitude ? 'bg-blue-700 hover:bg-blue-600' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
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
                <div className="border-t border-slate-700">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center p-2 text-sm text-slate-300 hover:bg-slate-700/50">
                        <span className="font-semibold">Equipamentos ({customer.equipment.length})</span>
                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isExpanded && (
                        <div className="p-3 bg-slate-900/50 border-t border-slate-700 space-y-3">
                            {customer.equipment.map((equip) => (
                                <div key={equip.id} className="flex justify-between items-center text-sm p-2 bg-slate-800 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <EquipmentIcon type={equip.type} />
                                        <span className="font-medium text-white capitalize">{equip.type} {equip.numero}</span>
                                    </div>
                                    <div className="text-slate-400">
                                        <span>Leitura: {equip.relogioAnterior}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomerCard;