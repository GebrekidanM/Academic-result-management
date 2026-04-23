import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import subjectService from '../services/subjectService';
import assessmentTypeService from '../services/assessmentTypeService';
import gradeService from '../services/gradeService';
import authService from '../services/authService';
import userService from '../services/userService';
import studentService from '../services/studentService';
import offlineGradeService from '../services/offlineGradeService';
import offlineAssessmentService from '../services/offlineAssessmentService';
import ScoreInput from '../components/ScoreInput';

const GradeSheetPage = () => {
    const { t } = useTranslation();
    const location = useLocation();
    
    // --- State ---
    const [saveDisabled, setSaveDisabled] = useState(false);
    const [academicYear, setAcademicYear] = useState('');
    const [currentUser] = useState(authService.getCurrentUser());
    const [subjects, setSubjects] = useState([]);
    const [assessmentTypes, setAssessmentTypes] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(location.state?.subject?.id || '');
    const [selectedAssessment, setSelectedAssessment] = useState(location.state?.assessmentType?._id || '');
    const [sheetData, setSheetData] = useState(null);
    const [scores, setScores] = useState({});

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Derived State (Performance Optimization) ---
    const currentSubjectObj = useMemo(() => 
        subjects.find(s => s._id === selectedSubject), 
    [subjects, selectedSubject]);

    // --- 1. Load Subjects & Set Ethiopian Year ---
    useEffect(() => {
        const loadSubjects = async () => {
            try {
                let subjectsToDisplay = [];
                if (currentUser.role === 'admin') {
                    const res = await subjectService.getAllSubjects();
                    subjectsToDisplay = res.data.data;
                } else {
                    const res = await userService.getProfile();
                    subjectsToDisplay = res.data.subjectsTaught.map(a => a.subject).filter(Boolean);
                }

                // Ethiopian Year Logic
                const now = new Date();
                const ethYear = (now.getMonth() + 1) > 8 ? now.getFullYear() - 7 : now.getFullYear() - 8;
                
                setAcademicYear(String(ethYear));
                setSubjects(subjectsToDisplay);
            } catch (err) {
                setError(t('error_loading_subjects'));
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
                    const res = await assessmentTypeService.getBySubject(selectedSubject);
                    assessments = res.data.data;
                } catch (err) { console.error("Offline mode: using local assessments"); }
            }

            const local = offlineAssessmentService.getLocalAssessments().filter(a => a.subject === selectedSubject);
            // Merge & unique by ID
            const combined = [...assessments, ...local];
            const unique = Array.from(new Map(combined.map(item => [item._id, item])).values());
            
            setAssessmentTypes(unique);
        };
        fetchAssessments();
    }, [selectedSubject]);

    // --- 3. Load Grade Sheet ---
    const handleLoadSheet = async () => {
        if (!selectedAssessment) return;
        setLoading(true);
        setError(null);

        try {
            // Handle Offline/Local Assessments
            if (selectedAssessment.toString().startsWith('TEMP_')) {
                const currentAssessment = assessmentTypes.find(a => a._id === selectedAssessment);
                const studentRes = await studentService.getAllStudents();
                const allStudents = studentRes.data.data;
                
                const classStudents = allStudents
                    .filter(s => s.gradeLevel === currentSubjectObj.gradeLevel)
                    .sort((a, b) => a.fullName.localeCompare(b.fullName));

                setSheetData({
                    assessmentType: currentAssessment,
                    students: classStudents
                });
                
                const initialScores = {};
                classStudents.forEach(s => initialScores[s._id] = '');
                setScores(initialScores);
            } else {
                // Online Load
                const res = await gradeService.getGradeSheet(selectedAssessment);
                setSheetData(res.data);
                const initialScores = {};
                res.data.students.forEach(s => initialScores[s._id] = s.score ?? '');
                setScores(initialScores);
            }
        } catch (err) {
            setError(err.message || t('error'));
        } finally {
            setLoading(false);
        }
    };

    // --- 4. Score Logic ---
    const handleScoreChange = (studentId, value) => {
        if (currentSubjectObj?.gradingType !== 'descriptive') {
            if (Number(value) > (sheetData?.assessmentType?.totalMarks || 100)) return;
        }
        setScores(prev => ({ ...prev, [studentId]: value }));
    };

    // --- 5. Save Logic (Sync/Offline) ---
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
            assessmentTypeId: selectedAssessment,
            subjectId: selectedSubject,
            semester: sheetData.assessmentType.semester,
            academicYear,
            scores: scoresPayload,
        };

        try {
            if (!navigator.onLine || selectedAssessment.toString().startsWith('TEMP_')) {
                offlineGradeService.addToQueue(payload);
                alert(`✅ ${t('saved_offline_msg')}`);
            } else {
                await gradeService.saveGradeSheet(payload);
                alert(`🚀 ${t('saved_online_msg')}`);
                setScores({})
            }
        } catch (err) {
            offlineGradeService.addToQueue(payload);
            alert(t('saved_offline_msg'));
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
                        <h1 className="text-3xl font-black uppercase tracking-tight">{t('grade_entry_title')}</h1>
                        <p className="opacity-70 text-sm font-mono mt-1">{currentSubjectObj?.name || '---'} | {t('academic_year')}: {academicYear}</p>
                    </div>
                    <Link to="/subject-roster" state={{subjectId: selectedSubject}} className="bg-indigo-500 hover:bg-indigo-600 px-6 py-2 rounded-xl font-bold transition-all text-sm">
                        📋 {t('class_roster')}
                    </Link>
                </div>

                {/* Filter Controls */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 border-b border-slate-100">
                    <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1">{t('subject')}</label>
                        <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none bg-white font-bold text-slate-700">
                            <option value="">-- {t('select_subject')} --</option>
                            {subjects.map(s => (
                                <option key={s._id} value={s._id}>{s.name} ({s.gradeLevel}) {s.gradingType === 'descriptive' ? '✍️' : '🔢'}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1">{t('assessment')}</label>
                        <select value={selectedAssessment} onChange={(e) => setSelectedAssessment(e.target.value)} disabled={!selectedSubject} className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none bg-white font-bold text-slate-700 disabled:opacity-50">
                            <option value="">-- {t('select_assessment')} --</option>
                            {assessmentTypes.map(at => (
                                <option key={at._id} value={at._id}>{at._id.startsWith('TEMP_') ? '☁️ ' : ''}{at.month} - {at.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button onClick={handleLoadSheet} disabled={!selectedAssessment || loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all disabled:bg-slate-300">
                            {loading ? t('loading') : t('load_sheet')}
                        </button>
                    </div>
                </div>

                {/* Score Entry Table */}
                {sheetData && (
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-8 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                            <div>
                                <h3 className="text-lg font-black text-indigo-900 uppercase">{sheetData.assessmentType.name}</h3>
                                {currentSubjectObj?.gradingType !== 'descriptive' && (
                                    <p className="text-xs font-bold text-indigo-500">{t('total_marks')}: {sheetData.assessmentType.totalMarks}</p>
                                )}
                            </div>
                            <button onClick={handleSave} disabled={saveDisabled} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-emerald-100 transition-all disabled:opacity-50">
                                {saveDisabled ? '...' : t('save_all')}
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
                                    {sheetData.students.map(student => (
                                        <tr key={student._id} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                                {student.fullName}
                                            </td>
                                            <td className="px-6 py-4">
                                                <ScoreInput 
                                                    gradingType={currentSubjectObj?.gradingType}
                                                    maxMarks={sheetData.assessmentType.totalMarks}
                                                    value={scores[student._id]}
                                                    onChange={(val) => handleScoreChange(student._id, val)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
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