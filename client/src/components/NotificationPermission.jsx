import React, { useState } from 'react';
import authService from '../services/authService';
import studentAuthService from '../services/studentAuthService';
import userService from '../services/userService';

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  if (!base64String) return new Uint8Array(0);
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const NotificationPermission = () => {
  // 1. Initialize state with current permission status
  const [permission, setPermission] = useState(Notification.permission);

  const subscribe = async () => {
    if (!('serviceWorker' in navigator)) return alert("No Service Worker support!");
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidKey) {
        alert("Missing VAPID Key!");
        return;
      }

      // 2. Ask Browser for Permission
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });

      // 3. Get Current User
      let user = authService.getCurrentUser();
      if (!user) user = studentAuthService.getCurrentStudent();

      if (!user || !user.token) return alert("Please login first.");

      // 4. Send to Backend
      await userService.addSubscribe(subscription, user.token);

      alert("✅ Notifications Enabled!");
      
      // 5. Update State to Hide Button
      setPermission('granted');

    } catch (err) {
      console.error("Subscription failed:", err);
      // Even if backend fails, if browser says granted, we usually hide button
      // But here we let them try again if it failed.
      if (Notification.permission === 'denied') {
        alert("You blocked notifications. Please enable them in your browser settings.");
        setPermission('denied');
      }
    }
  };

  // --- LOGIC: HIDE IF GRANTED ---
  if (permission === 'granted') {
    return null;
  }

  return (
    <button 
      onClick={subscribe}
      className="fixed bottom-4 left-4 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg z-50 hover:bg-purple-700 transition-all print:hidden flex items-center gap-2 animate-bounce-small"
    >
      <span>🔔</span> Enable Alerts
    </button>
  );
};

export default NotificationPermission;