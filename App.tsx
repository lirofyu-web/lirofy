// Fix: Implement the main App component.
import React, { useState, useEffect, useCallback } from 'react';
import { Customer, Billing, Expense, DebtPayment } from './types';
import { defaultCustomers } from './data/defaultCustomers';

// Views
import DashboardView from './views/DashboardView';
import ClientesView from './views/ClientesView';
import CobrancasView from './views/CobrancasView';
import DespesasView from './views/DespesasView';
import RelatoriosView from './views/RelatoriosView';
import RotasView from './views/RotasView';
import ConfiguracoesView from './views/ConfiguracoesView';

// Components
import Sidebar from './components/Sidebar';
import BottomNavBar from './components/BottomNavBar';
import Notification from './components/Notification';

export type View = 'DASHBOARD' | 'CLIENTES' | 'COBRANCAS' | 'DESPESAS' | 'RELATORIOS' | 'ROTAS' | 'CONFIGURACOES';

type NotificationState = {
  message: string;
  type: 'success' | 'error';
} | null;

const App: React.FC = () => {
  const [view, setView] = useState<View>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [billings, setBillings] = useState<Billing[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
  
  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<NotificationState>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  };

  // --- Data Persistence ---
  useEffect(() => {
    try {
      const storedCustomers = localStorage.getItem('customers');
      const storedBillings = localStorage.getItem('billings');
      const storedExpenses = localStorage.getItem('expenses');
      const storedDebtPayments = localStorage.getItem('debtPayments');
      
      if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
      if (storedBillings) setBillings(JSON.parse(storedBillings));
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
      if (storedDebtPayments) setDebtPayments(JSON.parse(storedDebtPayments));

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      showNotification("Erro ao carregar os dados.", "error");
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => { if (isInitialized) localStorage.setItem('customers', JSON.stringify(customers)); }, [customers, isInitialized]);
  useEffect(() => { if (isInitialized) localStorage.setItem('billings', JSON.stringify(billings)); }, [billings, isInitialized]);
  useEffect(() => { if (isInitialized) localStorage.setItem('expenses', JSON.stringify(expenses)); }, [expenses, isInitialized]);
  useEffect(() => { if (isInitialized) localStorage.setItem('debtPayments', JSON.stringify(debtPayments)); }, [debtPayments, isInitialized]);


  // --- Helper Functions ---
  const getCustomerName = (customerId: string) => customers.find(c => c.id === customerId)?.name || 'Cliente Desconhecido';

  // --- Mock Geocoding ---
  const getCoordinatesForAddress = async (address: string, city: string): Promise<{ lat: number; lon: number } | null> => {
    // In a real app, this would call a geocoding API.
    // Here, we'll generate pseudo-random, deterministic coordinates based on the address.
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    try {
        const fullAddress = `${address}, ${city}`;
        let hash = 0;
        for (let i = 0; i < fullAddress.length; i++) {
            const char = fullAddress.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }

        const latRange = { min: -24.0, max: -22.0 }; // Paraná latitude range
        const lonRange = { min: -54.0, max: -48.0 }; // Paraná longitude range

        const lat = latRange.min + (Math.abs(hash) % 10000 / 10000) * (latRange.max - latRange.min);
        // Use a different calculation for longitude to avoid direct correlation
        const lon = lonRange.min + (Math.abs(hash * 31) % 10000 / 10000) * (lonRange.max - lonRange.min);

        return { lat, lon };
    } catch {
        return null;
    }
  };


  // --- CRUD Handlers ---

  const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'debtAmount' | 'latitude' | 'longitude' | 'lastVisitedAt'>) => {
    setIsSaving(true);
    try {
      const coords = await getCoordinatesForAddress(customerData.endereco, customerData.cidade);
      const newCustomer: Customer = {
        ...customerData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        debtAmount: 0,
        lastVisitedAt: null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lon ?? null,
      };
      setCustomers(prev => [...prev, newCustomer]);
      showNotification("Cliente adicionado com sucesso!", "success");
    } catch (error) {
      showNotification("Erro ao adicionar cliente.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    setIsSaving(true);
    try {
        const originalCustomer = customers.find(c => c.id === updatedCustomer.id);
        let newCoords = { lat: updatedCustomer.latitude, lon: updatedCustomer.longitude };

        // Re-geocode if address changed
        if (originalCustomer && (originalCustomer.endereco !== updatedCustomer.endereco || originalCustomer.cidade !== updatedCustomer.cidade)) {
            const coords = await getCoordinatesForAddress(updatedCustomer.endereco, updatedCustomer.cidade);
            newCoords = { lat: coords?.lat ?? null, lon: coords?.lon ?? null };
        }

        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? { ...updatedCustomer, latitude: newCoords.lat, longitude: newCoords.lon } : c));
        showNotification("Cliente atualizado com sucesso!", "success");
    } catch (error) {
        showNotification("Erro ao atualizar cliente.", "error");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    // Optional: Also delete related billings, debts etc.
    showNotification("Cliente excluído.", "success");
  };

  const handleSettleBill = (billingData: { customerId: string; equipment: 'mesa' | 'jukebox'; relogioAtual: number; descontoPartidas: number; paymentMethod: 'pix' | 'dinheiro' | 'fiado'; }) => {
    const customer = customers.find(c => c.id === billingData.customerId);
    if (!customer) return;

    let valorTotal = 0;
    let newBilling: Omit<Billing, 'id'>;

    const settledAt = new Date();

    if (billingData.equipment === 'mesa') {
      const partidasJogadas = billingData.relogioAtual - customer.relogioMesaAnterior;
      const partidasCobradas = partidasJogadas - billingData.descontoPartidas;
      valorTotal = partidasCobradas * customer.valorFicha;
      
      newBilling = {
        customerId: customer.id,
        customerName: customer.name,
        equipment: 'mesa',
        relogioAnterior: customer.relogioMesaAnterior,
        relogioAtual: billingData.relogioAtual,
        partidasJogadas,
        descontoPartidas: billingData.descontoPartidas,
        partidasCobradas,
        valorFicha: customer.valorFicha,
        valorTotal,
        parteFirma: valorTotal * (customer.parteFirma / 100),
        parteCliente: valorTotal * (customer.parteCliente / 100),
        settledAt,
        paymentMethod: billingData.paymentMethod
      };
      
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, relogioMesaAnterior: billingData.relogioAtual, lastVisitedAt: settledAt } : c));
    } else { // Jukebox
      valorTotal = billingData.relogioAtual - customer.relogioJukeboxAnterior;

      newBilling = {
         customerId: customer.id,
         customerName: customer.name,
         equipment: 'jukebox',
         relogioAnterior: customer.relogioJukeboxAnterior,
         relogioAtual: billingData.relogioAtual,
         partidasJogadas: valorTotal,
         descontoPartidas: 0,
         partidasCobradas: valorTotal,
         valorTotal,
         parteFirma: valorTotal * (customer.porcentagemJukeboxFirma / 100),
         parteCliente: valorTotal * (customer.porcentagemJukeboxCliente / 100),
         settledAt,
         paymentMethod: billingData.paymentMethod,
      };

      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, relogioJukeboxAnterior: billingData.relogioAtual, lastVisitedAt: settledAt } : c));
    }

    setBillings(prev => [{...newBilling, id: crypto.randomUUID()}, ...prev]);

    if (billingData.paymentMethod === 'fiado') {
      setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, debtAmount: c.debtAmount + valorTotal } : c));
    }
    
    showNotification("Cobrança realizada com sucesso!", "success");
  };

  const handlePayDebt = (customerId: string, amount: number, paymentMethod: 'pix' | 'dinheiro') => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, debtAmount: c.debtAmount - amount, lastVisitedAt: new Date() } : c));
    const newPayment: DebtPayment = {
      id: crypto.randomUUID(),
      customerId,
      customerName: getCustomerName(customerId),
      amountPaid: amount,
      paidAt: new Date(),
      paymentMethod
    };
    setDebtPayments(prev => [newPayment, ...prev]);
    showNotification("Pagamento de dívida registrado!", "success");
  };

  const handleAddExpense = (description: string, amount: number) => {
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      description,
      amount,
      date: new Date()
    };
    setExpenses(prev => [newExpense, ...prev]);
    showNotification("Despesa adicionada.", "success");
  };
  
  const handleDeleteExpense = (expenseId: string) => {
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
      showNotification("Despesa removida.", "success");
  };

  const renderView = () => {
    switch(view) {
      case 'DASHBOARD': return <DashboardView billings={billings} expenses={expenses} customers={customers} debtPayments={debtPayments} />;
      case 'CLIENTES': return <ClientesView customers={customers} billings={billings} debtPayments={debtPayments} onAddCustomer={handleAddCustomer} onSettleBill={handleSettleBill} onDeleteCustomer={handleDeleteCustomer} onPayDebt={handlePayDebt} onUpdateCustomer={handleUpdateCustomer} isSaving={isSaving} />;
      case 'COBRANCAS': return <CobrancasView billings={billings} />;
      case 'DESPESAS': return <DespesasView expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} />;
      case 'RELATORIOS': return <RelatoriosView customers={customers} billings={billings} expenses={expenses} debtPayments={debtPayments} />;
      case 'ROTAS': return <RotasView customers={customers} />;
      case 'CONFIGURACOES': return <ConfiguracoesView onSeedData={seedData} onClearData={clearAllData} onExportData={exportData} onImportData={importData} />;
      default: return <DashboardView billings={billings} expenses={expenses} customers={customers} debtPayments={debtPayments} />;
    }
  };
  
  // --- Config Page Functions ---
  const seedData = async () => {
    if (window.confirm('Isso irá adicionar clientes padrão. Deseja continuar?')) {
        setIsSaving(true);
        try {
            const customersWithCoords = await Promise.all(defaultCustomers.map(async (cust) => {
                const coords = await getCoordinatesForAddress(cust.endereco, cust.cidade);
                return {
                    ...cust,
                    id: crypto.randomUUID(),
                    createdAt: new Date(),
                    debtAmount: 0,
                    lastVisitedAt: null,
                    latitude: coords?.lat ?? null,
                    longitude: coords?.lon ?? null,
                };
            }));
            setCustomers(prev => [...prev, ...customersWithCoords]);
            showNotification('Dados de exemplo carregados!', 'success');
        } catch (error) {
            showNotification('Erro ao carregar dados de exemplo.', 'error');
        } finally {
            setIsSaving(false);
        }
    }
  };

  const clearAllData = () => {
    if (window.confirm('TEM CERTEZA? Todos os clientes, cobranças e despesas serão apagados permanentemente.')) {
        setCustomers([]);
        setBillings([]);
        setExpenses([]);
        setDebtPayments([]);
        showNotification('Todos os dados foram apagados.', 'success');
    }
  };

  const exportData = () => {
    const data = { customers, billings, expenses, debtPayments };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `montanha_bilhar_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Backup exportado com sucesso!', 'success');
  };

  const importData = (file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const data = JSON.parse(event.target?.result as string);
              if (data.customers && data.billings && data.expenses && data.debtPayments) {
                  setCustomers(data.customers);
                  setBillings(data.billings);
                  setExpenses(data.expenses);
                  setDebtPayments(data.debtPayments);
                  showNotification('Backup importado com sucesso!', 'success');
              } else {
                  showNotification('Arquivo de backup inválido.', 'error');
              }
          } catch (error) {
              showNotification('Erro ao ler o arquivo de backup.', 'error');
          }
      };
      reader.readAsText(file);
  };

  if (!isInitialized) {
    return <div className="bg-slate-900 text-white min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      <div className="flex">
        <Sidebar currentView={view} setView={setView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main className="flex-1 p-4 sm:p-8 md:ml-64 mb-16 md:mb-0">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>
      </div>
      <BottomNavBar currentView={view} setView={setView} />
      <Notification notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
};

export default App;