import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import Hook
import subjectService from '../services/subjectService';

const SubjectListPage = () => {
    const { t } = useTranslation(); // <--- Initialize Hook

    // --- State ---
    const [searchTerm, setSearchTerm] = useState('');
    const [searchedGrade, setSearchedGrade] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Add Form State
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectCode, setNewSubjectCode] = useState('');

    // --- Handlers ---
    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        
        const gradeToSearch = searchTerm || searchedGrade;
        if (!gradeToSearch) {
            setError(t('select_class')); // Reuse existing key
            return;
        }

        setLoading(true);
        setError(null);
        setSubjects([]);
        
        try {
            // NOTE: Ensure your backend supports filtering by query param like ?gradeLevel=...
            // If your service expects just getAll(), you might need to filter client-side here.
            // Assuming getAllSubjects accepts a query:
            const response = await subjectService.getAllSubjects();
            const allSubs = response.data.data || response.data;
            
            // Client-side filter to be safe/consistent with other pages
            const filtered = allSubs.filter(s => s.gradeLevel.toLowerCase() === gradeToSearch.toLowerCase());
            
            setSubjects(filtered);
            setSearchedGrade(gradeToSearch);
        } catch (err) {
            setError(t('error'));
        } finally {
            setLoading(false);
        }
    };
    
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const newSubjectData = {
                name: newSubjectName,
                code: newSubjectCode,
                gradeLevel: searchedGrade // Auto-assign to current view
            };
            await subjectService.createSubject(newSubjectData);
            setNewSubjectName('');
            setNewSubjectCode('');
            alert(t('success_save'));
            handleSearch(); // Refresh
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('delete_confirm'))) {
            try {
                await subjectService.deleteSubject(id);
                handleSearch();
            } catch (err) {
                alert(t('error'));
            }
        }
    };
    
    // --- Styles ---
    const textInput = "shadow-sm border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500";
    const buttonPrimary = "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200";
    const buttonSuccess = "bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200";

    return (
        <div className="bg-white p-6 rounded-lg shadow-md min-h-screen">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">{t('manage_subjects')}</h2>
                <Link to="/subjects/import" className={`${buttonSuccess} flex items-center gap-2`}>
                    <span>📂</span> {t('import_excel')}
                </Link>
            </div>

            {/* Search Bar */}
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 mb-8">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-end gap-4">
                    <div className="flex-grow w-full">
                        <label htmlFor="gradeSearch" className="block text-sm font-bold text-gray-700 mb-1">{t('search_grade_placeholder')}</label>
                        <div className="relative">
                            <input
                                id="gradeSearch"
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="e.g. Grade 4"
                                className={textInput}
                                required
                            />
                            {searchedGrade && (
                                <button 
                                    type="button"
                                    onClick={() => { setSearchTerm(''); setSearchedGrade(''); setSubjects([]); }}
                                    className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                    <button type="submit" className={buttonPrimary} disabled={loading}>
                        {loading ? t('loading') : t('load_subjects')}
                    </button>
                </form>
            </div>

            {error && <p className="text-red-500 text-center mb-4 bg-red-50 p-2 rounded">{error}</p>}

            {/* Content Area */}
            {searchedGrade && !loading && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT: List */}
                    <div className="lg:col-span-2">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">
                            {t('subjects_for')} <span className="text-blue-600">"{searchedGrade}"</span>
                        </h3>
                        
                        {subjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {subjects.map(sub => (
                                    <div key={sub._id} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group">
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-800">{sub.name}</h4>
                                            {sub.code && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{sub.code}</span>}
                                        </div>
                                        <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link 
                                                to={`/subjects/edit/${sub._id}`} 
                                                className="text-blue-500 hover:bg-blue-50 p-2 rounded"
                                                title={t('edit')}
                                            >
                                                ✏️
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(sub._id)} 
                                                className="text-red-500 hover:bg-red-50 p-2 rounded"
                                                title={t('delete')}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-10 bg-gray-50 rounded border-dashed border-2 border-gray-300 text-gray-400">
                                {t('no_subjects_found')}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Add Form */}
                    <div>
                         <form onSubmit={handleCreate} className="bg-blue-50 p-6 rounded-xl border border-blue-100 sticky top-4">
                            <h4 className="font-bold text-lg text-blue-900 mb-4 border-b border-blue-200 pb-2">
                                + {t('add')}
                            </h4>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-gray-700">{t('subject_name')}</label>
                                    <input 
                                        type="text"
                                        value={newSubjectName}
                                        onChange={(e) => setNewSubjectName(e.target.value)}
                                        placeholder={t('subject_name_placeholder')}
                                        className={textInput}
                                        required
                                    />
                                </div>
                                <div>
                                     <label className="text-sm font-bold text-gray-700">{t('subject_code')}</label>
                                     <input 
                                        type="text"
                                        value={newSubjectCode}
                                        onChange={(e) => setNewSubjectCode(e.target.value)}
                                        placeholder={t('subject_code_placeholder')}
                                        className={textInput}
                                    />
                                </div>
                                
                                <div className="pt-2">
                                    <p className="text-xs text-gray-500 mb-2">
                                        Adding to: <strong>{searchedGrade}</strong>
                                    </p>
                                    <button type="submit" className={`w-full ${buttonSuccess}`}>
                                        {t('save')}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                </div>
            )}
        </div>
    );
};

export default SubjectListPage;