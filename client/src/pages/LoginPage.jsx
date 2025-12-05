// src/pages/LoginPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import studentAuthService from '../services/studentAuthService';

const LoginPage = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false); // For loading state on the button
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if(formData.role==="staff"){
                const response = await authService.login(formData);
                    if (response.data.token) {
                        localStorage.setItem('user', JSON.stringify(response.data));
                        navigate('/');
                        window.location.reload();
                    }
            }
            else if(formData.role === "parent"){

                const response = await studentAuthService.login(formData.username, formData.password);
                if (response.data.token) {
                    // Use a different key in local storage to avoid conflicts with teacher/admin login
                    localStorage.setItem('student-user', JSON.stringify(response.data));

                    // The crucial check: if it's the initial password, force a change.
                    if (response.data.isInitialPassword) {
                        navigate('/parent/change-password');
                    } else {
                        navigate('/parent/dashboard');
                    }
                    window.location.reload();
                }
            }else{
                return  setError("Select your Role!")
            }
            
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
            setLoading(false);
        }
    };

    // --- Tailwind CSS class strings for reusability ---
    const cardContainer = "min-h-screen flex items-center justify-center bg-gray-100";
    const formCard = "bg-white p-8 rounded-xl shadow-lg w-full max-w-md";
    const formTitle = "text-3xl font-bold text-center text-gray-800 mb-6";
    const inputGroup = "mb-4";
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const submitButton = `w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;
    const errorText = "text-red-500 text-sm text-center mt-4";

    return (
        <div className={cardContainer}>
            <div className={formCard}>
                <h2 className={formTitle}>Welcome Back!</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className={inputGroup}>
                        <label htmlFor="username" className={inputLabel}>Username</label>
                        <input 
                            id="username"
                            type="text" 
                            name="username" 
                            className={textInput}
                            onChange={handleChange} 
                            placeholder="Enter your username"
                            required 
                        />
                    </div>
                     <div className={inputGroup}>
                        <label htmlFor="role" className={inputLabel}>Role</label>
                        <select name="role" onChange={handleChange} className={textInput} required>
                            <option value="">Select your role</option>
                            <option value="parent">Parent</option>
                            <option value="staff">Staff</option>
                        </select>
                    </div>
                    <div className={inputGroup}>
                        <label htmlFor="password" className={inputLabel}>Password</label>
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
                    <div className={inputGroup}>
                        {error && <p className={errorText}>{error}</p>}
                    </div>
                    <div className="mt-6">
                        <button type="submit" className={submitButton} disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;