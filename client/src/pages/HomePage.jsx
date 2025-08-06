// src/pages/HomePage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import userService from '../services/userService';
import authService from '../services/authService';
import dashboardService from '../services/dashboardService';
import studentAuthService from '../services/studentAuthService';
import studentService from '../services/studentService';

// --- Reusable Components for the Dashboard ---
const StatCard = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow flex items-center">
        <div className="bg-pink-100 text-pink-600 p-3 rounded-full mr-4">{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

const ActionCard = ({ to, title, description, state }) => (
    <div className="bg-gray-50 p-4 rounded-lg border hover:shadow-lg transition-shadow">
        <h3 className="font-bold text-lg text-gray-800">{title}</h3>
        <p className="text-gray-500 mb-4 text-sm">{description}</p>
        <Link to={to} state={state} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
            Go →
        </Link>
    </div>
);

const HomePage = () => {
    // --- State Management ---
    const [currentUser] = useState(authService.getCurrentUser());
    const [profileData, setProfileData] = useState(null);
    const [currentStudent] = useState(studentAuthService.getCurrentStudent());
    const [studentData, setStudentData] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    console.log("Current User:", currentStudent);
    // --- Data Fetching ---
     useEffect(() => {
        const loadDashboardData = async () => {
            try {
                if (currentUser) {
                    // Fetch data for logged-in staff
                    const profileRes = await userService.getProfile();
                    setProfileData(profileRes.data);
                    if (profileRes.data.role === 'admin') {
                        const statsRes = await dashboardService.getStats();
                        setStats(statsRes.data);
                    }
                } else if (currentStudent) {
                    // Fetch data for logged-in parent
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
    
    // --- Admin Dashboard ---
    if (profileData?.role === 'admin') {
        return (
            <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Admin Dashboard</h2>
                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Active Students" value={stats?.students ?? '...'} icon={'🎓'} />
                    <StatCard title="Teachers" value={stats?.teachers ?? '...'} icon={'👩‍🏫'} />
                    <StatCard title="Subjects" value={stats?.subjects ?? '...'} icon={'📚'} />
                </div>
                {/* Quick Actions Section */}
                <h3 className="text-xl font-bold text-gray-700 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ActionCard to="/admin/users" title="User Management" description="Add, view, and manage all users." />
                    <ActionCard to="/subjects" title="Subject Management" description="Define the subjects for each grade level." />
                    <ActionCard to="/manage-assessments" title="Assessment Management" description="Set the grading structure for subjects." />
                </div>
            </div>
        );
    }
    
    // --- Teacher & Homeroom Teacher Dashboard ---
    if (profileData?.role === 'teacher') {
        return (
            <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Teacher Dashboard</h2>
                <p className="text-lg text-gray-600 mb-8">Welcome, {profileData.fullName}!</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Special card for Homeroom Teacher */}
                    {profileData.homeroomGrade && (
                        <ActionCard to="/roster" title={`My Homeroom: ${profileData.homeroomGrade}`} description="Generate the comprehensive yearly roster for your class." />
                    )}
                    {/* Cards for each subject taught */}
                    {profileData.subjectsTaught?.map(assignment => (
                        <ActionCard 
                            key={assignment.subject._id}
                            to="/subject-roster"
                            title={assignment.subject.name}
                            description={`View detailed mark list for ${assignment.subject.gradeLevel}.`}
                            state={{ subjectId: assignment.subject._id, gradeLevel: assignment.subject.gradeLevel }}
                        />
                    ))}
                </div>
                {profileData.subjectsTaught?.length === 0 && !profileData.homeroomGrade && (
                    <p>You have not been assigned any duties yet. Please contact an administrator.</p>
                )}
            </div>
        );
    }

    // --- Parent Dashboard ---
    if (studentData) {
        return (
            <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Parent Dashboard</h2>
                <p className="text-lg text-gray-600 mb-8">Welcome! Viewing records for <strong>{studentData.fullName}</strong>.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-xl font-bold text-gray-700 mb-3">Student Information</h3>
                        <div className="space-y-2">
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

    // --- Fallback for logged-out users ---
    return (
        <div className="text-center p-10">
            <h2 className="text-4xl font-bold mb-4">Welcome to the Freedom School Management System</h2>
            <p className="text-lg text-gray-600">Please <Link to="/login" className="text-pink-500 hover:underline">login</Link> to access your dashboard.</p>
        </div>
    );
};

export default HomePage;