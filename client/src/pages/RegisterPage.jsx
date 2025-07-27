// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';

const RegisterPage = () => {
    // Check if an admin is logged in. This determines the page's mode.
    const currentUser = authService.getCurrentUser();
    const isAdminMode = currentUser && currentUser.role === 'admin';

    // --- State Management ---
    const [formData, setFormData] = useState({ 
        fullName: '', 
        username: '', 
        password: '', 
        role: 'teacher' // Default role for when admin is creating
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isAdminMode) {
                await authService.adminRegister(formData);
                alert('New user created!');
                navigate('/admin/users');
            } else {
                await authService.publicRegister(formData);
                alert('Admin account created! Please log in.');
                navigate('/login');
            }
        } catch (err)  {
            setError(err.response?.data?.message || 'Registration failed.');
            setLoading(false);
        }
    };

    // --- Tailwind CSS class strings ---
    const cardContainer = "min-h-screen flex items-center justify-center bg-gray-100";
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
                <h2 className={formTitle}>{isAdminMode ? 'Create New User' : 'System Setup'}</h2>
                <p className={formSubtitle}>
                    {isAdminMode 
                        ? 'Create a new teacher or admin account.' 
                        : 'This page is for creating the first administrator account only.'
                    }
                </p>
                
                <form onSubmit={handleSubmit}>
                    <div className={inputGroup}>
                        <label htmlFor="fullName" className={inputLabel}>Full Name</label>
                        <input id="fullName" type="text" name="fullName" value={formData.fullName} className={textInput} onChange={handleChange} required />
                    </div>
                    <div className={inputGroup}>
                        <label htmlFor="username" className={inputLabel}>Username</label>
                        <input id="username" type="text" name="username" value={formData.username} className={textInput} onChange={handleChange} required />
                    </div>
                    <div className={inputGroup}>
                        <label htmlFor="password" className={inputLabel}>Password</label>
                        <input id="password" type="password" name="password" value={formData.password} className={textInput} onChange={handleChange} required />
                    </div>
                    
                    {isAdminMode && (
                        <div className={inputGroup}>
                            <label htmlFor="role" className={inputLabel}>Role</label>
                            <select id="role" name="role" value={formData.role} onChange={handleChange} className={textInput}>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    )}

                    <div className="mt-6">
                        <button type="submit" className={submitButton} disabled={loading}>
                            {loading ? 'Processing...' : (isAdminMode ? 'Create User' : 'Create First Admin')}
                        </button>
                    </div>

                    {error && <p className={errorText}>{error}</p>}
                </form>
                
                {isAdminMode ? (
                    <p className="text-center text-sm text-gray-600 mt-6">
                        <Link to="/admin/users" className={bottomLink}>
                            ← Back to User Management
                        </Link>
                    </p>
                ) : (
                     <p className="text-center text-sm text-gray-600 mt-6">
                        Already set up?{' '}
                        <Link to="/login" className={bottomLink}>
                            Login here
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default RegisterPage;