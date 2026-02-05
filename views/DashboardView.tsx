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
import { CalculatorIcon } from '../components/icons/CalculatorIcon';
import { CurrencyDollarIcon } from '../components/icons/CurrencyDollarIcon';


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
  areValuesHidden: boolean;
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

type ChartView = 'total' | 'average';
type CategoryData = {
    label: string;
    faturamentoTotal: number;
    saldo: number;
    despesas: number;
    quantidade: number;
    color: string;
    icon: React.FC<{className?: string}>;
    receitaDinheiro: number;
    receitaPix: number;
};

const FinancialPerformanceCard: React.FC<{ 
    stats: any, // Using 'any' for brevity, but should be a specific stats type
    chartView: ChartView, 
    onChartViewChange: (view: ChartView) => void,
    areValuesHidden: boolean;
}> = React.memo(({ stats, chartView, onChartViewChange, areValuesHidden }) => {
    
    const chartData: CategoryData[] = useMemo(() => [
        { 
            label: 'Mesas',
            faturamentoTotal: chartView === 'total' ? stats.totalRevenueMesa : stats.averageRevenueMesa,
            saldo: chartView === 'total' ? stats.balanceMesa : stats.averageProfitMesa,
            despesas: chartView === 'total' ? stats.expensesMesa : (stats.mesaCount > 0 ? stats.expensesMesa / stats.mesaCount : 0),
            receitaDinheiro: chartView === 'total' ? stats.revenueMesaDinheiro : (stats.mesaCount > 0 ? stats.revenueMesaDinheiro / stats.mesaCount : 0),
            receitaPix: chartView === 'total' ? stats.revenueMesaPix : (stats.mesaCount > 0 ? stats.revenueMesaPix / stats.mesaCount : 0),
            quantidade: stats.mesaCount,
            color: 'cyan', 
            icon: BilliardIcon
        },
        { 
            label: 'Jukeboxes',
            faturamentoTotal: chartView === 'total' ? stats.totalRevenueJukebox : stats.averageRevenueJukebox,
            saldo: chartView === 'total' ? stats.balanceJukebox : stats.averageProfitJukebox,
            despesas: chartView === 'total' ? stats.expensesJukebox : (stats.jukeboxCount > 0 ? stats.expensesJukebox / stats.jukeboxCount : 0),
            receitaDinheiro: chartView === 'total' ? stats.revenueJukeboxDinheiro : (stats.jukeboxCount > 0 ? stats.revenueJukeboxDinheiro / stats.jukeboxCount : 0),
            receitaPix: chartView === 'total' ? stats.revenueJukeboxPix : (stats.jukeboxCount > 0 ? stats.revenueJukeboxPix / stats.jukeboxCount : 0),
            quantidade: stats.jukeboxCount,
            color: 'fuchsia', 
            icon: JukeboxIcon
        },
        { 
            label: 'Gruas',
            faturamentoTotal: chartView === 'total' ? stats.totalRevenueGrua : stats.averageRevenueGrua,
            saldo: chartView === 'total' ? stats.balanceGrua : stats.averageProfitGrua,
            despesas: chartView === 'total' ? stats.expensesGrua : (stats.gruaCount > 0 ? stats.expensesGrua / stats.gruaCount : 0),
            receitaDinheiro: chartView === 'total' ? stats.revenueGruaEspecie : (stats.gruaCount > 0 ? stats.revenueGruaEspecie / stats.gruaCount : 0),
            receitaPix: chartView === 'total' ? stats.revenueGruaPix : (stats.gruaCount > 0 ? stats.revenueGruaPix / stats.gruaCount : 0),
            quantidade: stats.gruaCount,
            color: 'orange', 
            icon: CraneIcon
        },
    ], [stats, chartView]);

    const maxValue = useMemo(() => {
        const values = chartData.map(d => d.faturamentoTotal);
        const max = Math.max(...values);
        return max > 0 ? max : 1;
    }, [chartData]);
    
    const bestPerformerLabel = useMemo(() => {
        if (chartData.every(d => d.saldo <= 0)) return null;
        return chartData.reduce((best, current) => current.saldo > best.saldo ? current : best).label;
    }, [chartData]);

    const colorClasses = {
        cyan: { revenue: 'bg-cyan-500/30', profit: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500' },
        fuchsia: { revenue: 'bg-fuchsia-500/30', profit: 'bg-fuchsia-500', text: 'text-fuchsia-400', border: 'border-fuchsia-500' },
        orange: { revenue: 'bg-orange-500/30', profit: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500' },
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 lg:col-span-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/80">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <ChartBarIcon className="w-6 h-6 text-indigo-500" />
                        Desempenho Financeiro por Categoria
                    </h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400">Análise de Faturamento Bruto vs. Saldo Líquido (Lucro).</p>
                </div>
                 <div className="flex-shrink-0 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                    <button onClick={() => onChartViewChange('total')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${chartView === 'total' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow' : 'text-slate-500 dark:text-slate-400'}`}>Total</button>
                    <button onClick={() => onChartViewChange('average')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${chartView === 'average' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow' : 'text-slate-500 dark:text-slate-400'}`}>Média/Unid.</button>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex justify-around items-end h-48 pt-4">
                {chartData.map(item => {
                    const revenueHeight = areValuesHidden ? '50%' : `${(item.faturamentoTotal / maxValue) * 100}%`;
                    const profitHeight = areValuesHidden ? '50%' : item.faturamentoTotal > 0 ? `${(item.saldo / item.faturamentoTotal) * 100}%` : '0%';
                    const colors = colorClasses[item.color as keyof typeof colorClasses];
                    
                    return (
                        <div key={item.label} className="flex flex-col items-center w-1/4 h-full text-center">
                            <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                                {areValuesHidden ? 'R$ •••,••' : `R$ ${(chartView === 'total' ? item.saldo : item.saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </div>
                            <div 
                                className={`w-12 md:w-16 rounded-t-md ${colors.revenue} relative transition-all duration-700 ease-out`} 
                                style={{ height: revenueHeight }}
                                title={areValuesHidden ? 'Valor Oculto' : `Faturamento: R$ ${item.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            >
                                <div 
                                    className={`absolute bottom-0 left-0 right-0 rounded-t-md ${colors.profit}`} 
                                    style={{ height: profitHeight }}
                                    title={areValuesHidden ? 'Valor Oculto' : `Saldo: R$ ${item.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Details Area */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                {chartData.map(item => {
                    const colors = colorClasses[item.color as keyof typeof colorClasses];
                    const isBest = item.label === bestPerformerLabel;
                    return (
                        <div key={item.label} className={`p-4 rounded-lg transition-all duration-300 ${isBest && !areValuesHidden ? 'bg-amber-50 dark:bg-amber-900/30 ring-2 ring-amber-400 shadow-lg shadow-amber-500/20' : 'bg-slate-50 dark:bg-slate-900/50'}`}>
                            <div className="flex justify-between items-start">
                                <h4 className={`font-bold flex items-center gap-2 ${colors.text}`}>
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </h4>
                                {isBest && !areValuesHidden && <span className="text-xs font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full">Destaque</span>}
                            </div>
                            <div className="mt-2 text-xs space-y-1 font-mono">
                               <InfoRow label="Receita (Dinheiro):" value={areValuesHidden ? 'R$ •••,••' : `R$ ${item.receitaDinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-sky-600 dark:text-sky-400" />
                               <InfoRow label="Receita (PIX):" value={areValuesHidden ? 'R$ •••,••' : `R$ ${item.receitaPix.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-lime-600 dark:text-lime-400" />
                               <InfoRow label="Despesas:" value={areValuesHidden ? 'R$ •••,••' : `- R$ ${item.despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-red-600 dark:text-red-400" />
                               <InfoRow label="Saldo Líquido:" value={areValuesHidden ? 'R$ •••,••' : `R$ ${item.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor={item.saldo >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'} />
                               <InfoRow label="Quantidade:" value={`${item.quantidade} unid.`} valueColor="text-slate-500 dark:text-slate-400" />
                            </div>
                        </div>
                    );
                })}
            </div>
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

const DashboardView: React.FC<DashboardViewProps> = ({ billings, expenses, customers, debtPayments, warnings, onAddWarning, onResolveWarning, onDeleteWarning, lastBackupDate, onNavigateToSettings, areValuesHidden }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [chartView, setChartView] = useState<ChartView>('total');

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

        const totalDebtReceived = monthlyDebtPayments.reduce((sum, p) => sum + p.amountPaid, 0);

        // Expenses by category
        const expensesMesa = monthlyExpenses.filter(e => e.category === 'mesa').reduce((sum, e) => sum + e.amount, 0);
        const expensesJukebox = monthlyExpenses.filter(e => e.category === 'jukebox').reduce((sum, e) => sum + e.amount, 0);
        const expensesGrua = monthlyExpenses.filter(e => e.category === 'grua').reduce((sum, e) => sum + e.amount, 0);
        const totalExpenses = expensesMesa + expensesJukebox + expensesGrua + monthlyExpenses.filter(e => e.category === 'geral').reduce((sum, e) => sum + e.amount, 0);
        
        // Revenue for Mesas (Only direct payments)
        const revenueMesaDinheiro = monthlyBillings.filter(b => b.equipmentType === 'mesa').reduce((sum, b) => sum + (b.valorPagoDinheiro || 0), 0);
        const revenueMesaPix = monthlyBillings.filter(b => b.equipmentType === 'mesa').reduce((sum, b) => sum + (b.valorPagoPix || 0), 0);
        const totalRevenueMesa = revenueMesaDinheiro + revenueMesaPix;
        const balanceMesa = totalRevenueMesa - expensesMesa;

        // Revenue for Jukebox (Only direct payments)
        const revenueJukeboxDinheiro = monthlyBillings.filter(b => b.equipmentType === 'jukebox').reduce((sum, b) => sum + (b.valorPagoDinheiro || 0), 0);
        const revenueJukeboxPix = monthlyBillings.filter(b => b.equipmentType === 'jukebox').reduce((sum, b) => sum + (b.valorPagoPix || 0), 0);
        const totalRevenueJukebox = revenueJukeboxDinheiro + revenueJukeboxPix;
        const balanceJukebox = totalRevenueJukebox - expensesJukebox;
        
        // Revenue for Gruas
        const revenueGruaEspecie = monthlyBillings.filter(b => b.equipmentType === 'grua').reduce((sum, b) => sum + (b.recebimentoEspecie || 0), 0);
        const revenueGruaPix = monthlyBillings.filter(b => b.equipmentType === 'grua').reduce((sum, b) => sum + (b.recebimentoPix || 0), 0);
        const totalRevenueGrua = revenueGruaEspecie + revenueGruaPix;
        const balanceGrua = totalRevenueGrua - expensesGrua;
        
        const totalOutstandingDebt = customers.reduce((sum, c) => sum + (c.debtAmount || 0), 0);
        
        const allEquipment = customers.flatMap(c => c.equipment);
        const mesaCount = allEquipment.filter(e => e.type === 'mesa').length;
        const jukeboxCount = allEquipment.filter(e => e.type === 'jukebox').length;
        const gruaCount = allEquipment.filter(e => e.type === 'grua').length;
        
        const averageProfitMesa = mesaCount > 0 ? balanceMesa / mesaCount : 0;
        const averageProfitJukebox = jukeboxCount > 0 ? balanceJukebox / jukeboxCount : 0;
        const averageProfitGrua = gruaCount > 0 ? balanceGrua / gruaCount : 0;
        
        const averageRevenueMesa = mesaCount > 0 ? totalRevenueMesa / mesaCount : 0;
        const averageRevenueJukebox = jukeboxCount > 0 ? totalRevenueJukebox / jukeboxCount : 0;
        const averageRevenueGrua = gruaCount > 0 ? totalRevenueGrua / gruaCount : 0;

        return {
            revenueMesaDinheiro,
            revenueMesaPix,
            totalRevenueMesa,
            expensesMesa,
            balanceMesa,
            revenueJukeboxDinheiro,
            revenueJukeboxPix,
            totalRevenueJukebox,
            expensesJukebox,
            balanceJukebox,
            revenueGruaEspecie,
            revenueGruaPix,
            totalRevenueGrua,
            expensesGrua,
            balanceGrua,
            totalOutstandingDebt,
            totalDebtReceived,
            mesaCount,
            jukeboxCount,
            gruaCount,
            averageProfitMesa,
            averageProfitJukebox,
            averageProfitGrua,
            averageRevenueMesa,
            averageRevenueJukebox,
            averageRevenueGrua,
            totalExpenses,
        };
    }, [billings, expenses, customers, debtPayments, currentDate]);
    
    return (
        <div className="space-y-8">
            <PageHeader 
                title="INÍCIO"
                subtitle="Visão geral e desempenho do seu negócio."
            />

            <div className="space-y-8">
                <BackupReminder lastBackupDate={lastBackupDate} onNavigate={onNavigateToSettings} />
                <DebtReminders customers={customers} areValuesHidden={areValuesHidden} />
                <WarningsReminders warnings={warnings} />
            </div>
            
            <DateFilter 
                currentDate={currentDate}
                onMonthChange={handleMonthChange}
                onYearChange={handleYearChange}
            />

            <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
                <FinancialPerformanceCard stats={stats} chartView={chartView} onChartViewChange={setChartView} areValuesHidden={areValuesHidden} />
                
                <InfoCard title="Contas a Receber" icon={<CreditCardIcon className="w-6 h-6 text-amber-500" />} className="lg:col-span-2">
                    <InfoRow 
                        label="Total em Dívidas (Negativo)"
                        value={areValuesHidden ? 'R$ •••,••' : `R$ ${stats.totalOutstandingDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                        valueColor="text-amber-600 dark:text-amber-400 text-2xl"
                        className="flex-col !items-start"
                    />
                </InfoCard>
                 <InfoCard title="Despesas Totais" icon={<CalculatorIcon className="w-6 h-6 text-red-500" />} className="lg:col-span-2">
                    <InfoRow 
                        label="Total de Despesas no Período"
                        value={areValuesHidden ? 'R$ •••,••' : `R$ ${stats.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                        valueColor="text-red-600 dark:text-red-400 text-2xl"
                        className="flex-col !items-start"
                    />
                </InfoCard>
                <InfoCard title="Dívidas Recebidas" icon={<CurrencyDollarIcon className="w-6 h-6 text-emerald-500" />} className="lg:col-span-2">
                    <InfoRow 
                        label="Total Recebido de Dívidas"
                        value={areValuesHidden ? 'R$ •••,••' : `R$ ${stats.totalDebtReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                        valueColor="text-emerald-600 dark:text-emerald-400 text-2xl"
                        className="flex-col !items-start"
                    />
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
