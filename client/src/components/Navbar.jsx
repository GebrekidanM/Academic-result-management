// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import studentAuthService from '../services/studentAuthService';
import { useNotifications } from '../context/NotificationContext';

const Navbar = () => {
    // --- State Management ---
    const [currentUser, setCurrentUser] = useState(null);
    const [currentStudent, setCurrentStudent] = useState(null);
    const [isOpen, setIsOpen] = useState(false); // For the mobile menu
    const [showNotifications, setShowNotifications] = useState(false); // For the notifications dropdown
    const navigate = useNavigate();
    const { notifications, unreadCount, markAllAsRead } = useNotifications();

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
    
    const closeMobileMenu = () => {
        setIsOpen(false);
    };

    const handleNotificationClick = () => {
        setShowNotifications(prev => !prev);
        if (unreadCount > 0) {
            markAllAsRead(); // Mark as read when the dropdown is opened
        }
    };

    // --- Style Definitions ---
    const linkClasses = "block md:inline-block text-white font-bold py-2 px-3 rounded-md transition-colors duration-200 whitespace-nowrap";
    const activeLinkClasses = "bg-pink-600";
    const navLink = ({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : 'hover:bg-gray-700'}`;
    
    return (
        <nav className="bg-gray-800 p-1 shadow-md sticky top-0 z-50">
            <div className="container mx-auto flex items-center justify-between flex-wrap">
                
                <div className="flex items-center flex-shrink-0 text-white mr-6">
                    {
                        currentUser ? (
                            <Link to="/" onClick={closeMobileMenu} className="font-bold text-xl tracking-tight">Freedom School</Link>
                        ) : (
                        <Link to="/parent/dashboard" onClick={closeMobileMenu} className="font-bold text-xl tracking-tight">Freedom School</Link>
                        )
                    }
                </div>
                <div className="block md:hidden">
                    <button onClick={() => setIsOpen(!isOpen)} className="flex items-center px-3 py-2 border rounded text-gray-200 border-gray-400 hover:text-white hover:border-white">
                        <svg className="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Menu</title><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/></svg>
                    </button>
                </div>

                <div className={`w-full md:flex md:items-center md:w-auto ${isOpen ? 'block' : 'hidden'}`}>
                    <div className="text-sm md:flex-grow md:flex md:items-center md:gap-2">
                        {currentUser && (
                            <>
                                <NavLink to="/students" className={navLink} onClick={closeMobileMenu}>Students</NavLink>
                                {(currentUser.role === 'admin' || currentUser.homeroomGrade) && (
                                    <NavLink to="/roster" className={navLink} onClick={closeMobileMenu}>Yearly Roster</NavLink>
                                )}
                                <NavLink to="/analytics" className={navLink} onClick={closeMobileMenu}>Analytics</NavLink>
                                <NavLink to="/grade-sheet" className={navLink} onClick={closeMobileMenu}>Grade Sheet</NavLink>
                                <NavLink to="/manage-assessments" className={navLink} onClick={closeMobileMenu}>Assessments</NavLink>
                                {currentUser.role === 'admin' && (
                                    <>
                                        <NavLink to="/subjects" className={navLink} onClick={closeMobileMenu}>Subjects</NavLink>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex items-center gap-4">
                        {currentUser ? (
                            <>
                                <div className="relative">
                                    <button onClick={handleNotificationClick} className="relative text-gray-300 hover:text-white transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341A6.002 6.002 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">{unreadCount}</span>
                                        )}
                                    </button>
                                    {showNotifications && (
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 border">
                                            <div className="p-2 flex justify-between items-center border-b"><h3 className="font-bold text-gray-800">Notifications</h3></div>
                                            <ul className="max-h-96 overflow-y-auto">
                                                {notifications.length > 0 ? (
                                                    notifications.map((n, index) => (
                                                        <li key={index} className="border-b last:border-b-0">
                                                            <Link to={n.link || '/'} onClick={() => { setShowNotifications(false); closeMobileMenu(); }} className="block p-3 hover:bg-gray-50">
                                                                <p className="text-sm text-gray-700">{n.message}</p>
                                                                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                                            </Link>
                                                        </li>
                                                    ))
                                                ) : <li className="p-4 text-center text-sm text-gray-500">No new notifications.</li>}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <button onClick={handleLogout} className="w-full md:w-auto bg-transparent text-pink-400 font-bold py-2 px-4 border border-pink-400 rounded-md hover:bg-pink-400 hover:text-white transition-colors duration-200">Logout</button>
                            </>
                        ) : currentStudent ? (
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <button onClick={() => setShowNotifications(prev => !prev)} className="relative text-gray-300 ...">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341A6.002 6.002 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">{unreadCount}</span>
                                        )}
                                    </button>
                                    
                                    {showNotifications && (
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 border">
                                            <div className="p-2 flex justify-between items-center border-b"><h3 className="font-bold text-gray-800">Notifications</h3></div>
                                            <ul className="max-h-96 overflow-y-auto">
                                                {notifications.length > 0 ? (
                                                    notifications.map((n, index) => (
                                                        <li key={index} className="border-b last:border-b-0">
                                                            <Link to={n.link || '/'} onClick={() => { setShowNotifications(false); closeMobileMenu(); }} className="block p-3 hover:bg-gray-50">
                                                                <p className="text-sm text-gray-700">{n.message}</p>
                                                                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                                                            </Link>
                                                        </li>
                                                    ))
                                                ) : <li className="p-4 text-center text-sm text-gray-500">No new notifications.</li>}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                
                                <button onClick={handleLogout} className="w-full md:w-auto bg-transparent text-pink-400 font-bold py-2 px-4 border border-pink-400 rounded-md hover:bg-pink-400 hover:text-white transition-colors duration-200">Logout</button>
                            </div>
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