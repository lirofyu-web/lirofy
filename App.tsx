// App.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Customer, Billing, Expense, DebtPayment } from './types';
import Sidebar from './components/Sidebar';
import ClientesView from './views/ClientesView';
import DashboardView from './views/DashboardView';
import CobrancasView from './views/CobrancasView';
import DespesasView from './views/DespesasView';
import RelatoriosView from './views/RelatoriosView';
import RotasView from './views/RotasView';
import ConfiguracoesView from './views/ConfiguracoesView';
import ActionModal from './components/ActionModal';
import { LogoIcon } from './components/icons/LogoIcon';
import LoginView from './views/LoginView';
import { useGoogleAuth, AuthStatus } from './hooks/useGoogleAuth';

export type View = 'DASHBOARD' | 'CLIENTES' | 'COBRANCAS' | 'DESPESAS' | 'RELATORIOS' | 'ROTAS' | 'CONFIGURACOES';

export interface AppData {
  customers: Customer[];
  billings: Billing[];
  expenses: Expense[];
  debtPayments: DebtPayment[];
}


// --- Geocoding Function ---
const geocodeAddress = async (address: string): Promise<{ lat: number; lon: number } | null> => {
    if (!address.trim() || address.trim() === ',') return null;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        return null;
    } catch (error) { return null; }
};

const LoadingScreen = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
        <LogoIcon className="w-24 h-24 text-slate-400 mb-6" />
        <p className="text-lg">Carregando seus dados...</p>
    </div>
);

const MenuIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
);

const MobileHeader = ({ onMenuClick }: { onMenuClick: () => void }) => (
    <header className="md:hidden bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between no-print sticky top-0 z-10">
        <div className="flex items-center gap-2"><LogoIcon className="w-8 h-8 text-slate-300" /><h1 className="text-lg font-bold text-white">Montanha</h1></div>
        <button onClick={onMenuClick} className="text-slate-300 hover:text-white p-2"><MenuIcon className="w-6 h-6" /></button>
    </header>
);

const App: React.FC = () => {
    const { authStatus, userProfile, signIn, signOut, loadData, saveData, isConfigured } = useGoogleAuth();
    const [view, setView] = useState<View>('CLIENTES');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Application data state
    const [appData, setAppData] = useState<AppData | null>(null);
    const [isDataDirty, setIsDataDirty] = useState(false);
    const debounceTimeoutRef = useRef<number | null>(null);

    const [billingToPrint, setBillingToPrint] = useState<Billing | null>(null);

    // Effect to load data once authenticated
    useEffect(() => {
        if (authStatus === AuthStatus.AUTHENTICATED) {
            loadData().then(data => {
                if (data) {
                    setAppData({
                         ...data,
                         customers: data.customers.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), lastVisitedAt: c.lastVisitedAt ? new Date(c.lastVisitedAt) : null })),
                         billings: data.billings.map((b: any) => ({...b, settledAt: new Date(b.settledAt)})),
                         expenses: data.expenses.map((e: any) => ({...e, date: new Date(e.date)})),
                         debtPayments: data.debtPayments.map((p: any) => ({...p, paidAt: new Date(p.paidAt)}))
                    });
                } else {
                    // First time login for this user, create empty data structure
                    setAppData({ customers: [], billings: [], expenses: [], debtPayments: [] });
                    // Do not mark as dirty, wait for user action.
                }
            });
        }
    }, [authStatus, loadData]);

    // Debounced save effect
    useEffect(() => {
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

        if (isDataDirty && authStatus === AuthStatus.AUTHENTICATED && appData) {
            debounceTimeoutRef.current = window.setTimeout(() => {
                saveData(appData).then(() => {
                    setIsDataDirty(false);
                });
            }, 2500); // 2.5 seconds debounce
        }

        return () => {
            if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        };
    }, [appData, isDataDirty, authStatus, saveData]);


    // Data manipulation functions
    const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'debtAmount' | 'latitude' | 'longitude' | 'lastVisitedAt'>) => {
        if (!appData) return;
        setIsSaving(true);
        const fullAddress = `${customerData.endereco}, ${customerData.cidade}`;
        const coords = await geocodeAddress(fullAddress);
        const newCustomer: Customer = { ...customerData, id: `cust_${new Date().getTime()}`, createdAt: new Date(), debtAmount: 0, latitude: coords ? coords.lat : null, longitude: coords ? coords.lon : null, lastVisitedAt: null };
        setAppData(prev => prev ? { ...prev, customers: [newCustomer, ...prev.customers] } : null);
        setIsDataDirty(true);
        setIsSaving(false);
    };

    const handleDeleteCustomer = (customerId: string) => {
        if (!appData) return;
        setAppData(prev => prev ? {
            ...prev,
            customers: prev.customers.filter(c => c.id !== customerId),
            billings: prev.billings.filter(b => b.customerId !== customerId),
            debtPayments: prev.debtPayments.filter(p => p.customerId !== customerId)
        } : null);
        setIsDataDirty(true);
    };
    
    const handleUpdateCustomer = async (updatedCustomer: Customer) => {
        if (!appData) return;
        setIsSaving(true);
        const originalCustomer = appData.customers.find(c => c.id === updatedCustomer.id);
        if (originalCustomer) {
            const oldAddress = `${originalCustomer.endereco}, ${originalCustomer.cidade}`;
            const newAddress = `${updatedCustomer.endereco}, ${updatedCustomer.cidade}`;
            if (oldAddress.trim() !== newAddress.trim()) {
                const coords = await geocodeAddress(newAddress);
                updatedCustomer.latitude = coords ? coords.lat : null;
                updatedCustomer.longitude = coords ? coords.lon : null;
            }
        }
        setAppData(prev => prev ? { ...prev, customers: prev.customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c) } : null);
        setIsDataDirty(true);
        setIsSaving(false);
    };
    
    const handleSettleBill = (data: { customerId: string; equipment: 'mesa' | 'jukebox'; relogioAtual: number; descontoPartidas: number; paymentMethod: 'pix' | 'dinheiro' | 'fiado'; }) => {
        if (!appData) return;
        const customer = appData.customers.find(c => c.id === data.customerId);
        if (!customer) return;

        let newBilling: Billing;
        let newDebt = 0;
        let valorBruto = 0;
        
        if (data.equipment === 'mesa') {
            const relogioAnterior = customer.relogioMesaAnterior;
            const partidasJogadas = data.relogioAtual - relogioAnterior;
            const partidasCobradas = partidasJogadas - data.descontoPartidas;
            valorBruto = partidasCobradas * customer.valorFicha;
            const valorParteFirma = valorBruto * (customer.parteFirma / 100);
            const valorParteCliente = valorBruto * (customer.parteCliente / 100);
            newBilling = { id: `bill_${new Date().getTime()}`, customerId: customer.id, customerName: customer.name, equipment: 'mesa', relogioAnterior, relogioAtual: data.relogioAtual, partidasJogadas, descontoPartidas: data.descontoPartidas, partidasCobradas, valorFicha: customer.valorFicha, valorTotal: valorParteFirma, parteFirma: valorParteFirma, parteCliente: valorParteCliente, settledAt: new Date(), paymentMethod: data.paymentMethod };
        } else { // Jukebox
            const relogioAnterior = customer.relogioJukeboxAnterior;
            valorBruto = data.relogioAtual - relogioAnterior; 
            const valorParteFirma = valorBruto * (customer.porcentagemJukeboxFirma / 100);
            const valorParteCliente = valorBruto * (customer.porcentagemJukeboxCliente / 100);
            newBilling = { id: `bill_${new Date().getTime()}`, customerId: customer.id, customerName: customer.name, equipment: 'jukebox', relogioAnterior, relogioAtual: data.relogioAtual, partidasJogadas: 0, descontoPartidas: 0, partidasCobradas: valorBruto, valorTotal: valorParteFirma, parteFirma: valorParteFirma, parteCliente: valorParteCliente, settledAt: new Date(), paymentMethod: data.paymentMethod };
        }

        if (data.paymentMethod === 'fiado') newDebt = valorBruto;
        
        setAppData(prev => {
            if (!prev) return null;
            const updatedCustomers = prev.customers.map(c => {
                if (c.id === data.customerId) {
                    return {
                        ...c,
                        relogioMesaAnterior: data.equipment === 'mesa' ? data.relogioAtual : c.relogioMesaAnterior,
                        relogioJukeboxAnterior: data.equipment === 'jukebox' ? data.relogioAtual : c.relogioJukeboxAnterior,
                        debtAmount: c.debtAmount + newDebt,
                        lastVisitedAt: new Date(),
                    };
                }
                return c;
            });
            return { ...prev, customers: updatedCustomers, billings: [newBilling, ...prev.billings] };
        });
        setIsDataDirty(true);
        setBillingToPrint(newBilling);
    };

    const handlePayDebt = (customerId: string, amount: number, paymentMethod: 'pix' | 'dinheiro') => {
        if (!appData) return;
        const customer = appData.customers.find(c => c.id === customerId);
        if (!customer) return;
        const newPayment: DebtPayment = { id: `debt_${new Date().getTime()}`, customerId, customerName: customer.name, amountPaid: amount, paidAt: new Date(), paymentMethod };
        setAppData(prev => {
            if (!prev) return null;
            const updatedCustomers = prev.customers.map(c => c.id === customerId ? { ...c, debtAmount: c.debtAmount - amount } : c);
            return { ...prev, customers: updatedCustomers, debtPayments: [newPayment, ...prev.debtPayments] };
        });
        setIsDataDirty(true);
    };

    const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
        if (!appData) return;
        const newExpense: Expense = { ...expenseData, id: `exp_${new Date().getTime()}` };
        setAppData(prev => prev ? { ...prev, expenses: [newExpense, ...prev.expenses] } : null);
        setIsDataDirty(true);
    };

    const handleConfirmPrint = () => {
        if (billingToPrint) {
            // Receipt printing logic can be simplified or moved
        }
        setBillingToPrint(null);
    };

    const renderView = () => {
        if (!appData) return <LoadingScreen />;
        const { customers, billings, expenses, debtPayments } = appData;

        switch (view) {
            case 'DASHBOARD': return <DashboardView billings={billings} expenses={expenses} customers={customers} debtPayments={debtPayments} />;
            case 'CLIENTES': return <ClientesView customers={customers} onAddCustomer={handleAddCustomer} onSettleBill={handleSettleBill} onDeleteCustomer={handleDeleteCustomer} onPayDebt={handlePayDebt} onUpdateCustomer={handleUpdateCustomer} isSaving={isSaving} />;
            case 'COBRANCAS': return <CobrancasView billings={billings} debtPayments={debtPayments} />;
            case 'DESPESAS': return <DespesasView expenses={expenses} onAddExpense={handleAddExpense} />;
            case 'RELATORIOS': return <RelatoriosView customers={customers} billings={billings} expenses={expenses} debtPayments={debtPayments} />;
            case 'ROTAS': return <RotasView customers={customers} />;
            case 'CONFIGURACOES': return <ConfiguracoesView userProfile={userProfile} onSignOut={signOut} />;
            default: return <ClientesView customers={customers} onAddCustomer={handleAddCustomer} onSettleBill={handleSettleBill} onDeleteCustomer={handleDeleteCustomer} onPayDebt={handlePayDebt} onUpdateCustomer={handleUpdateCustomer} isSaving={isSaving} />;
        }
    };
    
    if (authStatus === AuthStatus.LOADING) return <LoadingScreen />;
    if (authStatus === AuthStatus.UNAUTHENTICATED) return <LoginView onSignIn={signIn} isConfigured={isConfigured} />;
    
    return (
        <>
            <div className="bg-slate-900 text-slate-100 min-h-screen flex flex-col md:flex-row">
                <Sidebar currentView={view} setView={setView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                <div className="flex-1 flex flex-col min-w-0">
                    <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                        {appData ? renderView() : <LoadingScreen />}
                    </main>
                </div>
            </div>
            <ActionModal
                isOpen={!!billingToPrint}
                onClose={() => setBillingToPrint(null)}
                onConfirm={handleConfirmPrint}
                title="Impressão de Recibo"
                confirmText="Imprimir"
            ><p>Cobrança realizada com sucesso! Deseja imprimir o comprovante?</p></ActionModal>
        </>
    );
};

export default App;