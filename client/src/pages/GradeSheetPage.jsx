// src/pages/GradeSheetPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import subjectService from '@shared/services/subjectService';
import assessmentTypeService from '@shared/services/assessmentTypeService';
import offlineAssessmentService from '@shared/services/offlineAssessmentService';
import studentService from '@shared/services/studentService';
import gradeService from '@shared/services/gradeService';
import offlineGradeService from '@shared/services/offlineGradeService';
import userService from '@shared/services/userService';
import authService from '@shared/services/authService';
import ScoreInput from '../components/ScoreInput';

const MONTHS = [
  "September", "October", "November", "December",
  "January", "February", "March", "April", "May", "June"
];

function getEthiopianYear() {
    const today = new Date();
    const gregYear = today.getFullYear();
    const gregMonth = today.getMonth() + 1;
    return gregMonth >= 9 ? gregYear - 7 : gregYear - 8;
}

// Helpers to extract GradeLevel names cleanly
const getGradeName = (gl) => {
    if (!gl) return '';
    if (typeof gl === 'object') return gl.name || '';
    return String(gl);
};

const getGradeId = (gl) => {
    if (!gl) return '';
    if (typeof gl === 'object') return gl._id ? gl._id.toString() : '';
    return String(gl);
};

const getSubjectGradeNames = (sub) => {
    if (Array.isArray(sub?.gradeLevels) && sub.gradeLevels.length > 0) {
        return sub.gradeLevels.map(g => getGradeName(g.gradeLevel)).filter(Boolean).join(', ');
    }
    return getGradeName(sub?.gradeLevel) || 'All';
};

const GradeSheetPage = () => {
    const { t } = useTranslation();
    const location = useLocation();
    
    // --- Clean State Extraction from AssessmentTypesPage.jsx ---
    const passedAssessmentType = location.state?.assessmentType;
    const passedSubjectId = location.state?.subject?.id || location.state?.subject?._id || passedAssessmentType?.subject;
    const passedGradeLevelId = passedAssessmentType?.gradeLevel || location.state?.subject?.gradeLevel;
    const passedSubjectName = location.state?.subjectName || location.state?.subject?.name || '';
    const passedGradeName = location.state?.gradeName || location.state?.subject?.gradeName || '';
    const passedAcademicYear = passedAssessmentType?.year || location.state?.year;

    // --- State ---
    const [currentUser] = useState(authService.getCurrentUser());
    const [saveDisabled, setSaveDisabled] = useState(false);
    
    // Academic Year: Prioritizes year passed from assessment type, defaults to current EC year
    const [academicYear, setAcademicYear] = useState(
        passedAcademicYear ? String(passedAcademicYear) : String(getEthiopianYear())
    );

    const [subjects, setSubjects] = useState([]);
    const [assessmentTypes, setAssessmentTypes] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(passedSubjectId || '');
    const [selectedAssessment, setSelectedAssessment] = useState(passedAssessmentType?._id || '');
    
    const [sheetData, setSheetData] = useState(null);
    const [scores, setScores] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const currentSubjectObj = useMemo(() => 
        subjects.find(s => s._id === selectedSubject), 
    [subjects, selectedSubject]);

    // --- 1. Load Subjects ---
    useEffect(() => {
        const loadSubjects = async () => {
            try {
                let subjectsToDisplay = [];
                if (currentUser.role === 'admin' || currentUser.role === 'staff') {
                    const res = await subjectService.getAllSubjects();
                    subjectsToDisplay = res.data?.data || res.data || [];
                } else {
                    const res = await userService.getProfile();
                    const profile = res.data?.data || res.data;
                    subjectsToDisplay = profile.subjectsTaught ? profile.subjectsTaught.map(a => a.subject).filter(Boolean) : [];
                }

                setSubjects(subjectsToDisplay);
            } catch (err) {
                console.error("Error loading subjects:", err);
                setError(t('error_loading_subjects') || 'Failed to load subjects.');
            }
        };
        loadSubjects();
    }, [currentUser.role, t]);

    // --- 2. Load Assessment Types when Subject changes ---
    useEffect(() => {
        const fetchAssessments = async () => {
            if (!selectedSubject) {
                setAssessmentTypes([]);
                return;
            }
            
            let assessments = [];

            if (navigator.onLine) {
                try {
                    const res = await assessmentTypeService.getBySubject(selectedSubject, passedGradeLevelId);
                    assessments = res.data?.data || res.data || [];
                } catch (err) { 
                    console.error("Offline mode: using local assessments", err); 
                }
            }

            const local = offlineAssessmentService.getLocalAssessments().filter(a => a.subject === selectedSubject);
            const combined = [...assessments, ...local];
            const unique = Array.from(new Map(combined.map(item => [item._id, item])).values());
            
            setAssessmentTypes(unique);
        };
        fetchAssessments();
    }, [selectedSubject, passedGradeLevelId]);
    
    // --- 3. Load Grade Sheet ---
    const handleLoadSheet = useCallback(async (assessmentIdToLoad) => {
        const targetAssessmentId = assessmentIdToLoad || selectedAssessment;
        if (!targetAssessmentId) return;

        setLoading(true);
        setError(null);

        try {
            // Offline / TEMP_ Assessment Sheet Logic
            if (targetAssessmentId.toString().startsWith('TEMP_')) {
                const currentAssessment = assessmentTypes.find(a => a._id === targetAssessmentId) || passedAssessmentType;
                const studentRes = await studentService.getAllStudents();
                const allStudents = studentRes.data?.data || studentRes.data || [];
                
                const classStudents = allStudents
                    .filter(s => {
                        if (!passedGradeLevelId) return true;
                        const sId = getGradeId(s.gradeLevel);
                        const sName = getGradeName(s.gradeLevel);
                        return sId === passedGradeLevelId || sName === passedGradeLevelId || s.gradeLevel === passedGradeLevelId;
                    })
                    .sort((a, b) => a.fullName.localeCompare(b.fullName));

                setSheetData({
                    assessmentType: currentAssessment,
                    students: classStudents
                });
                
                const initialScores = {};
                classStudents.forEach(s => initialScores[s._id] = '');
                setScores(initialScores);
            } 
            // Online Assessment Sheet Logic
            else {
                const res = await gradeService.getGradeSheet(targetAssessmentId);
                const data = res.data?.data || res.data;
                setSheetData(data);

                if (data?.assessmentType?.year) {
                    setAcademicYear(String(data.assessmentType.year));
                }

                const initialScores = {};
                if (Array.isArray(data?.students)) {
                    data.students.forEach(s => initialScores[s._id] = s.score ?? '');
                }
                setScores(initialScores);
            }
        } catch (err) {
            console.error("Error loading grade sheet:", err);
            setError(err.response?.data?.message || err.message || t('error'));
        } finally {
            setLoading(false);
        }
    }, [selectedAssessment, assessmentTypes, passedGradeLevelId, passedAssessmentType, t]);

    // --- 4. Auto-Load Sheet on Navigation ---
    useEffect(() => {
        if (passedAssessmentType?._id) {
            handleLoadSheet(passedAssessmentType._id);
        }
    }, [passedAssessmentType, handleLoadSheet]);

    // --- 5. Score Input Logic ---
    const handleScoreChange = (studentId, value) => {
        if (currentSubjectObj?.gradingType !== 'descriptive') {
            const maxMarks = sheetData?.assessmentType?.totalMarks || 100;
            if (Number(value) > maxMarks) return;
        }
        setScores(prev => ({ ...prev, [studentId]: value }));
    };

    // --- 6. Save Scores Logic ---
    const handleSave = async () => {
        if (saveDisabled || !sheetData) return;
        setSaveDisabled(true);

        const scoresPayload = Object.keys(scores)
            .filter(id => scores[id] !== '' && scores[id] !== null)
            .map(id => ({ 
                studentId: id, 
                score: currentSubjectObj?.gradingType === 'descriptive' ? scores[id] : Number(scores[id]) 
            }));

        const payload = {
            assessmentTypeId: selectedAssessment || passedAssessmentType?._id,
            subjectId: selectedSubject,
            semester: sheetData.assessmentType?.semester,
            academicYear,
            scores: scoresPayload,
        };

        try {
            if (!navigator.onLine || selectedAssessment.toString().startsWith('TEMP_')) {
                offlineGradeService.addToQueue(payload);
                alert(`✅ ${t('saved_offline_msg') || 'Saved offline successfully!'}`);
            } else {
                await gradeService.saveGradeSheet(payload);
                alert(`🚀 ${t('saved_online_msg') || 'Grade sheet saved online successfully!'}`);
            }
        } catch (err) {
            console.error("Error saving grades:", err);
            offlineGradeService.addToQueue(payload);
            alert(t('saved_offline_msg') || 'Saved offline successfully!');
        } finally {
            setSaveDisabled(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 animate-fade-in">
            <div className="bg-white rounded-sm shadow-xl border border-slate-100 overflow-hidden">
                
                {/* Header Section */}
                <div className="bg-slate-800 p-4 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight">
                            {t('grade_entry_title') || 'Grade Entry Sheet'}
                        </h1>
                        <p className="opacity-70 text-sm font-mono mt-1">
                            {currentSubjectObj?.name || passedSubjectName || '---'} 
                            {passedGradeName ? ` (${passedGradeName})` : ''} | 
                            {t('academic_year')}: {academicYear} E.C.
                        </p>
                    </div>
                    
                    <div className="flex gap-3">
                        <Link to="/manage-assessments" className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl font-bold transition-all text-sm flex items-center">
                            ← Back to Assessments
                        </Link>
                        <Link to="/subject-roster" state={{ subjectId: selectedSubject }} className="bg-indigo-500 hover:bg-indigo-600 px-6 py-2 rounded-xl font-bold transition-all text-sm flex items-center">
                            📋 {t('marklist') || 'Marklist'}
                        </Link>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 border-b border-slate-100">
                    {/* Subject Selector */}
                    <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1">{t('subject')}</label>
                        <select 
                            value={selectedSubject} 
                            onChange={(e) => {
                                setSelectedSubject(e.target.value);
                                setSelectedAssessment('');
                                setSheetData(null);
                            }} 
                            className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none bg-white font-bold text-slate-700"
                        >
                            <option value="">-- {t('select_subject')} --</option>
                            {subjects.map(s => (
                                <option key={s._id} value={s._id}>
                                    {s.name} ({getSubjectGradeNames(s)}) {s.gradingType === 'descriptive' ? '✍️' : '🔢'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Assessment Type Selector */}
                    <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1">{t('assessment')}</label>
                        <select 
                            value={selectedAssessment} 
                            onChange={(e) => setSelectedAssessment(e.target.value)} 
                            disabled={!selectedSubject} 
                            className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none bg-white font-bold text-slate-700 disabled:opacity-50"
                        >
                            <option value="">-- {t('select_assessment')} --</option>
                            {assessmentTypes.map(at => (
                                <option key={at._id} value={at._id}>
                                    {at._id.startsWith('TEMP_') ? '☁️ ' : ''}
                                    {at.month} - {typeof at.name === 'object' ? at.name?.name : at.name} ({at.totalMarks} Marks)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Load Button */}
                    <div className="flex items-end">
                        <button 
                            onClick={() => handleLoadSheet()} 
                            disabled={!selectedAssessment || loading} 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all disabled:bg-slate-300"
                        >
                            {loading ? t('loading') : t('load_sheet') || 'Load Sheet'}
                        </button>
                    </div>
                </div>

                {/* Score Entry Table */}
                {sheetData && (
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-8 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                            <div>
                                <h3 className="text-lg font-black text-indigo-900 uppercase">
                                    {typeof sheetData.assessmentType?.name === 'object' 
                                        ? sheetData.assessmentType.name?.name 
                                        : sheetData.assessmentType?.name}
                                </h3>
                                {currentSubjectObj?.gradingType !== 'descriptive' && (
                                    <p className="text-xs font-bold text-indigo-500">
                                        {t('total_marks') || 'Total Marks'}: {sheetData.assessmentType?.totalMarks || 100}
                                    </p>
                                )}
                            </div>
                            <button 
                                onClick={handleSave} 
                                disabled={saveDisabled} 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-emerald-100 transition-all disabled:opacity-50"
                            >
                                {saveDisabled ? '...' : `💾 ${t('save_all') || 'Save All Scores'}`}
                            </button>
                        </div>

                        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-bold text-center">⚠️ {error}</div>}

                        <div className="overflow-x-auto rounded-2xl border border-slate-100">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest">{t('full_name')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-widest w-48">{t('score')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {sheetData.students && sheetData.students.length > 0 ? (
                                        sheetData.students.map(student => (
                                            <tr key={student._id} className="hover:bg-indigo-50/30 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                                    {student.fullName}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <ScoreInput 
                                                        gradingType={currentSubjectObj?.gradingType}
                                                        maxMarks={sheetData.assessmentType?.totalMarks}
                                                        value={scores[student._id]}
                                                        onChange={(val) => handleScoreChange(student._id, val)}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="2" className="px-6 py-8 text-center text-gray-500">
                                                No active students found for this class sheet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GradeSheetPage;