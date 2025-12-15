// src/pages/RegisterPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';

const RegisterPage = () => {
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
            // Directly use adminRegister since this page is now protected
            await authService.adminRegister(formData);
            alert('New user created successfully!');
            navigate('/admin/users');
        } catch (err)  {
            setError(err.response?.data?.message || 'User creation failed.');
            setLoading(false);
        }
    };

    // If not authorized (and before redirect happens), return null to show nothing
    if (!isAuthorized) return null;

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
                <h2 className={formTitle}>Create New User</h2>
                <p className={formSubtitle}>
                    Create a new teacher, staff, or admin account.
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
                    
                    {/* Role Selection is always visible now */}
                    <div className={inputGroup}>
                        <label htmlFor="role" className={inputLabel}>Role</label>
                        <select id="role" name="role" value={formData.role} onChange={handleChange} className={textInput}>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                            <option value="staff">Staff</option>
                        </select>
                    </div>

                    {/* School Level Selection is always visible now */}
                    <div className={inputGroup}>
                        <label htmlFor="schoolLevel" className={inputLabel}>School Level</label>
                        <select id="schoolLevel" name="schoolLevel" value={formData.schoolLevel} onChange={handleChange} className={textInput} required>
                            <option value="" disabled>Select school level</option>
                            <option value="kg">Kindergarten</option>
                            <option value="primary">Primary</option>
                            <option value="High School">High School</option>
                            <option value="all">All Levels (Admins)</option>
                        </select>
                    </div>

                    <div className="mt-6">
                        <button type="submit" className={submitButton} disabled={loading}>
                            {loading ? 'Processing...' : 'Create User'}
                        </button>
                    </div>

                    {error && <p className={errorText}>{error}</p>}
                </form>
                
                <p className="text-center text-sm text-gray-600 mt-6">
                    <Link to="/admin/users" className={bottomLink}>
                        ← Back to User Management
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;