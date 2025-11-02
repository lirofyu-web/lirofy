import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import PageHeader from '../components/PageHeader';
import { PlusIcon } from '../components/icons/PlusIcon';

interface DespesasViewProps {
  expenses: Expense[];
  onAddExpense: (expenseData: Omit<Expense, 'id'>) => void;
}

const SortIcon = ({ direction }: { direction: 'asc' | 'desc' | 'none' }) => {
    if (direction === 'none') return <span className="text-slate-500">↕</span>;
    return direction === 'asc' ? <span className="text-white">↑</span> : <span className="text-white">↓</span>;
};


const DespesasView: React.FC<DespesasViewProps> = ({ expenses, onAddExpense }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Sorting state
  const [sortKey, setSortKey] = useState<'description' | 'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      
      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return sortDir === 'desc' ? -comparison : comparison;
    });
  }, [expenses, sortKey, sortDir]);

  const handleSort = (key: 'description' | 'date' | 'amount') => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'date' ? 'desc' : 'asc');
    }
  };

  const SortableHeader = ({ label, sortKey }: { label: string, sortKey: 'description' | 'date' | 'amount' }) => (
    <th scope="col" className="px-6 py-3">
        <button className="flex items-center gap-2" onClick={() => handleSort(sortKey)}>
            {label}
            <SortIcon direction={sortKey === sortKey ? sortDir : 'none'} />
        </button>
    </th>
  );


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description && amount) {
      onAddExpense({
        description,
        amount: parseFloat(amount),
        date: new Date(date + 'T00:00:00') // Avoid timezone issues
      });
      setDescription('');
      setAmount('');
    }
  };

  return (
    <div>
      <PageHeader 
        title="Controle de Despesas"
        subtitle="Registre seus custos e mantenha as finanças em dia."
      />
      
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Adicionar Nova Despesa</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">Descrição</label>
            <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-1">Valor (R$)</label>
            <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required step="0.01" className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-1">Data</label>
            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="md:col-span-3 text-right">
            <button type="submit" className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-500">
                <PlusIcon className="w-5 h-5" />
                <span>Adicionar Despesa</span>
            </button>
          </div>
        </form>
      </div>

      <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
         <table className="w-full text-sm text-left text-slate-300 min-w-[640px]">
                <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                    <tr>
                        <SortableHeader label="Descrição" sortKey="description" />
                        <SortableHeader label="Data" sortKey="date" />
                        <th scope="col" className="px-6 py-3 text-right">
                           <button className="flex items-center gap-2 ml-auto" onClick={() => handleSort('amount')}>
                                Valor
                                <SortIcon direction={sortKey === 'amount' ? sortDir : 'none'} />
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedExpenses.length > 0 ? sortedExpenses.map(expense => (
                        <tr key={expense.id} className="border-b border-slate-700 hover:bg-slate-700/50 even:bg-slate-800/50">
                            <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{expense.description}</td>
                            <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString('pt-BR')}</td>
                            <td className="px-6 py-4 text-right font-mono text-red-400 font-bold">R$ {expense.amount.toFixed(2)}</td>
                        </tr>
                    )) : (
                        <tr>
                           <td colSpan={3} className="text-center py-16 text-slate-400 italic">Nenhuma despesa registrada.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default DespesasView;