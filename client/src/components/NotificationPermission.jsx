import React from 'react';
import authService from '../services/authService';
import studentAuthService from '../services/studentAuthService';
import userService from '../services/userService'; // <--- 1. ADD THIS IMPORT

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
  const subscribe = async () => {
    // 1. Check Service Worker
    if (!('serviceWorker' in navigator)) return alert("No Service Worker support!");
    
    const registration = await navigator.serviceWorker.ready;
    console.log("Service Worker Ready:", registration);

    try {
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        alert("Missing VAPID Key in frontend .env file!");
        return;
      }

      // 2. Ask Browser for Permission
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });

      console.log("Got Subscription:", subscription);

      // 3. Get Current User (Handle both Admin/Staff and Parent/Student)
      let user = authService.getCurrentUser();
      if (!user) {
          user = studentAuthService.getCurrentStudent();
      }

      if (!user || !user.token) {
          return alert("Please login first.");
      }

      // 4. Send to Backend using Service
      // We pass 'user.token' explicitly to ensure it works for both Parents and Staff
      await userService.addSubscribe(subscription, user.token);

      alert("✅ Notifications Enabled! You will receive updates even if the app is closed.");

    } catch (err) {
      console.error("Subscription failed:", err);
      // Fix alert showing [object Object]
      const msg = err.response?.data?.message || err.message || "Unknown error";
      alert("Failed to subscribe: " + msg);
    }
  };

  return (
    <button 
      onClick={subscribe}
      className="fixed bottom-4 left-4 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg z-50 hover:bg-purple-700 transition-all print:hidden flex items-center gap-2"
    >
      <span>🔔</span> Enable Alerts
    </button>
  );
};

export default NotificationPermission;