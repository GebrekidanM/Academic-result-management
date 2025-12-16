import React, { useState, useEffect } from 'react';
import userService from '../services/userService';
import authService from '../services/authService';
import dashboardService from '../services/dashboardService';

import IsAdmin from './HomePage/IsAdmin';
import IsStaff from './HomePage/IsStaff';
import LoggedOut from './HomePage/LoggedOut';

// --- NEW: Helper Component for the Level Badge ---
const LevelBadge = ({ level }) => {
    if (!level) return null;

    let colorClass = "bg-gray-100 text-gray-800"; // Default
    let label = level;

    // Customize colors and labels based on level
    if (level.toLowerCase().includes('kg')) {
        colorClass = "bg-purple-100 text-purple-800 border-purple-200";
        label = "🧸 Kindergarten (KG)";
    } else if (level.toLowerCase() === 'primary') {
        colorClass = "bg-blue-100 text-blue-800 border-blue-200";
        label = "📘 Primary School";
    } else if (level.toLowerCase().includes('high')) {
        colorClass = "bg-indigo-100 text-indigo-800 border-indigo-200";
        label = "🎓 High School";
    } else if (level.toLowerCase() === 'all') {
        colorClass = "bg-green-100 text-green-800 border-green-200";
        label = "🌍 All Levels (Super Admin)";
    }

    return (
        <div className={`flex justify-between items-center px-4 py-2 rounded-lg border shadow-sm font-bold text-sm mb-6 ${colorClass}`}>
            <span className="mr-2">Current Access:</span>
            <span className="uppercase tracking-wide">{label}</span>
        </div>
    );
};

const HomePage = () => {
    const [currentUser] = useState(authService.getCurrentUser());
    const [profileData, setProfileData] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- Data Fetching ---
    useEffect(() => {
        const loadDashboardData = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            try {
                const profileRes = await userService.getProfile();
                const userProfile = profileRes.data;
                setProfileData(userProfile);

                if (['admin', 'staff'].includes(userProfile.role)) {
                    try {
                        const statsRes = await dashboardService.getStats();
                        setStats(statsRes.data);
                    } catch (statErr) {
                        console.error("Could not load stats", statErr);
                    }
                }
            } catch (error) {
                console.error("Failed to load dashboard profile", error);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [currentUser]);

    if (loading) return <div className="text-center mt-10">Loading Dashboard...</div>;
    
    // --- 1. Visitor View ---
    if (!currentUser || !profileData) {
        return <LoggedOut />;
    }

    const { role, schoolLevel } = profileData;

    // --- 2. Admin View ---
    if (role === 'admin') {
        return (
            <div className="p-4">
                {/* Show Level Badge */}
                <LevelBadge level={schoolLevel} />
                
                <IsAdmin 
                    stats={stats} 
                    profileData={profileData} 
                    currentUser={currentUser} 
                />
            </div>
        );
    }

    // --- 3. Teacher View ---
    if (role === 'teacher') {
        return <IsStaff profileData={profileData} />;
    }

    // --- 4. Staff View (Registrar/Secretary) ---
    if (role === 'staff') {
        return (
            <div className="p-4 flex flex-col gap-6">
                
                {/* --- SHOW LEVEL INDICATOR HERE --- */}
                <div className="flex justify-between items-center border-b pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Staff Dashboard</h2>
                    </div>
                    <LevelBadge level={schoolLevel} />
                </div>

                {/* Section A: Analytics & Stats (Filtered by Backend based on level) */}
                <IsAdmin 
                    stats={stats} 
                    profileData={profileData} 
                    currentUser={currentUser} 
                />
                
                {/* Section B: My Classes (Only if they teach) */}
                {(profileData.subjectsTaught?.length > 0 || profileData.homeroomGrade) && (
                    <div className="border-t pt-6 mt-4">
                        <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <span className="bg-pink-100 text-pink-600 p-1 rounded">📚</span> 
                            My Teaching Assignments
                        </h3>
                        <IsStaff profileData={profileData} />
                    </div>
                )}
            </div>
        );
    }

    return <LoggedOut />;
};

export default HomePage;