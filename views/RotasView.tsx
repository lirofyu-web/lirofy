// views/RotasView.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Customer } from '../types';
import PageHeader from '../components/PageHeader';
import MapComponent from '../components/MapComponent';
import { ListBulletIcon } from '../components/icons/ListBulletIcon';
import { MapPinIcon } from '../components/icons/MapPinIcon';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import { RulerIcon } from '../components/icons/RulerIcon';

interface RotasViewProps {
  customers: Customer[];
}

const RotasView: React.FC<RotasViewProps> = ({ customers }) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isMobileMapView, setIsMobileMapView] = useState(true);
  const [distances, setDistances] = useState<Record<string, number | null>>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const customerRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const geocodedCustomers = useMemo(() => {
    return customers.filter(c => c.latitude != null && c.longitude != null) as (Customer & { latitude: number; longitude: number; })[];
  }, [customers]);

  useEffect(() => {
    if (selectedCustomerId && customerRefs.current[selectedCustomerId]) {
      customerRefs.current[selectedCustomerId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedCustomerId]);

  const handleMarkerClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (window.innerWidth < 768) { // On mobile, switch to list view
        setIsMobileMapView(false);
    }
  };
  
  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };
  
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleCalculateDistances = () => {
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
  };
  
  const handlePrintRoute = () => {
    const customersByCity = customers
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

    const itemsPerPage = 30;
    const pages: typeof allItems[] = [];
    for (let i = 0; i < allItems.length; i += itemsPerPage) {
        pages.push(allItems.slice(i, i + itemsPerPage));
    }
    
    let pagesHtml = '';
    pages.forEach((pageItems, pageIndex) => {
        let tableRows = '';
        pageItems.forEach(item => {
            if (item.type === 'city') {
                tableRows += `<tr><td colspan="4" class="city-header">${item.name}</td></tr>`;
            } else {
                const customer = item.data;
                const equipamentos = [];
                if (customer.mesaNumero) equipamentos.push('Mesa');
                if (customer.jukeboxNumero) equipamentos.push('Jukebox');
                
                tableRows += `
                    <tr>
                        <td class="checkbox-cell"><div class="checkbox"></div></td>
                        <td>${customer.name}</td>
                        <td>${equipamentos.join(', ')}</td>
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
                            <th>Equipamentos</th>
                            <th>Dívida (Fiado)</th>
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
        body { font-family: Arial, sans-serif; font-size: 10pt; color: #333; }
        @page { size: A4; margin: 15mm; }
        .page-container { position: relative; min-height: 257mm; page-break-after: always; }
        .page-container:last-child { page-break-after: auto; }
        .header { text-align: center; } .header h1 { font-size: 16pt; margin-bottom: 2mm; } .header p { font-size: 10pt; margin: 0; color: #555; }
        .customers-table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 8mm; }
        .customers-table th, .customers-table td { border: 1px solid #ccc; padding: 2mm; text-align: left; vertical-align: middle; }
        .customers-table th { background-color: #f2f2f2; font-weight: bold; }
        .city-header { background-color: #e0e0e0; font-weight: bold; font-size: 11pt; padding: 2mm; }
        .checkbox-cell { width: 20px; text-align: center; } .checkbox { width: 14px; height: 14px; border: 1px solid #333; }
        .fiado-cell { width: 80px; text-align: right; color: #D32F2F; font-weight: bold; font-family: monospace; }
        .no-fiado-cell { width: 80px; text-align: right; font-family: monospace; }
        .footer { position: absolute; bottom: 0; width: 100%; text-align: center; font-size: 8pt; color: #888; }
      </style></head><body>${pagesHtml}</body></html>`;
      
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
        printWindow.document.write(fullHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }
  };


  const customerListPanel = (
    <div className="w-full md:w-1/3 lg:w-1/4 bg-slate-800 rounded-lg shadow-lg border border-slate-700 flex flex-col h-full">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Clientes ({geocodedCustomers.length})</h3>
        <div className="flex gap-2">
           <button onClick={handleCalculateDistances} title="Calcular Distâncias" disabled={isCalculating} className="p-2 text-slate-400 hover:text-white disabled:text-slate-600">
             <RulerIcon className="w-5 h-5"/>
           </button>
           <button onClick={handlePrintRoute} title="Imprimir Rota" className="p-2 text-slate-400 hover:text-white">
             <PrinterIcon className="w-5 h-5"/>
           </button>
        </div>
      </div>
      <ul className="overflow-y-auto flex-grow p-2">
        {geocodedCustomers.length > 0 ? geocodedCustomers.map(customer => (
          // FIX: Corrected the ref callback to have a void return type.
          <li key={customer.id} ref={el => { customerRefs.current[customer.id] = el; }}>
            <button
              onClick={() => handleCustomerSelect(customer.id)}
              className={`w-full text-left p-3 rounded-md transition-colors ${
                selectedCustomerId === customer.id ? 'bg-emerald-600/20' : 'hover:bg-slate-700/50'
              }`}
            >
              <p className={`font-semibold ${selectedCustomerId === customer.id ? 'text-emerald-400' : 'text-white'}`}>{customer.name}</p>
              <p className="text-sm text-slate-400">{customer.cidade}</p>
              {distances[customer.id] && <p className="text-xs text-sky-400 mt-1">Aprox. {distances[customer.id]?.toFixed(1)} km</p>}
            </button>
          </li>
        )) : (
          <li className="p-4 text-center text-slate-400">
            Nenhum cliente com endereço geocodificado encontrado.
          </li>
        )}
      </ul>
    </div>
  );

  const mapPanel = (
    <div className="w-full md:w-2/3 lg:w-3/4 h-full">
      <MapComponent
        customers={geocodedCustomers}
        selectedCustomerId={selectedCustomerId}
        onMarkerClick={handleMarkerClick}
      />
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="Rotas e Mapa de Clientes"
        subtitle="Visualize a localização dos seus clientes e planeje suas rotas."
      />

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-row gap-8 flex-grow min-h-0">
        {customerListPanel}
        {mapPanel}
      </div>
      
      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col flex-grow min-h-0 relative">
        <div className={`flex-grow h-full ${isMobileMapView ? 'block' : 'hidden'}`}>{mapPanel}</div>
        <div className={`flex-grow h-full ${!isMobileMapView ? 'block' : 'hidden'}`}>{customerListPanel}</div>

        <button 
          onClick={() => setIsMobileMapView(!isMobileMapView)}
          className="absolute bottom-4 right-4 z-10 bg-slate-800 text-white p-4 rounded-full shadow-lg border-2 border-emerald-500"
        >
          {isMobileMapView ? <ListBulletIcon className="w-6 h-6"/> : <MapPinIcon className="w-6 h-6"/>}
        </button>
      </div>
    </div>
  );
};

export default RotasView;