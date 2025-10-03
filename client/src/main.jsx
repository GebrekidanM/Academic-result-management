import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import './index.css';
import App from './App';
import gradeService from './services/gradeService';
import { getOfflineGrades, deleteOfflineGrade } from './offlineDB';
import { registerSW } from 'virtual:pwa-register';

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

const updateSW = registerSW({
  onNeedRefresh() { if (confirm('New content available. Reload?')) updateSW(true); },
  onOfflineReady() { console.log('Freedom SMS ready offline 🚀'); }
});

// ✅ Sync offline grades when online
window.addEventListener('online', async () => {
  const offlineGrades = await getOfflineGrades();
  for (const grade of offlineGrades) {
    try {
      await gradeService.saveGradeSheet(grade);
      await deleteOfflineGrade(grade.id);
      console.log('Offline grade synced:', grade);
    } catch (err) {
      console.log('Failed to sync grade:', grade, err);
    }
  }
});
