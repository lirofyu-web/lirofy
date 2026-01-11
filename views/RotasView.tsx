// views/RotasView.tsx
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Customer } from '../types';
import PageHeader from '../components/PageHeader';
import MapComponent from '../components/MapComponent';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import { RulerIcon } from '../components/icons/RulerIcon';
import { LocationMarkerIcon } from '../components/icons/LocationMarkerIcon';
import { BilliardIcon } from '../components/icons/BilliardIcon';
import { JukeboxIcon } from '../components/icons/JukeboxIcon';
import { CraneIcon } from '../components/icons/CraneIcon';
import { ListBulletIcon } from '../components/icons/ListBulletIcon';


interface RotasViewProps {
  customers: Customer[];
}

type EquipmentFilter = 'all' | 'mesa' | 'jukebox' | 'grua';

const FilterCard: React.FC<{
    title: string;
    count: number;
    icon: React.ReactNode;
    onClick: () => void;
    isActive: boolean;
}> = ({ title, count, icon, onClick, isActive }) => {
    const baseClasses = "bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border-2 flex-1 text-left transition-all duration-200 min-w-[200px]";
    const activeClasses = "border-lime-500 bg-lime-50 dark:bg-lime-900/50 scale-105";
    const inactiveClasses = "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600";
    return (
        <button onClick={onClick} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${isActive ? 'bg-lime-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                    {icon}
                </div>
                <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-lg">{title}</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">{count} clientes</p>
                </div>
            </div>
        </button>
    );
};

const RotasView: React.FC<RotasViewProps> = ({ customers }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [distances, setDistances] = useState<Record<string, number | null>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [equipmentFilter, setEquipmentFilter] = useState<EquipmentFilter>('all');
  const customerRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const filteredCustomersForRoute = useMemo(() => {
    if (equipmentFilter === 'all') {
        return customers;
    }
    return customers.filter(c => c.equipment?.some(e => e.type === equipmentFilter));
  }, [customers, equipmentFilter]);

  const geocodedCustomers = useMemo(() => {
    return filteredCustomersForRoute.filter(c => c.latitude != null && c.longitude != null).sort((a, b) => a.name.localeCompare(b.name)) as (Customer & { latitude: number; longitude: number; })[];
  }, [filteredCustomersForRoute]);

  const customersByCity = useMemo(() => {
    return geocodedCustomers.reduce((acc, customer) => {
        const city = customer.cidade.trim() || 'Sem Cidade';
        if (!acc[city]) {
            acc[city] = [];
        }
        acc[city].push(customer);
        return acc;
    }, {} as Record<string, (Customer & { latitude: number; longitude: number; })[]>);
  }, [geocodedCustomers]);
  
  const equipmentCounts = useMemo(() => ({
    all: customers.length,
    mesa: customers.filter(c => c.equipment?.some(e => e.type === 'mesa')).length,
    jukebox: customers.filter(c => c.equipment?.some(e => e.type === 'jukebox')).length,
    grua: customers.filter(c => c.equipment?.some(e => e.type === 'grua')).length,
  }), [customers]);

  const sortedCities = useMemo(() => Object.keys(customersByCity).sort((a, b) => a.localeCompare(b)), [customersByCity]);

  useEffect(() => {
    if (selectedCustomerId && customerRefs.current[selectedCustomerId]) {
      customerRefs.current[selectedCustomerId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedCustomerId]);

  const handleMarkerClick = useCallback((customerId: string) => {
    setSelectedCustomerId(customerId);
  }, []);
  
  const handleCustomerSelect = useCallback((customerId: string) => {
    setSelectedCustomerId(customerId);
    // On mobile, scroll up to the map when a customer is selected from the list.
    if (window.innerWidth < 768) { // Corresponds to Tailwind's 'md' breakpoint
      mapContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);
  
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleCalculateDistances = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocalização não é suportada.");
      return;
    }
    setIsCalculating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newDistances: Record<string, number | null> = {};
        customers.forEach(customer => {
          if (customer.latitude && customer.longitude) {
            newDistances[customer.id] = calculateDistance(latitude, longitude, customer.latitude, customer.longitude);
          } else {
            newDistances[customer.id] = null;
          }
        });
        setDistances(newDistances);
        setIsCalculating(false);
      },
      (error) => {
        alert("Não foi possível obter a localização.");
        console.error(error);
        setIsCalculating(false);
      }
    );
  }, [customers]);
  
  const handlePrintRoute = useCallback(() => {
    const customersToPrint = filteredCustomersForRoute;
    const customersByCity = customersToPrint
      .sort((a, b) => a.cidade.localeCompare(b.cidade) || a.name.localeCompare(b.name))
      .reduce((acc, customer) => {
          const city = customer.cidade.trim() || 'Sem Cidade';
          if (!acc[city]) acc[city] = [];
          acc[city].push(customer);
          return acc;
      }, {} as Record<string, Customer[]>);

    const sortedCities = Object.keys(customersByCity).sort((a, b) => a.localeCompare(b));

    const allItems: ({ type: 'city', name: string } | { type: 'customer', data: Customer })[] = [];
    sortedCities.forEach(city => {
        allItems.push({ type: 'city', name: city });
        customersByCity[city].forEach(customer => {
            allItems.push({ type: 'customer', data: customer });
        });
    });

    const itemsPerPage = 35; // Adjusted for smaller font size
    const pages: typeof allItems[] = [];
    for (let i = 0; i < allItems.length; i += itemsPerPage) {
        pages.push(allItems.slice(i, i + itemsPerPage));
    }
    
    let pagesHtml = '';
    pages.forEach((pageItems, pageIndex) => {
        let tableRows = '';
        pageItems.forEach(item => {
            if (item.type === 'city') {
                tableRows += `<tr><td colspan="6" class="city-header">${item.name}</td></tr>`;
            } else {
                const customer = item.data;
                const equipamentos = [];
                if (customer.equipment?.some(e => e.type === 'mesa')) equipamentos.push('Mesa');
                if (customer.equipment?.some(e => e.type === 'jukebox')) equipamentos.push('Jukebox');
                if (customer.equipment?.some(e => e.type === 'grua')) equipamentos.push('Grua');

                const lastVisitDate = customer.lastVisitedAt ? new Date(customer.lastVisitedAt).toLocaleDateString('pt-BR') : '---';
                const clockReadings = customer.equipment
                    .filter(e => e.type === 'mesa' || e.type === 'jukebox' || e.type === 'grua')
                    .map(e => {
                        const typePrefix = e.type === 'mesa' ? 'M' : e.type === 'jukebox' ? 'J' : 'G';
                        return `${typePrefix}${e.numero}: ${e.relogioAnterior}`;
                    })
                    .join(', ');
                
                tableRows += `
                    <tr>
                        <td class="checkbox-cell"><div class="checkbox"></div></td>
                        <td>${customer.name}</td>
                        <td>${equipamentos.join(', ')}</td>
                        <td class="date-cell">${lastVisitDate}</td>
                        <td class="clocks-cell">${clockReadings || 'N/A'}</td>
                        <td class="${customer.debtAmount > 0 ? 'fiado-cell' : 'no-fiado-cell'}">
                            ${customer.debtAmount > 0 ? `R$ ${customer.debtAmount.toFixed(2)}` : '-'}
                        </td>
                    </tr>
                `;
            }
        });

        pagesHtml += `
            <div class="page-container">
                <div class="header">
                    <h1>Rota de Cobrança</h1>
                    <p>Montanha Bilhar & Jukebox - ${new Date().toLocaleDateString('pt-BR')}</p>
                </div>
                <table class="customers-table">
                    <thead>
                        <tr>
                            <th class="checkbox-cell">Vis.</th>
                            <th>Cliente</th>
                            <th>Equip.</th>
                            <th class="date-cell">Últ. Visita</th>
                            <th class="clocks-cell">Relógios</th>
                            <th>Dívida</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <div class="footer">Página ${pageIndex + 1} de ${pages.length}</div>
            </div>
        `;
    });
    
    const fullHtml = `
      <html><head><title>Rota de Cobrança</title><style>
        body { font-family: Arial, sans-serif; font-size: 8pt; color: #333; }
        @page { size: A4; margin: 10mm; }
        .page-container { position: relative; min-height: 277mm; page-break-after: always; }
        .page-container:last-child { page-break-after: auto; }
        .header { text-align: center; } .header h1 { font-size: 14pt; margin-bottom: 2mm; } .header p { font-size: 9pt; margin: 0; color: #555; }
        .customers-table { width: 100%; border-collapse: collapse; font-size: 8pt; margin-top: 6mm; }
        .customers-table th, .customers-table td { border: 1px solid #ccc; padding: 1.5mm; text-align: left; vertical-align: middle; word-break: break-word; }
        .customers-table th { background-color: #f2f2f2; font-weight: bold; }
        .city-header { background-color: #e0e0e0; font-weight: bold; font-size: 10pt; padding: 2mm; }
        .checkbox-cell { width: 15px; text-align: center; } .checkbox { width: 10px; height: 10px; border: 1px solid #333; }
        .fiado-cell { width: 60px; text-align: right; color: #D32F2F; font-weight: bold; font-family: monospace; }
        .no-fiado-cell { width: 60px; text-align: right; font-family: monospace; }
        .date-cell { width: 55px; }
        .clocks-cell { min-width: 100px; }
        .footer { position: absolute; bottom: 0; width: 100%; text-align: center; font-size: 8pt; color: #888; }
      </style></head><body>${pagesHtml}</body></html>`;
      
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
        printWindow.document.write(fullHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }
  }, [filteredCustomersForRoute]);

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Rotas e Mapa de Clientes"
        subtitle="Visualize a localização dos seus clientes e planeje suas rotas."
      />

       {/* Filter Cards */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FilterCard 
              title="Todas as Rotas"
              count={equipmentCounts.all}
              icon={<ListBulletIcon className="w-6 h-6" />}
              onClick={() => setEquipmentFilter('all')}
              isActive={equipmentFilter === 'all'}
          />
          <FilterCard 
              title="Rotas (Mesas)"
              count={equipmentCounts.mesa}
              icon={<BilliardIcon className="w-6 h-6" />}
              onClick={() => setEquipmentFilter('mesa')}
              isActive={equipmentFilter === 'mesa'}
          />
          <FilterCard 
              title="Rotas (Jukebox)"
              count={equipmentCounts.jukebox}
              icon={<JukeboxIcon className="w-6 h-6" />}
              onClick={() => setEquipmentFilter('jukebox')}
              isActive={equipmentFilter === 'jukebox'}
          />
          <FilterCard 
              title="Rotas (Gruas)"
              count={equipmentCounts.grua}
              icon={<CraneIcon className="w-6 h-6" />}
              onClick={() => setEquipmentFilter('grua')}
              isActive={equipmentFilter === 'grua'}
          />
      </div>


      <div className="flex flex-col md:flex-row gap-8 flex-grow min-h-0">
        
        {/* Map Panel */}
        <div ref={mapContainerRef} className="h-[50vh] md:h-full w-full md:w-2/3 lg:w-3/4">
          <MapComponent
            customers={geocodedCustomers}
            selectedCustomerId={selectedCustomerId}
            onMarkerClick={handleMarkerClick}
          />
        </div>

        {/* Customer List Panel */}
        <div className="flex-grow min-h-0 w-full md:w-1/3 lg:w-1/4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Clientes ({geocodedCustomers.length})</h3>
            <div className="flex gap-2">
               <button onClick={handleCalculateDistances} title="Calcular Distâncias" disabled={isCalculating} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:text-slate-400 dark:disabled:text-slate-600">
                 <RulerIcon className="w-5 h-5"/>
               </button>
               <button onClick={handlePrintRoute} title="Imprimir Rota" className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                 <PrinterIcon className="w-5 h-5"/>
               </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-grow p-2 space-y-4">
            {sortedCities.length > 0 ? sortedCities.map(city => (
              <div key={city} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <h4 className="text-md font-semibold text-lime-600 dark:text-lime-400 p-3 border-b border-slate-200 dark:border-slate-700 capitalize flex items-center gap-2">
                    <LocationMarkerIcon className="w-5 h-5" />
                    {city}
                </h4>
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                    {customersByCity[city].map(customer => {
                      const twentyFiveDaysInMs = 25 * 24 * 60 * 60 * 1000;
                      const visitIsPending = !customer.lastVisitedAt || (new Date().getTime() - new Date(customer.lastVisitedAt).getTime()) > twentyFiveDaysInMs;
                      const hasDebt = customer.debtAmount > 0;

                      return (
                        <li key={customer.id} ref={el => { customerRefs.current[customer.id] = el; }}>
                            <button
                              onClick={() => handleCustomerSelect(customer.id)}
                              className={`w-full text-left p-3 transition-colors ${
                                selectedCustomerId === customer.id ? 'bg-lime-600/10 dark:bg-lime-600/20' : 'hover:bg-slate-100 dark:hover:bg-slate-700/50'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className="flex-shrink-0 flex items-center gap-1.5">
                                    {visitIsPending ? (
                                        <span title="Visita Pendente" className="block w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                                    ) : (
                                        <span title={`Visitado em ${new Date(customer.lastVisitedAt!).toLocaleDateString('pt-BR')}`} className="block w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                                    )}
                                    {hasDebt && (
                                        <span title={`Dívida: R$ ${customer.debtAmount.toFixed(2)}`} className="block w-2.5 h-2.5 bg-amber-400 rounded-full"></span>
                                    )}
                                </div>
                                <p className={`font-semibold truncate ${selectedCustomerId === customer.id ? 'text-lime-600 dark:text-lime-400' : 'text-slate-900 dark:text-white'}`}>{customer.name}</p>
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{customer.endereco}</p>
                              {distances[customer.id] != null && <p className="text-xs text-sky-500 dark:text-sky-400 mt-1">Aprox. {distances[customer.id]?.toFixed(1)} km</p>}
                            </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            )) : (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                Nenhum cliente com endereço geocodificado encontrado para o filtro selecionado.
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default RotasView;