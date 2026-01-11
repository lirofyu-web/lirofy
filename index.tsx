import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Registra o Service Worker para funcionalidade offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Construct an absolute URL to the service worker to be robust in sandboxed environments.
    const swUrl = `${window.location.origin}/sw.js`;
    navigator.serviceWorker.register(swUrl, { scope: '/' })
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