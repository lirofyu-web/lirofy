const CACHE_NAME = 'montanha-bilhar-cache-v16'; // Incremented version to force update

// Generates a simple, branded SVG icon on the fly.
const generateIconSvg = (size, text) => {
    const svgContent = `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="15" fill="#0f172a"/>
        <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="sans-serif" font-size="50" fill="#10b981" font-weight="bold">
            ${text}
        </text>
    </svg>`;
    return new Response(svgContent, {
        headers: { 'Content-Type': 'image/svg+xml' }
    });
};

self.addEventListener('install', (event) => {
    // This event is required for the app to be installable.
    // We skip waiting to activate the new service worker immediately.
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
    // Take control of all clients as soon as the service worker activates.
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Always serve generated icons immediately. This is critical to pass PWA checks.
    if (url.pathname === '/icon-192.svg') {
        return event.respondWith(generateIconSvg(192, 'MB'));
    }
    if (url.pathname === '/icon-512.svg') {
        return event.respondWith(generateIconSvg(512, 'MB'));
    }

    // Use a Network-First strategy for all other GET requests.
    // This ensures users get the freshest content, while providing offline fallback.
    if (event.request.method === 'GET') {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    // Check if we received a valid response
                    if (networkResponse && networkResponse.ok) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Network request failed, probably offline, try to serve from cache.
                    return caches.match(event.request).then((cachedResponse) => {
                        return cachedResponse; // Will be undefined if not in cache.
                    });
                })
        );
    }
});
