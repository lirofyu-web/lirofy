// components/PerformanceChart.tsx
import React, { useMemo } from 'react';
import { Billing, Expense } from '../types';

interface PerformanceChartProps {
  billings: Billing[];
  expenses: Expense[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ billings, expenses }) => {
  const chartData = useMemo(() => {
    const months: { name: string; revenue: number; expense: number }[] = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
      months.push({ name: monthName.charAt(0).toUpperCase() + monthName.slice(1), revenue: 0, expense: 0 });
    }

    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    billings.forEach(billing => {
      const billingDate = new Date(billing.settledAt);
      if (billingDate >= sixMonthsAgo) {
        const monthDiff = (today.getFullYear() - billingDate.getFullYear()) * 12 + (today.getMonth() - billingDate.getMonth());
        const monthIndex = 5 - monthDiff;
        if (monthIndex >= 0 && monthIndex < 6) {
          months[monthIndex].revenue += billing.valorTotal - (billing.valorDebitoNegativo || 0) - (billing.valorBonus || 0);
        }
      }
    });

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      if (expenseDate >= sixMonthsAgo) {
        const monthDiff = (today.getFullYear() - expenseDate.getFullYear()) * 12 + (today.getMonth() - expenseDate.getMonth());
        const monthIndex = 5 - monthDiff;
        if (monthIndex >= 0 && monthIndex < 6) {
          months[monthIndex].expense += expense.amount;
        }
      }
    });

    return months;
  }, [billings, expenses]);

  const maxVal = Math.max(...chartData.map(d => d.revenue), ...chartData.map(d => d.expense));
  const yAxisMax = maxVal > 0 ? Math.ceil(maxVal / 1000) * 1000 : 1000;
  const yAxisLabels = [0, yAxisMax / 2, yAxisMax];

  const width = 500;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };

  const toPath = (data: number[]) => {
    return data.map((val, i) => {
        const x = padding.left + (i * (width - padding.left - padding.right) / 5);
        const y = height - padding.bottom - ((val / yAxisMax) * (height - padding.top - padding.bottom));
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
  };

  return (
    <div className="bg-slate-700/50 p-4 rounded-lg">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-xs text-slate-400">
        {/* Y-axis labels and grid lines */}
        {yAxisLabels.map((label, i) => (
          <g key={i}>
            <text x={padding.left - 8} y={height - padding.bottom - (i * (height - padding.top - padding.bottom) / 2)} textAnchor="end" alignmentBaseline="middle">
              {`R$${(label / 1000)}k`}
            </text>
            <line
              x1={padding.left} y1={height - padding.bottom - (i * (height - padding.top - padding.bottom) / 2)}
              x2={width - padding.right} y2={height - padding.bottom - (i * (height - padding.top - padding.bottom) / 2)}
              stroke="currentColor" strokeOpacity="0.2" strokeDasharray="2,2"
            />
          </g>
        ))}

        {/* X-axis labels */}
        {chartData.map((d, i) => (
          <text key={i} x={padding.left + (i * (width - padding.left - padding.right) / 5)} y={height - padding.bottom + 15} textAnchor="middle">
            {d.name}
          </text>
        ))}

        {/* Revenue line */}
        <path d={toPath(chartData.map(d => d.revenue))} fill="none" stroke="#4ade80" strokeWidth="2" />
        {chartData.map((d, i) => (
          <circle key={`rev-${i}`} cx={padding.left + (i * (width - padding.left - padding.right) / 5)} cy={height - padding.bottom - (d.revenue / yAxisMax * (height - padding.top - padding.bottom))} r="3" fill="#4ade80" />
        ))}
        
        {/* Expense line */}
        <path d={toPath(chartData.map(d => d.expense))} fill="none" stroke="#f87171" strokeWidth="2" />
        {chartData.map((d, i) => (
          <circle key={`exp-${i}`} cx={padding.left + (i * (width - padding.left - padding.right) / 5)} cy={height - padding.bottom - (d.expense / yAxisMax * (height - padding.top - padding.bottom))} r="3" fill="#f87171" />
        ))}
      </svg>
      <div className="flex justify-center gap-4 mt-2 text-sm">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-slate-300">Faturamento</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-slate-300">Despesas</span></div>
      </div>
    </div>
  );
};

export default PerformanceChart;
