// views/ClientesView.tsx
import React, { useMemo } from 'react';
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

const ClientesView: React.FC<ClientesViewProps> = ({ 
  customers, 
  onAddCustomer, 
  onSettleBill,
  onDeleteCustomer,
  onPayDebt,
  onUpdateCustomer,
  isSaving
}) => {
  const customersByCity = useMemo(() => {
    return customers.reduce((acc, customer) => {
        const city = customer.cidade.trim() || 'Sem Cidade';
        if (!acc[city]) {
            acc[city] = [];
        }
        acc[city].push(customer);
        return acc;
    }, {} as Record<string, Customer[]>);
  }, [customers]);

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