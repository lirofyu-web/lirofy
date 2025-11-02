// App.tsx
import React, { useState, useEffect } from 'react';
import { Customer, Billing, Expense, DebtPayment } from './types';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import ClientesView from './views/ClientesView';
import CobrancasView from './views/CobrancasView';
import DespesasView from './views/DespesasView';
import RotasView from './views/RotasView';
import RelatoriosView from './views/RelatoriosView';
import ConfiguracoesView from './views/ConfiguracoesView';
import { defaultCustomers } from './data/defaultCustomers';
import BottomNavBar from './components/BottomNavBar';
import Notification from './components/Notification';
import ActionModal from './components/ActionModal';
import ReceiptModal from './components/ReceiptModal';

export type View = 'DASHBOARD' | 'CLIENTES' | 'COBRANCAS' | 'DESPESAS' | 'ROTAS' | 'RELATORIOS' | 'CONFIGURACOES';

// Helper to get data from localStorage
const usePersistentState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue, (k, v) => (k.endsWith('At') || k === 'date') && v ? new Date(v) : v) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, state]);

  return [state, setState];
};

const App: React.FC = () => {
  const [customers, setCustomers] = usePersistentState<Customer[]>('customers', []);
  const [billings, setBillings] = usePersistentState<Billing[]>('billings', []);
  const [expenses, setExpenses] = usePersistentState<Expense[]>('expenses', []);
  const [debtPayments, setDebtPayments] = usePersistentState<DebtPayment[]>('debtPayments', []);
  const [isSaving, setIsSaving] = useState(false);
  const [currentView, setView] = usePersistentState<View>('currentView', 'DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [receiptToShow, setReceiptToShow] = useState<Billing | null>(null);
  const [billingForReceiptPrompt, setBillingForReceiptPrompt] = useState<Billing | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };
  
  const geocodeAddress = async (address: string, city: string): Promise<{ lat: number | null; lon: number | null }> => {
        if (!address || !city) return { lat: null, lon: null };
        try {
            const query = encodeURIComponent(`${address}, ${city}, Brazil`);
            // Using a free, public geocoding service. In a real app, you'd use a robust API key-based service.
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
            if (!response.ok) throw new Error('Geocoding request failed');
            const data = await response.json();
            if (data && data.length > 0) {
                return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
            }
            return { lat: null, lon: null };
        } catch (error) {
            console.error('Geocoding error:', error);
            showNotification('Falha ao obter coordenadas do endereço.', 'error');
            return { lat: null, lon: null };
        }
  };


  const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'debtAmount' | 'latitude' | 'longitude' | 'lastVisitedAt'>) => {
    setIsSaving(true);
    try {
        const { lat, lon } = await geocodeAddress(customerData.endereco, customerData.cidade);
        const newCustomer: Customer = {
          ...customerData,
          id: `cust_${new Date().getTime()}`,
          createdAt: new Date(),
          debtAmount: 0,
          latitude: lat,
          longitude: lon,
          lastVisitedAt: null,
        };
        setCustomers(prev => [...prev, newCustomer].sort((a,b) => a.name.localeCompare(b.name)));
        showNotification('Cliente adicionado com sucesso!');
    } catch (e) {
        showNotification('Erro ao adicionar cliente.', 'error');
    } finally {
        setIsSaving(false);
    }
  };

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    setIsSaving(true);
     try {
        const originalCustomer = customers.find(c => c.id === updatedCustomer.id);
        let lat = updatedCustomer.latitude;
        let lon = updatedCustomer.longitude;
        if (originalCustomer && (originalCustomer.endereco !== updatedCustomer.endereco || originalCustomer.cidade !== updatedCustomer.cidade)) {
            const coords = await geocodeAddress(updatedCustomer.endereco, updatedCustomer.cidade);
            lat = coords.lat;
            lon = coords.lon;
        }

        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? { ...updatedCustomer, latitude: lat, longitude: lon } : c));
        showNotification('Cliente atualizado com sucesso!');
    } catch (e) {
         showNotification('Erro ao atualizar cliente.', 'error');
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    setBillings(prev => prev.filter(b => b.customerId !== customerId));
    setDebtPayments(prev => prev.filter(p => p.customerId !== customerId));
    showNotification('Cliente excluído com sucesso.');
  };

  const handleSettleBill = (billingData: {
    customerId: string;
    equipment: 'mesa' | 'jukebox';
    relogioAtual: number;
    descontoPartidas: number;
    paymentMethod: 'pix' | 'dinheiro' | 'fiado';
  }) => {
    const customer = customers.find(c => c.id === billingData.customerId);
    if (!customer) return;

    let relogioAnterior = 0;
    let valorTotal = 0;
    let partidasJogadas = 0;
    let partidasCobradas = 0;
    let valorBruto = 0;
    
    if (billingData.equipment === 'mesa') {
      relogioAnterior = customer.relogioMesaAnterior;
      partidasJogadas = billingData.relogioAtual - relogioAnterior;
      partidasCobradas = partidasJogadas - billingData.descontoPartidas;
      valorBruto = partidasCobradas * customer.valorFicha;
      valorTotal = valorBruto * (customer.parteFirma / 100);
    } else { // jukebox
      relogioAnterior = customer.relogioJukeboxAnterior;
      valorBruto = billingData.relogioAtual - relogioAnterior;
      valorTotal = valorBruto * (customer.porcentagemJukeboxFirma / 100);
    }

    const newBilling: Billing = {
        id: `bill_${new Date().getTime()}`,
        customerId: customer.id,
        customerName: customer.name,
        equipment: billingData.equipment,
        relogioAnterior,
        relogioAtual: billingData.relogioAtual,
        partidasJogadas,
        descontoPartidas: billingData.equipment === 'mesa' ? billingData.descontoPartidas : 0,
        partidasCobradas,
        valorFicha: billingData.equipment === 'mesa' ? customer.valorFicha : undefined,
        valorTotal,
        parteFirma: valorTotal,
        parteCliente: valorBruto - valorTotal,
        settledAt: new Date(),
        paymentMethod: billingData.paymentMethod,
    };

    setBillings(prev => [...prev, newBilling]);

    setCustomers(prev => prev.map(c => {
      if (c.id === customer.id) {
        const updatedCustomer = { ...c };
        updatedCustomer.lastVisitedAt = new Date();
        if (billingData.equipment === 'mesa') {
          updatedCustomer.relogioMesaAnterior = billingData.relogioAtual;
        } else {
          updatedCustomer.relogioJukeboxAnterior = billingData.relogioAtual;
        }
        if (billingData.paymentMethod === 'fiado') {
          const valorBrutoTotal = billingData.equipment === 'mesa' ? partidasCobradas * customer.valorFicha : billingData.relogioAtual - relogioAnterior;
          updatedCustomer.debtAmount += valorBrutoTotal;
        }
        return updatedCustomer;
      }
      return c;
    }));
    showNotification('Cobrança registrada com sucesso!');
    setBillingForReceiptPrompt(newBilling);
  };

  const handlePayDebt = (customerId: string, amount: number, paymentMethod: 'pix' | 'dinheiro') => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || amount > customer.debtAmount || amount <= 0) return;

    const newPayment: DebtPayment = {
      id: `debt_${new Date().getTime()}`,
      customerId,
      customerName: customer.name,
      amountPaid: amount,
      paidAt: new Date(),
      paymentMethod,
    };
    setDebtPayments(prev => [...prev, newPayment]);
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, debtAmount: c.debtAmount - amount } : c));
    showNotification('Pagamento de dívida registrado!');
  };

  const handleAddExpense = (description: string, amount: number) => {
    const newExpense: Expense = {
      id: `exp_${new Date().getTime()}`,
      description,
      amount,
      date: new Date(),
    };
    setExpenses(prev => [...prev, newExpense]);
    showNotification('Despesa adicionada.');
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    showNotification('Despesa removida.');
  };

  const handleSeedData = (confirm = false) => {
    if (confirm && !window.confirm('Isso irá adicionar clientes de exemplo. Continuar?')) return;

    const newCustomers: Customer[] = defaultCustomers.map((cust, index) => ({
      ...cust,
      id: `cust_seed_${new Date().getTime() + index}`,
      createdAt: new Date(),
      debtAmount: Math.random() > 0.7 ? parseFloat((Math.random() * 200).toFixed(2)) : 0,
      latitude: null, // Geocoding will be slow for many, add them without it first.
      longitude: null,
      lastVisitedAt: Math.random() > 0.5 ? new Date(new Date().getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
    }));

    setCustomers(prev => [...prev, ...newCustomers]);
    showNotification('Dados de exemplo carregados.');
    
    // Asynchronously geocode seeded customers
    newCustomers.forEach(c => handleUpdateCustomer(c));
  };

  const handleClearData = () => {
    if (window.confirm('ATENÇÃO: Isso apagará TODOS OS DADOS (clientes, cobranças, despesas). Esta ação é IRREVERSÍVEL. Deseja continuar?')) {
        setCustomers([]);
        setBillings([]);
        setExpenses([]);
        setDebtPayments([]);
        showNotification('Todos os dados foram apagados.', 'success');
    }
  };

   const handleExportData = () => {
    const dataToExport = {
      customers,
      billings,
      expenses,
      debtPayments
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `backup_montanha_bilhar_${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showNotification('Backup exportado com sucesso!');
  };

   const handleMergeData = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                
                const mergeById = <T extends {id: string}>(existing: T[], incoming: T[]): T[] => {
                    const map = new Map(existing.map(item => [item.id, item]));
                    incoming.forEach(item => map.set(item.id, item));
                    return Array.from(map.values());
                };

                if(data.customers) setCustomers(prev => mergeById(prev, data.customers));
                if(data.billings) setBillings(prev => mergeById(prev, data.billings));
                if(data.expenses) setExpenses(prev => mergeById(prev, data.expenses));
                if(data.debtPayments) setDebtPayments(prev => mergeById(prev, data.debtPayments));

                showNotification('Dados mesclados com sucesso!', 'success');
            } catch (error) {
                console.error('Failed to parse or merge data', error);
                showNotification('Erro ao importar o arquivo. Verifique se o formato é válido.', 'error');
            }
        };
        reader.readAsText(file);
    };

    const handleAddCustomerFromText = (text: string) => {
        try {
            const data: Record<string, string> = {};
            const lines = text.trim().split('\n');
            lines.forEach(line => {
                const parts = line.split(':');
                if (parts.length > 1) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join(':').trim();
                    data[key] = value;
                }
            });

            const newCustomer: Omit<Customer, 'id' | 'createdAt' | 'debtAmount' | 'latitude' | 'longitude' | 'lastVisitedAt'> = {
                name: data['Nome'] || '',
                cpfRg: data['CPF/RG'] || '',
                cidade: data['Cidade'] || '',
                endereco: data['Endereço'] || '',
                telefone: data['Telefone'] || '',
                linhaNumero: data['Linha/Rota'] || '',
                mesaNumero: data['Nº Mesa'] || '',
                relogioMesaNumero: data['Nº Relógio Mesa'] || '',
                relogioMesaAnterior: parseInt(data['Leitura Ant. Mesa'], 10) || 0,
                valorFicha: parseFloat(data['Valor Ficha']?.replace('R$ ', '')) || 2.00,
                parteFirma: parseInt(data['% Firma (Mesa)'], 10) || 50,
                parteCliente: parseInt(data['% Cliente (Mesa)'], 10) || 50,
                jukeboxNumero: data['Nº Jukebox'] || '',
                relogioJukeboxNumero: data['Nº Relógio Jukebox'] || '',
                relogioJukeboxAnterior: parseInt(data['Leitura Ant. Jukebox'], 10) || 0,
                porcentagemJukeboxFirma: parseInt(data['% Firma (Jukebox)'], 10) || 50,
                porcentagemJukeboxCliente: parseInt(data['% Cliente (Jukebox)'], 10) || 50,
                assinaturaFirma: '',
                assinaturaCliente: '',
            };

            if (!newCustomer.name) {
                throw new Error("Nome do cliente não encontrado no texto.");
            }

            handleAddCustomer(newCustomer);
            showNotification('Cliente importado via texto com sucesso!');
        } catch (error) {
            console.error("Failed to parse customer from text", error);
            showNotification('Falha ao importar cliente. Verifique o formato do texto.', 'error');
        }
    };
    
  const handleConfirmPrintReceipt = () => {
    if (billingForReceiptPrompt) {
      setReceiptToShow(billingForReceiptPrompt);
    }
    setBillingForReceiptPrompt(null);
  };


  const renderView = () => {
    switch(currentView) {
      case 'DASHBOARD':
        return <DashboardView customers={customers} billings={billings} expenses={expenses} debtPayments={debtPayments} />;
      case 'CLIENTES':
        return <ClientesView customers={customers} billings={billings} debtPayments={debtPayments} onAddCustomer={handleAddCustomer} onSettleBill={handleSettleBill} onDeleteCustomer={handleDeleteCustomer} onPayDebt={handlePayDebt} onUpdateCustomer={handleUpdateCustomer} isSaving={isSaving} />;
      case 'COBRANCAS':
        return <CobrancasView billings={billings} onShowReceipt={setReceiptToShow} />;
      case 'DESPESAS':
        return <DespesasView expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} />;
      case 'ROTAS':
        return <RotasView customers={customers} />;
      case 'RELATORIOS':
        return <RelatoriosView customers={customers} billings={billings} expenses={expenses} debtPayments={debtPayments} />;
       case 'CONFIGURACOES':
        return <ConfiguracoesView onSeedData={handleSeedData} onClearData={handleClearData} onExportData={handleExportData} onMergeData={handleMergeData} onAddCustomerFromText={handleAddCustomerFromText} />;
      default:
        return <div>View não encontrada</div>;
    }
  };

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen">
       <Notification notification={notification} onClose={() => setNotification(null)} />
       {receiptToShow && <ReceiptModal isOpen={!!receiptToShow} onClose={() => setReceiptToShow(null)} billing={receiptToShow} />}
       <ActionModal
        isOpen={!!billingForReceiptPrompt}
        onClose={() => setBillingForReceiptPrompt(null)}
        onConfirm={handleConfirmPrintReceipt}
        title="Cobrança Finalizada"
        confirmText="Sim, Imprimir"
       >
        <p>Deseja imprimir o recibo?</p>
       </ActionModal>
      <div className="flex">
        <Sidebar currentView={currentView} setView={setView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main className="flex-1 p-4 md:p-8 transition-all duration-300 ease-in-out md:ml-64 pb-20 md:pb-8">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 mb-4 bg-slate-800 rounded-md no-print">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                 </svg>
            </button>
          {renderView()}
        </main>
      </div>
      <BottomNavBar currentView={currentView} setView={setView} />
    </div>
  );
};

export default App;