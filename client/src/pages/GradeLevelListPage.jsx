// src/pages/GradeLevelListPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gradeLevelService from '@shared/services/gradeLevelService';
import authService from '@shared/services/authService';

const GradeLevelListPage = () => {
    const { t } = useTranslation();
    const [currentUser] = useState(authService.getCurrentUser());
    const [gradeLevels, setGradeLevels] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all'); // 'all' | 'kg' | 'primary' | 'high school'
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchGradeLevels = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await gradeLevelService.getAllGradeLevels();
            const fetched = res.data?.data || res.data || [];
            setGradeLevels(
                Array.isArray(fetched) 
                    ? fetched.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
                    : []
            );
        } catch (err) {
            console.error("Error fetching grade levels:", err);
            setError(err.response?.data?.message || t('error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGradeLevels();
    }, []);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;

        try {
            await gradeLevelService.deleteGradeLevel(id);
            setGradeLevels(prev => prev.filter(g => g._id !== id));
            alert(t('success_delete') || 'Grade level deleted successfully.');
        } catch (err) {
            alert(err.response?.data?.message || t('error'));
        }
    };

    // Filter Logic
    const filteredGradeLevels = useMemo(() => {
        const term = (searchTerm || '').trim().toLowerCase();

        return gradeLevels.filter(g => {
            const matchesCategory = selectedCategory === 'all' || g.schoolLevel === selectedCategory;
            const matchesSearch = term === '' || 
                (g.name || '').toLowerCase().includes(term) || 
                (g.roomNumber || '').toLowerCase().includes(term);

            return matchesCategory && matchesSearch;
        });
    }, [gradeLevels, selectedCategory, searchTerm]);

    if (loading) return <div className="p-10 text-center text-gray-600">{t('loading')}</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">{t('grade_levels') || 'Grade Levels & Classes'}</h2>
                    <p className="text-sm text-gray-500">{t('manage_classes_desc') || 'Manage registered school classrooms and grade categories'}</p>
                </div>

                {['admin', 'staff'].includes(currentUser.role) && (
                    <Link 
                        to="/admin/gradeLevel" 
                        className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded shadow transition-colors"
                    >
                        + {t('add_grade_level') || 'Add Grade Level'}
                    </Link>
                )}
            </div>

            {/* Category Cards / Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { id: 'all', label: t('all') || 'All Classes', count: gradeLevels.length, color: 'bg-white text-gray-800 border-gray-200' },
                    { id: 'kg', label: t('section_kg') || 'KG / Kindergarten', count: gradeLevels.filter(g => g.schoolLevel === 'kg').length, color: 'bg-purple-50 text-purple-800 border-purple-200' },
                    { id: 'primary', label: t('section_primary') || 'Primary (1-8)', count: gradeLevels.filter(g => g.schoolLevel === 'primary').length, color: 'bg-blue-50 text-blue-800 border-blue-200' },
                    { id: 'high school', label: t('section_high_school') || 'High School (9-12)', count: gradeLevels.filter(g => g.schoolLevel === 'high school').length, color: 'bg-indigo-50 text-indigo-800 border-indigo-200' }
                ].map(cat => (
                    <div 
                        key={cat.id} 
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${cat.color} ${selectedCategory === cat.id ? 'ring-2 ring-pink-500 font-bold shadow-md' : 'hover:shadow'}`}
                    >
                        <div className="text-xs uppercase font-bold opacity-70">{cat.label}</div>
                        <div className="text-2xl font-black mt-1">{cat.count} <span className="text-xs font-normal opacity-60">Classes</span></div>
                    </div>
                ))}
            </div>

            {/* Search Input */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <input 
                    type="text" 
                    placeholder={t('search_placeholder') || "Search class name or room number..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-80 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                            <tr>
                                <th className="px-4 py-3 text-left">{t('class_name') || 'Class Name'}</th>
                                <th className="px-4 py-3 text-left">{t('school_level') || 'Category'}</th>
                                <th className="px-4 py-3 text-left">{t('room_number') || 'Room'}</th>
                                <th className="px-4 py-3 text-center">{t('capacity') || 'Capacity'}</th>
                                {['admin', 'staff'].includes(currentUser.role) && (
                                    <th className="px-4 py-3 text-center">{t('actions')}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {filteredGradeLevels.length > 0 ? (
                                filteredGradeLevels.map(g => (
                                    <tr key={g._id} className="hover:bg-pink-50 transition-colors">
                                        <td className="px-4 py-4 font-bold text-gray-800">{g.name}</td>
                                        <td className="px-4 py-4 text-gray-600 uppercase text-xs">
                                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded font-semibold border border-gray-200">
                                                {g.schoolLevel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-gray-600 font-mono">{g.roomNumber || '-'}</td>
                                        <td className="px-4 py-4 text-center font-semibold text-gray-700">{g.capacity || 40}</td>
                                        {['admin', 'staff'].includes(currentUser.role) && (
                                            <td className="px-4 py-4 text-center space-x-3">
                                                <button 
                                                    onClick={() => handleDelete(g._id, g.name)}
                                                    className="text-red-600 hover:text-red-900 font-bold"
                                                >
                                                    {t('delete')}
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        {t('no_classes_found') || "No grade levels found matching your criteria."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GradeLevelListPage;