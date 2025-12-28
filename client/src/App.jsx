// src/App.js
import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';

// --- Component Imports ---
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute'; 
import AdminRoute from './components/AdminRoute';
import ParentRoute from './components/ParentRoute';
import UniversalRoute from './components/UniversalRoute';
import EventCardGenerator from './pages/EventCardGenerator';

// --- OFFLINE COMPONENTS
import SyncStatus from './components/SyncStatus';     
import OfflineBanner from './components/OfflineBanner';

// --- Page Imports ---

// 1. Public Pages
import LoginPage from './pages/LoginPage';
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
import AddReportPage from './pages/AddReportPage';
import EditGradePage from './pages/EditGradePage';
import EditReportPage from './pages/EditReportPage'; 
import GradeSheetPage from './pages/GradeSheetPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import StudentIDPage from './pages/StudentIDPage';
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
import UserProfileEditPage from './pages/UserProfileEditPage';
import SubjectAnalysisDetail from './pages/SubjectAnalysisDetail';
import TeachersPage from './pages/TeachersPage';
import SubjectPerformance from './pages/SubjectPerformance';
import AtRiskStudents from './pages/AtRiskStudents';
import AllSubjectAnalytics from './pages/AllSubjectAnalytics';

import CertificatePage from './pages/CertificatePage';

function App() {
  const [isOpen, setIsOpen] = useState(false);

  // Register service worker (for offline/PWA)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(reg => console.log('Service Worker registered:', reg))
          .catch(err => console.error('Service Worker error:', err));
      });
    }
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen relative"> {/* Added relative for positioning */}
      
      {/* --- 3. ADD OFFLINE UI HERE --- */}
      <SyncStatus /> 
      {/* ----------------------------- */}

      <Navbar isOpen={isOpen} setIsOpen={setIsOpen}/> 
      
      <main className="container mx-auto p-4" onClick={()=> setIsOpen(false)}>
        <Routes>
          {/* ======= 1. PUBLIC ROUTES ======== */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<HomePage />} />
          
          {/* ===== 2. STAFF-ONLY ROUTES ====== */}
          <Route element={<ProtectedRoute />}>
            <Route path="/at-risk" element={<AtRiskStudents />} />
            <Route path="/allsubjectAnalysis" element={<AllSubjectAnalytics/>}/>
            <Route path='/subject-performance' element={<SubjectPerformance/>}/>
            <Route path='/teachers' element={<TeachersPage/>}/>
            <Route path='/subject-analysis' element={<SubjectAnalysisDetail/>}/>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/students" element={<StudentListPage />} />
            <Route path="/students/:id" element={<StudentDetailPage />} />
            <Route path="/grades/edit/:gradeId" element={<EditGradePage />} />
            <Route path="/reports/add/:studentId" element={<AddReportPage />} />
            <Route path="/reports/edit/:reportId" element={<EditReportPage />} />
            <Route path="/roster" element={<RosterPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} /> 
            <Route path="/subject-roster" element={<SubjectRosterPage />} />
            <Route path="/manage-assessments" element={<AssessmentTypesPage />} />
            <Route path="/grade-sheet" element={<GradeSheetPage />} />
            <Route path="/students/add" element={<AddStudentPage />} />
            <Route path="/students/edit/:id" element={<EditStudentPage />} />
            
            {/* --- ADMIN-ONLY SUB-ROUTES --- */}
            <Route element={<AdminRoute />}>
              <Route path="/certificates" element={<CertificatePage />} />
              <Route path="/id-cards" element={<StudentIDPage />} />
              <Route path="/events/generator" element={<EventCardGenerator />} />
              <Route path='/otherprofile' element={<UserProfileEditPage/>}/>
              <Route path="/subjects" element={<SubjectListPage />} />
              <Route path="/subjects/add" element={<AddSubjectPage />} />
              <Route path="/subjects/edit/:id" element={<EditSubjectPage />} />
              <Route path="/subjects/import" element={<ImportSubjectsPage />} />
              <Route path="/register" element={<RegisterPage />} />
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
      <OfflineBanner /> 

    </div>
  );
}


export default App;