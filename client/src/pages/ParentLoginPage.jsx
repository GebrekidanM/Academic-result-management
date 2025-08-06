// src/pages/ParentLoginPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import studentAuthService from '../services/studentAuthService';

const ParentLoginPage = () => {
    // --- State Management ---
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // --- Event Handler ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await studentAuthService.login(studentId, password);
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
        } catch (err) {
            console.log("Login Error:", err);
            setError(err.response?.data?.message || 'Login failed. Please check the Student ID and password.');
            setLoading(false);
        }
    };

    // --- Tailwind CSS class strings (reused for consistency) ---
    const cardContainer = "min-h-screen flex items-center justify-center bg-gray-100";
    const formCard = "bg-white p-8 rounded-xl shadow-lg w-full max-w-md";
    const formTitle = "text-3xl font-bold text-center text-gray-800 mb-2";
    const formSubtitle = "text-center text-gray-500 mb-6";
    const inputGroup = "mb-4";
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const submitButton = `w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;
    const errorText = "text-red-500 text-sm text-center mt-4";
    const bottomText = "text-center text-sm text-gray-600 mt-6";
    const bottomLink = "font-bold text-pink-500 hover:text-pink-700";

    return (
        <div className={cardContainer}>
            <div className={formCard}>
                <h2 className={formTitle}>Parent & Student Portal</h2>
                <p className={formSubtitle}>Access your child's academic progress.</p>
                
                <form onSubmit={handleSubmit}>
                    <div className={inputGroup}>
                        <label htmlFor="studentId" className={inputLabel}>Student ID</label>
                        <input 
                            id="studentId"
                            type="text" 
                            value={studentId}
                            className={textInput}
                            onChange={(e) => setStudentId(e.target.value)} 
                            placeholder="Enter the student's ID"
                            required 
                        />
                    </div>
                    <div className={inputGroup}>
                        <label htmlFor="password" className={inputLabel}>Password</label>
                        <input 
                            id="password"
                            type="password" 
                            value={password}
                            className={textInput}
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="Enter the provided password"
                            required 
                        />
                    </div>
                    <div className="mt-6">
                        <button type="submit" className={submitButton} disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </div>

                    {error && <p className={errorText}>{error}</p>}
                </form>

                <p className={bottomText}>
                    Are you a teacher or admin?{' '}
                    <Link to="/login" className={bottomLink}>
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ParentLoginPage;