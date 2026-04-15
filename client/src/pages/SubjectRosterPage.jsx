import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import rosterService from '../services/rosterService';
import subjectService from '../services/subjectService';
import authService from '../services/authService';
import userService from '../services/userService';
import gradeService from '../services/gradeService';

// Helper to get current academic year dynamically
function getCurrentAcademicYear() {
    const today = new Date();
    const gregYear = today.getFullYear();
    const gregMonth = today.getMonth() + 1;
    return gregMonth >= 9 ? gregYear - 7 : gregYear - 8;
}

const SubjectRosterPage = () => {
    const { t } = useTranslation();
    const location = useLocation();

    // --- Core State ---
    const [currentUser] = useState(authService.getCurrentUser());
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(location.state?.subjectId || '');
    const [semester, setSemester] = useState('First Semester');
    const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear()); // Used dynamic year here
    const [rosterData, setRosterData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Bulk Edit State ---
    const[isEditMode, setIsEditMode] = useState(false);
    const [updatedScores, setUpdatedScores] = useState({});
    const[isSaving, setIsSaving] = useState(false);

    // --- Memoized Helpers ---
    const currentSubjectDetails = useMemo(() => 
        subjects.find(s => s._id === selectedSubject) || {}, 
    [subjects, selectedSubject]);

    // --- 1. Load Initial Data ---
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                let list =[];
                if (['admin', 'staff', 'principal'].includes(currentUser.role)) {
                    const response = await subjectService.getAllSubjects();
                    list = response.data.data;
                } else {
                    const response = await userService.getProfile();
                    list = response.data.subjectsTaught?.map(a => a.subject).filter(Boolean) ||[];
                }
                setSubjects(list);

                if (location.state?.subjectId) {
                    handleGenerate(null, location.state.subjectId, list);
                }
            } catch (err) {
                console.log(err)
                setError(t('error_loading'));
            }
        };
        loadInitialData();
    },[currentUser.role, t, location.state]);

    // --- 2. Generate Roster Data ---
    const handleGenerate = async (e, subjectOverride = null, fetchedSubjects = subjects) => {
        if (e) e.preventDefault();
        const targetId = subjectOverride || selectedSubject;
        if (!targetId) return;

        setLoading(true);
        setError(null);
        setIsEditMode(false); 
        setUpdatedScores({});
        try {
            // Find subject from the passed array to prevent stale state bugs on first load
            const targetSubject = fetchedSubjects.find(s => s._id === targetId);

            const response = await rosterService.getSubjectRoster({
                gradeLevel: currentSubjectDetails.gradeLevel || targetSubject?.gradeLevel,
                subjectId: targetId,
                semester,
                academicYear
            });
            setRosterData(response.data);
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        } finally {
            setLoading(false);
        }
    };

    // --- 3. Bulk Edit Handlers ---
    const handleCellChange = (mongoId, assessmentId, value, maxMarks) => {
        if (currentSubjectDetails?.gradingType !== 'descriptive') {
            if (value !== '' && isNaN(value)) return; 
            
            if (value !== '' && Number(value) > maxMarks) return;
        }

        setUpdatedScores(prev => ({
            ...prev,
            [mongoId]: {
                ...(prev[mongoId] || {}),
                [assessmentId]: value
            }
        }));
    };

    const handleBulkSave = async () => {
        const hasChanges = Object.values(updatedScores).some(
            student => Object.keys(student).length > 0
        );

        if (!hasChanges) return;

        setIsSaving(true);
        setError(null);

        try {
            const requests = Object.entries(updatedScores).map(
                async ([mongoId, assessments]) => {

                    // Convert object to array format expected by backend
                    const assessmentsArray = Object.entries(assessments)
                    .filter(([_, value]) => value !== null && value !== '')
                    .map(([assessmentId, value]) => ({
                        assessmentType: assessmentId,
                        score: currentSubjectDetails?.gradingType === 'descriptive'
                        ? value
                        : Number(value)
                    }));

                    return gradeService.saveGradeSheet({
                        studentId: mongoId,
                        subjectId: selectedSubject,
                        semester,
                        academicYear,
                        assessments: assessmentsArray
                    });
                }
            );

            await Promise.all(requests);

            alert("✅ " + t('success_save'));

            // reset state
            setUpdatedScores({});
            setIsEditMode(false);

            // reload roster
            handleGenerate();

        } catch (err) {
            console.error("Bulk Save Error:", err);
            setError(t('error_saving'));
        } finally {
            setIsSaving(false);
        }
    };

    // --- 4. Style Helpers ---
    const getScoreStyle = (score, total) => {
        if (score === undefined || score === null || score === '-' || score === '') return "text-gray-400";
        
        const numScore = Number(score);
        const max = total || 100; 
        const percentage = (numScore / max) * 100;

        if (percentage >= 90) return "text-green-700 font-black bg-green-50 print:text-green-800 print:bg-green-100"; 
        if (percentage >= 75) return "text-blue-700 font-bold print:text-blue-800";   
        if (percentage >= 50) return "text-yellow-700 font-medium print:text-black";  
        return "text-red-600 font-bold bg-red-50 print:text-red-700 print:bg-red-50"; 
    };

     const thBase = "px-2 py-1 text-center text-xs font-bold uppercase border border-gray-400 align-middle";

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans print:bg-white print:p-0">
            {/* PRINT ENGINE */}
            
 <style>{`

                @media print {
                    @page { size: A4 landscape; margin: 0mm !important; }
                    .print-wrapper { position: absolute; top: 0; left: 0; width: 297mm; margin: 0 !important; padding: 0 !important; }
                    .no-print, nav, button, .sidebar, header { display: none !important; }
                    
                    body, .min-h-screen { 
                        background-color: white !important; 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        width: 100% !important;
                    }

                    #printable-area {
                        width: 100% !important;
                    }
                    
                    table { 
                        width: 100% !important; 
                        border-collapse: collapse !important; 
                        font-size: 10px !important; 
                    }
                    
                    th, td { 
                        border: 1px solid black !important; 
                        padding: 4px !important; 
                        color: black !important;
                    }
                    
                    /* IMPORTANT: Forces background colors to show on paper */
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

                    .print-footer {
                        display: flex !important;
                        justify-content: space-between;
                        margin-top: 30px;
                        border-top: 2px solid black;
                        padding-top: 10px;
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            {/* CONTROLS (Hidden on Print) */}
            <div className="max-w-full mx-auto bg-white rounded-sm shadow-xl border border-slate-100 overflow-hidden no-print mb-8">
                <div className="bg-slate-800 p-6 flex justify-between items-center text-white">
                    <h1 className="text-xl font-black uppercase tracking-tight">📊 {t('class_roster')}</h1>
                    <Link to="/" className="text-sm font-bold opacity-70 hover:opacity-100 transition-all">✕ {t('close')}</Link>
                </div>

                <form onSubmit={handleGenerate} className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-end bg-slate-50">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{t('subject')}</label>
                        <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all">
                            <option value="">-- {t('select_subject')} --</option>
                            {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.gradeLevel})</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{t('semester')}</label>
                        <select value={semester} onChange={e => setSemester(e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 font-bold text-slate-700">
                            <option value="First Semester">{t('sem_1')}</option>
                            <option value="Second Semester">{t('sem_2')}</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{t('academic_year')}</label>
                        <input type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 font-bold text-slate-700" />
                    </div>
                    <div className="flex flex-col gap-2">                    
                        <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:bg-slate-300">
                            {loading ? t('loading') : t('view_roster')}
                        </button>
                        {selectedSubject && (
                                <Link 
                                    to='/manage-assessments' 
                                    state={{ subject: currentSubjectDetails }}
                                    className="w-full text-center bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-bold py-2 rounded-xl transition-all active:scale-95 text-sm"
                                >
                                    ⚙️ {t('manage_assessment') || 'Manage Assessment'}
                                </Link>
                            )}
                    </div>
                </form>
            </div>

            {error && <div className="max-w-full mx-auto mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold text-center">⚠️ {error}</div>}

            
            {/* ROSTER CONTENT */}
            {rosterData && (
                <div id="printable-area" className={`print-wrapper p-6 print:p-0 w-full"`}>
                    <div className="hidden print:flex flex-col gap-2 mt-10 px-6 mb-2">
                        <h1 className='text-center text-2xl text-fuchsia-900'>Freedom primary and kindergarden School</h1>
                        <p className='text-center '> {currentSubjectDetails.name} Marklist of {currentSubjectDetails.gradeLevel} in {getCurrentAcademicYear()}</p>
                    </div>
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 no-print">
                        <div className="flex gap-3">
                            <button 
                                onClick={() => { setIsEditMode(!isEditMode); setUpdatedScores({}); }}
                                className={`px-6 py-2 rounded-xl font-bold transition-all ${isEditMode ? 'bg-rose-100 text-rose-600 border border-rose-200 shadow-inner' : 'bg-slate-800 text-white shadow-lg'}`}
                            >
                                {isEditMode ? `🚫 ${t('cancel_edit')}` : `✏️ ${t('bulk_edit')}`}
                            </button>

                            {isEditMode && Object.keys(updatedScores).length > 0 && (
                                <button 
                                    onClick={handleBulkSave}
                                    disabled={isSaving}
                                    className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-black shadow-lg shadow-emerald-100 animate-pulse"
                                >
                                    {isSaving ? '...' : `💾 ${t('save_all_changes')}`}
                                </button>
                            )}
                        </div>
                        <button onClick={() => window.print()} className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-6 py-2 rounded-xl font-bold transition-all">🖨️ {t('print_report')}</button>
                    </div>

                    <div className="overflow-x-auto print:overflow-visible px-2">
                            <table className="min-w-full divide-y divide-gray-200 border-collapse border border-gray-400">
                            <thead className="bg-gray-100 print:bg-gray-200">
                                    <tr>
                                        <th rowSpan="2" className={`${thBase} bg-gray-200 w-10`}>#</th>
                                        <th rowSpan="2" className={`${thBase} bg-gray-200 text-left w-56`}>{t('full_name')}</th>
                                        <th rowSpan="2" className={`${thBase} bg-gray-200 w-10`}>{t('gender')[0]}</th>
                                        <th rowSpan="2" className={`${thBase} bg-gray-200 w-12`}>{t('age')}</th>
                                        
                                        {/* Dynamic Month Headers */}
                                        {rosterData.sortedMonths.map(month => (
                                            <th key={month} colSpan={rosterData.assessmentsByMonth[month].length} className={`${thBase} bg-blue-100 text-blue-900 print:bg-gray-100`}>
                                                {month}
                                            </th>
                                        ))}
                                        
                                        <th rowSpan="2" className={`${thBase} bg-gray-300 text-black w-16`}>{t('total')}</th>
                                    </tr>
                                    <tr>
                                        {/* Assessment Sub-Headers */}
                                        {rosterData.sortedMonths.map(month => (
                                            rosterData.assessmentsByMonth[month].map(at => (
                                                <th key={at._id} className={`${thBase} bg-white font-normal text-[9px] text-gray-600`}>
                                                    {at.name} <br/> <span className="font-bold">({at.totalMarks})</span>
                                                </th>
                                            ))
                                        ))}
                                    </tr>
                                </thead>
                            <tbody>
                                {rosterData.roster.map((student, idx) => (
                                    <tr key={student._id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-1 border border-slate-100 text-center text-[10px] text-slate-700 font-mono">{idx + 1}</td>
                                        <td className="p-2 border border-slate-100 font-bold text-slate-700 text-xs">
                                            <span className="block">{student.fullName}</span>
                                            <span className="text-[9px] font-normal text-slate-400 font-mono">{student.studentId}</span>
                                        </td>
                                        <td className="p-2 border border-slate-100 font-bold text-slate-700 text-xs">{student.gender}</td>
                                        <td className="p-2 border border-slate-100 font-bold text-slate-700 text-xs">{student.age}</td>

                                        {rosterData.sortedMonths.map(month => (
                                            rosterData.assessmentsByMonth[month].map(at => {
                                                const draftValue = updatedScores[student._id]?.[at._id];
                                                const displayValue = draftValue !== undefined ? draftValue : (student.detailedScores[at._id] ?? '');

                                                return (
                                                    <td key={at._id} className={` ${getScoreStyle(displayValue, at.totalMarks)} p-1 border border-slate-100  ${draftValue !== undefined ? 'bg-amber-50' : ''}`}>
                                                        {isEditMode ? (
                                                            <input 
                                                                type="text"
                                                                inputMode="decimal"
                                                                value={displayValue === '-' ? '' : displayValue}
                                                                onChange={(e) => handleCellChange(student._id, at._id, e.target.value, at.totalMarks)}
                                                                className="w-full text-center bg-transparent outline-none focus:ring-2 ring-indigo-400 rounded font-bold text-indigo-700"
                                                            />
                                                        ) : (
                                                            <span className="text-xs">{displayValue === 0 ? 0 : displayValue}</span>
                                                        )}
                                                    </td>
                                                );
                                            })
                                        ))}
                                        
                                        <td className={` ${getScoreStyle(student.finalScore)} p-2 border border-slate-100 text-center text-slate-900 text-xs`}>
                                            {student.finalScore}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Official Signatures (Visible only on print) */}
                    
                    <div className="hidden print:grid grid-cols-3 gap-12 mt-10 px-6 print-footer">
                        <div className="text-center">
                            <div className="border-b border-black mb-2 h-10"></div>
                            <p className="text-[9px] font-bold uppercase">{t('teacher_sign')}</p>
                        </div>
                        <div className="text-center">
                            <div className="border-b border-black mb-2 h-10"></div>
                            <p className="text-[9px] font-bold uppercase">{t('director_sign')}</p>
                        </div>
                        <div className="text-center">
                            <div className="border-b border-black mb-2 h-10"></div>
                            <p className="text-[9px] font-bold uppercase">{t('date')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectRosterPage;