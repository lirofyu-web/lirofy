import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Registra o Service Worker para funcionalidade offline
if ('serviceWorker' in navigator) {
  // O registro é feito dentro do evento 'load' para garantir que a página
  // esteja totalmente carregada, evitando condições de corrida e o erro "invalid state".
  window.addEventListener('load', () => {
    // FIX: Constrói uma URL absoluta para o sw.js para evitar problemas de origem cruzada
    // em ambientes de desenvolvimento como o AI Studio.
    const swUrl = new URL('/sw.js', window.location.origin);
    navigator.serviceWorker.register(swUrl)
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.error('ServiceWorker registration failed: ', error);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);