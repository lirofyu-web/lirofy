// App.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ReactDOMServer from 'react-dom/server';
import { Customer, Billing, Expense, DebtPayment, Equipment, Warning } from './types';

import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import ClientesView from './views/ClientesView';
import CobrancasView from './views/CobrancasView';
import DespesasView from './views/DespesasView';
import EquipamentosView from './views/EquipamentosView';
import RotasView from './views/RotasView';
import RelatoriosView from './views/RelatoriosView';
import ConfiguracoesView from './views/ConfiguracoesView';
import Notification from './components/Notification';
import BottomNavBar from './components/BottomNavBar';
import MobileHeader from './components/MobileHeader';
import InstallPwaBanner from './components/InstallPwaBanner';
import CustomerSheet from './components/CustomerSheet';
import { PrinterIcon } from './components/icons/PrinterIcon';
import { generateBillingText, generateDebtText } from './utils/receiptGenerator';
import { applyThemeColors, defaultColors, AppThemeColors } from './utils/theme';
import FullScreenCustomerView from './components/FullScreenCustomerView';
import { sunmiPrinterService } from './utils/sunmiPrinter';
import { bluetoothPrinter } from './utils/bluetoothPrinter';
import { textToEscPos, generateTestPageCommands } from './utils/escpos';


// Modals
import BillingModal from './components/BillingModal';
import EditCustomerModal from './components/EditCustomerModal';
import DebtPaymentModal from './components/DebtPaymentModal';
import HistoryModal from './components/HistoryModal';
import ActionModal from './components/ActionModal';
import EquipmentSelectionModal from './components/EquipmentSelectionModal';
import ReceiptActionsModal from './components/ReceiptActionsModal';
import DebtReceiptActionsModal from './components/DebtReceiptActionsModal';
import ShareCustomerModal from './components/ShareCustomerModal';
import ReceiptModal from './components/ReceiptModal';
import DebtReceiptModal from './components/DebtReceiptModal';
import PrintableReceiptModal from './components/PrintableReceiptModal';
import LabelGenerationModal from './components/LabelGenerationModal';
import EditBillingModal from './components/EditBillingModal';
import PdfReceiptSheet from './components/PdfReceiptSheet';
import PdfDebtReceiptSheet from './components/PdfDebtReceiptSheet';
import SaveStatusIndicator from './components/SaveStatusIndicator';


export type View = 'DASHBOARD' | 'CLIENTES' | 'COBRANCAS' | 'EQUIPAMENTOS' | 'DESPESAS' | 'ROTAS' | 'RELATORIOS' | 'CONFIGURACOES';
export type Theme = 'light' | 'dark';

type NotificationState = {
  message: string;
  type: 'success' | 'error';
} | null;

const viewTitles: Record<View, string> = {
    'DASHBOARD': 'Dashboard',
    'CLIENTES': 'Clientes',
    'COBRANCAS': 'Cobranças',
    'EQUIPAMENTOS': 'Equipamentos',
    'DESPESAS': 'Despesas',
    'ROTAS': 'Rotas',
    'RELATORIOS': 'Relatórios',
    'CONFIGURACOES': 'Configurações',
};

const PrintPreviewOverlay: React.FC<{ customer: Customer; onCancel: () => void }> = ({ customer, onCancel }) => {
  const handlePrint = () => window.print();
  useEffect(() => {
    window.addEventListener('afterprint', onCancel);
    return () => window.removeEventListener('afterprint', onCancel);
  }, [onCancel]);
  return (
    <div className="print-overlay fixed inset-0 bg-slate-200 dark:bg-slate-900 z-[100] flex flex-col">
      <header className="print-controls no-print sticky top-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 shadow-md flex justify-center gap-4 flex-shrink-0">
        <button onClick={onCancel} className="bg-slate-500 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-400">Cancelar</button>
        <button onClick={handlePrint} className="bg-[var(--color-primary)] text-[var(--color-primary-text)] font-bold py-2 px-6 rounded-md hover:bg-[var(--color-primary-hover)] flex items-center gap-2"><PrinterIcon className="w-5 h-5" />Salvar PDF / Imprimir</button>
      </header>
      <div className="print-content overflow-y-auto flex-grow"><CustomerSheet customer={customer} /></div>
    </div>
  );
};

const App: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [billings, setBillings] = useState<Billing[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
    const [warnings, setWarnings] = useState<Warning[]>([]);
    
    const [currentView, setCurrentView] = useState<View>(() => (localStorage.getItem('lastActiveView') as View) || 'DASHBOARD');
    
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState<NotificationState>(null);
    const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [btPrinterState, setBtPrinterState] = useState({ isConnected: false, deviceName: null as string | null });


    // Theme and PWA states
    const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallBannerVisible, setIsInstallBannerVisible] = useState(true); // Default to true

    // Modal States
    const [billingModalState, setBillingModalState] = useState<{ customer: Customer; equipment: Equipment } | null>(null);
    const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
    const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
    const [payingDebtCustomer, setPayingDebtCustomer] = useState<Customer | null>(null);
    const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
    const [sharingCustomer, setSharingCustomer] = useState<Customer | null>(null);
    const [receiptActionsModalState, setReceiptActionsModalState] = useState<{ billing: Billing; isProvisional: boolean } | null>(null);
    const [debtReceiptActionsModalState, setDebtReceiptActionsModalState] = useState<{ debtPayment: DebtPayment, customer: Customer } | null>(null);
    const [receiptModalState, setReceiptModalState] = useState<{ billing: Billing, isProvisional: boolean } | null>(null);
    const [debtReceiptModalState, setDebtReceiptModalState] = useState<DebtPayment | null>(null);
    const [screenshotReceipt, setScreenshotReceipt] = useState<{ type: 'billing' | 'debt', data: Billing | DebtPayment, isProvisional?: boolean } | null>(null);
    const [equipmentSelectionCustomer, setEquipmentSelectionCustomer] = useState<Customer | null>(null);
    const [focusedCustomer, setFocusedCustomer] = useState<Customer | null>(null);
    const [printingCustomer, setPrintingCustomer] = useState<Customer | null>(null);
    const [isLabelGenerationModalOpen, setIsLabelGenerationModalOpen] = useState(false);
    const [editingBilling, setEditingBilling] = useState<Billing | null>(null);
    
    // Handlers
    const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
    }, []);

    const saveData = useCallback(() => {
        try {
            localStorage.setItem('customers', JSON.stringify(customers));
            localStorage.setItem('billings', JSON.stringify(billings));
            localStorage.setItem('expenses', JSON.stringify(expenses));
            localStorage.setItem('debtPayments', JSON.stringify(debtPayments));
            localStorage.setItem('warnings', JSON.stringify(warnings));
            setIsDirty(false);
        } catch (error) {
            console.error("Failed to save data to localStorage", error);
            showNotification("Erro ao salvar dados. O armazenamento pode estar cheio.", "error");
        }
    }, [customers, billings, expenses, debtPayments, warnings, showNotification]);

    // Data loading and saving effects
    useEffect(() => {
      try {
        const parseWithDates = (key: string, dateFields: string[]) => {
            const data = localStorage.getItem(key);
            if (!data) return [];
            return JSON.parse(data).map((item: any) => {
                dateFields.forEach(field => {
                    if (item[field]) item[field] = new Date(item[field]);
                });
                return item;
            });
        };
        setCustomers(parseWithDates('customers', ['createdAt', 'lastVisitedAt']));
        setBillings(parseWithDates('billings', ['settledAt']));
        setExpenses(parseWithDates('expenses', ['date']));
        setDebtPayments(parseWithDates('debtPayments', ['paidAt']));
        setWarnings(parseWithDates('warnings', ['createdAt']));
        setLastBackupDate(localStorage.getItem('lastBackupDate'));
        
        const savedColors = localStorage.getItem('appThemeColors');
        applyThemeColors(savedColors ? JSON.parse(savedColors) : defaultColors);
      } catch (e) {
        console.error("Failed to load data from localStorage", e);
        showNotification("Erro ao carregar dados salvos.", "error");
      }
    }, []);
    
    useEffect(() => {
      const timeoutId = setTimeout(saveData, 500);
      return () => clearTimeout(timeoutId);
    }, [saveData]);
    
    useEffect(() => {
        localStorage.setItem('lastActiveView', currentView);
        document.title = `${viewTitles[currentView]} - Montanha Bilhar`;
    }, [currentView]);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // Bluetooth Printer State Management
    useEffect(() => {
        const updateBtState = () => {
            setBtPrinterState({
                isConnected: bluetoothPrinter.isConnected(),
                deviceName: bluetoothPrinter.deviceName
            });
        };
        // HACK: Use a custom event to update state when the singleton changes
        // This avoids complex state management libraries for this simple case.
        document.addEventListener('bt-status-change', updateBtState);
        updateBtState(); // Initial check
        return () => document.removeEventListener('bt-status-change', updateBtState);
    }, []);
    
    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const handleShareText = async (text: string, title: string) => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            const shareData = { title, text };
            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(text);
                showNotification('Recibo copiado! O compartilhamento não é suportado.', 'success');
            }
        } catch (error) {
            if ((error as DOMException).name !== 'AbortError') {
                console.error('Share API error:', error);
                showNotification(`Falha ao compartilhar: ${(error as Error).message}`, 'error');
            }
        } finally {
            setIsSharing(false);
        }
    };

    const handlePrintRawBt = async (text: string) => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            const shareData = { title: 'Imprimir Recibo via RawBT', text };
            if (navigator.share && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                showNotification('Pronto para imprimir no RawBT!', 'success');
            } else {
                showNotification('Seu navegador não suporta compartilhamento para impressão.', 'error');
            }
        } catch (error) {
            if ((error as DOMException).name !== 'AbortError') {
                console.error('Share API error for RawBT:', error);
                showNotification(`Falha ao compartilhar para impressão: ${(error as Error).message}`, 'error');
            }
        } finally {
            setIsSharing(false);
        }
    };
    
    const handlePrintPdf = useCallback((title: string, contentComponent: React.ReactElement) => {
        const tailwindUrl = "https://cdn.tailwindcss.com";
        const content = ReactDOMServer.renderToString(contentComponent);
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${title}</title>
                        <script src="${tailwindUrl}"></script>
                        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
                        <style>
                            body { font-family: 'Inter', sans-serif; background-color: #f1f5f9; }
                            @page { size: A4; margin: 0; }
                            @media print {
                                body { background-color: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            }
                        </style>
                    </head>
                    <body onafterprint="window.close()">
                        ${content}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            
            const printTimeout = setTimeout(() => {
                printWindow.print();
            }, 1000); 
            
            printWindow.onbeforeunload = () => {
                clearTimeout(printTimeout);
            };

        } else {
            showNotification("Por favor, habilite pop-ups para impressão.", "error");
        }
    }, [showNotification]);

    const handleDirectPrintBillingReceipt = (billing: Billing, isProvisional: boolean) => {
        setReceiptActionsModalState(null);
        handlePrintPdf(
            `${isProvisional ? 'Demonstrativo' : 'Recibo'} - ${billing.customerName}`, 
            <PdfReceiptSheet billing={billing} isProvisional={isProvisional} />
        );
    };

    const handleDirectPrintDebtReceipt = (debtPayment: DebtPayment) => {
        setDebtReceiptActionsModalState(null);
        handlePrintPdf(
            `Comprovante de Dívida - ${debtPayment.customerName}`, 
            <PdfDebtReceiptSheet debtPayment={debtPayment} />
        );
    };

    const handlePrintSunmiBillingReceipt = async (billing: Billing, isProvisional: boolean) => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            const text = generateBillingText(billing, isProvisional);
            await sunmiPrinterService.printReceipt(text);
            showNotification('Impresso com sucesso!', 'success');
        } catch (error) {
            showNotification(error instanceof Error ? error.message : 'Falha na impressão', 'error');
        } finally {
            setIsSharing(false);
            setReceiptActionsModalState(null);
        }
    };

    const handlePrintSunmiDebtReceipt = async (debtPayment: DebtPayment) => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            const text = generateDebtText(debtPayment);
            await sunmiPrinterService.printReceipt(text);
            showNotification('Impresso com sucesso!', 'success');
        } catch (error) {
            showNotification(error instanceof Error ? error.message : 'Falha na impressão', 'error');
        } finally {
            setIsSharing(false);
            setDebtReceiptActionsModalState(null);
        }
    };

    const handlePrintBluetooth = async (receiptText: string) => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            const commands = textToEscPos(receiptText);
            await bluetoothPrinter.print(commands);
            showNotification('Impresso com sucesso!', 'success');
        } catch (error) {
            showNotification(error instanceof Error ? error.message : 'Falha na impressão Bluetooth', 'error');
        } finally {
            setIsSharing(false);
            setReceiptActionsModalState(null);
            setDebtReceiptActionsModalState(null);
        }
    };

    const handlePrintBtBillingReceipt = (billing: Billing, isProvisional: boolean) => {
        const text = generateBillingText(billing, isProvisional);
        handlePrintBluetooth(text);
    };

    const handlePrintBtDebtReceipt = (debtPayment: DebtPayment) => {
        const text = generateDebtText(debtPayment);
        handlePrintBluetooth(text);
    };

    // Customer Handlers
    const handleAddCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'createdAt' | 'debtAmount' | 'lastVisitedAt'>) => {
        setIsSaving(true);
        const newCustomer: Customer = {
            ...customerData,
            id: uuidv4(),
            createdAt: new Date(),
            debtAmount: 0,
            lastVisitedAt: null
        };
        setCustomers(prev => [...prev, newCustomer]);
        setIsDirty(true);
        showNotification(`Cliente "${newCustomer.name}" adicionado com sucesso!`);
        setIsSaving(false);
    }, [showNotification]);

    const handleUpdateCustomer = useCallback(async (updatedCustomer: Customer) => {
        setIsSaving(true);
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
        setIsDirty(true);
        setEditCustomer(null);
        showNotification(`Cliente "${updatedCustomer.name}" atualizado!`);
        setIsSaving(false);
    }, [showNotification]);

    const handleConfirmDeleteCustomer = useCallback(() => {
        if (!deleteCustomer) return;
        setCustomers(prev => prev.filter(c => c.id !== deleteCustomer.id));
        setBillings(prev => prev.filter(b => b.customerId !== deleteCustomer.id));
        setDebtPayments(prev => prev.filter(p => p.customerId !== deleteCustomer.id));
        setWarnings(prev => prev.filter(w => w.customerId !== deleteCustomer.id));
        setIsDirty(true);
        showNotification(`Cliente "${deleteCustomer.name}" e todos os seus dados foram excluídos.`);
        setDeleteCustomer(null);
    }, [deleteCustomer, showNotification]);

    // Billing Handlers
    const handleSelectEquipmentForBilling = useCallback((customer: Customer) => {
        if (customer.equipment.length === 1) {
            setBillingModalState({ customer, equipment: customer.equipment[0] });
        } else {
            setEquipmentSelectionCustomer(customer);
        }
    }, []);

    const handleAddBilling = useCallback((billing: Billing) => {
        setBillings(prev => [...prev, billing]);
        setCustomers(prev => prev.map(c => {
            if (c.id === billing.customerId) {
                const updatedEquipment = c.equipment.map(e => e.id === billing.equipmentId ? { ...e, relogioAnterior: billing.relogioAtual } : e);
                return { ...c, debtAmount: c.debtAmount + (billing.valorDebitoNegativo || 0), lastVisitedAt: new Date(), equipment: updatedEquipment };
            }
            return c;
        }));
        setIsDirty(true);
        setBillingModalState(null);
        setReceiptActionsModalState({ billing, isProvisional: false });
    }, []);

    const handleUpdateBilling = useCallback((updatedBilling: Billing) => {
        const originalBilling = billings.find(b => b.id === updatedBilling.id);
        if (!originalBilling) return;

        const debtDifference = (updatedBilling.valorDebitoNegativo || 0) - (originalBilling.valorDebitoNegativo || 0);

        setBillings(prev => prev.map(b => b.id === updatedBilling.id ? updatedBilling : b));
        setIsDirty(true);

        if (debtDifference !== 0) {
            setCustomers(prev => prev.map(c => 
                c.id === updatedBilling.customerId 
                ? { ...c, debtAmount: Math.max(0, c.debtAmount + debtDifference) }
                : c
            ));
        }
        setEditingBilling(null);
        showNotification("Cobrança atualizada com sucesso!");
    }, [billings, showNotification]);
    
    const handleDeleteBilling = useCallback((billingId: string) => {
        const billingToDelete = billings.find(b => b.id === billingId);
        if (!billingToDelete) return;

        setBillings(prev => prev.filter(b => b.id !== billingId));
        setCustomers(prev => prev.map(c => {
            if (c.id === billingToDelete.customerId) {
                const updatedEquipment = c.equipment.map(e => e.id === billingToDelete.equipmentId ? { ...e, relogioAnterior: billingToDelete.relogioAnterior } : e);
                return { ...c, debtAmount: Math.max(0, c.debtAmount - (billingToDelete.valorDebitoNegativo || 0)), equipment: updatedEquipment };
            }
            return c;
        }));
        setIsDirty(true);
        showNotification("Cobrança excluída e dados revertidos.");
    }, [billings, showNotification]);

    const handleTriggerProvisionalReceipt = useCallback((billing: Billing, onComplete: () => void) => {
        setReceiptActionsModalState({ billing, isProvisional: true });
        onComplete();
    }, []);

    // Debt & Expense Handlers
    const handleAddDebtPayment = useCallback((amount: number, paymentMethod: 'pix' | 'dinheiro') => {
        if (!payingDebtCustomer) return;
        const newPayment: DebtPayment = { id: uuidv4(), customerId: payingDebtCustomer.id, customerName: payingDebtCustomer.name, amountPaid: amount, paidAt: new Date(), paymentMethod };
        setDebtPayments(prev => [...prev, newPayment]);
        setCustomers(prev => prev.map(c => c.id === payingDebtCustomer.id ? { ...c, debtAmount: Math.max(0, c.debtAmount - amount) } : c));
        setIsDirty(true);
        setPayingDebtCustomer(null);
        setDebtReceiptActionsModalState({ debtPayment: newPayment, customer: payingDebtCustomer });
    }, [payingDebtCustomer]);

    const handleAddExpense = useCallback((description: string, amount: number, category: Expense['category']) => {
        const newExpense: Expense = { id: uuidv4(), description, amount, date: new Date(), category };
        setExpenses(prev => [...prev, newExpense]);
        setIsDirty(true);
        showNotification("Despesa adicionada.");
    }, [showNotification]);
    
    const handleDeleteExpense = useCallback((expenseId: string) => {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
        setIsDirty(true);
        showNotification("Despesa excluída.");
    }, [showNotification]);
    
    // Warning Handlers
    const handleAddWarning = useCallback((customerId: string, message: string) => {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;
        const newWarning: Warning = { id: uuidv4(), customerId, customerName: customer.name, message, createdAt: new Date(), isResolved: false };
        setWarnings(prev => [...prev, newWarning]);
        setIsDirty(true);
        showNotification(`Aviso adicionado para ${customer.name}.`);
    }, [customers, showNotification]);

    const handleResolveWarning = useCallback((warningId: string) => {
        setWarnings(prev => prev.map(w => w.id === warningId ? { ...w, isResolved: true } : w));
        setIsDirty(true);
        showNotification("Aviso marcado como resolvido.");
    }, [showNotification]);
    
    const handleDeleteWarning = useCallback((warningId: string) => {
        setWarnings(prev => prev.filter(w => w.id !== warningId));
        setIsDirty(true);
        showNotification("Aviso excluído.");
    }, [showNotification]);

    // Data Management Handlers
    const handleExportData = useCallback(() => {
        const data = { customers, billings, expenses, debtPayments, warnings, version: 1 };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        a.download = `backup-montanha-bilhar-${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setLastBackupDate(new Date().toISOString());
        localStorage.setItem('lastBackupDate', new Date().toISOString());
        showNotification("Backup exportado com sucesso!");
    }, [customers, billings, expenses, debtPayments, warnings, showNotification]);

    const handleMergeData = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not text.");
                const importedData = JSON.parse(text);

                // Simple merge: Use a Map to update existing items or add new ones.
                const merge = (existing: any[], incoming: any[]) => {
                    const map = new Map(existing.map(item => [item.id, item]));
                    incoming.forEach(item => map.set(item.id, item));
                    return Array.from(map.values());
                };

                setCustomers(prev => merge(prev, importedData.customers || []));
                setBillings(prev => merge(prev, importedData.billings || []));
                setExpenses(prev => merge(prev, importedData.expenses || []));
                setDebtPayments(prev => merge(prev, importedData.debtPayments || []));
                setWarnings(prev => merge(prev, importedData.warnings || []));
                setIsDirty(true);
                
                showNotification("Dados importados e mesclados com sucesso!");
            } catch (error) {
                console.error("Error importing data:", error);
                showNotification("Erro ao importar arquivo. Verifique o formato.", "error");
            }
        };
        reader.readAsText(file);
    }, [showNotification]);

    const handleAddCustomerFromText = useCallback((text: string) => {
        try {
            const parsedData = JSON.parse(text);
            handleAddCustomer(parsedData); // Re-uses the add customer logic
        } catch (e) {
            showNotification("Texto inválido. Verifique o formato JSON.", "error");
        }
    }, [handleAddCustomer, showNotification]);

    const handleInstallPrompt = () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
            if (choiceResult.outcome === 'accepted') {
                showNotification('App instalado com sucesso!');
            }
            setDeferredPrompt(null);
            setIsInstallBannerVisible(false);
        });
    };
    
    const handleConnectBtPrinter = useCallback(async () => {
        const status = await bluetoothPrinter.connect();
        if (status === 'connected') {
            showNotification(`Impressora "${bluetoothPrinter.deviceName}" conectada!`, 'success');
        } else if (status === 'failed') {
            showNotification('Falha ao conectar. Verifique se a impressora está ligada e no alcance.', 'error');
        }
        document.dispatchEvent(new Event('bt-status-change'));
    }, [showNotification]);

    const handleDisconnectBtPrinter = useCallback(async () => {
        await bluetoothPrinter.disconnect();
        showNotification('Impressora desconectada.', 'success');
        document.dispatchEvent(new Event('bt-status-change'));
    }, [showNotification]);

    const handlePrintTestPage = useCallback(async () => {
        try {
            const commands = generateTestPageCommands();
            await bluetoothPrinter.print(commands);
            showNotification('Página de teste enviada!', 'success');
        } catch (e) {
            showNotification(e instanceof Error ? e.message : 'Erro ao imprimir.', 'error');
        }
    }, [showNotification]);
    
    const isSunmiAvailable = useMemo(() => sunmiPrinterService.isPrinterAvailable(), []);

    const handleSunmiPrintTestPage = useCallback(async () => {
        try {
            await sunmiPrinterService.printTestPage();
            showNotification('Página de teste enviada!', 'success');
        } catch (e) {
            showNotification(e instanceof Error ? e.message : 'Erro ao imprimir.', 'error');
        }
    }, [showNotification]);

    return (
        <div className={`flex h-full font-sans antialiased ${theme}`}>
            <Sidebar currentView={currentView} setView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8">
                <MobileHeader
                    title={viewTitles[currentView]}
                    onMenuClick={() => setIsSidebarOpen(true)}
                    deferredPrompt={deferredPrompt}
                    onInstallPrompt={handleInstallPrompt}
                />
                <div className="flex-grow">
                    {currentView === 'DASHBOARD' && <DashboardView billings={billings} expenses={expenses} customers={customers} debtPayments={debtPayments} warnings={warnings} onAddWarning={handleAddWarning} onResolveWarning={handleResolveWarning} onDeleteWarning={handleDeleteWarning} lastBackupDate={lastBackupDate} onNavigateToSettings={() => setCurrentView('CONFIGURACOES')} />}
                    {currentView === 'CLIENTES' && <ClientesView customers={customers} warnings={warnings} onAddCustomer={handleAddCustomer} isSaving={isSaving} showNotification={showNotification} onFocusCustomer={setFocusedCustomer} onBillCustomer={handleSelectEquipmentForBilling} onEditCustomer={setEditCustomer} onDeleteCustomer={setDeleteCustomer} onPayDebtCustomer={setPayingDebtCustomer} onHistoryCustomer={setHistoryCustomer} onShareCustomer={setSharingCustomer} />}
                    {currentView === 'COBRANCAS' && <CobrancasView billings={billings} customers={customers} onShowActions={(b) => setReceiptActionsModalState({billing: b, isProvisional: false})} onEditBilling={setEditingBilling} onDeleteBilling={handleDeleteBilling} onViewDetails={(b) => handleDirectPrintBillingReceipt(b, false)} />}
                    {currentView === 'EQUIPAMENTOS' && <EquipamentosView customers={customers} billings={billings} showNotification={showNotification} onOpenLabelGenerator={() => setIsLabelGenerationModalOpen(true)} />}
                    {currentView === 'DESPESAS' && <DespesasView expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} />}
                    {currentView === 'ROTAS' && <RotasView customers={customers} />}
                    {currentView === 'RELATORIOS' && <RelatoriosView customers={customers} billings={billings} expenses={expenses} debtPayments={debtPayments} />}
                    {currentView === 'CONFIGURACOES' && <ConfiguracoesView onExportData={handleExportData} onMergeData={handleMergeData} onAddCustomerFromText={handleAddCustomerFromText} theme={theme} setTheme={setTheme} showNotification={showNotification} deferredPrompt={deferredPrompt} onInstallPrompt={handleInstallPrompt} btPrinterStatus={btPrinterState} onConnectBtPrinter={handleConnectBtPrinter} onDisconnectBtPrinter={handleDisconnectBtPrinter} onPrintTestPage={handlePrintTestPage} isSunmiAvailable={isSunmiAvailable} onSunmiPrintTestPage={handleSunmiPrintTestPage} />}
                </div>
            </main>
            
            <SaveStatusIndicator isDirty={isDirty} />
            <Notification notification={notification} onClose={() => setNotification(null)} />
            <BottomNavBar currentView={currentView} setView={setCurrentView} />
            {deferredPrompt && isInstallBannerVisible && <InstallPwaBanner onInstall={handleInstallPrompt} onDismiss={() => setIsInstallBannerVisible(false)} />}
            
            {/* --- Modals --- */}
            {equipmentSelectionCustomer && <EquipmentSelectionModal isOpen={!!equipmentSelectionCustomer} onClose={() => setEquipmentSelectionCustomer(null)} customer={equipmentSelectionCustomer} onSelect={(equip) => { setBillingModalState({ customer: equipmentSelectionCustomer, equipment: equip }); setEquipmentSelectionCustomer(null); }} />}
            {billingModalState && <BillingModal isOpen={!!billingModalState} onClose={() => setBillingModalState(null)} onConfirm={handleAddBilling} customer={billingModalState.customer} equipment={billingModalState.equipment} onTriggerProvisionalReceiptAction={handleTriggerProvisionalReceipt} />}
            {editCustomer && <EditCustomerModal isOpen={!!editCustomer} onClose={() => setEditCustomer(null)} onConfirm={handleUpdateCustomer} customer={editCustomer} customers={customers} isSaving={isSaving} showNotification={showNotification} />}
            {payingDebtCustomer && <DebtPaymentModal isOpen={!!payingDebtCustomer} onClose={() => setPayingDebtCustomer(null)} onConfirm={handleAddDebtPayment} customer={payingDebtCustomer} />}
            {historyCustomer && <HistoryModal isOpen={!!historyCustomer} onClose={() => setHistoryCustomer(null)} customer={historyCustomer} billings={billings} debtPayments={debtPayments} />}
            {sharingCustomer && <ShareCustomerModal isOpen={!!sharingCustomer} onClose={() => setSharingCustomer(null)} customer={sharingCustomer} showNotification={showNotification} onPrintCustomer={setPrintingCustomer} />}
            {deleteCustomer && <ActionModal isOpen={!!deleteCustomer} onClose={() => setDeleteCustomer(null)} onConfirm={handleConfirmDeleteCustomer} title="Confirmar Exclusão" confirmText="Sim, Excluir"><p>Tem certeza que deseja excluir o cliente <strong>{deleteCustomer.name}</strong>? Todos os seus dados, incluindo histórico de cobranças e dívidas, serão permanentemente removidos. Esta ação não pode ser desfeita.</p></ActionModal>}
            {receiptActionsModalState && <ReceiptActionsModal isOpen={!!receiptActionsModalState} isSharing={isSharing} onClose={() => setReceiptActionsModalState(null)} billing={receiptActionsModalState.billing} isProvisional={receiptActionsModalState.isProvisional} showNotification={showNotification} onShare={async () => { if(isSharing || !receiptActionsModalState) return; const text = generateBillingText(receiptActionsModalState.billing, receiptActionsModalState.isProvisional); const title = `Comprovante - ${receiptActionsModalState.billing.customerName}`; await handleShareText(text, title); setReceiptActionsModalState(null); }} onViewReceipt={() => handleDirectPrintBillingReceipt(receiptActionsModalState.billing, receiptActionsModalState.isProvisional)} onPrintRawBt={async () => { if(isSharing || !receiptActionsModalState) return; const text = generateBillingText(receiptActionsModalState.billing, receiptActionsModalState.isProvisional); await handlePrintRawBt(text); setReceiptActionsModalState(null); }} onPrintSunmi={() => handlePrintSunmiBillingReceipt(receiptActionsModalState.billing, receiptActionsModalState.isProvisional)} onPrintBluetooth={() => handlePrintBtBillingReceipt(receiptActionsModalState.billing, receiptActionsModalState.isProvisional)} isBluetoothConnected={btPrinterState.isConnected} />}
            {debtReceiptActionsModalState && <DebtReceiptActionsModal isOpen={!!debtReceiptActionsModalState} isSharing={isSharing} onClose={() => setDebtReceiptActionsModalState(null)} debtPayment={debtReceiptActionsModalState.debtPayment} showNotification={showNotification} onShare={async () => { if(isSharing || !debtReceiptActionsModalState) return; const text = generateDebtText(debtReceiptActionsModalState.debtPayment); const title = `Comprovante de Pagamento - ${debtReceiptActionsModalState.debtPayment.customerName}`; await handleShareText(text, title); setDebtReceiptActionsModalState(null); }} onViewReceipt={() => handleDirectPrintDebtReceipt(debtReceiptActionsModalState.debtPayment)} onPrintRawBt={async () => { if(isSharing || !debtReceiptActionsModalState) return; const text = generateDebtText(debtReceiptActionsModalState.debtPayment); await handlePrintRawBt(text); setDebtReceiptActionsModalState(null); }} onPrintSunmi={() => handlePrintSunmiDebtReceipt(debtReceiptActionsModalState.debtPayment)} onPrintBluetooth={() => handlePrintBtDebtReceipt(debtReceiptActionsModalState.debtPayment)} isBluetoothConnected={btPrinterState.isConnected} />}
            {receiptModalState && <ReceiptModal isOpen={!!receiptModalState} onClose={() => setReceiptModalState(null)} billing={receiptModalState.billing} isProvisional={receiptModalState.isProvisional} showNotification={showNotification} onOpenForScreenshot={() => { setScreenshotReceipt({ type: 'billing', data: receiptModalState.billing, isProvisional: receiptModalState.isProvisional }); setReceiptModalState(null); }} />}
            {debtReceiptModalState && <DebtReceiptModal isOpen={!!debtReceiptModalState} onClose={() => setDebtReceiptModalState(null)} debtPayment={debtReceiptModalState} showNotification={showNotification} onOpenForScreenshot={() => { setScreenshotReceipt({ type: 'debt', data: debtReceiptModalState }); setDebtReceiptModalState(null); }} />}
            {screenshotReceipt && <PrintableReceiptModal receipt={screenshotReceipt} onClose={() => setScreenshotReceipt(null)} />}
            {focusedCustomer && <FullScreenCustomerView customer={focusedCustomer} onClose={() => setFocusedCustomer(null)} hasActiveWarning={warnings.some(w => w.customerId === focusedCustomer.id && !w.isResolved)} onBill={handleSelectEquipmentForBilling} onEdit={setEditCustomer} onDelete={setDeleteCustomer} onPayDebt={setPayingDebtCustomer} onHistory={setHistoryCustomer} onShare={setSharingCustomer} billings={billings} debtPayments={debtPayments} />}
            {printingCustomer && <PrintPreviewOverlay customer={printingCustomer} onCancel={() => setPrintingCustomer(null)} />}
            {isLabelGenerationModalOpen && <LabelGenerationModal isOpen={isLabelGenerationModalOpen} onClose={() => setIsLabelGenerationModalOpen(false)} customers={customers} showNotification={showNotification} />}
            {editingBilling && <EditBillingModal isOpen={!!editingBilling} onClose={() => setEditingBilling(null)} onConfirm={handleUpdateBilling} billing={editingBilling} />}
        </div>
    );
};

export default App;