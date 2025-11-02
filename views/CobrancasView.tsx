// views/CobrancasView.tsx
import React, { useState, useMemo } from 'react';
import { Billing, DebtPayment } from '../types';
import PageHeader from '../components/PageHeader';
import ReceiptModal from '../components/ReceiptModal';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import { BilliardIcon } from '../components/icons/BilliardIcon';
import { JukeboxIcon } from '../components/icons/JukeboxIcon';

// --- Helper Components ---
const SortIcon = ({ direction }: { direction: 'asc' | 'desc' | 'none' }) => {
    if (direction === 'none') return <span className="text-slate-500">↕</span>;
    return direction === 'asc' ? <span className="text-white">↑</span> : <span className="text-white">↓</span>;
};

const EquipmentDisplay = ({ equipment }: { equipment: 'mesa' | 'jukebox' }) => {
    const isMesa = equipment === 'mesa';
    const Icon = isMesa ? BilliardIcon : JukeboxIcon;
    const text = isMesa ? 'Mesa' : 'Jukebox';
    
    return (
        <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-slate-400" />
            <span>{text}</span>
        </div>
    );
};

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
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${styles[method]}`}>
            {text[method]}
        </span>
    );
};

// --- Main Component ---
interface CobrancasViewProps {
  billings: Billing[];
  debtPayments: DebtPayment[];
}

const CobrancasView: React.FC<CobrancasViewProps> = ({ billings, debtPayments }) => {
  const [selectedBilling, setSelectedBilling] = useState<Billing | null>(null);

  // Sorting state for Billings table
  const [billSortKey, setBillSortKey] = useState<'customerName' | 'settledAt' | 'valorTotal'>('settledAt');
  const [billSortDir, setBillSortDir] = useState<'asc' | 'desc'>('desc');
  
  // Sorting state for Debt Payments table
  const [debtSortKey, setDebtSortKey] = useState<'customerName' | 'paidAt' | 'amountPaid'>('paidAt');
  const [debtSortDir, setDebtSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedBillings = useMemo(() => {
    return [...billings].sort((a, b) => {
      const valA = a[billSortKey];
      const valB = b[billSortKey];
      
      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return billSortDir === 'desc' ? -comparison : comparison;
    });
  }, [billings, billSortKey, billSortDir]);

  const sortedDebtPayments = useMemo(() => {
    return [...debtPayments].sort((a, b) => {
      const valA = a[debtSortKey];
      const valB = b[debtSortKey];
      
      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return debtSortDir === 'desc' ? -comparison : comparison;
    });
  }, [debtPayments, debtSortKey, debtSortDir]);

  const handleBillSort = (key: 'customerName' | 'settledAt' | 'valorTotal') => {
    if (billSortKey === key) {
      setBillSortDir(billSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setBillSortKey(key);
      setBillSortDir('desc');
    }
  };

  const handleDebtSort = (key: 'customerName' | 'paidAt' | 'amountPaid') => {
    if (debtSortKey === key) {
      setDebtSortDir(debtSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setDebtSortKey(key);
      setDebtSortDir('desc');
    }
  };

  const BillSortableHeader = ({ label, sortKey }: { label: string, sortKey: 'customerName' | 'settledAt' | 'valorTotal' }) => (
    <th scope="col" className="px-6 py-3">
        <button className="flex items-center gap-2" onClick={() => handleBillSort(sortKey)}>
            {label}
            <SortIcon direction={billSortKey === sortKey ? billSortDir : 'none'} />
        </button>
    </th>
  );
  
  const DebtSortableHeader = ({ label, sortKey }: { label: string, sortKey: 'customerName' | 'paidAt' | 'amountPaid' }) => (
    <th scope="col" className="px-6 py-3">
        <button className="flex items-center gap-2" onClick={() => handleDebtSort(sortKey)}>
            {label}
            <SortIcon direction={debtSortKey === sortKey ? debtSortDir : 'none'} />
        </button>
    </th>
  );

  return (
    <>
      <div>
        <PageHeader 
          title="Histórico Financeiro"
          subtitle="Visualize todas as cobranças e pagamentos de dívidas realizados."
        />
        
        <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
           <h3 className="text-lg font-semibold text-white p-4 bg-slate-700/50">Histórico de Cobranças</h3>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left text-slate-300 min-w-[640px]">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                        <tr>
                            <BillSortableHeader label="Cliente" sortKey="customerName" />
                            <BillSortableHeader label="Data" sortKey="settledAt" />
                            <th scope="col" className="px-6 py-3">Equipamento</th>
                            <th scope="col" className="px-6 py-3 text-right">
                                <button className="flex items-center gap-2 ml-auto" onClick={() => handleBillSort('valorTotal')}>
                                    Valor Total
                                    <SortIcon direction={billSortKey === 'valorTotal' ? billSortDir : 'none'} />
                                </button>
                            </th>
                            <th scope="col" className="px-6 py-3 text-center">Método Pgto.</th>
                            <th scope="col" className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedBillings.length > 0 ? sortedBillings.map(billing => (
                            <tr key={billing.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50">
                                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{billing.customerName}</td>
                                <td className="px-6 py-4">{new Date(billing.settledAt).toLocaleDateString('pt-BR')}</td>
                                <td className="px-6 py-4 capitalize">
                                  <EquipmentDisplay equipment={billing.equipment} />
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-emerald-400 font-bold">R$ {billing.valorTotal.toFixed(2)}</td>
                                <td className="px-6 py-4 text-center">
                                    <PaymentMethodDisplay method={billing.paymentMethod} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => setSelectedBilling(billing)}
                                        className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
                                    >
                                      <PrinterIcon className="w-4 h-4" />
                                      <span>Recibo</span>
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                               <td colSpan={6} className="text-center py-16 text-slate-400 italic">Nenhuma cobrança registrada.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        <div className="mt-8 bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
           <h3 className="text-lg font-semibold text-white p-4 bg-slate-700/50">Histórico de Pagamentos de Dívidas</h3>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left text-slate-300 min-w-[640px]">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                        <tr>
                            <DebtSortableHeader label="Cliente" sortKey="customerName" />
                            <DebtSortableHeader label="Data" sortKey="paidAt" />
                            <th scope="col" className="px-6 py-3 text-right">
                                <button className="flex items-center gap-2 ml-auto" onClick={() => handleDebtSort('amountPaid')}>
                                  Valor Pago
                                  <SortIcon direction={debtSortKey === 'amountPaid' ? debtSortDir : 'none'} />
                                </button>
                            </th>
                            <th scope="col" className="px-6 py-3 text-center">Método Pgto.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedDebtPayments.length > 0 ? sortedDebtPayments.map(payment => (
                            <tr key={payment.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50">
                                <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{payment.customerName}</td>
                                <td className="px-6 py-4">{new Date(payment.paidAt).toLocaleDateString('pt-BR')}</td>
                                <td className="px-6 py-4 text-right font-mono text-amber-400 font-bold">R$ {payment.amountPaid.toFixed(2)}</td>
                                <td className="px-6 py-4 text-center">
                                    <PaymentMethodDisplay method={payment.paymentMethod} />
                                </td>
                            </tr>
                        )) : (
                            <tr>
                               <td colSpan={4} className="text-center py-16 text-slate-400 italic">Nenhum pagamento de dívida registrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {selectedBilling && (
        <ReceiptModal 
          isOpen={!!selectedBilling}
          onClose={() => setSelectedBilling(null)}
          billing={selectedBilling}
        />
      )}
    </>
  );
};

export default CobrancasView;