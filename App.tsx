// App.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Customer, Billing, Expense, DebtPayment, Equipment, PixSticker } from './types';
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
import InstallPwaBanner from './components/InstallPwaBanner';

export type View = 'DASHBOARD' | 'CLIENTES' | 'COBRANCAS' | 'DESPESAS' | 'ROTAS' | 'RELATORIOS' | 'CONFIGURACOES';
export type Theme = 'light' | 'dark';

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
    const [pixStickers, setPixStickers] = useState<PixSticker[]>([]);
    
    // Initialize currentView from localStorage or default to DASHBOARD
    const [currentView, setCurrentView] = useState<View>(() => {
        const savedView = localStorage.getItem('lastActiveView');
        const validViews: View[] = ['DASHBOARD', 'CLIENTES', 'COBRANCAS', 'DESPESAS', 'ROTAS', 'RELATORIOS', 'CONFIGURACOES'];
        return (savedView && validViews.includes(savedView as View)) ? (savedView as View) : 'DASHBOARD';
    });

    const [isSaving, setIsSaving] = useState(false);
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');

    const [notification, setNotification] = useState<NotificationState>(null);
    
    // Modal States
    const [provisionalReceiptBilling, setProvisionalReceiptBilling] = useState<Billing | null>(null);
    const [provisionalReceiptCallback, setProvisionalReceiptCallback] = useState<(() => void) | null>(null);
    const [finalizedBilling, setFinalizedBilling] = useState<Billing | null>(null);
    const [finalizedDebtPayment, setFinalizedDebtPayment] = useState<DebtPayment | null>(null);
    
    // PWA Install states
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [bannerDismissed, setBannerDismissed] = useState(() => {
        return localStorage.getItem('pwaInstallBannerDismissed') === 'true';
    });


    useEffect(() => {
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsStandalone(true);
        }
    }, []);

    useEffect(() => {
      const handler = (e: Event) => {
        const customEvent = e as CustomEvent;
        setInstallPrompt(customEvent.detail);
      };
      
      window.addEventListener('pwa-install-prompt', handler);
  
      return () => {
        window.removeEventListener('pwa-install-prompt', handler);
      };
    }, []);

    const handleInstallClick = useCallback(() => {
      if (!installPrompt) {
        return;
      }
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the PWA installation');
        } else {
          console.log('User dismissed the PWA installation');
        }
        setInstallPrompt(null);
        setBannerDismissed(true); // Also dismiss banner after choice
      });
    }, [installPrompt]);
    
    const handleDismissBanner = useCallback(() => {
        localStorage.setItem('pwaInstallBannerDismissed', 'true');
        setBannerDismissed(true);
    }, []);

    // Effect to save currentView whenever it changes
    useEffect(() => {
        localStorage.setItem('lastActiveView', currentView);
    }, [currentView]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'dark' ? 'light' : 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
    }, []);

    const handleSeedData = useCallback(() => {
        console.log("Seeding dynamic test data...");
    
        const getRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
        const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    
        const generateEquipment = (type: 'mesa' | 'jukebox' | 'grua'): Equipment => {
            const id = uuidv4();
            switch (type) {
                case 'mesa':
                    return { id, type, numero: `${getRandomInt(1, 20)}`, relogioNumero: `M-S${getRandomInt(10, 99)}`, relogioAnterior: getRandomInt(100, 5000), valorFicha: getRandom([2, 2.5, 3]), parteFirma: 50, parteCliente: 50 };
                case 'jukebox':
                    return { id, type, numero: `${String.fromCharCode(65 + getRandomInt(0, 5))}`, relogioNumero: `J-R${getRandomInt(10, 99)}`, relogioAnterior: getRandomInt(1000, 20000), porcentagemJukeboxFirma: 50, porcentagemJukeboxCliente: 50 };
                case 'grua':
                    const hasPercentageRent = Math.random() > 0.5;
                    return { id, type, numero: `G${getRandomInt(1, 5)}`, relogioAnterior: getRandomInt(100, 2000), aluguelValor: hasPercentageRent ? 0 : getRandomInt(100, 250), aluguelPercentual: hasPercentageRent ? getRandom([20, 25, 30]) : 0, quantidadePelucia: 120, reposicaoPelucia: 60, saldo:0, recebimentoEspecie:0, recebimentoPix:0 };
            }
        };
    
        const testCustomers: Customer[] = Array.from({ length: 40 }, () => {
            const cityInfo = getRandom(mockCities);
            const equipmentTypes: ('mesa' | 'jukebox' | 'grua')[] = ['mesa'];
            if (Math.random() > 0.4) equipmentTypes.push('jukebox');
            if (Math.random() > 0.8) equipmentTypes.push('grua');
    
            const lastVisitedDaysAgo = getRandomInt(1, 45);
    
            return {
                id: uuidv4(),
                createdAt: new Date(),
                name: `Bar ${getRandom(mockFirstNames)} ${getRandom(mockLastNames)}`,
                cpfRg: `${getRandomInt(100, 999)}.${getRandomInt(100, 999)}.${getRandomInt(100, 999)}-${getRandomInt(10, 99)}`,
                cidade: cityInfo.name,
                endereco: `${getRandom(mockStreetTypes)} ${getRandom(mockStreetNames)}, ${getRandomInt(1, 500)}`,
                telefone: `119${getRandomInt(1000, 9999)}${getRandomInt(1000, 9999)}`,
                latitude: cityInfo.lat + (Math.random() - 0.5) * 0.05,
                longitude: cityInfo.lon + (Math.random() - 0.5) * 0.05,
                equipment: equipmentTypes.map(type => generateEquipment(type)),
                linhaNumero: `R${getRandomInt(1, 5)}`,
                assinaturaFirma: '',
                assinaturaCliente: '',
                debtAmount: Math.random() > 0.7 ? getRandomInt(10, 150) : 0,
                lastVisitedAt: new Date(new Date().setDate(new Date().getDate() - lastVisitedDaysAgo)),
            };
        });
    
        setCustomers(testCustomers);
        
        const seededExpenses: Expense[] = Array.from({ length: 25 }, () => ({
            id: uuidv4(),
            description: getRandom(mockExpenseDescriptions),
            amount: getRandomInt(30, 300),
            date: new Date(new Date().setDate(new Date().getDate() - getRandomInt(0, 90))),
        }));
        setExpenses(seededExpenses);
        
        showNotification("Dados de teste dinâmicos carregados!", "success");
    }, [showNotification]);


   useEffect(() => {
    try {
        const parseWithDates = (jsonString: string | null, dateFields: string[]): any[] => {
            if (!jsonString) return [];
            const items = JSON.parse(jsonString);
            if (!Array.isArray(items)) return [];
            return items.map(item => {
                for (const field of dateFields) {
                    if (item[field]) {
                        item[field] = new Date(item[field]);
                    }
                }
                return item;
            });
        };

        const storedCustomers = localStorage.getItem('customers');
        if (storedCustomers) {
            setCustomers(parseWithDates(storedCustomers, ['createdAt', 'lastVisitedAt']));
        } else {
            handleSeedData(); // Seeds data only if customers don't exist
        }
        
        setBillings(parseWithDates(localStorage.getItem('billings'), ['settledAt']));
        setExpenses(parseWithDates(localStorage.getItem('expenses'), ['date']));
        setDebtPayments(parseWithDates(localStorage.getItem('debtPayments'), ['paidAt']));
        
        const storedPixStickers = localStorage.getItem('pixStickers');
        if (storedPixStickers) {
            setPixStickers(JSON.parse(storedPixStickers));
        }

    } catch (error) {
        console.error("Failed to load data from localStorage", error);
        showNotification("Erro ao carregar os dados.", "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Run only once on initial mount

    useEffect(() => {
        try {
            if (customers.length > 0) localStorage.setItem('customers', JSON.stringify(customers));
            if (billings.length > 0) localStorage.setItem('billings', JSON.stringify(billings));
            if (expenses.length > 0) localStorage.setItem('expenses', JSON.stringify(expenses));
            if (debtPayments.length > 0) localStorage.setItem('debtPayments', JSON.stringify(debtPayments));
            if (pixStickers.length > 0) localStorage.setItem('pixStickers', JSON.stringify(pixStickers));
        } catch (error) {
            console.error("Failed to save data to localStorage", error);
            showNotification("Erro ao salvar os dados.", "error");
        }
    }, [customers, billings, expenses, debtPayments, pixStickers, showNotification]);

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

        setCustomers(prevCustomers => {
            return prevCustomers.map(customer => {
                if (customer.id === billing.customerId) {
                    const updatedEquipment = customer.equipment.map(equip => {
                        if (equip.id === billing.equipmentId) {
                            return { ...equip, relogioAnterior: billing.relogioAtual };
                        }
                        return equip;
                    });
    
                    const existingDebt = Number(customer.debtAmount) || 0;
                    const newFiado = Number(billing.valorPagoFiado) || 0;
                    let finalDebt = existingDebt;

                    if (newFiado > 0 && billing.equipmentType !== 'grua') {
                        finalDebt = existingDebt + newFiado;
                    }
    
                    return { 
                        ...customer, 
                        equipment: updatedEquipment, 
                        debtAmount: finalDebt, 
                        lastVisitedAt: new Date() 
                    };
                }
                return customer;
            });
        });
        
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
    
        setCustomers(prevCustomers => prevCustomers.map(customer => {
            if (customer.id === billingToDelete.customerId) {
                const updatedEquipment = customer.equipment.map(equip => {
                    if (equip.id === billingToDelete.equipmentId) {
                        return { ...equip, relogioAnterior: billingToDelete.relogioAnterior };
                    }
                    return equip;
                });
    
                const existingDebt = Number(customer.debtAmount) || 0;
                const fiadoToReverse = Number(billingToDelete.valorPagoFiado) || 0;
                let finalDebt = existingDebt;

                if (fiadoToReverse > 0 && billingToDelete.equipmentType !== 'grua') {
                    finalDebt = existingDebt - fiadoToReverse;
                }
                
                return { 
                    ...customer, 
                    equipment: updatedEquipment, 
                    debtAmount: Math.max(0, finalDebt) 
                };
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
            c.id === customerId ? { ...c, debtAmount: (Number(c.debtAmount) || 0) - amountPaid } : c
        ));
        setFinalizedDebtPayment(newPayment);
    };

    const handleSavePixSticker = useCallback((sticker: PixSticker) => {
        setPixStickers(prev => {
            const index = prev.findIndex(s => s.id === sticker.id);
            if (index !== -1) {
                const updated = [...prev];
                updated[index] = sticker;
                return updated;
            }
            return [...prev, sticker];
        });
        showNotification("Adesivo salvo!", "success");
    }, [showNotification]);

    const handleDeletePixSticker = useCallback((stickerId: string) => {
        if (window.confirm("Tem certeza que deseja excluir este adesivo?")) {
            setPixStickers(prev => prev.filter(s => s.id !== stickerId));
            showNotification("Adesivo excluído.", "success");
        }
    }, [showNotification]);
    
    const handleExportData = () => {
        const data = {
            customers,
            billings,
            expenses,
            debtPayments,
            pixStickers,
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
                if (data.pixStickers) setPixStickers(prev => mergeById(prev, data.pixStickers));

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
                return <RelatoriosView customers={customers} billings={billings} expenses={expenses} debtPayments={debtPayments} pixStickers={pixStickers} onSavePixSticker={handleSavePixSticker} onDeletePixSticker={handleDeletePixSticker} />;
            case 'CONFIGURACOES':
                return <ConfiguracoesView onExportData={handleExportData} onMergeData={handleMergeData} onAddCustomerFromText={handleAddCustomerFromText} theme={theme} setTheme={setTheme} />;
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
        <div className="text-slate-800 dark:text-slate-100 min-h-screen">
            <div className="flex">
                <Sidebar 
                    currentView={currentView} 
                    setView={setCurrentView} 
                    isOpen={isSidebarOpen} 
                    setIsOpen={setIsSidebarOpen}
                />
                <main className="flex-1 p-4 sm:p-8 transition-all duration-300 md:ml-64 mb-16 md:mb-0">
                    <MobileHeader 
                        title={viewTitles[currentView]}
                        onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    {renderView()}
                </main>
            </div>
            <BottomNavBar currentView={currentView} setView={setCurrentView} />

            {installPrompt && !isStandalone && !bannerDismissed && (
                <InstallPwaBanner 
                    onInstall={handleInstallClick} 
                    onDismiss={handleDismissBanner} 
                />
            )}

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