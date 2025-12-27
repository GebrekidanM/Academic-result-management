import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import Hook
import studentAuthService from '../services/studentAuthService';

const ForceChangePasswordPage = () => {
    const { t } = useTranslation(); // <--- Initialize Hook
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Use translated error messages
        if (newPassword.length < 6) {
            return setError(t('err_pass_len'));
        }
        if (newPassword !== confirmPassword) {
            return setError(t('err_pass_match'));
        }
        
        setError('');
        setLoading(true);
        
        try {
            const stu = await studentAuthService.changePassword(newPassword);
            console.log("Password change response:", stu);
            
            // Translated Alert
            alert(t('success_pass_change'));
            
            // Update local storage
            const user = studentAuthService.getCurrentStudent();
            if (user) {
                user.isInitialPassword = false;
                localStorage.setItem('student-user', JSON.stringify(user));
            }

            navigate('/parent/dashboard');
            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.message || t('fail_pass_change'));
            setLoading(false);
        }
    };
    
    // --- Reusable Tailwind CSS classes ---
    const cardContainer = "min-h-[100vh-4rem] flex items-center justify-center bg-gray-100";
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
                <h2 className={formTitle}>{t('change_password_title')}</h2>
                <p className={formSubtitle}>{t('change_password_sub')}</p>
                
                <form onSubmit={handleSubmit}>
                    <div className={inputGroup}>
                        <label htmlFor="newPassword" className={inputLabel}>{t('new_password')}</label>
                        <input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={textInput}
                            placeholder={t('ph_min_chars')}
                            required
                        />
                    </div>
                     <div className={inputGroup}>
                        <label htmlFor="confirmPassword" className={inputLabel}>{t('confirm_password')}</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={textInput}
                            placeholder={t('ph_confirm_pass')}
                            required
                        />
                    </div>
                    <div className="mt-6">
                        <button type="submit" className={submitButton} disabled={loading}>
                            {loading ? t('loading') : t('set_password_btn')}
                        </button>
                    </div>
                    {error && <p className={errorText}>{error}</p>}
                </form>
            </div>
        </div>
    );
};

export default ForceChangePasswordPage;