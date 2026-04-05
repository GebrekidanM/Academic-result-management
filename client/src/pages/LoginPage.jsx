import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // useLocation ተጨምሯል
import { useTranslation } from 'react-i18next';
import authService from '../services/authService';
import studentAuthService from '../services/studentAuthService';

const LoginPage = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({ username: '', password: '', role: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const navigate = useNavigate();
    const location = useLocation(); // URL ለመስማት

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

    // --- AUTO LOGIN LOGIC (አዲስ የተጨመረ) ---
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const mode = urlParams.get('mode');

        if (mode === 'demo' && isOnline) {
            // እዚህ ጋር ያንተን እውነተኛ የዴሞ መረጃዎች ተካ
            const demoUser = {
                username: "admin", 
                password: "admin@123", 
                role: "admin"
            };

            setFormData(demoUser);
            
            const timer = setTimeout(() => {
                performAutoLogin(demoUser);
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [location.search, isOnline]);

    const performAutoLogin = async (data) => {
        setLoading(true);
        setError(null);
        try {
            const response = await authService.login({
                username: data.username,
                password: data.password
            });
            if (response.data.token) {
                localStorage.setItem('user', JSON.stringify(response.data));
                navigate('/');
                window.location.reload();
            }
        } catch (err) {
            setError("Demo Login failed. Please enter credentials manually.");
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault(); // Event ካለ ብቻ prevent ያደርጋል
        
        if (!isOnline) {
            setError(t('offline_mode') || "You are currently offline. Cannot login.");
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

    // --- Tailwind CSS class strings (ያለህበት ይቀጥላል) ---
    const cardContainer = "min-h-[calc(100vh-5rem)] flex items-center justify-center bg-gray-100 p-4 font-sans";
    const formCard = "bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100";
    const formTitle = "text-3xl font-black text-center text-slate-800 mb-2";
    const textInput = "shadow-sm appearance-none border border-gray-200 rounded-xl w-full py-3.5 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
    const submitButton = `w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 px-4 rounded-xl focus:outline-none shadow-lg shadow-blue-100 transition-all duration-200 ${loading || !isOnline ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`;

    return (
        <div className={cardContainer}>
            <div className={formCard}>
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-xl">F</span>
                    </div>
                </div>
                <h2 className={formTitle}>{t('welcome')}!</h2>
                <p className="text-center text-slate-400 text-sm mb-8 font-medium italic">Please enter your credentials to continue</p>
                
                {!isOnline && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-6 text-sm text-center font-bold border border-red-100 flex items-center justify-center gap-2">
                        <WifiOff size={16} /> {t('offline_mode')}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <label className="block text-slate-700 text-xs font-black uppercase tracking-wider mb-2 ml-1">{t('username')}</label>
                        <input 
                            name="username" 
                            type="text" 
                            className={textInput}
                            onChange={handleChange} 
                            value={formData.username}
                            placeholder="Enter username"
                            required 
                        />
                    </div>

                    <div className="mb-5">
                        <label className="block text-slate-700 text-xs font-black uppercase tracking-wider mb-2 ml-1">{t('role')}</label>
                        <select 
                            name="role" 
                            onChange={handleChange} 
                            className={`${textInput} bg-white cursor-pointer`} 
                            required
                            value={formData.role}
                        >
                            <option value="">{t('select_Role')}</option>
                            <option value="staff">{t('admin_staff')}</option>
                            <option value="parent">{t('parent_guardian')}</option>
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="block text-slate-700 text-xs font-black uppercase tracking-wider mb-2 ml-1">{t('password')}</label>
                        <input 
                            name="password" 
                            type="password" 
                            className={textInput}
                            onChange={handleChange} 
                            value={formData.password}
                            placeholder="••••••••"
                            required 
                        />
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-xs font-bold p-4 rounded-xl text-center animate-pulse">
                            {error}
                        </div>
                    )}

                    <button type="submit" className={submitButton} disabled={loading || !isOnline}>
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                {t('loading')}...
                            </div>
                        ) : t('login')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;