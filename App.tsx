// App.tsx
import React, { useState, useEffect } from 'react';
import { Customer, Billing, Expense, DebtPayment } from './types';
import Sidebar from './components/Sidebar';
import ClientesView from './views/ClientesView';
import DashboardView from './views/DashboardView';
import CobrancasView from './views/CobrancasView';
import DespesasView from './views/DespesasView';
import RelatoriosView from './views/RelatoriosView';
import RotasView from './views/RotasView';
import ActionModal from './components/ActionModal';
import { LogoIcon } from './components/icons/LogoIcon';

export type View = 'DASHBOARD' | 'CLIENTES' | 'COBRANCAS' | 'DESPESAS' | 'RELATORIOS' | 'ROTAS';

// --- Geocoding Function ---
const geocodeAddress = async (address: string): Promise<{ lat: number; lon: number } | null> => {
    if (!address.trim() || address.trim() === ',') return null;
    // Nominatim API endpoint (OpenStreetMap's free geocoding service)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Geocoding request failed with status: ${response.status}`);
            return null;
        }
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
        console.warn(`Geocoding failed for address: "${address}". No results found.`);
        return null;
    } catch (error) {
        console.error("Geocoding network error:", error);
        return null;
    }
};

// --- Start of Mock Data Generation ---
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const generateInitialMockData = () => {
    const newCustomers: Customer[] = [];
    const newBillings: Billing[] = [];
    const now = new Date();
    const oneYearAgo = new Date(new Date().setFullYear(now.getFullYear() - 1));

    // Define 20 customers with valid, geocodable addresses for the "Rotas" view demo
    const customerAddresses = [
        { name: "Café Paulista", endereco: "Avenida Paulista, 1578", cidade: "São Paulo, SP" },
        { name: "Bar da Sé", endereco: "Praça da Sé, 10", cidade: "São Paulo, SP" },
        { name: "Copacabana Sinuca", endereco: "Avenida Atlântica, 1702", cidade: "Rio de Janeiro, RJ" },
        { name: "Lapa Jukebox", endereco: "Rua do Lavradio, 20", cidade: "Rio de Janeiro, RJ" },
        { name: "Bar Sete de Setembro", endereco: "Praça Sete de Setembro, 50", cidade: "Belo Horizonte, MG" },
        { name: "Clube Afonso Pena", endereco: "Avenida Afonso Pena, 1212", cidade: "Belo Horizonte, MG" },
        { name: "Bar Elevador", endereco: "Praça Tomé de Souza, 5", cidade: "Salvador, BA" },
        { name: "Pelourinho Games", endereco: "Largo do Pelourinho, 12", cidade: "Salvador, BA" },
        { name: "Beira Mar Bilhar", endereco: "Avenida Beira Mar, 3620", cidade: "Fortaleza, CE" },
        { name: "Tabosa Jukebox Club", endereco: "Rua Monsenhor Tabosa, 1315", cidade: "Fortaleza, CE" },
        { name: "Boca Maldita Bar", endereco: "Rua XV de Novembro, 1", cidade: "Curitiba, PR" },
        { name: "Estação Snooker", endereco: "Avenida Sete de Setembro, 2775", cidade: "Curitiba, PR" },
        { name: "Teatro do Bilhar", endereco: "Avenida Eduardo Ribeiro, 660", cidade: "Manaus, AM" },
        { name: "Bar do Antony", endereco: "Rua Henrique Antony, 220", cidade: "Manaus, AM" },
        { name: "Aurora Bar", endereco: "Rua da Aurora, 1633", cidade: "Recife, PE" },
        { name: "Marco Zero Sinuca", endereco: "Praça do Marco Zero, 20", cidade: "Recife, PE" },
        { name: "Bar Praça Cívica", endereco: "Praça Cívica, 30", cidade: "Goiânia, GO" },
        { name: "Goiás Jukebox", endereco: "Avenida Goiás, 600", cidade: "Goiânia, GO" },
        { name: "Vargas Snooker Club", endereco: "Avenida Presidente Vargas, 1", cidade: "Belém, PA" },
        { name: "Estação das Docas Bar", endereco: "Avenida Boulevard Castilhos França, 770", cidade: "Belém, PA" }
    ];

    for (let i = 0; i < customerAddresses.length; i++) {
        const addr = customerAddresses[i];
        const customerCreatedAt = randomDate(oneYearAgo, now);
        const customer: Customer = {
            id: `cust_route_${Date.now()}_${i}`,
            createdAt: customerCreatedAt,
            name: addr.name,
            cpfRg: `${randomInt(100, 999)}.${randomInt(100, 999)}.${randomInt(100, 999)}-${randomInt(10, 99)}`,
            cidade: addr.cidade,
            endereco: addr.endereco,
            telefone: `(${randomInt(11, 99)}) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
            latitude: null, // To be geocoded
            longitude: null, // To be geocoded
            mesaNumero: `M${randomInt(1, 20)}`,
            relogioMesaNumero: `${randomInt(10000, 99999)}`,
            relogioMesaAnterior: randomInt(1000, 5000),
            valorFicha: randomItem([2, 2.5, 3, 3.5]),
            parteFirma: 50,
            parteCliente: 50,
            jukeboxNumero: `J${randomInt(1, 5)}`,
            relogioJukeboxNumero: `${randomInt(10000, 99999)}`,
            relogioJukeboxAnterior: randomInt(10000, 20000),
            porcentagemJukeboxFirma: 50,
            porcentagemJukeboxCliente: 50,
            linhaNumero: `${randomInt(1, 100)}`,
            assinaturaFirma: '',
            assinaturaCliente: '',
            debtAmount: 0,
            lastVisitedAt: null,
        };
        newCustomers.push(customer);
    }
    
    for (const customer of newCustomers) {
        const equipment = randomItem<'mesa' | 'jukebox'>(['mesa', 'jukebox']);
        const settledAt = randomDate(customer.createdAt, now);
        const paymentMethod = randomItem<'pix' | 'dinheiro' | 'fiado'>(['pix', 'dinheiro', 'fiado']);
        
        let billing: Billing;

        if (equipment === 'mesa') {
            const relogioAnterior = customer.relogioMesaAnterior;
            const relogioAtual = relogioAnterior + randomInt(10, 100);
            const partidasJogadas = relogioAtual - relogioAnterior;
            const descontoPartidas = randomInt(0, 5);
            const partidasCobradas = partidasJogadas - descontoPartidas;
            const valorTotal = partidasCobradas * customer.valorFicha;

            billing = {
                id: `bill_${Date.now()}_${customer.id}`,
                customerId: customer.id,
                customerName: customer.name,
                equipment: 'mesa',
                relogioAnterior,
                relogioAtual,
                partidasJogadas,
                descontoPartidas,
                partidasCobradas,
                valorFicha: customer.valorFicha,
                valorTotal,
                parteFirma: valorTotal * (customer.parteFirma / 100),
                parteCliente: valorTotal * (customer.parteCliente / 100),
                settledAt,
                paymentMethod,
            };
        } else { // jukebox
            const relogioAnterior = customer.relogioJukeboxAnterior;
            const relogioAtual = relogioAnterior + randomInt(50, 500);
            const valorTotal = relogioAtual - relogioAnterior;

            billing = {
                id: `bill_${Date.now()}_${customer.id}`,
                customerId: customer.id,
                customerName: customer.name,
                equipment: 'jukebox',
                relogioAnterior,
                relogioAtual,
                partidasJogadas: 0,
                descontoPartidas: 0,
                partidasCobradas: valorTotal,
                valorTotal: valorTotal,
                parteFirma: valorTotal * (customer.porcentagemJukeboxFirma / 100),
                parteCliente: valorTotal * (customer.porcentagemJukeboxCliente / 100),
                settledAt,
                paymentMethod,
            };
        }
        
        if (paymentMethod === 'fiado') {
            customer.debtAmount += billing.valorTotal;
        }
        
        newBillings.push(billing);
    }
    
    return {
        customers: newCustomers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        billings: newBillings.sort((a, b) => b.settledAt.getTime() - a.settledAt.getTime()),
    };
};

const getInitialData = () => {
    const savedCustomers = localStorage.getItem('customers');
    const savedBillings = localStorage.getItem('billings');
    const savedExpenses = localStorage.getItem('expenses');
    const savedDebtPayments = localStorage.getItem('debtPayments');

    let customers: Customer[] = [];
    let billings: Billing[] = [];
    const expenses: Expense[] = savedExpenses ? JSON.parse(savedExpenses).map((e: any) => ({...e, date: new Date(e.date)})) : [];
    const debtPayments: DebtPayment[] = savedDebtPayments ? JSON.parse(savedDebtPayments).map((p: any) => ({...p, paidAt: new Date(p.paidAt)})) : [];


    if (savedCustomers && savedBillings) {
        customers = JSON.parse(savedCustomers).map((c: any) => ({
            ...c,
            createdAt: new Date(c.createdAt),
            latitude: c.latitude !== undefined ? c.latitude : null,
            longitude: c.longitude !== undefined ? c.longitude : null,
            lastVisitedAt: c.lastVisitedAt ? new Date(c.lastVisitedAt) : null,
        }));
        billings = JSON.parse(savedBillings).map((b: any) => ({...b, settledAt: new Date(b.settledAt)}));
    } else {
        const mockData = generateInitialMockData();
        customers = mockData.customers;
        billings = mockData.billings;
        localStorage.setItem('customers', JSON.stringify(customers));
        localStorage.setItem('billings', JSON.stringify(billings));
    }
    
    return { customers, billings, expenses, debtPayments };
}
// --- End of Mock Data Generation ---

const initialData = getInitialData();

const MenuIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const MobileHeader = ({ onMenuClick }: { onMenuClick: () => void }) => (
    <header className="md:hidden bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
            <LogoIcon className="w-8 h-8 text-slate-300" />
            <h1 className="text-lg font-bold text-white">Montanha</h1>
        </div>
        <button onClick={onMenuClick} className="text-slate-300 hover:text-white">
            <MenuIcon className="w-6 h-6" />
        </button>
    </header>
);

const App: React.FC = () => {
    const [view, setView] = useState<View>('CLIENTES');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // State management with localStorage persistence
    const [customers, setCustomers] = useState<Customer[]>(initialData.customers);
    const [billings, setBillings] = useState<Billing[]>(initialData.billings);
    const [expenses, setExpenses] = useState<Expense[]>(initialData.expenses);
    const [debtPayments, setDebtPayments] = useState<DebtPayment[]>(initialData.debtPayments);
    const [billingToPrint, setBillingToPrint] = useState<Billing | null>(null);

    useEffect(() => {
        // This effect runs once on mount to geocode any initial customers that don't have coordinates.
        const geocodeInitialCustomers = async () => {
            const customersToGeocode = customers.filter(c => c.latitude === null && c.endereco && c.cidade);
            if (customersToGeocode.length === 0) return;

            const geocodedCustomers = await Promise.all(
                customersToGeocode.map(async customer => {
                    const fullAddress = `${customer.endereco}, ${customer.cidade}`;
                    const coords = await geocodeAddress(fullAddress);
                    return {
                        ...customer,
                        latitude: coords ? coords.lat : null,
                        longitude: coords ? coords.lon : null,
                    };
                })
            );
            
            const geocodedMap = new Map(geocodedCustomers.map(c => [c.id, c]));

            setCustomers(prevCustomers => 
                prevCustomers.map(c => geocodedMap.has(c.id) ? geocodedMap.get(c.id)! : c)
            );
        };
        
        geocodeInitialCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        localStorage.setItem('customers', JSON.stringify(customers));
    }, [customers]);

    useEffect(() => {
        localStorage.setItem('billings', JSON.stringify(billings));
    }, [billings]);

    useEffect(() => {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }, [expenses]);

    useEffect(() => {
        localStorage.setItem('debtPayments', JSON.stringify(debtPayments));
    }, [debtPayments]);

    const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'debtAmount' | 'latitude' | 'longitude' | 'lastVisitedAt'>) => {
        setIsSaving(true);
        const fullAddress = `${customerData.endereco}, ${customerData.cidade}`;
        const coords = await geocodeAddress(fullAddress);

        const newCustomer: Customer = {
            ...customerData,
            id: `cust_${new Date().getTime()}`,
            createdAt: new Date(),
            debtAmount: 0,
            latitude: coords ? coords.lat : null,
            longitude: coords ? coords.lon : null,
            lastVisitedAt: null,
        };
        setCustomers(prev => [newCustomer, ...prev]);
        setIsSaving(false);
    };

    const handleDeleteCustomer = (customerId: string) => {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        setBillings(prev => prev.filter(b => b.customerId !== customerId));
        setDebtPayments(prev => prev.filter(p => p.customerId !== customerId));
    };
    
    const handleUpdateCustomer = async (updatedCustomer: Customer) => {
        setIsSaving(true);
        const originalCustomer = customers.find(c => c.id === updatedCustomer.id);
        if (!originalCustomer) {
            setIsSaving(false);
            return;
        }

        const oldAddress = `${originalCustomer.endereco}, ${originalCustomer.cidade}`;
        const newAddress = `${updatedCustomer.endereco}, ${updatedCustomer.cidade}`;

        if (oldAddress.trim() !== newAddress.trim()) {
            const coords = await geocodeAddress(newAddress);
            updatedCustomer.latitude = coords ? coords.lat : null;
            updatedCustomer.longitude = coords ? coords.lon : null;
        }
        
        setCustomers(prev => prev.map(c => 
            c.id === updatedCustomer.id ? updatedCustomer : c
        ));
        setIsSaving(false);
    };

    const printReceipt = (billing: Billing) => {
        const receiptHtml = `
            <html>
            <head>
                <title>Recibo</title>
                <style>
                    body { font-family: Georgia, serif; width: 300px; margin: 0 auto; padding: 20px; }
                    .receipt { text-align: center; }
                    h2, h3, p { margin: 0; }
                    h3 { font-size: 1.2em; }
                    hr { border: 0; border-top: 1px dashed #000; margin: 8px 0; }
                    .details div { display: flex; justify-content: space-between; margin-bottom: 4px;}
                    .total { font-weight: bold; border-top: 1px dashed #000; padding-top: 8px; margin-top: 8px; }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <h3>Montanha Bilhar e Jukebox</h3>
                    <p>Comprovante de Serviço</p>
                    <hr />
                    <div class="details">
                        <div><span>Cliente:</span><span>${billing.customerName}</span></div>
                        <div><span>Data:</span><span>${billing.settledAt.toLocaleString('pt-BR')}</span></div>
                        <div><span>Equip.:</span><span>${billing.equipment === 'mesa' ? 'Mesa' : 'Jukebox'}</span></div>
                        <div><span>Pgto:</span><span>${billing.paymentMethod.charAt(0).toUpperCase() + billing.paymentMethod.slice(1)}</span></div>
                    </div>
                    <hr />
                    ${billing.equipment === 'mesa' ? `
                        <div class="details">
                            <div><span>Leitura Ant.:</span><span>${billing.relogioAnterior}</span></div>
                            <div><span>Leitura Atual:</span><span>${billing.relogioAtual}</span></div>
                            <div><span>Partidas:</span><span>${billing.partidasJogadas}</span></div>
                            <div><span>Desconto:</span><span>${billing.descontoPartidas}</span></div>
                            <div style="font-weight: bold;"><span>Part. Cobradas:</span><span>${billing.partidasCobradas}</span></div>
                            <div><span>Valor Ficha:</span><span>R$ ${billing.valorFicha?.toFixed(2)}</span></div>
                        </div>
                    ` : `
                        <div class="details">
                            <div><span>Leitura Ant.:</span><span>${billing.relogioAnterior}</span></div>
                            <div><span>Leitura Atual:</span><span>${billing.relogioAtual}</span></div>
                        </div>
                    `}
                    <div class="details total">
                        <div><span>TOTAL:</span><span>R$ ${billing.valorTotal.toFixed(2)}${billing.paymentMethod === 'fiado' ? ' (DÉBITO)' : ''}</span></div>
                    </div>
                </div>
            </body>
            </html>
        `;
        const printWindow = window.open('', '', 'height=600,width=400');
        if (printWindow) {
            printWindow.document.write(receiptHtml);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };
    
    const handleSettleBill = (data: { customerId: string; equipment: 'mesa' | 'jukebox'; relogioAtual: number; descontoPartidas: number; paymentMethod: 'pix' | 'dinheiro' | 'fiado'; }) => {
        const customer = customers.find(c => c.id === data.customerId);
        if (!customer) return;

        let newBilling: Billing;
        
        if (data.equipment === 'mesa') {
            const relogioAnterior = customer.relogioMesaAnterior;
            const partidasJogadas = data.relogioAtual - relogioAnterior;
            const partidasCobradas = partidasJogadas - data.descontoPartidas;
            const valorTotal = partidasCobradas * customer.valorFicha;

            newBilling = {
                id: `bill_${new Date().getTime()}`,
                customerId: customer.id,
                customerName: customer.name,
                equipment: 'mesa',
                relogioAnterior,
                relogioAtual: data.relogioAtual,
                partidasJogadas,
                descontoPartidas: data.descontoPartidas,
                partidasCobradas,
                valorFicha: customer.valorFicha,
                valorTotal,
                parteFirma: valorTotal * (customer.parteFirma / 100),
                parteCliente: valorTotal * (customer.parteCliente / 100),
                settledAt: new Date(),
                paymentMethod: data.paymentMethod,
            };

            setCustomers(prev => prev.map(c => 
                c.id === data.customerId ? { 
                    ...c, 
                    relogioMesaAnterior: data.relogioAtual,
                    debtAmount: data.paymentMethod === 'fiado' ? c.debtAmount + valorTotal : c.debtAmount,
                    lastVisitedAt: new Date(),
                } : c
            ));

        } else { // Jukebox
            const relogioAnterior = customer.relogioJukeboxAnterior;
            const valorTotal = data.relogioAtual - relogioAnterior; 
             
            newBilling = {
                id: `bill_${new Date().getTime()}`,
                customerId: customer.id,
                customerName: customer.name,
                equipment: 'jukebox',
                relogioAnterior,
                relogioAtual: data.relogioAtual,
                partidasJogadas: 0,
                descontoPartidas: 0,
                partidasCobradas: valorTotal,
                valorTotal: valorTotal,
                parteFirma: valorTotal * (customer.porcentagemJukeboxFirma / 100),
                parteCliente: valorTotal * (customer.porcentagemJukeboxCliente / 100),
                settledAt: new Date(),
                paymentMethod: data.paymentMethod,
            };

            setCustomers(prev => prev.map(c => 
                c.id === data.customerId ? { 
                    ...c, 
                    relogioJukeboxAnterior: data.relogioAtual,
                    debtAmount: data.paymentMethod === 'fiado' ? c.debtAmount + valorTotal : c.debtAmount,
                    lastVisitedAt: new Date(),
                } : c
            ));
        }
        
        setBillings(prev => [newBilling, ...prev]);
        setBillingToPrint(newBilling);
    };

    const handlePayDebt = (customerId: string, amount: number, paymentMethod: 'pix' | 'dinheiro') => {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;

        const newPayment: DebtPayment = {
            id: `debt_${new Date().getTime()}`,
            customerId,
            customerName: customer.name,
            amountPaid: amount,
            paidAt: new Date(),
            paymentMethod,
        };
        setDebtPayments(prev => [newPayment, ...prev]);

        setCustomers(prev => prev.map(c => 
            c.id === customerId ? { ...c, debtAmount: c.debtAmount - amount } : c
        ));
    };

    const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
        const newExpense: Expense = {
            ...expenseData,
            id: `exp_${new Date().getTime()}`
        };
        setExpenses(prev => [newExpense, ...prev]);
    };

    const renderView = () => {
        switch (view) {
            case 'DASHBOARD':
                return <DashboardView billings={billings} expenses={expenses} customers={customers} debtPayments={debtPayments} />;
            case 'CLIENTES':
                return <ClientesView customers={customers} onAddCustomer={handleAddCustomer} onSettleBill={handleSettleBill} onDeleteCustomer={handleDeleteCustomer} onPayDebt={handlePayDebt} onUpdateCustomer={handleUpdateCustomer} isSaving={isSaving} />;
            case 'COBRANCAS':
                return <CobrancasView billings={billings} debtPayments={debtPayments} />;
            case 'DESPESAS':
                return <DespesasView expenses={expenses} onAddExpense={handleAddExpense} />;
            case 'RELATORIOS':
                return <RelatoriosView customers={customers} billings={billings} expenses={expenses} debtPayments={debtPayments} />;
            case 'ROTAS':
                return <RotasView customers={customers} />;
            default:
                return <ClientesView customers={customers} onAddCustomer={handleAddCustomer} onSettleBill={handleSettleBill} onDeleteCustomer={handleDeleteCustomer} onPayDebt={handlePayDebt} onUpdateCustomer={handleUpdateCustomer} isSaving={isSaving} />;
        }
    };

    const handleConfirmPrint = () => {
        if (billingToPrint) {
            printReceipt(billingToPrint);
        }
        setBillingToPrint(null);
    };
    
    return (
        <>
            <div className="bg-slate-900 text-slate-100 min-h-screen flex">
                <Sidebar currentView={view} setView={setView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                <div className="flex-1 flex flex-col min-w-0">
                    <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />
                    <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                        {renderView()}
                    </main>
                </div>
            </div>
            <ActionModal
                isOpen={!!billingToPrint}
                onClose={() => setBillingToPrint(null)}
                onConfirm={handleConfirmPrint}
                title="Impressão de Recibo"
                confirmText="Imprimir"
            >
                <p>
                    Cobrança realizada com sucesso! Deseja imprimir o comprovante?
                </p>
            </ActionModal>
        </>
    );
};

export default App;