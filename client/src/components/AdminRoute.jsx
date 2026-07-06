import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '@shared/services/authService';

const AdminRoute = () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
        const isAdmin = ['admin', 'staff', 'accountant'].includes(currentUser.role);
        return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
    } else {
        return <Navigate to="/login" replace />;
    }
};

export default AdminRoute;