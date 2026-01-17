// sw.js
const CACHE_NAME = 'montanha-bilhar-cache-v59'; // Versão incrementada para forçar atualização

// Lista de ativos para armazenar em cache.
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  '/sw.js',
  '/types.ts',
  '/App.tsx',
  '/utils.ts',
  '/utils/theme.ts',
  '/utils/receiptGenerator.ts',
  '/utils/imageGenerator.ts',
  '/utils/pdfGenerator.ts',
  '/utils/sunmiPrinter.ts',
  '/icon-192.svg',
  '/icon-512.svg',
  '/views/ClientesView.tsx',
  '/views/CobrancasView.tsx',
  '/views/ConfiguracoesView.tsx',
  '/views/DashboardView.tsx',
  '/views/DespesasView.tsx',
  '/views/EquipamentosView.tsx',
  '/views/RelatoriosView.tsx',
  '/views/RotasView.tsx',
  '/components/ActionModal.tsx',
  '/components/AddCustomerForm.tsx',
  '/components/BackupReminder.tsx',
  '/components/BillingModal.tsx',
  '/components/BillingSlipSheet.tsx',
  '/components/BottomNavBar.tsx',
  '/components/CityAutocomplete.tsx',
  '/components/CityCustomersModal.tsx',
  '/components/CraneReportModal.tsx',
  '/components/CustomerCard.tsx',
  '/components/CustomerForm.tsx',
  '/components/CustomerSelectionForSlipsModal.tsx',
  '/components/CustomerSheet.tsx',
  '/components/DebtPaymentModal.tsx',
  '/components/DebtReceiptActionsModal.tsx',
  '/components/DebtReceiptModal.tsx',
  '/components/DebtReceiptSheet.tsx',
  '/components/DebtReminders.tsx',
  '/components/EditBillingModal.tsx',
  '/components/EditCustomerModal.tsx',
  '/components/EquipmentLabel.tsx',
  '/components/EquipmentQrCodeModal.tsx',
  '/components/EquipmentSelectionModal.tsx',
  '/components/FullScreenCustomerView.tsx',
  '/components/HistoryModal.tsx',
  '/components/InstallPwaBanner.tsx',
  '/components/LabelGenerationModal.tsx',
  '/components/MapComponent.tsx',
  '/components/MobileHeader.tsx',
  '/components/Notification.tsx',
  '/components/PageHeader.tsx',
  '/components/PixQrCode.tsx',
  '/components/PrintableReceiptModal.tsx',
  '/components/PrintableSlipsModal.tsx',
  '/components/QrScannerModal.tsx',
  '/components/ReceiptActionsModal.tsx',
  '/components/ReceiptModal.tsx',
  '/components/ReceiptSheet.tsx',
  '/components/ShareCustomerModal.tsx',
  '/components/Sidebar.tsx',
  '/components/SignatureModal.tsx',
  '/components/SignaturePad.tsx',
  '/components/WarningsManager.tsx',
  '/components/WarningsReminders.tsx',
  '/components/icons/AlertIcon.tsx',
  '/components/icons/AndroidIcon.tsx',
  '/components/icons/BellAlertIcon.tsx',
  '/components/icons/BilliardIcon.tsx',
  '/components/icons/BluetoothIcon.tsx',
  '/components/icons/CalculatorIcon.tsx',
  '/components/icons/CameraIcon.tsx',
  '/components/icons/ChartBarIcon.tsx',
  '/components/icons/CheckCircleIcon.tsx',
  '/components/icons/ChevronDownIcon.tsx',
  '/components/icons/CloudUploadIcon.tsx',
  '/components/icons/CogIcon.tsx',
  '/components/icons/CraneIcon.tsx',
  '/components/icons/CreditCardIcon.tsx',
  '/components/icons/CurrencyDollarIcon.tsx',
  '/components/icons/DocumentDuplicateIcon.tsx',
  '/components/icons/ExclamationTriangleIcon.tsx',
  '/components/icons/GreenBilliardBallIcon.tsx',
  '/components/icons/HistoryIcon.tsx',
  '/components/icons/HomeIcon.tsx',
  '/components/icons/ImageIcon.tsx',
  '/components/icons/InstallIcon.tsx',
  '/components/icons/JukeboxIcon.tsx',
  '/components/icons/ListBulletIcon.tsx',
  '/components/icons/LocationArrowIcon.tsx',
  '/components/icons/LocationMarkerIcon.tsx',
  '/components/icons/LogoIcon.tsx',
  '/components/icons/MapIcon.tsx',
  '/components/icons/MenuIcon.tsx',
  '/components/icons/MoonIcon.tsx',
  '/components/icons/NotVisitedIcon.tsx',
  '/components/icons/PencilIcon.tsx',
  '/components/icons/PhoneIcon.tsx',
  '/components/icons/PlusIcon.tsx',
  '/components/icons/PrinterIcon.tsx',
  '/components/icons/PurpleBilliardBallIcon.tsx',
  '/components/icons/QrCodeIcon.tsx',
  '/components/icons/RawBtIcon.tsx',
  '/components/icons/ReceiptIcon.tsx',
  '/components/icons/RedBilliardBallIcon.tsx',
  '/components/icons/RulerIcon.tsx',
  '/components/icons/SaveIcon.tsx',
  '/components/icons/SearchIcon.tsx',
  '/components/icons/ShareIcon.tsx',
  '/components/icons/SunIcon.tsx',
  '/components/icons/SunmiIcon.tsx',
  '/components/icons/TrashIcon.tsx',
  '/components/icons/UserIcon.tsx',
  '/components/icons/UsersIcon.tsx',
  '/components/icons/VisitedIcon.tsx',
  '/components/icons/WhatsAppIcon.tsx',
  '/components/icons/XIcon.tsx',
  '/components/icons/YellowBilliardBallIcon.tsx',
  '/data/brazilianCities.ts',
  '/data/seedHelper.ts',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap',
  'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2',
  'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7S0Q5nw.woff2',
  'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7f0Q5nw.woff2',
  'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7a0Q5nw.woff2',
  'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7k0Q5nw.woff2',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css',
  'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css',
  'https://aistudiocdn.com/react@19.2.0',
  'https://aistudiocdn.com/react-dom@19.2.0/client',
  'https://aistudiocdn.com/react-dom@19.2.0/server',
  'https://aistudiocdn.com/react@19.2.0/jsx-runtime',
  'https://aistudiocdn.com/uuid@13.0.0',
  'https://aistudiocdn.com/qrcode@1.5.3',
  'https://aistudiocdn.com/html5-qrcode@2.3.8',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
];

self.addEventListener('install', (event) => {
  // Força o novo service worker a se tornar ativo imediatamente.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto, cacheando ativos principais...');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Falha ao armazenar ativos no cache durante a instalação:', error);
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
          if (networkResponse.ok) {
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