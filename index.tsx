// Register Service Worker for offline capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Service Worker registered with scope: ', registration.scope);
    }).catch(error => {
      console.log('Service Worker registration failed: ', error);
    });
  });
}

// Listen for the PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Dispatch a custom event to notify the app that the prompt is available
  const installPromptEvent = new CustomEvent('pwa-install-prompt', { detail: e });
  window.dispatchEvent(installPromptEvent);
  console.log('`beforeinstallprompt` event fired and dispatched.');
});


import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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