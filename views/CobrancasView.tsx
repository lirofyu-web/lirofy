// views/CobrancasView.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { Billing, Customer } from '../types';
import PageHeader from '../components/PageHeader';
import { SearchIcon } from '../components/icons/SearchIcon';
import { BilliardIcon } from '../components/icons/BilliardIcon';
import { JukeboxIcon } from '../components/icons/JukeboxIcon';
import { CraneIcon } from '../components/icons/CraneIcon';
import { PrinterIcon } from '../components/icons/PrinterIcon';

interface CobrancasViewProps {
    billings: Billing[];
    customers: Customer[];
    onShowReceipt: (billing: Billing) => void;
}

type SortKey = 'settledAt' | 'customerName' | 'valorTotal';
type SortDirection = 'asc' | 'desc';
type Filter = 'all' | 'mesa' | 'jukebox' | 'grua';

const PaymentMethodDisplay: React.FC<{ method: 'pix' | 'dinheiro' | 'fiado' }> = React.memo(({ method }) => {
    const styles = {
        pix: 'bg-emerald-900/50 text-emerald-300 border-emerald-600',
        dinheiro: 'bg-sky-900/50 text-sky-300 border-sky-600',
        fiado: 'bg-amber-900/50 text-amber-300 border-amber-600',
    };
    const text = {
        pix: 'PIX',
        dinheiro: 'Dinheiro',
        fiado: 'Fiado',
    };

    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[method]}`}>
            {text[method]}
        </span>
    );
});

const CobrancasView: React.FC<CobrancasViewProps> = ({ billings, customers, onShowReceipt }) => {
    const [sortKey, setSortKey] = useState<SortKey>('settledAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [equipmentFilter, setEquipmentFilter] = useState<Filter>('all');

    const filteredBillings = useMemo(() => {
        return billings
            .filter(billing => {
                if (equipmentFilter !== 'all' && billing.equipmentType !== equipmentFilter) {
                    return false;
                }
                if (searchQuery && !billing.customerName.toLowerCase().includes(searchQuery.toLowerCase())) {
                    return false;
                }
                return true;
            });
    }, [billings, equipmentFilter, searchQuery]);
    
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

    const totalBilled = useMemo(() => sortedBillings.reduce((sum, b) => sum + b.valorTotal, 0), [sortedBillings]);
    
    const { debtorCustomers, totalDebt } = useMemo(() => {
        const debtors = customers.filter(c => c.debtAmount > 0).sort((a,b) => b.debtAmount - a.debtAmount);
        const debt = customers.reduce((sum, c) => sum + c.debtAmount, 0);
        return { debtorCustomers: debtors, totalDebt: debt };
    }, [customers]);

    const handlePrintDebtors = useCallback(() => {
        const itemsByCustomer = (customerId: string) => {
            const debtItems = billings
                .filter(b => b.customerId === customerId && b.paymentMethod === 'fiado')
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


    return (
        <>
            <PageHeader title="Histórico de Cobranças" subtitle="Visualize todas as cobranças realizadas e dívidas pendentes." />
            
            <div className="bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-700 mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
                 <div className="relative flex-grow w-full sm:w-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Filtrar por nome do cliente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button onClick={() => setEquipmentFilter('all')} className={`px-4 py-2 text-sm font-bold rounded-md ${equipmentFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Todos</button>
                    <button onClick={() => setEquipmentFilter('mesa')} className={`px-4 py-2 text-sm font-bold rounded-md ${equipmentFilter === 'mesa' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Mesas</button>
                    <button onClick={() => setEquipmentFilter('jukebox')} className={`px-4 py-2 text-sm font-bold rounded-md ${equipmentFilter === 'jukebox' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Jukebox</button>
                    <button onClick={() => setEquipmentFilter('grua')} className={`px-4 py-2 text-sm font-bold rounded-md ${equipmentFilter === 'grua' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Gruas</button>
                </div>
            </div>

            <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden mb-10">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-300 min-w-[720px]">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('settledAt')}>Data {renderSortArrow('settledAt')}</th>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('customerName')}>Cliente {renderSortArrow('customerName')}</th>
                                <th scope="col" className="px-6 py-3">Equipamento</th>
                                <th scope="col" className="px-6 py-3">Pagamento</th>
                                <th scope="col" className="px-6 py-3 text-right cursor-pointer" onClick={() => handleSort('valorTotal')}>Valor (Firma) {renderSortArrow('valorTotal')}</th>
                                <th scope="col" className="px-6 py-3 text-center">Recibo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedBillings.length > 0 ? sortedBillings.map(billing => (
                                <tr key={billing.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50">
                                    <td className="px-6 py-4">{new Date(billing.settledAt).toLocaleDateString('pt-BR')}</td>
                                    <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{billing.customerName}</td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-2">
                                            {billing.equipmentType === 'mesa' ? <BilliardIcon className="w-4 h-4 text-cyan-400" /> : 
                                             billing.equipmentType === 'jukebox' ? <JukeboxIcon className="w-4 h-4 text-fuchsia-400" /> :
                                             <CraneIcon className="w-4 h-4 text-orange-400" />}
                                            {billing.equipmentType === 'mesa' ? `Mesa ${billing.equipmentNumero}` : 
                                             billing.equipmentType === 'jukebox' ? `Jukebox ${billing.equipmentNumero}` :
                                             `Grua ${billing.equipmentNumero}`}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <PaymentMethodDisplay method={billing.paymentMethod} />
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">R$ {billing.valorTotal.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center">
                                         <button onClick={() => onShowReceipt(billing)} className="text-slate-400 hover:text-emerald-400">Ver</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-16 text-slate-400 italic">Nenhuma cobrança encontrada para os filtros selecionados.</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-700/50">
                            <tr className="font-bold text-white">
                                <td colSpan={4} className="text-right px-6 py-3 uppercase">Total Filtrado</td>
                                <td className="text-right px-6 py-3 font-mono text-lg text-emerald-400">R$ {totalBilled.toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
                <div className="flex justify-between items-center p-4 bg-slate-700/50">
                    <h3 className="text-lg font-semibold text-white">Clientes Devedores (Fiado)</h3>
                    <button 
                        onClick={handlePrintDebtors}
                        className="inline-flex items-center gap-2 bg-cyan-600 text-white font-bold py-1.5 px-3 rounded-md hover:bg-cyan-500 transition-colors text-sm"
                    >
                      <PrinterIcon className="w-4 h-4" />
                      <span>Imprimir Lista</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-300 min-w-[720px]">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
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
                                    .filter(b => b.customerId === customer.id && b.paymentMethod === 'fiado')
                                    .map(b => b.equipmentType === 'mesa' ? 'M. Sinuca' : 'Jukebox');
                                const uniqueItems = [...new Set(debtItems)].join(', ');

                                return (
                                    <tr key={customer.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50">
                                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{customer.name}</td>
                                        <td className="px-6 py-4">{customer.cidade}</td>
                                        <td className="px-6 py-4">{uniqueItems || 'N/A'}</td>
                                        <td className="px-6 py-4 text-right font-mono text-red-400 font-bold">R$ {customer.debtAmount.toFixed(2)}</td>
                                    </tr>
                                )
                            }) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-16 text-slate-400 italic">Nenhum cliente com dívidas.</td>
                                </tr>
                            )}
                        </tbody>
                         <tfoot className="bg-slate-700/50">
                            <tr className="font-bold text-white">
                                <td colSpan={3} className="text-right px-6 py-3 uppercase">Total Geral de Dívidas</td>
                                <td className="text-right px-6 py-3 font-mono text-lg">R$ {totalDebt.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </>
    );
};

export default CobrancasView;