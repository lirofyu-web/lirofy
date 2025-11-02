// Fix: Implement the DespesasView component.
import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import PageHeader from '../components/PageHeader';
import { PlusIcon } from '../components/icons/PlusIcon';
import { TrashIcon } from '../components/icons/TrashIcon';

interface DespesasViewProps {
  expenses: Expense[];
  onAddExpense: (description: string, amount: number) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const DespesasView: React.FC<DespesasViewProps> = ({ expenses, onAddExpense, onDeleteExpense }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount.replace(',', '.'));
    if (description && amountNum > 0) {
      onAddExpense(description, amountNum);
      setDescription('');
      setAmount('');
    }
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const sanitizedValue = value.replace(/[^0-9,]/g, '').replace(/,(?=.*,)/g, '');
    setAmount(sanitizedValue);
  };

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  return (
    <div>
      <PageHeader
        title="Controle de Despesas"
        subtitle="Adicione e gerencie as despesas do seu negócio."
      />

      <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-grow w-full">
            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">Descrição da Despesa</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="w-full sm:w-48">
            <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-1">Valor (R$)</label>
            <input
              type="text"
              id="amount"
              value={amount}
              onChange={handleAmountChange}
              inputMode="decimal"
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button type="submit" className="w-full sm:w-auto inline-flex items-center gap-2 bg-emerald-600 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-500 transition-colors">
            <PlusIcon className="w-5 h-5" />
            <span>Adicionar</span>
          </button>
        </form>
      </div>
      
      <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
              <tr>
                <th scope="col" className="px-6 py-3">Data</th>
                <th scope="col" className="px-6 py-3">Descrição</th>
                <th scope="col" className="px-6 py-3 text-right">Valor</th>
                <th scope="col" className="px-6 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length > 0 ? expenses.map(expense => (
                <tr key={expense.id} className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{expense.description}</td>
                  <td className="px-6 py-4 text-right font-mono text-red-400">R$ {expense.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => onDeleteExpense(expense.id)} className="text-slate-400 hover:text-red-500" title="Excluir Despesa">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-slate-400 italic">Nenhuma despesa registrada.</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-700/50">
                <tr className="font-bold text-white">
                    <td colSpan={2} className="text-right px-6 py-3 uppercase">Total de Despesas</td>
                    <td className="text-right px-6 py-3 font-mono text-lg text-red-400">R$ {totalExpenses.toFixed(2)}</td>
                    <td></td>
                </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DespesasView;
