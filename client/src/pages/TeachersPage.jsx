import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import Hook
import userService from '../services/userService';
import authService from '../services/authService';

const TeachersPage = () => {
    const { t } = useTranslation();
    const [currentUser] = useState(authService.getCurrentUser());
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterLevel, setFilterLevel] = useState(''); // '' = All

    // --- Fetch Teachers ---
    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                // If the backend supports filtering by query, you can pass filterLevel here.
                // For now, we fetch all and filter client-side for smoother UI.
                const res = await userService.getTeachers(); 
                setTeachers(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTeachers();
    }, []);

    // --- Filter Logic ---
    const filteredTeachers = useMemo(() => {
        if (!filterLevel) return teachers;
        return teachers.filter(t => t.schoolLevel === filterLevel);
    }, [teachers, filterLevel]);

    // --- Helper: Level Badge Color ---
    const getLevelColor = (level) => {
        switch (level) {
            case 'kg': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'primary': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'High School': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) return <div className="p-10 text-center">{t('loading')}</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b pb-4 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">
                    {t('teachers_directory')}
                </h1>

                {/* Level Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-500 uppercase">{t('filter_by')}:</span>
                    <select 
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">{t('level_all')}</option>
                        <option value="kg">{t('level_kg')}</option>
                        <option value="primary">{t('level_primary')}</option>
                        <option value="High School">{t('level_high_school')}</option>
                    </select>
                </div>
            </div>

            {/* --- GRID --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeachers && filteredTeachers.map(teacher => (
                    <div
                        key={teacher._id}
                        className="bg-white shadow-sm border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-300 flex flex-col"
                    >
                        {/* Header: Name & Badge */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                {/* Avatar */}
                                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-100">
                                    {teacher.fullName.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 leading-tight">
                                        {teacher.fullName}
                                    </h2>
                                    <p className="text-xs text-gray-500">@{teacher.username}</p>
                                </div>
                            </div>
                            {/* School Level Badge */}
                            {teacher.schoolLevel && (
                                <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${getLevelColor(teacher.schoolLevel)}`}>
                                    {teacher.schoolLevel}
                                </span>
                            )}
                        </div>

                        {/* Homeroom Info */}
                        <div className="mb-4 text-sm">
                            <span className="font-bold text-gray-600 block mb-1">{t('homeroom_teacher')}:</span> 
                            {teacher.homeroomGrade ? (
                                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold border border-yellow-200 text-xs">
                                    🏠 {teacher.homeroomGrade}
                                </span>
                            ) : (
                                <span className="text-gray-400 italic text-xs">N/A</span>
                            )}
                        </div>

                        {/* Subjects List */}
                        <div className="mt-auto pt-4 border-t border-gray-100">
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">{t('subjects_taught')}</h3>
                            
                            {teacher.subjectsTaught && teacher.subjectsTaught.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {teacher.subjectsTaught.map((item) => (
                                        item.subject ? (
                                            <Link 
                                                to={'/subject-roster'}
                                                state={{ subjectId: item.subject._id }}
                                                key={item.subject._id} 
                                                className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded border border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                                            >
                                                {item.subject.name} ({item.subject.gradeLevel})
                                            </Link>
                                        ) : null
                                    ))}
                                </div>
                            ) : (
                                <span className="text-xs text-gray-400 italic">{t('no_duties_assigned')}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {(!filteredTeachers || filteredTeachers.length === 0) && (
                <div className="text-center py-20">
                    <p className="text-gray-500 text-lg">{t('no_data_select_filters') || "No teachers found."}</p>
                </div>
            )}
        </div>
    );
};

export default TeachersPage;