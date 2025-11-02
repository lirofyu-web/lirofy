// views/CobrancasView.tsx
import React, { useMemo, useState } from 'react';
import { Billing } from '../types';
import PageHeader from '../components/PageHeader';
import { SearchIcon } from '../components/icons/SearchIcon';
import { BilliardIcon } from '../components/icons/BilliardIcon';
import { JukeboxIcon } from '../components/icons/JukeboxIcon';

interface CobrancasViewProps {
    billings: Billing[];
    onShowReceipt: (billing: Billing) => void;
}

type SortKey = 'settledAt' | 'customerName' | 'valorTotal';
type SortDirection = 'asc' | 'desc';
type Filter = 'all' | 'mesa' | 'jukebox';

const CobrancasView: React.FC<CobrancasViewProps> = ({ billings, onShowReceipt }) => {
    const [sortKey, setSortKey] = useState<SortKey>('settledAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [equipmentFilter, setEquipmentFilter] = useState<Filter>('all');

    const filteredBillings = useMemo(() => {
        return billings
            .filter(billing => {
                if (equipmentFilter !== 'all' && billing.equipment !== equipmentFilter) {
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

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };
    
    const renderSortArrow = (key: SortKey) => {
        if (sortKey !== key) return null;
        return sortDirection === 'asc' ? '▲' : '▼';
    };

    const totalBilled = useMemo(() => sortedBillings.reduce((sum, b) => sum + b.valorTotal, 0), [sortedBillings]);
    
    const PaymentMethodDisplay = ({ method }: { method: 'pix' | 'dinheiro' | 'fiado' }) => {
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
    };

    return (
        <>
            <PageHeader title="Histórico de Cobranças" subtitle="Visualize todas as cobranças realizadas." />
            
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
                </div>
            </div>

            <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
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
                                            {billing.equipment === 'mesa' ? <BilliardIcon className="w-4 h-4 text-cyan-400" /> : <JukeboxIcon className="w-4 h-4 text-fuchsia-400" />}
                                            {billing.equipment === 'mesa' ? 'Mesa' : 'Jukebox'}
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
        </>
    );
};

export default CobrancasView;