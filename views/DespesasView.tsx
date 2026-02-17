// views/DespesasView.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { Expense } from '../types';
import PageHeader from '../components/PageHeader';
import { PlusIcon } from '../components/icons/PlusIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { BilliardIcon } from '../components/icons/BilliardIcon';
import { JukeboxIcon } from '../components/icons/JukeboxIcon';
import { CraneIcon } from '../components/icons/CraneIcon';
import { CalculatorIcon } from '../components/icons/CalculatorIcon';
import { safeParseFloat } from '../utils';

interface DespesasViewProps {
  expenses: Expense[];
  onAddExpense: (description: string, amount: number, category: Expense['category']) => void;
  onDeleteExpense: (expenseId: string) => void;
  areValuesHidden: boolean;
}

type SortKey = 'date' | 'description' | 'amount' | 'category';
type SortDirection = 'asc' | 'desc';

const CategoryDisplay: React.FC<{ category?: Expense['category'] }> = React.memo(({ category = 'geral' }) => {
    const info = {
        mesa: { icon: BilliardIcon, text: 'Mesa', color: 'cyan' },
        jukebox: { icon: JukeboxIcon, text: 'Jukebox', color: 'fuchsia' },
        grua: { icon: CraneIcon, text: 'Grua', color: 'orange' },
        geral: { icon: CalculatorIcon, text: 'Geral', color: 'slate' }
    }[category];

    const Icon = info.icon;
    const colorClasses = {
        cyan: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-600',
        fuchsia: 'bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-800 dark:text-fuchsia-300 border-fuchsia-300 dark:border-fuchsia-600',
        orange: 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-600',
        slate: 'bg-slate-100 dark:bg-slate-600/50 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-500',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${colorClasses[info.color]}`}>
            <Icon className="w-3.5 h-3.5" />
            <span>{info.text}</span>
        </span>
    );
});

const DespesasView: React.FC<DespesasViewProps> = ({ expenses, onAddExpense, onDeleteExpense, areValuesHidden }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('geral');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = safeParseFloat(amount);
    if (description && amountNum > 0) {
      onAddExpense(description, amountNum, category);
      setDescription('');
      setAmount('');
      setCategory('geral');
    }
  }, [description, amount, category, onAddExpense]);
  
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  }, []);

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      let compareA: any;
      let compareB: any;

      if (sortKey === 'date') {
        compareA = new Date(a.date).getTime();
        compareB = new Date(b.date).getTime();
      } else {
        compareA = a[sortKey];
        compareB = b[sortKey];
      }

      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [expenses, sortKey, sortDirection]);
  
  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  }, [sortKey]);

  const totalExpenses = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]);
  
  const renderSortArrow = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDirection === 'asc' ? '▲' : '▼';
  };

  const renderExpenseCard = (expense: Expense) => (
    <div key={expense.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
      <div>
        <div className="mb-2"><CategoryDisplay category={expense.category} /></div>
        <p className="font-bold text-slate-900 dark:text-white break-words">{expense.description}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(expense.date).toLocaleDateString('pt-BR')}</p>
      </div>
      <div className="text-right">
        <p className="font-mono font-bold text-red-600 dark:text-red-400 text-lg">
            {areValuesHidden ? 'R$ •••,••' : `R$ ${expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </p>
        <button onClick={() => onDeleteExpense(expense.id)} className="text-slate-400 hover:text-red-500 dark:text-slate-500 mt-1" title="Excluir Despesa">
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title="Controle de Despesas" subtitle="Adicione e gerencie as despesas do seu negócio." />

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 mb-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2"><label htmlFor="description" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Descrição</label><input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500" /></div>
          <div><label htmlFor="amount" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Valor (R$)</label><input type="text" inputMode="decimal" id="amount" value={amount} onChange={handleAmountChange} required className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500" /></div>
          <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Categoria</label>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value as Expense['category'])} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500">
                  <option value="geral">Geral</option>
                  <option value="mesa">Mesa de Sinuca</option>
                  <option value="jukebox">Jukebox</option>
                  <option value="grua">Grua de Pelúcia</option>
              </select>
          </div>
          <button type="submit" className="md:col-start-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-lime-500 text-white font-bold py-2 px-4 rounded-md hover:bg-lime-600"><PlusIcon className="w-5 h-5" /><span>Adicionar</span></button>
        </form>
      </div>
      
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {sortedExpenses.length > 0 ? sortedExpenses.map(renderExpenseCard) : <p className="text-center py-10 text-slate-500 dark:text-slate-400">Nenhuma despesa registrada.</p>}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-baseline gap-x-4 font-bold text-slate-900 dark:text-white">
            <span className="text-lg">TOTAL DE DESPESAS</span>
            <span className="font-mono text-xl text-red-600 dark:text-red-400">
                {areValuesHidden ? 'R$ •••,••' : `R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-700/50"><tr>
              <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('date')}>Data {renderSortArrow('date')}</th>
              <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('description')}>Descrição {renderSortArrow('description')}</th>
              <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('category')}>Categoria {renderSortArrow('category')}</th>
              <th scope="col" className="px-6 py-3 text-right cursor-pointer" onClick={() => handleSort('amount')}>Valor {renderSortArrow('amount')}</th>
              <th scope="col" className="px-6 py-3 text-center">Ações</th>
          </tr></thead>
          <tbody>
            {sortedExpenses.length > 0 ? sortedExpenses.map(expense => (
              <tr key={expense.id} className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white break-words">{expense.description}</td>
                <td className="px-6 py-4"><CategoryDisplay category={expense.category} /></td>
                <td className="px-6 py-4 text-right font-mono text-red-600 dark:text-red-400">
                    {areValuesHidden ? 'R$ •••,••' : `R$ ${expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </td>
                <td className="px-6 py-4 text-center"><button onClick={() => onDeleteExpense(expense.id)} className="text-slate-400 hover:text-red-500" title="Excluir Despesa"><TrashIcon className="w-5 h-5" /></button></td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="text-center py-16 text-slate-500 dark:text-slate-400">Nenhuma despesa registrada.</td></tr>
            )}
          </tbody>
          <tfoot className="bg-slate-100 dark:bg-slate-700/50"><tr className="font-bold text-slate-900 dark:text-white">
              <td colSpan={3} className="text-right px-6 py-3 uppercase">Total de Despesas</td>
              <td className="text-right px-6 py-3 font-mono text-lg text-red-600 dark:text-red-400">
                {areValuesHidden ? 'R$ •••,••' : `R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </td><td></td>
          </tr></tfoot>
        </table></div>
      </div>
    </div>
  );
};

export default DespesasView;