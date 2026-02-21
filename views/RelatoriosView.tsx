// views/RelatoriosView.tsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Billing, Customer, DebtPayment, Expense, Equipment } from '../types';
import PageHeader from '../components/PageHeader';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import CraneReportModal from '../components/CraneReportModal';
import { BilliardIcon } from '../components/icons/BilliardIcon';
import { JukeboxIcon } from '../components/icons/JukeboxIcon';
import { CraneIcon } from '../components/icons/CraneIcon';
import { CurrencyDollarIcon } from '../components/icons/CurrencyDollarIcon';
import { CalculatorIcon } from '../components/icons/CalculatorIcon';
import PrintableSlipsModal from '../components/PrintableSlipsModal';
import { DocumentDuplicateIcon } from '../components/icons/DocumentDuplicateIcon';
import CustomerSelectionForSlipsModal from '../components/CustomerSelectionForSlipsModal';
import { safeParseFloat } from '../utils';
import { CreditCardIcon } from '../components/icons/CreditCardIcon';

interface RelatoriosViewProps {
  customers: Customer[];
  billings: Billing[];
  expenses: Expense[];
  debtPayments: DebtPayment[];
  onThermalPrint: (title: string, content: string) => void;
  areValuesHidden: boolean;
  showNotification: (message: string, type?: 'success' | 'error') => void;
}

// --- Sub-components (moved outside for performance and best practices) ---

const JukeboxReportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deposit: number) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  const [deposit, setDeposit] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDeposit('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const depositNum = safeParseFloat(deposit);
    onConfirm(depositNum);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PrinterIcon className="w-6 h-6 text-fuchsia-400" />
            Configurar Relatório de Jukebox
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Valor em Depósito (R$)</label>
            <input 
              type="text" 
              inputMode="decimal"
              placeholder="0,00"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value.replace(/[^0-9,.]/g, ''))}
              className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-emerald-500 focus:outline-none"
            />
             <p className="text-xs text-slate-400 mt-1">Este valor é apenas informativo e não afeta o cálculo do lucro.</p>
          </div>

          <div className="pt-4 flex justify-end gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-500"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-fuchsia-600 text-white font-bold py-2 px-4 rounded-md hover:bg-fuchsia-500 flex items-center gap-2"
            >
              <PrinterIcon className="w-5 h-5" />
              Gerar Relatório
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

const MesaReportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deposit: number) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  const [deposit, setDeposit] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDeposit('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const depositNum = safeParseFloat(deposit);
    onConfirm(depositNum);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PrinterIcon className="w-6 h-6 text-cyan-400" />
            Configurar Relatório de Mesas
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Valor em Depósito (R$)</label>
            <input 
              type="text" 
              inputMode="decimal"
              placeholder="0,00"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value.replace(/[^0-9,.]/g, ''))}
              className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:ring-emerald-500 focus:outline-none"
            />
             <p className="text-xs text-slate-400 mt-1">Este valor é apenas informativo e não afeta o cálculo do lucro.</p>
          </div>

          <div className="pt-4 flex justify-end gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-500"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500 flex items-center gap-2"
            >
              <PrinterIcon className="w-5 h-5" />
              Gerar Relatório
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

interface InfoCardProps {
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
}
const InfoCard: React.FC<InfoCardProps> = React.memo(({ title, children, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-3 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <div className="flex-grow">
            <dl className="space-y-3">
                {children}
            </dl>
        </div>
    </div>
));

interface InfoRowProps {
    label: string;
    value: string;
    valueColor?: string;
}
const InfoRow: React.FC<InfoRowProps> = React.memo(({ label, value, valueColor = 'text-slate-700 dark:text-slate-300' }) => (
    <div className="flex justify-between items-baseline gap-2">
        <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
        <dd className={`font-mono font-bold ${valueColor} flex-shrink-0 text-right`}>{value}</dd>
    </div>
));

// --- Main View Component ---

const RelatoriosView: React.FC<RelatoriosViewProps> = ({ customers, billings, expenses, debtPayments, onThermalPrint, areValuesHidden, showNotification }) => {
  const getInitialDateRange = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
        start: firstDay.toISOString().split('T')[0],
        end: lastDay.toISOString().split('T')[0]
    };
  };

  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [isCraneReportModalOpen, setIsCraneReportModalOpen] = useState(false);
  const [isMesaReportModalOpen, setIsMesaReportModalOpen] = useState(false);
  const [isJukeboxReportModalOpen, setIsJukeboxReportModalOpen] = useState(false);
  const [isCustomerSelectionOpen, setIsCustomerSelectionOpen] = useState(false);
  const [slipsToPrint, setSlipsToPrint] = useState<{ customer: Customer; equipment: Equipment; lastBillingAmount: number | null; }[] | null>(null);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  }, []);

  const stats = useMemo(() => {
    const start = dateRange.start ? new Date(dateRange.start + 'T00:00:00') : null;
    const end = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : null;
    
    const filterByDate = (itemDateStr: Date) => {
        const itemDate = new Date(itemDateStr);
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        return true;
    };

    const periodBillings = billings.filter(b => filterByDate(b.settledAt));
    const periodDebtPayments = debtPayments.filter(p => filterByDate(p.paidAt));
    const periodExpenses = expenses.filter(e => filterByDate(e.date));

    // Debt payments breakdown
    const debtReceivedDinheiro = periodDebtPayments.reduce((sum, p) => sum + (p.amountPaidDinheiro || 0), 0);
    const debtReceivedPix = periodDebtPayments.reduce((sum, p) => sum + (p.amountPaidPix || 0), 0);
    const totalDebtReceived = debtReceivedDinheiro + debtReceivedPix;

    // Filtered Billings & Expenses by Category
    const periodMesaBillings = periodBillings.filter(b => b.equipmentType === 'mesa');
    const periodJukeboxBillings = periodBillings.filter(b => b.equipmentType === 'jukebox');
    const periodGruaBillings = periodBillings.filter(b => b.equipmentType === 'grua');
    
    const periodExpensesMesa = periodExpenses.filter(e => e.category === 'mesa').reduce((sum, e) => sum + e.amount, 0);
    const periodExpensesJukebox = periodExpenses.filter(e => e.category === 'jukebox').reduce((sum, e) => sum + e.amount, 0);
    const periodExpensesGrua = periodExpenses.filter(e => e.category === 'grua').reduce((sum, e) => sum + e.amount, 0);
    
    // Revenue for Mesas (direct payments only)
    const revenueMesaDinheiro = periodMesaBillings.reduce((sum, b) => sum + (b.valorPagoDinheiro || 0), 0);
    const revenueMesaPix = periodMesaBillings.reduce((sum, b) => sum + (b.valorPagoPix || 0), 0);
    
    // Revenue for Jukebox (direct payments only)
    const revenueJukeboxDinheiro = periodJukeboxBillings.reduce((sum, b) => sum + (b.valorPagoDinheiro || 0), 0);
    const revenueJukeboxPix = periodJukeboxBillings.reduce((sum, b) => sum + (b.valorPagoPix || 0), 0);

    // Revenue for Gruas
    const revenueGruaPix = periodGruaBillings.reduce((sum, b) => sum + (b.recebimentoPix || 0), 0);
    const revenueGruaEspecie = periodGruaBillings.reduce((sum, b) => sum + (b.recebimentoEspecie || 0), 0);
    const totalAluguelPagoGrua = periodGruaBillings.reduce((sum, b) => sum + (b.aluguelValor || 0), 0);
    const revenueGruaFirma = periodGruaBillings.reduce((sum, b) => sum + b.valorTotal, 0);
    
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    return {
      revenueMesaDinheiro,
      revenueMesaPix,
      revenueJukeboxDinheiro,
      revenueJukeboxPix,
      debtReceivedDinheiro,
      debtReceivedPix,
      totalDebtReceived,
      revenueGruaPix,
      revenueGruaEspecie,
      revenueGruaFirma,
      totalAluguelPagoGrua,
      totalExpenses,
      periodMesaBillings,
      periodJukeboxBillings,
      periodGruaBillings,
      periodDebtPayments,
      periodExpenses,
      periodExpensesMesa,
      periodExpensesJukebox,
      periodExpensesGrua,
    };
  }, [billings, expenses, debtPayments, dateRange, customers]);
  
  const printReport = useCallback((title: string, content: string, customDateRange?: string) => {
    const startDate = dateRange.start ? new Date(dateRange.start + 'T00:00:00').toLocaleDateString('pt-BR') : 'Início';
    const endDate = dateRange.end ? new Date(dateRange.end + 'T00:00:00').toLocaleDateString('pt-BR') : 'Fim';
    const dateTitle = customDateRange || `${startDate} a ${endDate}`;

    const reportHtml = `
      <html>
        <head>
          <title>${title} - ${dateTitle}</title>
          ${content.includes('<style>') ? '' : `
          <style>
            body { font-family: Arial, sans-serif; font-size: 10pt; color: #333; text-align: center; margin-top: 20px; }
            @page { size: A4 landscape; margin: 10mm; }
            h1 { font-size: 18pt; margin-bottom: 5px; }
            h2 { font-size: 14pt; margin-bottom: 20px; padding-bottom: 5px; border-bottom: 2px solid #ccc; display: inline-block; }
            table { width: 95%; border-collapse: collapse; margin: 0 auto 20px auto; font-size: 10pt; }
            th, td { border: 1px solid #ccc; padding: 6px; text-align: center; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .currency { text-align: right; font-family: monospace; }
            .text-left { text-align: left; }
            .no-records { text-align: center; color: #777; font-style: italic; }
            tfoot td { font-weight: bold; border-top: 2px solid #333; background-color: #f9f9f9; }
          </style>
          `}
        </head>
        <body>
          <h1>Montanha Bilhar & Jukebox</h1>
          <h2>${title} - Período: ${dateTitle}</h2>
          ${content}
        </body>
      </html>
    `;
    const printWindow = window.open('', '', 'height=800,width=1200');
    if (printWindow) {
        printWindow.document.write(reportHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }
  }, [dateRange]);

  const handlePrintMesaReport = useCallback((deposito: number) => {
    if (areValuesHidden) {
        showNotification("Desative o Modo de Privacidade para imprimir relatórios.", "error");
        setIsMesaReportModalOpen(false);
        return;
    }
    const data = [...stats.periodMesaBillings].sort((a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime());
    const customerMap = new Map<string, Customer>(customers.map(c => [c.id, c]));
    const revenueMesaTotal = stats.revenueMesaDinheiro + stats.revenueMesaPix;

    const content = `
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; color: #333; }
        @page { size: A4 landscape; margin: 15mm; }
        .header { text-align: center; margin-bottom: 20px; }
        h3 { text-align: left; font-size: 14pt; color: #333; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 0 auto 20px auto; font-size: 10pt; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: center; }
        th { background-color: #ecfeff; color: #0e7490; font-weight: bold; text-transform: uppercase; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .currency { text-align: right; font-family: 'Courier New', monospace; }
        .text-left { text-align: left; }
        .no-records { padding: 20px; text-align: center; color: #777; font-style: italic; }
        
        .summary-section { margin-top: 30px; text-align: left; page-break-inside: avoid; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .summary-card { padding: 12px; border-radius: 8px; border: 1px solid #ddd; background-color: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .summary-card .label { display: block; font-size: 9pt; color: #555; margin-bottom: 4px; font-weight: bold; text-transform: uppercase; }
        .summary-card .value { display: block; font-size: 15pt; font-weight: bold; font-family: 'Courier New', monospace; }
        .grid-col-span-2 { grid-column: span 2; }
        
        .summary-card--dinheiro { background-color: #e0f2fe !important; border-color: #7dd3fc !important; }
        .summary-card--dinheiro .value { color: #0369a1 !important; }
        .summary-card--pix { background-color: #f7fee7 !important; border-color: #bef264 !important; }
        .summary-card--pix .value { color: #4d7c0f !important; }
        .summary-card--total { background-color: #dcfce7 !important; border-color: #4ade80 !important; grid-column: span 2; }
        .summary-card--total .value { color: #15803d !important; font-size: 16pt; }
        .summary-card--despesa { background-color: #fee2e2 !important; border-color: #fca5a5 !important; grid-column: span 2; }
        .summary-card--despesa .value { color: #b91c1c !important; }
        .summary-card--lucro { background-color: #dcfce7 !important; border-color: #4ade80 !important; grid-column: span 2; }
        .summary-card--lucro .value { color: #15803d !important; font-size: 18pt; }
        .summary-card--info { background-color: #f1f5f9 !important; border-color: #cbd5e1 !important; grid-column: span 2; }
        .summary-card--info .value { color: #475569 !important; }
      </style>
      <h3>Receitas - Mesas de Sinuca</h3>
      <table>
        <thead>
          <tr>
            <th>Data</th> <th class="text-left">Cliente</th> <th class="text-left">Cidade</th> <th class="currency">Rel. Ant.</th> <th class="currency">Rel. Atual</th> <th class="currency">Jogadas</th> <th>Pagamento</th> <th class="currency">Receita</th>
          </tr>
        </thead>
        <tbody>
          ${data.length > 0 ? data.map(b => {
            const customer = customerMap.get(b.customerId);
            const cidade = customer ? customer.cidade : 'N/A';
            let transactionRevenue = (b.valorPagoDinheiro || 0) + (b.valorPagoPix || 0);
            const paymentParts = [];

            if (b.valorPagoDinheiro && b.valorPagoDinheiro > 0) paymentParts.push(`Dinheiro: R$ ${b.valorPagoDinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            if (b.valorPagoPix && b.valorPagoPix > 0) paymentParts.push(`PIX: R$ ${b.valorPagoPix.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            if (b.valorDebitoNegativo && b.valorDebitoNegativo > 0) paymentParts.push(`<span style="color: #D32F2F;">Negativo: R$ ${b.valorDebitoNegativo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`);
            if (paymentParts.length === 0 && b.paymentMethod !== 'pending_payment') paymentParts.push('R$ 0,00');

            return `<tr><td>${new Date(b.settledAt).toLocaleDateString('pt-BR')}</td><td class="text-left">${b.customerName}</td><td class="text-left">${cidade}</td><td class="currency">${b.relogioAnterior}</td><td class="currency">${b.relogioAtual}</td><td class="currency">${b.partidasJogadas}</td><td class="text-left" style="font-size: 8pt;">${paymentParts.join('<br>')}</td><td class="currency" style="color: #166534; font-weight: bold;">R$ ${transactionRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>`;
          }).join('') : '<tr><td colspan="8" class="no-records">Nenhuma cobrança no período.</td></tr>'}
        </tbody>
      </table>

      <div class="summary-section">
        <h3>Fechamento Financeiro</h3>
        <div class="summary-grid">
            <div class="summary-card summary-card--dinheiro"><span class="label">Total Dinheiro (Cobranças)</span><span class="value">R$ ${stats.revenueMesaDinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="summary-card summary-card--pix"><span class="label">Total PIX (Cobranças)</span><span class="value">R$ ${stats.revenueMesaPix.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="summary-card summary-card--total"><span class="label">(=) Total Arrecadado (Caixa)</span><span class="value">R$ ${revenueMesaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="summary-card summary-card--despesa"><span class="label">(-) Total Despesas (Mesas)</span><span class="value">- R$ ${stats.periodExpensesMesa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="summary-card summary-card--lucro"><span class="label">(=) Lucro Líquido</span><span class="value">R$ ${(revenueMesaTotal - stats.periodExpensesMesa).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="summary-card summary-card--info"><span class="label">Depósito (Informativo)</span><span class="value">R$ ${deposito.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        </div>
      </div>
    `;
    printReport('Relatório de Mesas de Sinuca', content);
    setIsMesaReportModalOpen(false);
  }, [stats, printReport, customers, areValuesHidden, showNotification]);

  const handlePrintJukeboxReport = useCallback((deposito: number) => {
    if (areValuesHidden) {
        showNotification("Desative o Modo de Privacidade para imprimir relatórios.", "error");
        setIsJukeboxReportModalOpen(false);
        return;
    }
    const data = [...stats.periodJukeboxBillings].sort((a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime());
    const customerMap = new Map<string, Customer>(customers.map(c => [c.id, c]));
    const revenueJukeboxTotal = stats.revenueJukeboxDinheiro + stats.revenueJukeboxPix;

    const content = `
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; color: #333; }
        @page { size: A4 landscape; margin: 15mm; }
        h3 { text-align: left; font-size: 14pt; color: #333; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 0 auto 20px auto; font-size: 10pt; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: center; }
        th { background-color: #fdf2f8; color: #a21caf; font-weight: bold; text-transform: uppercase; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .currency { text-align: right; font-family: 'Courier New', monospace; }
        .text-left { text-align: left; }
        .no-records { padding: 20px; text-align: center; color: #777; font-style: italic; }
        .summary-section { margin-top: 30px; text-align: left; page-break-inside: avoid; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .summary-card { padding: 12px; border-radius: 8px; border: 1px solid #ddd; background-color: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .summary-card .label { display: block; font-size: 9pt; color: #555; margin-bottom: 4px; font-weight: bold; text-transform: uppercase; }
        .summary-card .value { display: block; font-size: 15pt; font-weight: bold; font-family: 'Courier New', monospace; }
        .grid-col-span-2 { grid-column: span 2; }
        .summary-card--dinheiro { background-color: #e0f2fe !important; border-color: #7dd3fc !important; }
        .summary-card--dinheiro .value { color: #0369a1 !important; }
        .summary-card--pix { background-color: #f7fee7 !important; border-color: #bef264 !important; }
        .summary-card--pix .value { color: #4d7c0f !important; }
        .summary-card--total { background-color: #dcfce7 !important; border-color: #4ade80 !important; grid-column: span 2; }
        .summary-card--total .value { color: #15803d !important; font-size: 16pt; }
        .summary-card--despesa { background-color: #fee2e2 !important; border-color: #fca5a5 !important; grid-column: span 2; }
        .summary-card--despesa .value { color: #b91c1c !important; }
        .summary-card--lucro { background-color: #dcfce7 !important; border-color: #4ade80 !important; grid-column: span 2; }
        .summary-card--lucro .value { color: #15803d !important; font-size: 18pt; }
        .summary-card--info { background-color: #f1f5f9 !important; border-color: #cbd5e1 !important; grid-column: span 2; }
        .summary-card--info .value { color: #475569 !important; }
      </style>
      <h3>Receitas - Jukebox</h3>
      <table>
        <thead>
          <tr>
            <th>Data</th> <th class="text-left">Cliente</th> <th class="text-left">Cidade</th> <th class="currency">Rel. Ant.</th> <th class="currency">Rel. Atual</th> <th>Pagamento</th> <th class="currency">Receita</th>
          </tr>
        </thead>
        <tbody>
          ${data.length > 0 ? data.map(b => {
            const customer = customerMap.get(b.customerId);
            const cidade = customer ? customer.cidade : 'N/A';
            let transactionRevenue = (b.valorPagoDinheiro || 0) + (b.valorPagoPix || 0);
            const paymentParts = [];

            if (b.valorPagoDinheiro && b.valorPagoDinheiro > 0) paymentParts.push(`Dinheiro: R$ ${b.valorPagoDinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            if (b.valorPagoPix && b.valorPagoPix > 0) paymentParts.push(`PIX: R$ ${b.valorPagoPix.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            if (b.valorDebitoNegativo && b.valorDebitoNegativo > 0) paymentParts.push(`<span style="color: #D32F2F;">Negativo: R$ ${b.valorDebitoNegativo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`);
            if (paymentParts.length === 0 && b.paymentMethod !== 'pending_payment') paymentParts.push('R$ 0,00');

            return `<tr><td>${new Date(b.settledAt).toLocaleDateString('pt-BR')}</td><td class="text-left">${b.customerName}</td><td class="text-left">${cidade}</td><td class="currency">${b.relogioAnterior}</td><td class="currency">${b.relogioAtual}</td><td class="text-left" style="font-size: 8pt;">${paymentParts.join('<br>')}</td><td class="currency" style="color: #166534; font-weight: bold;">R$ ${transactionRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>`;
          }).join('') : '<tr><td colspan="7" class="no-records">Nenhuma cobrança no período.</td></tr>'}
        </tbody>
      </table>
      
      <div class="summary-section">
        <h3>Fechamento Financeiro</h3>
        <div class="summary-grid">
            <div class="summary-card summary-card--dinheiro"><span class="label">Total Dinheiro (Cobranças)</span><span class="value">R$ ${stats.revenueJukeboxDinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="summary-card summary-card--pix"><span class="label">Total PIX (Cobranças)</span><span class="value">R$ ${stats.revenueJukeboxPix.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="summary-card summary-card--total"><span class="label">(=) Total Arrecadado (Caixa)</span><span class="value">R$ ${revenueJukeboxTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="summary-card summary-card--despesa"><span class="label">(-) Total Despesas (Jukebox)</span><span class="value">- R$ ${stats.periodExpensesJukebox.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="summary-card summary-card--lucro"><span class="label">(=) Lucro Líquido</span><span class="value">R$ ${(revenueJukeboxTotal - stats.periodExpensesJukebox).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="summary-card summary-card--info"><span class="label">Depósito (Informativo)</span><span class="value">R$ ${deposito.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        </div>
      </div>
    `;
    printReport('Relatório de Jukebox', content);
    setIsJukeboxReportModalOpen(false);
  }, [stats, printReport, customers, areValuesHidden, showNotification]);
  
  const handleGenerateCraneReport = useCallback((startDate: string, endDate: string, moneyDeposit: number) => {
    if (areValuesHidden) {
        showNotification("Desative o Modo de Privacidade para imprimir relatórios.", "error");
        setIsCraneReportModalOpen(false);
        return;
    }
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    
    const reportExpenses = expenses
        .filter(e => {
            if (e.category !== 'grua') return false;
            const date = new Date(e.date);
            return date >= start && date <= end;
        })
        .reduce((sum, e) => sum + e.amount, 0);
    
    const data = billings.filter(b => {
        if (b.equipmentType !== 'grua') return false;
        const date = new Date(b.settledAt);
        return date >= start && date <= end;
    }).sort((a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime());

    const customerMap = new Map<string, Customer>(customers.map(c => [c.id, c]));

    const totalSaldoBruto = data.reduce((sum, b) => sum + (b.saldo || 0), 0);
    const totalAluguelCliente = data.reduce((sum, b) => sum + (b.aluguelValor || 0), 0);
    const totalValorFirma = data.reduce((sum, b) => sum + b.valorTotal, 0);

    const totalReposicao = data.reduce((sum, b) => sum + (b.reposicaoPelucia || 0), 0);
    const totalEspecie = data.reduce((sum, b) => sum + (b.recebimentoEspecie || 0), 0);
    const totalPix = data.reduce((sum, b) => sum + (b.recebimentoPix || 0), 0);
    
    const saldoFinal = totalValorFirma - reportExpenses;

    const content = `
      <style>
        .fin-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 15px; width: 95%; margin: 40px auto 0 auto; page-break-inside: avoid; }
        .fin-box { padding: 20px 10px; border-radius: 10px; border: 2px solid #ddd; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .fin-label { display: block; font-size: 10pt; text-transform: uppercase; margin-bottom: 10px; font-weight: bold; color: #444; }
        .fin-value { display: block; font-size: 16pt; font-weight: bold; font-family: monospace; }
        .bg-sky { background-color: #e0f2fe !important; border-color: #7dd3fc !important; color: #0369a1 !important; }
        .bg-lime { background-color: #f7fee7 !important; border-color: #bef264 !important; color: #4d7c0f !important; }
        .bg-red { background-color: #fee2e2 !important; border-color: #fca5a5 !important; color: #b91c1c !important; }
        .bg-green { background-color: #dcfce7 !important; border-color: #86efac !important; color: #166534 !important; }
        .bg-amber { background-color: #fffbeb !important; border-color: #fcd34d !important; color: #b45309 !important; }
        body { font-family: Arial, sans-serif; font-size: 10pt; color: #333; text-align: center; margin-top: 20px; }
        @page { size: A4 landscape; margin: 10mm; }
        h1 { font-size: 18pt; margin-bottom: 5px; } h2 { font-size: 14pt; margin-bottom: 20px; padding-bottom: 5px; border-bottom: 2px solid #ccc; display: inline-block; }
        table { width: 95%; border-collapse: collapse; margin: 0 auto 20px auto; font-size: 10pt; }
        th, td { border: 1px solid #ccc; padding: 6px; text-align: center; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .currency { text-align: right; font-family: monospace; } .text-left { text-align: left; }
        .no-records { text-align: center; color: #777; font-style: italic; }
        tfoot td { font-weight: bold; border-top: 2px solid #333; }
        .total-cell { padding: 8px !important; font-size: 11pt !important; color: white !important; font-weight: bold !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .total-cell-label { background-color: #455A64 !important; color: white !important; font-weight: bold !important; font-size: 11pt !important; text-align: center !important; vertical-align: middle; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .total-saldo-bruto { background-color: #1976D2 !important; }
        .total-aluguel { background-color: #F57C00 !important; }
        .total-firma { background-color: #388E3C !important; }
        .total-reposicao { background-color: #546E7A !important; }
        .total-especie { background-color: #0288D1 !important; }
        .total-pix { background-color: #689F38 !important; }
      </style>

      <h3>Receitas - Gruas de Pelúcia</h3>
      <table>
        <thead>
          <tr>
            <th class="text-left">Cliente</th> <th class="text-left">Cidade</th> <th>Grua Nº</th> <th class="currency">Rel. Ant.</th> <th class="currency">Rel. Atual</th> <th class="currency">Jogadas</th> <th class="currency">Saldo Bruto</th> <th class="currency">Aluguel (Cliente)</th> <th class="currency">Valor (Firma)</th> <th class="currency">Rep. Pelúcia</th> <th class="currency">Receb. Espécie</th> <th class="currency">Receb. PIX</th>
          </tr>
        </thead>
        <tbody>
          ${data.length > 0 ? data.map(b => {
            const customer = customerMap.get(b.customerId);
            const cidade = customer ? customer.cidade : 'N/A';
            return `
            <tr>
              <td class="text-left">${b.customerName}</td> <td class="text-left">${cidade}</td> <td>${b.equipmentNumero}</td> <td class="currency">${b.relogioAnterior}</td> <td class="currency">${b.relogioAtual}</td> <td class="currency">${b.partidasJogadas}</td> <td class="currency">R$ ${(b.saldo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td> <td class="currency">R$ ${(b.aluguelValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td> <td class="currency">R$ ${b.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td> <td class="currency">${b.reposicaoPelucia || 0}</td> <td class="currency">R$ ${(b.recebimentoEspecie || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td> <td class="currency">R$ ${(b.recebimentoPix || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            `;
          }).join('') : '<tr><td colspan="12" class="no-records">Nenhuma cobrança no período.</td></tr>'}
        </tbody>
        <tfoot>
            <tr>
              <td colspan="6" class="total-cell-label">TOTAIS</td>
              <td class="currency total-cell total-saldo-bruto">R$ ${totalSaldoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td class="currency total-cell total-aluguel">R$ ${totalAluguelCliente.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td class="currency total-cell total-firma">R$ ${totalValorFirma.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td class="currency total-cell total-reposicao">${totalReposicao}</td>
              <td class="currency total-cell total-especie">R$ ${totalEspecie.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td class="currency total-cell total-pix">R$ ${totalPix.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        </tfoot>
      </table>

      <div class="fin-grid">
        <div class="fin-box bg-sky"><span class="fin-label">Total Arrecadado (Dinheiro)</span><span class="fin-value">R$ ${totalEspecie.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div class="fin-box bg-lime"><span class="fin-label">Total Arrecadado (PIX)</span><span class="fin-value">R$ ${totalPix.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div class="fin-box bg-red"><span class="fin-label">(-) Total Despesas</span><span class="fin-value">- R$ ${reportExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div class="fin-box bg-green"><span class="fin-label">(=) Saldo Final (Lucro)</span><span class="fin-value">R$ ${saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        <div class="fin-box bg-amber"><span class="fin-label">Depósito (Informativo)</span><span class="fin-value">R$ ${moneyDeposit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
      </div>
    `;

    const dateTitle = `${new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')} a ${new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR')}`;
    printReport('Relatório de Gruas de Pelúcia', content, dateTitle);
    setIsCraneReportModalOpen(false);
  }, [expenses, billings, printReport, customers, areValuesHidden, showNotification]);

  const handlePrintDebtPaymentsReport = useCallback(() => {
    if (areValuesHidden) {
        showNotification("Desative o Modo de Privacidade para imprimir relatórios.", "error");
        return;
    }
    const data = [...stats.periodDebtPayments].sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
    const totalDinheiro = stats.debtReceivedDinheiro;
    const totalPix = stats.debtReceivedPix;
    const totalGeral = stats.totalDebtReceived;

    const content = `
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; color: #333; }
        @page { size: A4 landscape; margin: 15mm; }
        h3 { text-align: left; font-size: 14pt; color: #333; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 0 auto 20px auto; font-size: 10pt; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: center; }
        th { background-color: #dcfce7; color: #166534; font-weight: bold; text-transform: uppercase; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .currency { text-align: right; font-family: 'Courier New', monospace; }
        .text-left { text-align: left; }
        .no-records { padding: 20px; text-align: center; color: #777; font-style: italic; }
        
        .summary-section { margin-top: 30px; text-align: left; page-break-inside: avoid; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .summary-card { padding: 12px; border-radius: 8px; border: 1px solid #ddd; background-color: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .summary-card .label { display: block; font-size: 9pt; color: #555; margin-bottom: 4px; font-weight: bold; text-transform: uppercase; }
        .summary-card .value { display: block; font-size: 15pt; font-weight: bold; font-family: 'Courier New', monospace; }
        .grid-col-span-2 { grid-column: span 2; }
        
        .summary-card--dinheiro { background-color: #e0f2fe !important; border-color: #7dd3fc !important; }
        .summary-card--dinheiro .value { color: #0369a1 !important; }
        .summary-card--pix { background-color: #f7fee7 !important; border-color: #bef264 !important; }
        .summary-card--pix .value { color: #4d7c0f !important; }
        .summary-card--emerald { background-color: #dcfce7 !important; border-color: #4ade80 !important; grid-column: span 2; }
        .summary-card--emerald .value { color: #15803d !important; font-size: 18pt; }
      </style>
      <h3>Recebimentos de Dívidas</h3>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th class="text-left">Cliente</th>
            <th class="currency">Recebido (Dinheiro)</th>
            <th class="currency">Recebido (PIX)</th>
            <th class="currency">Total Pago</th>
          </tr>
        </thead>
        <tbody>
          ${data.length > 0 ? data.map(p => `
            <tr>
              <td>${new Date(p.paidAt).toLocaleDateString('pt-BR')}</td>
              <td class="text-left">${p.customerName}</td>
              <td class="currency">R$ ${(p.amountPaidDinheiro || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td class="currency">R$ ${(p.amountPaidPix || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              <td class="currency" style="font-weight: bold;">R$ ${p.amountPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          `).join('') : '<tr><td colspan="5" class="no-records">Nenhum pagamento de dívida no período.</td></tr>'}
        </tbody>
      </table>

      <div class="summary-section">
        <h3>Fechamento Financeiro</h3>
        <div class="summary-grid">
            <div class="summary-card summary-card--dinheiro"><span class="label">Total Dinheiro</span><span class="value">R$ ${totalDinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="summary-card summary-card--pix"><span class="label">Total PIX</span><span class="value">R$ ${totalPix.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
            <div class="summary-card summary-card--emerald grid-col-span-2"><span class="label">(=) TOTAL GERAL RECEBIDO</span><span class="value">R$ ${totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        </div>
      </div>
    `;
    printReport('Relatório de Dívidas Recebidas', content);
  }, [stats.periodDebtPayments, stats.debtReceivedDinheiro, stats.debtReceivedPix, stats.totalDebtReceived, printReport, areValuesHidden, showNotification]);

  const handleGenerateSlips = useCallback((selectedCustomers: Customer[]) => {
      if (areValuesHidden) {
          showNotification("Desative o Modo de Privacidade para gerar talões.", "error");
          setIsCustomerSelectionOpen(false);
          return;
      }
      const slipsData = selectedCustomers.flatMap(customer => {
          return (customer.equipment || [])
              .filter(e => e.type === 'mesa' || e.type === 'jukebox')
              .map(equipment => {
                  const lastBilling = billings
                      .filter(b => b.equipmentId === equipment.id)
                      .sort((a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime())[0];
                  
                  const lastBillingAmount = lastBilling ? lastBilling.valorTotal - (lastBilling.valorBonus || 0) : null;

                  return { customer, equipment, lastBillingAmount };
              });
      });
      setSlipsToPrint(slipsData);
  }, [billings, areValuesHidden, showNotification]);

  return (
    <>
      <PageHeader
        title="Relatórios e Análises"
        subtitle="Analise o desempenho financeiro do seu negócio."
      />
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 mb-8 flex flex-wrap items-center gap-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filtrar por Período:</h3>
          <input type="date" name="start" value={dateRange.start} onChange={handleDateChange} className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
          <span className="text-slate-500 dark:text-slate-400">até</span>
          <input type="date" name="end" value={dateRange.end} onChange={handleDateChange} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <InfoCard title="Resumo: Mesas de Sinuca" icon={<BilliardIcon className="w-6 h-6 text-cyan-500" />}>
          <InfoRow label="Receita (Dinheiro)" value={areValuesHidden ? 'R$ •••,••' : `R$ ${stats.revenueMesaDinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-sky-600 dark:text-sky-400" />
          <InfoRow label="Receita (PIX)" value={areValuesHidden ? 'R$ •••,••' : `R$ ${stats.revenueMesaPix.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-lime-600 dark:text-lime-400" />
          <InfoRow label="(-) Despesas (Mesas)" value={areValuesHidden ? 'R$ •••,••' : `- R$ ${stats.periodExpensesMesa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-red-600 dark:text-red-400" />
          <InfoRow label="(=) Lucro Líquido" value={areValuesHidden ? 'R$ •••,••' : `R$ ${(stats.revenueMesaDinheiro + stats.revenueMesaPix - stats.periodExpensesMesa).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-green-500 dark:text-green-300 font-bold text-lg" />
           <button onClick={() => setIsMesaReportModalOpen(true)} disabled={areValuesHidden} title={areValuesHidden ? "Desative o Modo de Privacidade para imprimir" : "Imprimir Relatório de Mesas"} className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500 disabled:bg-slate-500 disabled:cursor-not-allowed"><PrinterIcon className="w-5 h-5"/> <span>Imprimir Relatório</span></button>
        </InfoCard>
        
        <InfoCard title="Resumo: Jukebox" icon={<JukeboxIcon className="w-6 h-6 text-fuchsia-500" />}>
           <InfoRow label="Receita (Dinheiro)" value={areValuesHidden ? 'R$ •••,••' : `R$ ${stats.revenueJukeboxDinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-sky-600 dark:text-sky-400" />
           <InfoRow label="Receita (PIX)" value={areValuesHidden ? 'R$ •••,••' : `R$ ${stats.revenueJukeboxPix.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-lime-600 dark:text-lime-400" />
          <InfoRow label="(-) Despesas (Jukebox)" value={areValuesHidden ? 'R$ •••,••' : `- R$ ${stats.periodExpensesJukebox.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-red-600 dark:text-red-400" />
          <InfoRow label="(=) Lucro Líquido" value={areValuesHidden ? 'R$ •••,••' : `R$ ${(stats.revenueJukeboxDinheiro + stats.revenueJukeboxPix - stats.periodExpensesJukebox).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-green-500 dark:text-green-300 font-bold text-lg" />
           <button onClick={() => setIsJukeboxReportModalOpen(true)} disabled={areValuesHidden} title={areValuesHidden ? "Desative o Modo de Privacidade para imprimir" : "Imprimir Relatório de Jukebox"} className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-fuchsia-600 text-white font-bold py-2 px-4 rounded-md hover:bg-fuchsia-500 disabled:bg-slate-500 disabled:cursor-not-allowed"><PrinterIcon className="w-5 h-5"/> <span>Imprimir Relatório</span></button>
        </InfoCard>

        <InfoCard title="Resumo: Gruas de Pelúcia" icon={<CraneIcon className="w-6 h-6 text-orange-500" />}>
          <InfoRow label="Recebido (Espécie)" value={areValuesHidden ? 'R$ •••,••' : `R$ ${stats.revenueGruaEspecie.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-sky-600 dark:text-sky-400" />
          <InfoRow label="Recebido (PIX)" value={areValuesHidden ? 'R$ •••,••' : `R$ ${stats.revenueGruaPix.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-lime-600 dark:text-lime-400" />
          <InfoRow label="Total Arrecadado (Firma)" value={areValuesHidden ? 'R$ •••,••' : `R$ ${stats.revenueGruaFirma.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-green-600 dark:text-green-400" />
          <InfoRow label="(-) Despesas (Gruas)" value={areValuesHidden ? 'R$ •••,••' : `- R$ ${stats.periodExpensesGrua.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-red-600 dark:text-red-400" />
          <InfoRow label="(=) Lucro Líquido" value={areValuesHidden ? 'R$ •••,••' : `R$ ${(stats.revenueGruaFirma - stats.periodExpensesGrua).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-green-500 dark:text-green-300 font-bold text-lg" />
          <button onClick={() => setIsCraneReportModalOpen(true)} disabled={areValuesHidden} title={areValuesHidden ? "Desative o Modo de Privacidade para imprimir" : "Imprimir Relatório de Gruas"} className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-orange-600 text-white font-bold py-2 px-4 rounded-md hover:bg-orange-500 disabled:bg-slate-500 disabled:cursor-not-allowed"><PrinterIcon className="w-5 h-5"/> <span>Imprimir Relatório</span></button>
        </InfoCard>
        
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
            <InfoCard title="Resumo: Dívidas Recebidas" icon={<CreditCardIcon className="w-6 h-6 text-emerald-500" />}>
                <InfoRow label="Recebido (Dinheiro)" value={areValuesHidden ? 'R$ •••,••' : `R$ ${stats.debtReceivedDinheiro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-sky-600 dark:text-sky-400" />
                <InfoRow label="Recebido (PIX)" value={areValuesHidden ? 'R$ •••,••' : `R$ ${stats.debtReceivedPix.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-lime-600 dark:text-lime-400" />
                <InfoRow label="(=) Total Recebido" value={areValuesHidden ? 'R$ •••,••' : `R$ ${stats.totalDebtReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-emerald-500 dark:text-emerald-300 font-bold text-lg" />
                <button onClick={handlePrintDebtPaymentsReport} disabled={areValuesHidden} title={areValuesHidden ? "Desative o Modo de Privacidade para imprimir" : "Imprimir Relatório de Dívidas"} className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-2 px-4 rounded-md hover:bg-emerald-500 disabled:bg-slate-500 disabled:cursor-not-allowed"><PrinterIcon className="w-5 h-5"/> <span>Imprimir Relatório</span></button>
            </InfoCard>
            <InfoCard title="Resumo Geral de Despesas" icon={<CalculatorIcon className="w-6 h-6 text-red-500" />}>
                <InfoRow label="Total de Despesas" value={areValuesHidden ? 'R$ •••,••' : `R$ ${stats.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} valueColor="text-red-500 dark:text-red-300 font-bold text-lg" />
            </InfoCard>
        </div>
      </div>
      
       <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
           <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-700 pb-3 flex items-center gap-2">
                <DocumentDuplicateIcon className="w-6 h-6 text-indigo-500" />
                Impressão de Talões
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Gere talões de cobrança manual (3 por folha A4) para clientes selecionados. Ideal para rotas sem acesso ao sistema.</p>
            <button
                onClick={() => setIsCustomerSelectionOpen(true)}
                disabled={areValuesHidden}
                title={areValuesHidden ? "Desative o Modo de Privacidade para gerar talões" : "Selecionar Clientes e Gerar Talões"}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-500 disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
                Selecionar Clientes e Gerar Talões
            </button>
       </div>

      {isCraneReportModalOpen && <CraneReportModal isOpen={isCraneReportModalOpen} onClose={() => setIsCraneReportModalOpen(false)} onConfirm={handleGenerateCraneReport} />}
      {isMesaReportModalOpen && <MesaReportModal isOpen={isMesaReportModalOpen} onClose={() => setIsMesaReportModalOpen(false)} onConfirm={handlePrintMesaReport} />}
      {isJukeboxReportModalOpen && <JukeboxReportModal isOpen={isJukeboxReportModalOpen} onClose={() => setIsJukeboxReportModalOpen(false)} onConfirm={handlePrintJukeboxReport} />}
      {isCustomerSelectionOpen && <CustomerSelectionForSlipsModal isOpen={isCustomerSelectionOpen} onClose={() => setIsCustomerSelectionOpen(false)} customers={customers} onConfirm={handleGenerateSlips} />}
      {slipsToPrint && <PrintableSlipsModal slips={slipsToPrint} onClose={() => setSlipsToPrint(null)} />}
    </>
  );
};

export default RelatoriosView;