import React from 'react';
import axios from 'axios';
import authService from '../services/authService';

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const NotificationPermission = () => {
  const subscribe = async () => {
    // 1. Check if Service Worker is ready
    if (!('serviceWorker' in navigator)) return alert("No Service Worker support!");
    
    const registration = await navigator.serviceWorker.ready;

    try {
      // 2. Ask Browser for Permission
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // Make sure this matches your Backend VAPID_PUBLIC_KEY exactly
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
      });

      console.log("Got Subscription:", subscription);

      // 3. Send Subscription to Backend
      // Note: We use the auth token to know WHO this subscription belongs to
      const user = authService.getCurrentUser();
      const token = user?.token;

      if (!token) return alert("Please login first.");

      await axios.post('/api/users/subscribe', subscription, {
          headers: { Authorization: `Bearer ${token}` }
      });

      alert("✅ Notifications Enabled!");

    } catch (err) {
      console.error("Subscription failed:", err);
      alert("Failed to subscribe. Check console.");
    }
  };

  return (
    <button 
      onClick={subscribe}
      className="fixed bottom-4 left-4 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg z-50 hover:bg-purple-700 transition-all print:hidden"
    >
      🔔 Enable Alerts
    </button>
  );
};

export default NotificationPermission;