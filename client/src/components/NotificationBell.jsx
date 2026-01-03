import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify'; // 1. Import Toast
import notificationService from '../services/notificationService';

// Optional: Add a sound file to public folder named 'alert.mp3'
// const notificationSound = new Audio('/alert.mp3'); 

const NotificationBell = () => {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Track the last known ID to prevent duplicate popups
    const lastNotifIdRef = useRef(null); 
    const dropdownRef = useRef(null);

    // --- Request Browser Permission on Load ---
    useEffect(() => {
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }, []);

    // Load Notifications
    useEffect(() => {
        const fetchNotifs = async () => {
            if (!navigator.onLine) return;

            try {
                const res = await notificationService.getMyNotifications();
                const data = res.data.data;
                setNotifications(data);

                // Calculate Unread
                const lastCheck = localStorage.getItem('last_notif_check');
                let count = 0;
                if (!lastCheck) {
                    count = data.length;
                } else {
                    const newItems = data.filter(n => new Date(n.createdAt) > new Date(lastCheck));
                    count = newItems.length;
                }
                setUnreadCount(count);

                // --- POP UP LOGIC ---
                if (data.length > 0) {
                    const latest = data[0]; // Get the newest message
                    
                    // If the newest message is DIFFERENT from the last one we saw...
                    if (lastNotifIdRef.current && lastNotifIdRef.current !== latest._id) {
                        
                        // 1. Play Sound (Optional)
                        // notificationSound.play().catch(e => {});

                        // 2. Show In-App Toast
                        toast.info(`📢 ${latest.title}: ${latest.message.substring(0, 30)}...`, {
                            onClick: () => setIsOpen(true) // Open dropdown when clicked
                        });

                        // 3. Show System Notification (Even if tab is hidden)
                        if (document.hidden && Notification.permission === "granted") {
                            new Notification("Freedom SMS: New Message", {
                                body: latest.title,
                                icon: "/er-192.png" // Path to your logo
                            });
                        }
                    }
                    
                    // Update ref so we don't show it again next poll
                    lastNotifIdRef.current = latest._id;
                }

            } catch (err) {
                console.warn("Notification poll failed");
            }
        };

        fetchNotifs();
        const interval = setInterval(fetchNotifs, 10000); // Check every 10 seconds
        return () => clearInterval(interval);
    }, []);

    // ... (Handle Open, Click Outside, and Return JSX remain exactly the same as before) ...
    // Copy the rest of the component from the previous code here...
    
    // Handle Open
    const toggleOpen = () => {
        if (!isOpen) {
            setUnreadCount(0); // Mark all as seen locally
            localStorage.setItem('last_notif_check', new Date().toISOString());
        }
        setIsOpen(!isOpen);
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative mr-4" ref={dropdownRef}>
            <button 
                onClick={toggleOpen} 
                className="relative p-2 text-gray-300 hover:text-white transition-colors focus:outline-none"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-200">
                    <div className="bg-gray-100 p-3 border-b font-bold text-gray-700 flex justify-between items-center">
                        <span>{t('notifications')}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{notifications.length}</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 text-sm">{t('no_notifications')}</div>
                        ) : (
                            notifications.map(n => (
                                <div key={n._id} className="p-4 border-b hover:bg-gray-50 transition-colors">
                                    <h4 className="font-bold text-sm text-gray-800">{n.title}</h4>
                                    <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                                    <div className="mt-2 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                                        <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded text-gray-600">{n.targetGrade}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;