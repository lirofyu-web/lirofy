// views/ClientesView.tsx
import React, { useMemo, useState } from 'react';
import { Customer, Billing, DebtPayment } from '../types';
import AddCustomerForm from '../components/AddCustomerForm';
import CustomerCard from '../components/CustomerCard';
import PageHeader from '../components/PageHeader';
import { LocationMarkerIcon } from '../components/icons/LocationMarkerIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { LocationArrowIcon } from '../components/icons/LocationArrowIcon';

interface ClientesViewProps {
  customers: Customer[];
  billings: Billing[];
  debtPayments: DebtPayment[];
  onAddCustomer: (customerData: Omit<Customer, 'id' | 'createdAt' | 'debtAmount' | 'latitude' | 'longitude' | 'lastVisitedAt'>) => Promise<void>;
  onSettleBill: (billingData: {
    customerId: string;
    equipment: 'mesa' | 'jukebox';
    relogioAtual: number;
    descontoPartidas: number;
    paymentMethod: 'pix' | 'dinheiro' | 'fiado';
  }) => void;
  onDeleteCustomer: (customerId: string) => void;
  onPayDebt: (customerId: string, amount: number, paymentMethod: 'pix' | 'dinheiro') => void;
  onUpdateCustomer: (customer: Customer) => Promise<void>;
  isSaving: boolean;
}

type SortOption = 'name' | 'visit' | 'debt' | 'distance';

// Haversine distance calculation
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};


const ClientesView: React.FC<ClientesViewProps> = ({ 
  customers, 
  billings,
  debtPayments,
  onAddCustomer, 
  onSettleBill,
  onDeleteCustomer,
  onPayDebt,
  onUpdateCustomer,
  isSaving
}) => {
  const [sortOption, setSortOption] = useState<SortOption>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      alert("Geolocalização não é suportada pelo seu navegador.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
        setSortOption('distance');
        setIsLocating(false);
      },
      (error) => {
        alert("Não foi possível obter sua localização. Verifique as permissões do seu navegador.");
        console.error("Geolocation error:", error);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) {
        return customers;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return customers.filter(customer =>
        customer.name.toLowerCase().includes(lowercasedQuery) ||
        customer.cidade.toLowerCase().includes(lowercasedQuery)
    );
  }, [customers, searchQuery]);

  const sortedCustomers = useMemo(() => {
    const twentyFiveDaysInMs = 25 * 24 * 60 * 60 * 1000;
    const isVisitedRecently = (customer: Customer) => 
      customer.lastVisitedAt && (new Date().getTime() - new Date(customer.lastVisitedAt).getTime()) <= twentyFiveDaysInMs;

    const customersWithDistance = filteredCustomers.map(customer => ({
      ...customer,
      distance: userLocation && customer.latitude && customer.longitude
        ? calculateDistance(userLocation.lat, userLocation.lon, customer.latitude, customer.longitude)
        : Infinity
    }));

    return customersWithDistance.sort((a, b) => {
      switch (sortOption) {
        case 'distance':
            return a.distance - b.distance;
        case 'visit':
          return (isVisitedRecently(a) ? 1 : 0) - (isVisitedRecently(b) ? 1 : 0);
        case 'debt':
          return b.debtAmount - a.debtAmount;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [filteredCustomers, sortOption, userLocation]);

  const customersByCity = useMemo(() => {
    return sortedCustomers.reduce((acc, customer) => {
        const city = customer.cidade.trim() || 'Sem Cidade';
        if (!acc[city]) {
            acc[city] = [];
        }
        acc[city].push(customer);
        return acc;
    }, {} as Record<string, Customer[]>);
  }, [sortedCustomers]);

  const sortedCities = useMemo(() => Object.keys(customersByCity).sort((a, b) => a.localeCompare(b)), [customersByCity]);

  return (
    <div>
      <PageHeader 
        title="Fichas Abertas"
        subtitle="Adicione novos clientes e realize cobranças."
      />
      <AddCustomerForm onAddCustomer={onAddCustomer} isSaving={isSaving} />

      <div className="mt-12">
        {customers.length > 0 ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="relative flex-grow w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Filtrar por nome ou cidade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
                 <button
                    onClick={handleFindNearby}
                    disabled={isLocating}
                    className="flex items-center gap-2 bg-sky-600 text-white font-bold py-2 px-3 rounded-md hover:bg-sky-500 transition-colors disabled:bg-slate-500 disabled:cursor-wait text-sm"
                  >
                    <LocationArrowIcon className="w-4 h-4" />
                    <span>{isLocating ? 'Buscando...' : 'Perto de Mim'}</span>
                  </button>
                <select 
                  id="sort-customers"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="name">Nome (A-Z)</option>
                  <option value="visit">Visita Pendente</option>
                  <option value="debt">Maior Dívida</option>
                  {userLocation && <option value="distance">Mais Próximos</option>}
                </select>
              </div>
            </div>
            
            {sortedCities.length > 0 ? (
                <div className="space-y-10">
                {sortedCities.map(city => (
                    <section key={city}>
                    <h2 className="text-2xl font-semibold text-emerald-400 mb-6 capitalize border-b border-slate-700 pb-2 flex items-center gap-3">
                        <LocationMarkerIcon className="w-6 h-6" />
                        <span>{city}</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {customersByCity[city].map(customer => (
                        <CustomerCard 
                            key={customer.id} 
                            customer={customer} 
                            billings={billings}
                            debtPayments={debtPayments}
                            onSettleBill={onSettleBill}
                            onDeleteCustomer={onDeleteCustomer}
                            onPayDebt={onPayDebt}
                            onUpdateCustomer={onUpdateCustomer}
                            isSaving={isSaving}
                        />
                        ))}
                    </div>
                    </section>
                ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-slate-800 rounded-lg border border-slate-700">
                    <h2 className="text-2xl font-semibold text-white mb-2">Nenhum Cliente Encontrado</h2>
                    <p className="text-slate-400">Tente ajustar seus termos de busca ou limpe o filtro.</p>
                </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-slate-800 rounded-lg border border-slate-700">
            <h2 className="text-2xl font-semibold text-white mb-2">Nenhum Cliente Ativo</h2>
            <p className="text-slate-400">Use o formulário acima para adicionar seu primeiro cliente.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientesView;