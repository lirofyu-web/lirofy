// views/DashboardView.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { Customer, Billing, Expense, DebtPayment } from '../types';
import PageHeader from '../components/PageHeader';
import { JukeboxIcon } from '../components/icons/JukeboxIcon';
import { BilliardIcon } from '../components/icons/BilliardIcon';
import { CraneIcon } from '../components/icons/CraneIcon';
import { CalculatorIcon } from '../components/icons/CalculatorIcon';

interface DashboardViewProps {
  billings: Billing[];
  expenses: Expense[];
  customers: Customer[];
  debtPayments: DebtPayment[];
}

// --- Sub-components (moved outside for performance and best practices) ---

interface DateFilterProps {
    currentDate: Date;
    onMonthChange: (month: number) => void;
    onYearChange: (year: number) => void;
}
const DateFilter: React.FC<DateFilterProps> = React.memo(({ currentDate, onMonthChange, onYearChange }) => {
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Período de Análise:</h3>
            <select value={currentDate.getMonth()} onChange={(e) => onMonthChange(parseInt(e.target.value))} className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {monthNames.map((month, index) => <option key={month} value={index}>{month}</option>)}
            </select>
            <select value={currentDate.getFullYear()} onChange={(e) => onYearChange(parseInt(e.target.value))} className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
        </div>
    );
});

interface InfoCardProps {
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
}
const InfoCard: React.FC<InfoCardProps> = React.memo(({ title, children, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 h-full">
        <div className="flex items-center gap-3 text-xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">
          {icon}
          <h3>{title}</h3>
        </div>
        <dl className="space-y-3">
            {children}
        </dl>
    </div>
));

interface InfoRowProps {
    label: string;
    value: string;
    valueColor?: string;
}
const InfoRow: React.FC<InfoRowProps> = React.memo(({ label, value, valueColor = 'text-slate-600 dark:text-slate-300' }) => (
    <div className="flex justify-between items-baseline">
        <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
        <dd className={`font-mono font-bold ${valueColor}`}>{value}</dd>
    </div>
));


// --- Main View Component ---

const DashboardView: React.FC<DashboardViewProps> = ({ billings, expenses, customers, debtPayments }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const handleMonthChange = useCallback((month: number) => {
        setCurrentDate(prevDate => new Date(prevDate.getFullYear(), month, 1));
    }, []);

    const handleYearChange = useCallback((year: number) => {
        setCurrentDate(prevDate => new Date(year, prevDate.getMonth(), 1));
    }, []);

    const stats = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const monthlyBillings = billings.filter(b => {
            const date = new Date(b.settledAt);
            return date.getFullYear() === year && date.getMonth() === month;
        });
        
        const monthlyExpenses = expenses.filter(e => {
            const date = new Date(e.date);
            return date.getFullYear() === year && date.getMonth() === month;
        });
        const totalMonthlyExpenses = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

        // Revenue from Tables
        const revenueMesaDinheiro = monthlyBillings.filter(b => b.equipmentType === 'mesa' && b.paymentMethod === 'dinheiro').reduce((sum, b) => sum + b.valorTotal, 0);
        const revenueMesaPix = monthlyBillings.filter(b => b.equipmentType === 'mesa' && b.paymentMethod === 'pix').reduce((sum, b) => sum + b.valorTotal, 0);
        const totalRevenueMesa = revenueMesaDinheiro + revenueMesaPix;

        // Revenue from Jukeboxes
        const revenueJukeboxDinheiro = monthlyBillings.filter(b => b.equipmentType === 'jukebox' && b.paymentMethod === 'dinheiro').reduce((sum, b) => sum + b.valorTotal, 0);
        const revenueJukeboxPix = monthlyBillings.filter(b => b.equipmentType === 'jukebox' && b.paymentMethod === 'pix').reduce((sum, b) => sum + b.valorTotal, 0);
        const totalRevenueJukebox = revenueJukeboxDinheiro + revenueJukeboxPix;

        // Revenue from Cranes
        const revenueGruaDinheiro = monthlyBillings.filter(b => b.equipmentType === 'grua').reduce((sum, b) => sum + (b.recebimentoEspecie || 0), 0);
        const revenueGruaPix = monthlyBillings.filter(b => b.equipmentType === 'grua').reduce((sum, b) => sum + (b.recebimentoPix || 0), 0);
        const totalRevenueGrua = revenueGruaDinheiro + revenueGruaPix;
        
        return {
            revenueMesaDinheiro,
            revenueMesaPix,
            totalRevenueMesa,
            revenueJukeboxDinheiro,
            revenueJukeboxPix,
            totalRevenueJukebox,
            revenueGruaDinheiro,
            revenueGruaPix,
            totalRevenueGrua,
            totalMonthlyExpenses
        };
    }, [billings, expenses, currentDate]);
    
    return (
        <div className="space-y-8">
            <PageHeader 
                title="INÍCIO"
                subtitle="Visão geral e desempenho do seu negócio."
            />
            
            <DateFilter 
                currentDate={currentDate}
                onMonthChange={handleMonthChange}
                onYearChange={handleYearChange}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
                 <InfoCard title="Caixa (Mesas)" icon={<BilliardIcon className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />}>
                    <InfoRow label="Receita em Dinheiro" value={`R$ ${stats.revenueMesaDinheiro.toFixed(2)}`} valueColor="text-sky-600 dark:text-sky-400" />
                    <InfoRow label="Receita PIX/Crédito" value={`R$ ${stats.revenueMesaPix.toFixed(2)}`} valueColor="text-emerald-600 dark:text-emerald-400" />
                    <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-700/50">
                        <InfoRow label="Total Recebido" value={`R$ ${stats.totalRevenueMesa.toFixed(2)}`} valueColor="text-amber-600 dark:text-amber-400 text-lg" />
                    </div>
                </InfoCard>

                <InfoCard title="Caixa (Jukebox)" icon={<JukeboxIcon className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />}>
                    <InfoRow label="Receita em Dinheiro" value={`R$ ${stats.revenueJukeboxDinheiro.toFixed(2)}`} valueColor="text-sky-600 dark:text-sky-400" />
                    <InfoRow label="Receita PIX/Crédito" value={`R$ ${stats.revenueJukeboxPix.toFixed(2)}`} valueColor="text-emerald-600 dark:text-emerald-400" />
                    <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-700/50">
                        <InfoRow label="Total Recebido" value={`R$ ${stats.totalRevenueJukebox.toFixed(2)}`} valueColor="text-amber-600 dark:text-amber-400 text-lg" />
                    </div>
                </InfoCard>
                
                 <InfoCard title="Caixa (Gruas)" icon={<CraneIcon className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />}>
                    <InfoRow label="Receita em Dinheiro" value={`R$ ${stats.revenueGruaDinheiro.toFixed(2)}`} valueColor="text-sky-600 dark:text-sky-400" />
                    <InfoRow label="Receita PIX/Crédito" value={`R$ ${stats.revenueGruaPix.toFixed(2)}`} valueColor="text-emerald-600 dark:text-emerald-400" />
                    <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-700/50">
                        <InfoRow label="Total Recebido" value={`R$ ${stats.totalRevenueGrua.toFixed(2)}`} valueColor="text-amber-600 dark:text-amber-400 text-lg" />
                    </div>
                </InfoCard>

                 <InfoCard title="Despesas do Mês" icon={<CalculatorIcon className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />}>
                    <InfoRow label="Total Gasto no Mês" value={`R$ ${stats.totalMonthlyExpenses.toFixed(2)}`} valueColor="text-red-600 dark:text-red-400 text-lg" />
                </InfoCard>
            </div>
        </div>
    );
};

export default DashboardView;