import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import App from './App';
import gradeService from './services/gradeService';
import { registerSW } from 'virtual:pwa-register';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
        <App />
    </Router>
  </React.StrictMode>
);

const updateSW = registerSW({
  onNeedRefresh() { if (confirm('New content available. Reload?')) updateSW(true); },
  onOfflineReady() { console.log('Freedom SMS ready offline 🚀'); }
});