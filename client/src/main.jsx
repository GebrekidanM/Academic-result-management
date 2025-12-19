import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
        <App />
    </Router>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('✅ ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((err) => {
        console.log('❌ ServiceWorker registration failed: ', err);
      });
  });
}

const updateSW = registerSW({
  onNeedRefresh() { if (confirm('New content available. Reload?')) updateSW(true); },
  onOfflineReady() { console.log('Freedom SMS ready offline 🚀'); }
});