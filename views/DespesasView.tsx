// views/DespesasView.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { Expense } from '../types';
import PageHeader from '../components/PageHeader';
import { PlusIcon } from '../components/icons/PlusIcon';
import { TrashIcon } from '../components/icons/TrashIcon';

interface DespesasViewProps {
  expenses: Expense[];
  onAddExpense: (description: string, amount: number) => void;
  onDeleteExpense: (expenseId: string) => void;
}

type SortKey = 'date' | 'description' | 'amount';
type SortDirection = 'asc' | 'desc';

const DespesasView: React.FC<DespesasViewProps> = ({ expenses, onAddExpense, onDeleteExpense }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount.replace(',', '.'));
    if (description && amountNum > 0) {
      onAddExpense(description, amountNum);
      setDescription('');
      setAmount('');
    }
  }, [description, amount, onAddExpense]);
  
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value.replace(/[^0-9,.]/g, ''));
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
        <p className="font-bold text-slate-900 dark:text-white">{expense.description}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(expense.date).toLocaleDateString('pt-BR')}</p>
      </div>
      <div className="text-right">
        <p className="font-mono font-bold text-red-600 dark:text-red-400 text-lg">R$ {expense.amount.toFixed(2).replace('.', ',')}</p>
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
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-grow w-full"><label htmlFor="description" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Descrição</label><input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500" /></div>
          <div className="w-full sm:w-48"><label htmlFor="amount" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Valor (R$)</label><input type="text" inputMode="decimal" id="amount" value={amount} onChange={handleAmountChange} required className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500" /></div>
          <button type="submit" className="w-full sm:w-auto inline-flex items-center gap-2 bg-lime-500 text-white font-bold py-2 px-4 rounded-md hover:bg-lime-600"><PlusIcon className="w-5 h-5" /><span>Adicionar</span></button>
        </form>
      </div>
      
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {sortedExpenses.length > 0 ? sortedExpenses.map(renderExpenseCard) : <p className="text-center py-10 text-slate-500 dark:text-slate-400">Nenhuma despesa registrada.</p>}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center font-bold text-slate-900 dark:text-white">
            <span className="text-lg">TOTAL DE DESPESAS</span>
            <span className="font-mono text-xl text-red-600 dark:text-red-400">R$ {totalExpenses.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
          <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-700/50"><tr>
              <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('date')}>Data {renderSortArrow('date')}</th>
              <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('description')}>Descrição {renderSortArrow('description')}</th>
              <th scope="col" className="px-6 py-3 text-right cursor-pointer" onClick={() => handleSort('amount')}>Valor {renderSortArrow('amount')}</th>
              <th scope="col" className="px-6 py-3 text-center">Ações</th>
          </tr></thead>
          <tbody>
            {sortedExpenses.length > 0 ? sortedExpenses.map(expense => (
              <tr key={expense.id} className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{expense.description}</td>
                <td className="px-6 py-4 text-right font-mono text-red-600 dark:text-red-400">R$ {expense.amount.toFixed(2).replace('.', ',')}</td>
                <td className="px-6 py-4 text-center"><button onClick={() => onDeleteExpense(expense.id)} className="text-slate-400 hover:text-red-500" title="Excluir Despesa"><TrashIcon className="w-5 h-5" /></button></td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="text-center py-16 text-slate-500 dark:text-slate-400">Nenhuma despesa registrada.</td></tr>
            )}
          </tbody>
          <tfoot className="bg-slate-100 dark:bg-slate-700/50"><tr className="font-bold text-slate-900 dark:text-white">
              <td colSpan={2} className="text-right px-6 py-3 uppercase">Total de Despesas</td>
              <td className="text-right px-6 py-3 font-mono text-lg text-red-600 dark:text-red-400">R$ {totalExpenses.toFixed(2).replace('.', ',')}</td><td></td>
          </tr></tfoot>
        </table></div>
      </div>
    </div>
  );
};

export default DespesasView;