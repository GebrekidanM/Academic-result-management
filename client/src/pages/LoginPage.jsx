import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
import authService from '../services/authService';
import studentAuthService from '../services/studentAuthService';

const LoginPage = () => {
    const { t } = useTranslation(); 
    const navigate = useNavigate();
    const location = useLocation(); // Used to receive data from Landing Page

    // --- State ---
    const [formData, setFormData] = useState({ username: '', password: '', role: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // --- 1. Monitor Online Status ---
    useEffect(() => {
        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    // --- 2. Auto-Fill from Demo Page ---
    useEffect(() => {
        if (location.state?.autoFill) {
            setFormData({
                username: location.state.autoFill.username,
                password: location.state.autoFill.password,
                role: location.state.autoFill.role
            });
        }
    }, [location.state]);

    // --- Handlers ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isOnline) {
            setError(t('offline_warning') || "You are currently offline.");
            return;
        }

        if (!formData.role) {
            setError(t('error') || "Select your Role!"); 
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (formData.role === "staff") {
                // Admin / Teacher Login
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
                // Student / Parent Login
                const response = await studentAuthService.login(formData.username, formData.password);
                if (response.data.token) {
                    localStorage.setItem('student-user', JSON.stringify(response.data));

                    // Force Password Change Check for Students
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
            const msg = err.response?.data?.message || t('error') || 'Login failed.';
            setError(msg);
            setLoading(false);
        }
    };

    // --- Styles ---
    const cardContainer = "min-h-[calc(100vh-5rem)] flex items-center justify-center bg-gray-100 p-4";
    const formCard = "bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200";
    const formTitle = "text-3xl font-bold text-center text-gray-800 mb-6";
    const inputGroup = "mb-4";
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";
    const submitButton = `w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading || !isOnline ? 'opacity-50 cursor-not-allowed' : ''}`;
    const errorText = "bg-red-50 border border-red-200 text-red-600 text-sm text-center p-3 rounded-md";

    return (
        <div className={cardContainer}>
            <div className={formCard}>
                <h2 className={formTitle}>{t('welcome')}!</h2>
                
                {/* Offline Warning */}
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
                            value={formData.username}
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
                            <option value="">-- {t('select_role') || "Select Role"} --</option>
                            <option value="parent">{t('parent_guardian') || "Parent/Student"}</option>
                            <option value="staff">{t('admin_staff') || "Staff/Teacher"}</option>
                        </select>
                    </div>

                    {/* Password */}
                    <div className={inputGroup}>
                        <label htmlFor="password" className={inputLabel}>{t('password')}</label>
                        <input 
                            id="password"
                            type="password" 
                            name="password" 
                            value={formData.password}
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