// src/pages/HomePage.js
import React, { useState, useEffect } from 'react';
import userService from '../services/userService';
import authService from '../services/authService';
import dashboardService from '../services/dashboardService';
import IsAdmin from './HomePage/IsAdmin';
import IsStaff from './HomePage/IsStaff';
import LoggedOut from './HomePage/LoggedOut';


const HomePage = () => {
    // --- State Management ---
    const [currentUser] = useState(authService.getCurrentUser());
    const [profileData, setProfileData] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    // --- Data Fetching for ALL Roles ---
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                if (currentUser) {
                    const profileRes = await userService.getProfile();
                    setProfileData(profileRes.data);
                    if (profileRes.data.role === 'admin' || profileRes.data.role === 'staff') {
                        const statsRes = await dashboardService.getStats();
                        setStats(statsRes.data);
                    }
                }
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, [currentUser]);

    if (loading) return <p className="text-center text-lg mt-8">Loading Dashboard...</p>;
    
    // --- 1. Admin Dashboard View ---
    if (profileData?.role === 'admin' ) {
        return (
            <IsAdmin stats={stats} profileData={profileData} currentUser={currentUser}/>
        );
    }
    
    // --- 2. Teacher & Homeroom Teacher Dashboard View ---
    if (profileData?.role === 'teacher') {
        return (
            <IsStaff profileData={profileData}/>
        );
    }

    if(profileData?.role === "staff"){
        return(
            <>
                <IsAdmin stats={stats} profileData={profileData} currentUser={currentUser}/>
                <IsStaff profileData={profileData}/>
            </>
        )

    }

    // --- 3. Logged-Out Visitor "Demo Portal" View ---
    return (
        <LoggedOut/>
    );
};

export default HomePage;