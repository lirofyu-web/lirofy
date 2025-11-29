const CACHE_NAME = 'montanha-bilhar-cache-v14'; // Incremented version

// Only cache the essential app shell files during installation.
// All other assets will be cached on-demand by the fetch handler.
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    'icon-192.png',
    'icon-512.png'
];

// Install: Caches the core app shell. This step is now much faster and more reliable.
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Activate worker immediately
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache, caching app shell...');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('App shell caching failed:', err);
                // If this fails, the app cannot work offline at all.
                // It's a critical error, but we let the SW install anyway to allow debugging.
            })
    );
});

// Activate: Cleans up old caches.
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
    return self.clients.claim(); // Take control of all clients
});

// Fetch: Implements a "Stale-While-Revalidate" strategy.
// This serves cached content immediately for speed, then updates the cache from the network.
self.addEventListener('fetch', (event) => {
    // We only want to cache GET requests.
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                // Fetch from the network in the background to update the cache.
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    // Check for a valid response to cache.
                    // Opaque responses (type: 'opaque') are for no-cors requests, which are fine to cache.
                    if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(err => {
                    // Network fetch failed, which is okay if we have a cached response.
                    // console.warn('Network request failed:', event.request.url);
                });

                // Return the cached response immediately if available, otherwise wait for the network response.
                return cachedResponse || fetchPromise;
            });
        })
    );
});
