const CACHE_NAME = 'montanha-bilhar-cache-v1';

const urlsToCacheSameOrigin = [
    '/',
    '/index.html',
    '/manifest.json',
    '/index.tsx', // This is the main script entrypoint in this environment
    'icon-192.png',
    'icon-512.png'
];
const urlsToCacheCrossOrigin = [
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css',
    'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js',
    'https://aistudiocdn.com/react@^19.2.0',
    'https://aistudiocdn.com/react-dom@^19.2.0/client',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache for installation');

            const sameOriginPromise = cache.addAll(urlsToCacheSameOrigin).catch(err => {
                console.warn('Failed to cache one or more same-origin resources:', err);
            });

            const crossOriginPromises = urlsToCacheCrossOrigin.map(url => {
                const request = new Request(url, { mode: 'no-cors' });
                return fetch(request)
                    .then(response => cache.put(url, response))
                    .catch(err => console.warn(`Failed to fetch and cache cross-origin ${url}:`, err));
            });

            return Promise.all([sameOriginPromise, ...crossOriginPromises]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET' || event.request.url.startsWith('https://nominatim.openstreetmap.org')) {
        return;
    }
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    // Check for valid response to cache
                    if (fetchResponse && (fetchResponse.status === 200 || fetchResponse.type === 'opaque')) {
                         cache.put(event.request, fetchResponse.clone());
                    }
                    return fetchResponse;
                });
            });
        })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
