import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import studentAuthService from '../services/studentAuthService';

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
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="md:absolute right-0 mt-2 w-full md:w-48 bg-white rounded-md shadow-lg z-50 overflow-hidden py-1 text-gray-800">
          {children}
        </div>
      )}
    </div>
  );
};

// --- Main Navbar Component ---
const Navbar = ({ isOpen, setIsOpen }) => {
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
    navigate('/login');
    window.location.reload();
  };

  const closeMenu = () => setIsOpen(false);

  // Styles for links INSIDE dropdowns (Dark text)
  const dropdownLinkClass = "block px-4 py-2 text-sm hover:bg-pink-100 hover:text-pink-600 transition-colors border-b md:border-none border-gray-100";
  // Styles for standalone links (White text)
  const navLinkClass = ({ isActive }) => 
    `block md:inline-block text-white font-bold py-2 px-3 rounded-md transition-colors whitespace-nowrap ${isActive ? 'bg-pink-600' : 'hover:bg-gray-700'}`;

  return (
    <nav className="bg-gray-900 min-h-[4rem] p-2 shadow-lg sticky top-0 z-50 font-sans print:hidden">
      <div className="container mx-auto flex items-center justify-between flex-wrap">
        
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 text-white mr-6">
          <Link to={currentUser ? "/" : "/parent/dashboard"} onClick={closeMenu} className="font-bold text-xl tracking-tight flex items-center gap-2">
            🏫 Freedom School
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
          <div className="text-sm md:flex-grow md:flex md:items-center md:gap-2 mt-4 md:mt-0">
            
            {currentUser && (
              <>
                {/* 1. Standalone Link */}
                <NavLink to="/students" className={navLinkClass} onClick={closeMenu}>Students</NavLink>

                {/* 2. ACADEMICS Dropdown (Work) */}
                <NavDropdown title="📝 Academics">
                  <NavLink to="/grade-sheet" className={dropdownLinkClass} onClick={closeMenu}>Enter Grades (ውጤት)</NavLink>
                  <NavLink to="/manage-assessments" className={dropdownLinkClass} onClick={closeMenu}>Manage Assessments</NavLink>
                  {(currentUser.role === 'admin' || currentUser.homeroomGrade) && (
                    <NavLink to="/roster" className={dropdownLinkClass} onClick={closeMenu}>Class Roster</NavLink>
                  )}
                </NavDropdown>

                {/* 3. ANALYTICS Dropdown (Reports) */}
                <NavDropdown title="📊 Analytics">
                  <NavLink to="/allsubjectAnalysis" className={dropdownLinkClass} onClick={closeMenu}>Class Matrix (All Subjects)</NavLink>
                  <NavLink to="/subject-performance" className={dropdownLinkClass} onClick={closeMenu}>Subject Leaderboard</NavLink>
                  <NavLink to="/analytics" className={dropdownLinkClass} onClick={closeMenu}>Single Subject Detail</NavLink>
                  <NavLink to="/at-risk" className={dropdownLinkClass} onClick={closeMenu}>At-Risk Students</NavLink>
                </NavDropdown>

                {/* 4. ADMIN Dropdown (Config) */}
                {currentUser.role === 'admin' && (
                  <NavDropdown title="⚙️ Admin">
                    <NavLink to="/subjects" className={dropdownLinkClass} onClick={closeMenu}>Manage Subjects</NavLink>
                    <NavLink to="/admin/users" className={dropdownLinkClass} onClick={closeMenu}>Manage Staff</NavLink>
                  </NavDropdown>
                )}
              </>
            )}
          </div>

          {/* Logout Button */}
          <div className="mt-4 md:mt-0 md:ml-4">
            {currentUser || currentStudent ? (
              <button
                onClick={handleLogout}
                className="w-full md:w-auto bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Logout
              </button>
            ) : (
              <NavLink to="/login" className={navLinkClass} onClick={closeMenu}>Login</NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;