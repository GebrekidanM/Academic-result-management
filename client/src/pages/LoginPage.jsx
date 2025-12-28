import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import Hook
import authService from '../services/authService';
import studentAuthService from '../services/studentAuthService';

const LoginPage = () => {
    const { t } = useTranslation(); // <--- Initialize Hook
    const [formData, setFormData] = useState({ username: '', password: '', role: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const navigate = useNavigate();

    // --- Monitor Online Status ---
    useEffect(() => {
        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isOnline) {
            setError(t('offline_mode') || "You are currently offline. Cannot login.");
            return;
        }

        if (!formData.role) {
            setError(t('error') || "Select your Role!"); // Fallback if key missing
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (formData.role === "staff") {
                const response = await authService.login({
                    username: formData.username,
                    password: formData.password
                });
                if (response.data.token) {
                    localStorage.setItem('user', JSON.stringify(response.data));
                    navigate('/');
                    window.location.reload();
                }
            } 
            else if (formData.role === "parent") {
                const response = await studentAuthService.login(formData.username, formData.password);
                if (response.data.token) {
                    localStorage.setItem('student-user', JSON.stringify(response.data));

                    // Force Password Change Check
                    if (response.data.isInitialPassword) {
                        navigate('/parent/change-password');
                    } else {
                        navigate('/parent/dashboard');
                    }
                    window.location.reload();
                }
            } 
        } catch (err) {
            console.error(err);
            // Try to get a specific error message, otherwise fallback to generic
            const msg = err.response?.data?.message || t('error') || 'Login failed.';
            setError(msg);
            setLoading(false);
        }
    };

    // --- Tailwind CSS class strings ---
    const cardContainer = "min-h-[calc(100vh-5rem)] flex items-center justify-center bg-gray-100 p-4";
    const formCard = "bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200";
    const formTitle = "text-3xl font-bold text-center text-gray-800 mb-6";
    const inputGroup = "mb-4";
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all";
    const submitButton = `w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading || !isOnline ? 'opacity-50 cursor-not-allowed' : ''}`;
    const errorText = "bg-red-50 border border-red-200 text-red-600 text-sm text-center p-3 rounded-md";

    return (
        <div className={cardContainer}>
            <div className={formCard}>
                <h2 className={formTitle}>{t('welcome')}!</h2>
                
                {!isOnline && (
                    <div className="bg-yellow-50 text-yellow-800 p-3 rounded mb-4 text-sm text-center font-bold border border-yellow-200">
                        ⚠️ {t('offline_mode')}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    
                    {/* Username */}
                    <div className={inputGroup}>
                        <label htmlFor="username" className={inputLabel}>{t('username')}</label>
                        <input 
                            id="username"
                            type="text" 
                            name="username" 
                            className={textInput}
                            onChange={handleChange} 
                            placeholder={t('username')}
                            required 
                        />
                    </div>

                    {/* Role Selection */}
                    <div className={inputGroup}>
                        <label htmlFor="role" className={inputLabel}>{t('role') || "Role"}</label>
                        <select 
                            name="role" 
                            onChange={handleChange} 
                            className={`${textInput} bg-white`} 
                            required
                            value={formData.role}
                        >
                            <option value=""> {t('select_Role')}</option>
                            <option value="staff">{t('admin_staff')}</option>
                            <option value="parent">{t('parent_guardian')}</option>
                        </select>
                    </div>

                    {/* Password */}
                    <div className={inputGroup}>
                        <label htmlFor="password" className={inputLabel}>{t('password')}</label>
                        <input 
                            id="password"
                            type="password" 
                            name="password" 
                            className={textInput}
                            onChange={handleChange} 
                            placeholder="••••••••"
                            required 
                        />
                    </div>

                    {/* Error Message */}
                    <div className="mb-4 min-h-[20px]">
                        {error && <p className={errorText}>{error}</p>}
                    </div>

                    {/* Submit Button */}
                    <div className="mt-2">
                        <button type="submit" className={submitButton} disabled={loading || !isOnline}>
                            {loading ? t('loading') : t('login')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;