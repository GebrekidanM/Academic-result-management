// src/pages/ProfilePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import userService from '../services/userService';

const ProfilePage = () => {
    // --- State Management ---
    const [user, setUser] = useState(null);
    const [fullName, setFullName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // --- Data Fetching ---
    useEffect(() => {
        userService.getProfile()
            .then(res => {
                setUser(res.data);
                setFullName(res.data.fullName);
            })
            .catch(() => setError("Failed to load profile."))
            .finally(() => setLoading(false));
    }, []);

    // --- Event Handler ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Frontend validation
        if (newPassword && newPassword.length < 6) {
            return setError("New password must be at least 6 characters long.");
        }
        if (newPassword && newPassword !== confirmPassword) {
            return setError("New passwords do not match.");
        }
        
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const updateData = { fullName };
            // Only include password fields if the user is trying to change them
            if (newPassword) {
                if (!currentPassword) {
                    setLoading(false);
                    return setError("Please enter your current password to set a new one.");
                }
                updateData.currentPassword = currentPassword;
                updateData.newPassword = newPassword;
            }
            
            const response = await userService.updateProfile(updateData);
            
            // Update the stored user in local storage with the new details and token
            localStorage.setItem('user', JSON.stringify(response.data));
            
            setSuccess("Profile updated successfully! Refreshing...");
            // Clear password fields after successful submission
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            
            setTimeout(() => window.location.reload(), 2000);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !user) return <p className="text-center text-lg mt-8">Loading profile...</p>;
    
    // --- Tailwind CSS class strings ---
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const submitButton = `w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h2>
            
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* --- Left Column: Profile Details --- */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">User Details</h3>
                            <div className="mb-4">
                                <label htmlFor="fullName" className={inputLabel}>Full Name</label>
                                <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={textInput} required/>
                            </div>
                            <div className="mb-4">
                                <label className={inputLabel}>Username</label>
                                <p className="text-gray-600 bg-gray-100 p-3 rounded-lg">{user?.username} (Cannot be changed)</p>
                            </div>
                            <div className="mb-4">
                                <label className={inputLabel}>Role</label>
                                <p className="text-gray-600 bg-gray-100 p-3 rounded-lg capitalize">{user?.role}</p>
                            </div>
                        </div>
                    </div>

                    {/* --- Right Column: Password Change --- */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Change Password</h3>
                            <div className="mb-4">
                                <label htmlFor="currentPassword" className={inputLabel}>Current Password</label>
                                <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={textInput} placeholder="Required to set a new password"/>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="newPassword" className={inputLabel}>New Password</label>
                                <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={textInput} placeholder="Leave blank to keep the same"/>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="confirmPassword" className={inputLabel}>Confirm New Password</label>
                                <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={textInput} placeholder="Confirm your new password"/>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 border-t pt-6">
                    <button type="submit" className={submitButton} disabled={loading}>
                        {loading ? 'Saving...' : 'Update Profile'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-center mt-4">{error}</p>}
                {success && <p className="text-green-600 text-center mt-4">{success}</p>}
            </form>
        </div>
    );
};

export default ProfilePage;