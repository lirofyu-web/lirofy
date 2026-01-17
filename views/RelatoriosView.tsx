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

interface RelatoriosViewProps {
  customers: Customer[];
  billings: Billing[];
  expenses: Expense[];
  debtPayments: DebtPayment[];
  onThermalPrint: (title: string, content: string) => void;
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
    const depositNum = parseFloat(deposit.replace(',', '.')) || 0;
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
    const depositNum = parseFloat(deposit.replace(',', '.')) || 0;
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
    <div className="flex justify-between items-baseline">
        <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
        <dd className={`font-mono font-bold ${valueColor}`}>{value}</dd>
    </div>
));

// --- Main View Component ---

const RelatoriosView: React.FC<RelatoriosViewProps> = ({ customers, billings, expenses, debtPayments, onThermalPrint }) => {
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
    const start = dateRange.start ? new Date(dateRange.start) : null;
    if (start) start.setHours(0, 0, 0, 0);

    const end = dateRange.end ? new Date(dateRange.end) : null;
    if (end) end.setHours(23, 59, 59, 999);
    
    const filterByDate = (itemDateStr: Date) => {
        const itemDate = new Date(itemDateStr);
        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;
        return true;
    };

    const periodBillings = billings.filter(b => filterByDate(b.settledAt));
    const periodDebtPayments = debtPayments.filter(p => filterByDate(p.paidAt));
    const periodExpenses = expenses.filter(e => filterByDate(e.date));

    // Calculate debt origins to proportionally distribute debt payments
    const customerDebtOrigins = customers.reduce((acc, customer) => {
        const customerBillings = billings.filter(b => b.customerId === customer.id && b.valorDebitoNegativo);
        const origins = { mesa: 0, jukebox: 0, total: 0 };
        customerBillings.forEach(b => {
            if (b.equipmentType === 'mesa') origins.mesa += b.valorDebitoNegativo || 0;
            if (b.equipmentType === 'jukebox') origins.jukebox += b.valorDebitoNegativo || 0;
        });
        origins.total = origins.mesa + origins.jukebox;
        if (origins.total > 0) {
            acc[customer.id] = origins;
        }
        return acc;
    }, {} as Record<string, { mesa: number, jukebox: number, total: number }>);
    
    let debtPaymentsRevenueMesaDinheiro = 0;
    let debtPaymentsRevenueMesaPix = 0;
    let debtPaymentsRevenueJukeboxDinheiro = 0;
    let debtPaymentsRevenueJukeboxPix = 0;

    periodDebtPayments.forEach(p => {
        const origins = customerDebtOrigins[p.customerId];
        if (origins && origins.total > 0) {
            const mesaProportion = origins.mesa / origins.total;
            const jukeboxProportion = origins.jukebox / origins.total;

            const mesaAmount = p.amountPaid * mesaProportion;
            const jukeboxAmount = p.amountPaid * jukeboxProportion;

            if (p.paymentMethod === 'dinheiro') {
                debtPaymentsRevenueMesaDinheiro += mesaAmount;
                debtPaymentsRevenueJukeboxDinheiro += jukeboxAmount;
            } else { // pix
                debtPaymentsRevenueMesaPix += mesaAmount;
                debtPaymentsRevenueJukeboxPix += jukeboxAmount;
            }
        }
    });
    
    // Filtered Billings & Expenses by Category
    const periodMesaBillings = periodBillings.filter(b => b.equipmentType === 'mesa');
    const periodJukeboxBillings = periodBillings.filter(b => b.equipmentType === 'jukebox');
    const periodGruaBillings = periodBillings.filter(b => b.equipmentType === 'grua');
    
    const periodExpensesMesa = periodExpenses.filter(e => e.category === 'mesa').reduce((sum, e) => sum + e.amount, 0);
    const periodExpensesJukebox = periodExpenses.filter(e => e.category === 'jukebox').reduce((sum, e) => sum + e.amount, 0);
    const periodExpensesGrua = periodExpenses.filter(e => e.category === 'grua').reduce((sum, e) => sum + e.amount, 0);


    // Revenue by Equipment (Cash + Pix) including debt payments
    const revenueMesaDinheiro = periodMesaBillings.reduce((sum, b) => sum + (b.valorPagoDinheiro || 0), 0) + debtPaymentsRevenueMesaDinheiro;
    const revenueMesaPix = periodMesaBillings.reduce((sum, b) => sum + (b.valorPagoPix || 0), 0) + debtPaymentsRevenueMesaPix;
    const revenueMesaTotal = revenueMesaDinheiro + revenueMesaPix;
    
    const revenueJukeboxDinheiro = periodJukeboxBillings.reduce((sum, b) => sum + (b.valorPagoDinheiro || 0), 0) + debtPaymentsRevenueJukeboxDinheiro;
    const revenueJukeboxPix = periodJukeboxBillings.reduce((sum, b) => sum + (b.valorPagoPix || 0), 0) + debtPaymentsRevenueJukeboxPix;
    const revenueJukeboxTotal = revenueJukeboxDinheiro + revenueJukeboxPix;

    // Detailed Grua Stats
    const revenueGruaPix = periodGruaBillings.reduce((sum, b) => sum + (b.recebimentoPix || 0), 0);
    const revenueGruaEspecie = periodGruaBillings.reduce((sum, b) => sum + (b.recebimentoEspecie || 0), 0);
    const totalAluguelPagoGrua = periodGruaBillings.reduce((sum, b) => sum + (b.aluguelValor || 0), 0);
    const revenueGruaFirma = periodGruaBillings.reduce((sum, b) => sum + b.valorTotal, 0);
    
    const totalDebtPaymentsReceived = periodDebtPayments.reduce((sum, p) => sum + p.amountPaid, 0);
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    return {
      revenueMesaDinheiro,
      revenueMesaPix,
      revenueMesaTotal,
      revenueJukeboxDinheiro,
      revenueJukeboxPix,
      revenueJukeboxTotal,
      revenueGruaPix,
      revenueGruaEspecie,
      revenueGruaFirma,
      totalAluguelPagoGrua,
      totalDebtPaymentsReceived,
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
    const data = stats.periodMesaBillings;
    const totalDinheiro = stats.revenueMesaDinheiro;
    const totalPix = stats.revenueMesaPix;
    const totalCaixa = stats.revenueMesaTotal;
    const customerMap = new Map<string, Customer>(customers.map(c => [c.id, c]));

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
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .summary-card { padding: 12px; border-radius: 8px; border: 1px solid #ddd; background-color: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .summary-card .label { display: block; font-size: 9pt; color: #555; margin-bottom: 4px; font-weight: bold; text-transform: uppercase; }
        .summary-card .value { display: block; font-size: 15pt; font-weight: bold; font-family: 'Courier New', monospace; }

        .summary-card--dinheiro { background-color: #e0f2fe !important; border-color: #7dd3fc !important; }
        .summary-card--dinheiro .value { color: #0369a1 !important; }
        .summary-card--pix { background-color: #ecfdf5 !important; border-color: #6ee7b7 !important; }
        .summary-card--pix .value { color: #047857 !important; }
        .summary-card--total { background-color: #f0fdf4 !important; border-color: #86efac !important; }
        .summary-card--total .value { color: #166534 !important; }
        .summary-card--despesa { background-color: #fee2e2 !important; border-color: #fca5a5 !important; }
        .summary-card--despesa .value { color: #b91c1c !important; }
        .summary-card--lucro { background-color: #dcfce7 !important; border-color: #4ade80 !important; grid-column: span 2; }
        .summary-card--lucro .value { color: #15803d !important; font-size: 18pt; }
        .summary-card--info { background-color: #f1f5f9 !important; border-color: #cbd5e1 !important; grid-column: span 3; }
        .summary-card--info .value { color: #475569 !important; }
      </style>
      <h3>Receitas - Mesas de Sinuca</h3>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th class="text-left">Cliente</th>
            <th class="text-left">Cidade</th>
            <th class="currency">Rel. Ant.</th>
            <th class="currency">Rel. Atual</th>
            <th class="currency">Jogadas</th>
            <th>Recebido</th>
            <th class="currency">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${data.length > 0 ? data.flatMap(b => {
                const customer = customerMap.get(b.customerId);
                const cidade = customer ? customer.cidade : 'N/A';
                const baseRowParts = `
                    <td>${new Date(b.settledAt).toLocaleDateString('pt-BR')}</td>
                    <td class="text-left">${b.customerName}</td>
                    <td class="text-left">${cidade}</td>
                    <td class="currency">${b.relogioAnterior}</td>
                    <td class="currency">${b.relogioAtual}</td>
                    <td class="currency">${b.partidasJogadas}</td>
                `;

                const rows = [];
                
                if (b.valorPagoDinheiro && b.valorPagoDinheiro > 0) {
                    rows.push(`<tr>${baseRowParts}<td>Dinheiro</td><td class="currency">R$ ${b.valorPagoDinheiro.toFixed(2).replace('.', ',')}</td></tr>`);
                }
                if (b.valorPagoPix && b.valorPagoPix > 0) {
                    rows.push(`<tr>${baseRowParts}<td>PIX</td><td class="currency">R$ ${b.valorPagoPix.toFixed(2).replace('.', ',')}</td></tr>`);
                }
                
                if (rows.length === 0 && b.valorTotal === 0 && b.paymentMethod !== 'debito_negativo') {
                    const paymentMethodDisplay = {pix: 'PIX', dinheiro: 'Dinheiro', misto: 'N/A'}[b.paymentMethod] || 'N/A';
                    rows.push(`<tr>${baseRowParts}<td>${paymentMethodDisplay}</td><td class="currency">R$ 0,00</td></tr>`);
                }

                return rows;
            }).join('') : '<tr><td colspan="8" class="no-records">Nenhuma cobrança no período.</td></tr>'}
        </tbody>
      </table>

      <div class="summary-section">
        <h3>Fechamento Financeiro</h3>
        <div class="summary-grid">
            <div class="summary-card summary-card--dinheiro">
                <span class="label">Total Recebido (Dinheiro)</span>
                <span class="value">R$ ${totalDinheiro.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="summary-card summary-card--pix">
                <span class="label">Total Recebido (PIX)</span>
                <span class="value">R$ ${totalPix.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="summary-card summary-card--total">
                <span class="label">Total Geral (Caixa)</span>
                <span class="value">R$ ${totalCaixa.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="summary-card summary-card--despesa">
                <span class="label">(-) Total Despesas (Mesas)</span>
                <span class="value">- R$ ${stats.periodExpensesMesa.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="summary-card summary-card--lucro">
                <span class="label">(=) Lucro Líquido</span>
                <span class="value">R$ ${(totalCaixa - stats.periodExpensesMesa).toFixed(2).replace('.', ',')}</span>
            </div>
             <div class="summary-card summary-card--info">
                <span class="label">Depósito (Informativo)</span>
                <span class="value">R$ ${deposito.toFixed(2).replace('.', ',')}</span>
            </div>
        </div>
      </div>
    `;
    printReport('Relatório de Mesas de Sinuca', content);
    setIsMesaReportModalOpen(false);
  }, [stats, printReport, customers]);

  const handlePrintJukeboxReport = useCallback((deposito: number) => {
    const data = stats.periodJukeboxBillings;
    const totalDinheiro = stats.revenueJukeboxDinheiro;
    const totalPix = stats.revenueJukeboxPix;
    const totalCaixa = stats.revenueJukeboxTotal;
    const customerMap = new Map<string, Customer>(customers.map(c => [c.id, c]));

    const content = `
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10pt; color: #333; }
        @page { size: A4 landscape; margin: 15mm; }
        .header { text-align: center; margin-bottom: 20px; }
        h3 { text-align: left; font-size: 14pt; color: #333; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 0 auto 20px auto; font-size: 10pt; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: center; }
        th { background-color: #fdf2f8; color: #a21caf; font-weight: bold; text-transform: uppercase; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .currency { text-align: right; font-family: 'Courier New', monospace; }
        .text-left { text-align: left; }
        .no-records { padding: 20px; text-align: center; color: #777; font-style: italic; }
        
        .summary-section { margin-top: 30px; text-align: left; page-break-inside: avoid; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .summary-card { padding: 12px; border-radius: 8px; border: 1px solid #ddd; background-color: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .summary-card .label { display: block; font-size: 9pt; color: #555; margin-bottom: 4px; font-weight: bold; text-transform: uppercase; }
        .summary-card .value { display: block; font-size: 15pt; font-weight: bold; font-family: 'Courier New', monospace; }

        .summary-card--dinheiro { background-color: #e0f2fe !important; border-color: #7dd3fc !important; }
        .summary-card--dinheiro .value { color: #0369a1 !important; }
        .summary-card--pix { background-color: #ecfdf5 !important; border-color: #6ee7b7 !important; }
        .summary-card--pix .value { color: #047857 !important; }
        .summary-card--total { background-color: #f0fdf4 !important; border-color: #86efac !important; }
        .summary-card--total .value { color: #166534 !important; }
        .summary-card--despesa { background-color: #fee2e2 !important; border-color: #fca5a5 !important; }
        .summary-card--despesa .value { color: #b91c1c !important; }
        .summary-card--lucro { background-color: #dcfce7 !important; border-color: #4ade80 !important; grid-column: span 2; }
        .summary-card--lucro .value { color: #15803d !important; font-size: 18pt; }
        .summary-card--info { background-color: #f1f5f9 !important; border-color: #cbd5e1 !important; grid-column: span 3; }
        .summary-card--info .value { color: #475569 !important; }
      </style>
      <h3>Receitas - Jukebox</h3>
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th class="text-left">Cliente</th>
            <th class="text-left">Cidade</th>
            <th class="currency">Rel. Ant.</th>
            <th class="currency">Rel. Atual</th>
            <th>Recebido</th>
            <th class="currency">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${data.length > 0 ? data.flatMap(b => {
            const customer = customerMap.get(b.customerId);
            const cidade = customer ? customer.cidade : 'N/A';
            const baseRowParts = `
                <td>${new Date(b.settledAt).toLocaleDateString('pt-BR')}</td>
                <td class="text-left">${b.customerName}</td>
                <td class="text-left">${cidade}</td>
                <td class="currency">${b.relogioAnterior}</td>
                <td class="currency">${b.relogioAtual}</td>
            `;

            const rows = [];
            
            if (b.valorPagoDinheiro && b.valorPagoDinheiro > 0) {
                rows.push(`<tr>${baseRowParts}<td>Dinheiro</td><td class="currency">R$ ${b.valorPagoDinheiro.toFixed(2).replace('.', ',')}</td></tr>`);
            }
            if (b.valorPagoPix && b.valorPagoPix > 0) {
                rows.push(`<tr>${baseRowParts}<td>PIX</td><td class="currency">R$ ${b.valorPagoPix.toFixed(2).replace('.', ',')}</td></tr>`);
            }
            
            if (rows.length === 0 && b.valorTotal === 0 && b.paymentMethod !== 'debito_negativo') {
                const paymentMethodDisplay = {pix: 'PIX', dinheiro: 'Dinheiro', misto: 'N/A'}[b.paymentMethod] || 'N/A';
                rows.push(`<tr>${baseRowParts}<td>${paymentMethodDisplay}</td><td class="currency">R$ 0,00</td></tr>`);
            }

            return rows;
          }).join('') : '<tr><td colspan="7" class="no-records">Nenhuma cobrança no período.</td></tr>'}
        </tbody>
      </table>
      
      <div class="summary-section">
        <h3>Fechamento Financeiro</h3>
        <div class="summary-grid">
            <div class="summary-card summary-card--dinheiro">
                <span class="label">Total Recebido (Dinheiro)</span>
                <span class="value">R$ ${totalDinheiro.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="summary-card summary-card--pix">
                <span class="label">Total Recebido (PIX)</span>
                <span class="value">R$ ${totalPix.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="summary-card summary-card--total">
                <span class="label">Total Geral (Caixa)</span>
                <span class="value">R$ ${totalCaixa.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="summary-card summary-card--despesa">
                <span class="label">(-) Total Despesas (Jukebox)</span>
                <span class="value">- R$ ${stats.periodExpensesJukebox.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="summary-card summary-card--lucro">
                <span class="label">(=) Lucro Líquido</span>
                <span class="value">R$ ${(totalCaixa - stats.periodExpensesJukebox).toFixed(2).replace('.', ',')}</span>
            </div>
             <div class="summary-card summary-card--info">
                <span class="label">Depósito (Informativo)</span>
                <span class="value">R$ ${deposito.toFixed(2).replace('.', ',')}</span>
            </div>
        </div>
      </div>
    `;
    printReport('Relatório de Jukebox', content);
    setIsJukeboxReportModalOpen(false);
  }, [stats, printReport, customers]);
  
  const handleGenerateCraneReport = useCallback((startDate: string, endDate: string, moneyDeposit: number) => {
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
    });

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
        .fin-grid { display: flex; justify-content: center; gap: 20px; width: 95%; margin: 40px auto 0 auto; page-break-inside: avoid; flex-wrap: wrap; }
        .fin-box { flex: 1; min-width: 160px; padding: 20px 10px; border-radius: 10px; border: 2px solid #ddd; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .fin-label { display: block; font-size: 10pt; text-transform: uppercase; margin-bottom: 10px; font-weight: bold; color: #444; }
        .fin-value { display: block; font-size: 16pt; font-weight: bold; font-family: monospace; }
        .bg-blue { background-color: #e3f2fd !important; border-color: #90caf9 !important; color: #0d47a1 !important; }
        .bg-red { background-color: #ffebee !important; border-color: #ef9a9a !important; color: #b71c1c !important; }
        .bg-green { background-color: #e8f5e9 !important; border-color: #a5d6a7 !important; color: #1b5e20 !important; }
        .bg-amber { background-color: #fff8e1 !important; border-color: #ffe082 !important; color: #ff6f00 !important; }
        .bg-purple { background-color: #f3e5f5 !important; border-color: #ce93d8 !important; color: #7b1fa2 !important; }
        body { font-family: Arial, sans-serif; font-size: 10pt; color: #333; text-align: center; margin-top: 20px; }
        @page { size: A4 landscape; margin: 10mm; }
        h1 { font-size: 18pt; margin-bottom: 5px; } h2 { font-size: 14pt; margin-bottom: 20px; padding-bottom: 5px; border-bottom: 2px solid #ccc; display: inline-block; }
        table { width: 95%; border-collapse: collapse; margin: 0 auto 20px auto; font-size: 10pt; }
        th, td { border: 1px solid #ccc; padding: 6px; text-align: center; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .currency { text-align: right; font-family: monospace; } .text-left { text-align: left; }
        .no-records { text-align: center; color: #777; font-style: italic; }
        tfoot td { font-weight: bold; border-top: 2px solid #333; background-color: #f9f9f9; }
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
              <td class="text-left">${b.customerName}</td> <td class="text-left">${cidade}</td> <td>${b.equipmentNumero}</td> <td class="currency">${b.relogioAnterior}</td> <td class="currency">${b.relogioAtual}</td> <td class="currency">${b.partidasJogadas}</td> <td class="currency">R$ ${(b.saldo || 0).toFixed(2).replace('.', ',')}</td> <td class="currency">R$ ${(b.aluguelValor || 0).toFixed(2).replace('.', ',')}</td> <td class="currency">R$ ${b.valorTotal.toFixed(2).replace('.', ',')}</td> <td class="currency">${b.reposicaoPelucia || 0}</td> <td class="currency">R$ ${(b.recebimentoEspecie || 0).toFixed(2).replace('.', ',')}</td> <td class="currency">R$ ${(b.recebimentoPix || 0).toFixed(2).replace('.', ',')}</td>
            </tr>
          `}).join('') : '<tr><td colspan="12" class="no-records">Nenhuma cobrança de grua no período selecionado.</td></tr>'}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="6" class="text-left"><strong>TOTAIS</strong></td>
            <td class="currency"><strong style="color: #0d47a1;">R$ ${totalSaldoBruto.toFixed(2).replace('.', ',')}</strong></td>
            <td class="currency"><strong style="color: #b71c1c;">R$ ${totalAluguelCliente.toFixed(2).replace('.', ',')}</strong></td>
            <td class="currency"><strong style="color: #1b5e20;">R$ ${totalValorFirma.toFixed(2).replace('.', ',')}</strong></td>
            <td class="currency"><strong>${totalReposicao}</strong></td>
            <td class="currency"><strong style="color: #0369a1;">R$ ${totalEspecie.toFixed(2).replace('.', ',')}</strong></td>
            <td class="currency"><strong style="color: #7b1fa2;">R$ ${totalPix.toFixed(2).replace('.', ',')}</strong></td>
          </tr>
        </tfoot>
      </table>

      <h3 style="margin-top: 40px; margin-bottom: 10px;">Fechamento Financeiro</h3>
      <div class="fin-grid">
          <div class="fin-box bg-blue"> <span class="fin-label">Total Entrada (Firma)</span> <span class="fin-value">R$ ${totalValorFirma.toFixed(2).replace('.', ',')}</span> </div>
          <div class="fin-box bg-red"> <span class="fin-label">(-) Despesas (Gruas)</span> <span class="fin-value">R$ ${reportExpenses.toFixed(2).replace('.', ',')}</span> </div>
          <div class="fin-box bg-green"> <span class="fin-label">(=) Saldo Final</span> <span class="fin-value">R$ ${saldoFinal.toFixed(2).replace('.', ',')}</span> </div>
          <div class="fin-box bg-purple"> <span class="fin-label">Total PIX</span> <span class="fin-value">R$ ${totalPix.toFixed(2).replace('.', ',')}</span> </div>
          <div class="fin-box bg-amber"> <span class="fin-label">Depósito (Info)</span> <span class="fin-value">R$ ${moneyDeposit.toFixed(2).replace('.', ',')}</span> </div>
      </div>
    `;
    
    const formattedStart = new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR');
    const formattedEnd = new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR');
    
    printReport('Relatório de Gruas de Pelúcia', content, `${formattedStart} a ${formattedEnd}`);
    setIsCraneReportModalOpen(false);
  }, [billings, customers, expenses, printReport]);

  const handlePrintDebtReport = useCallback(() => {
    const content = `
      <table>
        <thead><tr><th>Data</th><th class="text-left">Cliente</th><th>Pgto</th><th class="currency">Valor Pago</th></tr></thead>
        <tbody>
          ${stats.periodDebtPayments.length > 0 ? stats.periodDebtPayments.map(p => `
            <tr>
              <td>${new Date(p.paidAt).toLocaleDateString('pt-BR')}</td>
              <td class="text-left">${p.customerName}</td>
              <td>${p.paymentMethod}</td>
              <td class="currency">R$ ${p.amountPaid.toFixed(2).replace('.', ',')}</td>
            </tr>
          `).join('') : '<tr><td colspan="4" class="no-records">Nenhum pagamento de dívida no período.</td></tr>'}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" class="text-left"><strong>Total Recebido</strong></td>
            <td class="currency"><strong>R$ ${stats.totalDebtPaymentsReceived.toFixed(2).replace('.', ',')}</strong></td>
          </tr>
        </tfoot>
      </table>
    `;
    printReport('Relatório de Pagamento de Dívidas', content);
  }, [stats, printReport]);

  const handlePrintExpenseReport = useCallback(() => {
    const content = `
      <table>
        <thead><tr><th>Data</th><th class="text-left">Descrição</th><th class="currency">Valor</th></tr></thead>
        <tbody>
          ${stats.periodExpenses.length > 0 ? stats.periodExpenses.map(e => `
            <tr>
              <td>${new Date(e.date).toLocaleDateString('pt-BR')}</td>
              <td class="text-left">${e.description}</td>
              <td class="currency">R$ ${e.amount.toFixed(2).replace('.', ',')}</td>
            </tr>
          `).join('') : '<tr><td colspan="3" class="no-records">Nenhuma despesa no período.</td></tr>'}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" class="text-left"><strong>Total de Despesas</strong></td>
            <td class="currency"><strong>R$ ${stats.totalExpenses.toFixed(2).replace('.', ',')}</strong></td>
          </tr>
        </tfoot>
      </table>
    `;
    printReport('Relatório de Despesas', content);
  }, [stats, printReport]);
  
  const handleGenerateSlips = (selectedCustomers: Customer[]) => {
      // 1. Sort customers by city, then by name for a consistent, grouped order.
      const sortedCustomers = [...selectedCustomers].sort((a: Customer, b: Customer) => {
          const cityComparison = a.cidade.localeCompare(b.cidade);
          if (cityComparison !== 0) {
              return cityComparison;
          }
          return a.name.localeCompare(b.name);
      });

      const slips: { customer: Customer; equipment: Equipment; lastBillingAmount: number | null; }[] = [];
      
      // 2. Iterate through the sorted customers to generate slips.
      sortedCustomers.forEach(customer => {
          // Filter for relevant equipment and sort by number for consistency
          const relevantEquipment = customer.equipment
              .filter(equipment => equipment.type === 'mesa' || equipment.type === 'jukebox')
              .sort((a, b) => (a.numero || '').localeCompare(b.numero || ''));

          relevantEquipment.forEach(equipment => {
              const lastBilling = billings
                  .filter(b => b.customerId === customer.id && b.equipmentId === equipment.id)
                  .sort((a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime())
                  [0];
              
              const lastBillingAmount = lastBilling ? (lastBilling.valorTotal - (lastBilling.valorDebitoNegativo || 0)) : null;

              slips.push({ customer, equipment, lastBillingAmount });
          });
      });
      
      setSlipsToPrint(slips);
      setIsCustomerSelectionOpen(false);
  };
  
    const handlePrintThermalReport = useCallback(() => {
        const start = dateRange.start ? new Date(dateRange.start + 'T00:00:00').toLocaleDateString('pt-BR') : 'Início';
        const end = dateRange.end ? new Date(dateRange.end + 'T00:00:00').toLocaleDateString('pt-BR') : 'Fim';

        const allBillings = [
            ...stats.periodMesaBillings,
            ...stats.periodJukeboxBillings,
            ...stats.periodGruaBillings,
        ].sort((a, b) => new Date(a.settledAt).getTime() - new Date(b.settledAt).getTime());
        
        // FIX: Explicitly type the Map to ensure correct type inference for `customer`.
        const customerMap = new Map<string, Customer>(customers.map(c => [c.id, c]));

        let reportText = `*Relatorio de Caixa*\n`;
        reportText += `Periodo: ${start} a ${end}\n`;
        reportText += `--------------------------------\n\n`;

        allBillings.forEach(b => {
            const customer = customerMap.get(b.customerId);
            reportText += `Cliente: ${b.customerName}\n`;
            if (customer) {
                reportText += `Cidade: ${customer.cidade}\n`;
            }

            const valorFirma = (b.equipmentType === 'grua') 
                ? b.valorTotal 
                : b.valorTotal - (b.valorDebitoNegativo || 0);
            
            reportText += `Valor Firma: R$ ${valorFirma.toFixed(2)}\n`;
            
            reportText += `Pagamento:\n`;
            if (b.equipmentType === 'grua') {
                if ((b.recebimentoEspecie || 0) > 0) reportText += ` - Dinheiro: R$ ${b.recebimentoEspecie.toFixed(2)}\n`;
                if ((b.recebimentoPix || 0) > 0) reportText += ` - PIX: R$ ${b.recebimentoPix.toFixed(2)}\n`;
            } else {
                if ((b.valorPagoDinheiro || 0) > 0) reportText += ` - Dinheiro: R$ ${b.valorPagoDinheiro.toFixed(2)}\n`;
                if ((b.valorPagoPix || 0) > 0) reportText += ` - PIX: R$ ${b.valorPagoPix.toFixed(2)}\n`;
                if ((b.valorDebitoNegativo || 0) > 0) reportText += ` - Negativo: R$ ${b.valorDebitoNegativo.toFixed(2)}\n`;
            }
            reportText += `--------------------------------\n`;
        });
        
        if (stats.periodDebtPayments.length > 0) {
            reportText += `\n*Pagamentos de Dividas Avulsas*\n\n`;
            stats.periodDebtPayments.forEach(p => {
                reportText += `Cliente: ${p.customerName}\n`;
                reportText += `Valor Pago: R$ ${p.amountPaid.toFixed(2)}\n`;
                reportText += `Metodo: ${p.paymentMethod.toUpperCase()}\n`;
                reportText += `--------------------------------\n`;
            });
        }
        
        const totalDinheiro = stats.revenueMesaDinheiro + stats.revenueJukeboxDinheiro + stats.revenueGruaEspecie;
        const totalPix = stats.revenueMesaPix + stats.revenueJukeboxPix + stats.revenueGruaPix;
        const totalNegativo = allBillings.reduce((sum, b) => sum + (b.valorDebitoNegativo || 0), 0);

        reportText += `\n*RESUMO DO PERIODO*\n`;
        reportText += `--------------------------------\n`;
        reportText += `Total Entradas (Dinheiro): R$ ${totalDinheiro.toFixed(2)}\n`;
        reportText += `Total Entradas (PIX): R$ ${totalPix.toFixed(2)}\n`;
        reportText += `Total Divida Gerada (Negativo): R$ ${totalNegativo.toFixed(2)}\n`;
        reportText += `--------------------------------\n`;
        reportText += `*Total em Caixa (Dinheiro + PIX): R$ ${(totalDinheiro + totalPix).toFixed(2)}*\n`;
        
        onThermalPrint('Relatório de Caixa', reportText);
    }, [dateRange, stats, customers, onThermalPrint]);


  const PrintButton = ({ onClick, label, colorClass, className }: { onClick: () => void, label: string, colorClass: string, className?: string }) => (
     <div className={`mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50 ${className}`}>
        <button
            onClick={onClick}
            className={`w-full inline-flex items-center justify-center gap-2 text-white font-bold py-2 px-3 rounded-md transition-colors ${colorClass}`}
        >
            <PrinterIcon className="w-4 h-4" />
            <span>{label}</span>
        </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader 
        title="Relatórios"
        subtitle="Análise detalhada do desempenho financeiro."
      />
      
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 mb-8 flex flex-wrap items-center gap-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Selecione o Período (Geral):</h3>
        <input name="start" type="date" value={dateRange.start} onChange={handleDateChange} className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <span className="text-slate-500 dark:text-slate-400">até</span>
        <input name="end" type="date" value={dateRange.end} onChange={handleDateChange} className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <InfoCard title="Desempenho: Mesas de Sinuca" icon={<BilliardIcon className="w-6 h-6 text-cyan-500" />}>
            <InfoRow label="Receita (Dinheiro)" value={`R$ ${stats.revenueMesaDinheiro.toFixed(2).replace('.', ',')}`} valueColor="text-sky-600 dark:text-sky-400" />
            <InfoRow label="Receita (PIX)" value={`R$ ${stats.revenueMesaPix.toFixed(2).replace('.', ',')}`} valueColor="text-emerald-600 dark:text-emerald-400" />
            <InfoRow label="Despesas" value={`R$ ${stats.periodExpensesMesa.toFixed(2).replace('.', ',')}`} valueColor="text-red-600 dark:text-red-400" />
            <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-700/50">
                <InfoRow label="Lucro Líquido" value={`R$ ${(stats.revenueMesaTotal - stats.periodExpensesMesa).toFixed(2).replace('.', ',')}`} valueColor="text-green-600 dark:text-green-400 text-lg" />
            </div>
            <PrintButton onClick={() => setIsMesaReportModalOpen(true)} label="Imprimir Relatório de Mesas" colorClass="bg-cyan-600 hover:bg-cyan-500" />
        </InfoCard>

        <InfoCard title="Desempenho: Jukebox" icon={<JukeboxIcon className="w-6 h-6 text-fuchsia-500" />}>
            <InfoRow label="Receita (Dinheiro)" value={`R$ ${stats.revenueJukeboxDinheiro.toFixed(2).replace('.', ',')}`} valueColor="text-sky-600 dark:text-sky-400" />
            <InfoRow label="Receita (PIX)" value={`R$ ${stats.revenueJukeboxPix.toFixed(2).replace('.', ',')}`} valueColor="text-emerald-600 dark:text-emerald-400" />
            <InfoRow label="Despesas" value={`R$ ${stats.periodExpensesJukebox.toFixed(2).replace('.', ',')}`} valueColor="text-red-600 dark:text-red-400" />
            <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-700/50">
                <InfoRow label="Lucro Líquido" value={`R$ ${(stats.revenueJukeboxTotal - stats.periodExpensesJukebox).toFixed(2).replace('.', ',')}`} valueColor="text-green-600 dark:text-green-400 text-lg" />
            </div>
            <PrintButton onClick={() => setIsJukeboxReportModalOpen(true)} label="Imprimir Relatório de Jukebox" colorClass="bg-fuchsia-600 hover:bg-fuchsia-500" />
        </InfoCard>

         <InfoCard title="Desempenho: Gruas" icon={<CraneIcon className="w-6 h-6 text-orange-500" />}>
            <InfoRow label="Receita Bruta (Dinheiro)" value={`R$ ${stats.revenueGruaEspecie.toFixed(2).replace('.', ',')}`} valueColor="text-sky-600 dark:text-sky-400" />
            <InfoRow label="Receita Bruta (PIX)" value={`R$ ${stats.revenueGruaPix.toFixed(2).replace('.', ',')}`} valueColor="text-emerald-600 dark:text-emerald-400" />
            <InfoRow label="Aluguel Pago (p/ Cliente)" value={`- R$ ${stats.totalAluguelPagoGrua.toFixed(2).replace('.', ',')}`} valueColor="text-amber-600 dark:text-amber-400" />
            <InfoRow label="Receita (Firma)" value={`R$ ${stats.revenueGruaFirma.toFixed(2).replace('.', ',')}`} valueColor="text-lime-600 dark:text-lime-400" />
            <InfoRow label="Despesas" value={`- R$ ${stats.periodExpensesGrua.toFixed(2).replace('.', ',')}`} valueColor="text-red-600 dark:text-red-400" />
            <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-700/50">
                <InfoRow label="Lucro Líquido" value={`R$ ${(stats.revenueGruaFirma - stats.periodExpensesGrua).toFixed(2).replace('.', ',')}`} valueColor="text-green-600 dark:text-green-400 text-lg" />
            </div>
            <PrintButton onClick={() => setIsCraneReportModalOpen(true)} label="Imprimir Relatório de Gruas" colorClass="bg-orange-600 hover:bg-orange-500" />
        </InfoCard>

        <InfoCard title="Pagamentos de Dívidas" icon={<CurrencyDollarIcon className="w-6 h-6 text-green-500" />}>
            <InfoRow label="Total Recebido no Período" value={`R$ ${stats.totalDebtPaymentsReceived.toFixed(2).replace('.', ',')}`} valueColor="text-green-600 dark:text-green-400" />
             <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
                Estes valores foram distribuídos e já estão incluídos no desempenho das Mesas e Jukeboxes.
            </p>
            <PrintButton onClick={handlePrintDebtReport} label="Imprimir Relatório de Dívidas" colorClass="bg-green-600 hover:bg-green-500" />
        </InfoCard>
        
        <InfoCard title="Despesas do Período" icon={<CalculatorIcon className="w-6 h-6 text-red-500" />}>
            <InfoRow label="Total Gasto" value={`R$ ${stats.totalExpenses.toFixed(2).replace('.', ',')}`} valueColor="text-red-600 dark:text-red-400" />
            <PrintButton onClick={handlePrintExpenseReport} label="Imprimir Relatório de Despesas" colorClass="bg-red-600 hover:bg-red-500" />
        </InfoCard>

        <InfoCard title="Ferramentas de Impressão" icon={<DocumentDuplicateIcon className="w-6 h-6 text-slate-500" />}>
            <p className="text-sm text-slate-500 dark:text-slate-400 -mt-2 mb-4">Gere documentos úteis para o trabalho em campo.</p>
            <PrintButton 
                onClick={() => setIsCustomerSelectionOpen(true)}
                label="Imprimir Talões de Cobrança"
                colorClass="bg-gray-600 hover:bg-gray-500"
                className="mt-0 pt-0 border-none"
            />
            <PrintButton 
                onClick={handlePrintThermalReport}
                label="Relatório de Caixa (Térmica)"
                colorClass="bg-gray-600 hover:bg-gray-500"
            />
        </InfoCard>
      </div>

      <MesaReportModal
        isOpen={isMesaReportModalOpen}
        onClose={() => setIsMesaReportModalOpen(false)}
        onConfirm={handlePrintMesaReport}
      />
      <JukeboxReportModal
        isOpen={isJukeboxReportModalOpen}
        onClose={() => setIsJukeboxReportModalOpen(false)}
        onConfirm={handlePrintJukeboxReport}
      />
      <CraneReportModal 
        isOpen={isCraneReportModalOpen}
        onClose={() => setIsCraneReportModalOpen(false)}
        onConfirm={handleGenerateCraneReport}
      />
      <CustomerSelectionForSlipsModal
        isOpen={isCustomerSelectionOpen}
        onClose={() => setIsCustomerSelectionOpen(false)}
        customers={customers}
        onConfirm={handleGenerateSlips}
      />
      {slipsToPrint && (
          <PrintableSlipsModal
              slips={slipsToPrint}
              onClose={() => setSlipsToPrint(null)}
          />
      )}
    </div>
  );
};

export default RelatoriosView;