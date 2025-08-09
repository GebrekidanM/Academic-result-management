import React, { useEffect } from 'react';
import authService from '../services/authService';
import notificationService from '../services/notificationService';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const PushNotificationManager = () => {
    const currentUser = authService.getCurrentUser();

    useEffect(() => {
        if (currentUser && "serviceWorker" in navigator && "PushManager" in window) {
            const subscribeUser = async () => {
                try {
                    const sw = await navigator.serviceWorker.ready;
                    let subscription = await sw.pushManager.getSubscription();

                    if (subscription === null) {
                        subscription = await sw.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                        });
                        // Send the new subscription to the backend
                        await notificationService.subscribe(subscription);
                    }
                } catch (err) {
                    console.error("Push notification subscription failed:", err);
                }
            };
            subscribeUser();
        }
    }, [currentUser]);

    return null;
};

export default PushNotificationManager;