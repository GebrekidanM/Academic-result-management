import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
import subjectService from '../services/subjectService';


function formatGrade(input) {
  if (!input) return input;

  input = input.trim().toLowerCase();

  input = input.charAt(0).toUpperCase() + input.slice(1);

  input = input.replace(/(\d)([a-z])/g, (match, num, letter) => {
    return num + letter.toUpperCase();
  });

  return input;
}

const SubjectListPage = () => {
    const { t } = useTranslation();
    const [gradingType, setGradingType] = useState('numeric');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchedGrade, setSearchedGrade] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Add Form State
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectCode, setNewSubjectCode] = useState('');

    // --- Handlers ---
    const fetchSubjects = async (grade) => {
        setLoading(true);
        setError(null);
        try {
            // Ideally backend should support ?gradeLevel=...
            const response = await subjectService.getAllSubjects();
            const allSubs = response.data.data || response.data; // Handle { data: [...] } or [...]
            
            // Case-insensitive clean filter
            const filtered = allSubs.filter(s => 
                s.gradeLevel.trim().toLowerCase() === grade.trim().toLowerCase()
            );
            
            setSubjects(filtered);
        } catch (err) {
            console.error(err);
            setError(t('error_fetching_subjects') || "Failed to load subjects.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        
        // Allow searching by currently selected grade if input is empty but state exists
        const gradeToSearch = searchTerm || searchedGrade;
        
        if (!gradeToSearch) {
            setError(t('select_class_warning') || "Please enter a grade level first."); 
            return;
        }

        setSearchedGrade(gradeToSearch);
        fetchSubjects(gradeToSearch);
    };
    
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!searchedGrade) return;
        try {
            const newSubjectData = {
                name: newSubjectName,
                code: newSubjectCode,
                gradeLevel: formatGrade(searchedGrade),
                gradingType: gradingType
            };
            await subjectService.createSubject(newSubjectData);
            
            // Clear form and refresh list
            setNewSubjectName('');
            setNewSubjectCode('');
            setGradingType('numeric');
            alert(t('success_subject_created') || "Subject created successfully!");
            
            // Refresh the list for the current grade
            fetchSubjects(searchedGrade);

        } catch (err) {
            setError(err.response?.data?.message || t('error_creating_subject') || "Error creating subject.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('confirm_delete') || "Are you sure you want to delete this subject?")) {
            try {
                await subjectService.deleteSubject(id);
                // Refresh list
                fetchSubjects(searchedGrade);
            } catch (err) {
                alert(t('error_deleting') || "Error deleting subject.");
            }
        }
    };
    
    // --- Styles ---
    const textInput = "shadow-sm border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";
    const buttonPrimary = "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200 shadow-sm";
    const buttonSuccess = "bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm";

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg min-h-screen">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b pb-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">{t('manage_subjects')}</h2>
                    <p className="text-gray-500 text-sm mt-1">{t('manage_subjects_subtitle') || "Create, edit, and organize curriculum subjects."}</p>
                </div>
                <Link to="/subjects/import" className={`${buttonSuccess} flex items-center gap-2 mt-4 md:mt-0`}>
                    <span>📂</span> {t('import_excel')}
                </Link>
            </div>

            {/* Search Bar */}
            <div className="p-6 bg-blue-50 rounded-xl border border-blue-100 mb-8 shadow-inner">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-end gap-4">
                    <div className="grow w-full">
                        <label htmlFor="gradeSearch" className="block text-sm font-bold text-blue-900 mb-1">
                            {t('search_grade_placeholder') || "Search for a Grade Level (e.g. Grade 4A)"}
                        </label>
                        <div className="relative">
                            <input
                                id="gradeSearch"
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="e.g. Grade 4A"
                                className={textInput}
                            />
                            {searchedGrade && (
                                <button 
                                    type="button"
                                    onClick={() => { setSearchTerm(''); setSearchedGrade(''); setSubjects([]); }}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-red-500 font-bold"
                                    title="Clear Search"
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

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Content Area */}
            {searchedGrade && !loading && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT: List of Subjects */}
                    <div className="lg:col-span-2">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-bold text-gray-800">
                                {t('subjects_for')} <span className="text-blue-600 bg-blue-50 px-2 rounded">"{searchedGrade}"</span>
                            </h3>
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{subjects.length} Found</span>
                        </div>
                        
                        {subjects.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {subjects.map(sub => (
                                    <div key={sub._id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-800">{sub.name}</h4>
                                            {sub.code ? (
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">{sub.code}</span>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No Code</span>
                                            )}
                                        </div>
                                        <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link 
                                                to={`/subjects/edit/${sub._id}`} 
                                                className="bg-gray-100 hover:bg-blue-100 text-blue-600 p-2 rounded-full transition-colors"
                                                title={t('edit')}
                                            >
                                                ✏️
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(sub._id)} 
                                                className="bg-gray-100 hover:bg-red-100 text-red-600 p-2 rounded-full transition-colors"
                                                title={t('delete')}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-gray-400">
                                <span className="text-4xl mb-2">📚</span>
                                <p>{t('no_subjects_found') || "No subjects found for this grade."}</p>
                                <p className="text-sm mt-1">Use the form on the right to add one.</p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Add Form */}
                    <div>
                         <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-gray-200 shadow-md sticky top-6">
                            <h4 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                                <span className="bg-green-100 text-green-700 p-1 rounded text-xs">＋</span> {t('add_new_subject')}
                            </h4>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{t('subject_name')}</label>
                                    <input 
                                        type="text"
                                        value={newSubjectName}
                                        onChange={(e) => setNewSubjectName(e.target.value)}
                                        placeholder={t('subject_name_placeholder') || "e.g. Mathematics"}
                                        className={textInput}
                                        required
                                    />
                                </div>
                                <div>
                                     <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{t('subject_code')} (Optional)</label>
                                     <input 
                                        type="text"
                                        value={newSubjectCode}
                                        onChange={(e) => setNewSubjectCode(e.target.value)}
                                        placeholder={t('subject_code_placeholder') || "e.g. MATH-04"}
                                        className={textInput}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                                        {t('grading_system') || "Grading System"}
                                    </label>
                                    <select 
                                        value={gradingType} 
                                        onChange={(e) => setGradingType(e.target.value)}
                                        className={textInput}
                                    >
                                        <option value="numeric">Numeric (0 - 100)</option>
                                        <option value="descriptive">Descriptive (A, B, C / E, VG, G)</option>
                                    </select>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Select 'Descriptive' for KG subjects like Handwriting.
                                    </p>
                                </div>
                                
                                <div className="pt-4 mt-2 border-t">
                                    <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                                        Adding to: <strong className="text-blue-600 bg-blue-50 px-1 rounded">{searchedGrade}</strong>
                                    </p>
                                    <button type="submit" className={`w-full ${buttonSuccess} py-3 shadow-lg transform active:scale-95 transition-transform`}>
                                        {t('save_subject')}
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