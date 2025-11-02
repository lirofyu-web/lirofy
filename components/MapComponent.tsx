import React, { useEffect, useRef, useMemo } from 'react';
import { Customer } from '../types';

interface MapComponentProps {
  customers: (Customer & { latitude: number; longitude: number; })[];
}

const MapComponent: React.FC<MapComponentProps> = ({ customers }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any | null>(null); // L.Map
  const markersLayer = useRef<any | null>(null); // L.FeatureGroup

  const L = (window as any).L;

  const { redIcon, greenIcon } = useMemo(() => {
    if (!L) return { redIcon: null, greenIcon: null };
    
    const baseIconOptions = {
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41] as [number, number],
      iconAnchor: [12, 41] as [number, number],
      popupAnchor: [1, -34] as [number, number],
      shadowSize: [41, 41] as [number, number]
    };

    const red = new L.Icon({
      ...baseIconOptions,
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    });
    
    const green = new L.Icon({
      ...baseIconOptions,
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    });

    return { redIcon: red, greenIcon: green };
  }, [L]);


  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !L) return;

    mapInstance.current = L.map(mapRef.current).setView([-14.235, -51.9253], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstance.current);

    markersLayer.current = L.featureGroup().addTo(mapInstance.current);

  }, [L]); // Run only once to initialize the map

  useEffect(() => {
    if (!markersLayer.current || !mapInstance.current || !redIcon || !greenIcon || !L) return;
    
    markersLayer.current.clearLayers();

    if (customers.length > 0) {
        customers.forEach(customer => {
            const twentyFiveDaysInMs = 25 * 24 * 60 * 60 * 1000;
            let markerIcon = redIcon;

            if (customer.lastVisitedAt) {
                const lastVisitedDate = new Date(customer.lastVisitedAt);
                const timeDiff = new Date().getTime() - lastVisitedDate.getTime();
                if (timeDiff <= twentyFiveDaysInMs) {
                    markerIcon = greenIcon;
                }
            }
            
            const marker = L.marker([customer.latitude, customer.longitude], { icon: markerIcon });
            
            const popupContent = `
                <div style="font-family: Inter, sans-serif;">
                    <h3 style="font-weight: 700; font-size: 1rem; margin-bottom: 4px;">${customer.name}</h3>
                    <p style="font-size: 0.875rem; margin: 0 0 8px 0;">${customer.endereco}, ${customer.cidade}</p>
                    <a 
                        href="https://www.google.com/maps/dir/?api=1&destination=${customer.latitude},${customer.longitude}" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style="font-weight: 600;"
                    >
                        Ver Rotas
                    </a>
                </div>
            `;

            marker.bindPopup(popupContent);
            markersLayer.current.addLayer(marker);
        });

        // Zoom and pan the map to fit all markers
        mapInstance.current.fitBounds(markersLayer.current.getBounds(), { padding: [50, 50] });
    } else {
        // Reset view to Brazil if no customers are shown
        mapInstance.current.setView([-14.235, -51.9253], 4);
    }
  }, [customers, L, redIcon, greenIcon]);

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 h-[70vh] flex flex-col">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
};

export default MapComponent;