import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function LoggedOut() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    
    // --- STATE FOR DYNAMIC DESCRIPTION ---
    const [activeTab, setActiveTab] = useState('teachers'); // 'teachers', 'parents', 'admins'

    // Helper for navigation
    const handleDemoLogin = (role, username, password) => {
        navigate('/login', { 
            state: { 
                autoFill: { username, password, role } 
            } 
        });
    };

    // --- DYNAMIC CONTENT CONFIGURATION ---
    const content = {
        teachers: {
            title: t('desc_teachers_title'),
            body: t('desc_teachers_body'),
            icon: "👩‍🏫",
            color: "bg-blue-100 text-blue-600",
            borderColor: "border-blue-500"
        },
        parents: {
            title: t('desc_parents_title'),
            body: t('desc_parents_body'),
            icon: "👨‍👩‍👧‍👦",
            color: "bg-green-100 text-green-600",
            borderColor: "border-green-500"
        },
        admins: {
            title: t('desc_admins_title'),
            body: t('desc_admins_body'),
            icon: "⚙️",
            color: "bg-purple-100 text-purple-600",
            borderColor: "border-purple-500"
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            
            {/* --- Hero Section --- */}
            <div className="text-center py-16 md:py-24 px-4 bg-white border-b border-gray-200">
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-2">
                    {t('welcome_to')} <span className="text-blue-900 transparent bg-clip-text bg-gradient-to-r from-blue-900 to-blue-600">{t('app_name')}</span>
                </h1>
                <h2 className="text-xl md:text-3xl font-bold text-gray-500 tracking-tight">
                    {t('school_management_system')}
                </h2>
                <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 leading-relaxed">
                    {t('hero_description')}
                </p>
            </div>

            {/* --- NEW: DYNAMIC DESCRIPTION SECTION --- */}
            <div className="py-16 px-4 max-w-5xl mx-auto">
                <h3 className="text-3xl font-bold text-center text-gray-800 mb-8">
                    {t('about_section_title')}
                </h3>

                {/* Tabs */}
                <div className="flex justify-center gap-4 mb-8 flex-wrap">
                    <button 
                        onClick={() => setActiveTab('teachers')}
                        className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'teachers' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-white text-gray-600 border hover:bg-gray-100'}`}
                    >
                        {t('about_tab_teachers')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('parents')}
                        className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'parents' ? 'bg-green-600 text-white shadow-lg scale-105' : 'bg-white text-gray-600 border hover:bg-gray-100'}`}
                    >
                        {t('about_tab_parents')}
                    </button>
                    <button 
                        onClick={() => setActiveTab('admins')}
                        className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'admins' ? 'bg-purple-600 text-white shadow-lg scale-105' : 'bg-white text-gray-600 border hover:bg-gray-100'}`}
                    >
                        {t('about_tab_admins')}
                    </button>
                </div>

                {/* Dynamic Content Card */}
                <div className={`bg-white rounded-2xl p-8 shadow-xl border-l-8 ${content[activeTab].borderColor} transition-all duration-300 transform`}>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl ${content[activeTab].color}`}>
                            {content[activeTab].icon}
                        </div>
                        <div className="text-center md:text-left">
                            <h4 className="text-2xl font-bold text-gray-800 mb-2">
                                {content[activeTab].title}
                            </h4>
                            <p className="text-gray-600 text-lg">
                                {content[activeTab].body}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Features Grid (Existing) --- */}
            <div className="py-16 bg-white border-t border-gray-200">
                <div className="container mx-auto px-6">
                    <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">{t('powerful_features')}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center p-8 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow">
                            <div className="text-4xl mb-4">📊</div>
                            <h4 className="font-bold text-xl mb-2 text-gray-800">{t('feature_reporting_title')}</h4>
                            <p className="text-gray-600">{t('feature_reporting_desc')}</p>
                        </div>
                        <div className="text-center p-8 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow">
                            <div className="text-4xl mb-4">📴</div>
                            <h4 className="font-bold text-xl mb-2 text-gray-800">{t('feature_offline_title')}</h4>
                            <p className="text-gray-600">{t('feature_offline_desc')}</p>
                        </div>
                        <div className="text-center p-8 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow">
                            <div className="text-4xl mb-4">🔒</div>
                            <h4 className="font-bold text-xl mb-2 text-gray-800">{t('feature_security_title')}</h4>
                            <p className="text-gray-600">{t('feature_security_desc')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Demo Login Section --- */}
            <div className="bg-gray-900 text-white py-16">
                <div className="container mx-auto text-center px-6">
                    <h2 className="text-3xl font-bold mb-4">{t('demo_title')}</h2>
                    <p className="text-gray-400 mb-8 max-w-xl mx-auto">{t('demo_desc')}</p>
                    
                    <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                        <button
                            onClick={() => handleDemoLogin('staff', 'admin', 'admin123')}
                            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 font-bold py-3 px-8 rounded-lg shadow-lg"
                        >
                            Login as Admin
                        </button>
                        <button
                            onClick={() => handleDemoLogin('staff', 'teacher', 'teacher123')}
                            className="w-full md:w-auto bg-gray-700 hover:bg-gray-600 font-bold py-3 px-8 rounded-lg shadow-lg"
                        >
                            Login as Teacher
                        </button>
                        <button
                            onClick={() => handleDemoLogin('parent', 'FKS-2018-001', '123456')}
                            className="w-full md:w-auto bg-gray-700 hover:bg-gray-600 font-bold py-3 px-8 rounded-lg shadow-lg"
                        >
                            Login as Parent
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoggedOut;