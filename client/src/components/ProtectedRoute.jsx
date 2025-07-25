// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/authService';

const ProtectedRoute = () => {
    const currentUser = authService.getCurrentUser();

    // If a user is logged in, render the child component (using <Outlet />)
    // Otherwise, redirect them to the /login page
    return currentUser ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;