import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import userService from '../services/userService';
import authService from '../services/authService';
import studentAuthService from '../services/studentAuthService'; // <--- 1. Import this
import dashboardService from '../services/dashboardService';

import IsAdmin from './HomePage/IsAdmin';
import IsStaff from './HomePage/IsStaff';
import LandingPage from './LandingPage';

// ... (Keep LevelBadge component as is) ...
const LevelBadge = ({ level }) => {
    const { t } = useTranslation();
    if (!level) return null;
    // ... (keep existing badge logic) ...
    let colorClass = "bg-gray-100 text-gray-800"; 
    let label = level;
    if (level.toLowerCase().includes('kg')) {
        colorClass = "bg-purple-100 text-purple-800 border-purple-200";
        label = `🧸 ${t('level_kg')}`;
    } else if (level.toLowerCase() === 'primary') {
        colorClass = "bg-blue-100 text-blue-800 border-blue-200";
        label = `📘 ${t('level_primary')}`;
    } else if (level.toLowerCase().includes('high')) {
        colorClass = "bg-indigo-100 text-indigo-800 border-indigo-200";
        label = `🎓 ${t('level_high_school')}`;
    } else if (level.toLowerCase() === 'all') {
        colorClass = "bg-green-100 text-green-800 border-green-200";
        label = `🌍 ${t('level_all')}`;
    }
    return (
        <div className={`flex justify-between items-center px-4 py-2 rounded-lg border shadow-sm font-bold text-sm mb-6 ${colorClass}`}>
            <span className="mr-2">{t('current_access')}:</span>
            <span className="uppercase tracking-wide">{label}</span>
        </div>
    );
};

const HomePage = () => {
    const { t } = useTranslation();

    // --- 2. UPDATED STATE INITIALIZATION ---
    // Check for Staff first, then check for Parent/Student
    const [currentUser] = useState(() => {
        const staffUser = authService.getCurrentUser();
        if (staffUser) return staffUser;

        const studentUser = studentAuthService.getCurrentStudent();
        if (studentUser) {
            // Ensure the object has the role property set to 'parent'
            // (Student objects might not have 'role' in the database)
            return { ...studentUser, role: 'parent' };
        }

        return null;
    });

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

            // 3. IF PARENT: Stop here. The redirect below handles them.
            if (currentUser.role === 'parent') {
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

    if (loading) return <div className="text-center mt-10">{t('loading')}</div>;
    
    // --- 4. Visitor View ---
    if (!currentUser) {
        return <LandingPage />;
    }

    // --- 5. Parent Redirect ---
    // This will now work because currentUser.role is manually set to 'parent' above
    if (currentUser.role === 'parent') {
        return <Navigate to="/parent/dashboard" replace />;
    }

    // Ensure profile data is loaded for staff/admin before continuing
    if (!profileData) return <LoggedOut />;

    const { role, schoolLevel } = profileData;

    // --- Admin View ---
    if (role === 'admin') {
        return (
            <div className="p-4">
                <LevelBadge level={schoolLevel} />
                <IsAdmin 
                    stats={stats} 
                    profileData={profileData} 
                    currentUser={currentUser} 
                />
            </div>
        );
    }

    // --- Teacher View ---
    if (role === 'teacher') {
        return <IsStaff profileData={profileData} />;
    }

    // --- Staff View ---
    if (role === 'staff') {
        return (
            <div className="p-4 flex flex-col gap-6">
                <div className="flex justify-between items-center border-b pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{t('staff_dashboard')}</h2>
                    </div>
                    <LevelBadge level={schoolLevel} />
                </div>
                <IsAdmin 
                    stats={stats} 
                    profileData={profileData} 
                    currentUser={currentUser} 
                />
                {(profileData.subjectsTaught?.length > 0 || profileData.homeroomGrade) && (
                    <div className="border-t pt-6 mt-4">
                        <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <span className="bg-pink-100 text-pink-600 p-1 rounded">📚</span> 
                            {t('my_teaching_assignments')}
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