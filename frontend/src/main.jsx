import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

const el = document.getElementById('root');
createRoot(el).render(<App />);

// Register service worker for PWA/offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
  });
}
