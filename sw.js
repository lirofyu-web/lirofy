const CACHE_NAME = 'montanha-bilhar-cache-v12';

const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    'icon-192.png',
    'icon-512.png'
];

// External resources needed for the app to look correct offline
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
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('Opened cache v12');
            
            // 1. Cache local assets
            try {
                await cache.addAll(urlsToCache);
            } catch (error) {
                console.error('Failed to cache local assets:', error);
            }

            // 2. Cache external assets aggressively
            const externalPromises = externalAssets.map(async (url) => {
                try {
                    const request = new Request(url, { mode: 'cors' });
                    const response = await fetch(request);
                    if (response.ok) {
                        await cache.put(request, response);
                    }
                } catch (err) {
                    // Fallback for no-cors/opaque responses
                    try {
                        const noCorsRequest = new Request(url, { mode: 'no-cors' });
                        const response = await fetch(noCorsRequest);
                        await cache.put(noCorsRequest, response);
                    } catch (e) {
                        console.warn('Failed to cache external asset:', url);
                    }
                }
            });
            
            await Promise.all(externalPromises);
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
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Take control of all clients immediately
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    const requestUrl = new URL(event.request.url);

    // STRATEGY 1: Navigation (HTML) - CACHE FIRST
    // Critical for iOS offline support and ensuring app loads without network.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match('/index.html').then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).catch(() => {
                    return caches.match('/index.html');
                });
            })
        );
        return;
    }

    // STRATEGY 2: Map Tiles - Cache First, Offline Fallback
    if (requestUrl.hostname.includes('openstreetmap.org')) {
        event.respondWith(
             caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).catch(() => {
                    // Return empty 200 OK to prevent broken image icons on map
                    return new Response('', { status: 200, statusText: 'Offline' });
                });
             })
        );
        return;
    }

    // STRATEGY 3: App Assets (Scripts, Styles, CDN) - CACHE FIRST
    const isAsset = 
        urlsToCache.includes(requestUrl.pathname) ||
        externalAssets.some(url => requestUrl.href.includes(url)) ||
        requestUrl.hostname === 'cdn.tailwindcss.com' ||
        requestUrl.hostname === 'aistudiocdn.com' ||
        requestUrl.hostname === 'unpkg.com';

    if (isAsset) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                });
            })
        );
        return;
    }

    // STRATEGY 4: Default - Stale-While-Revalidate
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
            }).catch(() => {
                // Network failed, ignore
            });

            return cachedResponse || fetchPromise;
        })
    );
});