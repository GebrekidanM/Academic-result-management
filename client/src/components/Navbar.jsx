// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import studentAuthService from '../services/studentAuthService';

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getCurrentUser();
    const student = studentAuthService.getCurrentStudent();
    if (user) setCurrentUser(user);
    else if (student) setCurrentStudent(student);
  }, []);

  const handleLogout = () => {
    if (currentUser) {
      authService.logout();
      setCurrentUser(null);
      navigate('/login');
    } else if (currentStudent) {
      studentAuthService.logout();
      setCurrentStudent(null);
      navigate('/parent-login');
    }
    window.location.reload();
  };

  const closeMobileMenu = () => setIsOpen(false);

  const linkClasses =
    "block md:inline-block text-white font-bold py-2 px-3 rounded-md transition-colors duration-200 whitespace-nowrap";
  const activeLinkClasses = "bg-pink-600";
  const navLink = ({ isActive }) =>
    `${linkClasses} ${isActive ? activeLinkClasses : 'hover:bg-gray-700'}`;

  return (
    <nav className="bg-gray-800 p-1 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between flex-wrap">
        
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 text-white mr-6">
          {currentUser ? (
            <Link to="/" onClick={closeMobileMenu} className="font-bold text-xl tracking-tight">
              Freedom School
            </Link>
          ) : (
            <Link to="/parent/dashboard" onClick={closeMobileMenu} className="font-bold text-xl tracking-tight">
              Freedom School
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="block md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center px-3 py-2 border rounded text-gray-200 border-gray-400 hover:text-white hover:border-white"
          >
            <svg
              className="fill-current h-3 w-3"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>Menu</title>
              <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
            </svg>
          </button>
        </div>

        {/* Links */}
        <div className={`w-full md:flex md:items-center md:w-auto ${isOpen ? 'block' : 'hidden'}`}>
          <div className="text-sm md:flex-grow md:flex md:items-center md:gap-2">
            {currentUser && (
              <>
                <NavLink to="/students" className={navLink} onClick={closeMobileMenu}>Students</NavLink>
                {(currentUser.role === 'admin' || currentUser.homeroomGrade) && (
                  <NavLink to="/roster" className={navLink} onClick={closeMobileMenu}>Roster</NavLink>
                )}
                <NavLink to="/analytics" className={navLink} onClick={closeMobileMenu}>ትንተና</NavLink>
                <NavLink to="/grade-sheet" className={navLink} onClick={closeMobileMenu}>ውጤት ለመሙላት</NavLink>
                <NavLink to="/manage-assessments" className={navLink} onClick={closeMobileMenu}>Assessments</NavLink>
                {currentUser.role === 'admin' && (
                  <NavLink to="/subjects" className={navLink} onClick={closeMobileMenu}>Subjects</NavLink>
                )}
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="mt-4 md:mt-0 flex items-center gap-4">
            {currentUser || currentStudent ? (
              <button
                onClick={handleLogout}
                className="w-full md:w-auto bg-transparent text-pink-400 font-bold py-2 px-4 border border-pink-400 rounded-md hover:bg-pink-400 hover:text-white transition-colors duration-200"
              >
                Logout
              </button>
            ) : (
              <>
                <NavLink to="/login" className={navLink} onClick={closeMobileMenu}>Teacher/Admin Login</NavLink>
                <NavLink to="/parent-login" className={navLink} onClick={closeMobileMenu}>Parent Login</NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
