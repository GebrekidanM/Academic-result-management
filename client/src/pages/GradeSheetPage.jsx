import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import classService from '../services/classService';
import subjectService from '../services/subjectService';
import assessmentTypeService from '../services/assessmentTypeService';
import gradeService from '../services/gradeService';
import configService from '../services/configService';
import authService from '../services/authService';

const GradeSheetPage = () => {
    const { t } = useTranslation();
    const [currentUser] = useState(authService.getCurrentUser());

    // ── Selectors ──────────────────────────────────────────────────────────────
    const [classes, setClasses] = useState([]);
    const [streams, setStreams] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStream, setSelectedStream] = useState('');
    const [testPeriod, setTestPeriod] = useState('');
    const [academicYear, setAcademicYear] = useState('');
    const [currentSemester, setCurrentSemester] = useState('');

    // ── Sheet data ─────────────────────────────────────────────────────────────
    const [subjects, setSubjects] = useState([]);       // subjects for selected class
    const [students, setStudents] = useState([]);       // students in selected stream
    // scores[studentId][subjectId] = score value
    const [scores, setScores] = useState({});
    const [assessmentMap, setAssessmentMap] = useState({}); // subjectId -> assessmentType

    // ── UI state ───────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [sheetLoaded, setSheetLoaded] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const pdfInputRef = useRef(null);

    const testPeriods = [
        { label: 'Beginning of Term (BOT)', value: 'Beginning of Term' },
        { label: 'Mid Term (MT)',            value: 'MID Term'          },
        { label: 'End of Term (EOT)',        value: 'End of Term'       },
    ];

    // ── Load config ────────────────────────────────────────────────────────────
    useEffect(() => {
        configService.getConfig().then(res => {
            if (res.data.data) {
                setAcademicYear(res.data.data.currentAcademicYear);
                setCurrentSemester(res.data.data.currentSemester);
            }
        }).catch(() => {});
    }, []);

    // ── Load classes ───────────────────────────────────────────────────────────
    useEffect(() => {
        classService.getClasses().then(res => setClasses(res.data.data || [])).catch(() => {});
    }, []);

    // ── Load streams when class changes ───────────────────────────────────────
    useEffect(() => {
        setSelectedStream('');
        setStreams([]);
        setSheetLoaded(false);
        if (!selectedClass) return;
        classService.getStreamsByClass(selectedClass)
            .then(res => setStreams(res.data.data || []))
            .catch(() => {});
    }, [selectedClass]);

    // ── Reset sheet when selectors change ─────────────────────────────────────
    useEffect(() => {
        setSheetLoaded(false);
        setStudents([]);
        setSubjects([]);
        setScores({});
        setAssessmentMap({});
        setMessage({ text: '', type: '' });
    }, [selectedClass, selectedStream, testPeriod]);

    // ── Load sheet ─────────────────────────────────────────────────────────────
    const handleLoadSheet = async () => {
        if (!selectedClass || !selectedStream || !testPeriod) {
            setMessage({ text: 'Please select class, stream and test period.', type: 'error' });
            return;
        }
        setLoading(true);
        setMessage({ text: '', type: '' });
        try {
            // 1. Load subjects for this class
            const subRes = await subjectService.getAllSubjects();
            const allSubjects = subRes.data.data || [];
            const classSubjects = allSubjects.filter(s =>
                (s.class?._id || s.class) === selectedClass
            );
            setSubjects(classSubjects);

            if (classSubjects.length === 0) {
                setMessage({ text: 'No subjects found for this class.', type: 'error' });
                setLoading(false);
                return;
            }

            // 2. For each subject, find the matching assessment type for this period
            const atMapBuilt = {};
            const studentsSet = new Map(); // studentId -> student obj

            await Promise.all(classSubjects.map(async (subj) => {
                try {
                    const atRes = await assessmentTypeService.getBySubject(subj._id);
                    const ats = atRes.data.data || [];
                    // Match by test period name (case-insensitive)
                    const matched = ats.find(at =>
                        at.name.toLowerCase().includes(testPeriod.toLowerCase()) ||
                        testPeriod.toLowerCase().includes(at.name.toLowerCase().split(' ')[0])
                    );
                    if (matched) {
                        atMapBuilt[subj._id] = matched;

                        // 3. Load grade sheet for this assessment (filtered by stream)
                        const sheetRes = await gradeService.getGradeSheet(matched._id, selectedStream);
                        const sheetStudents = sheetRes.data.students || [];

                        sheetStudents.forEach(st => {
                            if (!studentsSet.has(st._id)) {
                                studentsSet.set(st._id, { _id: st._id, fullName: st.fullName });
                            }
                        });

                        // Populate scores for this subject
                        setScores(prev => {
                            const updated = { ...prev };
                            sheetStudents.forEach(st => {
                                if (!updated[st._id]) updated[st._id] = {};
                                updated[st._id][subj._id] = st.score ?? '';
                            });
                            return updated;
                        });
                    }
                } catch (e) {
                    console.error(`Error loading sheet for subject ${subj.name}:`, e.message);
                }
            }));

            setAssessmentMap(atMapBuilt);

            // Sort students alphabetically
            const sortedStudents = Array.from(studentsSet.values())
                .sort((a, b) => a.fullName.localeCompare(b.fullName));
            setStudents(sortedStudents);

            if (sortedStudents.length === 0) {
                setMessage({ text: 'No students found for this stream.', type: 'error' });
            } else {
                setSheetLoaded(true);
            }
        } catch (err) {
            setMessage({ text: err.message || 'Error loading sheet.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // ── Score change ───────────────────────────────────────────────────────────
    const handleScoreChange = (studentId, subjectId, value) => {
        const at = assessmentMap[subjectId];
        const max = at?.totalMarks || 100;
        if (value !== '' && Number(value) > max) return;
        setScores(prev => ({
            ...prev,
            [studentId]: { ...(prev[studentId] || {}), [subjectId]: value }
        }));
    };

    // ── Save all ───────────────────────────────────────────────────────────────
    const handleSaveAll = async () => {
        if (!sheetLoaded) return;
        setSaving(true);
        setMessage({ text: '', type: '' });
        try {
            // Save each subject's scores as a batch
            const savePromises = subjects.map(async (subj) => {
                const at = assessmentMap[subj._id];
                if (!at) return;

                const scoresPayload = students
                    .filter(st => scores[st._id]?.[subj._id] !== '' && scores[st._id]?.[subj._id] != null)
                    .map(st => ({
                        studentId: st._id,
                        score: Number(scores[st._id][subj._id])
                    }));

                if (scoresPayload.length === 0) return;

                await gradeService.saveGradeSheet({
                    assessmentTypeId: at._id,
                    subjectId: subj._id,
                    semester: at.semester || currentSemester,
                    academicYear: at.year?.toString() || academicYear,
                    scores: scoresPayload,
                });
            });

            await Promise.all(savePromises);
            setMessage({ text: `✅ All grades saved successfully for ${students.length} students.`, type: 'success' });
        } catch (err) {
            setMessage({ text: err.response?.data?.message || err.message || 'Error saving grades.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // ── PDF Upload → saves directly to DB ─────────────────────────────────────
    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== 'application/pdf') {
            setMessage({ text: 'Only PDF files are allowed.', type: 'error' });
            return;
        }
        if (!selectedClass || !selectedStream || !testPeriod) {
            setMessage({ text: 'Please select class, stream and test period before uploading.', type: 'error' });
            return;
        }

        setPdfLoading(true);
        setMessage({ text: '', type: '' });

        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('classId', selectedClass);
        formData.append('streamId', selectedStream);
        formData.append('testPeriod', testPeriod);

        try {
            const res = await gradeService.uploadPdfGrades(formData);
            const { successCount, skipCount, totalExtracted } = res.data.data || {};
            const detail = successCount !== undefined
                ? ` (${successCount} saved, ${skipCount} skipped out of ${totalExtracted} extracted)`
                : '';
            setMessage({ text: `✅ ${res.data.message}${detail}`, type: 'success' });

            // Reload the sheet to show updated scores
            if (successCount > 0 && sheetLoaded) {
                await handleLoadSheet();
            }
        } catch (err) {
            setMessage({
                text: err.response?.data?.message || err.message || 'PDF upload failed.',
                type: 'error'
            });
        } finally {
            setPdfLoading(false);
            if (pdfInputRef.current) pdfInputRef.current.value = '';
        }
    };

    // ── Helpers ────────────────────────────────────────────────────────────────
    const getScore = (studentId, subjectId) => scores[studentId]?.[subjectId] ?? '';

    const getRowTotal = (studentId) =>
        subjects.reduce((sum, subj) => {
            const v = scores[studentId]?.[subj._id];
            return sum + (v !== '' && v != null ? Number(v) : 0);
        }, 0);

    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff';

    return (
        <div className="max-w-full mx-auto p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">

                {/* ── Header ── */}
                <div className="bg-slate-800 p-6 text-white">
                    <h1 className="text-2xl font-black uppercase tracking-tight">
                        📋 {t('grade_entry_title') || 'Grade Entry Sheet'}
                    </h1>
                    <p className="opacity-60 text-sm mt-1">
                        All subjects per stream — view, edit and upload marks
                    </p>
                </div>

                {/* ── Selectors ── */}
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 border-b border-slate-100">
                    {/* Class */}
                    <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            {t('select_class') || 'Class'}
                        </label>
                        <select
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                            className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none bg-white font-bold text-slate-700"
                        >
                            <option value="">-- Select Class --</option>
                            {classes.map(c => (
                                <option key={c._id} value={c._id}>{c.className}</option>
                            ))}
                        </select>
                    </div>

                    {/* Stream */}
                    <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            {t('select_stream') || 'Stream'}
                        </label>
                        <select
                            value={selectedStream}
                            onChange={e => setSelectedStream(e.target.value)}
                            disabled={!selectedClass}
                            className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none bg-white font-bold text-slate-700 disabled:opacity-50"
                        >
                            <option value="">-- Select Stream --</option>
                            {streams.map(s => (
                                <option key={s._id} value={s._id}>{s.streamName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Test Period */}
                    <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            {t('test_period') || 'Test Period'}
                        </label>
                        <select
                            value={testPeriod}
                            onChange={e => setTestPeriod(e.target.value)}
                            className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none bg-white font-bold text-slate-700"
                        >
                            <option value="">-- Select Period --</option>
                            {testPeriods.map(tp => (
                                <option key={tp.value} value={tp.value}>{tp.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Load button */}
                    <div className="flex items-end">
                        <button
                            onClick={handleLoadSheet}
                            disabled={!selectedClass || !selectedStream || !testPeriod || loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Loading...
                                </span>
                            ) : '📂 Load Sheet'}
                        </button>
                    </div>
                </div>

                {/* ── Message ── */}
                {message.text && (
                    <div className={`mx-5 mt-4 p-4 rounded-xl border font-bold text-sm flex items-start gap-2 ${
                        message.type === 'success'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : 'bg-rose-50 border-rose-100 text-rose-700'
                    }`}>
                        <span>{message.type === 'success' ? '✅' : '⚠️'}</span>
                        <span>{message.text}</span>
                    </div>
                )}

                {/* ── PDF Upload + Save bar ── */}
                {sheetLoaded && (
                    <div className="px-5 py-4 flex flex-wrap items-center gap-3 bg-indigo-50 border-b border-indigo-100">
                        {/* PDF Upload */}
                        <div className="flex items-center gap-2">
                            <input
                                ref={pdfInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handlePdfUpload}
                                className="hidden"
                                id="pdf-grade-upload"
                                disabled={pdfLoading}
                            />
                            <label
                                htmlFor="pdf-grade-upload"
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm cursor-pointer transition-all shadow-sm ${
                                    pdfLoading
                                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                                }`}
                            >
                                {pdfLoading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Uploading PDF...
                                    </>
                                ) : (
                                    <>📄 Upload PDF Marks</>
                                )}
                            </label>
                            <span className="text-xs text-indigo-500 font-medium">
                                Saves all subjects to DB automatically
                            </span>
                        </div>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Save All button */}
                        <button
                            onClick={handleSaveAll}
                            disabled={saving}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-100 transition-all disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : '💾 Save All Grades'}
                        </button>
                    </div>
                )}

                {/* ── Grade Table ── */}
                {sheetLoaded && students.length > 0 && (
                    <div className="p-5">
                        <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-800 text-white">
                                        <th className="px-4 py-3 text-left font-black text-xs uppercase tracking-widest sticky left-0 bg-slate-800 z-10 min-w-[180px]">
                                            Student Name
                                        </th>
                                        {subjects.map(subj => (
                                            <th key={subj._id} className="px-3 py-3 text-center font-black text-xs uppercase tracking-widest min-w-[110px]">
                                                <div>{subj.name}</div>
                                                {assessmentMap[subj._id] && (
                                                    <div className="text-slate-400 font-normal normal-case text-[10px] mt-0.5">
                                                        /{assessmentMap[subj._id].totalMarks}
                                                    </div>
                                                )}
                                            </th>
                                        ))}
                                        <th className="px-3 py-3 text-center font-black text-xs uppercase tracking-widest min-w-[80px] bg-slate-700">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {students.map((student, idx) => (
                                        <tr
                                            key={student._id}
                                            className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-indigo-50/40 transition-colors`}
                                        >
                                            {/* Name */}
                                            <td className={`px-4 py-2 font-bold text-slate-700 sticky left-0 z-10 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-indigo-50/40`}>
                                                <span className="text-slate-400 text-xs mr-2">{idx + 1}.</span>
                                                {student.fullName}
                                            </td>

                                            {/* Score per subject */}
                                            {subjects.map(subj => {
                                                const at = assessmentMap[subj._id];
                                                const hasAt = !!at;
                                                return (
                                                    <td key={subj._id} className="px-2 py-2 text-center">
                                                        {hasAt ? (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max={at.totalMarks}
                                                                value={getScore(student._id, subj._id)}
                                                                onChange={e => handleScoreChange(student._id, subj._id, e.target.value)}
                                                                className="w-20 text-center border-2 border-slate-200 rounded-lg py-1.5 px-2 font-bold text-slate-700 focus:border-indigo-400 focus:outline-none transition-colors"
                                                                placeholder="—"
                                                            />
                                                        ) : (
                                                            <span className="text-slate-300 text-xs">N/A</span>
                                                        )}
                                                    </td>
                                                );
                                            })}

                                            {/* Row total */}
                                            <td className="px-3 py-2 text-center font-black text-indigo-700 bg-indigo-50">
                                                {getRowTotal(student._id) || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                                {/* Column totals / averages */}
                                <tfoot>
                                    <tr className="bg-slate-100 border-t-2 border-slate-200">
                                        <td className="px-4 py-2 font-black text-slate-500 text-xs uppercase sticky left-0 bg-slate-100">
                                            Avg
                                        </td>
                                        {subjects.map(subj => {
                                            const vals = students
                                                .map(st => scores[st._id]?.[subj._id])
                                                .filter(v => v !== '' && v != null)
                                                .map(Number);
                                            const avg = vals.length
                                                ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
                                                : '—';
                                            return (
                                                <td key={subj._id} className="px-3 py-2 text-center font-black text-slate-600 text-xs">
                                                    {avg}
                                                </td>
                                            );
                                        })}
                                        <td className="px-3 py-2 text-center font-black text-indigo-600 text-xs bg-indigo-50">
                                            {(() => {
                                                const totals = students.map(st => getRowTotal(st._id)).filter(v => v > 0);
                                                return totals.length
                                                    ? (totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(1)
                                                    : '—';
                                            })()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Summary bar */}
                        <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                            <span>👥 {students.length} students</span>
                            <span>📚 {subjects.length} subjects</span>
                            <span>📅 {testPeriod}</span>
                            {academicYear && <span>🗓 {academicYear}</span>}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!sheetLoaded && !loading && (
                    <div className="p-16 text-center text-slate-400">
                        <div className="text-5xl mb-4">📋</div>
                        <p className="font-bold text-lg">Select class, stream and test period, then click Load Sheet</p>
                        <p className="text-sm mt-1">All subjects and existing grades will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GradeSheetPage;
