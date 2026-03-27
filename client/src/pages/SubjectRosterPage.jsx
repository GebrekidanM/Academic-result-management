import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import rosterService from '../services/rosterService';
import subjectService from '../services/subjectService';
import authService from '../services/authService';
import userService from '../services/userService';
import gradeService from '../services/gradeService';

const SubjectRosterPage = () => {
    const { t } = useTranslation();
    const location = useLocation();

    // --- Core State ---
    const [currentUser] = useState(authService.getCurrentUser());
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(location.state?.subjectId || '');
    const [semester, setSemester] = useState('First Semester');
    const [academicYear, setAcademicYear] = useState('2018');
    const [rosterData, setRosterData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Bulk Edit State ---
    const [isEditMode, setIsEditMode] = useState(false);
    const [updatedScores, setUpdatedScores] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    // --- Memoized Helpers ---
    const currentSubjectDetails = useMemo(() => 
        subjects.find(s => s._id === selectedSubject) || {}, 
    [subjects, selectedSubject]);

    // --- 1. Load Initial Data ---
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                let list = [];
                if (['admin', 'staff', 'principal'].includes(currentUser.role)) {
                    const response = await subjectService.getAllSubjects();
                    list = response.data.data;
                } else {
                    const response = await userService.getProfile();
                    list = response.data.subjectsTaught?.map(a => a.subject).filter(Boolean) || [];
                }
                setSubjects(list);

                if (location.state?.subjectId) {
                    handleGenerate(null, location.state.subjectId);
                }
            } catch (err) {
                setError(t('error_loading'));
            }
        };
        loadInitialData();
    }, [currentUser.role, t, location.state]);

    // --- 2. Generate Roster Data ---
    const handleGenerate = async (e, subjectOverride = null) => {
        if (e) e.preventDefault();
        const targetId = subjectOverride || selectedSubject;
        if (!targetId) return;

        setLoading(true);
        setError(null);
        setIsEditMode(false); 
        setUpdatedScores({});
        try {
            const response = await rosterService.getSubjectRoster({
                gradeLevel: currentSubjectDetails.gradeLevel || subjects.find(s => s._id === targetId)?.gradeLevel,
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
    // 1. Logic to prevent entering marks higher than the total allowed
    if (currentSubjectDetails?.gradingType !== 'descriptive') {
        if (value !== '' && !isNaN(value) && Number(value) > maxMarks) return;
    }

    // 2. The Fix: Deeply nest the update so it only affects ONE cell
    setUpdatedScores(prev => ({
        ...prev,
        [mongoId]: {
            ...(prev[mongoId] || {}), // Keep existing assessments for this student
            [assessmentId]: value      // Update ONLY this specific assessment
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


    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans print:bg-white print:p-0">
            {/* PRINT ENGINE */}
            <style>{`
                @media print {
                    @page { size: A4 landscape; margin: 5mm; }
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    table { width: 100% !important; border-collapse: collapse !important; table-layout: auto !important; }
                    th, td { border: 1px solid #000 !important; font-size: 7.5px !important; padding: 2px !important; text-align: center; color: black !important; }
                    th { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; }
                    .print-bg-emerald { background-color: #ecfdf5 !important; }
                    .print-bg-rose { background-color: #fff1f2 !important; }
                }
            `}</style>

            {/* CONTROLS (Hidden on Print) */}
            <div className="max-w-full mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden no-print mb-8">
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
                    <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-lg transition-all active:scale-95 disabled:bg-slate-300">
                        {loading ? t('loading') : t('view_roster')}
                    </button>
                </form>
            </div>

            {error && <div className="max-w-full mx-auto mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold text-center">⚠️ {error}</div>}

            {/* ROSTER CONTENT */}
            {rosterData && (
                <div className="max-w-full mx-auto bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:p-0 print:border-none print:shadow-none">
                    
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

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-[16px] border-collapse">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th rowSpan="2" className="p-2 border border-slate-200 text-[16px] text-slate-400">#</th>
                                    <th rowSpan="2" className="p-2 border border-slate-200 text-left font-black text-slate-700 min-w-[180px]">{t('full_name')}</th>
                                    
                                    {rosterData.sortedMonths.map(month => (
                                        <th key={month} colSpan={rosterData.assessmentsByMonth[month].length} className="p-1 border border-slate-200 bg-indigo-50 text-indigo-800 text-[12px] uppercase tracking-widest font-black">
                                            {month}
                                        </th>
                                    ))}
                                    
                                    <th rowSpan="2" className="p-2 border border-slate-200 bg-slate-800 text-white text-[12px]">{t('total')}</th>
                                </tr>
                                <tr className="bg-white">
                                    {rosterData.sortedMonths.map(month => (
                                        rosterData.assessmentsByMonth[month].map(at => (
                                            <th key={at._id} className="p-1 border border-slate-200 text-[12px] font-medium text-slate-500 leading-tight">
                                                {at.name} <br/> <b>({at.totalMarks})</b>
                                            </th>
                                        ))
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rosterData.roster.map((student, idx) => (
                                    <tr key={student._id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-1 border border-slate-100 text-center text-[10px] text-slate-300 font-mono">{idx + 1}</td>
                                        <td className="p-2 border border-slate-100 font-bold text-slate-700 text-xs">
                                            <span className="block">{student.fullName}</span>
                                            <span className="text-[9px] font-normal text-slate-400 font-mono">{student.studentId}</span>
                                        </td>
                                        
                                        {rosterData.sortedMonths.map(month => (
                                            rosterData.assessmentsByMonth[month].map(at => {
                                                // Look up the value for THIS specific student and THIS specific assessment
                                                const draftValue = updatedScores[student._id]?.[at._id];
                                                
                                                // Use the draft value if it exists, otherwise fall back to the saved database value
                                                const displayValue = draftValue !== undefined ? draftValue : (student.detailedScores[at._id] ?? '');

                                                return (
                                                    <td key={at._id} className={` ${getScoreStyle(displayValue, at.totalMarks)} p-1 border border-slate-100  ${draftValue !== undefined ? 'bg-amber-50' : ''}`}>
                                                        {isEditMode ? (
                                                            <input 
                                                                type="text"
                                                                value={displayValue}
                                                                onChange={(e) => handleCellChange(student._id, at._id, e.target.value, at.totalMarks)}
                                                                className="w-full text-center bg-transparent outline-none focus:ring-2 ring-indigo-400 rounded font-bold text-indigo-700"
                                                            />
                                                        ) : (
                                                            <span className="text-xs">{displayValue || '-'}</span>
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
                    <div className="hidden print:grid grid-cols-3 gap-12 mt-16 px-6">
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