// views/CobrancasView.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { Billing, Customer } from '../types';
import PageHeader from '../components/PageHeader';
import { SearchIcon } from '../components/icons/SearchIcon';
import { BilliardIcon } from '../components/icons/BilliardIcon';
import { JukeboxIcon } from '../components/icons/JukeboxIcon';
import { CraneIcon } from '../components/icons/CraneIcon';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import ActionModal from '../components/ActionModal';
import { ChevronDownIcon } from '../components/icons/ChevronDownIcon';

interface CobrancasViewProps {
    billings: Billing[];
    customers: Customer[];
    onShowReceipt: (billing: Billing) => void;
    onDeleteBilling: (billingId: string) => void;
}

type SortKey = 'settledAt' | 'customerName' | 'valorTotal';
type SortDirection = 'asc' | 'desc';
type Filter = 'all' | 'mesa' | 'jukebox' | 'grua';

const PaymentMethodDisplay: React.FC<{ method: 'pix' | 'dinheiro' | 'fiado' | 'misto' }> = React.memo(({ method }) => {
    const styles = {
        pix: 'bg-lime-100 dark:bg-lime-900/50 text-lime-800 dark:text-lime-300 border-lime-300 dark:border-lime-600',
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

const CobrancasView: React.FC<CobrancasViewProps> = ({ billings, customers, onShowReceipt, onDeleteBilling }) => {
    const [sortKey, setSortKey] = useState<SortKey>('settledAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [equipmentFilter, setEquipmentFilter] = useState<Filter>('all');
    const [deletingBilling, setDeletingBilling] = useState<Billing | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);


    const filteredBillings = useMemo(() => {
        return billings
            .filter(billing => {
                if (equipmentFilter !== 'all' && billing.equipmentType !== equipmentFilter) {
                    return false;
                }
                if (searchQuery && !billing.customerName.toLowerCase().includes(searchQuery.toLowerCase())) {
                    return false;
                }
                const billingDate = new Date(billing.settledAt);
                if (startDate) {
                    const filterStartDate = new Date(startDate);
                    filterStartDate.setHours(0, 0, 0, 0);
                    if (billingDate < filterStartDate) return false;
                }
                if (endDate) {
                    const filterEndDate = new Date(endDate);
                    filterEndDate.setHours(23, 59, 59, 999);
                    if (billingDate > filterEndDate) return false;
                }
                return true;
            });
    }, [billings, equipmentFilter, searchQuery, startDate, endDate]);
    
    const sortedBillings = useMemo(() => {
        return [...filteredBillings].sort((a, b) => {
            let compareA: any;
            let compareB: any;

            if (sortKey === 'settledAt') {
                compareA = new Date(a.settledAt).getTime();
                compareB = new Date(b.settledAt).getTime();
            } else {
                compareA = a[sortKey];
                compareB = b[sortKey];
            }

            if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
            if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredBillings, sortKey, sortDirection]);

    const handleSort = useCallback((key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    }, [sortKey]);
    
    const renderSortArrow = (key: SortKey) => {
        if (sortKey !== key) return null;
        return sortDirection === 'asc' ? '▲' : '▼';
    };

    const totalBilled = useMemo(() => sortedBillings.reduce((sum, b) => sum + (b.valorTotal - (b.valorPagoFiado || 0)), 0), [sortedBillings]);
    
    const { debtorCustomers, totalDebt } = useMemo(() => {
        const debtors = customers.filter(c => c.debtAmount > 0).sort((a,b) => b.debtAmount - a.debtAmount);
        const debt = customers.reduce((sum, c) => sum + c.debtAmount, 0);
        return { debtorCustomers: debtors, totalDebt: debt };
    }, [customers]);
    
    const historyData = useMemo(() => {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const recentBillings = billings.filter(b => new Date(b.settledAt) >= ninetyDaysAgo);

        const billingsByCustomer = recentBillings.reduce((acc, billing) => {
            if (!acc[billing.customerId]) {
                acc[billing.customerId] = [];
            }
            acc[billing.customerId].push(billing);
            return acc;
        }, {} as Record<string, Billing[]>);

        const customerIdsWithHistory = Object.keys(billingsByCustomer);
        
        const customersWithHistory = customers
            .filter(c => customerIdsWithHistory.includes(c.id))
            .sort((a, b) => a.name.localeCompare(b.name));

        return { billingsByCustomer, customersWithHistory };
    }, [billings, customers]);
    
    const handlePrintCustomerHistory = useCallback((customer: Customer, customerBillings: Billing[]) => {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const today = new Date();

        const totalBilled = customerBillings.reduce((sum, b) => sum + (b.valorTotal - (b.valorPagoFiado || 0)), 0);

        const reportHtml = `
          <html>
            <head>
              <title>Histórico de Cobrança - ${customer.name}</title>
              <style>
                body { font-family: Arial, sans-serif; font-size: 10pt; color: #333; }
                @page { size: A4 landscape; margin: 15mm; }
                h1, h2, p { text-align: center; }
                h1 { font-size: 16pt; margin-bottom: 5px; }
                h2 { font-size: 12pt; margin: 0; }
                p { font-size: 10pt; margin: 5px 0 20px 0; color: #555; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .currency { text-align: right; font-family: monospace; }
                tfoot td { font-weight: bold; border-top: 2px solid #333; }
              </style>
            </head>
            <body>
              <h1>Histórico de Cobrança</h1>
              <h2>Cliente: ${customer.name}</h2>
              <p>Período: ${ninetyDaysAgo.toLocaleDateString('pt-BR')} - ${today.toLocaleDateString('pt-BR')}</p>
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Equipamento</th>
                    <th class="currency">Rel. Ant.</th>
                    <th class="currency">Rel. Atual</th>
                    <th class="currency">Jogadas</th>
                    <th>Pagamento</th>
                    <th class="currency">Valor (Firma)</th>
                  </tr>
                </thead>
                <tbody>
                  ${customerBillings.sort((a,b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime()).map(b => `
                    <tr>
                      <td>${new Date(b.settledAt).toLocaleDateString('pt-BR')}</td>
                      <td>${b.equipmentType.charAt(0).toUpperCase() + b.equipmentType.slice(1)} ${b.equipmentNumero}</td>
                      <td class="currency">${b.equipmentType === 'mesa' ? b.relogioAnterior : '-'}</td>
                      <td class="currency">${b.equipmentType === 'mesa' ? b.relogioAtual : '-'}</td>
                      <td class="currency">${b.equipmentType === 'mesa' ? b.partidasJogadas : '-'}</td>
                      <td>${{pix: 'PIX', dinheiro: 'Dinheiro', fiado: 'Fiado', misto: 'Misto'}[b.paymentMethod]}</td>
                      <td class="currency">R$ ${(b.valorTotal - (b.valorPagoFiado || 0)).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="6"><strong>Total no Período</strong></td>
                    <td class="currency"><strong>R$ ${totalBilled.toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </body>
          </html>
        `;
        const printWindow = window.open('', '', 'height=800,width=1200');
        if (printWindow) {
            printWindow.document.write(reportHtml);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    }, []);

    const handlePrintDebtors = useCallback(() => {
        const itemsByCustomer = (customerId: string) => {
            const debtItems = billings
                .filter(b => b.customerId === customerId && b.valorPagoFiado && b.valorPagoFiado > 0)
                .map(b => b.equipmentType === 'mesa' ? 'M. Sinuca' : 'Jukebox');
            return [...new Set(debtItems)].join(', ');
        };
        const reportHtml = `
          <html>
            <head>
              <title>Lista de Clientes Devedores</title>
              <style>
                body { font-family: Arial, sans-serif; font-size: 10pt; color: #333; }
                @page { size: A4; margin: 20mm; }
                h1 { text-align: center; font-size: 16pt; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .currency { text-align: right; font-family: monospace; }
                .total-row td { font-weight: bold; border-top: 2px solid #333; }
              </style>
            </head>
            <body>
              <h1>Lista de Clientes Devedores (Fiado)</h1>
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Cidade</th>
                    <th>Itens (Origem da Dívida)</th>
                    <th class="currency">Valor da Dívida</th>
                  </tr>
                </thead>
                <tbody>
                  ${debtorCustomers.map(c => `
                    <tr>
                      <td>${c.name}</td>
                      <td>${c.cidade}</td>
                      <td>${itemsByCustomer(c.id) || 'N/A'}</td>
                      <td class="currency">R$ ${c.debtAmount.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                  <tr class="total-row">
                    <td colspan="3"><strong>TOTAL GERAL DE DÍVIDAS</strong></td>
                    <td class="currency"><strong>R$ ${totalDebt.toFixed(2)}</strong></td>
                  </tr>
                </tbody>
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
            printWindow.close();
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
            <PageHeader title="Histórico de Cobranças" subtitle="Visualize todas as cobranças realizadas e dívidas pendentes." />
            
            <div className="bg-white/75 dark:bg-slate-800/75 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center flex-wrap">
                 <div className="relative flex-grow w-full sm:w-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Filtrar por nome do cliente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={() => setEquipmentFilter('all')} className={`px-4 py-2 text-sm font-bold rounded-md ${equipmentFilter === 'all' ? 'bg-lime-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Todos</button>
                    <button onClick={() => setEquipmentFilter('mesa')} className={`px-4 py-2 text-sm font-bold rounded-md ${equipmentFilter === 'mesa' ? 'bg-lime-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Mesas</button>
                    <button onClick={() => setEquipmentFilter('jukebox')} className={`px-4 py-2 text-sm font-bold rounded-md ${equipmentFilter === 'jukebox' ? 'bg-lime-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Jukebox</button>
                    <button onClick={() => setEquipmentFilter('grua')} className={`px-4 py-2 text-sm font-bold rounded-md ${equipmentFilter === 'grua' ? 'bg-lime-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Gruas</button>
                </div>
                <div className="flex-grow w-full sm:w-auto">
                    <label htmlFor="startDate" className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">De:</label>
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-1.5 px-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500" />
                </div>
                <div className="flex-grow w-full sm:w-auto">
                    <label htmlFor="endDate" className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Até:</label>
                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-1.5 px-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-lime-500" />
                </div>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4 mb-10">
                {sortedBillings.length > 0 ? sortedBillings.map(billing => (
                    <div key={billing.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white break-words">{billing.customerName}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(billing.settledAt).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-mono font-bold text-lg text-lime-600 dark:text-lime-400">R$ {(billing.valorTotal - (billing.valorPagoFiado || 0)).toFixed(2)}</p>
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
                                <button onClick={() => onShowReceipt(billing)} className="text-sm font-semibold text-lime-600 dark:text-lime-400 hover:underline">Ver</button>
                                <button onClick={() => setDeletingBilling(billing)} className="text-red-500 dark:text-red-400" title="Excluir Cobrança">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )) : (
                     <p className="text-center py-16 text-slate-500 dark:text-slate-400 italic">Nenhuma cobrança encontrada para os filtros selecionados.</p>
                )}
                 {sortedBillings.length > 0 && (
                    <div className="mt-4 pt-4 border-t-2 border-slate-300 dark:border-slate-600 flex justify-between items-center font-bold text-slate-900 dark:text-white">
                        <span className="text-lg">TOTAL FILTRADO</span>
                        <span className="font-mono text-xl text-lime-600 dark:text-lime-400">R$ {totalBilled.toFixed(2)}</span>
                    </div>
                 )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block bg-white/75 dark:bg-slate-800/75 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-10">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300 min-w-[800px]">
                        <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('settledAt')}>Data {renderSortArrow('settledAt')}</th>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('customerName')}>Cliente {renderSortArrow('customerName')}</th>
                                <th scope="col" className="px-6 py-3">Equipamento</th>
                                <th scope="col" className="px-6 py-3">Pagamento</th>
                                <th scope="col" className="px-6 py-3 text-right cursor-pointer" onClick={() => handleSort('valorTotal')}>Valor (Firma) {renderSortArrow('valorTotal')}</th>
                                <th scope="col" className="px-6 py-3 text-center">Recibo</th>
                                <th scope="col" className="px-6 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedBillings.length > 0 ? sortedBillings.map(billing => (
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
                                    <td className="px-6 py-4">
                                        <PaymentMethodDisplay method={billing.paymentMethod} />
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-lime-600 dark:text-lime-400">R$ {(billing.valorTotal - (billing.valorPagoFiado || 0)).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center">
                                         <button onClick={() => onShowReceipt(billing)} className="text-slate-500 dark:text-slate-400 hover:text-lime-500 dark:hover:text-lime-400">Ver</button>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => setDeletingBilling(billing)} className="text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400" title="Excluir Cobrança">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-16 text-slate-500 dark:text-slate-400 italic">Nenhuma cobrança encontrada para os filtros selecionados.</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-100 dark:bg-slate-700/50">
                            <tr className="font-bold text-slate-900 dark:text-white">
                                <td colSpan={4} className="text-right px-6 py-3 uppercase">Total Filtrado</td>
                                <td className="text-right px-6 py-3 font-mono text-lg text-lime-600 dark:text-lime-400">R$ {totalBilled.toFixed(2)}</td>
                                <td></td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="space-y-4 mb-10">
                <div className="bg-white/75 dark:bg-slate-800/75 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Histórico por Cliente (Últimos 90 dias)</h3>
                </div>
                {historyData.customersWithHistory.length > 0 ? historyData.customersWithHistory.map(customer => {
                    const customerBillings = historyData.billingsByCustomer[customer.id];
                    const isExpanded = expandedCustomerId === customer.id;
                    return (
                        <div key={customer.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <button
                                onClick={() => setExpandedCustomerId(isExpanded ? null : customer.id)}
                                className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                aria-expanded={isExpanded}
                            >
                                <span className="font-bold text-slate-900 dark:text-white break-words">{customer.name}</span>
                                <div className="flex items-center gap-2">
                                     <span className="text-sm text-slate-500 dark:text-slate-400">{customerBillings.length} cobrança(s)</span>
                                     <ChevronDownIcon className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            </button>
                            {isExpanded && (
                                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    <div className="flex justify-end mb-4">
                                        <button 
                                            onClick={() => handlePrintCustomerHistory(customer, customerBillings)}
                                            className="inline-flex items-center gap-2 bg-cyan-600 text-white font-bold py-1.5 px-3 rounded-md hover:bg-cyan-500 transition-colors text-sm"
                                        >
                                            <PrinterIcon className="w-4 h-4" />
                                            <span>Imprimir Histórico</span>
                                        </button>
                                    </div>
                                    {/* Mobile History View */}
                                    <div className="md:hidden space-y-3">
                                       {customerBillings.sort((a,b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime()).map(billing => (
                                            <div key={billing.id} className="bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700">
                                                <div className="flex justify-between items-start text-sm">
                                                    <div>
                                                        <p className="text-slate-500">{new Date(billing.settledAt).toLocaleDateString('pt-BR')}</p>
                                                        <PaymentMethodDisplay method={billing.paymentMethod} />
                                                    </div>
                                                    <p className="font-mono font-bold text-lime-600 dark:text-lime-400">R$ {(billing.valorTotal - (billing.valorPagoFiado || 0)).toFixed(2)}</p>
                                                </div>
                                                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/50">
                                                    <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                        {billing.equipmentType === 'mesa' ? <BilliardIcon className="w-4 h-4 text-cyan-500 dark:text-cyan-400" /> : 
                                                        billing.equipmentType === 'jukebox' ? <JukeboxIcon className="w-4 h-4 text-fuchsia-500 dark:text-fuchsia-400" /> :
                                                        <CraneIcon className="w-4 h-4 text-orange-500 dark:text-orange-400" />}
                                                        Equipamento: {billing.equipmentType.charAt(0).toUpperCase() + billing.equipmentType.slice(1)} {billing.equipmentNumero}
                                                    </p>
                                                </div>
                                            </div>
                                       ))}
                                    </div>

                                    {/* Desktop History View */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                                            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-700/50">
                                                <tr>
                                                    <th scope="col" className="px-4 py-2">Data</th>
                                                    <th scope="col" className="px-4 py-2">Equipamento</th>
                                                    <th scope="col" className="px-4 py-2 text-center">Rel. Ant.</th>
                                                    <th scope="col" className="px-4 py-2 text-center">Rel. Atual</th>
                                                    <th scope="col" className="px-4 py-2 text-center">Jogadas</th>
                                                    <th scope="col" className="px-4 py-2">Pagamento</th>
                                                    <th scope="col" className="px-4 py-2 text-right">Valor (Firma)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {customerBillings.sort((a,b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime()).map(billing => (
                                                    <tr key={billing.id} className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                                                        <td className="px-4 py-2">{new Date(billing.settledAt).toLocaleDateString('pt-BR')}</td>
                                                        <td className="px-4 py-2">
                                                            <span className="flex items-center gap-2">
                                                                {billing.equipmentType === 'mesa' ? <BilliardIcon className="w-4 h-4 text-cyan-500 dark:text-cyan-400" /> : 
                                                                billing.equipmentType === 'jukebox' ? <JukeboxIcon className="w-4 h-4 text-fuchsia-500 dark:text-fuchsia-400" /> :
                                                                <CraneIcon className="w-4 h-4 text-orange-500 dark:text-orange-400" />}
                                                                {billing.equipmentType === 'mesa' ? `Mesa ${billing.equipmentNumero}` : 
                                                                billing.equipmentType === 'jukebox' ? `Jukebox ${billing.equipmentNumero}` :
                                                                `Grua ${billing.equipmentNumero}`}
                                                            </span>
                                                        </td>
                                                        {billing.equipmentType === 'mesa' ? (
                                                            <>
                                                                <td className="px-4 py-2 text-center font-mono">{billing.relogioAnterior}</td>
                                                                <td className="px-4 py-2 text-center font-mono">{billing.relogioAtual}</td>
                                                                <td className="px-4 py-2 text-center font-mono">{billing.partidasJogadas}</td>
                                                            </>
                                                        ) : (
                                                            <td colSpan={3} className="px-4 py-2 text-center text-slate-400">-</td>
                                                        )}
                                                        <td className="px-4 py-2"><PaymentMethodDisplay method={billing.paymentMethod} /></td>
                                                        <td className="px-4 py-2 text-right font-mono font-bold text-lime-600 dark:text-lime-400">R$ {(billing.valorTotal - (billing.valorPagoFiado || 0)).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }) : (
                    <p className="text-center py-10 text-slate-500 dark:text-slate-400 italic">
                        Nenhuma cobrança registrada nos últimos 90 dias.
                    </p>
                )}
            </div>

            <div className="bg-white/75 dark:bg-slate-800/75 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex justify-between items-center p-4 bg-slate-100 dark:bg-slate-700/50">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Clientes Devedores (Fiado)</h3>
                    <button 
                        onClick={handlePrintDebtors}
                        className="inline-flex items-center gap-2 bg-cyan-600 text-white font-bold py-1.5 px-3 rounded-md hover:bg-cyan-500 transition-colors text-sm"
                    >
                      <PrinterIcon className="w-4 h-4" />
                      <span>Imprimir Lista</span>
                    </button>
                </div>

                {/* Mobile View: Debtor Cards */}
                <div className="md:hidden">
                    <div className="p-4 space-y-3">
                        {debtorCustomers.length > 0 ? debtorCustomers.map(customer => {
                            const debtItems = billings
                                .filter(b => b.customerId === customer.id && b.valorPagoFiado && b.valorPagoFiado > 0)
                                .map(b => b.equipmentType === 'mesa' ? 'M. Sinuca' : 'Jukebox');
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
                            {debtorCustomers.length > 0 ? debtorCustomers.map(customer => {
                                const debtItems = billings
                                    .filter(b => b.customerId === customer.id && b.valorPagoFiado && b.valorPagoFiado > 0)
                                    .map(b => b.equipmentType === 'mesa' ? 'M. Sinuca' : 'Jukebox');
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

            {deletingBilling && (
                <ActionModal
                    isOpen={!!deletingBilling}
                    onClose={() => setDeletingBilling(null)}
                    onConfirm={handleConfirmDelete}
                    title="Confirmar Exclusão"
                    confirmText="Sim, Excluir"
                >
                    <p>Tem certeza que deseja excluir esta cobrança para <strong>{deletingBilling.customerName}</strong> no valor de <strong>R$ {deletingBilling.valorTotal.toFixed(2)}</strong>?</p>
                    <p className="mt-2 text-amber-500 dark:text-amber-300">Esta ação irá reverter a leitura do relógio do equipamento e, se aplicável, o valor da dívida do cliente.</p>
                </ActionModal>
            )}
        </>
    );
};

export default CobrancasView;