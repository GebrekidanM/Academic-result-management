import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import userService from '@shared/services/userService';
import authService from '@shared/services/authService';
import studentAuthService from '@shared/services/studentAuthService';
import dashboardService from '@shared/services/dashboardService';
import LoggedOut from "./HomePage/LoggedOut"
import IsAdmin from './HomePage/IsAdmin';
import IsStaff from './HomePage/IsStaff';
import LandingPage from './LandingPage';
import LoginPage from './LoginPage';

// --- Premium SaaS-Style Level Badge ---
const LevelBadge = ({ level }) => {
    const { t } = useTranslation();
    if (!level) return null;

    let colorClass = "bg-slate-100 text-slate-700 border-slate-200"; 
    let label = level;
    
    if (level.toLowerCase().includes('kg')) {
        colorClass = "bg-purple-50 text-purple-700 border-purple-200";
        label = t('level_kg');
    } else if (level.toLowerCase() === 'primary') {
        colorClass = "bg-blue-50 text-blue-700 border-blue-200";
        label = t('level_primary');
    } else if (level.toLowerCase().includes('high')) {
        colorClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
        label = t('level_high_school');
    } else if (level.toLowerCase() === 'all') {
        colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        label = t('level_all');
    }

    return (
        <div className={`inline-flex items-center px-3 py-1 rounded-full border shadow-sm text-xs font-semibold uppercase tracking-wider ${colorClass}`}>
            <span className="opacity-75 mr-1.5 font-medium lowercase tracking-normal">{t('current_access')}:</span>
            {label}
        </div>
    );
};

const HomePage = ({ currentUser }) => {
    const { t } = useTranslation();

    const [profileData, setProfileData] = useState(null);
    const[stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- Data Fetching (Untouched logic) ---
    useEffect(() => {
        const loadDashboardData = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }

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

    // --- Elegant Loading State ---
    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-pink-600 rounded-full animate-spin"></div>
                <div className="text-sm font-medium text-slate-500 animate-pulse">{t('loading')}</div>
            </div>
        );
    }
    
    // --- Visitor View ---
    if (!currentUser) {
        return <LandingPage />;
    }

    // --- Parent Redirect ---
    if (currentUser.role === 'parent') {
        return <Navigate to="/parent/dashboard" replace />;
    }

    // Safety check just in case profileData didn't load
    if (!profileData) return null;

    const { role, schoolLevel } = profileData;

    // --- Admin View ---
    if (role === 'admin') {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t('Admin dashboard')}</h1>
                        <p className="mt-1 text-sm text-slate-500">{t('manage institution overview')}</p>
                    </div>
                    <LevelBadge level={schoolLevel} />
                </header>
                <IsAdmin stats={stats} profileData={profileData} currentUser={currentUser} />
            </div>
        );
    }

    // --- Teacher View ---
    if (role === 'teacher') {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                 <IsStaff profileData={profileData} />
            </div>
        );
    }

    // --- Mixed Staff View ---
    if (role === 'staff') {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in flex flex-col gap-10">
                
                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t('staff_dashboard')}</h1>
                        <p className="mt-1 text-sm text-slate-500">{t('overview_and_management')}</p>
                    </div>
                    <LevelBadge level={schoolLevel} />
                </header>

                {/* Admin Module */}
                <section>
                    <IsAdmin stats={stats} profileData={profileData} currentUser={currentUser} />
                </section>

                {/* Teaching Module */}
                {(profileData.subjectsTaught?.length > 0 || profileData.homeroomGrade) && (
                    <section className="pt-8 border-t border-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                            {/* Subtle Icon Box */}
                            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-pink-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                                {t('my_teaching_assignments')}
                            </h2>
                        </div>
                        <IsStaff profileData={profileData} />
                    </section>
                )}
                
            </div>
        );
    }

    return null;
};

export default HomePage;