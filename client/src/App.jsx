// src/App.js
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { io } from "socket.io-client";
import { useNotifications } from './context/NotificationContext';
import authService from './services/authService';

// --- Component Imports ---
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute'; 
import AdminRoute from './components/AdminRoute';
import ParentRoute from './components/ParentRoute';
import UniversalRoute from './components/UniversalRoute';

// --- Page Imports (Cleaned and Organized) ---

// 1. Public Pages
import LoginPage from './pages/LoginPage';
import ParentLoginPage from './pages/ParentLoginPage';
import RegisterPage from './pages/RegisterPage';

// 2. Parent-Only Pages
import ParentDashboardPage from './pages/ParentDashboardPage';
import ForceChangePasswordPage from './pages/ForceChangePasswordPage';

// 3. Shared Logged-in Pages
import ReportCardPage from './pages/ReportCardPage'; 

// 4. Staff-Only Pages
import HomePage from './pages/HomePage';
import StudentListPage from './pages/StudentListPage';
import StudentDetailPage from './pages/StudentDetailPage'; 
import RosterPage from './pages/RosterPage';
import SubjectRosterPage from './pages/SubjectRosterPage';
import AssessmentTypesPage from './pages/AssessmentTypesPage';
import GradeEntryPage from './pages/GradeEntryPage';
import AddReportPage from './pages/AddReportPage';
import EditGradePage from './pages/EditGradePage';
import EditReportPage from './pages/EditReportPage'; 
import GradeSheetPage from './pages/GradeSheetPage';
import AnalyticsPage from './pages/AnalyticsPage';

// 5. Admin-Only Pages
import UserManagementPage from './pages/UserManagementPage';
import UserEditPage from './pages/UserEditPage';
import SubjectListPage from './pages/SubjectListPage';
import AddSubjectPage from './pages/AddSubjectPage';
import EditSubjectPage from './pages/EditSubjectPage';
import AddStudentPage from './pages/AddStudentPage';
import EditStudentPage from './pages/EditStudentPage';
import ImportStudentsPage from './pages/ImportStudentsPage';
import ImportUsersPage from './pages/ImportUsersPage';
import ImportSubjectsPage from './pages/ImportSubjectsPage';
const frontUrl = import.meta.env.VITE_FRONT_URL;

function App() {
  const { addNotification } = useNotifications();
  const currentUser = authService.getCurrentUser();
  
  useEffect(() => {
    let socket;
    if (currentUser && currentUser._id) {
      socket = io(frontUrl);
      socket.emit("addNewUser", currentUser._id);
      socket.on("getNotification", (data) => {
        if (data && data.message) {
            addNotification({ message: data.message, createdAt: new Date() });
        }
      });
    }
    return () => {
      if (socket) socket.disconnect();
    };
  }, [currentUser, addNotification]);

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar /> 
      <main className="container mx-auto p-4">
        <Routes>
          {/* ======= 1. PUBLIC ROUTES ======== */}
           <Route path="/login" element={<LoginPage />} />
           <Route path="/parent-login" element={<ParentLoginPage />} />

          {/* ===== 2. STAFF-ONLY ROUTES ====== */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/students" element={<StudentListPage />} />
            <Route path="/students/:id" element={<StudentDetailPage />} />
            <Route path="/grades/add/:studentId" element={<GradeEntryPage />} />
            <Route path="/grades/edit/:gradeId" element={<EditGradePage />} />
            <Route path="/reports/add/:studentId" element={<AddReportPage />} />
            <Route path="/reports/edit/:reportId" element={<EditReportPage />} />
            <Route path="/roster" element={<RosterPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} /> 
            <Route path="/subject-roster" element={<SubjectRosterPage />} />
            <Route path="/manage-assessments" element={<AssessmentTypesPage />} />
            <Route path="/grade-sheet" element={<GradeSheetPage />} />
            
            {/* --- ADMIN-ONLY SUB-ROUTES --- */}
            <Route element={<AdminRoute />}>
                <Route path="/subjects" element={<SubjectListPage />} />
                <Route path="/subjects/add" element={<AddSubjectPage />} />
                <Route path="/subjects/edit/:id" element={<EditSubjectPage />} />
                <Route path="/subjects/import" element={<ImportSubjectsPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/students/add" element={<AddStudentPage />} />
                <Route path="/students/edit/:id" element={<EditStudentPage />} />
                <Route path="/students/import" element={<ImportStudentsPage />} />
                <Route path="/admin/users" element={<UserManagementPage />} />
                <Route path="/admin/users/:id" element={<UserEditPage />} />
                <Route path="/admin/users/import" element={<ImportUsersPage />} />
            </Route>
          </Route>
          
          {/* ====== 3. PARENT ROUTES ========= */}
            <Route element={<ParentRoute />}>
                <Route path="/parent/dashboard" element={<ParentDashboardPage />} />
                <Route path="/parent/change-password" element={<ForceChangePasswordPage />} />
            </Route>

          {/* === 4. UNIVERSAL LOGGED-IN ROUTES === */}
            <Route element={<UniversalRoute />}>
                <Route path="/students/:id/report" element={<ReportCardPage />} />
            </Route>

        </Routes>
      </main>
    </div>
  );
}

export default App;