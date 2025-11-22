const CACHE_NAME = 'montanha-bilhar-cache-v4';

const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/index.tsx',
    'icon-192.png',
    'icon-512.png'
];

const externalAssets = [
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css',
    'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js',
    'https://aistudiocdn.com/react@^19.2.0',
    'https://aistudiocdn.com/react-dom@^19.2.0/client',
    'https://aistudiocdn.com/react-dom@^19.2.0/',
    'https://aistudiocdn.com/react@^19.2.0/',
    'https://aistudiocdn.com/uuid@^13.0.0'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('Opened cache');
            
            // Cache local assets (failure tolerant for icons)
            for (const url of urlsToCache) {
                try {
                    await cache.add(url);
                } catch (error) {
                    console.warn(`Failed to cache local asset: ${url}`, error);
                }
            }

            // Cache external assets (CDN) - Aggressive caching
            const externalPromises = externalAssets.map(async (url) => {
                try {
                    const request = new Request(url, { mode: 'cors' });
                    const response = await fetch(request);
                    if (response.ok || response.type === 'opaque') {
                        await cache.put(url, response);
                    }
                } catch (err) {
                    // Fallback for opaque responses if CORS fails strictly
                    try {
                        const noCorsRequest = new Request(url, { mode: 'no-cors' });
                        const response = await fetch(noCorsRequest);
                        await cache.put(url, response);
                    } catch (e) {
                        console.warn(`Failed to cache external asset: ${url}`, e);
                    }
                }
            });
            
            await Promise.all(externalPromises);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Ignore non-GET requests
    if (event.request.method !== 'GET') return;

    const requestUrl = new URL(event.request.url);

    // 1. Map Tiles Strategy: Cache First, Network Fallback, Offline Placeholder
    if (requestUrl.hostname.includes('openstreetmap.org')) {
        event.respondWith(
             caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).catch(() => {
                    // Return a 200 OK empty response to prevent console errors when panning map offline
                    return new Response('', { status: 200, statusText: 'Offline' });
                });
             })
        );
        return;
    }

    // 2. Navigation Strategy (HTML): Network First, Cache Fallback (App Shell)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match('/index.html');
                })
        );
        return;
    }

    // 3. Stale-While-Revalidate for everything else (JS, CSS, Fonts, Images)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch((err) => {
                // Network failure is expected offline, just consume the error
                // if we have a cached response, we are good.
            });

            return cachedResponse || fetchPromise;
        })
    );
});