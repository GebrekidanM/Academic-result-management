// src/pages/ForceChangePasswordPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import studentAuthService from '../services/studentAuthService';

const ForceChangePasswordPage = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            return setError('Password must be at least 6 characters long.');
        }
        if (newPassword !== confirmPassword) {
            return setError('Passwords do not match.');
        }
        setError('');
        setLoading(true);

        
        
        try {
            const stu = await studentAuthService.changePassword(newPassword);
            console.log("Password change response:", stu);
            alert('Password changed successfully! You will now be taken to your dashboard.');
            
            // We need to update the local storage to reflect the change
            const user = studentAuthService.getCurrentStudent();
            if (user) {
                user.isInitialPassword = false;
                localStorage.setItem('student-user', JSON.stringify(user));
            }

            navigate('/parent/dashboard');
            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password.');
            setLoading(false);
        }
    };
    
    // --- Reusable Tailwind CSS classes ---
    const cardContainer = "min-h-screen flex items-center justify-center bg-gray-100";
    const formCard = "bg-white p-8 rounded-xl shadow-lg w-full max-w-md";
    const formTitle = "text-3xl font-bold text-center text-gray-800 mb-2";
    const formSubtitle = "text-center text-gray-500 mb-6";
    const inputGroup = "mb-4";
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const submitButton = `w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;
    const errorText = "text-red-500 text-sm text-center mt-4";

    return (
        <div className={cardContainer}>
            <div className={formCard}>
                <h2 className={formTitle}>Create Your New Password</h2>
                <p className={formSubtitle}>For your security, you must change the initial password provided by the school.</p>
                <form onSubmit={handleSubmit}>
                    <div className={inputGroup}>
                        <label htmlFor="newPassword" className={inputLabel}>New Password</label>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={textInput}
                            placeholder="Enter 6 or more characters"
                            required
                        />
                    </div>
                     <div className={inputGroup}>
                        <label htmlFor="confirmPassword" className={inputLabel}>Confirm New Password</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={textInput}
                            placeholder="Enter the same password again"
                            required
                        />
                    </div>
                    <div className="mt-6">
                        <button type="submit" className={submitButton} disabled={loading}>
                            {loading ? 'Saving...' : 'Set New Password'}
                        </button>
                    </div>
                    {error && <p className={errorText}>{error}</p>}
                </form>
            </div>
        </div>
    );
};

export default ForceChangePasswordPage;