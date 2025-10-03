// src/pages/HomePage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import userService from '../services/userService';
import authService from '../services/authService';
import studentAuthService from '../services/studentAuthService';
import dashboardService from '../services/dashboardService';
import studentService from '../services/studentService';

// --- Reusable UI Components for the Dashboards ---
const StatCard = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center border-l-4 border-pink-500">
        <div className="bg-pink-100 text-pink-600 p-3 rounded-full mr-4">{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

const ActionCard = ({ to, title, description, state = {} }) => (
    <div className="bg-gray-50 p-6 rounded-lg border hover:shadow-lg hover:border-pink-300 transition-all duration-200 flex flex-col">
        <h3 className="font-bold text-lg text-gray-800">{title}</h3>
        <p className="text-gray-600 text-sm mb-4 mt-1 flex-grow">{description}</p>
        <Link to={to} state={state} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200 text-center mt-auto">
            Go &rarr;
        </Link>
    </div>
);


const HomePage = () => {
    // --- State Management ---
    const [currentUser] = useState(authService.getCurrentUser());
    const [currentStudent] = useState(studentAuthService.getCurrentStudent());
    const [profileData, setProfileData] = useState(null); // For teacher/admin
    const [studentData, setStudentData] = useState(null); // For parent
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // --- Data Fetching for ALL Roles ---
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                if (currentUser) {
                    const profileRes = await userService.getProfile();
                    setProfileData(profileRes.data);
                    if (profileRes.data.role === 'admin') {
                        const statsRes = await dashboardService.getStats();
                        setStats(statsRes.data);
                    }
                } else if (currentStudent) {
                    const studentRes = await studentService.getStudentById(currentStudent._id);
                    setStudentData(studentRes.data.data);
                }
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, [currentUser, currentStudent]);

    if (loading) return <p className="text-center text-lg mt-8">Loading Dashboard...</p>;
    
    // --- 1. Admin Dashboard View ---
    if (profileData?.role === 'admin') {
        return (
            <div className="space-y-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Welcome {currentUser.fullName}</h2>
                    <Link to="/profile" className="text-gray-400 italic pb-2 font-bold">Change Username and password</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Active Students" value={stats?.students ?? '...'} icon={'🎓'} />
                    <StatCard title="Teachers" value={stats?.teachers ?? '...'} icon={'👩‍🏫'} />
                    <StatCard title="Subjects" value={stats?.subjects ?? '...'} icon={'📚'} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-700 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <ActionCard to="/admin/users" title="User Management" description="Add, view, and assign roles/subjects to all users." />
                        <ActionCard to="/subjects" title="Subject Management" description="Define the subjects offered for each grade level." />
                        <ActionCard to="/manage-assessments" title="Assessment Management" description="Set the grading structure and assessments for each subject." />
                        <ActionCard to="/students/import" title="Bulk Import Students" description="Quickly enroll a full class of students from an Excel file." />
                    </div>
                </div>
            </div>
        );
    }
    
    // --- 2. Teacher & Homeroom Teacher Dashboard View ---
    if (profileData?.role === 'teacher') {
        return (
            <div className="space-y-8">
                <h2 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h2>
                <p className="text-lg text-gray-600">Welcome, {profileData.fullName}!</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {profileData.homeroomGrade && (
                        <ActionCard to="/roster" title={`My Homeroom: ${profileData.homeroomGrade}`} description="Generate the comprehensive yearly roster for your class." />
                    )}
                    {profileData.subjectsTaught?.map(assignment => (
                        assignment.subject &&
                        <ActionCard 
                            key={assignment.subject._id}
                            to="/subject-roster"
                            title={assignment.subject.name}
                            description={`View detailed mark list for ${assignment.subject.gradeLevel}.`}
                            state={{ subjectId: assignment.subject._id }}
                        />
                    ))}
                </div>
                {profileData.subjectsTaught?.length === 0 && !profileData.homeroomGrade && (
                    <p>You have not been assigned any duties yet. Please contact an administrator.</p>
                )}
            </div>
        );
    }

    // --- 3. Parent Dashboard View ---
    if (studentData) {
        return (
            <div className="space-y-8">
                <h2 className="text-3xl font-bold text-gray-800">Parent Dashboard</h2>
                <p className="text-lg text-gray-600">Welcome! Viewing records for <strong>{studentData.fullName}</strong>.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-pink-500">
                        <h3 className="text-xl font-bold text-gray-700 mb-3">Student Information</h3>
                        <div className="space-y-2 text-sm">
                            <p><strong>Student ID:</strong> {studentData.studentId}</p>
                            <p><strong>Grade Level:</strong> {studentData.gradeLevel}</p>
                            <p><strong>Status:</strong> {studentData.status}</p>
                        </div>
                    </div>
                    <ActionCard 
                        to={`/students/${studentData._id}/report`}
                        title="Full Report Card"
                        description="View and print the complete, official report card for the academic year."
                    />
                </div>
            </div>
        );
    }

    // --- 4. Logged-Out Visitor "Demo Portal" View ---
    return (
        <div className="bg-gray-50">
            {/* --- Hero Section --- */}
            <div className="text-center py-20 md:py-32 px-4">
                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-800 tracking-tight">
                    Welcome to <span className="text-pink-600">Nitsuh</span>
                </h1>
                <h2 className="text-4xl md:text-6xl font-extrabold text-gray-800 tracking-tight mt-2">
                    School Management System
                </h2>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
                    A modern, real-time platform designed to seamlessly manage student academics, reports, and school-parent communications.
                </p>
            </div>

            {/* --- Features Section --- */}
            <div className="py-16 bg-white">
                <div className="container mx-auto px-6">
                    <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">Powerful Features for a Modern School</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="text-center p-6 border border-gray-200 rounded-lg">
                            <div className="text-pink-500 mb-4">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <h4 className="font-bold text-xl mb-2">Comprehensive Reporting</h4>
                            <p className="text-gray-600">Generate beautiful, printable report cards and detailed class rosters with automatic calculations for totals, averages, and ranks.</p>
                        </div>
                        {/* Feature 2 */}
                        <div className="text-center p-6 border border-gray-200 rounded-lg">
                            <div className="text-pink-500 mb-4">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2V7a2 2 0 012-2h2m8-4H5a2 2 0 00-2 2v10a2 2 0 002 2h11l4 4V7a2 2 0 00-2-2z" /></svg>
                            </div>
                            <h4 className="font-bold text-xl mb-2">Real-Time Notifications</h4>
                            <p className="text-gray-600">Keep administrators and homeroom teachers instantly informed with in-app and push notifications for important events like grade updates.</p>
                        </div>
                        {/* Feature 3 */}
                        <div className="text-center p-6 border border-gray-200 rounded-lg">
                            <div className="text-pink-500 mb-4">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <h4 className="font-bold text-xl mb-2">Role-Based Security</h4>
                            <p className="text-gray-600">A secure system with distinct roles for Admins, Teachers, and Parents, ensuring users only see the information relevant to them.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Demo Login Section --- */}
            <div className="bg-gray-800 text-white py-16">
                <div className="container mx-auto text-center px-6">
                    <h2 className="text-3xl font-bold mb-4">Explore the Live Demo</h2>
                    <p className="text-gray-300 mb-8">Click a button below to automatically log in with pre-defined demo credentials and experience the system firsthand.</p>
                    <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                        <button
                            onClick={() => navigate('/login', { state: { username: 'admin', password: 'admin@123' } })}
                            className="w-full md:w-auto bg-pink-600 hover:bg-pink-500 font-bold py-3 px-8 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200">
                            Login as Administrator
                        </button>
                        <button
                            onClick={() => navigate('/login', { state: { username: 'bchebud', password: 'Bchebud@123' } })}
                            className="w-full md:w-auto bg-gray-600 hover:bg-gray-500 font-bold py-3 px-8 rounded-lg shadow-md transform hover:scale-105 transition-all duration-200">
                            Login as Teacher
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-8">
                        (Parents can log in at the <Link to="/parent-login" className="text-pink-400 hover:underline">Parent Portal</Link>)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default HomePage;