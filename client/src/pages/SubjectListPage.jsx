// src/pages/SubjectListPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
import subjectService from '@shared/services/subjectService';

function formatGrade(input) {
  if (!input) return input;
  let formatted = input.trim().toLowerCase();
  formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  formatted = formatted.replace(/(\d)([a-z])/g, (match, num, letter) => {
    return num + letter.toUpperCase();
  });
  return formatted;
}

const SubjectListPage = () => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchedGrade, setSearchedGrade] = useState('');
    const [allMasterSubjects, setAllMasterSubjects] = useState([]); // Master list of all subjects
    const [subjects, setSubjects] = useState([]); // Filtered subjects for active class
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Mode State: 'existing' vs 'new'
    const [addMode, setAddMode] = useState('existing'); 
    
    // Existing Subject Form State
    const [selectedMasterSubjectId, setSelectedMasterSubjectId] = useState('');
    
    // New Subject Form State
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectCode, setNewSubjectCode] = useState('');
    const [sessionsPerWeek, setSessionsPerWeek] = useState(3);

    // --- Handlers ---
    const fetchSubjects = async (grade) => {
        setLoading(true);
        setError(null);
        try {
            const response = await subjectService.getAllSubjects();
            const allSubs = response.data?.data || response.data || [];
            setAllMasterSubjects(allSubs); // Store master list
            
            const targetGrade = (grade || '').trim().toLowerCase();

            // Filter subjects assigned to searchedGrade
            const filtered = allSubs.filter(s => {
                if (Array.isArray(s.gradeLevels) && s.gradeLevels.length > 0) {
                    return s.gradeLevels.some(g => {
                        const name = typeof g.gradeLevel === 'object' ? g.gradeLevel?.name : g.gradeLevel;
                        return (name || '').trim().toLowerCase() === targetGrade;
                    });
                }

                if (s.gradeLevel) {
                    const name = typeof s.gradeLevel === 'object' ? s.gradeLevel?.name : s.gradeLevel;
                    return (name || '').trim().toLowerCase() === targetGrade;
                }

                return false;
            });
            
            setSubjects(filtered);
        } catch (err) {
            console.error("Error fetching subjects:", err);
            setError(t('error_fetching_subjects') || "Failed to load subjects.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        
        const gradeToSearch = searchTerm || searchedGrade;
        
        if (!gradeToSearch) {
            setError(t('select_class_warning') || "Please enter a grade level first."); 
            return;
        }

        setSearchedGrade(gradeToSearch);
        fetchSubjects(gradeToSearch);
    };

    // Assign existing subject or create new subject
    const handleSaveSubject = async (e) => {
        e.preventDefault();
        if (!searchedGrade) return;
        setError(null);

        try {
            let subjectNameToSend = '';
            let subjectCodeToSend = '';

            if (addMode === 'existing') {
                if (!selectedMasterSubjectId) {
                    setError("Please select a subject from the list.");
                    return;
                }
                const chosen = allMasterSubjects.find(s => s._id === selectedMasterSubjectId);
                if (chosen) {
                    subjectNameToSend = chosen.name;
                    subjectCodeToSend = chosen.code || '';
                }
            } else {
                if (!newSubjectName.trim()) {
                    setError("Please enter a subject name.");
                    return;
                }
                subjectNameToSend = newSubjectName.trim();
                subjectCodeToSend = newSubjectCode.trim();
            }

            const payload = {
                name: subjectNameToSend,
                code: subjectCodeToSend,
                gradeLevel: formatGrade(searchedGrade),
                sessionsPerWeek: Number(sessionsPerWeek) || 3
            };

            await subjectService.createSubject(payload);
            
            // Reset Form
            setSelectedMasterSubjectId('');
            setNewSubjectName('');
            setNewSubjectCode('');
            setSessionsPerWeek(3);
            
            alert(t('success_save') || "Subject assigned successfully!");
            fetchSubjects(searchedGrade);

        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('confirm_delete') || "Are you sure you want to delete this subject?")) {
            try {
                await subjectService.deleteSubject(id);
                fetchSubjects(searchedGrade);
            } catch (err) {
                alert(t('error_deleting') || "Error deleting subject.");
            }
        }
    };

    // Filter master subjects that are NOT YET assigned to this active class
    const unassignedMasterSubjects = React.useMemo(() => {
        if (!searchedGrade || allMasterSubjects.length === 0) return [];
        const currentAssignedNames = new Set(subjects.map(s => s.name.toLowerCase().trim()));
        
        return allMasterSubjects
            .filter(sub => !currentAssignedNames.has(sub.name.toLowerCase().trim()))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [allMasterSubjects, subjects, searchedGrade]);

    // --- Styles ---
    const textInput = "shadow-sm border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";
    const selectInput = "shadow-sm border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";
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
                    
                    {/* LEFT: List of Assigned Subjects */}
                    <div className="lg:col-span-2">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-bold text-gray-800">
                                {t('subjects_for')} <span className="text-blue-600 bg-blue-50 px-2 rounded">"{searchedGrade}"</span>
                            </h3>
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{subjects.length} Assigned</span>
                        </div>
                        
                        {subjects.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {subjects.map(sub => (
                                    <div key={sub._id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex justify-between items-center group">
                                        <div>
                                            <h4 className="font-bold text-lg text-gray-800">{sub.name}</h4>
                                            
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {sub.code ? (
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                                                        {sub.code}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">No Code</span>
                                                )}

                                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1" title="Sessions per week">
                                                    🕒 {sub.sessionsPerWeek || 3} / wk
                                                </span>
                                            </div>

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
                                <p>{t('no_subjects_found') || "No subjects assigned to this grade yet."}</p>
                                <p className="text-sm mt-1">Use the panel on the right to assign or create one.</p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Add/Assign Form */}
                    <div>
                         <form onSubmit={handleSaveSubject} className="bg-white p-6 rounded-xl border border-gray-200 shadow-md sticky top-6">
                            
                            {/* Mode Toggle Tabs */}
                            <div className="flex bg-gray-100 p-1 rounded-lg mb-4 text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => setAddMode('existing')}
                                    className={`flex-1 py-1.5 rounded-md transition-all ${addMode === 'existing' ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    📋 Select Existing
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAddMode('new')}
                                    className={`flex-1 py-1.5 rounded-md transition-all ${addMode === 'new' ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    ＋ Create New
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* MODE A: SELECT FROM EXISTING MASTER SUBJECTS */}
                                {addMode === 'existing' ? (
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                                            Select Master Subject
                                        </label>
                                        <select
                                            value={selectedMasterSubjectId}
                                            onChange={(e) => setSelectedMasterSubjectId(e.target.value)}
                                            className={selectInput}
                                            required={addMode === 'existing'}
                                        >
                                            <option value="">-- Choose Existing Subject --</option>
                                            {unassignedMasterSubjects.map(sub => (
                                                <option key={sub._id} value={sub._id}>
                                                    {sub.name} {sub.code ? `(${sub.code})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        {unassignedMasterSubjects.length === 0 && (
                                            <p className="text-xs text-gray-400 mt-1 italic">
                                                All master subjects are already assigned to {searchedGrade}.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    /* MODE B: CREATE NEW SUBJECT */
                                    <>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">{t('subject_name')}</label>
                                            <input 
                                                type="text"
                                                value={newSubjectName}
                                                onChange={(e) => setNewSubjectName(e.target.value)}
                                                placeholder={t('subject_name_placeholder') || "e.g. Mathematics"}
                                                className={textInput}
                                                required={addMode === 'new'}
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
                                    </>
                                )}

                                {/* Weekly Periods (Load) - Common to both modes */}
                                <div>
                                    <label htmlFor="sessionsPerWeek" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                                        Weekly Periods (Load)
                                    </label>
                                    <input 
                                        id="sessionsPerWeek"
                                        type="number"
                                        name="sessionsPerWeek"
                                        min="1"
                                        max="10"
                                        value={sessionsPerWeek}
                                        onChange={e => setSessionsPerWeek(e.target.value)}
                                        className={textInput}
                                        required
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Used for schedule generation.
                                    </p>
                                </div>
                                
                                <div className="pt-4 mt-2 border-t">
                                    <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                                        Assigning to: <strong className="text-blue-600 bg-blue-50 px-1 rounded">{searchedGrade}</strong>
                                    </p>
                                    <button type="submit" className={`w-full ${buttonSuccess} py-3 shadow-lg transform active:scale-95 transition-transform`}>
                                        {addMode === 'existing' ? '➕ Assign to Class' : t('save_subject')}
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