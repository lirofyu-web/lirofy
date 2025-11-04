// App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Customer, Billing, Expense, DebtPayment, Equipment } from './types';
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

  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  }, []);

  useEffect(() => {
    const migrationCompleted = localStorage.getItem('migration_v2_complete');
    if (!migrationCompleted) {
        // Check if migration is needed by inspecting the old data structure
        const firstCustomer = customers[0] as any;
        if (firstCustomer && firstCustomer.hasOwnProperty('mesaNumero')) {
            console.log("Old data structure detected, running migration...");
            const migratedCustomers = customers.map((c: any) => {
                const newEquipment: Equipment[] = [];
                if (c.mesaNumero) {
                    newEquipment.push({
                        id: `equip_mesa_${c.id}`,
                        type: 'mesa',
                        numero: c.mesaNumero,
                        relogioNumero: c.relogioMesaNumero,
                        relogioAnterior: c.relogioMesaAnterior,
                        valorFicha: c.valorFicha,
                        parteFirma: c.parteFirma,
                        parteCliente: c.parteCliente,
                    });
                }
                if (c.jukeboxNumero) {
                    newEquipment.push({
                        id: `equip_jukebox_${c.id}`,
                        type: 'jukebox',
                        numero: c.jukeboxNumero,
                        relogioNumero: c.relogioJukeboxNumero,
                        relogioAnterior: c.relogioJukeboxAnterior,
                        porcentagemJukeboxFirma: c.porcentagemJukeboxFirma,
                        porcentagemJukeboxCliente: c.porcentagemJukeboxCliente,
                    });
                }
                // Remove old fields and add the new equipment array
                delete c.mesaNumero;
                delete c.relogioMesaNumero;
                delete c.relogioMesaAnterior;
                delete c.valorFicha;
                delete c.parteFirma;
                delete c.parteCliente;
                delete c.jukeboxNumero;
                delete c.relogioJukeboxNumero;
                delete c.relogioJukeboxAnterior;
                delete c.porcentagemJukeboxFirma;
                delete c.porcentagemJukeboxCliente;
                
                return { ...c, equipment: newEquipment };
            });
            setCustomers(migratedCustomers);
            localStorage.setItem('migration_v2_complete', 'true');
            showNotification('Dados atualizados para o novo formato com sucesso!', 'success');
        } else {
             localStorage.setItem('migration_v2_complete', 'true');
        }
    }
  }, [customers, setCustomers, showNotification]); // Run only on first load


  const seedInitialData = useCallback(() => {
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

    for (let i = 0; i < 100; i++) {
        const city = getRandom(mockCities);
        const customerEquipment: Equipment[] = [];
        const numMesas = getRandomNumber(0, 2);
        const numJukeboxes = getRandomNumber(0, 1);

        for (let m = 0; m < numMesas; m++) {
            const parteFirma = getRandom([40, 50, 60]);
            customerEquipment.push({
                id: `equip_seed_mesa_${i}_${m}`,
                type: 'mesa',
                numero: `${getRandomNumber(100, 300)}`,
                relogioNumero: `M-S${getRandomNumber(10, 99)}`,
                relogioAnterior: getRandomNumber(1000, 20000),
                valorFicha: getRandom([2, 2.5, 3]),
                parteFirma: parteFirma,
                parteCliente: 100 - parteFirma,
            });
        }

        for (let j = 0; j < numJukeboxes; j++) {
            const parteFirma = getRandom([50, 60, 70]);
            customerEquipment.push({
                id: `equip_seed_jukebox_${i}_${j}`,
                type: 'jukebox',
                numero: `J-${getRandomNumber(1, 50)}`,
                relogioNumero: `R-J${getRandomNumber(10, 99)}`,
                relogioAnterior: getRandomNumber(5000, 30000),
                porcentagemJukeboxFirma: parteFirma,
                porcentagemJukeboxCliente: 100 - parteFirma,
            });
        }
        
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
            equipment: customerEquipment,
            linhaNumero: `Rota ${getRandomNumber(1, 5)}`,
            assinaturaFirma: '',
            assinaturaCliente: '',
            debtAmount: 0,
            lastVisitedAt: null,
        };

        const numBillings = getRandomNumber(0, 3);
        let lastEventDate = customer.createdAt;
        
        for (let j = 0; j < numBillings; j++) {
            const availableEquipment = customer.equipment.filter(e => e.relogioAnterior > 0);
            if (availableEquipment.length === 0) continue;

            const equipmentToBill = getRandom(availableEquipment);
            const equipmentIndex = customer.equipment.findIndex(e => e.id === equipmentToBill.id);
            if (equipmentIndex === -1) continue;

            const minSettledAt = new Date(lastEventDate);
            minSettledAt.setDate(minSettledAt.getDate() + getRandomNumber(25, 60));
            if (minSettledAt > new Date()) continue;
            const settledAt = getRandomDate(minSettledAt, new Date());
            
            const relogioAnterior = equipmentToBill.relogioAnterior;
            const relogioAtual = relogioAnterior + getRandomNumber(10, 500);
            const partidasJogadas = relogioAtual - relogioAnterior;
            
            const {
                descontoPartidas = 0,
                partidasCobradas = 0,
                valorBruto = 0,
                valorTotal = 0,
                parteFirma = 0,
                parteCliente = 0
            } = (() => {
                if (equipmentToBill.type === 'mesa') {
                    const desc = getRandomNumber(0, Math.min(partidasJogadas, 10));
                    const cobradas = partidasJogadas - desc;
                    const bruto = cobradas * (equipmentToBill.valorFicha || 0);
                    const vTotal = bruto * ((equipmentToBill.parteFirma || 0) / 100);
                    return {
                        descontoPartidas: desc,
                        partidasCobradas: cobradas,
                        valorBruto: bruto,
                        valorTotal: vTotal,
                        parteFirma: vTotal,
                        parteCliente: bruto - vTotal,
                    };
                } else { // Jukebox
                    const bruto = partidasJogadas;
                    const vTotal = bruto * ((equipmentToBill.porcentagemJukeboxFirma || 0) / 100);
                    return {
                        valorBruto: bruto,
                        valorTotal: vTotal,
                        parteFirma: vTotal,
                        parteCliente: bruto - vTotal,
                    };
                }
            })();
            
            const paymentMethod = getRandom(['pix', 'dinheiro', 'fiado'] as const);

            newBillings.push({
                id: `bill_seed_${customer.id}_${j}`,
                customerId: customer.id,
                customerName: customer.name,
                equipmentType: equipmentToBill.type,
                equipmentId: equipmentToBill.id,
                equipmentNumero: equipmentToBill.numero,
                relogioAnterior,
                relogioAtual,
                partidasJogadas,
                descontoPartidas,
                partidasCobradas,
                valorFicha: equipmentToBill.valorFicha,
                valorTotal,
                parteFirma,
                parteCliente,
                settledAt,
                paymentMethod,
            });
            
            customer.lastVisitedAt = settledAt;
            customer.equipment[equipmentIndex].relogioAnterior = relogioAtual;
            if (paymentMethod === 'fiado') {
                customer.debtAmount += valorBruto;
            }
            lastEventDate = settledAt;
        }
        finalCustomers.push(customer);
    }
    
    const newExpenses: Expense[] = [];
    for (let i = 0; i < 30; i++) {
        newExpenses.push({
            id: `exp_seed_${new Date().getTime() + i}`,
            description: getRandom(mockExpenseDescriptions),
            amount: getRandomNumber(20, 300),
            date: getRandomDate(new Date(new Date().setFullYear(new Date().getFullYear() - 1)), new Date()),
        });
    }

    setCustomers(prev => [...prev, ...finalCustomers].sort((a,b) => a.name.localeCompare(b.name)));
    setBillings(prev => [...prev, ...newBillings]);
    setExpenses(prev => [...prev, ...newExpenses]);
  }, [setCustomers, setBillings, setExpenses]);

  useEffect(() => {
    const dataSeeded = localStorage.getItem('dataSeeded');
    if (!dataSeeded && customers.length === 0) {
      console.log("First run detected, seeding initial data...");
      seedInitialData();
      localStorage.setItem('dataSeeded', 'true');
      showNotification('Dados de exemplo carregados para sua primeira utilização!', 'success');
    }
  }, [customers.length, seedInitialData, showNotification]);
  
  const geocodeAddress = useCallback(async (address: string, city: string): Promise<{ lat: number | null; lon: number | null }> => {
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
  }, [showNotification]);


  const handleAddCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'createdAt' | 'debtAmount' | 'latitude' | 'longitude' | 'lastVisitedAt'>) => {
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
  }, [geocodeAddress, setCustomers, showNotification]);

  const handleUpdateCustomer = useCallback(async (updatedCustomer: Customer) => {
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
  }, [customers, geocodeAddress, setCustomers, showNotification]);

  const handleDeleteCustomer = useCallback((customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    setBillings(prev => prev.filter(b => b.customerId !== customerId));
    setDebtPayments(prev => prev.filter(p => p.customerId !== customerId));
    showNotification('Cliente excluído com sucesso.');
  }, [setCustomers, setBillings, setDebtPayments, showNotification]);

  const handleSettleBill = useCallback((billingData: {
    customerId: string;
    equipmentId: string;
    relogioAtual: number;
    paymentMethod: 'pix' | 'dinheiro' | 'fiado';
    descontoPartidas?: number;
    aluguelPercentual?: number;
    aluguelValor?: number;
    saldo?: number;
    quantidadePelucia?: number;
    sobraPelucia?: number;
    reposicaoPelucia?: number;
    recebimentoEspecie?: number;
    recebimentoPix?: number;
  }) => {
    const customer = customers.find(c => c.id === billingData.customerId);
    if (!customer) return;

    const equipment = customer.equipment.find(e => e.id === billingData.equipmentId);
    if (!equipment) return;

    let newBilling: Billing;
    let updatedEquipment: Equipment;

    const { relogioAtual, paymentMethod } = billingData;
    const relogioAnterior = equipment.relogioAnterior;
    const partidasJogadas = relogioAtual > relogioAnterior ? relogioAtual - relogioAnterior : 0;
    
    if (equipment.type === 'grua') {
        const { aluguelPercentual, aluguelValor, saldo, quantidadePelucia, sobraPelucia, reposicaoPelucia, recebimentoEspecie, recebimentoPix } = billingData;
        
        const firmaShare = saldo! - aluguelValor!;

        newBilling = {
            id: `bill_${new Date().getTime()}`,
            customerId: customer.id,
            customerName: customer.name,
            equipmentType: 'grua',
            equipmentId: equipment.id,
            equipmentNumero: equipment.numero,
            relogioAnterior,
            relogioAtual,
            partidasJogadas,
            settledAt: new Date(),
            paymentMethod: paymentMethod,
            valorTotal: firmaShare, // This is the firm's calculated share
            aluguelPercentual,
            aluguelValor, // This is the client's share
            saldo,
            quantidadePelucia,
            sobraPelucia,
            reposicaoPelucia,
            recebimentoEspecie,
            recebimentoPix
        };

        updatedEquipment = {
            ...equipment,
            relogioAnterior: relogioAtual,
            // Per new logic, `quantidadePelucia` represents the machine's capacity and doesn't change after a restock.
        };

    } else { // Mesa or Jukebox
        const { descontoPartidas = 0 } = billingData;
        let valorBruto = 0;
        let valorTotal = 0; // Firma's take
        let partidasCobradas = 0;

        if (equipment.type === 'mesa') {
            partidasCobradas = partidasJogadas - descontoPartidas;
            valorBruto = partidasCobradas * (equipment.valorFicha || 0);
            valorTotal = valorBruto * ((equipment.parteFirma || 0) / 100);
        } else { // jukebox
            partidasCobradas = partidasJogadas;
            valorBruto = partidasJogadas;
            valorTotal = valorBruto * ((equipment.porcentagemJukeboxFirma || 0) / 100);
        }

        newBilling = {
            id: `bill_${new Date().getTime()}`,
            customerId: customer.id,
            customerName: customer.name,
            equipmentType: equipment.type,
            equipmentId: equipment.id,
            equipmentNumero: equipment.numero,
            relogioAnterior,
            relogioAtual,
            partidasJogadas,
            descontoPartidas: equipment.type === 'mesa' ? descontoPartidas : undefined,
            partidasCobradas,
            valorFicha: equipment.type === 'mesa' ? equipment.valorFicha : undefined,
            valorTotal,
            parteFirma: valorTotal,
            parteCliente: valorBruto - valorTotal,
            settledAt: new Date(),
            paymentMethod,
        };
        
        updatedEquipment = { ...equipment, relogioAnterior: relogioAtual };

         if (paymentMethod === 'fiado') {
            setCustomers(prev => prev.map(c => c.id === customer.id ? {...c, debtAmount: c.debtAmount + valorBruto } : c));
        }
    }

    setBillings(prev => [...prev, newBilling]);

    setCustomers(prev => prev.map(c => {
        if (c.id === customer.id) {
            return {
                ...c,
                equipment: c.equipment.map(eq => eq.id === equipment.id ? updatedEquipment : eq),
                lastVisitedAt: new Date(),
            };
        }
        return c;
    }));

    showNotification('Cobrança registrada com sucesso!');
    setReceiptActionPrompt({ billing: newBilling });
  }, [customers, setBillings, setCustomers, showNotification]);

  const handlePayDebt = useCallback((customerId: string, amount: number, paymentMethod: 'pix' | 'dinheiro') => {
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
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, debtAmount: parseFloat((c.debtAmount - amount).toFixed(2)) } : c));
    showNotification('Pagamento de dívida registrado!');
    setReceiptActionPrompt({ debtPayment: newPayment });
  }, [customers, setCustomers, setDebtPayments, showNotification]);

  const handleAddExpense = useCallback((description: string, amount: number) => {
    const newExpense: Expense = {
      id: `exp_${new Date().getTime()}`,
      description,
      amount,
      date: new Date(),
    };
    setExpenses(prev => [...prev, newExpense]);
    showNotification('Despesa adicionada.');
  }, [setExpenses, showNotification]);

  const handleDeleteExpense = useCallback((expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    showNotification('Despesa removida.');
  }, [setExpenses, showNotification]);

   const handleExportData = useCallback(() => {
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
  }, [customers, billings, expenses, debtPayments, showNotification]);

   const handleMergeData = useCallback((file: File) => {
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
    }, [setCustomers, setBillings, setExpenses, setDebtPayments, showNotification]);

    const handleAddCustomerFromText = useCallback((text: string) => {
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

            // This import is simplified and will only import the first Mesa/Jukebox found.
            // A more complex parser would be needed for multi-equipment text import.
             const equipment: Equipment[] = [];
             if (data['Nº Mesa']) {
                equipment.push({
                    id: `equip_text_${new Date().getTime()}_m`,
                    type: 'mesa',
                    numero: data['Nº Mesa'] || '',
                    relogioNumero: data['Nº Relógio Mesa'] || '',
                    relogioAnterior: parseInt(data['Leitura Ant. Mesa'], 10) || 0,
                    valorFicha: parseFloat(data['Valor Ficha']?.replace('R$ ', '')) || 2.00,
                    parteFirma: parseInt(data['% Firma (Mesa)'], 10) || 50,
                    parteCliente: parseInt(data['% Cliente (Mesa)'], 10) || 50,
                });
             }
             if (data['Nº Jukebox']) {
                 equipment.push({
                    id: `equip_text_${new Date().getTime()}_j`,
                    type: 'jukebox',
                    numero: data['Nº Jukebox'] || '',
                    relogioNumero: data['Nº Relógio Jukebox'] || '',
                    relogioAnterior: parseInt(data['Leitura Ant. Jukebox'], 10) || 0,
                    porcentagemJukeboxFirma: parseInt(data['% Firma (Jukebox)'], 10) || 50,
                    porcentagemJukeboxCliente: parseInt(data['% Cliente (Jukebox)'], 10) || 50,
                });
             }
            if (data['Nº Grua']) {
                equipment.push({
                    id: `equip_text_${new Date().getTime()}_g`,
                    type: 'grua',
                    numero: data['Nº Grua'] || '',
                    relogioAnterior: parseInt(data['Leitura Ant. Grua'], 10) || 0,
                    aluguelPercentual: data['Aluguel (%)'] ? parseInt(data['Aluguel (%)'], 10) : undefined,
                    aluguelValor: parseFloat(data['Aluguel Fixo (R$)']?.replace('R$ ', '')) || 0,
                    quantidadePelucia: data['Qtd. Pelúcias'] ? parseInt(data['Qtd. Pelúcias'], 10) : undefined,
                });
            }

            const newCustomerData: Omit<Customer, 'id' | 'createdAt' | 'debtAmount' | 'latitude' | 'longitude' | 'lastVisitedAt'> = {
                name: data['Nome'] || '',
                cpfRg: data['CPF/RG'] || '',
                cidade: data['Cidade'] || '',
                endereco: data['Endereço'] || '',
                telefone: data['Telefone'] || '',
                linhaNumero: data['Linha/Rota'] || '',
                equipment: equipment,
                assinaturaFirma: '',
                assinaturaCliente: '',
            };

            if (!newCustomerData.name) {
                throw new Error("Nome do cliente não encontrado no texto.");
            }

            handleAddCustomer(newCustomerData);
            showNotification('Cliente importado via texto com sucesso!');
        } catch (error) {
            console.error("Failed to parse customer from text", error);
            showNotification('Falha ao importar cliente. Verifique o formato do texto.', 'error');
        }
    }, [handleAddCustomer, showNotification]);
    
  const handlePrintReceipt = useCallback(() => {
    if (!receiptActionPrompt) return;
    if (receiptActionPrompt.billing) {
      setReceiptToShow(receiptActionPrompt.billing);
    } else if (receiptActionPrompt.debtPayment) {
      setDebtReceiptToShow(receiptActionPrompt.debtPayment);
    }
    setReceiptActionPrompt(null);
  }, [receiptActionPrompt]);

  const handleSendWhatsAppReceipt = useCallback(() => {
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
        const paymentMethodText = { pix: 'PIX', dinheiro: 'DINHEIRO', fiado: 'FIADO (ANOTADO)' };
        let equipmentDetails = '';
        if (billing.equipmentType === 'mesa') {
            equipmentDetails = `*EQUIPAMENTO:* MESA ${billing.equipmentNumero}\n` +
                               `Leitura Anterior: ${billing.relogioAnterior}\n` +
                               `Leitura Atual: ${billing.relogioAtual}\n` +
                               `--------------------------------\n` +
                               `Partidas Jogadas: ${billing.partidasJogadas}\n` +
                               `Partidas Desconto: ${billing.descontoPartidas}\n` +
                               `Partidas Cobradas: ${billing.partidasCobradas}\n` +
                               `Valor Ficha: R$ ${(billing.valorFicha ?? 0).toFixed(2)}\n` +
                               `--------------------------------\n` +
                               `Valor Bruto: R$ ${(billing.parteFirma! + billing.parteCliente!).toFixed(2)}\n` +
                               `Parte Cliente: R$ ${billing.parteCliente!.toFixed(2)}\n` +
                               `*TOTAL (FIRMA): R$ ${billing.valorTotal.toFixed(2)}*`;
        } else if (billing.equipmentType === 'jukebox') {
            equipmentDetails = `*EQUIPAMENTO:* JUKEBOX ${billing.equipmentNumero}\n` +
                               `Leitura Anterior: ${billing.relogioAnterior}\n` +
                               `Leitura Atual: ${billing.relogioAtual}\n` +
                               `--------------------------------\n` +
                               `Valor Bruto: R$ ${(billing.parteFirma! + billing.parteCliente!).toFixed(2)}\n` +
                               `Parte Cliente: R$ ${billing.parteCliente!.toFixed(2)}\n` +
                               `*TOTAL (FIRMA): R$ ${billing.valorTotal.toFixed(2)}*`;
        } else if (billing.equipmentType === 'grua') {
             equipmentDetails = `*EQUIPAMENTO:* GRUA ${billing.equipmentNumero}\n` +
                                `Leitura Anterior: ${billing.relogioAnterior}\n` +
                                `Leitura Atual: ${billing.relogioAtual}\n` +
                                `--------------------------------\n` +
                                `SALDO: R$ ${(billing.saldo || 0).toFixed(2)}\n` +
                                `Reposição Pelúcias: ${billing.reposicaoPelucia || 0}\n` +
                                `Recebido Espécie: R$ ${(billing.recebimentoEspecie || 0).toFixed(2)}\n` +
                                `Recebido PIX: R$ ${(billing.recebimentoPix || 0).toFixed(2)}\n` +
                                `--------------------------------\n` +
                                `ALUGUEL (PAGO AO CLIENTE): R$ ${(billing.aluguelValor || 0).toFixed(2)}\n` +
                                `*TOTAL (FIRMA): R$ ${billing.valorTotal.toFixed(2)}*`;
        }

        message = `*RECIBO - MONTANHA BILHAR & JUKEBOX*\n` +
                  `--------------------------------\n` +
                  `*CLIENTE:* ${billing.customerName}\n` +
                  `*DATA:* ${new Date(billing.settledAt).toLocaleString('pt-BR')}\n` +
                  `--------------------------------\n` +
                   equipmentDetails + `\n` +
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
  }, [customers, receiptActionPrompt, showNotification]);


  const renderView = () => {
    switch(currentView) {
      case 'DASHBOARD':
        return <DashboardView customers={customers} billings={billings} expenses={expenses} debtPayments={debtPayments} />;
      case 'CLIENTES':
        return <ClientesView customers={customers} billings={billings} debtPayments={debtPayments} onAddCustomer={handleAddCustomer} onSettleBill={handleSettleBill} onDeleteCustomer={handleDeleteCustomer} onPayDebt={handlePayDebt} onUpdateCustomer={handleUpdateCustomer} isSaving={isSaving} />;
      case 'COBRANCAS':
        return <CobrancasView billings={billings} customers={customers} onShowReceipt={setReceiptToShow} />;
      case 'DESPESAS':
        return <DespesasView expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} />;
      case 'ROTAS':
        return <RotasView customers={customers} />;
      case 'RELATORIOS':
        return <RelatoriosView customers={customers} billings={billings} expenses={expenses} debtPayments={debtPayments} />;
       case 'CONFIGURACOES':
        return <ConfiguracoesView onExportData={handleExportData} onMergeData={handleMergeData} onAddCustomerFromText={handleAddCustomerFromText} />;
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