// src/context/NotificationContext.js
import React, { createContext, useState, useContext } from 'react';

// 1. Create the context
const NotificationContext = createContext();

// 2. Create a custom hook for easy access
export const useNotifications = () => {
    return useContext(NotificationContext);
};

// 3. Create the Provider component that will wrap our app
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Function to add a new notification to the top of the list
    const addNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
    };

    // Function to mark all as read
    const markAllAsRead = () => {
        setUnreadCount(0);
        // In a more advanced version, you would also make an API call here
        // to update the isRead flag in the database.
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