// utils/routeOptimizer.ts
import { Customer } from '../types';

type GeocodedCustomer = Customer & { latitude: number; longitude: number; };

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const optimizeRoute = (startLat: number, startLon: number, customersToVisit: GeocodedCustomer[]): GeocodedCustomer[] => {
    let currentLocation = { lat: startLat, lon: startLon };
    let remainingCustomers = [...customersToVisit];
    const orderedRoute: GeocodedCustomer[] = [];

    while (remainingCustomers.length > 0) {
        let closestCustomer: GeocodedCustomer | null = null;
        let minDistance = Infinity;
        let closestIndex = -1;

        remainingCustomers.forEach((customer, index) => {
            const distance = calculateDistance(currentLocation.lat, currentLocation.lon, customer.latitude, customer.longitude);
            if (distance < minDistance) {
                minDistance = distance;
                closestCustomer = customer;
                closestIndex = index;
            }
        });

        if (closestCustomer) {
            orderedRoute.push(closestCustomer);
            currentLocation = { lat: closestCustomer.latitude, lon: closestCustomer.longitude };
            remainingCustomers.splice(closestIndex, 1);
        } else {
            break; // Should not happen if there are remaining customers
        }
    }

    return orderedRoute;
};
