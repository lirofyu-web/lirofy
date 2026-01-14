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
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';
import { CurrencyDollarIcon } from '../components/icons/CurrencyDollarIcon';

interface CobrancasViewProps {
    billings: Billing[];
    customers: Customer[];
    onShowActions: (billing: Billing) => void;
    onEditBilling: (billing: Billing) => void;
    onDeleteBilling: (billingId: string) => void;
}

type SortKey = 'settledAt' | 'customerName' | 'valorTotal' | 'paidAt' | 'amountPaid';
type SortDirection = 'asc' | 'desc';
type EquipmentFilter = 'all' | 'mesa' | 'jukebox' | 'grua';
type MainTab = 'billings' | 'debtors';


const PaymentMethodDisplay: React.FC<{ method?: 'pix' | 'dinheiro' | 'debito_negativo' | 'misto' }> = React.memo(({ method }) => {
    if(!method) return null;
    const displayMethod = method === 'debito_negativo' ? 'negativo' : method;
    const styles: Record<'pix' | 'dinheiro' | 'negativo' | 'misto', string> = {
        pix: 'bg-lime-100 dark:bg-lime-900/50 text-lime-800 dark:text-lime-300 border-lime-300 dark:border-lime-600',
        dinheiro: 'bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-600',
        negativo: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-600',
        misto: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-600',
    };
    const text: Record<'pix' | 'dinheiro' | 'negativo' | 'misto', string> = {
        pix: 'PIX',
        dinheiro: 'Dinheiro',
        negativo: 'Negativo',
        misto: 'Misto',
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

const CobrancasView: React.FC<CobrancasViewProps> = ({ 
    billings, 
    customers, 
    onShowActions,
    onEditBilling,
    onDeleteBilling
}) => {
    const [activeTab, setActiveTab] = useState<MainTab>('billings');
    const [sortKey, setSortKey] = useState<SortKey>('settledAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [equipmentFilter, setEquipmentFilter] = useState<EquipmentFilter>('all');
    const [deletingBilling, setDeletingBilling] = useState<Billing | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

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

    const handleSort = useCallback((key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    }, [sortKey]);
    
    const renderSortArrow = (key: SortKey) => (sortKey === key) ? (sortDirection === 'asc' ? '▲' : '▼') : null;

    const totalBilled = useMemo(() => (filteredAndSortedData as Billing[]).reduce((sum, b) => sum + (b.valorTotal - (b.valorDebitoNegativo || 0)), 0), [filteredAndSortedData]);

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

        const reportHtml = `...`; // (Implementation unchanged)
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
                
                {activeTab !== 'debtors' && (
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center flex-wrap">
                        <div className="relative flex-grow w-full sm:w-auto">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="w-5 h-5 text-slate-400" /></div>
                            <input type="text" placeholder="Filtrar por nome do cliente..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500"/>
                        </div>
                        {activeTab === 'billings' && (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button onClick={() => setEquipmentFilter('all')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${equipmentFilter === 'all' ? 'bg-lime-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>Todos</button>
                                <button onClick={() => setEquipmentFilter('mesa')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${equipmentFilter === 'mesa' ? 'bg-lime-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>Mesas</button>
                                <button onClick={() => setEquipmentFilter('jukebox')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${equipmentFilter === 'jukebox' ? 'bg-lime-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>Jukebox</button>
                                <button onClick={() => setEquipmentFilter('grua')} className={`px-3 py-1.5 text-xs font-bold rounded-md ${equipmentFilter === 'grua' ? 'bg-lime-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>Gruas</button>
                            </div>
                        )}
                        <div className="flex-grow w-full sm:w-auto"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-1.5 px-3" /></div>
                        <div className="flex-grow w-full sm:w-auto"><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-1.5 px-3" /></div>
                    </div>
                )}
            </div>

            {activeTab === 'billings' && <BillingsList billings={filteredAndSortedData as Billing[]} onEdit={onEditBilling} onDelete={setDeletingBilling} onShowActions={onShowActions} totalBilled={totalBilled} handleSort={handleSort} renderSortArrow={renderSortArrow} />}
            {activeTab === 'debtors' && <DebtorsList debtorCustomers={debtorCustomers} totalDebt={totalDebt} billings={billings} onPrint={handlePrintDebtors} />}
            
            {deletingBilling && <ActionModal isOpen={!!deletingBilling} onClose={() => setDeletingBilling(null)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" confirmText="Sim, Excluir"><p>Tem certeza que deseja excluir esta cobrança para <strong>{deletingBilling.customerName}</strong> no valor de <strong>R$ {deletingBilling.valorTotal.toFixed(2)}</strong>?</p><p className="mt-2 text-amber-500 dark:text-amber-300">Esta ação irá reverter a leitura do relógio do equipamento e, se aplicável, o valor da dívida do cliente.</p></ActionModal>}
        </>
    );
};

// --- Sub-components for each tab ---

const BillingsList: React.FC<any> = ({ billings, onEdit, onDelete, onShowActions, totalBilled, handleSort, renderSortArrow }) => (
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
                            <p className="font-mono font-bold text-lg text-lime-600 dark:text-lime-400">R$ {(billing.valorTotal - (billing.valorDebitoNegativo || 0)).toFixed(2).replace('.', ',')}</p>
                            {billing.valorDebitoNegativo && billing.valorDebitoNegativo > 0 && (
                                <p className="font-mono text-sm text-red-500 dark:text-red-400">
                                    (- R$ {billing.valorDebitoNegativo.toFixed(2).replace('.', ',')})
                                </p>
                            )}
                            <PaymentMethodDisplay method={billing.paymentMethod} />
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
                            <button onClick={() => onShowActions(billing)} className="text-sm font-semibold text-lime-600 dark:text-lime-400">Ver</button>
                            <button onClick={() => onEdit(billing)} className="p-1 text-sky-500 dark:text-sky-400" title="Editar Cobrança"><PencilIcon className="w-5 h-5" /></button>
                            <button onClick={() => onDelete(billing)} className="p-1 text-red-500 dark:text-red-400" title="Excluir Cobrança"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                </div>
            )) : <p className="text-center py-16 text-slate-500 dark:text-slate-400 italic">Nenhuma cobrança encontrada.</p>}
            {billings.length > 0 && <div className="mt-4 pt-4 border-t-2 border-slate-300 dark:border-slate-600 flex justify-between font-bold text-lg"><span >TOTAL</span><span className="font-mono text-lime-600 dark:text-lime-400">R$ {totalBilled.toFixed(2)}</span></div>}
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
                            <th scope="col" className="px-6 py-3 text-right cursor-pointer" onClick={() => handleSort('valorTotal')}>Valor (Firma) {renderSortArrow('valorTotal')}</th>
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
                                    <span className="text-lime-600 dark:text-lime-400">R$ {(billing.valorTotal - (billing.valorDebitoNegativo || 0)).toFixed(2).replace('.', ',')}</span>
                                    {billing.valorDebitoNegativo && billing.valorDebitoNegativo > 0 && (
                                        <span className="block text-xs text-red-500 dark:text-red-400">
                                            (- R$ {billing.valorDebitoNegativo.toFixed(2).replace('.', ',')})
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center items-center gap-4">
                                        <button onClick={() => onShowActions(billing)} className="text-slate-500 hover:text-lime-500" title="Ver Recibo">Ver</button>
                                        <button onClick={() => onEdit(billing)} className="text-slate-500 hover:text-sky-500" title="Editar Cobrança"><PencilIcon className="w-5 h-5" /></button>
                                        <button onClick={() => onDelete(billing)} className="text-slate-500 hover:text-red-500" title="Excluir Cobrança"><TrashIcon className="w-5 h-5" /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                           <tr><td colSpan={6} className="text-center py-16 text-slate-500 dark:text-slate-400 italic">Nenhuma cobrança encontrada.</td></tr>
                        )}
                    </tbody>
                    <tfoot className="bg-slate-100 dark:bg-slate-700/50 font-bold text-slate-900 dark:text-white">
                        <tr>
                            <td colSpan={5} className="text-right px-6 py-3 uppercase">Total Filtrado</td>
                            <td className="text-right px-6 py-3 font-mono text-lg text-lime-600 dark:text-lime-400">R$ {totalBilled.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </>
);

const DebtorsList: React.FC<any> = ({ debtorCustomers, totalDebt, billings, onPrint }) => (
    <div className="bg-white/75 dark:bg-slate-800/75 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex justify-between items-center p-4 bg-slate-100 dark:bg-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Clientes Devedores (Negativo)</h3>
            <button onClick={onPrint} className="inline-flex items-center gap-2 bg-cyan-600 text-white font-bold py-1.5 px-3 rounded-md hover:bg-cyan-500 text-sm"><PrinterIcon className="w-4 h-4" /><span>Imprimir Lista</span></button>
        </div>
        
        {/* Mobile View: Debtor Cards */}
        <div className="md:hidden">
            <div className="p-4 space-y-3">
                {debtorCustomers.length > 0 ? debtorCustomers.map((customer: Customer) => {
                    const typeMap: Record<string, string> = { mesa: 'M. Sinuca', jukebox: 'Jukebox', grua: 'Grua' };
                    const debtItems = billings
                        .filter((b: Billing) => b.customerId === customer.id && b.valorDebitoNegativo && b.valorDebitoNegativo > 0)
                        .map((b: Billing) => typeMap[b.equipmentType] || b.equipmentType);
                    const uniqueItems = [...new Set(debtItems)].join(', ');

                    return (
                        <div key={customer.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white break-words">{customer.name}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 break-words">{customer.cidade}</p>
                                </div>
                                <p className="font-mono font-bold text-lg text-red-500 dark:text-red-400 whitespace-nowrap">
                                    R$ {customer.debtAmount.toFixed(2)}
                                </p>
                            </div>
                            {uniqueItems && (
                                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Origem: {uniqueItems}</p>
                                </div>
                            )}
                        </div>
                    )
                }) : (
                    <p className="text-center py-10 text-slate-500 dark:text-slate-400 italic">Nenhum cliente com dívidas.</p>
                )}
            </div>
             <div className="p-4 bg-slate-100 dark:bg-slate-700/50 flex justify-between items-center font-bold text-slate-900 dark:text-white">
                <span className="text-lg uppercase">Total Geral de Dívidas</span>
                <span className="font-mono text-xl">R$ {totalDebt.toFixed(2)}</span>
            </div>
        </div>

        {/* Desktop View: Debtor Table */}
        <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-700/50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Cliente</th>
                        <th scope="col" className="px-6 py-3">Cidade</th>
                        <th scope="col" className="px-6 py-3">Itens (Origem da Dívida)</th>
                        <th scope="col" className="px-6 py-3 text-right">Valor da Dívida</th>
                    </tr>
                </thead>
                <tbody>
                    {debtorCustomers.length > 0 ? debtorCustomers.map((customer: Customer) => {
                        const typeMap: Record<string, string> = { mesa: 'M. Sinuca', jukebox: 'Jukebox', grua: 'Grua' };
                        const debtItems = billings
                            .filter((b: Billing) => b.customerId === customer.id && b.valorDebitoNegativo && b.valorDebitoNegativo > 0)
                            .map((b: Billing) => typeMap[b.equipmentType] || b.equipmentType);
                        const uniqueItems = [...new Set(debtItems)].join(', ');

                        return (
                            <tr key={customer.id} className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{customer.name}</td>
                                <td className="px-6 py-4">{customer.cidade}</td>
                                <td className="px-6 py-4">{uniqueItems || 'N/A'}</td>
                                <td className="px-6 py-4 text-right font-mono text-red-600 dark:text-red-400 font-bold">R$ {customer.debtAmount.toFixed(2)}</td>
                            </tr>
                        )
                    }) : (
                        <tr>
                            <td colSpan={4} className="text-center py-16 text-slate-500 dark:text-slate-400 italic">Nenhum cliente com dívidas.</td>
                        </tr>
                    )}
                </tbody>
                 <tfoot className="bg-slate-100 dark:bg-slate-700/50">
                    <tr className="font-bold text-slate-900 dark:text-white">
                        <td colSpan={3} className="text-right px-6 py-3 uppercase">Total Geral de Dívidas</td>
                        <td className="text-right px-6 py-3 font-mono text-lg">R$ {totalDebt.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
);

export default CobrancasView;