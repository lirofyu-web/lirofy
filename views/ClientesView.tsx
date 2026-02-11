// views/ClientesView.tsx
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Customer, Warning, Billing } from '../types';
import AddCustomerForm from '../components/AddCustomerForm';
import CustomerCard from '../components/CustomerCard';
import PageHeader from '../components/PageHeader';
import { SearchIcon } from '../components/icons/SearchIcon';
import { QrCodeIcon } from '../components/icons/QrCodeIcon';
import { LocationMarkerIcon } from '../components/icons/LocationMarkerIcon';
import CityCustomersModal from '../components/CityCustomersModal';
import { GreenBilliardBallIcon } from '../components/icons/GreenBilliardBallIcon';
import { RedBilliardBallIcon } from '../components/icons/RedBilliardBallIcon';
import { BilliardIcon } from '../components/icons/BilliardIcon';
import { JukeboxIcon } from '../components/icons/JukeboxIcon';
import { CraneIcon } from '../components/icons/CraneIcon';
import { ListBulletIcon } from '../components/icons/ListBulletIcon';

interface ClientesViewProps {
  customers: Customer[];
  warnings: Warning[];
  billings: Billing[];
  onAddCustomer: (customerData: Omit<Customer, 'id' | 'createdAt' | 'debtAmount' | 'lastVisitedAt'>) => Promise<void>;
  isSaving: boolean;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  onFocusCustomer: (customer: Customer) => void;
  // Modal Trigger Callbacks
  onBillCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
  onPayDebtCustomer: (customer: Customer) => void;
  onHistoryCustomer: (customer: Customer) => void;
  onShareCustomer: (customer: Customer) => void;
  onOpenScanner: () => void;
  onLocationActions: (customer: Customer) => void;
  onWhatsAppActions: (customer: Customer) => void;
  onFinalizePendingPayment: (billing: Billing) => void;
  onPendingPaymentAction: (customer: Customer, billing: Billing) => void;
  areValuesHidden: boolean;
}

type EquipmentFilter = 'all' | 'mesa' | 'jukebox' | 'grua';

// Debounce function to delay search filtering
const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};

const ClientesView: React.FC<ClientesViewProps> = ({ 
    customers, 
    warnings,
    billings,
    onAddCustomer, 
    isSaving,
    showNotification,
    onFocusCustomer,
    onBillCustomer,
    onEditCustomer,
    onDeleteCustomer,
    onPayDebtCustomer,
    onHistoryCustomer,
    onShareCustomer,
    onOpenScanner,
    onLocationActions,
    onWhatsAppActions,
    onFinalizePendingPayment,
    onPendingPaymentAction,
    areValuesHidden,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentFilter>('all');
  const [viewingCity, setViewingCity] = useState<string | null>(null);

  // State for city search suggestions
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // Debounce search input for main filtering
  const debouncedSetSearch = useCallback(debounce(setDebouncedSearchQuery, 300), []);
  useEffect(() => {
      debouncedSetSearch(searchQuery);
  }, [searchQuery, debouncedSetSearch]);


  // Get unique cities from customer list
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    customers.forEach(customer => {
        if (customer.cidade) {
            cities.add(customer.cidade);
        }
    });
    return Array.from(cities).sort((a, b) => a.localeCompare(b));
  }, [customers]);
  
  // Debounce for city suggestions
  useEffect(() => {
    if (searchQuery.length > 1) {
      const handler = setTimeout(() => {
        const matchingCities = uniqueCities.filter(city =>
          city.toLowerCase().startsWith(searchQuery.toLowerCase())
        );
        setCitySuggestions(matchingCities.slice(0, 5));
        setIsSuggestionsOpen(matchingCities.length > 0);
      }, 300); // 300ms delay

      return () => {
        clearTimeout(handler);
      };
    } else {
      setCitySuggestions([]);
      setIsSuggestionsOpen(false);
    }
  }, [searchQuery, uniqueCities]);


  // Click outside handler for suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const filteredCustomers = useMemo(() => {
    return customers
        .filter(customer => {
            // Search query filter (using debounced value)
            if (!debouncedSearchQuery) return true;
            return customer.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                   customer.cidade.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                   customer.linhaNumero.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
        })
        .filter(customer => {
            // Equipment filter
            if (equipmentFilter === 'all') return true;
            return (customer.equipment || []).some(e => e.type === equipmentFilter);
        });
  }, [customers, debouncedSearchQuery, equipmentFilter]);

  const customersByCity = useMemo(() => {
    const grouped = filteredCustomers.reduce((acc, customer) => {
        const city = customer.cidade.trim() || 'Sem Cidade';
        if (!acc[city]) {
            acc[city] = [];
        }
        acc[city].push(customer);
        return acc;
    }, {} as Record<string, Customer[]>);

    // Sort customers within each city by name
    for (const city in grouped) {
        grouped[city].sort((a, b) => a.name.localeCompare(b.name));
    }

    return grouped;
  }, [filteredCustomers]);

  const sortedCities = useMemo(() => Object.keys(customersByCity).sort((a, b) => a.localeCompare(b)), [customersByCity]);
  
  const cityStats = useMemo(() => {
    const stats: Record<string, { visited: number; notVisited: number }> = {};
    const twentyFiveDaysInMs = 25 * 24 * 60 * 60 * 1000;

    for (const city of sortedCities) {
        const cityCustomers = customersByCity[city];
        let visited = 0;
        let notVisited = 0;
        cityCustomers.forEach(customer => {
            const visitIsPending = !customer.lastVisitedAt || (new Date().getTime() - new Date(customer.lastVisitedAt).getTime()) > twentyFiveDaysInMs;
            if (visitIsPending) {
                notVisited++;
            } else {
                visited++;
            }
        });
        stats[city] = { visited, notVisited };
    }
    return stats;
  }, [sortedCities, customersByCity]);

  const handleCityCardClick = useCallback((city: string) => {
    setViewingCity(city);
  }, []);
  
  // New handlers for search suggestions
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const handleSuggestionClick = (city: string) => {
    setSearchQuery(city);
    setIsSuggestionsOpen(false);
  };

  return (
    <>
      <PageHeader title="Clientes" subtitle="Gerencie seus clientes e equipamentos." />

      <div className="mb-8">
        <AddCustomerForm customers={customers} onAddCustomer={onAddCustomer} isSaving={isSaving} showNotification={showNotification} />
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 mb-8 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <div className="relative flex-grow w-full" ref={searchWrapperRef}>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Filtrar por nome, cidade ou linha..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => citySuggestions.length > 0 && setIsSuggestionsOpen(true)}
                    autoComplete="off"
                    className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                 {isSuggestionsOpen && citySuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 rounded-md shadow-lg border border-slate-200 dark:border-slate-600 max-h-60 overflow-y-auto">
                        <ul className="py-1">
                            {citySuggestions.map((city) => (
                                <li
                                    key={city}
                                    onClick={() => handleSuggestionClick(city)}
                                    className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600"
                                >
                                    {city}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <button
                onClick={onOpenScanner}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-500 transition-colors"
            >
                <QrCodeIcon className="w-5 h-5" />
                <span>Escanear QR Code</span>
            </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
            <button onClick={() => setEquipmentFilter('all')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${equipmentFilter === 'all' ? 'bg-lime-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                <ListBulletIcon className={`w-8 h-8 ${equipmentFilter === 'all' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className="text-xs font-bold mt-1">Todos</span>
            </button>
            <button onClick={() => setEquipmentFilter('mesa')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${equipmentFilter === 'mesa' ? 'bg-lime-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                <BilliardIcon className={`w-8 h-8 ${equipmentFilter === 'mesa' ? 'text-white' : 'text-cyan-600 dark:text-cyan-400'}`} />
                <span className="text-xs font-bold mt-1">Mesas</span>
            </button>
            <button onClick={() => setEquipmentFilter('jukebox')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${equipmentFilter === 'jukebox' ? 'bg-lime-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                <JukeboxIcon className={`w-8 h-8 ${equipmentFilter === 'jukebox' ? 'text-white' : 'text-fuchsia-600 dark:text-fuchsia-400'}`} />
                <span className="text-xs font-bold mt-1">Jukebox</span>
            </button>
            <button onClick={() => setEquipmentFilter('grua')} className={`flex flex-col items-center p-2 rounded-lg transition-colors ${equipmentFilter === 'grua' ? 'bg-lime-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                <CraneIcon className={`w-8 h-8 ${equipmentFilter === 'grua' ? 'text-white' : 'text-orange-600 dark:text-orange-400'}`} />
                <span className="text-xs font-bold mt-1">Gruas</span>
            </button>
        </div>
      </div>

      <div className="space-y-6">
        {sortedCities.map((city, index) => {
          const cityCustomers = customersByCity[city];
          const stats = cityStats[city];
          
          const isEven = index % 2 === 0;
          const cardBgColor = isEven 
              ? 'bg-lime-100 dark:bg-lime-900' 
              : 'bg-cyan-100 dark:bg-cyan-900';
          const cardBorderColor = isEven 
              ? 'border-lime-200 dark:border-lime-700' 
              : 'border-cyan-200 dark:border-cyan-700';

          return (
            <section
                key={city}
                className={`${cardBgColor} ${cardBorderColor} p-4 rounded-lg shadow-lg border`}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <LocationMarkerIcon className="w-6 h-6 text-slate-400" />
                        {city} ({cityCustomers.length})
                    </h2>
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-green-500" title="Clientes visitados nos últimos 25 dias">
                            <GreenBilliardBallIcon className="w-4 h-4" />
                            <span className="font-bold">{stats.visited}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-red-500" title="Clientes com visita pendente">
                            <RedBilliardBallIcon className="w-4 h-4" />
                            <span className="font-bold">{stats.notVisited}</span>
                        </div>
                        <button onClick={() => handleCityCardClick(city)} className="text-sm font-semibold text-lime-600 dark:text-lime-400 hover:underline">
                            Ver Todos &rarr;
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {cityCustomers.slice(0, 4).map(customer => {
                        const hasActiveWarning = warnings.some(w => w.customerId === customer.id && !w.isResolved);
                        return (
                            <CustomerCard
                                key={customer.id}
                                customer={customer}
                                billings={billings}
                                hasActiveWarning={hasActiveWarning}
                                onBill={onBillCustomer}
                                onEdit={onEditCustomer}
                                onDelete={onDeleteCustomer}
                                onPayDebt={onPayDebtCustomer}
                                onHistory={onHistoryCustomer}
                                onShare={onShareCustomer}
                                showNotification={showNotification}
                                onFocusCustomer={onFocusCustomer}
                                onLocationActions={onLocationActions}
                                onWhatsAppActions={onWhatsAppActions}
                                onFinalizePendingPayment={onFinalizePendingPayment}
                                onPendingPaymentAction={onPendingPaymentAction}
                                areValuesHidden={areValuesHidden}
                            />
                        );
                    })}
                </div>
            </section>
          );
        })}
      </div>

      {viewingCity && (
        <CityCustomersModal
          city={viewingCity}
          customers={customersByCity[viewingCity] || []}
          warnings={warnings}
          billings={billings}
          onClose={() => setViewingCity(null)}
          onBillCustomer={onBillCustomer}
          onEditCustomer={onEditCustomer}
          onDeleteCustomer={onDeleteCustomer}
          onPayDebtCustomer={onPayDebtCustomer}
          onHistoryCustomer={onHistoryCustomer}
          onShareCustomer={onShareCustomer}
          showNotification={showNotification}
          onFocusCustomer={onFocusCustomer}
          onLocationActions={onLocationActions}
          onWhatsAppActions={onWhatsAppActions}
          onFinalizePayment={onFinalizePendingPayment}
          onPendingPaymentAction={onPendingPaymentAction}
          areValuesHidden={areValuesHidden}
        />
      )}
    </>
  );
};

export default ClientesView;
