import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../services/authService';

const AdminRoute = () => {
    const currentUser = authService.getCurrentUser();
    if(currentUser){
        const isAdmin = currentUser.role === 'admin' || currentUser.role === 'staff'
        return isAdmin ? <Outlet /> : <Navigate to="/" />;
    }else{
        return <Navigate to='/login'/>;
    }


};

export default AdminRoute;