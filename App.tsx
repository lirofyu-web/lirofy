// App.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, Timestamp, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import ReactDOMServer from 'react-dom/server';
import QRCode from 'qrcode';
import { auth, db, processFirestoreDoc } from './firebase';

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
import { applyThemeColors, defaultColors } from './utils/theme';
import FullScreenCustomerView from './components/FullScreenCustomerView';
import { sunmiPrinterService } from './utils/sunmiPrinter';
import LoginView from './views/LoginView';

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
import ReceiptSheet from './components/ReceiptSheet';
import DebtReceiptSheet from './components/DebtReceiptSheet';
import QrScannerModal from './components/QrScannerModal';
import ThermalPrintActionsModal from './components/ThermalPrintActionsModal';

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
    const [user, setUser] = useState<User | null>(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [billings, setBillings] = useState<Billing[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
    const [warnings, setWarnings] = useState<Warning[]>([]);
    
    const [currentView, setCurrentView] = useState<View>(() => (localStorage.getItem('lastActiveView') as View) || 'DASHBOARD');
    
    const [notification, setNotification] = useState<NotificationState>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);

    // Theme and PWA states
    const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallBannerVisible, setIsInstallBannerVisible] = useState(true);

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
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [thermalPrintModalState, setThermalPrintModalState] = useState<{ title: string; content: string } | null>(null);
    
    // --- Handlers ---
    const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
    }, []);

    // --- Firebase Auth & Data Sync Effects ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setIsLoadingAuth(false);
        });
        return unsubscribe; // Cleanup on unmount
    }, []);

    useEffect(() => {
        if (!user) {
            // Clear all data on logout
            setCustomers([]);
            setBillings([]);
            setExpenses([]);
            setDebtPayments([]);
            setWarnings([]);
            return;
        }

        const createCollectionSubscription = (collectionName: string, setter: React.Dispatch<React.SetStateAction<any[]>>) => {
            const q = query(collection(db, `users/${user.uid}/${collectionName}`));
            return onSnapshot(q, (querySnapshot) => {
                const items = querySnapshot.docs.map(doc => processFirestoreDoc(doc));
                setter(items as any);
            }, (error) => {
                console.error(`Error fetching ${collectionName}: `, error);
                showNotification(`Erro ao carregar ${collectionName}.`, 'error');
            });
        };

        const unsubscribers = [
            createCollectionSubscription('customers', setCustomers),
            createCollectionSubscription('billings', setBillings),
            createCollectionSubscription('expenses', setExpenses),
            createCollectionSubscription('debtPayments', setDebtPayments),
            createCollectionSubscription('warnings', setWarnings),
        ];

        return () => unsubscribers.forEach(unsub => unsub()); // Cleanup listeners on user change or unmount
    }, [user, showNotification]);

    
    // --- UI & PWA Effects ---
    useEffect(() => {
        const savedColors = localStorage.getItem('appThemeColors');
        applyThemeColors(savedColors ? JSON.parse(savedColors) : defaultColors);
    }, []);

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
    
    const isAnyModalOpen = useMemo(() => {
      return !!(
        billingModalState || editCustomer || deleteCustomer || payingDebtCustomer ||
        historyCustomer || sharingCustomer || receiptActionsModalState ||
        debtReceiptActionsModalState || receiptModalState || debtReceiptModalState ||
        screenshotReceipt || equipmentSelectionCustomer || focusedCustomer ||
        printingCustomer || isLabelGenerationModalOpen || editingBilling ||
        isScannerOpen || thermalPrintModalState || importFile || isImporting
      );
    }, [
      billingModalState, editCustomer, deleteCustomer, payingDebtCustomer,
      historyCustomer, sharingCustomer, receiptActionsModalState,
      debtReceiptActionsModalState, receiptModalState, debtReceiptModalState,
      screenshotReceipt, equipmentSelectionCustomer, focusedCustomer,
      printingCustomer, isLabelGenerationModalOpen, editingBilling,
      isScannerOpen, thermalPrintModalState, importFile, isImporting
    ]);
    
    useEffect(() => {
        if (isAnyModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = ''; // Cleanup on unmount
        };
    }, [isAnyModalOpen]);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }, []);

    // --- Printing & Sharing Handlers ---
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
    
    const handlePrintPdf = useCallback(async (title: string, contentComponent: React.ReactElement) => {
        const pixPayload = "00020126360014BR.GOV.BCB.PIX0114+55439995819935204000053039865802BR5915BILHAR MONTANHA6012Jaguapita-PR62070503***6304F96E";
        const qrCodeDataUrl = await QRCode.toDataURL(pixPayload, { width: 150, margin: 1, errorCorrectionLevel: 'M' });
        
        const componentWithQr = React.cloneElement(contentComponent, { qrCodeDataUrl });
        const content = ReactDOMServer.renderToString(componentWithQr);
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>${title}</title><style>body { font-family: 'Courier New', Courier, monospace; font-weight: bold; color: #000; width: 58mm; margin: 0; padding: 2mm; font-size: 11pt; } @page { size: 58mm 200mm; margin: 0; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } } * { font-weight: bold !important; } .header { text-align: center; margin-bottom: 8px; } .header h3 { margin: 0; font-size: 12pt; } .header p { margin: 2px 0; font-size: 10pt; } .flex { display: flex; } .justify-between { justify-content: space-between; } hr.dashed, .border-t { border: 0; border-top: 1px dashed #000; margin: 6px 0; }</style></head><body>${content}</body></html>`);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => printWindow.print(), 500);
        } else {
            showNotification("Por favor, habilite pop-ups para impressão.", "error");
        }
    }, [showNotification]);

    const handleDirectPrintBillingReceipt = (billing: Billing, isProvisional: boolean) => {
        setReceiptActionsModalState(null);
        handlePrintPdf(`${isProvisional ? 'Demonstrativo' : 'Recibo'} - ${billing.customerName}`, <ReceiptSheet billing={billing} isProvisional={isProvisional} />);
    };

    const handleDirectPrintDebtReceipt = (debtPayment: DebtPayment) => {
        setDebtReceiptActionsModalState(null);
        handlePrintPdf(`Comprovante de Dívida - ${debtPayment.customerName}`, <DebtReceiptSheet debtPayment={debtPayment} />);
    };

    const handlePrintSunmiBillingReceipt = async (billing: Billing, isProvisional: boolean) => {
        await handlePrintSunmiText(generateBillingText(billing, isProvisional));
        setReceiptActionsModalState(null);
    };

    const handlePrintSunmiDebtReceipt = async (debtPayment: DebtPayment) => {
        await handlePrintSunmiText(generateDebtText(debtPayment));
        setDebtReceiptActionsModalState(null);
    };

    const handlePrintSunmiText = async (text: string) => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            await sunmiPrinterService.printReceipt(text);
            showNotification('Impresso com sucesso!', 'success');
        } catch (error) {
            showNotification(error instanceof Error ? error.message : 'Falha na impressão', 'error');
        } finally {
            setIsSharing(false);
            setThermalPrintModalState(null);
        }
    };


    // --- Firestore Data Handlers ---

    // Customer Handlers
    const handleAddCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'createdAt' | 'debtAmount' | 'lastVisitedAt'>) => {
        if (!user) return;
        const newCustomer = { ...customerData, createdAt: Timestamp.now(), debtAmount: 0, lastVisitedAt: null };
        try {
            await addDoc(collection(db, `users/${user.uid}/customers`), newCustomer);
            showNotification(`Cliente "${newCustomer.name}" adicionado com sucesso!`);
        } catch (e) {
            console.error(e);
            showNotification("Erro ao adicionar cliente.", 'error');
        }
    }, [user, showNotification]);

    const handleUpdateCustomer = useCallback(async (updatedCustomer: Customer) => {
        if (!user) return;
        const { id, ...customerData } = updatedCustomer;
        try {
            await updateDoc(doc(db, `users/${user.uid}/customers`, id), customerData);
            setEditCustomer(null);
            showNotification(`Cliente "${updatedCustomer.name}" atualizado!`);
        } catch (e) {
            console.error(e);
            showNotification("Erro ao atualizar cliente.", 'error');
        }
    }, [user, showNotification]);

    const handleConfirmDeleteCustomer = useCallback(async () => {
        if (!deleteCustomer || !user) return;
        try {
            // Firestore doesn't cascade deletes, so related data would need to be cleaned up with cloud functions for full data integrity.
            // For now, just delete the customer doc.
            await deleteDoc(doc(db, `users/${user.uid}/customers`, deleteCustomer.id));
            showNotification(`Cliente "${deleteCustomer.name}" excluído.`);
            setDeleteCustomer(null);
        } catch (e) {
            console.error(e);
            showNotification("Erro ao excluir cliente.", 'error');
        }
    }, [deleteCustomer, user, showNotification]);

    // Billing Handlers
    const handleSelectEquipmentForBilling = useCallback((customer: Customer) => {
        if (customer.equipment.length === 1) {
            setBillingModalState({ customer, equipment: customer.equipment[0] });
        } else {
            setEquipmentSelectionCustomer(customer);
        }
    }, []);

    const handleAddBilling = useCallback(async (billingData: Billing) => {
        if (!user) return;
        const { id, ...newBilling } = billingData;
        try {
            // Add billing document
            await addDoc(collection(db, `users/${user.uid}/billings`), newBilling);

            // Update customer document
            const customerRef = doc(db, `users/${user.uid}/customers`, billingData.customerId);
            const customerToUpdate = customers.find(c => c.id === billingData.customerId);
            if (customerToUpdate) {
                const updatedDebt = customerToUpdate.debtAmount + (billingData.valorDebitoNegativo || 0);
                const updatedEquipment = customerToUpdate.equipment.map(e => e.id === billingData.equipmentId ? { ...e, relogioAnterior: billingData.relogioAtual } : e);
                await updateDoc(customerRef, { debtAmount: updatedDebt, lastVisitedAt: Timestamp.now(), equipment: updatedEquipment });
            }
            
            setBillingModalState(null);
            setReceiptActionsModalState({ billing: billingData, isProvisional: false });
        } catch (e) {
            console.error(e);
            showNotification("Erro ao registrar cobrança.", 'error');
        }
    }, [user, customers, showNotification]);
    
    const handleUpdateBilling = useCallback(async (updatedBilling: Billing) => {
        if (!user) return;
        const { id, ...billingData } = updatedBilling;
        const originalBilling = billings.find(b => b.id === id);
        if (!originalBilling) return;

        try {
            // Update billing document
            await updateDoc(doc(db, `users/${user.uid}/billings`, id), billingData);

            // Update customer debt if it changed
            const debtDifference = (updatedBilling.valorDebitoNegativo || 0) - (originalBilling.valorDebitoNegativo || 0);
            if (debtDifference !== 0) {
                const customerToUpdate = customers.find(c => c.id === updatedBilling.customerId);
                if (customerToUpdate) {
                    const newDebt = Math.max(0, customerToUpdate.debtAmount + debtDifference);
                    await updateDoc(doc(db, `users/${user.uid}/customers`, customerToUpdate.id), { debtAmount: newDebt });
                }
            }
            setEditingBilling(null);
            showNotification("Cobrança atualizada com sucesso!");
        } catch (e) {
            console.error(e);
            showNotification("Erro ao atualizar cobrança.", 'error');
        }
    }, [user, billings, customers, showNotification]);
    
    const handleDeleteBilling = useCallback(async (billingId: string) => {
        if (!user) return;
        const billingToDelete = billings.find(b => b.id === billingId);
        if (!billingToDelete) return;
        
        try {
            // Delete billing document
            await deleteDoc(doc(db, `users/${user.uid}/billings`, billingId));

            // Revert customer state
            const customerToUpdate = customers.find(c => c.id === billingToDelete.customerId);
            if (customerToUpdate) {
                const revertedDebt = Math.max(0, customerToUpdate.debtAmount - (billingToDelete.valorDebitoNegativo || 0));
                const revertedEquipment = customerToUpdate.equipment.map(e => e.id === billingToDelete.equipmentId ? { ...e, relogioAnterior: billingToDelete.relogioAnterior } : e);
                await updateDoc(doc(db, `users/${user.uid}/customers`, customerToUpdate.id), { debtAmount: revertedDebt, equipment: revertedEquipment });
            }
            showNotification("Cobrança excluída e dados revertidos.");
        } catch (e) {
            console.error(e);
            showNotification("Erro ao excluir cobrança.", 'error');
        }
    }, [user, billings, customers, showNotification]);

    const handleTriggerProvisionalReceipt = useCallback((billing: Billing, onComplete: () => void) => {
        setReceiptActionsModalState({ billing, isProvisional: true });
        onComplete();
    }, []);

    // Debt & Expense Handlers
    const handleAddDebtPayment = useCallback(async (amount: number, paymentMethod: 'pix' | 'dinheiro') => {
        if (!payingDebtCustomer || !user) return;
        const newPayment = { customerId: payingDebtCustomer.id, customerName: payingDebtCustomer.name, amountPaid: amount, paidAt: Timestamp.now(), paymentMethod };
        try {
            const docRef = await addDoc(collection(db, `users/${user.uid}/debtPayments`), newPayment);
            const newDebt = Math.max(0, payingDebtCustomer.debtAmount - amount);
            await updateDoc(doc(db, `users/${user.uid}/customers`, payingDebtCustomer.id), { debtAmount: newDebt });
            
            setPayingDebtCustomer(null);
            setDebtReceiptActionsModalState({ debtPayment: {id: docRef.id, ...newPayment, paidAt: new Date()}, customer: payingDebtCustomer });
        } catch (e) {
            console.error(e);
            showNotification("Erro ao registrar pagamento de dívida.", 'error');
        }
    }, [payingDebtCustomer, user, showNotification]);

    const handleAddExpense = useCallback(async (description: string, amount: number, category: Expense['category']) => {
        if (!user) return;
        const newExpense = { description, amount, date: Timestamp.now(), category };
        try {
            await addDoc(collection(db, `users/${user.uid}/expenses`), newExpense);
            showNotification("Despesa adicionada.");
        } catch (e) {
            console.error(e);
            showNotification("Erro ao adicionar despesa.", 'error');
        }
    }, [user, showNotification]);
    
    const handleDeleteExpense = useCallback(async (expenseId: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, `users/${user.uid}/expenses`, expenseId));
            showNotification("Despesa excluída.");
        } catch (e) {
            console.error(e);
            showNotification("Erro ao excluir despesa.", 'error');
        }
    }, [user, showNotification]);
    
    // Warning Handlers
    const handleAddWarning = useCallback(async (customerId: string, message: string) => {
        if (!user) return;
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;
        const newWarning = { customerId, customerName: customer.name, message, createdAt: Timestamp.now(), isResolved: false };
        try {
            await addDoc(collection(db, `users/${user.uid}/warnings`), newWarning);
            showNotification(`Aviso adicionado para ${customer.name}.`);
        } catch (e) {
            console.error(e);
            showNotification("Erro ao adicionar aviso.", 'error');
        }
    }, [user, customers, showNotification]);

    const handleResolveWarning = useCallback(async (warningId: string) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, `users/${user.uid}/warnings`, warningId), { isResolved: true });
            showNotification("Aviso marcado como resolvido.");
        } catch (e) {
            console.error(e);
            showNotification("Erro ao resolver aviso.", 'error');
        }
    }, [user, showNotification]);
    
    const handleDeleteWarning = useCallback(async (warningId: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, `users/${user.uid}/warnings`, warningId));
            showNotification("Aviso excluído.");
        } catch (e) {
            console.error(e);
            showNotification("Erro ao excluir aviso.", 'error');
        }
    }, [user, showNotification]);

    // Data Management Handlers
    const handleExportData = useCallback(() => {
        const data = { customers, billings, expenses, debtPayments, warnings, version: 2, exportDate: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        a.download = `backup-montanha-bilhar-${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification("Backup exportado com sucesso!");
    }, [customers, billings, expenses, debtPayments, warnings, showNotification]);

    const handleImportData = useCallback((file: File) => {
        if (file && file.type === 'application/json') {
            setImportFile(file); // Abre o modal de confirmação
        } else {
            showNotification('Por favor, selecione um arquivo JSON de backup válido.', 'error');
        }
    }, [showNotification]);

    const handleConfirmImport = useCallback(async () => {
        if (!importFile || !user) return;
        
        const originalFile = importFile;
        setImportFile(null); // Fecha o modal de confirmação
        setIsImporting(true);

        try {
            const fileContent = await originalFile.text();
            const data = JSON.parse(fileContent);

            const requiredCollections = ['customers', 'billings', 'expenses', 'debtPayments', 'warnings'];
            if (!requiredCollections.every(key => Array.isArray(data[key]))) {
                throw new Error("Arquivo de backup inválido ou corrompido.");
            }

            // Deleta todos os dados existentes
            for (const collectionName of requiredCollections) {
                const collectionRef = collection(db, `users/${user.uid}/${collectionName}`);
                const snapshot = await getDocs(collectionRef);
                const deletePromises = snapshot.docs.map(docSnapshot => deleteDoc(docSnapshot.ref));
                await Promise.all(deletePromises);
            }
            
            // Adiciona os novos dados do arquivo de backup
            for (const collectionName of requiredCollections) {
                const itemsToImport = data[collectionName];
                const collectionRef = collection(db, `users/${user.uid}/${collectionName}`);
                const addPromises = itemsToImport.map((item: any) => {
                    if (!item.id) {
                        console.warn(`Item em ${collectionName} sem ID, pulando.`, item);
                        return Promise.resolve();
                    }
                    const { id, ...itemData } = item;
                    Object.keys(itemData).forEach(key => {
                        if (['createdAt', 'settledAt', 'paidAt', 'date', 'lastVisitedAt'].includes(key) && itemData[key] && typeof itemData[key] === 'string') {
                            const date = new Date(itemData[key]);
                            if (!isNaN(date.getTime())) itemData[key] = Timestamp.fromDate(date);
                            else delete itemData[key];
                        }
                    });
                    return setDoc(doc(collectionRef, id), itemData);
                });
                await Promise.all(addPromises);
            }
            showNotification('Importação de dados concluída com sucesso!', 'success');
        } catch (e) {
            console.error("Falha na importação:", e);
            showNotification(e instanceof Error ? e.message : "Erro ao importar dados.", 'error');
        } finally {
            setIsImporting(false);
        }
    }, [importFile, user, showNotification]);


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

    const handleOpenScanner = useCallback(() => setIsScannerOpen(true), []);

    const handleScanSuccess = useCallback((decodedText: string) => {
        setIsScannerOpen(false);
        try {
            const data = JSON.parse(decodedText);
            if (data.type === 'equipment' && data.id) {
                const customerWithEquipment = customers.find(c => c.equipment.some(e => e.id === data.id));
                if (customerWithEquipment) {
                    showNotification(`Equipamento encontrado para ${customerWithEquipment.name}!`, 'success');
                    handleSelectEquipmentForBilling(customerWithEquipment);
                } else {
                    showNotification("Equipamento não encontrado ou não associado a um cliente.", "error");
                }
                return;
            }
        } catch (e) {
            const customer = customers.find(c => c.id === decodedText);
            if (customer) {
                showNotification(`Cliente ${customer.name} encontrado!`, 'success');
                handleSelectEquipmentForBilling(customer);
            } else {
                showNotification("QR Code inválido. Não corresponde a um cliente ou equipamento conhecido.", "error");
            }
        }
    }, [customers, showNotification, handleSelectEquipmentForBilling]);

    if (isLoadingAuth) {
        return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Carregando...</div>;
    }

    if (!user) {
        return <LoginView showNotification={showNotification} />;
    }

    return (
        <div className={`flex h-full font-sans antialiased ${theme}`}>
            <Sidebar currentView={currentView} setView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onOpenScanner={handleOpenScanner} />
            <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8">
                <MobileHeader
                    title={viewTitles[currentView]}
                    onMenuClick={() => setIsSidebarOpen(true)}
                    deferredPrompt={deferredPrompt}
                    onInstallPrompt={handleInstallPrompt}
                />
                <div className="flex-grow">
                    {currentView === 'DASHBOARD' && <DashboardView billings={billings} expenses={expenses} customers={customers} debtPayments={debtPayments} warnings={warnings} onAddWarning={handleAddWarning} onResolveWarning={handleResolveWarning} onDeleteWarning={handleDeleteWarning} lastBackupDate={null} onNavigateToSettings={() => setCurrentView('CONFIGURACOES')} />}
                    {currentView === 'CLIENTES' && <ClientesView customers={customers} warnings={warnings} onAddCustomer={handleAddCustomer} isSaving={false} showNotification={showNotification} onFocusCustomer={setFocusedCustomer} onBillCustomer={handleSelectEquipmentForBilling} onEditCustomer={setEditCustomer} onDeleteCustomer={setDeleteCustomer} onPayDebtCustomer={setPayingDebtCustomer} onHistoryCustomer={setHistoryCustomer} onShareCustomer={setSharingCustomer} onOpenScanner={handleOpenScanner} />}
                    {currentView === 'COBRANCAS' && <CobrancasView billings={billings} customers={customers} onShowActions={(b) => setReceiptActionsModalState({billing: b, isProvisional: false})} onEditBilling={setEditingBilling} onDeleteBilling={handleDeleteBilling} onViewDetails={(b) => handleDirectPrintBillingReceipt(b, false)} />}
                    {currentView === 'EQUIPAMENTOS' && <EquipamentosView customers={customers} billings={billings} showNotification={showNotification} onOpenLabelGenerator={() => setIsLabelGenerationModalOpen(true)} />}
                    {currentView === 'DESPESAS' && <DespesasView expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} />}
                    {currentView === 'ROTAS' && <RotasView customers={customers} />}
                    {currentView === 'RELATORIOS' && <RelatoriosView customers={customers} billings={billings} expenses={expenses} debtPayments={debtPayments} onThermalPrint={(title, content) => setThermalPrintModalState({ title, content })} />}
                    {currentView === 'CONFIGURACOES' && <ConfiguracoesView onExportData={handleExportData} onMergeData={handleImportData} onAddCustomerFromText={() => {}} theme={theme} setTheme={setTheme} showNotification={showNotification} deferredPrompt={deferredPrompt} onInstallPrompt={handleInstallPrompt} />}
                </div>
            </main>
            
            <Notification notification={notification} onClose={() => setNotification(null)} />
            <BottomNavBar currentView={currentView} setView={setCurrentView} />
            {deferredPrompt && isInstallBannerVisible && <InstallPwaBanner onInstall={handleInstallPrompt} onDismiss={() => setIsInstallBannerVisible(false)} />}
            
            {/* --- Modals --- */}
            {equipmentSelectionCustomer && <EquipmentSelectionModal isOpen={!!equipmentSelectionCustomer} onClose={() => setEquipmentSelectionCustomer(null)} customer={equipmentSelectionCustomer} onSelect={(equip) => { setBillingModalState({ customer: equipmentSelectionCustomer!, equipment: equip }); setEquipmentSelectionCustomer(null); }} />}
            {billingModalState && <BillingModal isOpen={!!billingModalState} onClose={() => setBillingModalState(null)} onConfirm={handleAddBilling} customer={billingModalState.customer} equipment={billingModalState.equipment} onTriggerProvisionalReceiptAction={handleTriggerProvisionalReceipt} />}
            {editCustomer && <EditCustomerModal isOpen={!!editCustomer} onClose={() => setEditCustomer(null)} onConfirm={handleUpdateCustomer} customer={editCustomer} customers={customers} isSaving={false} showNotification={showNotification} />}
            {payingDebtCustomer && <DebtPaymentModal isOpen={!!payingDebtCustomer} onClose={() => setPayingDebtCustomer(null)} onConfirm={handleAddDebtPayment} customer={payingDebtCustomer} />}
            {historyCustomer && <HistoryModal isOpen={!!historyCustomer} onClose={() => setHistoryCustomer(null)} customer={historyCustomer} billings={billings} debtPayments={debtPayments} />}
            {sharingCustomer && <ShareCustomerModal isOpen={!!sharingCustomer} onClose={() => setSharingCustomer(null)} customer={sharingCustomer} showNotification={showNotification} onPrintCustomer={setPrintingCustomer} />}
            {deleteCustomer && <ActionModal isOpen={!!deleteCustomer} onClose={() => setDeleteCustomer(null)} onConfirm={handleConfirmDeleteCustomer} title="Confirmar Exclusão" confirmText="Sim, Excluir"><p>Tem certeza que deseja excluir o cliente <strong>{deleteCustomer.name}</strong>? Seus dados serão removidos. Esta ação não pode ser desfeita.</p></ActionModal>}
            {receiptActionsModalState && <ReceiptActionsModal isOpen={!!receiptActionsModalState} isSharing={isSharing} onClose={() => setReceiptActionsModalState(null)} billing={receiptActionsModalState.billing} isProvisional={receiptActionsModalState.isProvisional} showNotification={showNotification} onShare={() => handleShareText(generateBillingText(receiptActionsModalState.billing, receiptActionsModalState.isProvisional), `Comprovante - ${receiptActionsModalState.billing.customerName}`).then(() => setReceiptActionsModalState(null))} onViewReceipt={() => handleDirectPrintBillingReceipt(receiptActionsModalState.billing, receiptActionsModalState.isProvisional)} onPrintRawBt={() => handlePrintRawBt(generateBillingText(receiptActionsModalState.billing, receiptActionsModalState.isProvisional)).then(() => setReceiptActionsModalState(null))} onPrintSunmi={() => handlePrintSunmiBillingReceipt(receiptActionsModalState.billing, receiptActionsModalState.isProvisional)} />}
            {debtReceiptActionsModalState && <DebtReceiptActionsModal isOpen={!!debtReceiptActionsModalState} isSharing={isSharing} onClose={() => setDebtReceiptActionsModalState(null)} debtPayment={debtReceiptActionsModalState.debtPayment} showNotification={showNotification} onShare={() => handleShareText(generateDebtText(debtReceiptActionsModalState.debtPayment), `Comprovante - ${debtReceiptActionsModalState.debtPayment.customerName}`).then(() => setDebtReceiptActionsModalState(null))} onViewReceipt={() => handleDirectPrintDebtReceipt(debtReceiptActionsModalState.debtPayment)} onPrintRawBt={() => handlePrintRawBt(generateDebtText(debtReceiptActionsModalState.debtPayment)).then(() => setDebtReceiptActionsModalState(null))} onPrintSunmi={() => handlePrintSunmiDebtReceipt(debtReceiptActionsModalState.debtPayment)} />}
            {receiptModalState && <ReceiptModal isOpen={!!receiptModalState} onClose={() => setReceiptModalState(null)} billing={receiptModalState.billing} isProvisional={receiptModalState.isProvisional} showNotification={showNotification} onOpenForScreenshot={() => { setScreenshotReceipt({ type: 'billing', data: receiptModalState.billing, isProvisional: receiptModalState.isProvisional }); setReceiptModalState(null); }} />}
            {debtReceiptModalState && <DebtReceiptModal isOpen={!!debtReceiptModalState} onClose={() => setDebtReceiptModalState(null)} debtPayment={debtReceiptModalState} showNotification={showNotification} onOpenForScreenshot={() => { setScreenshotReceipt({ type: 'debt', data: debtReceiptModalState }); setDebtReceiptModalState(null); }} />}
            {screenshotReceipt && <PrintableReceiptModal receipt={screenshotReceipt} onClose={() => setScreenshotReceipt(null)} />}
            {focusedCustomer && <FullScreenCustomerView customer={focusedCustomer} onClose={() => setFocusedCustomer(null)} hasActiveWarning={warnings.some(w => w.customerId === focusedCustomer.id && !w.isResolved)} onBill={handleSelectEquipmentForBilling} onEdit={setEditCustomer} onDelete={setDeleteCustomer} onPayDebt={setPayingDebtCustomer} onHistory={setHistoryCustomer} onShare={setSharingCustomer} billings={billings} debtPayments={debtPayments} />}
            {printingCustomer && <PrintPreviewOverlay customer={printingCustomer} onCancel={() => setPrintingCustomer(null)} />}
            {isLabelGenerationModalOpen && <LabelGenerationModal isOpen={isLabelGenerationModalOpen} onClose={() => setIsLabelGenerationModalOpen(false)} customers={customers} showNotification={showNotification} />}
            {editingBilling && <EditBillingModal isOpen={!!editingBilling} onClose={() => setEditingBilling(null)} onConfirm={handleUpdateBilling} billing={editingBilling} />}
            {isScannerOpen && <QrScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} showNotification={showNotification} />}
            {thermalPrintModalState && <ThermalPrintActionsModal isOpen={!!thermalPrintModalState} onClose={() => setThermalPrintModalState(null)} title={thermalPrintModalState.title} content={thermalPrintModalState.content} onShare={handleShareText} onPrintRawBt={handlePrintRawBt} onPrintSunmi={handlePrintSunmiText} isSharing={isSharing} />}
            
            {/* Import Modals */}
            {importFile && (
                <ActionModal
                    isOpen={!!importFile}
                    onClose={() => setImportFile(null)}
                    onConfirm={handleConfirmImport}
                    title="Confirmar Importação de Dados"
                    confirmText="Sim, Substituir Tudo"
                >
                    <p className="text-red-400 font-bold text-lg">ATENÇÃO: AÇÃO IRREVERSÍVEL!</p>
                    <p className="mt-2">Você está prestes a substituir <strong className="text-white">TODOS OS DADOS ATUAIS</strong> pelos dados do arquivo <strong className="text-white">{importFile.name}</strong>.</p>
                    <p className="mt-2">É altamente recomendado que você <strong className="text-white">faça um backup dos dados atuais primeiro.</strong></p>
                    <p className="mt-4">Deseja continuar?</p>
                </ActionModal>
            )}
            {isImporting && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4">
                    <div className="bg-slate-800 p-8 rounded-lg shadow-xl text-white flex items-center gap-4">
                        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <div>
                            <h3 className="text-xl font-bold">Importando Dados...</h3>
                            <p className="text-slate-300 mt-1">Por favor, aguarde. Não feche o aplicativo.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;