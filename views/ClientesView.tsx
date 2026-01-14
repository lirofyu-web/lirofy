// views/ClientesView.tsx
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Customer, Warning } from '../types';
import AddCustomerForm from '../components/AddCustomerForm';
import CustomerCard from '../components/CustomerCard';
import PageHeader from '../components/PageHeader';
import { SearchIcon } from '../components/icons/SearchIcon';
import { QrCodeIcon } from '../components/icons/QrCodeIcon';
import QrScannerModal from '../components/QrScannerModal';
import { LocationMarkerIcon } from '../components/icons/LocationMarkerIcon';
import CityCustomersModal from '../components/CityCustomersModal';
import { GreenBilliardBallIcon } from '../components/icons/GreenBilliardBallIcon';
import { RedBilliardBallIcon } from '../components/icons/RedBilliardBallIcon';

interface ClientesViewProps {
  customers: Customer[];
  warnings: Warning[];
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
}

type EquipmentFilter = 'all' | 'mesa' | 'jukebox' | 'grua';

const ClientesView: React.FC<ClientesViewProps> = ({ 
    customers, 
    warnings,
    onAddCustomer, 
    isSaving,
    showNotification,
    onFocusCustomer,
    onBillCustomer,
    onEditCustomer,
    onDeleteCustomer,
    onPayDebtCustomer,
    onHistoryCustomer,
    onShareCustomer
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentFilter>('all');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [viewingCity, setViewingCity] = useState<string | null>(null);
  const citySectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const filteredCustomers = useMemo(() => {
    return customers
        .filter(customer => {
            // Search query filter
            if (!searchQuery) return true;
            return customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   customer.cidade.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   customer.linhaNumero.toLowerCase().includes(searchQuery.toLowerCase());
        })
        .filter(customer => {
            // Equipment filter
            if (equipmentFilter === 'all') return true;
            return customer.equipment.some(e => e.type === equipmentFilter);
        });
  }, [customers, searchQuery, equipmentFilter]);

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

  const handleScanSuccess = useCallback((decodedText: string) => {
      setIsScannerOpen(false);
      try {
          const data = JSON.parse(decodedText);
          if (data.type === 'equipment' && data.id) {
              const customerWithEquipment = customers.find(c => c.equipment.some(e => e.id === data.id));
              if (customerWithEquipment) {
                  showNotification(`Equipamento encontrado para ${customerWithEquipment.name}!`, 'success');
                  onBillCustomer(customerWithEquipment);
              } else {
                  showNotification("Equipamento não encontrado ou não associado a um cliente.", "error");
              }
              return;
          }
      } catch (e) {
          const customer = customers.find(c => c.id === decodedText);
          if (customer) {
              showNotification(`Cliente ${customer.name} encontrado!`, 'success');
              onBillCustomer(customer);
          } else {
              showNotification("QR Code inválido. Não corresponde a um cliente ou equipamento conhecido.", "error");
          }
      }
  }, [customers, showNotification, onBillCustomer]);

  const handleCityCardClick = useCallback((city: string) => {
    setViewingCity(city);
  }, []);

  return (
    <>
      <PageHeader title="Clientes" subtitle="Gerencie seus clientes e equipamentos." />

      <div className="mb-8">
        <AddCustomerForm customers={customers} onAddCustomer={onAddCustomer} isSaving={isSaving} showNotification={showNotification} />
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 mb-8 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <div className="relative flex-grow w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    placeholder="Filtrar por nome, cidade ou linha..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 pl-10 pr-4 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>
            <button
                onClick={() => setIsScannerOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-600 text-white font-bold py-2 px-4 rounded-md hover:bg-slate-500 transition-colors"
            >
                <QrCodeIcon className="w-5 h-5" />
                <span>Escanear QR Code</span>
            </button>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <button onClick={() => setEquipmentFilter('all')} className={`flex-1 sm:flex-initial px-4 py-2 text-sm font-bold rounded-md ${equipmentFilter === 'all' ? 'bg-lime-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Todos</button>
            <button onClick={() => setEquipmentFilter('mesa')} className={`flex-1 sm:flex-initial px-4 py-2 text-sm font-bold rounded-md ${equipmentFilter === 'mesa' ? 'bg-lime-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Mesas</button>
            <button onClick={() => setEquipmentFilter('jukebox')} className={`flex-1 sm:flex-initial px-4 py-2 text-sm font-bold rounded-md ${equipmentFilter === 'jukebox' ? 'bg-lime-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Jukebox</button>
            <button onClick={() => setEquipmentFilter('grua')} className={`flex-1 sm:flex-initial px-4 py-2 text-sm font-bold rounded-md ${equipmentFilter === 'grua' ? 'bg-lime-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Gruas</button>
        </div>
      </div>

      {sortedCities.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Navegar por Cidade</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {sortedCities.map((city, index) => (
                  <button
                      key={city}
                      onClick={() => handleCityCardClick(city)}
                      className={`${
                        index % 2 === 0 
                          ? 'bg-gradient-to-br from-blue-800 to-blue-950' 
                          : 'bg-gradient-to-br from-indigo-800 to-indigo-950'
                      } text-white p-4 rounded-lg shadow-lg hover:shadow-sky-500/40 text-left hover:scale-105 transition-all duration-200`}
                  >
                      <div className="flex items-center gap-3 mb-2">
                          <LocationMarkerIcon className={`w-5 h-5 ${
                            index % 2 === 0 ? 'text-blue-200' : 'text-indigo-200'
                          } flex-shrink-0`} />
                          <h3 className="font-bold truncate">{city}</h3>
                      </div>
                      <p className="text-sm text-white/80 mb-2">{customersByCity[city].length} cliente(s)</p>
                      <div className="flex justify-between items-center text-xs font-semibold border-t border-white/30 pt-2">
                          <div className="flex items-center gap-1.5 text-white">
                              <GreenBilliardBallIcon className="w-3 h-3"/>
                              <span>{cityStats[city]?.visited || 0} Visitados</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-white">
                              <RedBilliardBallIcon className="w-3 h-3"/>
                              <span>{cityStats[city]?.notVisited || 0} Pendentes</span>
                          </div>
                      </div>
                  </button>
              ))}
          </div>
        </div>
      )}
      
      <div className="space-y-8">
        {sortedCities.length > 0 ? sortedCities.map(city => (
            <section 
                key={city}
                ref={(el) => { citySectionRefs.current[city] = el; }}
            >
                <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-4 border-b-2 border-slate-200 dark:border-slate-700 pb-2 capitalize">{city}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {customersByCity[city].map(customer => {
                        const hasActiveWarning = warnings.some(w => w.customerId === customer.id && !w.isResolved);
                        return (
                            <CustomerCard
                                key={customer.id}
                                customer={customer}
                                onBill={onBillCustomer}
                                onEdit={onEditCustomer}
                                onDelete={onDeleteCustomer}
                                onPayDebt={onPayDebtCustomer}
                                onHistory={onHistoryCustomer}
                                onShare={onShareCustomer}
                                hasActiveWarning={hasActiveWarning}
                                showNotification={showNotification}
                                onFocusCustomer={onFocusCustomer}
                            />
                        );
                    })}
                </div>
            </section>
        )) : (
            <p className="text-center py-10 text-slate-500 dark:text-slate-400">
                Nenhum cliente encontrado para os filtros selecionados.
            </p>
        )}
      </div>
      
      {isScannerOpen && (
        <QrScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          showNotification={showNotification}
        />
      )}

      {viewingCity && (
        <CityCustomersModal
            city={viewingCity}
            customers={customersByCity[viewingCity] || []}
            warnings={warnings}
            onClose={() => setViewingCity(null)}
            onBillCustomer={onBillCustomer}
            onEditCustomer={onEditCustomer}
            onDeleteCustomer={onDeleteCustomer}
            onPayDebtCustomer={onPayDebtCustomer}
            onHistoryCustomer={onHistoryCustomer}
            onShareCustomer={onShareCustomer}
            showNotification={showNotification}
            onFocusCustomer={onFocusCustomer}
        />
      )}
    </>
  );
};

export default ClientesView;