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
import { mockCities, mockFirstNames, mockLastNames, mockStreetTypes, mockStreetNames, mockExpenseDescriptions } from './data/seedHelper';
import BottomNavBar from './components/BottomNavBar';
import Notification from './components/Notification';
import ReceiptModal from './components/ReceiptModal';
import DebtReceiptModal from './components/DebtReceiptModal';
import ReceiptActionsModal from './components/ReceiptActionsModal';

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
  const [debtReceiptToShow, setDebtReceiptToShow] = useState<DebtPayment | null>(null);
  const [receiptActionPrompt, setReceiptActionPrompt] = useState<{ billing?: Billing; debtPayment?: DebtPayment } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    const dataSeeded = localStorage.getItem('dataSeeded');
    if (!dataSeeded && customers.length === 0) {
      console.log("First run detected, seeding initial data...");
      seedInitialData();
      localStorage.setItem('dataSeeded', 'true');
      showNotification('Dados de exemplo carregados para sua primeira utilização!', 'success');
    }
  }, []); // Empty dependency array ensures it runs only once on mount
  
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
    setReceiptActionPrompt({ billing: newBilling });
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
    setReceiptActionPrompt({ debtPayment: newPayment });
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

  const seedInitialData = () => {
        // Helper functions
        const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
        const getRandomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
        const getRandomDate = (start: Date, end: Date): Date => {
            const startTime = start.getTime();
            const endTime = end.getTime();
            if (startTime >= endTime) return start;
            return new Date(startTime + Math.random() * (endTime - startTime));
        };

        const finalCustomers: Customer[] = [];
        const newBillings: Billing[] = [];

        // Generate 100 customers, each with their own generated history
        for (let i = 0; i < 100; i++) {
            const city = getRandom(mockCities);
            const hasMesa = Math.random() > 0.3;
            const hasJukebox = Math.random() > 0.4;
            const parteFirmaMesa = hasMesa ? getRandom([40, 50, 60]) : 0;
            const porcentagemJukeboxFirma = hasJukebox ? getRandom([50, 60, 70]) : 0;
            
            // This is a mutable object that we'll update as we build the history
            const customer: Customer = {
                id: `cust_seed_${new Date().getTime()}_${i}`,
                createdAt: getRandomDate(new Date(new Date().setFullYear(new Date().getFullYear() - 2)), new Date()),
                name: `${getRandom(mockFirstNames)} ${getRandom(mockLastNames)}`,
                cpfRg: `${getRandomNumber(100, 999)}.${getRandomNumber(100, 999)}.${getRandomNumber(100, 999)}-${getRandomNumber(10, 99)}`,
                cidade: city.name,
                endereco: `${getRandom(mockStreetTypes)} ${getRandom(mockStreetNames)}, ${getRandomNumber(10, 1000)}`,
                telefone: `419${getRandomNumber(10000000, 99999999)}`,
                latitude: city.lat + (Math.random() - 0.5) * 0.05,
                longitude: city.lon + (Math.random() - 0.5) * 0.05,
                mesaNumero: hasMesa ? `${getRandomNumber(1, 100)}` : '',
                relogioMesaNumero: hasMesa ? `M-S${getRandomNumber(10, 99)}` : '',
                relogioMesaAnterior: hasMesa ? getRandomNumber(1000, 20000) : 0,
                valorFicha: hasMesa ? getRandom([2, 2.5, 3]) : 0,
                parteFirma: parteFirmaMesa,
                parteCliente: hasMesa ? 100 - parteFirmaMesa : 0,
                jukeboxNumero: hasJukebox ? `J-${getRandomNumber(1, 50)}` : '',
                relogioJukeboxNumero: hasJukebox ? `R-J${getRandomNumber(10, 99)}` : '',
                relogioJukeboxAnterior: hasJukebox ? getRandomNumber(5000, 30000) : 0,
                porcentagemJukeboxFirma: porcentagemJukeboxFirma,
                porcentagemJukeboxCliente: hasJukebox ? 100 - porcentagemJukeboxFirma : 0,
                linhaNumero: `Rota ${getRandomNumber(1, 5)}`,
                assinaturaFirma: '',
                assinaturaCliente: '',
                debtAmount: 0,
                lastVisitedAt: null,
            };

            // Generate a billing history for this customer
            const numBillings = getRandomNumber(0, 3);
            let lastEventDate = customer.createdAt;

            for (let j = 0; j < numBillings; j++) {
                const canBillMesa = !!customer.mesaNumero;
                const canBillJukebox = !!customer.jukeboxNumero;
                if (!canBillMesa && !canBillJukebox) continue;

                const minSettledAt = new Date(lastEventDate);
                minSettledAt.setDate(minSettledAt.getDate() + getRandomNumber(25, 60));
                if (minSettledAt > new Date()) continue;
                const settledAt = getRandomDate(minSettledAt, new Date());
                
                const equipment = (canBillMesa && canBillJukebox) ? (Math.random() > 0.5 ? 'mesa' : 'jukebox') : (canBillMesa ? 'mesa' : 'jukebox');
                
                const relogioAnterior = equipment === 'mesa' ? customer.relogioMesaAnterior : customer.relogioJukeboxAnterior;
                const relogioAtual = relogioAnterior + getRandomNumber(10, 500);
                const partidasJogadas = relogioAtual - relogioAnterior;
                const descontoPartidas = equipment === 'mesa' ? getRandomNumber(0, Math.min(partidasJogadas, 10)) : 0;
                const partidasCobradas = partidasJogadas - descontoPartidas;
                const valorBruto = equipment === 'mesa' ? (partidasCobradas * customer.valorFicha) : partidasJogadas;
                const parteFirmaPerc = equipment === 'mesa' ? customer.parteFirma : customer.porcentagemJukeboxFirma;
                const valorTotal = valorBruto * (parteFirmaPerc / 100);
                const paymentMethod = getRandom(['pix', 'dinheiro', 'fiado'] as const);

                newBillings.push({
                    id: `bill_seed_${customer.id}_${j}`,
                    customerId: customer.id,
                    customerName: customer.name,
                    equipment,
                    relogioAnterior,
                    relogioAtual,
                    partidasJogadas,
                    descontoPartidas,
                    partidasCobradas,
                    valorFicha: equipment === 'mesa' ? customer.valorFicha : undefined,
                    valorTotal,
                    parteFirma: valorTotal,
                    parteCliente: valorBruto - valorTotal,
                    settledAt,
                    paymentMethod,
                });
                
                // Update the mutable customer object for the next iteration
                customer.lastVisitedAt = settledAt;
                if (equipment === 'mesa') {
                    customer.relogioMesaAnterior = relogioAtual;
                } else {
                    customer.relogioJukeboxAnterior = relogioAtual;
                }
                if (paymentMethod === 'fiado') {
                    customer.debtAmount += valorBruto;
                }
                lastEventDate = settledAt;
            }
            finalCustomers.push(customer); // Push the fully updated customer
        }
        
        // Generate expenses
        const newExpenses: Expense[] = [];
        for (let i = 0; i < 30; i++) {
            newExpenses.push({
                id: `exp_seed_${new Date().getTime() + i}`,
                description: getRandom(mockExpenseDescriptions),
                amount: getRandomNumber(20, 300),
                date: getRandomDate(new Date(new Date().setFullYear(new Date().getFullYear() - 1)), new Date()),
            });
        }

        // Update React state
        setCustomers(prev => [...prev, ...finalCustomers].sort((a,b) => a.name.localeCompare(b.name)));
        setBillings(prev => [...prev, ...newBillings]);
        setExpenses(prev => [...prev, ...newExpenses]);
    };


  const handleClearData = () => {
    if (window.confirm('ATENÇÃO: Isso apagará TODOS OS DADOS (clientes, cobranças, despesas). Esta ação é IRREVERSÍVEL. Deseja continuar?')) {
        setCustomers([]);
        setBillings([]);
        setExpenses([]);
        setDebtPayments([]);
        localStorage.removeItem('dataSeeded'); // Also clear the seed flag
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
    
  const handlePrintReceipt = () => {
    if (!receiptActionPrompt) return;
    if (receiptActionPrompt.billing) {
      setReceiptToShow(receiptActionPrompt.billing);
    } else if (receiptActionPrompt.debtPayment) {
      setDebtReceiptToShow(receiptActionPrompt.debtPayment);
    }
    setReceiptActionPrompt(null);
  };

  const handleSendWhatsAppReceipt = () => {
    if (!receiptActionPrompt) return;

    const { billing, debtPayment } = receiptActionPrompt;
    const customerId = billing?.customerId || debtPayment?.customerId;
    const customer = customers.find(c => c.id === customerId);

    if (!customer || !customer.telefone) {
        showNotification('Cliente não possui um número de telefone cadastrado.', 'error');
        return;
    }

    let message = '';
    if (billing) {
        const isMesa = billing.equipment === 'mesa';
        const paymentMethodText = { pix: 'PIX', dinheiro: 'DINHEIRO', fiado: 'FIADO (ANOTADO)' };
        message = `*RECIBO - MONTANHA BILHAR & JUKEBOX*\n` +
                  `--------------------------------\n` +
                  `*CLIENTE:* ${billing.customerName}\n` +
                  `*DATA:* ${new Date(billing.settledAt).toLocaleString('pt-BR')}\n` +
                  `--------------------------------\n` +
                  `*EQUIPAMENTO:* ${isMesa ? 'MESA SINUCA' : 'JUKEBOX'}\n` +
                  `Leitura Anterior: ${billing.relogioAnterior}\n` +
                  `Leitura Atual: ${billing.relogioAtual}\n` +
                  (isMesa ?
                  `--------------------------------\n` +
                  `Partidas Jogadas: ${billing.partidasJogadas}\n` +
                  `Partidas Desconto: ${billing.descontoPartidas}\n` +
                  `Partidas Cobradas: ${billing.partidasCobradas}\n` +
                  `Valor Ficha: R$ ${billing.valorFicha?.toFixed(2)}\n` : '') +
                  `--------------------------------\n` +
                  `Valor Bruto: R$ ${(billing.parteFirma + billing.parteCliente).toFixed(2)}\n` +
                  `Parte Cliente: R$ ${billing.parteCliente.toFixed(2)}\n` +
                  `*TOTAL (FIRMA): R$ ${billing.valorTotal.toFixed(2)}*\n` +
                  `*PAGAMENTO:* ${paymentMethodText[billing.paymentMethod]}`;
    } else if (debtPayment) {
        const paymentMethodText = { pix: 'PIX', dinheiro: 'DINHEIRO' };
        message = `*COMPROVANTE DE PAGAMENTO - MONTANHA BILHAR & JUKEBOX*\n` +
                  `--------------------------------\n` +
                  `*CLIENTE:* ${debtPayment.customerName}\n` +
                  `*DATA:* ${new Date(debtPayment.paidAt).toLocaleString('pt-BR')}\n` +
                  `--------------------------------\n` +
                  `*VALOR PAGO: R$ ${debtPayment.amountPaid.toFixed(2)}*\n` +
                  `*PAGAMENTO:* ${paymentMethodText[debtPayment.paymentMethod]}`;
    }

    const phoneNumber = customer.telefone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    setReceiptActionPrompt(null);
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
        return <ConfiguracoesView onClearData={handleClearData} onExportData={handleExportData} onMergeData={handleMergeData} onAddCustomerFromText={handleAddCustomerFromText} />;
      default:
        return <div>View não encontrada</div>;
    }
  };

  const customerForReceiptAction = receiptActionPrompt 
    ? customers.find(c => c.id === (receiptActionPrompt.billing?.customerId || receiptActionPrompt.debtPayment?.customerId))
    : null;
  const customerHasPhone = !!(customerForReceiptAction && customerForReceiptAction.telefone);

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen">
       <Notification notification={notification} onClose={() => setNotification(null)} />
       {receiptToShow && <ReceiptModal isOpen={!!receiptToShow} onClose={() => setReceiptToShow(null)} billing={receiptToShow} />}
       {debtReceiptToShow && <DebtReceiptModal isOpen={!!debtReceiptToShow} onClose={() => setDebtReceiptToShow(null)} debtPayment={debtReceiptToShow} />}
       <ReceiptActionsModal
        isOpen={!!receiptActionPrompt}
        onClose={() => setReceiptActionPrompt(null)}
        onPrint={handlePrintReceipt}
        onWhatsApp={handleSendWhatsAppReceipt}
        customerHasPhone={customerHasPhone}
       />
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