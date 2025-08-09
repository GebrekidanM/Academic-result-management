import React, { createContext, useState, useContext } from 'react';
import notificationService from '../services/notificationService'; 

const NotificationContext = createContext();

export const useNotifications = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const addNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
    };

    const markAllAsRead = async () => {
        if (unreadCount === 0) return; 

        setUnreadCount(0);
        
        try {
            await notificationService.markAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Failed to mark notifications as read on the server.", error);
        }
    };

    const value = {
        notifications,
        unreadCount,
        addNotification,
        markAllAsRead
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};