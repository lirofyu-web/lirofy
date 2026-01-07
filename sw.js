// sw.js
const CACHE_NAME = 'montanha-bilhar-cache-v46'; // Versão incrementada

// Uma lista abrangente de todos os ativos para armazenar em cache para funcionalidade offline.
const urlsToCache = [
  // Arquivos principais que definem a estrutura e o ponto de entrada do aplicativo.
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  '/sw.js',
  '/types.ts',
  '/App.tsx',

  // Ícones PWA referenciados no manifesto.
  '/icon-192.svg',
  '/icon-512.svg',
  
  // Todas as visualizações da aplicação.
  '/views/ClientesView.tsx',
  '/views/CobrancasView.tsx',
  '/views/ConfiguracoesView.tsx',
  '/views/DashboardView.tsx',
  '/views/DespesasView.tsx',
  '/views/RelatoriosView.tsx',
  '/views/RotasView.tsx',
  '/views/EquipamentosView.tsx',

  // Todos os componentes reutilizáveis.
  '/components/ActionModal.tsx',
  '/components/AddCustomerForm.tsx',
  '/components/BillingModal.tsx',
  '/components/BottomNavBar.tsx',
  '/components/CityAutocomplete.tsx',
  '/components/CraneReportModal.tsx',
  '/components/CustomerCard.tsx',
  '/components/CustomerQrCodeModal.tsx',
  '/components/QrScannerModal.tsx',
  '/components/DebtPaymentModal.tsx',
  '/components/DebtReceiptActionsModal.tsx',
  '/components/DebtReceiptModal.tsx',
  '/components/DebtReceiptSheet.tsx',
  '/components/DebtReminders.tsx',
  '/components/EditCustomerModal.tsx',
  '/components/EquipmentSelectionModal.tsx',
  '/components/HistoryModal.tsx',
  '/components/InstallPwaBanner.tsx',
  '/components/MapComponent.tsx',
  '/components/MobileHeader.tsx',
  '/components/Notification.tsx',
  '/components/PageHeader.tsx',
  '/components/ReceiptActionsModal.tsx',
  '/components/ReceiptModal.tsx',
  '/components/ReceiptSheet.tsx',
  '/components/Sidebar.tsx',
  '/components/WarningsManager.tsx',
  '/components/WarningsReminders.tsx',
  '/components/ShareCustomerModal.tsx',
  '/components/CustomerSheet.tsx',
  '/components/EquipmentQrCodeModal.tsx',
  '/components/EquipmentLabel.tsx',

  // Todos os ícones SVG usados nos componentes.
  '/components/icons/AlertIcon.tsx',
  '/components/icons/AndroidIcon.tsx',
  '/components/icons/BellAlertIcon.tsx',
  '/components/icons/BilliardIcon.tsx',
  '/components/icons/CalculatorIcon.tsx',
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
  '/components/icons/PlusIcon.tsx',
  '/components/icons/PrinterIcon.tsx',
  '/components/icons/PurpleBilliardBallIcon.tsx',
  '/components/icons/QrCodeIcon.tsx',
  '/components/icons/ReceiptIcon.tsx',
  '/components/icons/RedBilliardBallIcon.tsx',
  '/components/icons/RulerIcon.tsx',
  '/components/icons/SaveIcon.tsx',
  '/components/icons/SearchIcon.tsx',
  '/components/icons/ShareIcon.tsx',
  '/components/icons/SunIcon.tsx',
  '/components/icons/TrashIcon.tsx',
  '/components/icons/UsersIcon.tsx',
  '/components/icons/VisitedIcon.tsx',
  '/components/icons/WhatsAppIcon.tsx',
  '/components/icons/XIcon.tsx',
  '/components/icons/YellowBilliardBallIcon.tsx',
  
  // Arquivos de dados para autocompletar e popular.
  '/data/brazilianCities.ts',
  '/data/seedHelper.ts',

  // Recursos externos de CDN para bibliotecas e fontes.
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap',
  'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2', // Inter 400
  'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7S0Q5nw.woff2', // Inter 500
  'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7f0Q5nw.woff2', // Inter 600
  'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7a0Q5nw.woff2', // Inter 700
  'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7k0Q5nw.woff2', // Inter 900
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
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
];

// Evento de instalação: armazena todos os ativos especificados em cache.
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto e ativos sendo armazenados');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Falha ao armazenar ativos em cache durante a instalação:', error);
      })
  );
});

// Evento de ativação: limpa caches antigos.
self.addEventListener('activate', (event) => {
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

// Evento de busca: Estratégia "Cache falling back to network".
// Se um recurso está no cache, ele é servido a partir daí.
// Se não, é buscado na rede. Se a busca for bem-sucedida,
// a resposta é adicionada ao cache para futuras requisições offline.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Se a resposta estiver no cache, retorna-a.
        if (cachedResponse) {
          return cachedResponse;
        }

        // Se não, busca na rede.
        return fetch(event.request).then((networkResponse) => {
            // Clona a resposta porque ela é um stream que só pode ser consumido uma vez.
            const responseToCache = networkResponse.clone();

            // Abre o cache e adiciona a nova resposta a ele.
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            // Retorna a resposta da rede para o navegador.
            return networkResponse;
          }
        );
      })
  );
});