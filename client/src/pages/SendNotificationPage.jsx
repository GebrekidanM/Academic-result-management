import React, { useState } from 'react';
import notificationService from '../services/notificationService';
import { useTranslation } from 'react-i18next';

const SendNotificationPage = () => {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetRoles, setTargetRoles] = useState(['parent']); // Default to parents
    const [targetGrade, setTargetGrade] = useState('All');
    const [loading, setLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await notificationService.sendNotification({
                title, message, targetRoles, targetGrade
            });
            alert("Notification Sent!");
            setTitle(''); setMessage('');
        } catch (err) {
            alert("Failed to send.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">📢 Send Announcement</h2>
                
                <form onSubmit={handleSend} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                        <input type="text" value={title} onChange={e=>setTitle(e.target.value)} className="w-full border p-2 rounded" required placeholder="e.g. School Closed Tomorrow"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Message</label>
                        <textarea value={message} onChange={e=>setMessage(e.target.value)} className="w-full border p-2 rounded h-24" required placeholder="Details..."/>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Audience</label>
                            <select multiple value={targetRoles} onChange={e=>setTargetRoles(Array.from(e.target.selectedOptions, o => o.value))} className="w-full border p-2 rounded h-24">
                                <option value="parent">Parents</option>
                                <option value="teacher">Teachers</option>
                                <option value="staff">Staff</option>
                                <option value="admin">Admins</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Hold Ctrl to select multiple</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Grade (Optional)</label>
                            <select value={targetGrade} onChange={e=>setTargetGrade(e.target.value)} className="w-full border p-2 rounded">
                                <option value="All">All Grades</option>
                                <option value="KG">Kindergarten</option>
                                <option value="Primary">Primary</option>
                                <option value="High School">High School</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700">
                        {loading ? "Sending..." : "🚀 Broadcast Message"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SendNotificationPage;