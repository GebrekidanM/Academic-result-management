import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import './index.css';
import App from './App';

// ✅ Import PWA helper
import { registerSW } from 'virtual:pwa-register'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </Router>
  </React.StrictMode>
);

// ✅ Register Service Worker after render
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("New content is available. Reload now?")) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log("Freedom SMS is ready to work offline 🚀")
  },
})
