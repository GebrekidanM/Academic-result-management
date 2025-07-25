// src/components/UniversalRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/authService';
import studentAuthService from '../services/studentAuthService';

const UniversalRoute = () => {
    const isStaffLoggedIn = !!authService.getCurrentUser();
    const isParentLoggedIn = !!studentAuthService.getCurrentStudent();

    // If either a staff member OR a parent is logged in, allow access.
    if (isStaffLoggedIn || isParentLoggedIn) {
        return <Outlet />;
    }

    // If no one is logged in, redirect to the main login page.
    return <Navigate to="/login" />;
};

export default UniversalRoute;