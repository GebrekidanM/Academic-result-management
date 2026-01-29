import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
import authService from '../services/authService';
import studentAuthService from '../services/studentAuthService';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationBell from './NotificationBell';

// --- Helper Component for Dropdowns ---
const NavDropdown = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative block md:inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-white font-bold py-2 px-3 rounded-md hover:bg-gray-700 flex items-center gap-1 w-full md:w-auto justify-between"
      >
        {title}
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path></svg>
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div 
            className="md:absolute right-0 mt-2 w-full md:w-56 bg-white rounded-md shadow-lg z-50 overflow-hidden py-1 text-gray-800"
            onClick={() => setIsOpen(false)} // Close menu when a link inside is clicked
        >
          {children}
        </div>
      )}
    </div>
  );
};

// --- Main Navbar Component ---
const Navbar = ({ isOpen, setIsOpen }) => {
  const { t } = useTranslation(); 
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getCurrentUser();
    const student = studentAuthService.getCurrentStudent();
    if (user) setCurrentUser(user);
    else if (student) setCurrentStudent(student);
  }, []);

  const handleLogout = () => {
    authService.logout();
    studentAuthService.logout();
    setCurrentUser(null);
    setCurrentStudent(null);
    navigate('/');
    window.location.reload();
  };

  const closeMenu = () => setIsOpen(false);

  // Styles
  const dropdownLinkClass = "block px-4 py-2 text-sm hover:bg-pink-100 hover:text-pink-600 transition-colors border-b md:border-none border-gray-100";
  const navLinkClass = ({ isActive }) => 
    `block md:inline-block text-white font-bold py-2 px-3 rounded-md transition-colors whitespace-nowrap ${isActive ? 'bg-pink-600' : 'hover:bg-gray-700'}`;

  return (
    <nav className="bg-gray-900 min-h-16 p-2 shadow-lg sticky top-0 z-50 font-sans print:hidden">
      <div className="container mx-auto flex items-center justify-between flex-wrap">
        
        {/* Logo */}
        <div className="flex items-center shrink-0 text-white mr-6">
          <Link to={"/"} onClick={closeMenu} className="font-bold text-xl tracking-tight flex items-center gap-2">
            {t('app_name')}
          </Link>
        </div>

        {/* Mobile Toggle Button */}
        <div className="block md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="flex items-center px-3 py-2 border rounded text-gray-400 border-gray-600 hover:text-white hover:border-white">
            <svg className="fill-current h-3 w-3" viewBox="0 0 20 20"><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/></svg>
          </button>
        </div>

        {/* Navigation Links */}
        <div className={`w-full md:flex md:items-center md:w-auto ${isOpen ? 'block' : 'hidden'}`}>
          <div className="text-sm md:grow md:flex md:items-center md:gap-2 mt-4 md:mt-0">
            
            {currentUser && (
              <>
                {/* 1. STUDENTS DROPDOWN (For Admin & Teachers) */}
                {(currentUser.role === 'admin' || currentUser.role === 'staff') && <NavDropdown title={`🎓 ${t('students')}`}>
                    <NavLink to="/students" className={dropdownLinkClass} onClick={closeMenu}>
                        {t('students_list')}
                    </NavLink>
                    <NavLink to="/events/generator" className={dropdownLinkClass} onClick={closeMenu}>
                        🎉 {t('event_cards')}
                    </NavLink>
                    <NavLink to="/reports/batch" className={dropdownLinkClass} onClick={closeMenu}>Report Card</NavLink>
                    <NavLink to="/id-cards" className={dropdownLinkClass} onClick={closeMenu}>
                        🪪 ID Cards
                    </NavLink>
                    <NavLink to="/certificates" className={dropdownLinkClass} onClick={closeMenu}>
                        🏆 Certificates
                    </NavLink>
                </NavDropdown>}

                {currentUser.role === "teacher" && <NavLink to="/students" className={navLinkClass} onClick={closeMenu}>
                        {t('students_list')}
                    </NavLink>}

                {/* 2. ACADEMICS Dropdown */}
                <NavDropdown title={`📝 ${t('academics')}`}>
                  <NavLink to="/grade-sheet" className={dropdownLinkClass} onClick={closeMenu}>
                    {t('enter_grades')}
                  </NavLink>
                  <NavLink to="/manage-assessments" className={dropdownLinkClass} onClick={closeMenu}>
                    {t('manage_assessments')}
                  </NavLink>
                  <NavLink to={'/supportivesub'} className={dropdownLinkClass} onClick={closeMenu}>
                        Supportive Subjects Grade
                  </NavLink>
                  {(currentUser.role === 'admin' || currentUser.homeroomGrade) && (
                    <NavLink to="/roster" className={dropdownLinkClass} onClick={closeMenu}>
                        {t('class_roster')}
                    </NavLink>
                  )}
                  {/*{(currentUser.role === 'admin') && (
                    <NavLink to="/schedule" className={dropdownLinkClass} onClick={closeMenu}>
                        {t('Schedule')}
                    </NavLink>
                  )}
                  <NavLink to="/master" className={dropdownLinkClass} onClick={closeMenu}>
                        {t('All Class Schedule')}
                    </NavLink>*/}
                </NavDropdown>

                {/* 3. ANALYTICS Dropdown */}
                <NavDropdown title={`📊 ${t('analytics')}`}>
                  <NavLink to="/allsubjectAnalysis" className={dropdownLinkClass} onClick={closeMenu}>
                    {t('class_matrix')}
                  </NavLink>
                  <NavLink to="/subject-performance" className={dropdownLinkClass} onClick={closeMenu}>
                    {t('subject_performance')}
                  </NavLink>
                  <NavLink to="/analytics" className={dropdownLinkClass} onClick={closeMenu}>
                    {t('subject_detail')}
                  </NavLink>
                  <NavLink to="/at-risk" className={dropdownLinkClass} onClick={closeMenu}>
                    ⚠️ {t('at_risk')}
                  </NavLink>
                </NavDropdown>

                {/* 4. ADMIN Dropdown */}
                {currentUser.role === 'admin' && (
                  <NavDropdown title={`⚙️ ${t('admin')}`}>
                    <NavLink to="/subjects" className={dropdownLinkClass} onClick={closeMenu}>
                        {t('manage_subjects')}
                    </NavLink>
                    <NavLink to="/admin/users" className={dropdownLinkClass} onClick={closeMenu}>
                        {t('manage_staff')}
                    </NavLink>
                    <NavLink to={'/supportivelist'} className={dropdownLinkClass} onClick={closeMenu}>
                        Supportive Subjects
                    </NavLink>
                    <NavLink to="/send_notification" className={dropdownLinkClass} onClick={closeMenu}>
                        📢 Send Notification
                    </NavLink>
                  </NavDropdown>
                )}
              </>
            )}
          </div>
          
          {/* Right Side Icons (Library, Bell, Language, Logout) */}
          <div className="mt-4 md:mt-0 flex items-center gap-4 position-relative">
            
            {(currentUser || currentStudent) && (
                <>
                    <NavLink to="/library" className={navLinkClass} onClick={closeMenu}>
                        📚 {t('school_library')}
                    </NavLink>
                    {/* Notification Bell */}
                    <NotificationBell />
                </>
            )}
            
            <LanguageSwitcher />

            {(currentUser || currentStudent) ? (
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                {t('logout')}
              </button>
            ) : (
              <NavLink to="/login" className={navLinkClass} onClick={closeMenu}>
                {t('login')}
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;