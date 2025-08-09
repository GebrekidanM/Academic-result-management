// src/services/notificationService.js
import api from './api'; // Import our authenticated axios instance

const API_URL = '/notifications';

/**
 * Sends the browser's push subscription object to the backend to be saved.
 * @param {PushSubscription} subscriptionObject - The subscription object from the browser.
 * @returns {Promise} Axios promise
 */
const subscribe = (subscriptionObject) => {
    return api.post(`${API_URL}/subscribe`, subscriptionObject);
};

/**
 * Fetches the logged-in user's recent notifications from the server.
 * @returns {Promise} Axios promise
 */
const getNotifications = () => {
    return api.get(API_URL);
};

/**
 * Tells the backend to mark all of the logged-in user's notifications as read.
 * @returns {Promise} Axios promise
 */
const markAllAsRead = () => {
    return api.put(`${API_URL}/mark-as-read`);
};


// The final, complete export block
export default {
    subscribe,
    getNotifications,
    markAllAsRead
};