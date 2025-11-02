// views/ClientesView.tsx
import React, { useMemo, useState } from 'react';
import { Customer } from '../types';
import AddCustomerForm from '../components/AddCustomerForm';
import CustomerCard from '../components/CustomerCard';
import PageHeader from '../components/PageHeader';
import { LocationMarkerIcon } from '../components/icons/LocationMarkerIcon';

interface ClientesViewProps {
  customers: Customer[];
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

type SortOption = 'name' | 'visit' | 'debt';

const ClientesView: React.FC<ClientesViewProps> = ({ 
  customers, 
  onAddCustomer, 
  onSettleBill,
  onDeleteCustomer,
  onPayDebt,
  onUpdateCustomer,
  isSaving
}) => {
  const [sortOption, setSortOption] = useState<SortOption>('name');

  const sortedCustomers = useMemo(() => {
    const twentyFiveDaysInMs = 25 * 24 * 60 * 60 * 1000;
    const isVisitedRecently = (customer: Customer) => 
      customer.lastVisitedAt && (new Date().getTime() - new Date(customer.lastVisitedAt).getTime()) <= twentyFiveDaysInMs;

    return [...customers].sort((a, b) => {
      switch (sortOption) {
        case 'visit':
          // Not visited (false) should come before visited (true)
          return (isVisitedRecently(a) ? 1 : 0) - (isVisitedRecently(b) ? 1 : 0);
        case 'debt':
          return b.debtAmount - a.debtAmount;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [customers, sortOption]);

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
            <div className="flex justify-end mb-6">
              <div className="flex items-center gap-2">
                <label htmlFor="sort-customers" className="text-sm font-medium text-slate-300">Ordenar por:</label>
                <select 
                  id="sort-customers"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="name">Nome (A-Z)</option>
                  <option value="visit">Visita Pendente</option>
                  <option value="debt">Maior Dívida</option>
                </select>
              </div>
            </div>
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