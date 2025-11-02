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
import ConfiguracoesView from './views/ConfiguracoesView'; // New View
import ActionModal from './components/ActionModal';
import { LogoIcon } from './components/icons/LogoIcon';

export type View = 'DASHBOARD' | 'CLIENTES' | 'COBRANCAS' | 'DESPESAS' | 'RELATORIOS' | 'ROTAS' | 'CONFIGURACOES'; // New View

// --- Geocoding Function ---
const geocodeAddress = async (address: string): Promise<{ lat: number; lon: number } | null> => {
    if (!address.trim() || address.trim() === ',') return null;
    // Nominatim API endpoint (OpenStreetMap's free geocoding service)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    try {
        const response = await fetch(url);
        // Fail silently if not ok, as it might be a network block
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
        return null;
    } catch (error) {
        // Silently fail on fetch error, likely due to environment restrictions
        return null;
    }
};

// --- Sample Data for Testing ---
const createSampleCustomers = (): Customer[] => {
    const now = new Date();
    return [
        {
            id: 'cust_1700000000001',
            createdAt: now,
            name: 'Bar do Zé',
            cpfRg: '111.222.333-44',
            cidade: 'São Paulo, SP',
            endereco: 'Rua Augusta, 200',
            telefone: '11987654321',
            latitude: null, longitude: null, lastVisitedAt: null,
            mesaNumero: '01', relogioMesaNumero: 'M-101', relogioMesaAnterior: 15420, valorFicha: 2, parteFirma: 50, parteCliente: 50,
            jukeboxNumero: 'J-50', relogioJukeboxNumero: 'R-J50', relogioJukeboxAnterior: 8750, porcentagemJukeboxFirma: 60, porcentagemJukeboxCliente: 40,
            linhaNumero: 'Rota A', assinaturaFirma: '', assinaturaCliente: '', debtAmount: 0,
        },
        {
            id: 'cust_1700000000002',
            createdAt: now,
            name: 'Mercearia da Maria',
            cpfRg: '222.333.444-55',
            cidade: 'Rio de Janeiro, RJ',
            endereco: 'Avenida Atlântica, 1702',
            telefone: '21912345678',
            latitude: null, longitude: null, lastVisitedAt: null,
            mesaNumero: '02', relogioMesaNumero: 'M-102', relogioMesaAnterior: 21330, valorFicha: 2.5, parteFirma: 50, parteCliente: 50,
            jukeboxNumero: '', relogioJukeboxNumero: '', relogioJukeboxAnterior: 0, porcentagemJukeboxFirma: 0, porcentagemJukeboxCliente: 0,
            linhaNumero: 'Rota B', assinaturaFirma: '', assinaturaCliente: '', debtAmount: 150.50,
        },
        {
            id: 'cust_1700000000003',
            createdAt: now,
            name: 'Restaurante Sabor do Nordeste',
            cpfRg: '333.444.555-66',
            cidade: 'Salvador, BA',
            endereco: 'Largo do Pelourinho, 10',
            telefone: '71988887777',
            latitude: null, longitude: null, lastVisitedAt: null,
            mesaNumero: '03', relogioMesaNumero: 'M-103', relogioMesaAnterior: 9850, valorFicha: 2, parteFirma: 50, parteCliente: 50,
            jukeboxNumero: 'J-61', relogioJukeboxNumero: 'R-J61', relogioJukeboxAnterior: 12400, porcentagemJukeboxFirma: 50, porcentagemJukeboxCliente: 50,
            linhaNumero: 'Rota A', assinaturaFirma: '', assinaturaCliente: '', debtAmount: 0,
        },
        {
            id: 'cust_1700000000004',
            createdAt: now,
            name: 'Padaria Pão Quente',
            cpfRg: '444.555.666-77',
            cidade: 'Curitiba, PR',
            endereco: 'Rua XV de Novembro, 500',
            telefone: '41999998888',
            latitude: null, longitude: null, lastVisitedAt: null,
            mesaNumero: '', relogioMesaNumero: '', relogioMesaAnterior: 0, valorFicha: 0, parteFirma: 0, parteCliente: 0,
            jukeboxNumero: 'J-75', relogioJukeboxNumero: 'R-J75', relogioJukeboxAnterior: 22100, porcentagemJukeboxFirma: 70, porcentagemJukeboxCliente: 30,
            linhaNumero: 'Rota C', assinaturaFirma: '', assinaturaCliente: '', debtAmount: 0,
        },
        {
            id: 'cust_1700000000005',
            createdAt: now,
            name: 'Lanchonete Central',
            cpfRg: '555.666.777-88',
            cidade: 'Belo Horizonte, MG',
            endereco: 'Avenida Afonso Pena, 1500',
            telefone: '31987651234',
            latitude: null, longitude: null, lastVisitedAt: null,
            mesaNumero: '05', relogioMesaNumero: 'M-105', relogioMesaAnterior: 31500, valorFicha: 2, parteFirma: 50, parteCliente: 50,
            jukeboxNumero: '', relogioJukeboxNumero: '', relogioJukeboxAnterior: 0, porcentagemJukeboxFirma: 0, porcentagemJukeboxCliente: 0,
            linhaNumero: 'Rota B', assinaturaFirma: '', assinaturaCliente: '', debtAmount: 45.00,
        }
    ];
};

const getInitialData = () => {
    const savedCustomers = localStorage.getItem('customers');
    const savedBillings = localStorage.getItem('billings');
    const savedExpenses = localStorage.getItem('expenses');
    const savedDebtPayments = localStorage.getItem('debtPayments');

    // If no customers are saved, load sample data for testing.
    const customers: Customer[] = savedCustomers ? JSON.parse(savedCustomers).map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        latitude: c.latitude !== undefined ? c.latitude : null,
        longitude: c.longitude !== undefined ? c.longitude : null,
        lastVisitedAt: c.lastVisitedAt ? new Date(c.lastVisitedAt) : null,
    })) : createSampleCustomers();

    const billings: Billing[] = savedBillings ? JSON.parse(savedBillings).map((b: any) => ({...b, settledAt: new Date(b.settledAt)})) : [];
    
    const expenses: Expense[] = savedExpenses ? JSON.parse(savedExpenses).map((e: any) => ({...e, date: new Date(e.date)})) : [];
    
    const debtPayments: DebtPayment[] = savedDebtPayments ? JSON.parse(savedDebtPayments).map((p: any) => ({...p, paidAt: new Date(p.paidAt)})) : [];
    
    return { customers, billings, expenses, debtPayments };
};

const initialData = getInitialData();

const MenuIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || 'w-6 h-6'}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const MobileHeader = ({ onMenuClick }: { onMenuClick: () => void }) => (
    <header className="md:hidden bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between no-print sticky top-0 z-10">
        <div className="flex items-center gap-2">
            <LogoIcon className="w-8 h-8 text-slate-300" />
            <h1 className="text-lg font-bold text-white">Montanha</h1>
        </div>
        <button onClick={onMenuClick} className="text-slate-300 hover:text-white p-2">
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
    const [isDataDirty, setIsDataDirty] = useState(false); // For Google Drive Sync

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
        setIsDataDirty(true);
        setIsSaving(false);
    };

    const handleDeleteCustomer = (customerId: string) => {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        setBillings(prev => prev.filter(b => b.customerId !== customerId));
        setDebtPayments(prev => prev.filter(p => p.customerId !== customerId));
        setIsDataDirty(true);
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
        setIsDataDirty(true);
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
                        <div><span>VALOR P/ FIRMA:</span><span>R$ ${billing.valorTotal.toFixed(2)}${billing.paymentMethod === 'fiado' ? ' (DÉBITO)' : ''}</span></div>
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
            const valorBruto = partidasCobradas * customer.valorFicha;
            const valorParteFirma = valorBruto * (customer.parteFirma / 100);
            const valorParteCliente = valorBruto * (customer.parteCliente / 100);

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
                valorTotal: valorParteFirma,
                parteFirma: valorParteFirma,
                parteCliente: valorParteCliente,
                settledAt: new Date(),
                paymentMethod: data.paymentMethod,
            };

            setCustomers(prev => prev.map(c => 
                c.id === data.customerId ? { 
                    ...c, 
                    relogioMesaAnterior: data.relogioAtual,
                    debtAmount: data.paymentMethod === 'fiado' ? c.debtAmount + valorBruto : c.debtAmount,
                    lastVisitedAt: new Date(),
                } : c
            ));

        } else { // Jukebox
            const relogioAnterior = customer.relogioJukeboxAnterior;
            const valorBruto = data.relogioAtual - relogioAnterior; 
            const valorParteFirma = valorBruto * (customer.porcentagemJukeboxFirma / 100);
            const valorParteCliente = valorBruto * (customer.porcentagemJukeboxCliente / 100);
             
            newBilling = {
                id: `bill_${new Date().getTime()}`,
                customerId: customer.id,
                customerName: customer.name,
                equipment: 'jukebox',
                relogioAnterior,
                relogioAtual: data.relogioAtual,
                partidasJogadas: 0,
                descontoPartidas: 0,
                partidasCobradas: valorBruto,
                valorTotal: valorParteFirma,
                parteFirma: valorParteFirma,
                parteCliente: valorParteCliente,
                settledAt: new Date(),
                paymentMethod: data.paymentMethod,
            };

            setCustomers(prev => prev.map(c => 
                c.id === data.customerId ? { 
                    ...c, 
                    relogioJukeboxAnterior: data.relogioAtual,
                    debtAmount: data.paymentMethod === 'fiado' ? c.debtAmount + valorBruto : c.debtAmount,
                    lastVisitedAt: new Date(),
                } : c
            ));
        }
        
        setBillings(prev => [newBilling, ...prev]);
        setIsDataDirty(true);
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
        setIsDataDirty(true);
    };

    const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
        const newExpense: Expense = {
            ...expenseData,
            id: `exp_${new Date().getTime()}`
        };
        setExpenses(prev => [newExpense, ...prev]);
        setIsDataDirty(true);
    };

    const handleDataRestore = (data: { customers: Customer[], billings: Billing[], expenses: Expense[], debtPayments: DebtPayment[] }) => {
        const confirmation = window.confirm(
            "ATENÇÃO: Restaurar este backup substituirá TODOS os dados locais. Esta ação não pode ser desfeita. Deseja continuar?"
        );

        if (confirmation) {
            setCustomers(data.customers.map((c: any) => ({
                ...c,
                createdAt: new Date(c.createdAt),
                lastVisitedAt: c.lastVisitedAt ? new Date(c.lastVisitedAt) : null,
            })));
            setBillings(data.billings.map((b: any) => ({...b, settledAt: new Date(b.settledAt)})));
            setExpenses(data.expenses.map((e: any) => ({...e, date: new Date(e.date)})));
            setDebtPayments(data.debtPayments.map((p: any) => ({...p, paidAt: new Date(p.paidAt)})));
            setIsDataDirty(false); // Data is now in sync with the source
            alert("Dados restaurados com sucesso a partir do Google Drive!");
        }
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
            case 'CONFIGURACOES':
                return <ConfiguracoesView 
                            appData={{ customers, billings, expenses, debtPayments }}
                            onRestore={handleDataRestore}
                            isDataDirty={isDataDirty}
                            onSyncComplete={() => setIsDataDirty(false)}
                        />;
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
            <div className="bg-slate-900 text-slate-100 min-h-screen flex flex-col md:flex-row">
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