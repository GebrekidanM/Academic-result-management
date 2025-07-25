// src/components/ParentRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import studentAuthService from '../services/studentAuthService';

const ParentRoute = () => {
    const currentStudent = studentAuthService.getCurrentStudent();
    return currentStudent ? <Outlet /> : <Navigate to="/parent-login" />;
};

export default ParentRoute;