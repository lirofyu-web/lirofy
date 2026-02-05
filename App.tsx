// App.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { collection, query, onSnapshot, Timestamp, getDocs, deleteDoc, doc, setDoc, addDoc, updateDoc, getDoc, writeBatch } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import ReactDOMServer from 'react-dom/server';
import QRCode from 'qrcode';
import { auth, db, processFirestoreDoc, MASTER_USER_UID } from './firebase';

import { Customer, Billing, Expense, DebtPayment, Equipment, Warning, View, Theme, UserProfile, SavedUser } from './types';
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
import { sunmiPrinterService } from './utils/sunmiPrinter';


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
import FinalizePaymentModal from './components/FinalizePaymentModal';
import PrivacyPinModal from './components/PrivacyPinModal';


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

// FIX: Moved `generatePrintableHtml` to module scope to prevent potential variable shadowing issues within the component.
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

    // Privacy Mode State
    const [isPrivacyModeEnabled, setIsPrivacyModeEnabled] = useState<boolean>(() => !!localStorage.getItem('privacyPin'));
    const [isPrivacyUnlocked, setIsPrivacyUnlocked] = useState<boolean>(false);
    const areValuesHidden = useMemo(() => isPrivacyModeEnabled && !isPrivacyUnlocked, [isPrivacyModeEnabled, isPrivacyUnlocked]);
    const [privacyPinModalState, setPrivacyPinModalState] = useState<{ isOpen: boolean; mode: 'create' | 'enter'; title: string; onConfirm: (pin: string) => void; error?: string }>({ isOpen: false, mode: 'enter', title: '', onConfirm: () => {} });

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
    const [finalizePaymentModalState, setFinalizePaymentModalState] = useState<{ isOpen: boolean; billing: Billing | null; }>({ isOpen: false, billing: null });
    const [forgiveDebtModalState, setForgiveDebtModalState] = useState<{ isOpen: boolean; customer: Customer | null; }>({ isOpen: false, customer: null });
    
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
    
    // --- Privacy Mode Handlers ---
    const openPinModal = useCallback((mode: 'create' | 'enter', title: string, onConfirm: (pin: string) => void) => {
        setPrivacyPinModalState({ isOpen: true, mode, title, onConfirm, error: '' });
    }, []);

    const handleSetPin = useCallback((pin: string) => {
        localStorage.setItem('privacyPin', btoa(pin));
        setIsPrivacyModeEnabled(true);
        setIsPrivacyUnlocked(false);
        setPrivacyPinModalState({ isOpen: false, mode: 'create', title: '', onConfirm: () => {} });
        showNotification('Modo de privacidade ativado!', 'success');
    }, [showNotification]);

    const handleUnlock = useCallback((pin: string) => {
        const storedPin = localStorage.getItem('privacyPin');
        if (storedPin && atob(storedPin) === pin) {
            setIsPrivacyUnlocked(true);
            setPrivacyPinModalState({ isOpen: false, mode: 'enter', title: '', onConfirm: () => {} });
            showNotification('Valores visíveis nesta sessão.', 'success');
        } else {
            setPrivacyPinModalState(prev => ({ ...prev, error: 'PIN incorreto.' }));
        }
    }, [showNotification]);

    const handleRemovePin = useCallback((pin: string) => {
        const storedPin = localStorage.getItem('privacyPin');
        if (storedPin && atob(storedPin) === pin) {
            localStorage.removeItem('privacyPin');
            setIsPrivacyModeEnabled(false);
            setIsPrivacyUnlocked(false);
            setPrivacyPinModalState({ isOpen: false, mode: 'enter', title: '', onConfirm: () => {} });
            showNotification('Modo de privacidade desativado.', 'success');
        } else {
            setPrivacyPinModalState(prev => ({ ...prev, error: 'PIN incorreto.' }));
        }
    }, [showNotification]);

    const handleToggleLock = useCallback(() => {
        if (isPrivacyUnlocked) {
            setIsPrivacyUnlocked(false);
            showNotification('Valores ocultados.', 'success');
        } else {
            openPinModal('enter', 'Desbloquear Valores', handleUnlock);
        }
    }, [isPrivacyUnlocked, openPinModal, handleUnlock, showNotification]);

    const handleActivatePrivacyMode = useCallback(() => {
        openPinModal('create', 'Criar PIN de Privacidade', handleSetPin);
    }, [openPinModal, handleSetPin]);

    const handleDeactivatePrivacyMode = useCallback(() => {
        openPinModal('enter', 'Confirmar PIN para Desativar', handleRemovePin);
    }, [openPinModal, handleRemovePin]);


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
    const handleLoginSuccess = useCallback((email: string, password?: string, rememberMe?: boolean) => {
      try {
        const usersStr = localStorage.getItem('savedUsers');
        const users: SavedUser[] = usersStr ? JSON.parse(usersStr) : [];
        const userIndex = users.findIndex(u => u.email === email);

        if (rememberMe && password) {
            // Remember me: save email and encoded password
            const newUser: SavedUser = { email, pass: btoa(password) };
            if (userIndex > -1) {
                users[userIndex] = newUser;
            } else {
                users.push(newUser);
            }
        } else {
             // Not remembering: save email only, removing any existing password
             const newUser: SavedUser = { email };
             if (userIndex > -1) {
                 users[userIndex] = newUser;
             } else {
                users.push(newUser);
             }
        }
        localStorage.setItem('savedUsers', JSON.stringify(users));

      } catch (error) {
        console.error("Failed to update saved users list:", error);
      }
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            await signOut(auth);
            setIsPrivacyUnlocked(false);
        } catch (error) {
            showNotification('Erro ao sair da conta.', 'error');
        }
    }, [showNotification]);

    const handleSwitchAccount = useCallback(async (email: string) => {
        setIsPrivacyUnlocked(false);
        sessionStorage.setItem('switchAccountEmail', email);
        await handleLogout();
    }, [handleLogout]);

    const handleAddNewAccount = useCallback(async () => {
        setIsPrivacyUnlocked(false);
        sessionStorage.removeItem('switchAccountEmail');
        await handleLogout();
    }, [handleLogout]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (!user) {
                setUserProfile(null);
                setIsPrivacyUnlocked(false);
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

        const userIdToListen = user.uid === MASTER_USER_UID ? MASTER_USER_UID : user.uid;
    
        const collections = ['customers', 'billings', 'expenses', 'debtPayments', 'warnings'];
        const setters: Record<string, React.Dispatch<React.SetStateAction<any[]>>> = {
            customers: setCustomers,
            billings: setBillings,
            expenses: setExpenses,
            debtPayments: setDebtPayments,
            warnings: setWarnings,
        };
    
        const unsubscribers = collections.map(col => {
            const q = query(collection(db, `users/${userIdToListen}/${col}`));
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

    const processPayloadForFirestore = useCallback((data: any): any => {
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
    }, []);
    
    // --- Data Handlers (Add, Update, Delete) ---
    
    const handleAddCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'debtAmount' | 'lastVisitedAt'>) => {
        if (!user) return;
        setIsSaving(true);
        const customerWithId: Customer = {
            id: uuidv4(),
            ...customerData,
            createdAt: new Date(),
            debtAmount: 0,
            lastVisitedAt: null,
        };
    
        const originalCustomers = customers;
        setCustomers(prev => [...prev, customerWithId].sort((a,b) => a.name.localeCompare(b.name)));
    
        try {
            const { id, ...payload } = customerWithId;
            const firestorePayload = processPayloadForFirestore(payload);
            if(isOnline) {
                const batch = writeBatch(db);
                batch.set(doc(db, `users/${user.uid}/customers`, id), firestorePayload);
                if (user.uid !== MASTER_USER_UID) {
                    batch.set(doc(db, `users/${MASTER_USER_UID}/customers`, id), firestorePayload);
                }
                await batch.commit();
            } else {
                await queueMutation({ action: 'add', collectionPath: 'customers', payload: customerWithId });
                if (user.uid !== MASTER_USER_UID) {
                    await queueMutation({ action: 'add', collectionPath: 'customers', payload: customerWithId, targetUserId: MASTER_USER_UID });
                }
            }
            showNotification('Cliente adicionado com sucesso!');
        } catch (error) {
            showNotification('Erro ao adicionar cliente. Alteração desfeita.', 'error');
            setCustomers(originalCustomers);
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    }, [customers, isOnline, user, processPayloadForFirestore, showNotification]);
    
    const handleUpdateCustomer = useCallback(async (customer: Customer) => {
        if (!user) return;
        setIsSaving(true);
        const originalCustomers = customers;
       
        setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
        setEditCustomerModalState({ isOpen: false, customer: null });

        const { id, ...customerData } = customer;
        try {
            const firestorePayload = processPayloadForFirestore(customerData);
            if (isOnline) {
                const batch = writeBatch(db);
                batch.update(doc(db, `users/${user.uid}/customers`, id), firestorePayload);
                if (user.uid !== MASTER_USER_UID) {
                    batch.update(doc(db, `users/${MASTER_USER_UID}/customers`, id), firestorePayload);
                }
                await batch.commit();
            } else {
                 await queueMutation({ action: 'update', collectionPath: 'customers', docId: id, payload: customerData });
                 if (user.uid !== MASTER_USER_UID) {
                    await queueMutation({ action: 'update', collectionPath: 'customers', docId: id, payload: customerData, targetUserId: MASTER_USER_UID });
                 }
            }
            showNotification('Cliente atualizado com sucesso!');
        } catch (error) {
            showNotification('Erro ao atualizar cliente. Alterações desfeitas.', 'error');
            setCustomers(originalCustomers);
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    }, [customers, isOnline, user, processPayloadForFirestore, showNotification]);
    
    const handleDeleteCustomer = useCallback(async (customerId: string) => {
        if (!user) return;
        setIsSaving(true);
        const originalCustomers = customers;
    
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        setDeleteModalState({ isOpen: false, customer: null });
    
        try {
            if(isOnline) {
                const batch = writeBatch(db);
                batch.delete(doc(db, `users/${user.uid}/customers`, customerId));
                if (user.uid !== MASTER_USER_UID) {
                    batch.delete(doc(db, `users/${MASTER_USER_UID}/customers`, customerId));
                }
                await batch.commit();
            } else {
                await queueMutation({ action: 'delete', collectionPath: 'customers', docId: customerId, payload: {} });
                if (user.uid !== MASTER_USER_UID) {
                    await queueMutation({ action: 'delete', collectionPath: 'customers', docId: customerId, payload: {}, targetUserId: MASTER_USER_UID });
                }
            }
            showNotification('Cliente excluído com sucesso!');
        } catch (error) {
            showNotification('Erro ao excluir cliente. Alteração desfeita.', 'error');
            setCustomers(originalCustomers);
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    }, [customers, isOnline, user, showNotification]);

    const handleAddBilling = useCallback(async (billing: Billing) => {
        if (!user) return;
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
        
        const debtToAdd = billing.paymentMethod === 'pending_payment' ? 0 : (billing.valorDebitoNegativo || 0);

        const updatedCustomerData = {
            equipment: updatedEquipment,
            lastVisitedAt: new Date(),
            debtAmount: (customerToUpdate.debtAmount || 0) + debtToAdd
        };
        const updatedCustomer = { ...customerToUpdate, ...updatedCustomerData };
    
        setBillings(prev => [...prev, billing]);
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
        setBillingModalState({ isOpen: false, customer: null, equipment: null });
    
        try {
            const { id: billingId, ...billingPayload } = billing;
            const { id: customerId, ...customerPayload } = updatedCustomer;
            
            const firestoreBillingPayload = processPayloadForFirestore(billingPayload);
            const firestoreCustomerPayload = processPayloadForFirestore(customerPayload);

            if (isOnline) {
                const batch = writeBatch(db);
                batch.set(doc(db, `users/${user.uid}/billings`, billingId), firestoreBillingPayload);
                batch.update(doc(db, `users/${user.uid}/customers`, customerId), firestoreCustomerPayload);

                if (user.uid !== MASTER_USER_UID) {
                    batch.set(doc(db, `users/${MASTER_USER_UID}/billings`, billingId), firestoreBillingPayload);
                    batch.update(doc(db, `users/${MASTER_USER_UID}/customers`, customerId), firestoreCustomerPayload);
                }
                await batch.commit();
            } else {
                await queueMutation({ action: 'add', collectionPath: 'billings', payload: billing });
                await queueMutation({ action: 'update', collectionPath: 'customers', docId: customerId, payload: customerPayload });
                if (user.uid !== MASTER_USER_UID) {
                    await queueMutation({ action: 'add', collectionPath: 'billings', payload: billing, targetUserId: MASTER_USER_UID });
                    await queueMutation({ action: 'update', collectionPath: 'customers', docId: customerId, payload: customerPayload, targetUserId: MASTER_USER_UID });
                }
            }
            
            if (billing.paymentMethod !== 'pending_payment') {
                setReceiptActionsModalState({ isOpen: true, billing, isProvisional: false });
            } else {
                showNotification('Cobrança salva com pagamento pendente.', 'success');
            }
        } catch (error) {
            showNotification('Erro ao salvar faturamento. Alterações desfeitas.', 'error');
            setCustomers(originalCustomers);
            setBillings(originalBillings);
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    }, [billings, customers, isOnline, user, processPayloadForFirestore, showNotification]);
    
    const handleUpdateBilling = useCallback(async (billing: Billing) => {
        if (!user) return;
        setIsSaving(true);
        const originalBillings = billings;
        const originalCustomers = customers;

        const oldBilling = originalBillings.find(b => b.id === billing.id);
        if (!oldBilling) {
            showNotification('Cobrança original não encontrada.', 'error');
            setIsSaving(false);
            return;
        }

        const customerToUpdate = customers.find(c => c.id === billing.customerId);
        if (!customerToUpdate) {
            showNotification('Cliente não encontrado.', 'error');
            setIsSaving(false);
            return;
        }

        const oldDebtChange = oldBilling.valorDebitoNegativo || 0;
        const newDebtChange = billing.valorDebitoNegativo || 0;
        const debtDifference = newDebtChange - oldDebtChange;
        
        const nextBillingForEquipment = billings
            .filter(b => b.equipmentId === billing.equipmentId && new Date(b.settledAt) > new Date(billing.settledAt))
            .sort((a,b) => new Date(a.settledAt).getTime() - new Date(b.settledAt).getTime())[0];

        const updatedCustomer = { ...customerToUpdate, debtAmount: customerToUpdate.debtAmount + debtDifference };
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
        setBillings(prev => prev.map(b => b.id === billing.id ? billing : b));
        setEditBillingModalState({ isOpen: false, billing: null });

        try {
            const { id: billingId, ...billingPayload } = billing;
            const { id: customerId, ...customerPayload } = updatedCustomer;

            let nextBillingPayload: any = null;
            let nextBillingId: string | undefined;

            if (nextBillingForEquipment) {
                const updatedNextBilling = { ...nextBillingForEquipment, relogioAnterior: billing.relogioAtual };
                setBillings(prev => prev.map(b => b.id === updatedNextBilling.id ? updatedNextBilling : b));
                nextBillingId = updatedNextBilling.id;
                const { id, ...payload } = updatedNextBilling;
                nextBillingPayload = payload;
            }

            if (isOnline) {
                const batch = writeBatch(db);
                const userBillingRef = doc(db, `users/${user.uid}/billings`, billingId);
                const userCustomerRef = doc(db, `users/${user.uid}/customers`, customerId);

                batch.update(userBillingRef, processPayloadForFirestore(billingPayload));
                batch.update(userCustomerRef, processPayloadForFirestore(customerPayload));
                if (nextBillingId && nextBillingPayload) batch.update(doc(db, `users/${user.uid}/billings`, nextBillingId), processPayloadForFirestore(nextBillingPayload));

                if (user.uid !== MASTER_USER_UID) {
                    batch.update(doc(db, `users/${MASTER_USER_UID}/billings`, billingId), processPayloadForFirestore(billingPayload));
                    batch.update(doc(db, `users/${MASTER_USER_UID}/customers`, customerId), processPayloadForFirestore(customerPayload));
                    if (nextBillingId && nextBillingPayload) batch.update(doc(db, `users/${MASTER_USER_UID}/billings`, nextBillingId), processPayloadForFirestore(nextBillingPayload));
                }
                await batch.commit();
            } else {
                await queueMutation({ action: 'update', collectionPath: 'billings', docId: billingId, payload: billingPayload });
                await queueMutation({ action: 'update', collectionPath: 'customers', docId: customerId, payload: customerPayload });
                if (nextBillingId && nextBillingPayload) await queueMutation({ action: 'update', collectionPath: 'billings', docId: nextBillingId, payload: nextBillingPayload });

                if (user.uid !== MASTER_USER_UID) {
                     await queueMutation({ action: 'update', collectionPath: 'billings', docId: billingId, payload: billingPayload, targetUserId: MASTER_USER_UID });
                     await queueMutation({ action: 'update', collectionPath: 'customers', docId: customerId, payload: customerPayload, targetUserId: MASTER_USER_UID });
                     if (nextBillingId && nextBillingPayload) await queueMutation({ action: 'update', collectionPath: 'billings', docId: nextBillingId, payload: nextBillingPayload, targetUserId: MASTER_USER_UID });
                }
            }
            showNotification('Cobrança atualizada com sucesso!');
        } catch (error) {
            showNotification('Erro ao atualizar cobrança.', 'error');
            setBillings(originalBillings);
            setCustomers(originalCustomers);
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    }, [billings, customers, isOnline, user, processPayloadForFirestore, showNotification]);

    const handleDeleteBilling = useCallback(async (billingId: string) => {
        if (!user) return;
        setIsSaving(true);
        const originalBillings = billings;
        const originalCustomers = customers;
    
        const billingToDelete = originalBillings.find(b => b.id === billingId);
        if (!billingToDelete) return;
        const customerToUpdate = originalCustomers.find(c => c.id === billingToDelete.customerId);
        if (!customerToUpdate) return;
        
        const restoredRelogioAnterior = billingToDelete.relogioAnterior;
        const debtToRemove = billingToDelete.valorDebitoNegativo || 0;
        const updatedCustomerPayload = { 
            debtAmount: (customerToUpdate.debtAmount || 0) - debtToRemove, 
            equipment: customerToUpdate.equipment.map(e => e.id === billingToDelete.equipmentId ? { ...e, relogioAnterior: restoredRelogioAnterior } : e) 
        };
        const updatedCustomer = { ...customerToUpdate, ...updatedCustomerPayload };
    
        setBillings(prev => prev.filter(b => b.id !== billingId));
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
        
        try {
            if (isOnline) {
                const batch = writeBatch(db);
                batch.delete(doc(db, `users/${user.uid}/billings`, billingId));
                batch.update(doc(db, `users/${user.uid}/customers`, updatedCustomer.id), processPayloadForFirestore(updatedCustomerPayload));

                if (user.uid !== MASTER_USER_UID) {
                    batch.delete(doc(db, `users/${MASTER_USER_UID}/billings`, billingId));
                    batch.update(doc(db, `users/${MASTER_USER_UID}/customers`, updatedCustomer.id), processPayloadForFirestore(updatedCustomerPayload));
                }
                await batch.commit();
            } else {
                await queueMutation({ action: 'delete', collectionPath: 'billings', docId: billingId, payload: {} });
                await queueMutation({ action: 'update', collectionPath: 'customers', docId: updatedCustomer.id, payload: updatedCustomerPayload });
                if (user.uid !== MASTER_USER_UID) {
                     await queueMutation({ action: 'delete', collectionPath: 'billings', docId: billingId, payload: {}, targetUserId: MASTER_USER_UID });
                     await queueMutation({ action: 'update', collectionPath: 'customers', docId: updatedCustomer.id, payload: updatedCustomerPayload, targetUserId: MASTER_USER_UID });
                }
            }
            showNotification('Cobrança excluída! O relógio do equipamento foi revertido.', 'success');
        } catch (error) {
            showNotification('Erro ao excluir cobrança. As alterações foram desfeitas.', 'error');
            setBillings(originalBillings);
            setCustomers(originalCustomers);
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    }, [billings, customers, isOnline, user, processPayloadForFirestore, showNotification]);

    const handleAddExpense = useCallback(async (description: string, amount: number, category: Expense['category']) => {
        if (!user) return;
        setIsSaving(true);
        const newExpense: Expense = {
            id: uuidv4(),
            description,
            amount,
            category,
            date: new Date(),
        };

        const originalExpenses = expenses;
        setExpenses(prev => [...prev, newExpense].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        
        try {
            const { id, ...payload } = newExpense;
            const firestorePayload = processPayloadForFirestore(payload);
            if(isOnline) {
                const batch = writeBatch(db);
                batch.set(doc(db, `users/${user.uid}/expenses`, id), firestorePayload);
                if (user.uid !== MASTER_USER_UID) {
                    batch.set(doc(db, `users/${MASTER_USER_UID}/expenses`, id), firestorePayload);
                }
                await batch.commit();
            } else {
                await queueMutation({ action: 'add', collectionPath: 'expenses', payload: newExpense });
                if (user.uid !== MASTER_USER_UID) {
                    await queueMutation({ action: 'add', collectionPath: 'expenses', payload: newExpense, targetUserId: MASTER_USER_UID });
                }
            }
            showNotification('Despesa adicionada com sucesso!');
        } catch (error) {
            showNotification('Erro ao adicionar despesa.', 'error');
            setExpenses(originalExpenses);
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    }, [expenses, isOnline, user, processPayloadForFirestore, showNotification]);

    const handleDeleteExpense = useCallback(async (expenseId: string) => {
        if (!user) return;
        setIsSaving(true);
        const originalExpenses = expenses;
        setExpenses(prev => prev.filter(e => e.id !== expenseId));

        try {
            if(isOnline) {
                const batch = writeBatch(db);
                batch.delete(doc(db, `users/${user.uid}/expenses`, expenseId));
                if (user.uid !== MASTER_USER_UID) {
                    batch.delete(doc(db, `users/${MASTER_USER_UID}/expenses`, expenseId));
                }
                await batch.commit();
            } else {
                await queueMutation({ action: 'delete', collectionPath: 'expenses', docId: expenseId, payload: {} });
                 if (user.uid !== MASTER_USER_UID) {
                    await queueMutation({ action: 'delete', collectionPath: 'expenses', docId: expenseId, payload: {}, targetUserId: MASTER_USER_UID });
                }
            }
            showNotification('Despesa excluída com sucesso!');
        } catch (error) {
            showNotification('Erro ao excluir despesa.', 'error');
            setExpenses(originalExpenses);
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    }, [expenses, isOnline, user, showNotification]);

    const handleAddDebtPayment = useCallback(async (customerId: string, details: { amountPaidDinheiro: number; amountPaidPix: number } | { amountToAdd: number }) => {
        if (!user) return;
        setIsSaving(true);
        const originalCustomers = customers;
        const customerToUpdate = customers.find(c => c.id === customerId);
        if (!customerToUpdate) return;

        let updatedCustomer: Customer;
        let debtPayment: DebtPayment | null = null;
        let isPayingDebt = false;

        if ('amountToAdd' in details) { // Adding debt
            const newDebtAmount = customerToUpdate.debtAmount + details.amountToAdd;
            updatedCustomer = { ...customerToUpdate, debtAmount: newDebtAmount };
        } else { // Paying debt
            isPayingDebt = true;
            const { amountPaidDinheiro, amountPaidPix } = details;
            const totalPaid = amountPaidDinheiro + amountPaidPix;
            
            const newDebtAmount = Math.max(0, customerToUpdate.debtAmount - totalPaid);
            updatedCustomer = { ...customerToUpdate, debtAmount: newDebtAmount };

            const methodsUsed: ('dinheiro' | 'pix')[] = [];
            if (amountPaidDinheiro > 0) methodsUsed.push('dinheiro');
            if (amountPaidPix > 0) methodsUsed.push('pix');

            let paymentMethod: DebtPayment['paymentMethod'] = methodsUsed.length > 1 ? 'misto' : (methodsUsed[0] || 'dinheiro');

            debtPayment = {
                id: uuidv4(), customerId, customerName: customerToUpdate.name, amountPaid: totalPaid, paidAt: new Date(), paymentMethod,
                amountPaidDinheiro: amountPaidDinheiro > 0 ? amountPaidDinheiro : undefined,
                amountPaidPix: amountPaidPix > 0 ? amountPaidPix : undefined,
            };
        }
        
        setCustomers(prev => prev.map(c => c.id === customerId ? updatedCustomer : c));
        if (debtPayment) setDebtPayments(prev => [...prev, debtPayment!]);
        setDebtPaymentModalState({isOpen: false, customer: null});

        try {
            const customerPayload = { debtAmount: updatedCustomer.debtAmount };
            if (isOnline) {
                const batch = writeBatch(db);
                batch.update(doc(db, `users/${user.uid}/customers`, updatedCustomer.id), customerPayload);
                if (user.uid !== MASTER_USER_UID) batch.update(doc(db, `users/${MASTER_USER_UID}/customers`, updatedCustomer.id), customerPayload);

                if (debtPayment) {
                    const { id: dpId, ...dpPayload } = debtPayment;
                    const firestoreDpPayload = processPayloadForFirestore(dpPayload);
                    batch.set(doc(db, `users/${user.uid}/debtPayments`, dpId), firestoreDpPayload);
                    if (user.uid !== MASTER_USER_UID) batch.set(doc(db, `users/${MASTER_USER_UID}/debtPayments`, dpId), firestoreDpPayload);
                }
                await batch.commit();
            } else {
                await queueMutation({ action: 'update', collectionPath: 'customers', docId: updatedCustomer.id, payload: customerPayload });
                if (user.uid !== MASTER_USER_UID) await queueMutation({ action: 'update', collectionPath: 'customers', docId: updatedCustomer.id, payload: customerPayload, targetUserId: MASTER_USER_UID });
                if (debtPayment) {
                    await queueMutation({ action: 'add', collectionPath: 'debtPayments', payload: debtPayment });
                    if (user.uid !== MASTER_USER_UID) await queueMutation({ action: 'add', collectionPath: 'debtPayments', payload: debtPayment, targetUserId: MASTER_USER_UID });
                }
            }
            
            if (isPayingDebt && debtPayment) {
                setDebtReceiptActionsModalState({ isOpen: true, debtPayment, customer: updatedCustomer });
            } else {
                showNotification(`Dívida de R$ ${('amountToAdd' in details ? details.amountToAdd : 0).toFixed(2)} adicionada para ${customerToUpdate.name}.`);
            }
        } catch (error) {
            showNotification('Erro ao processar dívida.', 'error');
            setCustomers(originalCustomers);
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    }, [customers, isOnline, user, processPayloadForFirestore, showNotification]);


    const handleForgiveDebt = useCallback(async (customer: Customer) => {
        if (!user) return;
        setIsSaving(true);
        const originalCustomers = customers;
        const updatedCustomer = { ...customer, debtAmount: 0 };

        setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
        setForgiveDebtModalState({ isOpen: false, customer: null });
        setDebtPaymentModalState({ isOpen: false, customer: null });

        try {
            const payload = { debtAmount: 0 };
            if (isOnline) {
                const batch = writeBatch(db);
                batch.update(doc(db, `users/${user.uid}/customers`, customer.id), payload);
                if (user.uid !== MASTER_USER_UID) batch.update(doc(db, `users/${MASTER_USER_UID}/customers`, customer.id), payload);
                await batch.commit();
            } else {
                await queueMutation({ action: 'update', collectionPath: 'customers', docId: customer.id, payload });
                if (user.uid !== MASTER_USER_UID) await queueMutation({ action: 'update', collectionPath: 'customers', docId: customer.id, payload, targetUserId: MASTER_USER_UID });
            }
            showNotification(`Dívida de ${customer.name} foi perdoada.`, 'success');
        } catch (error) {
            setCustomers(originalCustomers);
            showNotification('Erro ao perdoar dívida.', 'error');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    }, [customers, isOnline, user, showNotification]);


    const handleAddWarning = useCallback(async (customerId: string, message: string) => {
        if (!user) return;
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;

        const newWarning: Warning = { id: uuidv4(), customerId, customerName: customer.name, message, createdAt: new Date(), isResolved: false };
        const originalWarnings = warnings;
        setWarnings(prev => [newWarning, ...prev]);

        try {
            const { id, ...payload } = newWarning;
            const firestorePayload = processPayloadForFirestore(payload);
            if (isOnline) {
                const batch = writeBatch(db);
                batch.set(doc(db, `users/${user.uid}/warnings`, id), firestorePayload);
                if (user.uid !== MASTER_USER_UID) batch.set(doc(db, `users/${MASTER_USER_UID}/warnings`, id), firestorePayload);
                await batch.commit();
            } else {
                await queueMutation({ action: 'add', collectionPath: 'warnings', payload: newWarning });
                if (user.uid !== MASTER_USER_UID) await queueMutation({ action: 'add', collectionPath: 'warnings', payload: newWarning, targetUserId: MASTER_USER_UID });
            }
            showNotification("Aviso adicionado com sucesso!", "success");
        } catch (error) {
            setWarnings(originalWarnings);
            showNotification("Erro ao adicionar aviso.", "error");
            console.error(error);
        }
    }, [customers, warnings, isOnline, user, processPayloadForFirestore, showNotification]);

    const handleResolveWarning = useCallback(async (warningId: string) => {
        if (!user) return;
        const originalWarnings = warnings;
        setWarnings(prev => prev.map(w => w.id === warningId ? { ...w, isResolved: true } : w));

        try {
            const payload = { isResolved: true };
            if (isOnline) {
                const batch = writeBatch(db);
                batch.update(doc(db, `users/${user.uid}/warnings`, warningId), payload);
                if (user.uid !== MASTER_USER_UID) batch.update(doc(db, `users/${MASTER_USER_UID}/warnings`, warningId), payload);
                await batch.commit();
            } else {
                await queueMutation({ action: 'update', collectionPath: 'warnings', docId: warningId, payload });
                if (user.uid !== MASTER_USER_UID) await queueMutation({ action: 'update', collectionPath: 'warnings', docId: warningId, payload, targetUserId: MASTER_USER_UID });
            }
            showNotification("Aviso marcado como resolvido.", "success");
        } catch (error) {
            setWarnings(originalWarnings);
            showNotification("Erro ao resolver aviso.", "error");
            console.error(error);
        }
    }, [warnings, isOnline, user, showNotification]);

    const handleDeleteWarning = useCallback(async (warningId: string) => {
        if (!user) return;
        const originalWarnings = warnings;
        setWarnings(prev => prev.filter(w => w.id !== warningId));
        
        try {
            if (isOnline) {
                const batch = writeBatch(db);
                batch.delete(doc(db, `users/${user.uid}/warnings`, warningId));
                if (user.uid !== MASTER_USER_UID) batch.delete(doc(db, `users/${MASTER_USER_UID}/warnings`, warningId));
                await batch.commit();
            } else {
                await queueMutation({ action: 'delete', collectionPath: 'warnings', docId: warningId, payload: {} });
                if (user.uid !== MASTER_USER_UID) await queueMutation({ action: 'delete', collectionPath: 'warnings', docId: warningId, payload: {}, targetUserId: MASTER_USER_UID });
            }
            showNotification("Aviso excluído.", "success");
        } catch (error) {
            setWarnings(originalWarnings);
            showNotification("Erro ao excluir aviso.", "error");
            console.error(error);
        }
    }, [warnings, isOnline, user, showNotification]);
    
    const handleFinalizePendingPayment = useCallback(async (updatedBilling: Billing) => {
        if (!user) return;
        setIsSaving(true);
        const originalBillings = billings;
        const originalCustomers = customers;

        const customerToUpdate = customers.find(c => c.id === updatedBilling.customerId);
        if (!customerToUpdate) return;

        const debtToAdd = updatedBilling.valorDebitoNegativo || 0;
        const updatedCustomer = { ...customerToUpdate, debtAmount: (customerToUpdate.debtAmount || 0) + debtToAdd };

        setBillings(prev => prev.map(b => b.id === updatedBilling.id ? updatedBilling : b));
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
        setFinalizePaymentModalState({ isOpen: false, billing: null });

        try {
            const { id: billingId, ...billingPayload } = updatedBilling;
            const { id: customerId, ...customerPayload } = updatedCustomer;
            
            const firestoreBillingPayload = processPayloadForFirestore(billingPayload);
            const firestoreCustomerPayload = processPayloadForFirestore(customerPayload);

            if (isOnline) {
                const batch = writeBatch(db);
                batch.update(doc(db, `users/${user.uid}/billings`, billingId), firestoreBillingPayload);
                batch.update(doc(db, `users/${user.uid}/customers`, customerId), firestoreCustomerPayload);
                if (user.uid !== MASTER_USER_UID) {
                    batch.update(doc(db, `users/${MASTER_USER_UID}/billings`, billingId), firestoreBillingPayload);
                    batch.update(doc(db, `users/${MASTER_USER_UID}/customers`, customerId), firestoreCustomerPayload);
                }
                await batch.commit();
            } else {
                await queueMutation({ action: 'update', collectionPath: 'billings', docId: billingId, payload: billingPayload });
                await queueMutation({ action: 'update', collectionPath: 'customers', docId: customerId, payload: customerPayload });
                 if (user.uid !== MASTER_USER_UID) {
                    await queueMutation({ action: 'update', collectionPath: 'billings', docId: billingId, payload: billingPayload, targetUserId: MASTER_USER_UID });
                    await queueMutation({ action: 'update', collectionPath: 'customers', docId: customerId, payload: customerPayload, targetUserId: MASTER_USER_UID });
                }
            }
            
            setReceiptActionsModalState({ isOpen: true, billing: updatedBilling, isProvisional: false });
        } catch (error) {
            showNotification('Erro ao finalizar pagamento.', 'error');
            setBillings(originalBillings);
            setCustomers(originalCustomers);
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    }, [billings, customers, isOnline, user, processPayloadForFirestore, showNotification]);
    
    const handleTriggerProvisionalReceiptAction = useCallback((billing: Billing, onComplete: () => void) => {
        setReceiptActionsModalState({ isOpen: true, billing, isProvisional: true });
        onComplete();
    }, []);

    // --- Modal Triggers ---
    const handleOpenBillingModal = useCallback((customer: Customer) => {
        if (customer.equipment?.length === 1) {
            setBillingModalState({ isOpen: true, customer, equipment: customer.equipment[0] });
        } else {
            setEquipmentSelectionModalState({ isOpen: true, customer });
        }
    }, []);

    const handleSelectEquipmentForBilling = useCallback((equipment: Equipment) => {
        setBillingModalState({ isOpen: true, customer: equipmentSelectionModalState.customer, equipment });
        setEquipmentSelectionModalState({ isOpen: false, customer: null });
    }, [equipmentSelectionModalState.customer]);
    
    const handleOpenEditBillingModal = useCallback((billing: Billing) => {
        setEditBillingModalState({ isOpen: true, billing });
    }, []);
    
    const handleOpenEditCustomerModal = useCallback((customer: Customer) => {
        setEditCustomerModalState({ isOpen: true, customer });
    }, []);
    
    const handleOpenDeleteModal = useCallback((customer: Customer) => {
        setDeleteModalState({ isOpen: true, customer });
    }, []);

    const handleOpenDebtPaymentModal = useCallback((customer: Customer) => {
        setDebtPaymentModalState({ isOpen: true, customer });
    }, []);

    const handleOpenHistoryModal = useCallback((customer: Customer) => {
        setHistoryModalState({ isOpen: true, customer });
    }, []);
    
    const handleOpenShareCustomerModal = useCallback((customer: Customer) => {
        setShareCustomerModalState({ isOpen: true, customer });
    }, []);
    
    const handlePrintCustomerSheet = useCallback((customer: Customer) => {
        setCustomerToPrint(customer);
    }, []);
    
    const handleOpenLocationActions = useCallback((customer: Customer) => {
        if (customer.latitude && customer.longitude) {
            setLocationActionsModalState({ isOpen: true, customer });
        } else {
            setSaveLocationModalState({ isOpen: true, customer });
        }
    }, []);

    const handleSaveLocation = useCallback(async (customer: Customer) => {
        if (!navigator.geolocation) {
            showNotification("Geolocalização não é suportada neste navegador.", "error");
            return;
        }
        setIsGeolocating(true);
        setSaveLocationModalState({ isOpen: false, customer: null });
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const updatedCustomer = { ...customer, latitude, longitude };
                handleUpdateCustomer(updatedCustomer);
                setIsGeolocating(false);
            },
            (error) => {
                let message = "Erro ao obter localização.";
                if (error.code === 1) message = "Permissão de localização negada.";
                showNotification(message, "error");
                setIsGeolocating(false);
            },
            { enableHighAccuracy: true }
        );
    }, [handleUpdateCustomer, showNotification]);
    
    const handleWhatsAppActions = useCallback((customer: Customer) => {
        if (customer.telefone) {
            const phone = customer.telefone.replace(/\D/g, '');
            const text = encodeURIComponent(`Olá ${customer.name}, tudo bem?`);
            window.open(`https://wa.me/55${phone}?text=${text}`, '_blank');
        } else {
            setAddPhoneModalState({ isOpen: true, customer });
        }
    }, []);

    const handleAddPhone = useCallback(async (phone: string) => {
        const customer = addPhoneModalState.customer;
        if (!customer) return;
        const updatedCustomer = { ...customer, telefone: phone };
        await handleUpdateCustomer(updatedCustomer);
        setAddPhoneModalState({ isOpen: false, customer: null });
    }, [addPhoneModalState.customer, handleUpdateCustomer]);

    const handleInstallPrompt = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                setDeferredPrompt(null);
                setIsInstallBannerVisible(false);
            });
        }
    };
    
    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const handleExportData = useCallback(() => {
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
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        a.href = url;
        a.download = `backup-montanha-gestao-${timestamp}.json`;
        a.click();
        URL.revokeObjectURL(url);
        const backupTimestamp = new Date().toISOString();
        localStorage.setItem('lastBackupTimestamp', backupTimestamp);
        setLastBackupTimestamp(backupTimestamp);
        showNotification('Backup exportado com sucesso!', 'success');
    }, [customers, billings, expenses, debtPayments, warnings, showNotification]);

    const handleMergeData = useCallback(async (file: File) => {
        if (!user) {
            showNotification("Você precisa estar logado para importar dados.", "error");
            return;
        }
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                
                if (!data.customers || !Array.isArray(data.customers)) {
                    throw new Error("Arquivo de backup inválido.");
                }

                setIsSaving(true);
                const batch = writeBatch(db);
                const collections = ['customers', 'billings', 'expenses', 'debtPayments', 'warnings'];

                // 1. Get current user's documents to delete them
                for (const col of collections) {
                    const snapshot = await getDocs(collection(db, `users/${user.uid}/${col}`));
                    snapshot.forEach(d => {
                        batch.delete(d.ref);
                        if (user.uid !== MASTER_USER_UID) {
                            batch.delete(doc(db, `users/${MASTER_USER_UID}/${col}`, d.id));
                        }
                    });
                }

                // 2. Add new documents from backup file
                for (const colName of collections) {
                    if(data[colName] && Array.isArray(data[colName])) {
                        data[colName].forEach((item: any) => {
                            const { id, ...payload } = item;
                            if (!id) {
                                console.warn(`Item in ${colName} is missing an ID, skipping.`, item);
                                return;
                            }
                            const firestorePayload = processPayloadForFirestore(payload);
                            
                            batch.set(doc(db, `users/${user.uid}/${colName}`, id), firestorePayload);
                            if (user.uid !== MASTER_USER_UID) {
                                batch.set(doc(db, `users/${MASTER_USER_UID}/${colName}`, id), firestorePayload);
                            }
                        });
                    }
                }

                await batch.commit();
                await clearOfflineQueue();

                showNotification('Dados importados com sucesso! A página será recarregada.', 'success');
                setTimeout(() => window.location.reload(), 2000);
            } catch (error) {
                console.error("Erro ao importar dados: ", error);
                let errorMessage = 'Ocorreu um erro ao importar os dados.';
                if (error instanceof Error) {
                    if (error.message.includes("permissions")) {
                        errorMessage = "Erro de permissão ao importar. A operação foi bloqueada.";
                    } else if (error.message.includes("invalid")) {
                        errorMessage = "O arquivo de backup parece ser inválido ou corrompido.";
                    } else {
                        errorMessage = error.message;
                    }
                }
                showNotification(errorMessage, 'error');
            } finally {
                setIsSaving(false);
            }
        };
        reader.readAsText(file);
    }, [user, processPayloadForFirestore, showNotification]);

    const handleDeleteAllData = useCallback(async () => {
        if (!user) {
            showNotification("Você precisa estar logado.", "error");
            return;
        }
        setIsSaving(true);
        setIsDeleteAllDataModalOpen(false);
        try {
            const batch = writeBatch(db);
            const collections = ['customers', 'billings', 'expenses', 'debtPayments', 'warnings'];
    
            // Get all of the current user's documents to build a list of IDs to delete
            const docsToDelete: { collection: string, id: string }[] = [];
            for (const col of collections) {
                const snapshot = await getDocs(collection(db, `users/${user.uid}/${col}`));
                snapshot.forEach(d => {
                    docsToDelete.push({ collection: col, id: d.id });
                });
            }
    
            // Add delete operations for both the user's and the master's path
            docsToDelete.forEach(docInfo => {
                // Delete from current user's path
                batch.delete(doc(db, `users/${user.uid}/${docInfo.collection}`, docInfo.id));
                
                // If not master, also delete the mirrored doc from master
                if (user.uid !== MASTER_USER_UID) {
                    batch.delete(doc(db, `users/${MASTER_USER_UID}/${docInfo.collection}`, docInfo.id));
                }
            });
    
            await batch.commit();
            await clearOfflineQueue();
            showNotification("Todos os dados foram apagados com sucesso.", 'success');
        } catch (error) {
            console.error("Erro ao apagar dados:", error);
            showNotification("Falha ao apagar os dados.", "error");
        } finally {
            setIsSaving(false);
        }
    }, [user, showNotification]);

    const handleThermalPrint = useCallback(async (title: string, content: string) => {
        setThermalPrintModalState({ isOpen: true, title, content });
    }, []);

    const shareText = useCallback(async (text: string, title: string) => {
        setIsSharing(true);
        try {
            if (navigator.share) {
                await navigator.share({ title, text });
            } else {
                await navigator.clipboard.writeText(text);
                showNotification('Copiado para a área de transferência!', 'success');
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                showNotification('Erro ao compartilhar.', 'error');
            }
        } finally {
            setIsSharing(false);
        }
    }, [showNotification]);
    
    const handlePrintSunmi = useCallback(async (text: string) => {
        setIsSharing(true);
        try {
            showNotification('Imprimindo na impressora interna...', 'success');
            await sunmiPrinterService.printReceipt(text);
            showNotification('Impresso com sucesso!', 'success');
        } catch (error) {
            showNotification(error instanceof Error ? error.message : 'Falha na impressão térmica.', 'error');
        } finally {
            setIsSharing(false);
        }
    }, [showNotification]);

    const handleShareReceipt = useCallback(async (receiptData: Billing | DebtPayment) => {
        const isBilling = 'equipmentType' in receiptData;
        const text = isBilling
            ? generateBillingText(receiptData as Billing, false)
            : generateDebtText(receiptData as DebtPayment);
        const title = isBilling ? `Comprovante - ${receiptData.customerName}` : `Pagamento - ${receiptData.customerName}`;
        await shareText(text, title);
    }, [shareText]);

    const handlePrintPdfReceipt = useCallback(async (receiptData: Billing | DebtPayment) => {
        try {
            const isBilling = 'equipmentType' in receiptData;
            const title = isBilling ? `Comprovante - ${(receiptData as Billing).customerName}` : `Pagamento - ${receiptData.customerName}`;

            const pixPayload = "00020126360014BR.GOV.BCB.PIX0114+55439995819935204000053039865802BR5915BILHAR MONTANHA6012Jaguapita-PR62070503***6304F96E";
            const qrCodeDataUrl = await QRCode.toDataURL(pixPayload, {
                width: 150,
                margin: 1,
                errorCorrectionLevel: 'M',
                color: { dark: '#000000', light: '#FFFFFF' }
            });

            const SheetComponent = isBilling 
                ? <ReceiptSheet billing={receiptData as Billing} qrCodeDataUrl={qrCodeDataUrl} /> 
                : <DebtReceiptSheet debtPayment={receiptData as DebtPayment} qrCodeDataUrl={qrCodeDataUrl} />;
            
            const content = ReactDOMServer.renderToString(SheetComponent);
            const printableHtml = generatePrintableHtml(title, content);
            const printWindow = window.open('', '', 'height=800,width=400');
            if (printWindow) {
                printWindow.document.write(printableHtml);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => { printWindow.print(); }, 500);
            } else {
                showNotification("Por favor, habilite pop-ups para imprimir.", "error");
            }
        } catch (error) {
            console.error("Error generating PDF receipt:", error);
            showNotification('Falha ao gerar PDF para impressão.', 'error');
        }
    }, [showNotification]);

    const handlePrintThermalReceipt = useCallback(async (receiptData: Billing | DebtPayment) => {
        const isBilling = 'equipmentType' in receiptData;
        const text = isBilling
            ? generateBillingText(receiptData as Billing, false)
            : generateDebtText(receiptData as DebtPayment);
        await handlePrintSunmi(text);
    }, [handlePrintSunmi]);

    const setView = useCallback((view: View) => {
        setCurrentView(view);
        localStorage.setItem('lastActiveView', view);
        setFocusedCustomer(null);
    }, []);

    const activeView = useMemo(() => {
        switch (currentView) {
            case 'DASHBOARD': return <DashboardView billings={billings} expenses={expenses} customers={customers} debtPayments={debtPayments} warnings={warnings} onAddWarning={handleAddWarning} onResolveWarning={handleResolveWarning} onDeleteWarning={handleDeleteWarning} lastBackupDate={lastBackupTimestamp} onNavigateToSettings={() => setView('CONFIGURACOES')} areValuesHidden={areValuesHidden} />;
            case 'CLIENTES': return <ClientesView customers={customers} warnings={warnings} billings={billings} onAddCustomer={handleAddCustomer} isSaving={isSaving} showNotification={showNotification} onFocusCustomer={setFocusedCustomer} onBillCustomer={handleOpenBillingModal} onEditCustomer={handleOpenEditCustomerModal} onDeleteCustomer={handleOpenDeleteModal} onPayDebtCustomer={handleOpenDebtPaymentModal} onHistoryCustomer={handleOpenHistoryModal} onShareCustomer={handleOpenShareCustomerModal} onOpenScanner={() => setQrScannerModalOpen(true)} onLocationActions={handleOpenLocationActions} onWhatsAppActions={handleWhatsAppActions} onFinalizePendingPayment={(billing) => setFinalizePaymentModalState({ isOpen: true, billing })} areValuesHidden={areValuesHidden} />;
            case 'COBRANCAS': return <CobrancasView billings={billings} customers={customers} debtPayments={debtPayments} onShowActions={(billing) => setReceiptActionsModalState({ isOpen: true, billing, isProvisional: false })} onEditBilling={handleOpenEditBillingModal} onDeleteBilling={handleDeleteBilling} onFinalizePayment={(billing) => setFinalizePaymentModalState({ isOpen: true, billing })} onPayDebtCustomer={handleOpenDebtPaymentModal} areValuesHidden={areValuesHidden} />;
            case 'EQUIPAMENTOS': return <EquipamentosView customers={customers} billings={billings} showNotification={showNotification} onOpenLabelGenerator={() => setLabelGenerationModalState({ isOpen: true })} onGenerateLabels={() => {}} />;
            case 'DESPESAS': return <DespesasView expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} areValuesHidden={areValuesHidden} />;
            case 'ROTAS': return <RotasView customers={customers} />;
            case 'RELATORIOS': return <RelatoriosView customers={customers} billings={billings} expenses={expenses} debtPayments={debtPayments} onThermalPrint={handleThermalPrint} areValuesHidden={areValuesHidden} showNotification={showNotification} />;
            case 'CONFIGURACOES': return <ConfiguracoesView onExportData={handleExportData} onMergeData={handleMergeData} theme={theme} setTheme={setTheme} showNotification={showNotification} deferredPrompt={deferredPrompt} onInstallPrompt={handleInstallPrompt} onDeleteAllData={() => setIsDeleteAllDataModalOpen(true)} onLogout={handleLogout} onSwitchAccount={handleSwitchAccount} onAddNewAccount={handleAddNewAccount} isPrivacyModeEnabled={isPrivacyModeEnabled} onActivatePrivacyMode={handleActivatePrivacyMode} onDeactivatePrivacyMode={handleDeactivatePrivacyMode} />;
            default: return <DashboardView billings={billings} expenses={expenses} customers={customers} debtPayments={debtPayments} warnings={warnings} onAddWarning={handleAddWarning} onResolveWarning={handleResolveWarning} onDeleteWarning={handleDeleteWarning} lastBackupDate={lastBackupTimestamp} onNavigateToSettings={() => setView('CONFIGURACOES')} areValuesHidden={areValuesHidden} />;
        }
    }, [currentView, customers, billings, expenses, debtPayments, warnings, isSaving, showNotification, theme, deferredPrompt, lastBackupTimestamp, handleAddCustomer, handleAddExpense, handleDeleteExpense, handleAddWarning, handleResolveWarning, handleDeleteWarning, handleOpenBillingModal, handleOpenDeleteModal, handleOpenDebtPaymentModal, handleOpenEditCustomerModal, handleOpenEditBillingModal, handleOpenHistoryModal, handleOpenLocationActions, handleOpenShareCustomerModal, handleWhatsAppActions, handleExportData, handleMergeData, handleInstallPrompt, setTheme, setView, handleThermalPrint, handleDeleteBilling, handleLogout, handleSwitchAccount, handleAddNewAccount, areValuesHidden, isPrivacyModeEnabled, handleActivatePrivacyMode, handleDeactivatePrivacyMode]);
    
    const equipmentForFinalization = useMemo(() => {
        const billing = finalizePaymentModalState.billing;
        if (!billing) return null;
        const customer = customers.find(c => c.id === billing.customerId);
        if (!customer) return null;
        return customer.equipment.find(e => e.id === billing.equipmentId) || null;
    }, [finalizePaymentModalState.billing, customers]);

    if (isLoadingAuth) {
        return <div className="bg-slate-900 text-white min-h-screen flex items-center justify-center">Carregando...</div>;
    }

    if (!user) {
        return <LoginView showNotification={showNotification} onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="flex h-full">
            <Sidebar user={user} currentView={currentView} setView={setView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} onOpenScanner={() => setQrScannerModalOpen(true)} />
            <div className="flex-1 flex flex-col h-full">
                 <MobileHeader title={viewTitles[currentView]} onMenuClick={() => setIsSidebarOpen(true)} deferredPrompt={deferredPrompt} onInstallPrompt={handleInstallPrompt} isPrivacyModeEnabled={isPrivacyModeEnabled} isPrivacyUnlocked={isPrivacyUnlocked} onToggleLock={handleToggleLock} />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100 dark:bg-slate-900 pb-24 md:pb-8 pt-4 md:pt-8">
                    {activeView}
                </main>
            </div>
            
            <BottomNavBar currentView={currentView} setView={setView} />
            <Notification notification={notification} onClose={() => setNotification(null)} />
            {isInstallBannerVisible && deferredPrompt && <InstallPwaBanner onInstall={handleInstallPrompt} onDismiss={() => setIsInstallBannerVisible(false)} />}
            
            {/* All Modals */}
            {billingModalState.isOpen && billingModalState.customer && billingModalState.equipment && <BillingModal isOpen={billingModalState.isOpen} onClose={() => setBillingModalState({ isOpen: false, customer: null, equipment: null })} onConfirm={handleAddBilling} customer={billingModalState.customer} equipment={billingModalState.equipment} onTriggerProvisionalReceiptAction={handleTriggerProvisionalReceiptAction} />}
            {editCustomerModalState.isOpen && editCustomerModalState.customer && <EditCustomerModal isOpen={editCustomerModalState.isOpen} onClose={() => setEditCustomerModalState({ isOpen: false, customer: null })} onConfirm={handleUpdateCustomer} customer={editCustomerModalState.customer} customers={customers} isSaving={isSaving} showNotification={showNotification} areValuesHidden={areValuesHidden} />}
            {debtPaymentModalState.isOpen && debtPaymentModalState.customer && <DebtPaymentModal isOpen={debtPaymentModalState.isOpen} onClose={() => setDebtPaymentModalState({ isOpen: false, customer: null })} onConfirm={(details) => handleAddDebtPayment(debtPaymentModalState.customer!.id, details)} onForgiveDebt={(customer) => setForgiveDebtModalState({ isOpen: true, customer })} customer={debtPaymentModalState.customer} />}
            {historyModalState.isOpen && historyModalState.customer && <HistoryModal isOpen={historyModalState.isOpen} onClose={() => setHistoryModalState({ isOpen: false, customer: null })} customer={historyModalState.customer} billings={billings} debtPayments={debtPayments} areValuesHidden={areValuesHidden} />}
            {deleteModalState.isOpen && deleteModalState.customer && <ActionModal isOpen={deleteModalState.isOpen} onClose={() => setDeleteModalState({ isOpen: false, customer: null })} onConfirm={() => handleDeleteCustomer(deleteModalState.customer!.id)} title="Excluir Cliente" confirmText="Sim, Excluir"><p>Tem certeza? Todos os dados, incluindo histórico de cobranças, serão perdidos.</p></ActionModal>}
            {equipmentSelectionModalState.isOpen && equipmentSelectionModalState.customer && <EquipmentSelectionModal isOpen={equipmentSelectionModalState.isOpen} onClose={() => setEquipmentSelectionModalState({ isOpen: false, customer: null })} customer={equipmentSelectionModalState.customer} onSelect={handleSelectEquipmentForBilling} />}
            {receiptActionsModalState.isOpen && receiptActionsModalState.billing && <ReceiptActionsModal isOpen={receiptActionsModalState.isOpen} onClose={() => setReceiptActionsModalState({ isOpen: false, billing: null, isProvisional: false })} billing={receiptActionsModalState.billing} isProvisional={receiptActionsModalState.isProvisional} isSharing={isSharing} onShare={() => handleShareReceipt(receiptActionsModalState.billing!)} onPrint={() => handlePrintPdfReceipt(receiptActionsModalState.billing!)} onPrintSunmi={() => handlePrintThermalReceipt(receiptActionsModalState.billing!)} showNotification={showNotification} />}
            {debtReceiptActionsModalState.isOpen && debtReceiptActionsModalState.debtPayment && <DebtReceiptActionsModal isOpen={debtReceiptActionsModalState.isOpen} onClose={() => setDebtReceiptActionsModalState({ isOpen: false, debtPayment: null, customer: null })} debtPayment={debtReceiptActionsModalState.debtPayment} isSharing={isSharing} onShare={() => handleShareReceipt(debtReceiptActionsModalState.debtPayment!)} onPrint={() => handlePrintPdfReceipt(debtReceiptActionsModalState.debtPayment!)} onPrintSunmi={() => handlePrintThermalReceipt(debtReceiptActionsModalState.debtPayment!)} showNotification={showNotification} />}
            {shareCustomerModalState.isOpen && shareCustomerModalState.customer && <ShareCustomerModal isOpen={shareCustomerModalState.isOpen} onClose={() => setShareCustomerModalState({ isOpen: false, customer: null })} customer={shareCustomerModalState.customer} showNotification={showNotification} onPrintCustomer={handlePrintCustomerSheet} />}
            {labelGenerationModalState.isOpen && <LabelGenerationModal isOpen={labelGenerationModalState.isOpen} onClose={() => setLabelGenerationModalState({isOpen: false})} customers={customers} showNotification={showNotification} onConfirm={() => {}} />}
            {editBillingModalState.isOpen && editBillingModalState.billing && <EditBillingModal isOpen={editBillingModalState.isOpen} onClose={() => setEditBillingModalState({ isOpen: false, billing: null })} onConfirm={handleUpdateBilling} billing={editBillingModalState.billing} customers={customers} billings={billings} />}
            {qrScannerModalOpen && <QrScannerModal isOpen={qrScannerModalOpen} onClose={() => setQrScannerModalOpen(false)} onScanSuccess={(id) => { const customer = customers.find(c => c.equipment?.some(e => e.id === id)); setFocusedCustomer(customer || null); setQrScannerModalOpen(false); }} showNotification={showNotification} />}
            {thermalPrintModalState.isOpen && <ThermalPrintActionsModal isOpen={thermalPrintModalState.isOpen} onClose={() => setThermalPrintModalState({ isOpen: false, title: '', content: '' })} title={thermalPrintModalState.title} content={thermalPrintModalState.content} onShare={shareText} onPrintSunmi={handlePrintSunmi} isSharing={isSharing} />}
            {locationActionsModalState.isOpen && locationActionsModalState.customer && <LocationActionsModal isOpen={locationActionsModalState.isOpen} onClose={() => setLocationActionsModalState({ isOpen: false, customer: null })} customer={locationActionsModalState.customer} />}
            {saveLocationModalState.isOpen && saveLocationModalState.customer && <ActionModal isOpen={saveLocationModalState.isOpen} onClose={() => setSaveLocationModalState({ isOpen: false, customer: null })} onConfirm={() => handleSaveLocation(saveLocationModalState.customer!)} title="Salvar Localização" confirmText="Salvar"><p>Deseja salvar a sua localização atual como o endereço para <strong>{saveLocationModalState.customer.name}</strong>?</p></ActionModal>}
            {addPhoneModalState.isOpen && addPhoneModalState.customer && <AddPhoneModal isOpen={addPhoneModalState.isOpen} onClose={() => setAddPhoneModalState({ isOpen: false, customer: null })} onConfirm={handleAddPhone} customer={addPhoneModalState.customer} />}
            {isDeleteAllDataModalOpen && <ActionModal isOpen={isDeleteAllDataModalOpen} onClose={() => setIsDeleteAllDataModalOpen(false)} onConfirm={handleDeleteAllData} title="Apagar Todos os Dados" confirmText="Sim, Apagar Tudo"><p className="text-red-400">Esta ação é irreversível. Confirma que deseja apagar todos os dados da sua conta?</p></ActionModal>}
            {finalizePaymentModalState.isOpen && finalizePaymentModalState.billing && equipmentForFinalization && <FinalizePaymentModal isOpen={finalizePaymentModalState.isOpen} onClose={() => setFinalizePaymentModalState({ isOpen: false, billing: null })} onConfirm={handleFinalizePendingPayment} billing={finalizePaymentModalState.billing} equipment={equipmentForFinalization} />}
            {forgiveDebtModalState.isOpen && forgiveDebtModalState.customer && <ActionModal isOpen={forgiveDebtModalState.isOpen} onClose={() => setForgiveDebtModalState({ isOpen: false, customer: null })} onConfirm={() => handleForgiveDebt(forgiveDebtModalState.customer!)} title="Perdoar Dívida" confirmText="Sim, Perdoar"><p>Tem certeza que deseja zerar a dívida de <strong>{forgiveDebtModalState.customer.name}</strong> no valor de <strong>R$ {forgiveDebtModalState.customer.debtAmount.toFixed(2)}</strong>?</p></ActionModal>}
            {privacyPinModalState.isOpen && <PrivacyPinModal isOpen={privacyPinModalState.isOpen} mode={privacyPinModalState.mode} title={privacyPinModalState.title} error={privacyPinModalState.error} onConfirm={privacyPinModalState.onConfirm} onClose={() => setPrivacyPinModalState(prev => ({ ...prev, isOpen: false, error: '' }))} />}

            {focusedCustomer && <FullScreenCustomerView customer={focusedCustomer} onClose={() => setFocusedCustomer(null)} hasActiveWarning={warnings.some(w => w.customerId === focusedCustomer.id && !w.isResolved)} onBill={handleOpenBillingModal} onEdit={handleOpenEditCustomerModal} onDelete={handleOpenDeleteModal} onPayDebt={handleOpenDebtPaymentModal} onHistory={handleOpenHistoryModal} onShare={handleOpenShareCustomerModal} onLocationActions={handleOpenLocationActions} onWhatsAppActions={handleWhatsAppActions} billings={billings} debtPayments={debtPayments} onFinalizePendingPayment={(billing) => setFinalizePaymentModalState({ isOpen: true, billing })} />}
            {customerToPrint && <PrintPreviewOverlay customer={customerToPrint} onCancel={() => setCustomerToPrint(null)} />}
        </div>
    );
};

export default App;