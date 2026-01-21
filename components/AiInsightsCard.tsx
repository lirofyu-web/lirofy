// components/AiInsightsCard.tsx
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Billing, Customer, Expense } from '../types';
import { ChartBarIcon } from './icons/ChartBarIcon';

interface AiInsightsCardProps {
  billings: Billing[];
  expenses: Expense[];
  customers: Customer[];
}

const AiInsightsCard: React.FC<AiInsightsCardProps> = ({ billings, expenses, customers }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState('');
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError('');
    setInsights('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      
      const recentBillings = billings.filter(b => new Date(b.settledAt) >= lastMonth);
      const recentExpenses = expenses.filter(e => new Date(e.date) >= lastMonth);
      
      const totalRevenue = recentBillings.reduce((sum, b) => sum + b.valorTotal, 0);
      const totalExpensesValue = recentExpenses.reduce((sum, e) => sum + e.amount, 0);
      const debtors = customers.filter(c => c.debtAmount > 0);
      const totalDebt = debtors.reduce((sum, c) => sum + c.debtAmount, 0);

      const summary = `
        - Faturamento total nos últimos 30 dias: R$ ${totalRevenue.toFixed(2)}
        - Despesas totais nos últimos 30 dias: R$ ${totalExpensesValue.toFixed(2)}
        - Número de clientes com dívidas: ${debtors.length}
        - Valor total das dívidas: R$ ${totalDebt.toFixed(2)}
        - Equipamentos com maior faturamento: ${getTopPerformingEquipment(recentBillings)}
        - Clientes com maior faturamento: ${getTopPerformingCustomers(recentBillings)}
      `;

      const prompt = `
        Você é um assistente de negócios para uma empresa de locação de mesas de sinuca e jukebox.
        Analise o seguinte resumo de dados dos últimos 30 dias e forneça insights e sugestões em português.
        Seja conciso e direto. Use emojis para destacar os pontos.
        Formate a resposta como uma lista de pontos (markdown).
        
        Dados:
        ${summary}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      if (response.text) {
        setInsights(response.text);
      } else {
        throw new Error('A IA não retornou uma resposta em texto.');
      }

    } catch (err) {
      console.error("Erro ao gerar insights:", err);
      setError('Não foi possível obter a análise. Verifique a chave da API ou tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getTopPerformingEquipment = (billings: Billing[]) => {
    const revenueByEquipment: Record<string, number> = {};
    billings.forEach(b => {
        const key = `${b.equipmentType} ${b.equipmentNumero}`;
        revenueByEquipment[key] = (revenueByEquipment[key] || 0) + b.valorTotal;
    });
    return Object.entries(revenueByEquipment)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, value]) => `${name} (R$ ${value.toFixed(2)})`)
        .join(', ') || 'Nenhum';
  };
  
  const getTopPerformingCustomers = (billings: Billing[]) => {
    const revenueByCustomer: Record<string, number> = {};
    billings.forEach(b => {
        revenueByCustomer[b.customerName] = (revenueByCustomer[b.customerName] || 0) + b.valorTotal;
    });
    return Object.entries(revenueByCustomer)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, value]) => `${name} (R$ ${value.toFixed(2)})`)
        .join(', ') || 'Nenhum';
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-3 flex items-center gap-2">
        <ChartBarIcon className="w-6 h-6 text-indigo-500" />
        Análise com IA
      </h3>
      
      {!insights && !isLoading && !error && (
          <div className="text-center">
              <p className="text-slate-500 dark:text-slate-400 mb-4">Clique para obter insights e sugestões sobre o desempenho do seu negócio nos últimos 30 dias, usando a IA do Google.</p>
              <button onClick={handleAnalyze} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-md hover:bg-indigo-500">
                  Analisar Desempenho
              </button>
          </div>
      )}

      {isLoading && (
        <div className="text-center py-8">
          <svg className="animate-spin h-8 w-8 text-indigo-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p className="text-slate-400 mt-2">Analisando dados...</p>
        </div>
      )}
      
      {error && <p className="text-red-400 text-center">{error}</p>}
      
      {insights && (
          <div className="prose prose-sm prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans bg-transparent p-0">{insights.replace(/\*/g, '•')}</pre>
              <button onClick={handleAnalyze} className="text-sm text-indigo-400 hover:text-indigo-300 mt-4">
                  Analisar novamente
              </button>
          </div>
      )}
    </div>
  );
};

export default AiInsightsCard;