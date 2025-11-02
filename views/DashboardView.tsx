
// views/DashboardView.tsx
import React, { useMemo, useState } from 'react';
import { Customer, Billing, Expense, DebtPayment } from '../types';
import PageHeader from '../components/PageHeader';
import { CurrencyDollarIcon } from '../components/icons/CurrencyDollarIcon';
import { UsersIcon } from '../components/icons/UsersIcon';
import { JukeboxIcon } from '../components/icons/JukeboxIcon';
import { BilliardIcon } from '../components/icons/BilliardIcon';

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
const DateFilter: React.FC<DateFilterProps> = ({ currentDate, onMonthChange, onYearChange }) => {
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-700 mb-8 flex flex-wrap items-center gap-4">
            <h3 className="text-lg font-semibold text-white">Período de Análise:</h3>
            <select value={currentDate.getMonth()} onChange={(e) => onMonthChange(parseInt(e.target.value))} className="bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {monthNames.map((month, index) => <option key={month} value={index}>{month}</option>)}
            </select>
            <select value={currentDate.getFullYear()} onChange={(e) => onYearChange(parseInt(e.target.value))} className="bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
        </div>
    );
};

interface InfoCardProps {
    title: string;
    children: React.ReactNode;
}
const InfoCard: React.FC<InfoCardProps> = ({ title, children }) => (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700 h-full">
        <h3 className="text-xl font-semibold text-white mb-4 border-b border-slate-700 pb-3">{title}</h3>
        <dl className="space-y-3">
            {children}
        </dl>
    </div>
);

interface InfoRowProps {
    label: string;
    value: string;
    valueColor?: string;
}
const InfoRow: React.FC<InfoRowProps> = ({ label, value, valueColor = 'text-slate-300' }) => (
    <div className="flex justify-between items-baseline">
        <dt className="text-slate-400">{label}</dt>
        <dd className={`font-mono font-bold ${valueColor}`}>{value}</dd>
    </div>
);


// --- Main View Component ---

const DashboardView: React.FC<DashboardViewProps> = ({ billings, expenses, customers, debtPayments }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const handleMonthChange = (month: number) => {
        const newDate = new Date(currentDate.getFullYear(), month, 1);
        setCurrentDate(newDate);
    };

    const handleYearChange = (year: number) => {
        const newDate = new Date(year, currentDate.getMonth(), 1);
        setCurrentDate(newDate);
    };

    const stats = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const monthlyBillings = billings.filter(b => {
            const date = new Date(b.settledAt);
            return date.getFullYear() === year && date.getMonth() === month;
        });
        const monthlyDebtPayments = debtPayments.filter(p => {
            const date = new Date(p.paidAt);
            return date.getFullYear() === year && date.getMonth() === month;
        });
        
        const billingsDinheiro = monthlyBillings.filter(b => b.paymentMethod === 'dinheiro').reduce((sum, b) => sum + b.valorTotal, 0);
        const debtPaymentsDinheiro = monthlyDebtPayments.filter(p => p.paymentMethod === 'dinheiro').reduce((sum, p) => sum + p.amountPaid, 0);
        const revenueDinheiro = billingsDinheiro + debtPaymentsDinheiro;

        const billingsPix = monthlyBillings.filter(b => b.paymentMethod === 'pix').reduce((sum, b) => sum + b.valorTotal, 0);
        const debtPaymentsPix = monthlyDebtPayments.filter(p => p.paymentMethod === 'pix').reduce((sum, p) => sum + p.amountPaid, 0);
        const revenuePix = billingsPix + debtPaymentsPix;

        const totalRevenueMes = revenueDinheiro + revenuePix;
        
        const revenueMesa = monthlyBillings.filter(b => b.equipment === 'mesa' && b.paymentMethod !== 'fiado').reduce((sum, b) => sum + b.valorTotal, 0);
        const revenueJukebox = monthlyBillings.filter(b => b.equipment === 'jukebox' && b.paymentMethod !== 'fiado').reduce((sum, b) => sum + b.valorTotal, 0);
        
        const debtGeneratedMesa = monthlyBillings.filter(b => b.equipment === 'mesa' && b.paymentMethod === 'fiado').reduce((sum, b) => sum + b.valorTotal, 0);
        const debtGeneratedJukebox = monthlyBillings.filter(b => b.equipment === 'jukebox' && b.paymentMethod === 'fiado').reduce((sum, b) => sum + b.valorTotal, 0);
        
        const totalDebt = customers.reduce((sum, c) => sum + c.debtAmount, 0);

        return {
            revenueDinheiro,
            revenuePix,
            totalRevenueMes,
            revenueMesa,
            revenueJukebox,
            debtGeneratedMesa,
            debtGeneratedJukebox,
            totalDebt,
            customersCount: customers.length
        };
    }, [billings, expenses, customers, debtPayments, currentDate]);
    
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    return (
        <div>
            <PageHeader 
                title="Dashboard"
                subtitle="Visão geral e desempenho do seu negócio."
            />
            
            <DateFilter 
                currentDate={currentDate}
                onMonthChange={handleMonthChange}
                onYearChange={handleYearChange}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <InfoCard title={`Resumo de Caixa (${monthNames[currentDate.getMonth()]})`}>
                    <InfoRow label="Receita em Dinheiro" value={`R$ ${stats.revenueDinheiro.toFixed(2)}`} valueColor="text-sky-400" />
                    <InfoRow label="Receita em PIX" value={`R$ ${stats.revenuePix.toFixed(2)}`} valueColor="text-emerald-400" />
                    <div className="pt-3 mt-2 border-t border-slate-700/50">
                        <InfoRow label="Total Recebido (Mês)" value={`R$ ${stats.totalRevenueMes.toFixed(2)}`} valueColor="text-amber-400 text-lg" />
                    </div>
                </InfoCard>

                <InfoCard title="Situação Geral">
                     <InfoRow label="Dívida Total (Fiado)" value={`R$ ${stats.totalDebt.toFixed(2)}`} valueColor="text-red-400 text-lg" />
                     <InfoRow label="Clientes Ativos" value={`${stats.customersCount}`} valueColor="text-slate-300 text-lg" />
                </InfoCard>
            </div>
            
            <div>
                <h2 className="text-2xl font-semibold text-white mb-6">Desempenho por Equipamento ({monthNames[currentDate.getMonth()]})</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <InfoCard title="Mesas de Sinuca">
                        <InfoRow label="Receita (Caixa)" value={`R$ ${stats.revenueMesa.toFixed(2)}`} valueColor="text-emerald-400" />
                        <InfoRow label="Débito Gerado (Fiado)" value={`R$ ${stats.debtGeneratedMesa.toFixed(2)}`} valueColor="text-red-400" />
                    </InfoCard>
                    <InfoCard title="Jukebox">
                        <InfoRow label="Receita (Caixa)" value={`R$ ${stats.revenueJukebox.toFixed(2)}`} valueColor="text-emerald-400" />
                        <InfoRow label="Débito Gerado (Fiado)" value={`R$ ${stats.debtGeneratedJukebox.toFixed(2)}`} valueColor="text-red-400" />
                    </InfoCard>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
