import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { BookOpen, LogOut } from "lucide-react";
import NotificationBell from "./NotificationBell";
import LanguageSwitcher from "./LanguageSwitcher";

const MobileSidebar = ({ open, setOpen, user, student, logout }) => {
  const { t } = useTranslation();
  const location = useLocation();

  const navItem = (path) =>
    `flex items-center gap-3 px-3 py-2.5 ml-6 rounded-lg text-sm font-medium transition-colors ${
      location.pathname === path ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }`;

  const sectionHeader = "text-2xs font-extrabold text-pink-600 tracking-wider px-3 mt-6 mb-2";
  const handleClose = () => setOpen(false);
  const navLinkStyle = `px-3 py-2 text-sm font-medium rounded-lg transition-colors text-slate-600 hover:bg-slate-50 hover:text-slate-900`;

  return (
    <>
      <div
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-60 transition-opacity duration-300 ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={handleClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl z-70 transform transition-transform duration-300 ease-in-out flex flex-col ${
            open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <span className="text-slate-900 font-semibold tracking-tight">Menu</span>
          <button
            onClick={handleClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
          >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>

        <div className="grow overflow-y-auto px-3 py-4 space-y-1">
          {user && user.role === "teacher" && (
            <>
              <div className={sectionHeader}>Students</div>
              <Link to="/students" onClick={handleClose} className={navItem("/students")}>Students</Link>
            </>
          )}

          {user && ['admin', 'staff', 'accountant'].includes(user.role) && (
            <>
              <div className={sectionHeader}>Students</div>
              <Link to="/students" onClick={handleClose} className={navItem("/students")}>Student List</Link>
              
              {['admin', 'staff'].includes(user.role) && (
                <>
                  <Link to="/reports/batch" onClick={handleClose} className={navItem("/reports/batch")}>Report Cards</Link>
                  <Link to="/id-cards" onClick={handleClose} className={navItem("/id-cards")}>ID Cards</Link>
                  <Link to="/high-scorers" onClick={handleClose} className={navItem("/high-scorers")}>High Scorers</Link>
                  <Link to="/certificates" onClick={handleClose} className={navItem("/certificates")}>Certificates</Link>
                  <Link to="/events/generator" onClick={handleClose} className={navItem("/events/generator")}>Event Cards</Link>
                </>
              )}

              <Link to="/students/import" onClick={handleClose} className={navItem("/students/import")}>Import Excel</Link>
            </>
          )}

          {user && ['admin', 'staff', 'teacher'].includes(user.role) && (
            <>
              <div className={sectionHeader}>Academics</div>
              <Link to="/grade-sheet" onClick={handleClose} className={navItem("/grade-sheet")}>Enter Grades</Link>
              <Link to="/manage-assessments" onClick={handleClose} className={navItem("/manage-assessments")}>Assessments</Link>
              <Link to="/supportivesub" onClick={handleClose} className={navItem("/supportivesub")}>Supportive Subjects</Link>
              <Link to="/roster" onClick={handleClose} className={navItem("/roster")}>Class Roster</Link>
              <Link to="/master" onClick={handleClose} className={navLinkStyle}>Schedule</Link>
            </>
          )}

          {user && ['admin', 'staff', 'teacher', 'accountant'].includes(user.role) && (
            <>
              <div className={sectionHeader}>Analytics</div>
              <Link to="/analytics" onClick={handleClose} className={navItem("/analytics")}>Overview</Link>
              <Link to="/subject-performance" onClick={handleClose} className={navItem("/subject-performance")}>Subjects</Link>
              <Link to="/at-risk" onClick={handleClose} className={navItem("/at-risk")}>At Risk</Link>
              
              {['admin', 'staff', 'accountant'].includes(user.role) && (
                <Link to="/analytics/retention" onClick={handleClose} className={navItem("/analytics/retention")}>Enrollment & Retention</Link>
              )}
            </>
          )}

          {user && ['admin', 'accountant'].includes(user.role) && (
            <>
              <div className={sectionHeader}>{user.role === 'accountant' ? 'Finance' : 'Admin'}</div>
              <Link to="/admin/payments" onClick={handleClose} className={navItem("/admin/payments")}>Record Payments</Link>
              
              <Link to="/admin/payments/analytics" onClick={handleClose} className={navItem("/admin/payments/analytics")}>Payment Analytics</Link>
              
              {user.role === "admin" && (
                <>
                  <Link to="/schedule" onClick={handleClose} className={navItem("/schedule")}>Schedule</Link>
                  <Link to="/subjects" onClick={handleClose} className={navItem("/subjects")}>Subjects</Link>
                  <Link to="/supportivelist" onClick={handleClose} className={navItem("/supportivelist")}>Supportive Subjects</Link>
                  <Link to="/admin/users" onClick={handleClose} className={navItem("/admin/users")}>Staff</Link>
                  <Link to="/send_notification" onClick={handleClose} className={navItem("/send_notification")}>Notifications</Link>
                </>
              )}
            </>
          )}

          <div className="border-t border-slate-100 my-4 mx-3" />

          {(user || student) && (
            <>
              <Link to="/library" onClick={handleClose} className={navItem("/library")}>
                <BookOpen className="w-4 h-4 mr-2" />
                Library
              </Link>
              <div className="flex items-center justify-between px-3 py-3">
                <span className="text-slate-600 text-sm font-medium">Notifications</span>
                <NotificationBell />
              </div>
            </>
          )}

          <div className="px-3 py-2">
             <LanguageSwitcher />
          </div>
        </div>

        <div className="bg-white border-t p-4 mt-auto">
            {(user || student) ? (
              <button
                onClick={logout}
                className="w-full py-2.5 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors duration-150"
              >
                Logout
              </button>
            ) : (
              <Link to="/login" onClick={handleClose} className="block text-center w-full py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
                Login
              </Link>
            )}
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;