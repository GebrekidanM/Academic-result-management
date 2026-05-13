import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import authService from '../../services/authService';
import studentAuthService from '../../services/studentAuthService';
import LanguageSwitcher from '../LanguageSwitcher';
import NotificationBell from '../NotificationBell';
import { AdminMenu } from './AdminMenu';
import { TeacherMenu } from './TeacherMenu';
import { navLinkClass, dropdownLinkClass,NavDropdown } from './NavHelpers';

const Navbar = ({ isOpen, setIsOpen }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
    const [openDropdown, setOpenDropdown] = useState(null);

    const closeAll = () => { setIsOpen(false); setOpenDropdown(null); };

    const handleLogout = () => {
        authService.logout();
        studentAuthService.logout();
        navigate('/');
        window.location.reload();
    };

    return (
        <nav className="bg-gray-900 min-h-16 p-2 shadow-lg sticky top-0 z-50">
            <div className="container mx-auto flex items-center justify-between flex-wrap">
        
                <div onClick={() => setIsOpen(false)} className="text-white font-bold text-xl"><Link to="/">{t('app_name')}</Link></div>
                
                <div className={`w-full md:flex md:items-center md:w-auto ${isOpen ? 'block' : 'hidden'}`}>
                    <div className="md:flex md:items-center">
                        {currentUser?.role === 'admin' && <AdminMenu t={t} closeMenu={closeAll} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} dropdownLinkClass={dropdownLinkClass} />}
                        {currentUser?.role === 'teacher' && <TeacherMenu t={t} currentUser={currentUser} NavDropdown={NavDropdown} closeMenu={closeAll} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} dropdownLinkClass={dropdownLinkClass} navLinkClass={navLinkClass} />}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {currentUser && <NotificationBell />}
                    <LanguageSwitcher />
                    {currentUser ? (
                        <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded text-sm">{t('logout')}</button>
                    ) : (
                        <Link to="/login" className="bg-green-600 text-white px-4 py-2 rounded text-sm">{t('login')}</Link>
                    )}
                    {/* Mobile Toggle */}
                    <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>☰</button>
                </div>
            </div>
        </nav>
    );
};
export default Navbar;