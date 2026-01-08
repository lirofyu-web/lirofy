// views/DashboardView.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { Customer, Billing, Expense, DebtPayment, Warning } from '../types';
import PageHeader from '../components/PageHeader';
import { JukeboxIcon } from '../components/icons/JukeboxIcon';
import { BilliardIcon } from '../components/icons/BilliardIcon';
import { CraneIcon } from '../components/icons/CraneIcon';
import WarningsManager from '../components/WarningsManager';
import DebtReminders from '../components/DebtReminders';
import { ChartBarIcon } from '../components/icons/ChartBarIcon';
import { CreditCardIcon } from '../components/icons/CreditCardIcon';
import WarningsReminders from '../components/WarningsReminders';
import BackupReminder from '../components/BackupReminder';


interface DashboardViewProps {
  billings: Billing[];
  expenses: Expense[];
  customers: Customer[];
  debtPayments: DebtPayment[];
  warnings: Warning[];
  onAddWarning: (customerId: string, message: string) => void;
  onResolveWarning: (warningId: string) => void;
  onDeleteWarning: (warningId: string) => void;
  lastBackupDate: string | null;
  onNavigateToSettings: () => void;
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
            <select value={currentDate.getMonth()} onChange={(e) => onMonthChange(parseInt(e.target.value))} className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500">
                {monthNames.map((month, index) => <option key={month} value={index}>{month}</option>)}
            </select>
            <select value={currentDate.getFullYear()} onChange={(e) => onYearChange(parseInt(e.target.value))} className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500">
                {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
        </div>
    );
});

interface InfoCardProps {
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
}
const InfoCard: React.FC<InfoCardProps> = React.memo(({ title, children, icon, className }) => (
    <div className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 h-full ${className}`}>
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
    className?: string;
}
const InfoRow: React.FC<InfoRowProps> = React.memo(({ label, value, valueColor = 'text-slate-600 dark:text-slate-300', className }) => (
    <div className={`flex justify-between items-baseline ${className}`}>
        <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
        <dd className={`font-mono font-bold ${valueColor}`}>{value}</dd>
    </div>
));


// --- Main View Component ---

const DashboardView: React.FC<DashboardViewProps> = ({ billings, expenses, customers, debtPayments, warnings, onAddWarning, onResolveWarning, onDeleteWarning, lastBackupDate, onNavigateToSettings }) => {
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

        const monthlyDebtPayments = debtPayments.filter(p => {
            const date = new Date(p.paidAt);
            return date.getFullYear() === year && date.getMonth() === month;
        });
        
        // Expenses by category
        const expensesMesa = monthlyExpenses.filter(e => e.category === 'mesa').reduce((sum, e) => sum + e.amount, 0);
        const expensesJukebox = monthlyExpenses.filter(e => e.category === 'jukebox').reduce((sum, e) => sum + e.amount, 0);
        const expensesGrua = monthlyExpenses.filter(e => e.category === 'grua').reduce((sum, e) => sum + e.amount, 0);
        const expensesGeral = monthlyExpenses.filter(e => e.category === 'geral').reduce((sum, e) => sum + e.amount, 0);
        const totalMonthlyExpenses = expensesMesa + expensesJukebox + expensesGrua + expensesGeral;

        // Revenue from Tables
        const totalRevenueMesa = monthlyBillings.filter(b => b.equipmentType === 'mesa').reduce((sum, b) => sum + (b.valorPagoDinheiro || 0) + (b.valorPagoPix || 0), 0);

        // Revenue from Jukeboxes
        const totalRevenueJukebox = monthlyBillings.filter(b => b.equipmentType === 'jukebox').reduce((sum, b) => sum + (b.valorPagoDinheiro || 0) + (b.valorPagoPix || 0), 0);

        // Revenue from Cranes (company's part)
        const totalRevenueGrua = monthlyBillings.filter(b => b.equipmentType === 'grua').reduce((sum, b) => sum + (b.valorTotal || 0), 0);
        
        // Revenue from Debt Payments
        const totalDebtPayments = monthlyDebtPayments.reduce((sum, p) => sum + p.amountPaid, 0);

        // Total Revenue for the period
        const totalRevenue = totalRevenueMesa + totalRevenueJukebox + totalRevenueGrua + totalDebtPayments;

        // Net Income
        const netIncome = totalRevenue - totalMonthlyExpenses;
        
        // Total outstanding debt (from all customers, not period-specific)
        const totalOutstandingDebt = customers.reduce((sum, c) => sum + (c.debtAmount || 0), 0);
        
        return {
            totalRevenueMesa,
            expensesMesa,
            balanceMesa: totalRevenueMesa - expensesMesa,
            totalRevenueJukebox,
            expensesJukebox,
            balanceJukebox: totalRevenueJukebox - expensesJukebox,
            totalRevenueGrua,
            expensesGrua,
            balanceGrua: totalRevenueGrua - expensesGrua,
            totalRevenue,
            totalMonthlyExpenses,
            netIncome,
            totalOutstandingDebt,
            totalDebtPayments
        };
    }, [billings, expenses, debtPayments, customers, currentDate]);
    
    return (
        <div className="space-y-8">
            <PageHeader 
                title="INÍCIO"
                subtitle="Visão geral e desempenho do seu negócio."
            />

            <div className="space-y-8">
                <BackupReminder lastBackupDate={lastBackupDate} onNavigate={onNavigateToSettings} />
                <DebtReminders customers={customers} />
                <WarningsReminders warnings={warnings} />
            </div>
            
            <DateFilter 
                currentDate={currentDate}
                onMonthChange={handleMonthChange}
                onYearChange={handleYearChange}
            />

            <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
                 <InfoCard title="Resumo do Período" icon={<ChartBarIcon className="w-6 h-6 text-indigo-500" />} className="lg:col-span-4">
                    <InfoRow label="Faturamento Total" value={`R$ ${stats.totalRevenue.toFixed(2)}`} valueColor="text-lime-600 dark:text-lime-400" />
                    <InfoRow label="Dívidas Recebidas (Incluso)" value={`R$ ${stats.totalDebtPayments.toFixed(2)}`} valueColor="text-sm text-slate-500 dark:text-slate-400" />
                    <InfoRow label="Despesas Totais" value={`R$ ${stats.totalMonthlyExpenses.toFixed(2)}`} valueColor="text-red-600 dark:text-red-400" />
                    <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-700/50">
                        <InfoRow 
                           label="SALDO LÍQUIDO" 
                           value={`R$ ${stats.netIncome.toFixed(2)}`}
                           valueColor={stats.netIncome >= 0 ? 'text-green-500 dark:text-green-400 text-lg' : 'text-red-500 dark:text-red-400 text-lg'}
                           className="text-lg"
                        />
                    </div>
                </InfoCard>

                <InfoCard title="Contas a Receber" icon={<CreditCardIcon className="w-6 h-6 text-amber-500" />} className="lg:col-span-2">
                    <InfoRow 
                        label="Total em Dívidas (Fiado)"
                        value={`R$ ${stats.totalOutstandingDebt.toFixed(2)}`} 
                        valueColor="text-amber-600 dark:text-amber-400 text-2xl"
                        className="flex-col !items-start"
                    />
                </InfoCard>

                 <InfoCard title="Mesas" icon={<BilliardIcon className="w-6 h-6 text-cyan-500" />} className="lg:col-span-2">
                    <InfoRow label="Faturamento" value={`R$ ${stats.totalRevenueMesa.toFixed(2)}`} valueColor="text-lime-600 dark:text-lime-400" />
                    <InfoRow label="Despesas" value={`R$ ${stats.expensesMesa.toFixed(2)}`} valueColor="text-red-600 dark:text-red-400" />
                    <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-700/50">
                        <InfoRow 
                           label="Saldo" 
                           value={`R$ ${stats.balanceMesa.toFixed(2)}`}
                           valueColor={stats.balanceMesa >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}
                        />
                    </div>
                </InfoCard>

                <InfoCard title="Jukebox" icon={<JukeboxIcon className="w-6 h-6 text-fuchsia-500" />} className="lg:col-span-2">
                     <InfoRow label="Faturamento" value={`R$ ${stats.totalRevenueJukebox.toFixed(2)}`} valueColor="text-lime-600 dark:text-lime-400" />
                    <InfoRow label="Despesas" value={`R$ ${stats.expensesJukebox.toFixed(2)}`} valueColor="text-red-600 dark:text-red-400" />
                    <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-700/50">
                        <InfoRow 
                           label="Saldo" 
                           value={`R$ ${stats.balanceJukebox.toFixed(2)}`}
                           valueColor={stats.balanceJukebox >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}
                        />
                    </div>
                </InfoCard>
                
                 <InfoCard title="Gruas" icon={<CraneIcon className="w-6 h-6 text-orange-500" />} className="lg:col-span-2">
                    <InfoRow label="Faturamento (Firma)" value={`R$ ${stats.totalRevenueGrua.toFixed(2)}`} valueColor="text-lime-600 dark:text-lime-400" />
                    <InfoRow label="Despesas" value={`R$ ${stats.expensesGrua.toFixed(2)}`} valueColor="text-red-600 dark:text-red-400" />
                    <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-700/50">
                        <InfoRow 
                           label="Saldo" 
                           value={`R$ ${stats.balanceGrua.toFixed(2)}`}
                           valueColor={stats.balanceGrua >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}
                        />
                    </div>
                </InfoCard>
            </div>
             <div className="mt-8">
                <WarningsManager 
                    customers={customers}
                    warnings={warnings}
                    onAddWarning={onAddWarning}
                    onResolveWarning={onResolveWarning}
                    onDeleteWarning={onDeleteWarning}
                />
            </div>
        </div>
    );
};

export default DashboardView;
