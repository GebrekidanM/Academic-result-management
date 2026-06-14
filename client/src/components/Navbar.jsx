import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  BookOpen,
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  ChevronDown,
  GraduationCap,
  ClipboardList,
  Bell
} from 'lucide-react';

import authService from '@shared/services/authService';
import studentAuthService from '@shared/services/studentAuthService';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationBell from './NotificationBell';
import MobileSidebar from './MobileSideBar'; // Ensure this path is correct

// --- Premium SaaS Mega Dropdown ---
const MegaMenu = ({ title, items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  },[]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center font-extrabold gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors focus:outline-none ${
            open ? 'bg-slate-100 text-pink-600' : 'text-slate-600 hover:bg-slate-50 hover:text-pink-600'
        }`}
      >
        {title}
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-3 w-[520px] 
                      bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 
                        p-3 grid grid-cols-2 gap-2 z-50 animate-fade-in">
          {items.map((item, i) => (
            <NavLink
              key={i}
              to={item.to}
              onClick={() => setOpen(false)}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
            >
              <div className="mt-0.5 bg-slate-100 text-slate-500 p-1.5 rounded-lg group-hover:bg-blue-50 group-hover:text-pink-600 transition-colors">
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900">{item.label}</div>
                <div className="text-xs text-slate-500 mt-0.5 leading-snug">{item.desc}</div>
              </div>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    setUser(authService.getCurrentUser());
    setStudent(studentAuthService.getCurrentStudent());
  },[]);

  const logout = () => {
    authService.logout();
    studentAuthService.logout();
    navigate('/');
    window.location.reload();
  };

  const navLink = ({ isActive }) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <>
      <div className="sticky top-0 z-40 bg-zinc-150 backdrop-blur-md shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5  text-pink-600 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
            <div className="bg-pink-600 text-white p-1.5 rounded-lg">
                <LayoutDashboard className="w-6 h-6" />
            </div>
            <span className='hidden min-[1000px]:block'>{t('app_name')}</span>
          </Link>

          {/* Center Nav (Desktop) */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              
              {user.role === 'teacher' && (
                  <NavLink to="/students" className={navLink}>
                    Students
                  </NavLink>
              )}

              {/* Students */}
              {(user.role === 'admin' || user.role === 'staff') && (
                <MegaMenu
                  title="Students"
                  items={[
                    { to: '/students', label: 'Student List', desc: 'Manage enrolled students', icon: Users },
                    { to: '/reports/batch', label: 'Report Cards', desc: 'Generate terminal reports', icon: ClipboardList },
                    { to: '/id-cards', label: 'ID Cards', desc: 'Print student ID badges', icon: GraduationCap },
                    { to: '/high-scorers', label: 'High Scorers', desc: 'Top performing students', icon: GraduationCap },
                    { to: '/certificates', label: 'Certificates', desc: 'Issue official certificates', icon: GraduationCap },
                    { to: '/events/generator', label: 'Event Cards', desc: 'Design invitation cards', icon: GraduationCap },
                  ]}
                />
              )}

              {/* Academics */}
              <MegaMenu
                title="Academics"
                items={[
                  { to: '/grade-sheet', label: 'Enter Grades', desc: 'Manage student scores', icon: ClipboardList },
                  { to: '/manage-assessments', label: 'Assessments', desc: 'Control exam types', icon: ClipboardList },
                  { to: '/supportivesub', label: 'Supportive Subjects', desc: 'Manage A/B scores', icon: ClipboardList },
                  { to: '/roster', label: 'Class Roster', desc: 'View students by class', icon: Users },
                  { to: '/master', label: 'Schedule', desc: 'View master timetable', icon: LayoutDashboard },
                ]}
              />

              {/* Analytics */}
              <MegaMenu
                title="Analytics"
                items={[
                  { to: '/analytics', label: 'Overview', desc: 'General performance insights', icon: BarChart3 },
                  { to: '/subject-performance', label: 'Subjects', desc: 'Track subject metrics', icon: BarChart3 },
                  { to: '/at-risk', label: 'At Risk', desc: 'Identify struggling students', icon: BarChart3 },
                ]}
              />

              {/* Admin */}
              {user.role === 'admin' && (
                <MegaMenu
                  title="Admin"
                  items={[
                    { to: '/schedule', label: 'Schedule', desc: 'Manage timetable', icon: LayoutDashboard },
                    { to: '/subjects', label: 'Subjects', desc: 'Manage curriculum', icon: Settings },
                    { to: '/admin/users', label: 'Staff', desc: 'Manage system users', icon: Users },
                    {to:'/supportivelist', label:'Supportive Subjects', desc: 'Manage curriculum', icon: Settings},
                    { to: '/send_notification', label: 'Notifications', desc: 'Send mass alerts', icon: Bell },
                  ]}
                />
              )}
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Desktop Icons */}
            <div className="hidden md:flex items-center gap-3">
              {(user || student) && (
                <>
                  <NavLink to="/library" className="text-slate-500 hover:text-slate-900 transition-colors p-2 rounded-lg hover:bg-slate-50">
                    <BookOpen className="w-5 h-5" />
                  </NavLink>
                  <div className="text-slate-500 hover:text-slate-900 transition-colors p-2 rounded-lg hover:bg-slate-50">
                    <NotificationBell />
                  </div>
                </>
              )}

              <div className="pl-2 border-l border-slate-200 flex items-center gap-3">
                  <LanguageSwitcher />

                  {(user || student) ? (
                    <button
                      onClick={logout}
                      className="px-4 py-2 rounded-sm text-sm font-bold bg-red-600 border border-slate-200 text-neutral-100 hover:bg-slate-50 hover:text-red-600 transition-colors duration-150 focus:ring-2 focus:ring-slate-200"
                    >
                      Logout
                    </button>
                  ) : (
                    <NavLink to="/login" className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
                      Login
                    </NavLink>
                  )}
              </div>
            </div>

            {/* Mobile Hamburger Button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden p-2 -mr-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
          </div>
        </nav>
      </div>

      {/* Render the Sidebar component directly in the Navbar layout */}
      <MobileSidebar 
         open={mobileOpen} 
         setOpen={setMobileOpen} 
         user={user} 
         student={student} 
         logout={logout} 
      />
    </>
  );
};

export default Navbar;