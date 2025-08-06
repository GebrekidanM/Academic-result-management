import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/authService';

const ProtectedRoute = () => {
    const currentUser = authService.getCurrentUser();

    return currentUser ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;