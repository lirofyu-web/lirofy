// App.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { collection, query, onSnapshot, Timestamp, getDocs, deleteDoc, doc, setDoc, addDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import ReactDOMServer from 'react-dom/server';
import QRCode from 'qrcode';
import { auth, db, processFirestoreDoc } from './firebase';

import { Customer, Billing, Expense, DebtPayment, Equipment, Warning, View, Theme, EquipmentWithCustomer, UserProfile } from './types';
import { queueMutation, processSyncQueue } from './utils/offlineSync';
import { v4 as uuidv4 } from 'uuid';

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
import LocationActionsModal from './components/LocationActionsModal';
import EquipmentLabel from './components/EquipmentLabel';
import SyncStatusIndicator from './components/SyncStatusIndicator';


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
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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

    // Sync & Offline State
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline'>('idle');
    const isSyncing = useRef(false);

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
    const [locationActionsCustomer, setLocationActionsCustomer] = useState<Customer | null>(null);

    // --- Handlers ---
    const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
    }, []);

    // --- Offline & Sync Logic ---
    const syncData = useCallback(async () => {
        if (!isOnline || isSyncing.current) return;
    
        isSyncing.current = true;
        setSyncStatus('syncing');
        
        try {
            const processedCount = await processSyncQueue(user?.uid || null);
            if (processedCount > 0) {
                showNotification(`${processedCount} ação(ões) offline foram sincronizadas!`, 'success');
            }
            setSyncStatus('synced');
            setTimeout(() => {
                setSyncStatus('idle');
                isSyncing.current = false;
            }, 2000);
        } catch (error) {
            console.error("Sync failed:", error);
            showNotification('Falha na sincronização dos dados offline.', 'error');
            setSyncStatus('idle');
            isSyncing.current = false;
        }
    }, [isOnline, user, showNotification]);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            showNotification('Conexão reestabelecida. Sincronizando...', 'success');
            syncData();
        };
        const handleOffline = () => {
            setIsOnline(false);
            setSyncStatus('offline');
            showNotification('Você está offline. As alterações serão salvas localmente.', 'success');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        if (isOnline) {
            syncData();
        } else {
            setSyncStatus('offline');
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isOnline, syncData]);


    // --- Firebase Auth & Data Sync Effects ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (!user) {
                setUserProfile(null); // Limpa o perfil no logout
            }
            setIsLoadingAuth(false);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (user && !userProfile) { // Busca o perfil apenas se o usuário existir e o perfil ainda não estiver carregado
            const fetchProfile = async () => {
                try {
                    const profileDoc = await getDoc(doc(db, "user_profiles", user.uid));
                    if (profileDoc.exists()) {
                        setUserProfile(processFirestoreDoc(profileDoc) as UserProfile);
                    } else {
                        console.warn("User profile not found. Creating a default one.");
                        const defaultProfile: UserProfile = { id: user.uid, email: user.email!, createdAt: new Date() };
                        await setDoc(doc(db, "user_profiles", user.uid), { email: user.email, createdAt: Timestamp.now() });
                        setUserProfile(defaultProfile);
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setUserProfile({ id: user.uid, email: user.email!, createdAt: new Date() });
                }
            };
            fetchProfile();
        } else if (!user) {
            setUserProfile(null);
        }
    }, [user, userProfile]);

    useEffect(() => {
        if (!user) {
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

        return () => unsubscribers.forEach(unsub => unsub());
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
        isScannerOpen || thermalPrintModalState || importFile || isImporting ||
        locationActionsCustomer
      );
    }, [
      billingModalState, editCustomer, deleteCustomer, payingDebtCustomer,
      historyCustomer, sharingCustomer, receiptActionsModalState,
      debtReceiptActionsModalState, receiptModalState, debtReceiptModalState,
      screenshotReceipt, equipmentSelectionCustomer, focusedCustomer,
      printingCustomer, isLabelGenerationModalOpen, editingBilling,
      isScannerOpen, thermalPrintModalState, importFile, isImporting,
      locationActionsCustomer
    ]);
    
    useEffect(() => {
        if (isAnyModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
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
        
        // FIX: Cast the component to a type that accepts `qrCodeDataUrl` to satisfy TypeScript's strict checking with React.cloneElement.
        const componentWithQr = React.cloneElement(contentComponent as React.ReactElement<{ qrCodeDataUrl?: string }>, { qrCodeDataUrl });
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


    // --- Data Handlers with Offline Support ---

    const handleAddCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'createdAt' | 'debtAmount' | 'lastVisitedAt'>) => {
        const newCustomer: Omit<Customer, 'id'> = { ...customerData, createdAt: new Date(), debtAmount: 0, lastVisitedAt: null };
        const tempId = uuidv4();
        setCustomers(prev => [...prev, { ...newCustomer, id: tempId }]);
        queueMutation({ action: 'add', collectionPath: 'customers', payload: newCustomer });
        
        if (!isOnline) {
            showNotification('Offline: Cliente salvo localmente.', 'success');
        } else {
            syncData();
        }
    }, [isOnline, syncData, showNotification]);

    const handleUpdateCustomer = useCallback(async (updatedCustomer: Customer) => {
        const { id, ...customerData } = updatedCustomer;
        setCustomers(prev => prev.map(c => c.id === id ? updatedCustomer : c));
        queueMutation({ action: 'update', collectionPath: 'customers', docId: id, payload: customerData });
        setEditCustomer(null);

        if (!isOnline) {
            showNotification('Offline: Alterações salvas localmente.', 'success');
        } else {
            syncData();
        }
    }, [isOnline, syncData, showNotification]);

    const handleConfirmDeleteCustomer = useCallback(async () => {
        if (!deleteCustomer) return;
        const customerId = deleteCustomer.id;
        const customerName = deleteCustomer.name;
        
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        queueMutation({ action: 'delete', collectionPath: 'customers', docId: customerId, payload: {} });
        
        setDeleteCustomer(null);

        if (!isOnline) {
            showNotification('Offline: Cliente será excluído ao sincronizar.', 'success');
        } else {
            showNotification(`Cliente "${customerName}" excluído.`, 'success');
            syncData();
        }
    }, [deleteCustomer, isOnline, syncData, showNotification]);

    const handleAddBilling = useCallback(async (billingData: Billing) => {
        const customerToUpdate = customers.find(c => c.id === billingData.customerId);
        if (!customerToUpdate) return;

        const updatedDebt = customerToUpdate.debtAmount + (billingData.valorDebitoNegativo || 0);
        const updatedEquipment = (customerToUpdate.equipment || []).map(e => e.id === billingData.equipmentId ? { ...e, relogioAnterior: billingData.relogioAtual } : e);
        
        setBillings(prev => [...prev, billingData]);
        setCustomers(prev => prev.map(c => c.id === billingData.customerId ? { ...c, debtAmount: updatedDebt, lastVisitedAt: new Date(), equipment: updatedEquipment } : c));
        
        const { id, ...billingPayload } = billingData;
        queueMutation({ action: 'add', collectionPath: 'billings', payload: billingPayload });
        queueMutation({ action: 'update', collectionPath: 'customers', docId: billingData.customerId, payload: { debtAmount: updatedDebt, lastVisitedAt: new Date(), equipment: updatedEquipment } });
        
        setBillingModalState(null);

        if (!isOnline) {
            showNotification('Offline: Cobrança salva localmente.', 'success');
        } else {
            syncData();
        }
        setReceiptActionsModalState({ billing: billingData, isProvisional: false });

    }, [customers, isOnline, syncData, showNotification]);
    
    const handleUpdateBilling = useCallback(async (updatedBilling: Billing) => {
        const { id, ...billingData } = updatedBilling;
        const originalBilling = billings.find(b => b.id === id);
        if (!originalBilling) return;
        
        setBillings(prev => prev.map(b => b.id === id ? updatedBilling : b));
        queueMutation({ action: 'update', collectionPath: 'billings', docId: id, payload: billingData });
        
        const debtDifference = (updatedBilling.valorDebitoNegativo || 0) - (originalBilling.valorDebitoNegativo || 0);
        if (debtDifference !== 0) {
            const customerToUpdate = customers.find(c => c.id === updatedBilling.customerId);
            if (customerToUpdate) {
                const newDebt = Math.max(0, customerToUpdate.debtAmount + debtDifference);
                setCustomers(prev => prev.map(c => c.id === customerToUpdate.id ? {...c, debtAmount: newDebt} : c));
                queueMutation({ action: 'update', collectionPath: 'customers', docId: customerToUpdate.id, payload: { debtAmount: newDebt } });
            }
        }
        
        setEditingBilling(null);

        if (!isOnline) {
            showNotification('Offline: Alteração na cobrança salva localmente.', 'success');
        } else {
            showNotification("Cobrança atualizada com sucesso!", 'success');
            syncData();
        }
    }, [billings, customers, isOnline, syncData, showNotification]);
    
    const handleDeleteBilling = useCallback(async (billingId: string) => {
        const billingToDelete = billings.find(b => b.id === billingId);
        if (!billingToDelete) return;
        
        setBillings(prev => prev.filter(b => b.id !== billingId));
        queueMutation({ action: 'delete', collectionPath: 'billings', docId: billingId, payload: {} });
        
        const customerToUpdate = customers.find(c => c.id === billingToDelete.customerId);
        if (customerToUpdate) {
            const revertedDebt = Math.max(0, customerToUpdate.debtAmount - (billingToDelete.valorDebitoNegativo || 0));
            const revertedEquipment = (customerToUpdate.equipment || []).map(e => e.id === billingToDelete.equipmentId ? { ...e, relogioAnterior: billingToDelete.relogioAnterior } : e);
            setCustomers(prev => prev.map(c => c.id === customerToUpdate.id ? {...c, debtAmount: revertedDebt, equipment: revertedEquipment} : c));
            queueMutation({ action: 'update', collectionPath: 'customers', docId: customerToUpdate.id, payload: { debtAmount: revertedDebt, equipment: revertedEquipment } });
        }
        
        if (!isOnline) {
            showNotification('Offline: Exclusão de cobrança salva localmente.', 'success');
        } else {
            showNotification("Cobrança excluída e dados revertidos.");
            syncData();
        }
    }, [billings, customers, isOnline, syncData, showNotification]);

    const handleAddDebtPayment = useCallback(async (amount: number, paymentMethod: 'pix' | 'dinheiro') => {
        if (!payingDebtCustomer) return;
        const newPayment: Omit<DebtPayment, 'id'> = { customerId: payingDebtCustomer.id, customerName: payingDebtCustomer.name, amountPaid: amount, paidAt: new Date(), paymentMethod };
        const newDebt = Math.max(0, payingDebtCustomer.debtAmount - amount);
        const tempId = uuidv4();

        setDebtPayments(prev => [...prev, {id: tempId, ...newPayment}]);
        setCustomers(prev => prev.map(c => c.id === payingDebtCustomer.id ? {...c, debtAmount: newDebt} : c));
        
        queueMutation({ action: 'add', collectionPath: 'debtPayments', payload: newPayment });
        queueMutation({ action: 'update', collectionPath: 'customers', docId: payingDebtCustomer.id, payload: { debtAmount: newDebt } });
        
        const customer = payingDebtCustomer;
        setPayingDebtCustomer(null);

        if(!isOnline) {
            showNotification('Offline: Pagamento salvo localmente.', 'success');
        } else {
            syncData();
        }
        setDebtReceiptActionsModalState({ debtPayment: {id: tempId, ...newPayment}, customer: customer });

    }, [payingDebtCustomer, isOnline, syncData, showNotification]);

    const handleAddExpense = useCallback(async (description: string, amount: number, category: Expense['category']) => {
        const newExpense: Omit<Expense, 'id'> = { description, amount, date: new Date(), category };
        setExpenses(prev => [...prev, {id: uuidv4(), ...newExpense}]);
        queueMutation({ action: 'add', collectionPath: 'expenses', payload: newExpense });

        if (!isOnline) {
            showNotification('Offline: Despesa salva localmente.', 'success');
        } else {
            showNotification("Despesa adicionada.");
            syncData();
        }
    }, [isOnline, syncData, showNotification]);
    
    const handleDeleteExpense = useCallback(async (expenseId: string) => {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
        queueMutation({ action: 'delete', collectionPath: 'expenses', docId: expenseId, payload: {} });

        if (!isOnline) {
            showNotification('Offline: Exclusão de despesa salva localmente.', 'success');
        } else {
            showNotification("Despesa excluída.");
            syncData();
        }
    }, [isOnline, syncData, showNotification]);
    
    const handleAddWarning = useCallback(async (customerId: string, message: string) => {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;
        const newWarning: Omit<Warning, 'id'> = { customerId, customerName: customer.name, message, createdAt: new Date(), isResolved: false };
        setWarnings(prev => [...prev, {id: uuidv4(), ...newWarning}]);
        queueMutation({ action: 'add', collectionPath: 'warnings', payload: newWarning });
        
        if (!isOnline) {
            showNotification('Offline: Aviso salvo localmente.', 'success');
        } else {
            showNotification(`Aviso adicionado para ${customer.name}.`);
            syncData();
        }
    }, [customers, isOnline, syncData, showNotification]);

    const handleResolveWarning = useCallback(async (warningId: string) => {
        setWarnings(prev => prev.map(w => w.id === warningId ? {...w, isResolved: true} : w));
        queueMutation({ action: 'update', collectionPath: 'warnings', docId: warningId, payload: { isResolved: true } });
        
        if (!isOnline) {
            showNotification('Offline: Aviso salvo localmente.', 'success');
        } else {
            showNotification("Aviso marcado como resolvido.");
            syncData();
        }
    }, [isOnline, syncData, showNotification]);
    
    const handleDeleteWarning = useCallback(async (warningId: string) => {
        setWarnings(prev => prev.filter(w => w.id !== warningId));
        queueMutation({ action: 'delete', collectionPath: 'warnings', docId: warningId, payload: {} });

        if (!isOnline) {
            showNotification('Offline: Exclusão de aviso salva localmente.', 'success');
        } else {
            showNotification("Aviso excluído.");
            syncData();
        }
    }, [isOnline, syncData, showNotification]);

    // --- Other handlers ---

    const handleSelectEquipmentForBilling = useCallback((customer: Customer) => {
        if (customer.equipment.length === 1) {
            setBillingModalState({ customer, equipment: customer.equipment[0] });
        } else {
            setEquipmentSelectionCustomer(customer);
        }
    }, []);

    const handleTriggerProvisionalReceipt = useCallback((billing: Billing, onComplete: () => void) => {
        setReceiptActionsModalState({ billing, isProvisional: true });
        onComplete();
    }, []);

    // Data Management Handlers
    const handleExportData = useCallback((isAutomatic = false) => {
        const data = { customers, billings, expenses, debtPayments, warnings, version: 2, exportDate: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        a.download = `backup-${isAutomatic ? 'automatico-' : ''}montanha-bilhar-${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
        if (!isAutomatic) {
            showNotification("Backup exportado com sucesso!");
        }
    }, [customers, billings, expenses, debtPayments, warnings, showNotification]);

    useEffect(() => {
        if (customers.length === 0 || !user) {
            return;
        }

        const LAST_BACKUP_KEY = 'lastAutomaticBackupTimestamp';
        const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

        const lastBackupTimestamp = localStorage.getItem(LAST_BACKUP_KEY);
        const now = new Date().getTime();

        const shouldBackup = !lastBackupTimestamp || (now - parseInt(lastBackupTimestamp, 10)) > SEVEN_DAYS_IN_MS;

        if (shouldBackup) {
            showNotification('Iniciando backup automático semanal...', 'success');
            
            setTimeout(() => {
                handleExportData(true);
                localStorage.setItem(LAST_BACKUP_KEY, String(now));
                showNotification("Backup automático semanal concluído!");
            }, 2000);
        }
    }, [customers, user, handleExportData, showNotification]);

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

    const handleGenerateLabels = useCallback(async (equipments: EquipmentWithCustomer[]) => {
        setIsLabelGenerationModalOpen(false);
        showNotification('Gerando etiquetas em nova aba...', 'success');
    
        try {
            const labelHtmlPromises = equipments.map(async (equipment) => {
                const qrData = JSON.stringify({ type: 'equipment', id: equipment.id });
                const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
                    width: 80,
                    margin: 1,
                    errorCorrectionLevel: 'H',
                    color: { dark: '#000000', light: '#FFFFFF' }
                });
    
                const labelComponentHtml = ReactDOMServer.renderToString(
                    <EquipmentLabel equipment={equipment} qrCodeDataUrl={qrCodeDataUrl} />
                );
    
                return `<div class="label-item">${labelComponentHtml}</div>`;
            });
    
            const allLabelsHtml = (await Promise.all(labelHtmlPromises)).join('');
            
            const fullHtml = `
                <html>
                    <head>
                        <title>Etiquetas de Equipamento</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <style>
                            @page {
                                size: 58mm auto; /* Thermal printer paper size */
                                margin: 0;
                            }
                            body {
                                font-family: 'Courier New', Courier, monospace;
                                color: #000;
                                margin: 0;
                                padding: 0;
                                background-color: #fff;
                            }
                            .label-item {
                                padding: 2mm;
                                page-break-after: always;
                                border-bottom: 1px dashed #ccc;
                            }
                            .label-item:last-child {
                                page-break-after: auto;
                                border-bottom: none;
                            }
                            @media screen {
                                body {
                                    background-color: #334155; /* slate-700 */
                                    display: flex;
                                    justify-content: center;
                                    padding: 1rem 0;
                                }
                                .thermal-roll-preview {
                                    width: 58mm;
                                    background-color: #fff;
                                    box-shadow: 0 0 15px rgba(0,0,0,0.5);
                                }
                            }
                        </style>
                    </head>
                    <body class="bg-slate-700">
                        <div class="thermal-roll-preview">
                            ${allLabelsHtml}
                        </div>
                    </body>
                </html>
            `;
    
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(fullHtml);
                printWindow.document.close();
            } else {
                showNotification("Por favor, habilite pop-ups para gerar as etiquetas.", "error");
            }
    
        } catch (error) {
            console.error("Erro ao gerar etiquetas:", error);
            showNotification(error instanceof Error ? error.message : "Ocorreu um erro ao gerar as etiquetas.", "error");
        }
    }, [showNotification]);


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
                const customerWithEquipment = customers.find(c => (c.equipment || []).some(e => e.id === data.id));
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

    if (isLoadingAuth || (user && !userProfile)) {
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
                    {currentView === 'CLIENTES' && <ClientesView customers={customers} warnings={warnings} onAddCustomer={handleAddCustomer} isSaving={false} showNotification={showNotification} onFocusCustomer={setFocusedCustomer} onBillCustomer={handleSelectEquipmentForBilling} onEditCustomer={setEditCustomer} onDeleteCustomer={setDeleteCustomer} onPayDebtCustomer={setPayingDebtCustomer} onHistoryCustomer={setHistoryCustomer} onShareCustomer={setSharingCustomer} onOpenScanner={handleOpenScanner} onLocationActions={setLocationActionsCustomer} />}
                    {currentView === 'COBRANCAS' && <CobrancasView billings={billings} customers={customers} onShowActions={(b) => setReceiptActionsModalState({billing: b, isProvisional: false})} onEditBilling={setEditingBilling} onDeleteBilling={handleDeleteBilling} onViewDetails={(b) => handleDirectPrintBillingReceipt(b, false)} />}
                    {currentView === 'EQUIPAMENTOS' && <EquipamentosView customers={customers} billings={billings} showNotification={showNotification} onOpenLabelGenerator={() => setIsLabelGenerationModalOpen(true)} onGenerateLabels={handleGenerateLabels} />}
                    {currentView === 'DESPESAS' && <DespesasView expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} />}
                    {currentView === 'ROTAS' && <RotasView customers={customers} />}
                    {currentView === 'RELATORIOS' && <RelatoriosView customers={customers} billings={billings} expenses={expenses} debtPayments={debtPayments} onThermalPrint={(title, content) => setThermalPrintModalState({ title, content })} />}
                    {currentView === 'CONFIGURACOES' && <ConfiguracoesView onExportData={() => handleExportData(false)} onMergeData={handleImportData} theme={theme} setTheme={setTheme} showNotification={showNotification} deferredPrompt={deferredPrompt} onInstallPrompt={handleInstallPrompt} />}
                </div>
            </main>
            
            <SyncStatusIndicator status={syncStatus} onSync={syncData} />
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
            {focusedCustomer && <FullScreenCustomerView customer={focusedCustomer} onClose={() => setFocusedCustomer(null)} hasActiveWarning={warnings.some(w => w.customerId === focusedCustomer.id && !w.isResolved)} onBill={handleSelectEquipmentForBilling} onEdit={setEditCustomer} onDelete={setDeleteCustomer} onPayDebt={setPayingDebtCustomer} onHistory={setHistoryCustomer} onShare={setSharingCustomer} onLocationActions={setLocationActionsCustomer} billings={billings} debtPayments={debtPayments} />}
            {printingCustomer && <PrintPreviewOverlay customer={printingCustomer} onCancel={() => setPrintingCustomer(null)} />}
            {isLabelGenerationModalOpen && <LabelGenerationModal isOpen={isLabelGenerationModalOpen} onClose={() => setIsLabelGenerationModalOpen(false)} customers={customers} showNotification={showNotification} onConfirm={handleGenerateLabels} />}
            {editingBilling && <EditBillingModal isOpen={!!editingBilling} onClose={() => setEditingBilling(null)} onConfirm={handleUpdateBilling} billing={editingBilling} />}
            {isScannerOpen && <QrScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} showNotification={showNotification} />}
            {thermalPrintModalState && <ThermalPrintActionsModal isOpen={!!thermalPrintModalState} onClose={() => setThermalPrintModalState(null)} title={thermalPrintModalState.title} content={thermalPrintModalState.content} onShare={handleShareText} onPrintRawBt={handlePrintRawBt} onPrintSunmi={handlePrintSunmiText} isSharing={isSharing} />}
            {locationActionsCustomer && <LocationActionsModal isOpen={!!locationActionsCustomer} onClose={() => setLocationActionsCustomer(null)} customer={locationActionsCustomer} />}
            
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
                    <p className="mt-2 text-slate-300">Esta ação substituirá <strong className="text-white">TODOS</strong> os seus dados atuais (clientes, cobranças, etc.) pelos dados do arquivo de backup. Continue apenas se tiver certeza.</p>
                </ActionModal>
            )}
            {isImporting && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4">
                    <div className="bg-slate-800 p-8 rounded-lg flex flex-col items-center gap-4">
                        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="text-white font-semibold">Importando e substituindo dados... Por favor, aguarde.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;