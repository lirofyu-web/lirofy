// Fix: Implement the RotasView component.
import React, { useState, useMemo } from 'react';
import { Customer } from '../types';
import PageHeader from '../components/PageHeader';
import MapComponent from '../components/MapComponent';
import { ListBulletIcon } from '../components/icons/ListBulletIcon';
import { MapPinIcon } from '../components/icons/MapPinIcon';
import { AlertIcon } from '../components/icons/AlertIcon';

interface RotasViewProps {
  customers: Customer[];
}

const RotasView: React.FC<RotasViewProps> = ({ customers }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  const customersWithLocation = useMemo(() => {
    return customers.filter(c => c.latitude != null && c.longitude != null) as (Customer & { latitude: number; longitude: number })[];
  }, [customers]);

  const sortedCustomers = useMemo(() => {
    const twentyFiveDaysInMs = 25 * 24 * 60 * 60 * 1000;
    
    return customersWithLocation
        .map(c => ({
            ...c,
            isPending: !c.lastVisitedAt || (new Date().getTime() - new Date(c.lastVisitedAt).getTime()) > twentyFiveDaysInMs
        }))
        .filter(c => !showOnlyPending || c.isPending)
        .sort((a, b) => {
            if (a.isPending && !b.isPending) return -1;
            if (!a.isPending && b.isPending) return 1;
            return (a.linhaNumero || '').localeCompare(b.linhaNumero || '') || a.name.localeCompare(b.name);
        });
  }, [customersWithLocation, showOnlyPending]);
  
  const handleMarkerClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const element = document.getElementById(`customer-item-${customerId}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleListItemClick = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
  };
  
  return (
    <div>
      <PageHeader
        title="Planejador de Rotas"
        subtitle="Visualize seus clientes no mapa e organize suas visitas."
      />
      
      <div className="flex h-[calc(100vh-12rem)] gap-6 flex-col lg:flex-row">
        {/* Customer List */}
        <div className="w-full lg:w-1/3 h-1/2 lg:h-full flex flex-col bg-slate-800 rounded-lg shadow-lg border border-slate-700">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><ListBulletIcon className="w-6 h-6" /><span>Lista de Clientes</span></h3>
             <label className="flex items-center space-x-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={showOnlyPending}
                    onChange={() => setShowOnlyPending(!showOnlyPending)}
                    className="form-checkbox h-4 w-4 text-emerald-600 bg-slate-700 border-slate-600 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-300">Apenas Pendentes</span>
            </label>
          </div>
          <ul className="overflow-y-auto flex-grow">
            {sortedCustomers.length > 0 ? sortedCustomers.map((customer, index) => (
              <li
                key={customer.id}
                id={`customer-item-${customer.id}`}
                onClick={() => handleListItemClick(customer)}
                className={`p-4 cursor-pointer transition-colors border-b border-slate-700/50 ${
                  selectedCustomerId === customer.id ? 'bg-emerald-900/50' : 'hover:bg-slate-700/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-white">{customer.name}</p>
                    <p className="text-sm text-slate-400">{customer.cidade}</p>
                     {customer.linhaNumero && <p className="text-xs text-sky-400 mt-1">Rota: {customer.linhaNumero}</p>}
                  </div>
                  {customer.isPending && (
                     <div title="Visita Pendente">
                        <AlertIcon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    </div>
                  )}
                </div>
              </li>
            )) : (
                 <li className="text-center p-10 text-slate-400">Nenhum cliente com localização para exibir.</li>
            )}
          </ul>
        </div>

        {/* Map */}
        <div className="w-full lg:w-2/3 h-1/2 lg:h-full">
          <MapComponent
            customers={sortedCustomers}
            selectedCustomerId={selectedCustomerId}
            onMarkerClick={handleMarkerClick}
          />
        </div>
      </div>
    </div>
  );
};

export default RotasView;
