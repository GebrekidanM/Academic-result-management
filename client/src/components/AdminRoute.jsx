// src/components/AdminRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/authService';

const AdminRoute = () => {
    const currentUser = authService.getCurrentUser();

    // The logic is:
    // 1. Is there a logged-in user?
    // 2. AND is that user's role 'admin'?
    const isAdmin = currentUser && currentUser.role === 'admin';

    // If they are an admin, render the requested page (the Outlet).
    // If not, redirect them to the home page.
    return isAdmin ? <Outlet /> : <Navigate to="/" />;
};

export default AdminRoute;