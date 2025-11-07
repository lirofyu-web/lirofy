// App.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Customer, Billing, Expense, DebtPayment, Equipment } from './types';
// Fix: Add createRoot import to fix 'require' error.
import { createRoot } from 'react-dom/client';

import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import ClientesView from './views/ClientesView';
import CobrancasView from './views/CobrancasView';
import DespesasView from './views/DespesasView';
import RotasView from './views/RotasView';
import RelatoriosView from './views/RelatoriosView';
import ConfiguracoesView from './views/ConfiguracoesView';
import ReceiptModal from './components/ReceiptModal';
import DebtReceiptModal from './components/DebtReceiptModal';
import ReceiptActionsModal from './components/ReceiptActionsModal';
import Notification from './components/Notification';
import BottomNavBar from './components/BottomNavBar';
import { mockCities, mockFirstNames, mockLastNames, mockStreetNames, mockStreetTypes, mockExpenseDescriptions } from './data/seedHelper';
import MobileHeader from './components/MobileHeader';

export type View = 'DASHBOARD' | 'CLIENTES' | 'COBRANCAS' | 'DESPESAS' | 'ROTAS' | 'RELATORIOS' | 'CONFIGURACOES';

type NotificationState = {
  message: string;
  type: 'success' | 'error';
} | null;

const viewTitles: Record<View, string> = {
    'DASHBOARD': 'Dashboard',
    'CLIENTES': 'Clientes',
    'COBRANCAS': 'Cobranças',
    'DESPESAS': 'Despesas',
    'ROTAS': 'Rotas',
    'RELATORIOS': 'Relatórios',
    'CONFIGURACOES': 'Configurações',
};

const App: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [billings, setBillings] = useState<Billing[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [debtPayments, setDebtPayments] = useState<DebtPayment[]>([]);
    const [currentView, setCurrentView] = useState<View>('DASHBOARD');
    const [isSaving, setIsSaving] = useState(false);

    const [notification, setNotification] = useState<NotificationState>(null);
    
    // Modal States
    const [provisionalReceiptBilling, setProvisionalReceiptBilling] = useState<Billing | null>(null);
    const [provisionalReceiptCallback, setProvisionalReceiptCallback] = useState<(() => void) | null>(null);
    const [finalizedBilling, setFinalizedBilling] = useState<Billing | null>(null);
    const [finalizedDebtPayment, setFinalizedDebtPayment] = useState<DebtPayment | null>(null);

    const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
    }, []);

    const handleSeedData = useCallback(() => {
        console.log("Seeding test data...");

        const testCustomers: Customer[] = [
            {
                id: 'test-customer-1',
                createdAt: new Date(),
                name: 'Bar do Zé (Teste)',
                cpfRg: '000.000.000-01',
                cidade: 'São Paulo, SP',
                endereco: 'Rua de Teste, 123',
                telefone: '11999999991',
                latitude: -23.5505,
                longitude: -46.6333,
                equipment: [
                    { id: uuidv4(), type: 'mesa', numero: '1', relogioNumero: 'M-T1', relogioAnterior: 1000, valorFicha: 2, parteFirma: 50, parteCliente: 50 },
                    { id: uuidv4(), type: 'jukebox', numero: 'A', relogioNumero: 'J-T1', relogioAnterior: 5000, porcentagemJukeboxFirma: 50, porcentagemJukeboxCliente: 50 },
                    { id: uuidv4(), type: 'grua', numero: 'G1', relogioAnterior: 200, aluguelValor: 150, saldo: 0, reposicaoPelucia: 60, quantidadePelucia: 120, aluguelPercentual: 0, recebimentoEspecie: 0, recebimentoPix: 0 }
                ],
                linhaNumero: 'T1',
                assinaturaFirma: '',
                assinaturaCliente: '',
                debtAmount: 0,
                lastVisitedAt: new Date() // Visited recently
            },
            {
                id: 'test-customer-2',
                createdAt: new Date(),
                name: 'Lanchonete da Maria (Teste)',
                cpfRg: '000.000.000-02',
                cidade: 'Rio de Janeiro, RJ',
                endereco: 'Avenida de Teste, 456',
                telefone: '21999999992',
                latitude: -22.9068,
                longitude: -43.1729,
                equipment: [
                    { id: uuidv4(), type: 'mesa', numero: '2', relogioNumero: 'M-T2', relogioAnterior: 2500, valorFicha: 2.5, parteFirma: 60, parteCliente: 40 },
                    { id: uuidv4(), type: 'jukebox', numero: 'B', relogioNumero: 'J-T2', relogioAnterior: 8000, porcentagemJukeboxFirma: 50, porcentagemJukeboxCliente: 50 },
                    { id: uuidv4(), type: 'grua', numero: 'G2', relogioAnterior: 750, aluguelValor: 0, aluguelPercentual: 20, saldo: 0, reposicaoPelucia: 50, quantidadePelucia: 100, recebimentoEspecie: 0, recebimentoPix: 0 }
                ],
                linhaNumero: 'T2',
                assinaturaFirma: '',
                assinaturaCliente: '',
                debtAmount: 50.00,
                lastVisitedAt: new Date(new Date().setDate(new Date().getDate() - 30)) // Visit pending
            }
        ];
        setCustomers(testCustomers);
        
        const seededExpenses: Expense[] = Array.from({ length: 15 }, (_, i) => ({
            id: uuidv4(),
            description: mockExpenseDescriptions[i % mockExpenseDescriptions.length],
            amount: Math.floor(Math.random() * 250) + 50,
            date: new Date(new Date().setDate(new Date().getDate() - i*3)),
        }));
        setExpenses(seededExpenses);
        
        showNotification("Clientes de teste carregados com sucesso!", "success");
    }, [showNotification]);


    useEffect(() => {
        try {
            const storedCustomers = localStorage.getItem('customers');
            const storedBillings = localStorage.getItem('billings');
            const storedExpenses = localStorage.getItem('expenses');
            const storedDebtPayments = localStorage.getItem('debtPayments');

            if (storedCustomers) {
                setCustomers(JSON.parse(storedCustomers));
            } else {
                handleSeedData();
            }
            if (storedBillings) setBillings(JSON.parse(storedBillings));
            if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
            if (storedDebtPayments) setDebtPayments(JSON.parse(storedDebtPayments));

        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            showNotification("Erro ao carregar os dados.", "error");
        }
    }, [handleSeedData, showNotification]);

    useEffect(() => {
        try {
            if (customers.length > 0) localStorage.setItem('customers', JSON.stringify(customers));
            if (billings.length > 0) localStorage.setItem('billings', JSON.stringify(billings));
            if (expenses.length > 0) localStorage.setItem('expenses', JSON.stringify(expenses));
            if (debtPayments.length > 0) localStorage.setItem('debtPayments', JSON.stringify(debtPayments));
        } catch (error) {
            console.error("Failed to save data to localStorage", error);
            showNotification("Erro ao salvar os dados.", "error");
        }
    }, [customers, billings, expenses, debtPayments, showNotification]);

    const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'debtAmount' | 'lastVisitedAt'>) => {
        setIsSaving(true);
        const newCustomer: Customer = {
            ...customerData,
            id: uuidv4(),
            createdAt: new Date(),
            debtAmount: 0,
            lastVisitedAt: null,
        };
        setCustomers(prev => [...prev, newCustomer]);
        setIsSaving(false);
        showNotification("Cliente adicionado com sucesso!", "success");
    };

    const handleUpdateCustomer = async (updatedCustomer: Customer) => {
        setIsSaving(true);
        setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
        setIsSaving(false);
        showNotification("Cliente atualizado com sucesso!", "success");
    };

    const handleDeleteCustomer = (customerId: string) => {
        if (window.confirm("Tem certeza que deseja excluir este cliente e todo o seu histórico? Esta ação não pode ser desfeita.")) {
            setCustomers(prev => prev.filter(c => c.id !== customerId));
            setBillings(prev => prev.filter(b => b.customerId !== customerId));
            setDebtPayments(prev => prev.filter(dp => dp.customerId !== customerId));
            showNotification("Cliente excluído com sucesso!", "success");
        }
    };

    const handleAddBilling = (billing: Billing) => {
        setBillings(prev => [...prev, billing]);

        // Update customer's equipment with new 'relogioAnterior'
        setCustomers(prevCustomers => prevCustomers.map(customer => {
            if (customer.id === billing.customerId) {
                const updatedEquipment = customer.equipment.map(equip => {
                    if (equip.id === billing.equipmentId) {
                        return { ...equip, relogioAnterior: billing.relogioAtual };
                    }
                    return equip;
                });
                
                let newDebtAmount = customer.debtAmount;
                if (billing.paymentMethod === 'fiado' && billing.equipmentType !== 'grua') {
                     newDebtAmount += billing.valorTotal;
                }

                return { ...customer, equipment: updatedEquipment, debtAmount: newDebtAmount, lastVisitedAt: new Date() };
            }
            return customer;
        }));
        
        if (billing.equipmentType !== 'grua') {
            setFinalizedBilling(billing);
        } else {
            showNotification("Cobrança de grua finalizada!", "success");
        }
    };
    
    const handleDeleteBilling = (billingId: string) => {
        const billingToDelete = billings.find(b => b.id === billingId);
        if (!billingToDelete) {
            showNotification("Cobrança não encontrada.", "error");
            return;
        }

        // Revert customer state
        setCustomers(prevCustomers => prevCustomers.map(customer => {
            if (customer.id === billingToDelete.customerId) {
                const updatedEquipment = customer.equipment.map(equip => {
                    if (equip.id === billingToDelete.equipmentId) {
                        // Revert the meter reading
                        return { ...equip, relogioAnterior: billingToDelete.relogioAnterior };
                    }
                    return equip;
                });

                let newDebtAmount = customer.debtAmount;
                if (billingToDelete.paymentMethod === 'fiado' && billingToDelete.equipmentType !== 'grua') {
                    newDebtAmount -= billingToDelete.valorTotal;
                }
                
                return { ...customer, equipment: updatedEquipment, debtAmount: Math.max(0, newDebtAmount) };
            }
            return customer;
        }));

        setBillings(prevBillings => prevBillings.filter(b => b.id !== billingId));

        showNotification("Cobrança excluída com sucesso!", "success");
    };

    const handleAddExpense = (description: string, amount: number) => {
        const newExpense: Expense = {
            id: uuidv4(),
            description,
            amount,
            date: new Date(),
        };
        setExpenses(prev => [...prev, newExpense]);
        showNotification("Despesa adicionada com sucesso!", "success");
    };

    const handleDeleteExpense = (expenseId: string) => {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
        showNotification("Despesa excluída com sucesso!", "success");
    };
    
    const handlePayDebt = (customerId: string, amountPaid: number, paymentMethod: 'pix' | 'dinheiro') => {
        const newPayment: DebtPayment = {
            id: uuidv4(),
            customerId,
            customerName: customers.find(c => c.id === customerId)?.name || 'N/A',
            amountPaid,
            paidAt: new Date(),
            paymentMethod,
        };
        setDebtPayments(prev => [...prev, newPayment]);
        setCustomers(prev => prev.map(c => 
            c.id === customerId ? { ...c, debtAmount: c.debtAmount - amountPaid } : c
        ));
        setFinalizedDebtPayment(newPayment);
    };
    
    const handleExportData = () => {
        const data = {
            customers,
            billings,
            expenses,
            debtPayments,
        };
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `montanha_bilhar_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        showNotification("Dados exportados!", "success");
    };

    const handleMergeData = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                
                const mergeById = (existing: any[], incoming: any[]) => {
                    const map = new Map(existing.map(item => [item.id, item]));
                    incoming.forEach(item => map.set(item.id, item));
                    return Array.from(map.values());
                };

                if (data.customers) setCustomers(prev => mergeById(prev, data.customers));
                if (data.billings) setBillings(prev => mergeById(prev, data.billings));
                if (data.expenses) setExpenses(prev => mergeById(prev, data.expenses));
                if (data.debtPayments) setDebtPayments(prev => mergeById(prev, data.debtPayments));

                showNotification("Dados importados e mesclados com sucesso!", "success");
            } catch (e) {
                console.error("Error parsing JSON file", e);
                showNotification("Erro ao ler o arquivo. Verifique se é um JSON válido.", "error");
            }
        };
        reader.readAsText(file);
    };

    const handleAddCustomerFromText = (text: string) => {
        try {
            const parsed = JSON.parse(text);
            // Basic validation
            if (parsed.name && parsed.cidade && Array.isArray(parsed.equipment)) {
                const customerData = {
                    name: parsed.name || '',
                    cpfRg: parsed.cpfRg || '',
                    cidade: parsed.cidade || '',
                    endereco: parsed.endereco || '',
                    telefone: parsed.telefone || '',
                    linhaNumero: parsed.linhaNumero || '',
                    assinaturaFirma: '',
                    assinaturaCliente: '',
                    equipment: parsed.equipment.map((eq: any) => ({ ...eq, id: uuidv4() })),
                    latitude: parsed.latitude || null,
                    longitude: parsed.longitude || null,
                };
                handleAddCustomer(customerData);
            } else {
                throw new Error("Dados do cliente incompletos ou mal formatados.");
            }
        } catch (error) {
            console.error(error);
            showNotification("Texto inválido. Verifique o formato dos dados.", "error");
        }
    };
    
    const handleTriggerProvisionalReceiptAction = useCallback((billing: Billing, onComplete: () => void) => {
        setProvisionalReceiptBilling(billing);
        setProvisionalReceiptCallback(() => onComplete);
    }, []);

    const renderView = () => {
        switch (currentView) {
            case 'DASHBOARD':
                return <DashboardView billings={billings} expenses={expenses} customers={customers} debtPayments={debtPayments} />;
            case 'CLIENTES':
                return <ClientesView customers={customers} onAddCustomer={handleAddCustomer} onUpdateCustomer={handleUpdateCustomer} onDeleteCustomer={handleDeleteCustomer} onAddBilling={handleAddBilling} onPayDebt={handlePayDebt} billings={billings} debtPayments={debtPayments} isSaving={isSaving} showNotification={showNotification} onTriggerProvisionalReceiptAction={handleTriggerProvisionalReceiptAction} />;
            case 'COBRANCAS':
                return <CobrancasView billings={billings} customers={customers} onShowReceipt={setFinalizedBilling} onDeleteBilling={handleDeleteBilling}/>;
            case 'DESPESAS':
                return <DespesasView expenses={expenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} />;
            case 'ROTAS':
                return <RotasView customers={customers} />;
            case 'RELATORIOS':
                return <RelatoriosView customers={customers} billings={billings} expenses={expenses} debtPayments={debtPayments} />;
            case 'CONFIGURACOES':
                return <ConfiguracoesView onExportData={handleExportData} onMergeData={handleMergeData} onAddCustomerFromText={handleAddCustomerFromText} />;
            default:
                return <DashboardView billings={billings} expenses={expenses} customers={customers} debtPayments={debtPayments} />;
        }
    };
    
    const customerForFinalizedBilling = useMemo(() => {
        return customers.find(c => c.id === finalizedBilling?.customerId);
    }, [finalizedBilling, customers]);

    const customerForProvisionalBilling = useMemo(() => {
        return customers.find(c => c.id === provisionalReceiptBilling?.customerId);
    }, [provisionalReceiptBilling, customers]);


    return (
        <div className="text-slate-100 min-h-screen">
            <div className="flex">
                <Sidebar currentView={currentView} setView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                <main className="flex-1 p-4 sm:p-8 transition-all duration-300 md:ml-64 mb-16 md:mb-0">
                    <MobileHeader 
                        title={viewTitles[currentView]}
                        onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    {renderView()}
                </main>
            </div>
            <BottomNavBar currentView={currentView} setView={setCurrentView} />

            <Notification notification={notification} onClose={() => setNotification(null)} />
            
            {(provisionalReceiptBilling && provisionalReceiptCallback) && (
                 <ReceiptActionsModal
                    isOpen={true}
                    onClose={() => {
                        provisionalReceiptCallback();
                        setProvisionalReceiptBilling(null);
                        setProvisionalReceiptCallback(null);
                    }}
                    onPrint={() => {
                        const modal = document.createElement('div');
                        document.body.appendChild(modal);
                        // Fix: Use createRoot from import instead of require.
                        const root = createRoot(modal);
                        const PrintComponent = () => (
                             <ReceiptModal
                                isOpen={true}
                                onClose={() => {
                                    root.unmount();
                                    document.body.removeChild(modal);
                                }}
                                billing={provisionalReceiptBilling}
                                isProvisional
                            />
                        );
                        root.render(<PrintComponent />);
                    }}
                    onWhatsApp={() => {
                        if (customerForProvisionalBilling?.telefone) {
                            const phone = customerForProvisionalBilling.telefone.replace(/\D/g, '');
                            const text = encodeURIComponent(`Olá, segue o demonstrativo de cobrança para ${provisionalReceiptBilling.customerName}.`);
                            window.open(`https://wa.me/55${phone}?text=${text}`, '_blank');
                        }
                    }}
                    customerHasPhone={!!customerForProvisionalBilling?.telefone}
                />
            )}
            
            {finalizedBilling && (
                <ReceiptActionsModal
                    isOpen={!!finalizedBilling}
                    onClose={() => setFinalizedBilling(null)}
                    onPrint={() => {
                        const modal = document.createElement('div');
                        document.body.appendChild(modal);
                        // Fix: Use createRoot from import instead of require.
                        const root = createRoot(modal);
                        const PrintComponent = () => (
                             <ReceiptModal
                                isOpen={true}
                                onClose={() => {
                                    root.unmount();
                                    document.body.removeChild(modal);
                                }}
                                billing={finalizedBilling}
                            />
                        );
                        root.render(<PrintComponent />);
                    }}
                    onWhatsApp={() => {
                        if (customerForFinalizedBilling?.telefone) {
                            const phone = customerForFinalizedBilling.telefone.replace(/\D/g, '');
                            const text = encodeURIComponent(`Olá, segue o comprovante de cobrança para ${finalizedBilling.customerName}. Valor: R$ ${finalizedBilling.valorTotal.toFixed(2)}.`);
                            window.open(`https://wa.me/55${phone}?text=${text}`, '_blank');
                        }
                    }}
                    customerHasPhone={!!customerForFinalizedBilling?.telefone}
                />
            )}

            {finalizedDebtPayment && (
                 <DebtReceiptModal
                    isOpen={!!finalizedDebtPayment}
                    onClose={() => setFinalizedDebtPayment(null)}
                    debtPayment={finalizedDebtPayment}
                />
            )}
        </div>
    );
};

export default App;
