// sw.js
const CACHE_NAME = 'montanha-bilhar-cache-v74'; // Versão incrementada para forçar atualização

// Apenas o "casco" do aplicativo é pré-cacheado. O restante é cacheado sob demanda pelo manipulador de fetch.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/firebase.ts',
  '/utils/offlineSync.ts',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  // Força o novo service worker a se tornar ativo imediatamente.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto, cacheando o casco principal do aplicativo...');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Falha ao armazenar o casco do aplicativo no cache durante a instalação:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  // Garante que o service worker ativado assuma o controle de todas as abas abertas imediatamente.
  event.waitUntil(self.clients.claim());
  
  // Limpa caches antigos para liberar espaço e evitar conflitos.
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Excluindo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições que não são GET (ex: POST, etc.)
  if (event.request.method !== 'GET') {
    return;
  }

  // Estratégia Stale-While-Revalidate: Responde rapidamente com o cache,
  // mas busca uma nova versão em segundo plano.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Se a requisição for bem-sucedida, atualiza o cache.
          if (networkResponse && networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });

        // Retorna a resposta do cache imediatamente se existir, caso contrário, aguarda a rede.
        return cachedResponse || fetchPromise;
      }).catch(() => {
        // Se tanto o cache quanto a rede falharem...
        // Para requisições de navegação (ex: abrir uma página), retorna o index.html principal (SPA fallback).
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        // Para outros tipos de requisições (imagens, scripts), permite que a falha ocorra.
      });
    })
  );
});