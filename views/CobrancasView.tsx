// views/CobrancasView.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { Billing, Customer, DebtPayment } from '../types';
import PageHeader from '../components/PageHeader';
import { SearchIcon } from '../components/icons/SearchIcon';
import { BilliardIcon } from '../components/icons/BilliardIcon';
import { JukeboxIcon } from '../components/icons/JukeboxIcon';
import { CraneIcon } from '../components/icons/CraneIcon';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import ActionModal from '../components/ActionModal';
import { CurrencyDollarIcon } from '../components/icons/CurrencyDollarIcon';
import { ListBulletIcon } from '../components/icons/ListBulletIcon';

interface CobrancasViewProps {
    billings: Billing[];
    customers: Customer[];
    debtPayments: DebtPayment[];
    onShowActions: (billing: Billing) => void;
    onEditBilling: (billing: Billing) => void;
    onDeleteBilling: (billingId: string) => void;
    onFinalizePayment: (billing: Billing) => void;
    onPayDebtCustomer: (customer: Customer) => void;
    areValuesHidden: boolean;
}

type SortKey = 'settledAt' | 'customerName' | 'valorTotal' | 'paidAt' | 'amountPaid';
type SortDirection = 'asc' | 'desc';
type EquipmentFilter = 'all' | 'mesa' | 'jukebox' | 'grua';
type MainTab = 'billings' | 'debtors';

const PaymentMethodDisplay: React.FC<{ method?: Billing['paymentMethod'] }> = React.memo(({ method }) => {
    if(!method) return null;
    const displayMethod = method === 'debito_negativo' ? 'negativo' : method === 'pending_payment' ? 'pendente' : method;
    const styles: Record<string, string> = {
        pix: 'bg-lime-100 dark:bg-lime-900/50 text-lime-800 dark:text-lime-300 border-lime-300 dark:border-lime-600',
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
        pendente: 'Pendente'
    };

    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[displayMethod]}`}>
            {text[displayMethod]}
        </span>
    );
});

const TabButton: React.FC<{label: string, active: boolean, onClick: () => void}> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${
            active
                ? 'bg-lime-500 text-white shadow-md'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
        }`}
    >
        {label}
    </button>
);

// --- Prop Interfaces for Sub-components ---
interface BillingsListProps {
    billings: Billing[];
    onEdit: (billing: Billing) => void;
    onDelete: (billing: Billing) => void;
    onShowActions: (billing: Billing) => void;
    totalBilled: number;
    handleSort: (key: SortKey) => void;
    renderSortArrow: (key: SortKey) => React.ReactNode;
    getNetBilledAmount: (billing: Billing) => number;
    areValuesHidden: boolean;
}

interface DebtorsListProps {
    debtorCustomers: Customer[];
    totalDebt: number;
    onPrint: () => void;
    onPayDebtCustomer: (customer: Customer) => void;
    areValuesHidden: boolean;
}

// --- Sub-components for each tab ---

const BillingsList: React.FC<BillingsListProps> = ({ billings, onEdit, onDelete, onShowActions, totalBilled, handleSort, renderSortArrow, getNetBilledAmount, areValuesHidden }) => (
    <>
        {/* Mobile View: Cards */}
        <div className="md:hidden space-y-4 mb-10">
            {billings.length > 0 ? billings.map((billing: Billing) => (
                    <div key={billing.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white break-words">{billing.customerName}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(billing.settledAt).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-mono font-bold text-lg text-lime-600 dark:text-lime-400">
                                    {areValuesHidden ? 'R$ •••,••' : `R$ ${getNetBilledAmount(billing).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                </p>
                                {billing.valorDebitoNegativo && billing.valorDebitoNegativo > 0 && (
                                    <p className="font-mono text-sm text-red-500 dark:text-red-400">
                                        Dívida: {areValuesHidden ? 'R$ •••,••' : `R$ ${billing.valorDebitoNegativo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    </p>
                                )}
                                <div className="mt-1"><PaymentMethodDisplay method={billing.paymentMethod} /></div>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <span className="flex items-center gap-2 text-sm">
                                {billing.equipmentType === 'mesa' ? <BilliardIcon className="w-4 h-4 text-cyan-500 dark:text-cyan-400" /> : 
                                 billing.equipmentType === 'jukebox' ? <JukeboxIcon className="w-4 h-4 text-fuchsia-500 dark:text-fuchsia-400" /> :
                                 <CraneIcon className="w-4 h-4 text-orange-500 dark:text-orange-400" />}
                                <span className="text-slate-600 dark:text-slate-300">
                                    {billing.equipmentType === 'mesa' ? `Mesa ${billing.equipmentNumero}` : 
                                     billing.equipmentType === 'jukebox' ? `Jukebox ${billing.equipmentNumero}` :
                                     `Grua ${billing.equipmentNumero}`}
                                </span>
                            </span>
                            <div className="flex gap-4">
                                <button onClick={() => onShowActions(billing)} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Ações</button>
                                {billing.equipmentType === 'grua' && (
                                    <button onClick={() => onEdit(billing)} className="p-1 text-sky-500 dark:text-sky-400" title='Editar Cobrança'><PencilIcon className="w-5 h-5" /></button>
                                )}
                                <button onClick={() => onDelete(billing)} className="p-1 text-red-500 dark:text-red-400" title='Excluir Cobrança'><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    </div>
                 )
            ) : <p className="text-center py-16 text-slate-500 dark:text-slate-400 italic">Nenhuma cobrança encontrada.</p>}
            {billings.length > 0 && <div className="mt-4 pt-4 border-t-2 border-slate-300 dark:border-slate-600 flex flex-wrap justify-between items-baseline gap-x-4 font-bold text-lg"><span>TOTAL ARRECADADO</span><span className="font-mono text-lime-600 dark:text-lime-400">{areValuesHidden ? 'R$ •••,••' : `R$ ${totalBilled.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span></div>}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block bg-white/75 dark:bg-slate-800/75 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-10">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('settledAt')}>Data {renderSortArrow('settledAt')}</th>
                            <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('customerName')}>Cliente {renderSortArrow('customerName')}</th>
                            <th scope="col" className="px-6 py-3">Equipamento</th>
                            <th scope="col" className="px-6 py-3">Pagamento</th>
                            <th scope="col" className="px-6 py-3 text-right cursor-pointer" onClick={() => handleSort('valorTotal')}>Valor Arrecadado / Dívida</th>
                            <th scope="col" className="px-6 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {billings.length > 0 ? billings.map((billing: Billing) => (
                                <tr key={billing.id} className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-4">{new Date(billing.settledAt).toLocaleDateString('pt-BR')}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{billing.customerName}</td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-2">
                                            {billing.equipmentType === 'mesa' ? <BilliardIcon className="w-4 h-4 text-cyan-500 dark:text-cyan-400" /> : 
                                             billing.equipmentType === 'jukebox' ? <JukeboxIcon className="w-4 h-4 text-fuchsia-500 dark:text-fuchsia-400" /> :
                                             <CraneIcon className="w-4 h-4 text-orange-500 dark:text-orange-400" />}
                                            {billing.equipmentType === 'mesa' ? `Mesa ${billing.equipmentNumero}` : 
                                             billing.equipmentType === 'jukebox' ? `Jukebox ${billing.equipmentNumero}` :
                                             `Grua ${billing.equipmentNumero}`}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4"><PaymentMethodDisplay method={billing.paymentMethod} /></td>
                                    <td className="px-6 py-4 text-right font-mono font-bold">
                                        <div className="flex flex-col items-end">
                                            <span className="text-lime-600 dark:text-lime-400">
                                                {areValuesHidden ? 'R$ •••,••' : `R$ ${getNetBilledAmount(billing).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                            </span>
                                            {billing.valorDebitoNegativo && billing.valorDebitoNegativo > 0 && (
                                                <span className="text-xs text-red-500 dark:text-red-400">
                                                    (Dívida: {areValuesHidden ? 'R$ •••,••' : `R$ ${billing.valorDebitoNegativo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`})
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center items-center gap-4">
                                            <button onClick={() => onShowActions(billing)} className="text-slate-500 hover:text-indigo-500" title="Mais Ações">Ações</button>
                                            {billing.equipmentType === 'grua' && (
                                                <button onClick={() => onEdit(billing)} className="text-slate-500 hover:text-sky-500" title='Editar Cobrança'><PencilIcon className="w-5 h-5" /></button>
                                            )}
                                            <button onClick={() => onDelete(billing)} className="text-slate-500 hover:text-red-500" title='Excluir Cobrança'><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        ) : (
                           <tr><td colSpan={6} className="text-center py-16 text-slate-500 dark:text-slate-400 italic">Nenhuma cobrança encontrada.</td></tr>
                        )}
                    </tbody>
                    <tfoot className="bg-slate-100 dark:bg-slate-700/50 font-bold text-slate-900 dark:text-white">
                        <tr>
                            <td colSpan={4} className="text-right px-6 py-3 uppercase">Total Arrecadado (Filtrado)</td>
                            <td className="text-right px-6 py-3 font-mono text-lg text-lime-600 dark:text-lime-400">{areValuesHidden ? 'R$ •••,••' : `R$ ${totalBilled.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </>
);

const DebtorsList: React.FC<DebtorsListProps> = ({ debtorCustomers, totalDebt, onPrint, onPayDebtCustomer, areValuesHidden }) => (
    <div className="bg-white/75 dark:bg-slate-800/75 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex justify-between items-center p-4 bg-slate-100 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Clientes Devedores ({debtorCustomers.length})</h3>
            <button onClick={onPrint} className="inline-flex items-center gap-2 bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-500">
                <PrinterIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Imprimir Lista</span>
            </button>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3 p-3">
            {debtorCustomers.length > 0 ? debtorCustomers.map((customer: Customer) => (
                <div key={customer.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white break-words">{customer.name}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{customer.cidade}</p>
                        </div>
                        <p className="font-mono font-bold text-lg text-red-500 dark:text-red-400">
                           {areValuesHidden ? 'R$ •••,••' : `R$ ${customer.debtAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => onPayDebtCustomer(customer)}
                            className="w-full bg-amber-600 text-white font-bold py-2 px-3 rounded-md hover:bg-amber-500 text-sm flex items-center justify-center gap-2"
                        >
                           <CurrencyDollarIcon className="w-5 h-5" /> Pagar/Adicionar Dívida
                        </button>
                    </div>
                </div>
            )) : <p className="text-center py-10 text-slate-500 dark:text-slate-400 italic">Nenhum cliente com dívida pendente.</p>}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-700/50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left">Cliente</th>
                        <th scope="col" className="px-6 py-3 text-left">Cidade</th>
                        <th scope="col" className="px-6 py-3 text-right">Valor da Dívida</th>
                        <th scope="col" className="px-6 py-3 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {debtorCustomers.length > 0 ? debtorCustomers.map((customer: Customer) => (
                        <tr key={customer.id} className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{customer.name}</td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{customer.cidade}</td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-red-500 dark:text-red-400">{areValuesHidden ? 'R$ •••,••' : `R$ ${customer.debtAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</td>
                            <td className="px-6 py-4 text-center"><button onClick={() => onPayDebtCustomer(customer)} className="bg-amber-600 text-white font-bold py-1 px-3 rounded-md hover:bg-amber-500 text-xs">Pagar/Adicionar Dívida</button></td>
                        </tr>
                    )) : (<tr><td colSpan={4} className="text-center py-16 text-slate-500 dark:text-slate-400 italic">Nenhum cliente com dívida pendente.</td></tr>)}
                </tbody>
                <tfoot className="bg-slate-100 dark:bg-slate-700/50 font-bold text-slate-900 dark:text-white">
                    <tr>
                        <td colSpan={2} className="text-right px-6 py-3 uppercase">Total Geral de Dívidas</td>
                        <td className="text-right px-6 py-3 font-mono text-lg text-red-500 dark:text-red-400">{areValuesHidden ? 'R$ •••,••' : `R$ ${totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>

        {debtorCustomers.length > 0 && (<div className="md:hidden p-4 bg-slate-100 dark:bg-slate-700/50 flex justify-between font-bold text-slate-900 dark:text-white"><span>TOTAL</span><span className="font-mono text-lg text-red-500 dark:text-red-400">{areValuesHidden ? 'R$ •••,••' : `R$ ${totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span></div>)}
    </div>
);

const CobrancasView: React.FC<CobrancasViewProps> = ({ 
    billings, 
    customers, 
    debtPayments,
    onShowActions,
    onEditBilling,
    onDeleteBilling,
    onFinalizePayment,
    onPayDebtCustomer,
    areValuesHidden,
}) => {
    const [activeTab, setActiveTab] = useState<MainTab>('billings');
    const [sortKey, setSortKey] = useState<SortKey>('settledAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [equipmentFilter, setEquipmentFilter] = useState<EquipmentFilter>('all');
    const [deletingBilling, setDeletingBilling] = useState<Billing | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredAndSortedData = useMemo(() => {
        let items: Billing[] = [];
        if(activeTab === 'billings') {
            items = billings.filter(billing => {
                if (equipmentFilter !== 'all' && billing.equipmentType !== equipmentFilter) return false;
                if (searchQuery && !billing.customerName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                const itemDate = new Date(billing.settledAt);
                if (startDate && new Date(startDate + 'T00:00:00') > itemDate) return false;
                if (endDate && new Date(endDate + 'T23:59:59') < itemDate) return false;
                return true;
            });
        }
    
        return items.sort((a, b) => {
            let valA: any, valB: any;
            if ('settledAt' in a && 'settledAt' in b && sortKey === 'settledAt') {
                valA = new Date(a.settledAt).getTime();
                valB = new Date(b.settledAt).getTime();
            } else {
                valA = (a as any)[sortKey];
                valB = (b as any)[sortKey];
            }
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [activeTab, billings, equipmentFilter, searchQuery, startDate, endDate, sortKey, sortDirection]);

    const { pendingBillings, completedBillings } = useMemo(() => {
        const pending: Billing[] = [];
        const completed: Billing[] = [];
        filteredAndSortedData.forEach(b => {
            if (b.paymentMethod === 'pending_payment') {
                pending.push(b);
            } else {
                completed.push(b);
            }
        });
        return { pendingBillings: pending, completedBillings: completed };
    }, [filteredAndSortedData]);


    const handleSort = useCallback((key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    }, [sortKey]);
    
    const renderSortArrow = (key: SortKey) => (sortKey === key) ? (sortDirection === 'asc' ? '▲' : '▼') : null;

    const getNetBilledAmount = useCallback((billing: Billing): number => {
      if (billing.equipmentType === 'grua') {
        return (billing.recebimentoEspecie || 0) + (billing.recebimentoPix || 0);
      }
      return (billing.valorPagoDinheiro || 0) + (billing.valorPagoPix || 0);
    }, []);

    const totalBilled = useMemo(() => completedBillings.reduce((sum, b) => sum + getNetBilledAmount(b), 0), [completedBillings, getNetBilledAmount]);

    const { debtorCustomers, totalDebt } = useMemo(() => {
        const debtors = customers.filter(c => c.debtAmount > 0).sort((a,b) => b.debtAmount - a.debtAmount);
        const debt = customers.reduce((sum, c) => sum + c.debtAmount, 0);
        return { debtorCustomers: debtors, totalDebt: debt };
    }, [customers]);
    
    const handlePrintDebtors = useCallback(() => {
        const typeMap: Record<string, string> = { mesa: 'M. Sinuca', jukebox: 'Jukebox', grua: 'Grua' };
        const debtOrigins = new Map<string, Set<string>>();
        billings.forEach(b => {
            if (b.valorDebitoNegativo && b.valorDebitoNegativo > 0) {
                if (!debtOrigins.has(b.customerId)) debtOrigins.set(b.customerId, new Set());
                debtOrigins.get(b.customerId)?.add(typeMap[b.equipmentType] || b.equipmentType);
            }
        });

        const reportHtml = `
            <html>
                <head>
                    <title>Relatório de Clientes Devedores</title>
                    <style>
                        body { font-family: Arial, sans-serif; font-size: 10pt; }
                        @page { size: A4; margin: 20mm; }
                        h1, h2 { text-align: center; }
                        h1 { font-size: 16pt; }
                        h2 { font-size: 12pt; color: #555; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; font-weight: bold; }
                        .currency { text-align: right; font-family: monospace; }
                        .total-row { font-weight: bold; border-top: 2px solid #333; }
                    </style>
                </head>
                <body>
                    <h1>Montanha Bilhar & Jukebox</h1>
                    <h2>Relatório de Clientes Devedores - ${new Date().toLocaleDateString('pt-BR')}</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Cidade</th>
                                <th>Origem da Dívida</th>
                                <th class="currency">Valor da Dívida</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${debtorCustomers.map(customer => `
                                <tr>
                                    <td>${customer.name}</td>
                                    <td>${customer.cidade}</td>
                                    <td>${Array.from(debtOrigins.get(customer.id) || []).join(', ') || 'Pagamento Avulso'}</td>
                                    <td class="currency">R$ ${customer.debtAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                                <td colspan="3">Total Geral de Dívidas</td>
                                <td class="currency">R$ ${totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                        </tfoot>
                    </table>
                </body>
            </html>
        `;
        const printWindow = window.open('', '', 'height=800,width=1000');
        if (printWindow) {
            printWindow.document.write(reportHtml);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    }, [debtorCustomers, totalDebt, billings]);

    const handleConfirmDelete = () => {
        if (deletingBilling) {
            onDeleteBilling(deletingBilling.id);
            setDeletingBilling(null);
        }
    };

    return (
        <>
            <PageHeader title="Cobranças e Dívidas" subtitle="Visualize cobranças e dívidas pendentes." />
            
            <div className="bg-white/75 dark:bg-slate-800/75 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 mb-8 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    <TabButton label="Histórico de Cobranças" active={activeTab === 'billings'} onClick={() => { setActiveTab('billings'); setSortKey('settledAt'); }} />
                    <TabButton label="Clientes Devedores" active={activeTab === 'debtors'} onClick={() => setActiveTab('debtors')} />
                </div>
                
                {activeTab === 'billings' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                            <button onClick={() => setEquipmentFilter('all')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${equipmentFilter === 'all' ? 'bg-lime-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                                <ListBulletIcon className={`w-8 h-8 ${equipmentFilter === 'all' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                                <span className="text-xs font-bold mt-1">Todos</span>
                            </button>
                            <button onClick={() => setEquipmentFilter('mesa')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${equipmentFilter === 'mesa' ? 'bg-lime-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                                <BilliardIcon className={`w-8 h-8 ${equipmentFilter === 'mesa' ? 'text-white' : 'text-cyan-600 dark:text-cyan-400'}`} />
                                <span className="text-xs font-bold mt-1">Mesas</span>
                            </button>
                            <button onClick={() => setEquipmentFilter('jukebox')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${equipmentFilter === 'jukebox' ? 'bg-lime-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                                <JukeboxIcon className={`w-8 h-8 ${equipmentFilter === 'jukebox' ? 'text-white' : 'text-fuchsia-600 dark:text-fuchsia-400'}`} />
                                <span className="text-xs font-bold mt-1">Jukebox</span>
                            </button>
                            <button onClick={() => setEquipmentFilter('grua')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${equipmentFilter === 'grua' ? 'bg-lime-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                                <CraneIcon className={`w-8 h-8 ${equipmentFilter === 'grua' ? 'text-white' : 'text-orange-600 dark:text-orange-400'}`} />
                                <span className="text-xs font-bold mt-1">Gruas</span>
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <div className="relative flex-grow w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="w-5 h-5 text-slate-400" /></div>
                                <input type="text" placeholder="Filtrar por nome do cliente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500"/>
                            </div>
                            <div className="flex-shrink-0 w-full sm:w-auto"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-1.5 px-3" /></div>
                            <div className="flex-shrink-0 w-full sm:w-auto"><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-1.5 px-3" /></div>
                        </div>
                    </div>
                )}
            </div>
            
            {pendingBillings.length > 0 && activeTab === 'billings' && (
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-amber-500 dark:text-amber-400 mb-4">Pagamentos Pendentes</h2>
                    <div className="space-y-4">
                        {pendingBillings.map(billing => (
                            <div key={billing.id} className="bg-amber-100/50 dark:bg-amber-900/40 p-4 rounded-lg shadow-md border-l-4 border-amber-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{billing.customerName}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {new Date(billing.settledAt).toLocaleDateString('pt-BR')} - <span className="capitalize">{billing.equipmentType}</span> {billing.equipmentNumero}
                                    </p>
                                    <p className="font-mono font-bold text-lg text-amber-600 dark:text-amber-400 mt-1">
                                        {areValuesHidden ? 'R$ •••,••' : `R$ ${(billing.valorTotal - (billing.valorBonus || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    </p>
                                </div>
                                {billing.equipmentType !== 'grua' && (
                                    <button onClick={() => onFinalizePayment(billing)} className="w-full sm:w-auto bg-amber-600 text-white font-bold py-2 px-4 rounded-md hover:bg-amber-500">
                                        Finalizar Pagamento
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {activeTab === 'billings' && <BillingsList billings={completedBillings} onEdit={onEditBilling} onDelete={setDeletingBilling} onShowActions={onShowActions} totalBilled={totalBilled} handleSort={handleSort} renderSortArrow={renderSortArrow} getNetBilledAmount={getNetBilledAmount} areValuesHidden={areValuesHidden} />}
            {activeTab === 'debtors' && <DebtorsList debtorCustomers={debtorCustomers} totalDebt={totalDebt} onPrint={handlePrintDebtors} onPayDebtCustomer={onPayDebtCustomer} areValuesHidden={areValuesHidden} />}
            
            {deletingBilling && <ActionModal isOpen={!!deletingBilling} onClose={() => setDeletingBilling(null)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" confirmText="Sim, Excluir"><p>Tem certeza que deseja excluir esta cobrança para <strong>{deletingBilling.customerName}</strong> no valor de <strong>R$ {deletingBilling.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>?</p><p className="mt-2 text-amber-500 dark:text-amber-300">Esta ação irá reverter a leitura do relógio do equipamento e, se aplicável, o valor da dívida do cliente.</p></ActionModal>}
        </>
    );
};

export default CobrancasView;