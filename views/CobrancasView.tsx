// Fix: The file contained invalid HTML content. It has been replaced with a proper React component to display billing history.
import React, { useState, useMemo } from 'react';
import { Billing } from '../types';
import PageHeader from '../components/PageHeader';
import ReceiptModal from '../components/ReceiptModal';
import { EyeIcon } from '../components/icons/EyeIcon';
import { SearchIcon } from '../components/icons/SearchIcon';

interface CobrancasViewProps {
  billings: Billing[];
}

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


const CobrancasView: React.FC<CobrancasViewProps> = ({ billings }) => {
  const [selectedBilling, setSelectedBilling] = useState<Billing | null>(null);
  const [filter, setFilter] = useState('');

  const filteredBillings = useMemo(() => {
    const lowercasedFilter = filter.toLowerCase();
    return billings
      .filter(b => 
        b.customerName.toLowerCase().includes(lowercasedFilter) ||
        b.equipment.toLowerCase().includes(lowercasedFilter)
      )
      .sort((a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime());
  }, [billings, filter]);
  
  const totalBilled = useMemo(() => {
    return filteredBillings.reduce((sum, b) => sum + b.valorTotal, 0);
  }, [filteredBillings]);

  return (
    <div>
      <PageHeader
        title="Histórico de Cobranças"
        subtitle="Visualize todos os registros de cobrança realizados."
      />
      
      <div className="mb-6">
        <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="w-5 h-5 text-slate-400" />
            </div>
            <input
                type="text"
                placeholder="Filtrar por cliente ou equipamento..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300 min-w-[720px]">
            <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
              <tr>
                <th scope="col" className="px-6 py-3">Data</th>
                <th scope="col" className="px-6 py-3">Cliente</th>
                <th scope="col" className="px-6 py-3">Equipamento</th>
                <th scope="col" className="px-6 py-3">Método Pgto</th>
                <th scope="col" className="px-6 py-3 text-right">Valor Total</th>
                <th scope="col" className="px-6 py-3 text-center">Recibo</th>
              </tr>
            </thead>
            <tbody>
              {filteredBillings.length > 0 ? filteredBillings.map(billing => (
                <tr key={billing.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(billing.settledAt).toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{billing.customerName}</td>
                  <td className="px-6 py-4 capitalize">{billing.equipment === 'mesa' ? 'Mesa de Sinuca' : 'Jukebox'}</td>
                  <td className="px-6 py-4">
                    <PaymentMethodDisplay method={billing.paymentMethod} />
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">R$ {billing.valorTotal.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => setSelectedBilling(billing)} className="text-slate-400 hover:text-cyan-400" title="Ver Recibo">
                        <EyeIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400 italic">Nenhuma cobrança encontrada.</td>
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
      
      {selectedBilling && (
        <ReceiptModal 
            isOpen={!!selectedBilling}
            onClose={() => setSelectedBilling(null)}
            billing={selectedBilling}
        />
      )}
    </div>
  );
};

export default CobrancasView;
