import React, { useEffect, useRef, useMemo } from 'react';
import { Customer } from '../types';
import ReactDOMServer from 'react-dom/server';
import { VisitedIcon } from './icons/VisitedIcon';
import { NotVisitedIcon } from './icons/NotVisitedIcon';


interface MapComponentProps {
  customers: (Customer & { latitude: number; longitude: number; })[];
  selectedCustomerId: string | null;
  onMarkerClick: (customerId: string) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ customers, selectedCustomerId, onMarkerClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any | null>(null); // L.Map
  const markersLayer = useRef<any | null>(null); // L.MarkerClusterGroup
  const markerRefs = useRef<Record<string, any>>({}); // Record<string, L.Marker>

  const L = (window as any).L;

  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !L) return;

    mapInstance.current = L.map(mapRef.current).setView([-14.235, -51.9253], 4);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(mapInstance.current);

    markersLayer.current = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 50
    });
    mapInstance.current.addLayer(markersLayer.current);
    markerRefs.current = {};

  }, [L]);

  useEffect(() => {
    if (!markersLayer.current || !mapInstance.current || !L) return;
    
    markersLayer.current.clearLayers();
    markerRefs.current = {};

    if (customers.length > 0) {
        customers.forEach(customer => {
            const twentyFiveDaysInMs = 25 * 24 * 60 * 60 * 1000;
            const isVisitedRecently = customer.lastVisitedAt && (new Date().getTime() - new Date(customer.lastVisitedAt).getTime()) <= twentyFiveDaysInMs;
            
            const iconComponent = isVisitedRecently 
              ? <VisitedIcon className="w-8 h-8" /> 
              : <NotVisitedIcon className="w-8 h-8" />;

            const customIcon = L.divIcon({
              html: ReactDOMServer.renderToString(iconComponent),
              className: 'custom-marker',
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32],
            });
            
            const marker = L.marker([customer.latitude, customer.longitude], { icon: customIcon });
            
            const popupContent = `
                <div style="font-family: Inter, sans-serif; min-width: 180px;">
                    <h3 style="font-weight: 700; font-size: 1rem; margin-bottom: 4px;">${customer.name}</h3>
                    <p style="font-size: 0.875rem; margin: 0 0 8px 0; color: #94a3b8;">${isVisitedRecently ? `Visitado em ${new Date(customer.lastVisitedAt!).toLocaleDateString('pt-BR')}` : 'Visita pendente'}</p>
                    ${customer.debtAmount > 0 ? `<p style="font-size: 0.875rem; margin: 0 0 8px 0; color: #f87171; font-weight: 600;">Dívida: R$ ${customer.debtAmount.toFixed(2)}</p>` : ''}
                    <a 
                        href="https://www.google.com/maps/dir/?api=1&destination=${customer.latitude},${customer.longitude}" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style="font-weight: 600;"
                    >
                        Ver Rotas &rarr;
                    </a>
                </div>
            `;

            marker.bindPopup(popupContent);
            marker.on('click', () => {
                onMarkerClick(customer.id);
            });
            
            markersLayer.current.addLayer(marker);
            markerRefs.current[customer.id] = marker;
        });

        if (!selectedCustomerId) {
            mapInstance.current.fitBounds(markersLayer.current.getBounds(), { padding: [50, 50] });
        }
    } else {
        mapInstance.current.setView([-14.235, -51.9253], 4);
    }
  }, [customers, L, onMarkerClick, selectedCustomerId]);


  // Effect to handle selection changes
  useEffect(() => {
    if (!mapInstance.current || !L) return;

    // Deselect all markers first
    // FIX: Explicitly type marker object as 'any' to resolve TypeScript errors with Leaflet methods,
    // and store the element in a variable to avoid calling getElement() twice.
    Object.values(markerRefs.current).forEach((m: any) => {
        const element = m.getElement();
        if (element) {
            element.classList.remove('selected-marker');
            m.setZIndexOffset(0);
        }
    });

    if (selectedCustomerId && markerRefs.current[selectedCustomerId]) {
        const selectedMarker: any = markerRefs.current[selectedCustomerId];
        
        const element = selectedMarker.getElement();
        if (element) {
            element.classList.add('selected-marker');
            selectedMarker.setZIndexOffset(1000);
        }

        markersLayer.current.zoomToShowLayer(selectedMarker, () => {
             mapInstance.current.panTo(selectedMarker.getLatLng());
             if (!selectedMarker.isPopupOpen()) {
                 selectedMarker.openPopup();
             }
        });
    }
  }, [selectedCustomerId, L]);

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 h-full w-full flex flex-col">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
};

export default MapComponent;
