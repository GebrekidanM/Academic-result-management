import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import notificationService from '../services/notificationService';
import authService from '../services/authService';

// Sound file
const notificationSound = new Audio('/alert.mp3'); 

const NotificationBell = () => {
    const { t } = useTranslation();
    const [currentUser] = useState(authService.getCurrentUser());
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // --- EDIT STATE ---
    const [editingItem, setEditingItem] = useState(null); // The notification object being edited
    const [editForm, setEditForm] = useState({ title: '', message: '' });

    const lastNotifIdRef = useRef(null); 
    const dropdownRef = useRef(null);

    // Permission Check: Can this user edit/delete?
    const canManage = ['admin', 'staff'].includes(currentUser?.role);

    // --- FETCH DATA ---
    const fetchNotifs = async () => {
        if (!navigator.onLine) return;
        try {
            const res = await notificationService.getMyNotifications();
            const data = res.data.data;
            setNotifications(data);

            const lastCheck = localStorage.getItem('last_notif_check');
            if (!lastCheck) {
                setUnreadCount(data.length);
            } else {
                const newItems = data.filter(n => new Date(n.createdAt) > new Date(lastCheck));
                setUnreadCount(newItems.length);
            }

            // Play Sound Logic
            if (data.length > 0) {
                const latest = data[0];
                if (lastNotifIdRef.current && lastNotifIdRef.current !== latest._id) {
                    try {
                        notificationSound.currentTime = 0;
                        notificationSound.play();
                    } catch (e) {}
                    toast.info(`📢 ${latest.title}`);
                }
                lastNotifIdRef.current = latest._id;
            }
        } catch (err) {
            console.warn("Notification poll failed");
        }
    };

    useEffect(() => {
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, []);


    // --- ACTIONS ---

    const handleDelete = async (id, e) => {
        e.stopPropagation(); // Prevent closing dropdown
        if (!window.confirm(t('confirm_delete'))) return;

        try {
            await notificationService.deleteNotification(id);
            setNotifications(notifications.filter(n => n._id !== id));
            toast.success(t('success_delete'));
        } catch (error) {
            toast.error(t('error'));
        }
    };

    const openEditModal = (notif, e) => {
        e.stopPropagation();
        setEditingItem(notif);
        setEditForm({ title: notif.title, message: notif.message });
        setIsOpen(false); // Close dropdown to show modal cleanly
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await notificationService.updateNotification(editingItem._id, editForm);
            toast.success(t('success_update'));
            setEditingItem(null); // Close modal
            fetchNotifs(); // Refresh list
        } catch (error) {
            toast.error(t('error'));
        }
    };

    // UI Logic
    const toggleOpen = () => {
        if (!isOpen) {
            setUnreadCount(0); 
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
            <button onClick={toggleOpen} className="relative p-2 text-gray-300 hover:text-white transition-colors focus:outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadCount > 0 && <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full animate-pulse">{unreadCount}</span>}
            </button>

            {/* --- DROPDOWN LIST --- */}
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
                                <div key={n._id} className="p-4 border-b hover:bg-gray-50 transition-colors relative group">
                                    
                                    {/* Content */}
                                    <h4 className="font-bold text-sm text-gray-800 pr-10">{n.title}</h4>
                                    <p className="text-xs text-gray-600 mt-1">{n.message}</p>
                                    <div className="mt-2 flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                                        <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded text-gray-600">{n.targetGrade}</span>
                                    </div>

                                    {/* Action Buttons (Only for Admin/Staff) */}
                                    {canManage && (
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => openEditModal(n, e)}
                                                className="p-1 text-blue-500 hover:bg-blue-100 rounded"
                                                title={t('edit')}
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                onClick={(e) => handleDelete(n._id, e)}
                                                className="p-1 text-red-500 hover:bg-red-100 rounded"
                                                title={t('delete')}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* --- EDIT MODAL --- */}
            {editingItem && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">{t('edit_notification')}</h3>
                        
                        <form onSubmit={handleUpdate}>
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                                <input 
                                    type="text" 
                                    className="w-full border p-2 rounded" 
                                    value={editForm.title}
                                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
                                <textarea 
                                    className="w-full border p-2 rounded h-24" 
                                    value={editForm.message}
                                    onChange={e => setEditForm({...editForm, message: e.target.value})}
                                    required
                                />
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingItem(null)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                >
                                    {t('cancel')}
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
                                >
                                    {t('update')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;