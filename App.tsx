// App.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { collection, query, onSnapshot, Timestamp, getDocs, deleteDoc, doc, setDoc, addDoc, updateDoc, getDoc, writeBatch } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import ReactDOMServer from 'react-dom/server';
import QRCode from 'qrcode';
import { auth, db, processFirestoreDoc } from './firebase';

import { Customer, Billing, Expense, DebtPayment, Equipment, Warning, View, Theme, UserProfile } from './types';
import { queueMutation, processSyncQueue, clearOfflineQueue } from './utils/offlineSync';
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
import LoginView from './views/LoginView';
import ReceiptSheet from './components/ReceiptSheet';
import DebtReceiptSheet from './components/DebtReceiptSheet';


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
import LabelGenerationModal from './components/LabelGenerationModal';
import EditBillingModal from './components/EditBillingModal';
import QrScannerModal from './components/QrScannerModal';
import ThermalPrintActionsModal from './components/ThermalPrintActionsModal';
import LocationActionsModal from './components/LocationActionsModal';
import AddPhoneModal from './components/AddPhoneModal';
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
      <header className="print-controls no-print sticky top-0 bg-white/90 dark:bg-slate-800/90 p-4 shadow-md flex justify-center gap-4 flex-shrink-0">
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
    const [lastBackupTimestamp, setLastBackupTimestamp] = useState<string | null>(localStorage.getItem('lastBackupTimestamp'));

    // Sync & Offline State
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline'>('idle');
    const isSyncing = useRef(false);
    
    // Theme and PWA states
    const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallBannerVisible, setIsInstallBannerVisible] = useState(true);
    
    // Modal States
    const [billingModalState, setBillingModalState] = useState<{ isOpen: boolean; customer: Customer | null; equipment: Equipment | null; }>({ isOpen: false, customer: null, equipment: null });
    const [editCustomerModalState, setEditCustomerModalState] = useState<{ isOpen: boolean; customer: Customer | null; }>({ isOpen: false, customer: null });
    const [debtPaymentModalState, setDebtPaymentModalState] = useState<{ isOpen: boolean; customer: Customer | null; }>({ isOpen: false, customer: null });
    const [historyModalState, setHistoryModalState] = useState<{ isOpen: boolean; customer: Customer | null; }>({ isOpen: false, customer: null });
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; customer: Customer | null; }>({ isOpen: false, customer: null });
    const [equipmentSelectionModalState, setEquipmentSelectionModalState] = useState<{ isOpen: boolean; customer: Customer | null; }>({ isOpen: false, customer: null });
    const [receiptActionsModalState, setReceiptActionsModalState] = useState<{ isOpen: boolean; billing: Billing | null; isProvisional: boolean; }>({ isOpen: false, billing: null, isProvisional: false });
    const [debtReceiptActionsModalState, setDebtReceiptActionsModalState] = useState<{ isOpen: boolean; debtPayment: DebtPayment | null; customer: Customer | null }>({ isOpen: false, debtPayment: null, customer: null });
    const [shareCustomerModalState, setShareCustomerModalState] = useState<{ isOpen: boolean; customer: Customer | null; }>({ isOpen: false, customer: null });
    const [labelGenerationModalState, setLabelGenerationModalState] = useState<{ isOpen: boolean; }>({ isOpen: false });
    const [editBillingModalState, setEditBillingModalState] = useState<{ isOpen: boolean; billing: Billing | null; }>({ isOpen: false, billing: null });
    const [qrScannerModalOpen, setQrScannerModalOpen] = useState(false);
    const [thermalPrintModalState, setThermalPrintModalState] = useState<{ isOpen: boolean; title: string; content: string; }>({ isOpen: false, title: '', content: '' });
    const [locationActionsModalState, setLocationActionsModalState] = useState<{ isOpen: boolean; customer: Customer | null; }>({ isOpen: false, customer: null });
    const [saveLocationModalState, setSaveLocationModalState] = useState<{ isOpen: boolean; customer: Customer | null; }>({ isOpen: false, customer: null });
    const [addPhoneModalState, setAddPhoneModalState] = useState<{ isOpen: boolean; customer: Customer | null; }>({ isOpen: false, customer: null });
    const [isDeleteAllDataModalOpen, setIsDeleteAllDataModalOpen] = useState(false);
    const [fileToMerge, setFileToMerge] = useState<File | null>(null);
    const [isGeolocating, setIsGeolocating] = useState(false);
    
    const [focusedCustomer, setFocusedCustomer] = useState<Customer | null>(null);
    const [customerToPrint, setCustomerToPrint] = useState<Customer | null>(null);
    
    // Saving state for UI feedback
    const [isSaving, setIsSaving] = useState(false);
    
    // --- Service Worker Registration ---
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                const swUrl = new URL('sw.js', window.location.origin);
                navigator.serviceWorker.register(swUrl)
                    .then(registration => {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(error => {
                        console.error('ServiceWorker registration failed: ', error);
                    });
            });
        }
    }, []);

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
    }, [isOnline, syncData, showNotification]);


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
                    const profileDoc = await getDoc(doc(db, "users", user.uid));
                    if (profileDoc.exists()) {
                        setUserProfile(processFirestoreDoc(profileDoc) as UserProfile);
                    } else {
                        console.warn("User profile not found. Creating a default one.");
                        const defaultProfile: UserProfile = { id: user.uid, email: user.email!, createdAt: new Date() };
                        await setDoc(doc(db, "users", user.uid), { email: user.email, createdAt: Timestamp.now() });
                        setUserProfile(defaultProfile);
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    showNotification("Erro ao carregar perfil do usuário.", "error");
                }
            };
            fetchProfile();
        }
    }, [user, userProfile, showNotification]);
    
    // PWA Install Prompt
    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallBannerVisible(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);
    
    // Set Theme
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    // Apply custom colors on load
    useEffect(() => {
        try {
            const savedColors = localStorage.getItem('appThemeColors');
            const colors = savedColors ? JSON.parse(savedColors) : defaultColors;
            applyThemeColors(colors);
        } catch(e) {
            console.error("Error applying saved theme:", e);
            applyThemeColors(defaultColors);
        }
    }, []);
    
    // Fetch data from Firestore
    useEffect(() => {
        if (!user) {
            // Limpa os dados locais ao fazer logout
            setCustomers([]);
            setBillings([]);
            setExpenses([]);
            setDebtPayments([]);
            setWarnings([]);
            return;
        }
    
        const collections = ['customers', 'billings', 'expenses', 'debtPayments', 'warnings'];
        const setters: Record<string, React.Dispatch<React.SetStateAction<any[]>>> = {
            customers: setCustomers,
            billings: setBillings,
            expenses: setExpenses,
            debtPayments: setDebtPayments,
            warnings: setWarnings,
        };
    
        const unsubscribers = collections.map(col => {
            const q = query(collection(db, `users/${user.uid}/${col}`));
            return onSnapshot(q, (querySnapshot) => {
                const data = querySnapshot.docs.map(processFirestoreDoc);
                setters[col](data as any);
            }, (error) => {
                console.error(`Error fetching ${col}:`, error);
                showNotification(`Erro ao buscar dados de ${col}.`, 'error');
            });
        });
    
        return () => unsubscribers.forEach(unsub => unsub());
    }, [user, showNotification]);

    const processPayloadForFirestore = (data: any): any => {
        if (data === null || typeof data !== 'object') {
            return data;
        }
        if (data instanceof Date) {
            return Timestamp.fromDate(data);
        }
        if (Array.isArray(data)) {
            return data.map(item => processPayloadForFirestore(item));
        }
    
        const newObj: { [key: string]: any } = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = data[key];
                if (value !== undefined) {
                    newObj[key] = processPayloadForFirestore(value);
                }
            }
        }
        return newObj;
    }
    
    // --- Data Handlers (Add, Update, Delete) ---
    
    const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'debtAmount' | 'lastVisitedAt'>) => {
        setIsSaving(true);
        const customerWithId: Customer = {
            id: uuidv4(),
            ...customerData,
            createdAt: new Date(),
            debtAmount: 0,
            lastVisitedAt: null,
        };
    
        // Optimistic update
        const originalCustomers = customers;
        setCustomers(prev => [...prev, customerWithId].sort((a,b) => a.name.localeCompare(b.name)));
    
        try {
            const { id, ...payload } = customerWithId;
            const firestorePayload = processPayloadForFirestore(payload);
            if(isOnline && user) {
                await setDoc(doc(db, `users/${user.uid}/customers`, id), firestorePayload);
            } else {
                await queueMutation({ action: 'add', collectionPath: 'customers', payload: customerWithId });
            }
            showNotification('Cliente adicionado com sucesso!');
        } catch (error) {
            showNotification('Erro ao adicionar cliente. Alteração desfeita.', 'error');
            setCustomers(originalCustomers); // Rollback
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleUpdateCustomer = async (customer: Customer) => {
        setIsSaving(true);
        const originalCustomers = customers;
    
        // Optimistic Update
        setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
        setEditCustomerModalState({ isOpen: false, customer: null });
    
        const { id, ...customerData } = customer;
        try {
            if (isOnline && user) {
                const docRef = doc(db, `users/${user.uid}/customers`, id);
                await updateDoc(docRef, processPayloadForFirestore(customerData));
            } else {
                 await queueMutation({ action: 'update', collectionPath: 'customers', docId: id, payload: customerData });
            }
            showNotification('Cliente atualizado com sucesso!');
        } catch (error) {
            showNotification('Erro ao atualizar cliente. Alteração desfeita.', 'error');
            setCustomers(originalCustomers); // Rollback
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteCustomer = async (customerId: string) => {
        setIsSaving(true);
        const originalCustomers = customers;
        const customerToDelete = originalCustomers.find(c => c.id === customerId);
        if (!customerToDelete) return;
    
        // Optimistic update
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        setDeleteModalState({ isOpen: false, customer: null });
    
        try {
            if(isOnline && user) {
                await deleteDoc(doc(db, `users/${user.uid}/customers`, customerId));
            } else {
                await queueMutation({ action: 'delete', collectionPath: 'customers', docId: customerId, payload: {} });
            }
            showNotification('Cliente excluído com sucesso!');
        } catch (error) {
            showNotification('Erro ao excluir cliente. Alteração desfeita.', 'error');
            setCustomers(originalCustomers); // Rollback
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddBilling = async (billing: Billing) => {
        setIsSaving(true);
        const originalCustomers = customers;
        const originalBillings = billings;
    
        const customerToUpdate = originalCustomers.find(c => c.id === billing.customerId);
        if (!customerToUpdate) {
            showNotification('Cliente não encontrado para faturamento.', 'error');
            setIsSaving(false);
            return;
        }
    
        const updatedEquipment = customerToUpdate.equipment.map(e =>
            e.id === billing.equipmentId ? { ...e, relogioAnterior: billing.relogioAtual } : e
        );
        const updatedCustomerData = {
            equipment: updatedEquipment,
            lastVisitedAt: new Date(),
            debtAmount: (customerToUpdate.debtAmount || 0) + (billing.valorDebitoNegativo || 0)
        };
        const updatedCustomer = { ...customerToUpdate, ...updatedCustomerData };
    
        // Optimistic update
        setBillings(prev => [...prev, billing]);
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
        setBillingModalState({ isOpen: false, customer: null, equipment: null });
    
        try {
            if (isOnline && user) {
                const batch = writeBatch(db);
                const billingRef = doc(db, `users/${user.uid}/billings`, billing.id);
                batch.set(billingRef, processPayloadForFirestore(billing));
                
                const customerRef = doc(db, `users/${user.uid}/customers`, customerToUpdate.id);
                batch.update(customerRef, processPayloadForFirestore(updatedCustomerData));
                
                await batch.commit();
            } else {
                await queueMutation({ action: 'add', collectionPath: 'billings', payload: billing });
                await queueMutation({ action: 'update', collectionPath: 'customers', docId: customerToUpdate.id, payload: updatedCustomerData });
            }
            
            showNotification('Faturamento registrado com sucesso!');
            handleOpenReceiptActions(billing, false);
    
        } catch (error) {
            showNotification('Erro ao registrar faturamento. Alterações desfeitas.', 'error');
            setBillings(originalBillings); // Rollback
            setCustomers(originalCustomers); // Rollback
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleUpdateBilling = async (updatedBilling: Billing) => {
        setIsSaving(true);
    
        const originalBilling = billings.find(b => b.id === updatedBilling.id);
        const originalCustomer = customers.find(c => c.id === updatedBilling.customerId);
    
        if (!originalBilling || !originalCustomer) {
            showNotification('Dados originais da cobrança ou cliente não encontrados.', 'error');
            setIsSaving(false);
            return;
        }
        
        // --- Optimistic Update Logic ---
        const originalBillingsState = billings;
        const originalCustomersState = customers;

        const debtChange = (updatedBilling.valorDebitoNegativo || 0) - (originalBilling.valorDebitoNegativo || 0);
        const newDebtAmount = (originalCustomer.debtAmount || 0) + debtChange;

        // Check if this is the most recent billing for the equipment
        const isMostRecent = !billings.some(b => 
            b.equipmentId === updatedBilling.equipmentId && 
            b.id !== updatedBilling.id && 
            new Date(b.settledAt) > new Date(updatedBilling.settledAt)
        );

        const updatedCustomerData: Partial<Customer> = { debtAmount: newDebtAmount };
        if (isMostRecent) {
            updatedCustomerData.equipment = originalCustomer.equipment.map(e => 
                e.id === updatedBilling.equipmentId 
                ? { ...e, relogioAnterior: updatedBilling.relogioAtual } 
                : e
            );
        }
        
        // Apply optimistic updates to state
        setBillings(prev => prev.map(b => b.id === updatedBilling.id ? updatedBilling : b));
        setCustomers(prev => prev.map(c => c.id === originalCustomer.id ? { ...c, ...updatedCustomerData } : c));
        setEditBillingModalState({ isOpen: false, billing: null });
        
        // --- Persistence Logic ---
        try {
            const { id, ...billingData } = updatedBilling;
            const customerPayload = { debtAmount: newDebtAmount };
            if (isMostRecent && updatedCustomerData.equipment) {
                (customerPayload as any).equipment = updatedCustomerData.equipment;
            }

            if (isOnline && user) {
                const batch = writeBatch(db);
                const billingRef = doc(db, `users/${user.uid}/billings`, updatedBilling.id);
                batch.update(billingRef, processPayloadForFirestore(billingData));

                const customerRef = doc(db, `users/${user.uid}/customers`, originalCustomer.id);
                batch.update(customerRef, processPayloadForFirestore(customerPayload));
                
                await batch.commit();
            } else {
                await queueMutation({ action: 'update', collectionPath: 'billings', docId: id, payload: billingData });
                await queueMutation({ action: 'update', collectionPath: 'customers', docId: originalCustomer.id, payload: customerPayload });
            }
            showNotification('Cobrança atualizada com sucesso!');
        } catch (error) {
            showNotification('Erro ao atualizar cobrança. Restaurando dados.', 'error');
            console.error(error);
            // Rollback optimistic updates on failure
            setBillings(originalBillingsState);
            setCustomers(originalCustomersState);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteBilling = async (billingId: string) => {
        setIsSaving(true);
        const originalBillings = billings;
        const originalCustomers = customers;
    
        const billingToDelete = originalBillings.find(b => b.id === billingId);
        if (!billingToDelete) { showNotification('Cobrança não encontrada.', 'error'); setIsSaving(false); return; }
    
        const customerToUpdate = originalCustomers.find(c => c.id === billingToDelete.customerId);
        if (!customerToUpdate) { showNotification('Cliente não encontrado.', 'error'); setIsSaving(false); return; }
    
        const newDebtAmount = (customerToUpdate.debtAmount || 0) - (billingToDelete.valorDebitoNegativo || 0);
        const updatedEquipment = customerToUpdate.equipment.map(e => {
            if (e.id === billingToDelete.equipmentId) {
                const isMostRecent = !originalBillings.some(b => b.equipmentId === e.id && b.id !== billingId && new Date(b.settledAt) > new Date(billingToDelete.settledAt));
                if (isMostRecent) return { ...e, relogioAnterior: billingToDelete.relogioAnterior };
            }
            return e;
        });
        const updatedCustomerData = { debtAmount: newDebtAmount, equipment: updatedEquipment };
    
        // Optimistic update
        setBillings(prev => prev.filter(b => b.id !== billingId));
        setCustomers(prev => prev.map(c => c.id === customerToUpdate.id ? { ...c, ...updatedCustomerData } : c));
    
        try {
            if (isOnline && user) {
                const batch = writeBatch(db);
                batch.delete(doc(db, `users/${user.uid}/billings`, billingId));
                batch.update(doc(db, `users/${user.uid}/customers`, customerToUpdate.id), processPayloadForFirestore(updatedCustomerData));
                await batch.commit();
            } else {
                await queueMutation({ action: 'delete', collectionPath: 'billings', docId: billingId, payload: {} });
                await queueMutation({ action: 'update', collectionPath: 'customers', docId: customerToUpdate.id, payload: updatedCustomerData });
            }
            showNotification('Cobrança excluída com sucesso!');
        } catch (error) {
            showNotification('Erro ao excluir cobrança. Restaurando dados.', 'error');
            console.error(error);
            setBillings(originalBillings); // Rollback
            setCustomers(originalCustomers); // Rollback
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddExpense = async (description: string, amount: number, category: Expense['category']) => {
        setIsSaving(true);
        const expenseWithId: Expense = { id: uuidv4(), description, amount, category, date: new Date() };
        
        const originalExpenses = expenses;
        setExpenses(prev => [...prev, expenseWithId].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
        try {
            const { id, ...payload } = expenseWithId;
            const firestorePayload = processPayloadForFirestore(payload);
            if (isOnline && user) {
                await setDoc(doc(db, `users/${user.uid}/expenses`, id), firestorePayload);
            } else {
                await queueMutation({ action: 'add', collectionPath: 'expenses', payload: expenseWithId });
            }
            showNotification('Despesa adicionada com sucesso!');
        } catch (e) {
            showNotification('Erro ao adicionar despesa. Alteração desfeita.', 'error');
            setExpenses(originalExpenses); // Rollback
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteExpense = async (expenseId: string) => {
        setIsSaving(true);
        const originalExpenses = expenses;
        const expenseToDelete = originalExpenses.find(e => e.id === expenseId);
        if(!expenseToDelete) return;
    
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
    
        try {
            if(isOnline && user) {
                await deleteDoc(doc(db, `users/${user.uid}/expenses`, expenseId));
            } else {
                await queueMutation({ action: 'delete', collectionPath: 'expenses', docId: expenseId, payload: {} });
            }
            showNotification('Despesa excluída com sucesso!');
        } catch (e) {
            showNotification('Erro ao excluir despesa. Alteração desfeita.', 'error');
            setExpenses(originalExpenses); // Rollback
        } finally {
            setIsSaving(false);
        }
    };
    
    const handlePayDebt = async (amount: number, paymentMethod: 'pix' | 'dinheiro') => {
        if (!debtPaymentModalState.customer) return;
        setIsSaving(true);
        
        const originalCustomers = customers;
        const originalDebtPayments = debtPayments;
        
        const customer = debtPaymentModalState.customer;
        const newDebtAmount = Math.max(0, customer.debtAmount - amount);
        const newPayment: DebtPayment = {
            id: uuidv4(),
            customerId: customer.id,
            customerName: customer.name,
            amountPaid: amount,
            paidAt: new Date(),
            paymentMethod
        };
        const updatedCustomer = { ...customer, debtAmount: newDebtAmount };
    
        // Optimistic update
        setDebtPayments(prev => [...prev, newPayment]);
        setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
        setDebtPaymentModalState({ isOpen: false, customer: null });
        
        try {
            const { id, ...payload } = newPayment;
            if(isOnline && user) {
                const batch = writeBatch(db);
                batch.set(doc(db, `users/${user.uid}/debtPayments`, id), processPayloadForFirestore(payload));
                batch.update(doc(db, `users/${user.uid}/customers`, customer.id), { debtAmount: newDebtAmount });
                await batch.commit();
            } else {
                 await queueMutation({ action: 'add', collectionPath: 'debtPayments', payload: newPayment });
                 await queueMutation({ action: 'update', collectionPath: 'customers', docId: customer.id, payload: { debtAmount: newDebtAmount }});
            }
            
            handleOpenDebtReceiptActions(newPayment, updatedCustomer);
            showNotification('Pagamento de dívida registrado!');
    
        } catch(e) {
            showNotification('Erro ao registrar pagamento. Alteração desfeita.', 'error');
            setCustomers(originalCustomers); // Rollback
            setDebtPayments(originalDebtPayments); // Rollback
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAllData = async () => {
        if (!user) return;
        setIsSaving(true);
        setIsDeleteAllDataModalOpen(false);

        try {
            // Step 1: Clear local offline queue to prevent old data from resyncing
            await clearOfflineQueue();
            showNotification('Fila offline limpa...', 'success');

            // Step 2: Delete all Firestore data in a batch
            const collectionsToDelete = ['customers', 'billings', 'expenses', 'debtPayments', 'warnings'];
            const batch = writeBatch(db);

            for (const collectionName of collectionsToDelete) {
                const collectionPath = `users/${user.uid}/${collectionName}`;
                const q = query(collection(db, collectionPath));
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                });
            }

            await batch.commit();
            showNotification('Dados na nuvem excluídos...', 'success');

            // Step 3: Clear local state (already handled by onSnapshot, but good practice to be explicit)
            setCustomers([]);
            setBillings([]);
            setExpenses([]);
            setDebtPayments([]);
            setWarnings([]);

            showNotification('Todos os dados foram apagados com sucesso!', 'success');
        } catch (error) {
            console.error("Error deleting all data:", error);
            showNotification('Ocorreu um erro ao apagar os dados.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSetView = useCallback((view: View) => {
        setCurrentView(view);
        localStorage.setItem('lastActiveView', view);
    }, []);
    
    // --- Modal Handlers ---
    
    const handleOpenBillModal = useCallback((customer: Customer) => {
        if (customer.equipment && customer.equipment.length === 1) {
            setBillingModalState({ isOpen: true, customer, equipment: customer.equipment[0] });
        } else {
            setEquipmentSelectionModalState({ isOpen: true, customer });
        }
    }, []);
    
    const handleEquipmentSelectForBilling = (equipment: Equipment) => {
        setEquipmentSelectionModalState(prev => ({ ...prev, isOpen: false }));
        setBillingModalState({ isOpen: true, customer: equipmentSelectionModalState.customer, equipment });
    };

    const handleOpenReceiptActions = (billing: Billing, isProvisional: boolean) => {
        setReceiptActionsModalState({ isOpen: true, billing, isProvisional });
    };

    const handleOpenDebtReceiptActions = (debtPayment: DebtPayment, customer: Customer) => {
        setDebtReceiptActionsModalState({ isOpen: true, debtPayment, customer });
    };

    const handleLocationActions = useCallback((customer: Customer) => {
        if (customer.latitude && customer.longitude) {
            setLocationActionsModalState({ isOpen: true, customer });
        } else {
            setSaveLocationModalState({ isOpen: true, customer });
        }
    }, []);
    
    const handleWhatsAppActions = useCallback((customer: Customer) => {
        if (customer.telefone) {
            window.open(`https://wa.me/55${customer.telefone.replace(/\D/g, '')}`, '_blank', 'noopener,noreferrer');
        } else {
            setAddPhoneModalState({ isOpen: true, customer });
        }
    }, []);

    const saveCustomerProperty = useCallback(async (customer: Customer, propertyUpdate: Partial<Customer>) => {
        const originalCustomers = customers;
        const updatedCustomer = { ...customer, ...propertyUpdate };
        
        // Optimistic update
        setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
        
        try {
            if (isOnline && user) {
                const docRef = doc(db, `users/${user.uid}/customers`, customer.id);
                await updateDoc(docRef, processPayloadForFirestore(propertyUpdate));
            } else {
                await queueMutation({ action: 'update', collectionPath: 'customers', docId: customer.id, payload: propertyUpdate });
            }
            showNotification('Cliente atualizado com sucesso!', 'success');
        } catch (error) {
            showNotification('Erro ao salvar. Alteração desfeita.', 'error');
            setCustomers(originalCustomers); // Rollback
            console.error(error);
        }
    }, [customers, isOnline, user, showNotification]);

    const handleConfirmSaveLocation = useCallback(async () => {
        if (!saveLocationModalState.customer) return;
        const customer = saveLocationModalState.customer;
        setIsGeolocating(true);
        setSaveLocationModalState({ isOpen: false, customer: null });

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                saveCustomerProperty(customer, { latitude, longitude });
                setIsGeolocating(false);
            },
            (error) => {
                let message = 'Não foi possível obter a localização.';
                if (error.code === 1) message = 'Permissão de localização foi negada.';
                showNotification(message, 'error');
                setIsGeolocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [saveLocationModalState.customer, saveCustomerProperty, showNotification]);

    const handleSavePhoneNumber = useCallback(async (phone: string) => {
        if (!addPhoneModalState.customer) return;
        await saveCustomerProperty(addPhoneModalState.customer, { telefone: phone });
        setAddPhoneModalState({ isOpen: false, customer: null });
    }, [addPhoneModalState.customer, saveCustomerProperty]);

    // --- Receipt and Sharing ---
    const handleShareReceipt = async () => {
        if (!receiptActionsModalState.billing) return;
        setIsSharing(true);
        const text = generateBillingText(receiptActionsModalState.billing, receiptActionsModalState.isProvisional);
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Comprovante - ${receiptActionsModalState.billing.customerName}`,
                    text: text,
                });
            } else {
                await navigator.clipboard.writeText(text);
                showNotification('Comprovante copiado para a área de transferência!');
            }
        } catch (error: any) {
             if (error.name !== 'AbortError') {
                showNotification('Erro ao compartilhar comprovante.', 'error');
            }
        } finally {
            setIsSharing(false);
        }
    };
    
    const handleShareDebtReceipt = async () => {
        if (!debtReceiptActionsModalState.debtPayment) return;
        setIsSharing(true);
        const text = generateDebtText(debtReceiptActionsModalState.debtPayment);
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Comprovante de Dívida - ${debtReceiptActionsModalState.debtPayment.customerName}`,
                    text: text,
                });
            } else {
                await navigator.clipboard.writeText(text);
                showNotification('Comprovante copiado para a área de transferência!');
            }
        } catch (error: any) {
             if (error.name !== 'AbortError') {
                showNotification('Erro ao compartilhar comprovante.', 'error');
            }
        } finally {
            setIsSharing(false);
        }
    };
    
    const generatePrintableHtml = (title: string, content: string): string => {
        return `
            <html><head><title>${title}</title><style>
              body { 
                font-family: 'Courier New', Courier, monospace;
                width: 72mm;
                font-size: 16pt; /* User Request */
                font-weight: 700; /* User Request: bold */
                color: #000;
                margin: 0 auto;
                padding: 3mm;
              }
              .header { text-align: center; margin-bottom: 15px; }
              .header h3, .font-black { 
                margin: 0; 
                font-size: 20pt; /* User Request */
                font-weight: 900; 
              }
              .font-bold { font-weight: 900; }
              .text-lg { font-size: 20pt; } /* Header size */
              .text-xl { font-size: 22pt; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              hr { border-top: 2px dashed #000; margin: 10px 0; border-bottom: 0; }
              .text-center { text-align: center; }
              .mt-1 { margin-top: 0.25rem; } .mt-2 { margin-top: 0.5rem; } .mt-4 { margin-top: 1rem; }
              .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
              .pt-1 { padding-top: 0.25rem; } .pt-2 { padding-top: 0.5rem; }
              .border-t { border-top: 2px dashed #000; }
              .border-b { border-bottom: 2px dashed #000; }
              .border-dashed { border-style: dashed; } .border-black { border-color: #000; }
              /* Scaled font sizes */
              .text-base { font-size: 18pt; line-height: 1.5rem; } /* Total size */
              .text-sm { font-size: 16pt; line-height: 1.25rem; } /* Body size */
              .text-xs { font-size: 12pt; line-height: 1rem; } /* Footer size */
              .space-y-1 > :not([hidden]) ~ :not([hidden]) { margin-top: 0.25rem; }
              img { display: block; margin: 8px auto; border: 4px solid black; }

              /* Styles for dotted filler rows */
              .receipt-row {
                display: grid;
                grid-template-columns: auto 1fr auto;
                align-items: baseline;
                gap: 0.5ch;
              }
              .receipt-row .filler {
                border-bottom: 2px dotted #000;
                position: relative;
                bottom: 0.2em; /* Align dots with middle of text */
              }
              .receipt-row .value {
                white-space: nowrap;
              }

              @page { size: auto; margin: 3mm; }
            </style></head><body>${content}</body></html>
        `;
    };

    const pixPayload = "00020126360014BR.GOV.BCB.PIX0114+55439995819935204000053039865802BR5915BILHAR MONTANHA6012Jaguapita-PR62070503***6304F96E";

    const handlePrintBilling = async (billing: Billing, isProvisional: boolean) => {
        if (!billing) return;
        const qrCodeDataUrl = await QRCode.toDataURL(pixPayload, {
            width: 150,
            margin: 1,
            errorCorrectionLevel: 'M',
        });
        const printContent = ReactDOMServer.renderToString(
            React.createElement(ReceiptSheet, { billing, isProvisional, qrCodeDataUrl })
        );
        const title = isProvisional ? 'Demonstrativo' : 'Recibo';
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(generatePrintableHtml(title, printContent));
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };
    
    const handlePrintDebt = async (debtPayment: DebtPayment) => {
        if (!debtPayment) return;
        const qrCodeDataUrl = await QRCode.toDataURL(pixPayload, {
            width: 150,
            margin: 1,
            errorCorrectionLevel: 'M',
        });
        const printContent = ReactDOMServer.renderToString(
            React.createElement(DebtReceiptSheet, { debtPayment, qrCodeDataUrl })
        );
        const title = 'Comprovante de Pagamento de Dívida';
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(generatePrintableHtml(title, printContent));
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
    };

    // --- PWA Installation ---
    const handleInstallPrompt = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    showNotification('Aplicativo instalado com sucesso!');
                }
                setDeferredPrompt(null);
                setIsInstallBannerVisible(false);
            });
        }
    };

    const handleExportData = () => {
        try {
            const dataToExport = {
                customers,
                billings,
                expenses,
                debtPayments,
                warnings,
            };

            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            a.href = url;
            a.download = `montanha-gestao-backup-${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            const backupTimestamp = new Date().toISOString();
            localStorage.setItem('lastBackupTimestamp', backupTimestamp);
            setLastBackupTimestamp(backupTimestamp);

            showNotification('Backup exportado com sucesso!', 'success');
        } catch (error) {
            console.error("Erro ao exportar dados:", error);
            showNotification('Falha ao exportar o backup.', 'error');
        }
    };

    const parseDatesInObject = (obj: any): any => {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(parseDatesInObject);

        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            const value = obj[key];
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    newObj[key] = date;
                } else {
                    newObj[key] = value;
                }
            } else if (typeof value === 'object') {
                newObj[key] = parseDatesInObject(value);
            } else {
                newObj[key] = value;
            }
        }
        return newObj;
    };


    const handleConfirmMergeData = async () => {
        if (!fileToMerge || !user) return;
        setIsSaving(true);
        setFileToMerge(null); // Close modal
    
        // Helper function to execute writes in batches to avoid Firestore's 500-operation limit.
        const executeBatchedWrites = async (operations: { type: 'delete' | 'set', ref: any, data?: any }[]) => {
            const batchSize = 499; // Use a slightly smaller size for safety
            for (let i = 0; i < operations.length; i += batchSize) {
                const batch = writeBatch(db);
                const chunk = operations.slice(i, i + batchSize);
                chunk.forEach(op => {
                    if (op.type === 'delete') {
                        batch.delete(op.ref);
                    } else if (op.type === 'set' && op.data) {
                        batch.set(op.ref, op.data);
                    }
                });
                await batch.commit();
            }
        };
    
        try {
            const fileContent = await fileToMerge.text();
            const dataToImport = parseDatesInObject(JSON.parse(fileContent));
    
            if (!dataToImport.customers || !dataToImport.billings) {
                throw new Error("Arquivo de backup inválido ou corrompido.");
            }
    
            await clearOfflineQueue();
    
            const collectionsToProcess = ['customers', 'billings', 'expenses', 'debtPayments', 'warnings'];
            
            // --- Deletion Phase ---
            showNotification('Limpando dados antigos...', 'success');
            const deleteOps: { type: 'delete', ref: any }[] = [];
            for (const collectionName of collectionsToProcess) {
                const collectionPath = `users/${user.uid}/${collectionName}`;
                const q = query(collection(db, collectionPath));
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach((doc) => {
                    deleteOps.push({ type: 'delete', ref: doc.ref });
                });
            }
            if (deleteOps.length > 0) {
                await executeBatchedWrites(deleteOps);
            }
            showNotification('Dados antigos removidos.', 'success');
    
            // --- Import Phase ---
            showNotification('Importando novos dados...', 'success');
            const setOps: { type: 'set', ref: any, data: any }[] = [];
            for (const collectionName of collectionsToProcess) {
                if (dataToImport[collectionName] && Array.isArray(dataToImport[collectionName])) {
                    const collectionPath = `users/${user.uid}/${collectionName}`;
                    for (const item of dataToImport[collectionName]) {
                        if (!item.id) continue; // Skip items without an ID
                        const { id, ...payload } = item;
                        const firestorePayload = processPayloadForFirestore(payload);
                        const docRef = doc(db, collectionPath, id);
                        setOps.push({ type: 'set', ref: docRef, data: firestorePayload });
                    }
                }
            }
            if (setOps.length > 0) {
                await executeBatchedWrites(setOps);
            }
    
            showNotification('Dados importados com sucesso! O aplicativo será recarregado.', 'success');
            setTimeout(() => window.location.reload(), 2000);
    
        } catch (error: any) {
            console.error("Erro ao importar dados:", error);
            showNotification(`Falha na importação: ${error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleMergeData = (file: File) => {
        if (!isOnline) {
            showNotification('A importação de dados só pode ser feita online.', 'error');
            return;
        }
        setFileToMerge(file);
    };


    const renderView = () => {
        switch (currentView) {
            case 'DASHBOARD':
                return <DashboardView 
                            billings={billings} 
                            expenses={expenses} 
                            customers={customers} 
                            debtPayments={debtPayments}
                            warnings={warnings}
                            onAddWarning={() => {}}
                            onResolveWarning={() => {}}
                            onDeleteWarning={() => {}}
                            lastBackupDate={lastBackupTimestamp}
                            onNavigateToSettings={() => handleSetView('CONFIGURACOES')}
                        />;
            case 'CLIENTES':
                return <ClientesView 
                            customers={customers} 
                            warnings={warnings}
                            onAddCustomer={handleAddCustomer}
                            isSaving={isSaving}
                            showNotification={showNotification}
                            onFocusCustomer={setFocusedCustomer}
                            onBillCustomer={handleOpenBillModal}
                            onEditCustomer={(c) => setEditCustomerModalState({ isOpen: true, customer: c })}
                            onDeleteCustomer={(c) => setDeleteModalState({ isOpen: true, customer: c})}
                            onPayDebtCustomer={(c) => setDebtPaymentModalState({ isOpen: true, customer: c})}
                            onHistoryCustomer={(c) => setHistoryModalState({ isOpen: true, customer: c })}
                            onShareCustomer={(c) => setShareCustomerModalState({ isOpen: true, customer: c })}
                            onOpenScanner={() => setQrScannerModalOpen(true)}
                            onLocationActions={handleLocationActions}
                            onWhatsAppActions={handleWhatsAppActions}
                        />;
            case 'COBRANCAS':
                return <CobrancasView 
                            billings={billings} 
                            customers={customers}
                            onShowActions={(b) => handleOpenReceiptActions(b, false)}
                            onEditBilling={(b) => setEditBillingModalState({ isOpen: true, billing: b })}
                            onDeleteBilling={handleDeleteBilling}
                        />;
            case 'DESPESAS':
                return <DespesasView 
                            expenses={expenses} 
                            onAddExpense={handleAddExpense} 
                            onDeleteExpense={handleDeleteExpense} 
                        />;
            case 'EQUIPAMENTOS':
                return <EquipamentosView 
                            customers={customers} 
                            billings={billings}
                            showNotification={showNotification}
                            onOpenLabelGenerator={() => setLabelGenerationModalState({ isOpen: true })}
                            onGenerateLabels={() => {}}
                        />;
            case 'ROTAS':
                return <RotasView customers={customers} />;
            case 'RELATORIOS':
                return <RelatoriosView 
                            customers={customers}
                            billings={billings}
                            expenses={expenses}
                            debtPayments={debtPayments}
                            onThermalPrint={(title, content) => setThermalPrintModalState({ isOpen: true, title, content })}
                        />;
            case 'CONFIGURACOES':
                return <ConfiguracoesView
                            onExportData={handleExportData}
                            onMergeData={handleMergeData}
                            theme={theme}
                            setTheme={setThemeState}
                            showNotification={showNotification}
                            deferredPrompt={deferredPrompt}
                            onInstallPrompt={handleInstallPrompt}
                            onDeleteAllData={() => setIsDeleteAllDataModalOpen(true)}
                        />;
            default:
                return null;
        }
    };
    
    // RENDER LOGIC
    if (isLoadingAuth) {
        return <div className="flex items-center justify-center h-screen bg-slate-900"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-lime-500"></div></div>;
    }

    if (!user) {
        return <LoginView showNotification={showNotification} />;
    }

    return (
        <div className="h-screen flex bg-slate-100 dark:bg-slate-900">
            <Sidebar 
                currentView={currentView} 
                setView={handleSetView} 
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                onOpenScanner={() => setQrScannerModalOpen(true)}
            />
            <div className="flex-1 flex flex-col h-screen">
                <MobileHeader 
                    title={viewTitles[currentView]} 
                    onMenuClick={() => setIsSidebarOpen(true)} 
                    deferredPrompt={deferredPrompt}
                    onInstallPrompt={handleInstallPrompt}
                />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
                    {renderView()}
                </main>
                <SyncStatusIndicator status={syncStatus} onSync={syncData} />
            </div>
            <BottomNavBar currentView={currentView} setView={handleSetView} />
            <Notification notification={notification} onClose={() => setNotification(null)} />
            {isInstallBannerVisible && deferredPrompt && <InstallPwaBanner onInstall={handleInstallPrompt} onDismiss={() => setIsInstallBannerVisible(false)} />}
            
            {/* --- Modals --- */}
            {billingModalState.isOpen && <BillingModal {...billingModalState} onClose={() => setBillingModalState({ isOpen: false, customer: null, equipment: null })} onConfirm={handleAddBilling} onTriggerProvisionalReceiptAction={(billing, onComplete) => { handleOpenReceiptActions(billing, true); onComplete(); }} />}
            {editCustomerModalState.isOpen && <EditCustomerModal {...editCustomerModalState} customers={customers} isSaving={isSaving} showNotification={showNotification} onClose={() => setEditCustomerModalState({ isOpen: false, customer: null })} onConfirm={handleUpdateCustomer} />}
            {debtPaymentModalState.isOpen && <DebtPaymentModal {...debtPaymentModalState} onClose={() => setDebtPaymentModalState({isOpen: false, customer: null})} onConfirm={handlePayDebt} />}
            {historyModalState.isOpen && <HistoryModal {...historyModalState} billings={billings} debtPayments={debtPayments} onClose={() => setHistoryModalState({isOpen: false, customer: null})} />}
            {deleteModalState.isOpen && <ActionModal isOpen={deleteModalState.isOpen} onClose={() => setDeleteModalState({isOpen: false, customer: null})} onConfirm={() => handleDeleteCustomer(deleteModalState.customer!.id)} title="Confirmar Exclusão" confirmText='Sim, Excluir'><p>Tem certeza que deseja excluir o cliente <strong>{deleteModalState.customer?.name}</strong>? Todos os dados associados (cobranças, dívidas, etc.) serão perdidos.</p></ActionModal>}
            {equipmentSelectionModalState.isOpen && <EquipmentSelectionModal {...equipmentSelectionModalState} onSelect={handleEquipmentSelectForBilling} onClose={() => setEquipmentSelectionModalState({isOpen: false, customer: null})} />}
            {receiptActionsModalState.isOpen && receiptActionsModalState.billing && <ReceiptActionsModal {...receiptActionsModalState} billing={receiptActionsModalState.billing} isSharing={isSharing} showNotification={showNotification} onShare={handleShareReceipt} onPrint={async () => { await handlePrintBilling(receiptActionsModalState.billing!, receiptActionsModalState.isProvisional); setReceiptActionsModalState({ isOpen: false, billing: null, isProvisional: false }); }} onPrintRawBt={async () => {}} onPrintSunmi={async () => {}} onClose={() => setReceiptActionsModalState({isOpen: false, billing: null, isProvisional: false})} />}
            {debtReceiptActionsModalState.isOpen && debtReceiptActionsModalState.debtPayment && <DebtReceiptActionsModal {...debtReceiptActionsModalState} debtPayment={debtReceiptActionsModalState.debtPayment} isSharing={isSharing} showNotification={showNotification} onShare={handleShareDebtReceipt} onPrint={async () => { await handlePrintDebt(debtReceiptActionsModalState.debtPayment!); setDebtReceiptActionsModalState({ isOpen: false, debtPayment: null, customer: null }); }} onPrintRawBt={async () => {}} onPrintSunmi={async () => {}} onClose={() => setDebtReceiptActionsModalState({isOpen: false, debtPayment: null, customer: null})} />}
            {shareCustomerModalState.isOpen && <ShareCustomerModal {...shareCustomerModalState} showNotification={showNotification} onPrintCustomer={setCustomerToPrint} onClose={() => setShareCustomerModalState({isOpen: false, customer: null})} />}
            {labelGenerationModalState.isOpen && <LabelGenerationModal {...labelGenerationModalState} customers={customers} showNotification={showNotification} onConfirm={() => {}} onClose={() => setLabelGenerationModalState({isOpen: false})} />}
            {editBillingModalState.isOpen && editBillingModalState.billing && <EditBillingModal {...editBillingModalState} billings={billings} customers={customers} billing={editBillingModalState.billing} onConfirm={handleUpdateBilling} onClose={() => setEditBillingModalState({ isOpen: false, billing: null })} />}
            {qrScannerModalOpen && <QrScannerModal isOpen={qrScannerModalOpen} onClose={() => setQrScannerModalOpen(false)} onScanSuccess={() => {}} showNotification={showNotification} />}
            {thermalPrintModalState.isOpen && <ThermalPrintActionsModal {...thermalPrintModalState} isSharing={isSharing} onShare={async ()=>{}} onPrintRawBt={async ()=>{}} onPrintSunmi={async ()=>{}} onClose={() => setThermalPrintModalState({isOpen: false, title: '', content: ''})} />}
            {locationActionsModalState.isOpen && locationActionsModalState.customer && <LocationActionsModal {...locationActionsModalState} customer={locationActionsModalState.customer} onClose={() => setLocationActionsModalState({ isOpen: false, customer: null })} />}
            {addPhoneModalState.isOpen && addPhoneModalState.customer && <AddPhoneModal {...addPhoneModalState} customer={addPhoneModalState.customer} onClose={() => setAddPhoneModalState({isOpen: false, customer: null})} onConfirm={handleSavePhoneNumber} />}
            {saveLocationModalState.isOpen && (
                <ActionModal
                    isOpen={saveLocationModalState.isOpen}
                    onClose={() => setSaveLocationModalState({ isOpen: false, customer: null })}
                    onConfirm={handleConfirmSaveLocation}
                    title="Salvar Localização"
                    confirmText="Sim, Salvar"
                    isConfirming={isGeolocating}
                >
                    <p>O cliente <strong>{saveLocationModalState.customer?.name}</strong> não possui uma localização salva. Deseja salvar a sua localização atual para este cliente?</p>
                </ActionModal>
            )}
             {isDeleteAllDataModalOpen && (
                <ActionModal
                    isOpen={isDeleteAllDataModalOpen}
                    onClose={() => setIsDeleteAllDataModalOpen(false)}
                    onConfirm={handleDeleteAllData}
                    title="Apagar Todos os Dados?"
                    confirmText="Sim, Apagar Tudo"
                    isConfirming={isSaving}
                >
                    <p className="text-red-400 font-bold">ATENÇÃO: AÇÃO IRREVERSÍVEL!</p>
                    <p className="mt-2">Você tem certeza que deseja apagar permanentemente <strong className="font-bold">todos os seus dados</strong>, incluindo clientes, cobranças e despesas?</p>
                    <p className="mt-2">Esta ação não pode ser desfeita.</p>
                </ActionModal>
            )}
            {fileToMerge && (
                <ActionModal
                    isOpen={!!fileToMerge}
                    onClose={() => setFileToMerge(null)}
                    onConfirm={handleConfirmMergeData}
                    title="Confirmar Importação de Dados?"
                    confirmText="Sim, Importar e Substituir"
                    isConfirming={isSaving}
                >
                    <p className="text-red-400 font-bold">ATENÇÃO: AÇÃO DE ALTO RISCO!</p>
                    <p className="mt-2">Você está prestes a substituir <strong className="font-bold">todos os seus dados atuais</strong> pelos dados do arquivo <strong className="font-bold">{fileToMerge.name}</strong>.</p>
                    <p className="mt-2">Esta ação não pode ser desfeita. Faça isso apenas se tiver certeza de que o arquivo contém um backup completo e válido.</p>
                </ActionModal>
            )}

            {focusedCustomer && <FullScreenCustomerView customer={focusedCustomer} onClose={() => setFocusedCustomer(null)} hasActiveWarning={warnings.some(w => w.customerId === focusedCustomer.id && !w.isResolved)} onBill={handleOpenBillModal} onEdit={(c) => setEditCustomerModalState({ isOpen: true, customer: c })} onDelete={(c) => setDeleteModalState({ isOpen: true, customer: c })} onPayDebt={(c) => setDebtPaymentModalState({ isOpen: true, customer: c })} onHistory={(c) => setHistoryModalState({ isOpen: true, customer: c })} onShare={(c) => setShareCustomerModalState({ isOpen: true, customer: c })} onLocationActions={handleLocationActions} onWhatsAppActions={handleWhatsAppActions} billings={billings} debtPayments={debtPayments} />}
            {customerToPrint && <PrintPreviewOverlay customer={customerToPrint} onCancel={() => setCustomerToPrint(null)} />}
        </div>
    );
};

export default App;