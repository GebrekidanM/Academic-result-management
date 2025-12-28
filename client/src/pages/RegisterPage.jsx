import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import Hook
import authService from '../services/authService';

const RegisterPage = () => {
    const { t } = useTranslation(); // <--- Initialize
    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser();
    
    // Check if the user is allowed to be here
    const isAuthorized = currentUser && (currentUser.role === 'admin' || currentUser.role === 'staff');

    // --- Redirect if not authorized ---
    useEffect(() => {
        if (!isAuthorized) {
            navigate('/login');
        }
    }, [isAuthorized, navigate]);

    // --- State Management ---
    const [formData, setFormData] = useState({
        fullName: '', 
        username: '', 
        schoolLevel: '',
        password: '', 
        role: 'teacher' 
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await authService.adminRegister(formData);
            alert(t('user_created_success')); // Translated alert
            navigate('/admin/users');
        } catch (err)  {
            setError(err.response?.data?.message || t('user_creation_failed'));
            setLoading(false);
        }
    };

    if (!isAuthorized) return null;

    // --- Tailwind CSS class strings ---
    const cardContainer = "min-h-screen flex items-center justify-center bg-gray-100 p-4";
    const formCard = "bg-white p-8 rounded-xl shadow-lg w-full max-w-md";
    const formTitle = "text-3xl font-bold text-center text-gray-800 mb-2";
    const formSubtitle = "text-center text-sm text-gray-500 mb-6";
    const inputGroup = "mb-4";
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const submitButton = `w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;
    const errorText = "text-red-500 text-sm text-center mt-4";
    const bottomLink = "font-bold text-pink-500 hover:text-pink-700";

    return (
        <div className={cardContainer}>
            <div className={formCard}>
                <h2 className={formTitle}>{t('create_new_user')}</h2>
                <p className={formSubtitle}>
                    {t('create_user_subtitle')}
                </p>
                
                <form onSubmit={handleSubmit}>
                    <div className={inputGroup}>
                        <label htmlFor="fullName" className={inputLabel}>{t('full_name')}</label>
                        <input id="fullName" type="text" name="fullName" value={formData.fullName} className={textInput} onChange={handleChange} required />
                    </div>
                    <div className={inputGroup}>
                        <label htmlFor="username" className={inputLabel}>{t('username')}</label>
                        <input id="username" type="text" name="username" value={formData.username} className={textInput} onChange={handleChange} required />
                    </div>
                    <div className={inputGroup}>
                        <label htmlFor="password" className={inputLabel}>{t('password')}</label>
                        <input id="password" type="password" name="password" value={formData.password} className={textInput} onChange={handleChange} required />
                    </div>
                    
                    {/* Role Selection */}
                    <div className={inputGroup}>
                        <label htmlFor="role" className={inputLabel}>{t('role')}</label>
                        <select id="role" name="role" value={formData.role} onChange={handleChange} className={textInput}>
                            <option value="teacher">{t('teachers')}</option>
                            <option value="admin">{t('admin')}</option>
                            <option value="staff">{t('staff')}</option>
                        </select>
                    </div>

                    {/* School Level Selection */}
                    <div className={inputGroup}>
                        <label htmlFor="schoolLevel" className={inputLabel}>{t('school_level')}</label>
                        <select id="schoolLevel" name="schoolLevel" value={formData.schoolLevel} onChange={handleChange} className={textInput} required>
                            <option value="" disabled>{t('select_school_level')}</option>
                            <option value="kg">{t('section_kg')}</option>
                            <option value="primary">{t('section_primary')}</option>
                            <option value="High School">{t('section_high_school')}</option>
                            <option value="all">{t('level_all')}</option>
                        </select>
                    </div>

                    <div className="mt-6">
                        <button type="submit" className={submitButton} disabled={loading}>
                            {loading ? t('processing') : t('create_user_btn')}
                        </button>
                    </div>

                    {error && <p className={errorText}>{error}</p>}
                </form>
                
                <p className="text-center text-sm text-gray-600 mt-6">
                    <Link to="/admin/users" className={bottomLink}>
                        ← {t('back_to_user_mgmt')}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;