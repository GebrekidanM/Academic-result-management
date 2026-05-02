import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import studentAuthService from '../services/studentAuthService';
import studentService from '../services/studentService';
import gradeService from '../services/gradeService';
import behavioralReportService from '../services/behavioralReportService';
import rankService from '../services/rankService';
import quizService from '../services/quizService';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import Quiz from './parent/Quiz';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const MONTH_ORDER = {
    "September": 1, "October": 2, "November": 3, "December": 4,
    "January": 5, "February": 6, "March": 7, "April": 8, "May": 9, "June": 10,
    "July": 11, "August": 12
};

const ParentDashboardPage = () => {
    const { t } = useTranslation();
    const [availableQuizzes, setAvailableQuizzes] = useState([]);
    const [student, setStudent] = useState(null);
    const [grades, setGrades] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ranks, setRanks] = useState({ sem1: '-', sem2: '-', overall: '-' });
    const [quizStatuses, setQuizStatuses] = useState({}); 
    const [showCompleted, setShowCompleted] = useState(false);
    const navigate = useNavigate()
    // NEW: Nested Tab State Strategy
    const [activeMainTab, setActiveMainTab] = useState('analytics'); // 'analytics', 'First Semester', 'Second Semester'
    const[activeAnalyticsTab, setActiveAnalyticsTab] = useState('overall'); // 'overall', 'First Semester', 'Second Semester'

    useEffect(() => {
        const loadDashboard = async () => {
            setLoading(true);
            try {
                const currentStudent = studentAuthService.getCurrentStudent();
                if (!currentStudent) throw new Error("Authentication failed.");

                const [studentRes, gradesRes, reportsRes] = await Promise.allSettled([
                    studentService.getStudentById(currentStudent._id),
                    gradeService.getGradesByStudent(currentStudent._id),
                    behavioralReportService.getReportsByStudent(currentStudent._id),
                ]);

                if (studentRes.status === 'rejected') throw new Error("Could not load student profile.");
                const studentData = studentRes.value.data.data;
                setStudent(studentData);

                const fetchedGrades = gradesRes.status === 'fulfilled' ? gradesRes.value.data.data :[];
                setGrades(fetchedGrades);
                const fetchedReports = reportsRes.status === 'fulfilled' ? reportsRes.value.data.data :[];
                setReports(fetchedReports);

                const academicYear = fetchedGrades.length > 0 ? fetchedGrades[0].academicYear : '2018';

                 try {
                    const quizRes = await quizService.getAvailableQuizzes(studentData.gradeLevel, academicYear);
                    setAvailableQuizzes(quizRes.data.data);
                } catch (qErr) {
                    console.warn("Could not load quizzes", qErr);
                }

                try {
                    const rankData = await rankService.getRankByStudent(studentData._id, studentData.gradeLevel, academicYear);
                    setRanks(rankData);
                } catch (e) {
                    console.warn("Rank fetch failed", e);
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    },[]);

    useEffect(() => {
        if (availableQuizzes.length > 0) {
            availableQuizzes.forEach(q => {
                quizService.getQuizStatus(q._id).then(res => {
                    setQuizStatuses(prev => ({ ...prev, [q._id]: res.data }));
                });
            });
        }
    }, [availableQuizzes]);

    const pendingQuizzes = availableQuizzes.filter(q => quizStatuses[q._id] && !quizStatuses[q._id].hasTaken);
    const completedQuizzes = availableQuizzes.filter(q => quizStatuses[q._id] && quizStatuses[q._id].hasTaken);
    // --- ANALYTICS ENGINE ---
    const analyticsData = useMemo(() => {
        if (!grades.length) return { overall: null, semesters: {} };

        const processGrades = (gradeList) => {
            if (!gradeList || gradeList.length === 0) return null;

            let grandTotalScore = 0;
            let grandTotalMax = 0;
            const categories = { critical: [], average: [], good: [], excellent:[] };
            const monthlyTotals = {};
            const subjectList =[];

            const processedGrades = gradeList.map(grade => {
                const totalScore = grade.assessments.reduce((acc, curr) => acc + curr.score, 0);
                const totalMax = grade.assessments.reduce((acc, curr) => acc + (curr.assessmentType?.totalMarks || 0), 0);
                const percentage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;

                grandTotalScore += totalScore;
                grandTotalMax += totalMax;

                const item = { name: grade.subject?.name, pct: percentage.toFixed(1) };
                if (percentage < 60) categories.critical.push(item);
                else if (percentage < 75) categories.average.push(item);
                else if (percentage < 90) categories.good.push(item);
                else categories.excellent.push(item);

                subjectList.push({ name: grade.subject?.name, pct: percentage });

                const flatAssessments =[];
                grade.assessments.forEach(a => {
                    const monthName = a.assessmentType?.month || 'Other';
                    const score = a.score || 0;
                    const max = a.assessmentType?.totalMarks || 0;

                    flatAssessments.push({
                        id: a._id || Math.random(),
                        monthName,
                        testName: a.assessmentType?.name,
                        score,
                        totalMarks: max
                    });

                    if (monthName && max > 0) {
                        if (!monthlyTotals[monthName]) monthlyTotals[monthName] = { obtained: 0, max: 0 };
                        monthlyTotals[monthName].obtained += score;
                        monthlyTotals[monthName].max += max;
                    }
                });

                flatAssessments.sort((a, b) => (MONTH_ORDER[a.monthName] || 99) - (MONTH_ORDER[b.monthName] || 99));
                const groupedByMonth = flatAssessments.reduce((acc, curr) => {
                    if (!acc[curr.monthName]) acc[curr.monthName] = [];
                    acc[curr.monthName].push(curr);
                    return acc;
                }, {});

                return { ...grade, groupedByMonth, subjectTotalMax: totalMax, finalScore: totalScore, percentage };
            });

            subjectList.sort((a, b) => b.pct - a.pct);

            const labels = Object.keys(MONTH_ORDER).filter(m => monthlyTotals[m]);
            const chartData = {
                labels: labels.map(l => t(l) || l),
                datasets:[{
                    label: 'Performance %',
                    data: labels.map(m => ((monthlyTotals[m].obtained / monthlyTotals[m].max) * 100).toFixed(1)),
                    borderColor: 'rgb(79, 70, 229)',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            };

            return {
                processedGrades,
                stats: {
                    best: subjectList[0] || null,
                    worst: subjectList[subjectList.length - 1] || null,
                    avg: grandTotalMax > 0 ? (grandTotalScore / grandTotalMax) * 100 : 0
                },
                insights: categories,
                chartData
            };
        };

        const overall = processGrades(grades);
        const semGroup = grades.reduce((acc, g) => {
            acc[g.semester] = acc[g.semester] || [];
            acc[g.semester].push(g);
            return acc;
        }, {});

        const semesters = {};
        Object.keys(semGroup).forEach(sem => {
            semesters[sem] = processGrades(semGroup[sem]);
        });

        return { overall, semesters };
    }, [grades, t]);
    

    const calculateAge = (dob) => {
        if (!dob) return '-';
        const birthYear = parseInt(String(dob).substring(0, 4));
        const gcYear = new Date().getFullYear();
        const gcMonth = new Date().getMonth() + 1;
        const ethYear = gcMonth > 9 ? gcYear - 7 : gcYear - 8;
        return isNaN(birthYear) ? '-' : ethYear - birthYear;
    };

    // Render Blocks Logic
    const renderAnalyticsBlock = (data) => {
        if (!data) return null;
        return (
            <div className="animate-fade-in mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-72">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">{t('monthly_progress')}</h3>
                        {data.chartData && <Line data={data.chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />}
                    </div>
                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full">
                            <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">{t('key_performance')}</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                    <div><p className="text-[10px] text-green-600 font-bold uppercase">{t('best_subject')}</p><p className="font-bold text-slate-800">{data.stats.best?.name || '-'}</p></div>
                                    <p className="text-xl font-black text-green-700">{data.stats.best?.pct ? `${data.stats.best.pct.toFixed(0)}%` : '-'}</p>
                                </div>
                                <div className="flex justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                    <div><p className="text-[10px] text-red-600 font-bold uppercase">{t('needs_focus')}</p><p className="font-bold text-slate-800">{data.stats.worst?.name || '-'}</p></div>
                                    <p className="text-xl font-black text-red-700">{data.stats.worst?.pct ? `${data.stats.worst.pct.toFixed(0)}%` : '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                    <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">🎯 {t('academic_insights')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {['critical', 'average', 'good', 'excellent'].map((cat) => (
                            <div key={cat} className={`rounded-xl p-4 border ${cat === 'critical' ? 'bg-red-50 border-red-100' : cat === 'average' ? 'bg-yellow-50 border-yellow-100' : cat === 'good' ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
                                <h4 className="text-[10px] font-bold uppercase mb-2 opacity-70">{t(`${cat}_range`) || cat}</h4>
                                {data.insights && data.insights[cat].length > 0 ? (
                                    <ul className="space-y-1">{data.insights[cat].map((s, i) => <li key={i} className="text-xs flex justify-between font-medium"><span>{s.name}</span> <span>{s.pct}%</span></li>)}</ul>
                                ) : <p className="text-[10px] italic text-slate-400">{t('no_subjects')}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="flex justify-center items-center h-screen font-bold text-slate-400">{t('loading')}...</div>;
    if (error) return <div className="p-10 text-center text-red-500 bg-red-50 h-screen flex flex-col items-center justify-center">{error}</div>;

    const { overall, semesters } = analyticsData;

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans print:bg-white print:p-0">
            <div className="max-w-6xl mx-auto mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-8 justify-between">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <img src={student.imageUrl} alt="Profile" className="w-32 h-32 rounded-full border-4 border-slate-100 shadow-sm object-cover" />
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 text-center md:text-left">{student.fullName}</h2>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm text-slate-600">
                            <p><strong>{t('grade')}:</strong> {student.gradeLevel}</p>
                            <p><strong>{t('id_no')}:</strong> {student.studentId}</p>
                            <p><strong>{t('age')}:</strong> {calculateAge(student.dateOfBirth)}</p>
                            <p><strong>{t('parent_name')}:</strong> {student.motherName}</p>
                            <p><strong>{t('contact')}:</strong> {student.motherContact}</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-row items-center gap-4">
                    <div className="bg-indigo-600 text-white p-4 rounded-2xl text-center shadow-md w-28 md:w-32">
                        <p className="text-[10px] uppercase font-bold opacity-80">{'Rank'}</p>
                        <p className="text-xl font-black">{ranks.overall}</p>
                    </div>
                    <div className="bg-emerald-600 text-white p-4 rounded-2xl text-center shadow-md w-28 md:w-32">
                        <p className="text-[10px] uppercase font-bold opacity-80">{'Average'}</p>
                        <p className="text-xl font-black">{overall?.stats.avg?.toFixed(1) || 0}%</p>
                    </div>
                </div>
            </div>

            {/* QUIZ CENTER SECTION */}
            <div className="max-w-6xl mx-auto mt-12 mb-20 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-black text-slate-800 mb-6">📝 {t('quiz_center')}</h2>

                {/* 1. Pending Quizzes (Cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {pendingQuizzes.map(q => <Quiz key={q._id} quiz={q} status={quizStatuses[q._id]} />)}
                </div>

                {/* 2. Completed Quizzes (Collapsible List) */}
                {completedQuizzes.length > 0 && (
                    <div className="border-t pt-6">
                        <button 
                            onClick={() => setShowCompleted(!showCompleted)}
                            className="flex items-center justify-between w-full text-slate-700 font-bold text-xs uppercase tracking-widest hover:text-slate-800"
                        >
                            {t('Completed')} ({completedQuizzes.length})
                            <span>{showCompleted ? '▲' : '▼'}</span>
                        </button>
                        
                        {showCompleted && (
                            <div className="mt-4 space-y-2 animate-fade-in">
                                {completedQuizzes.map(q => (
                                    <div key={q._id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="font-bold text-slate-700 text-sm">{q.title}</span>
                                        <button 
                                            onClick={() => navigate(`/quiz/result/${q._id}`)}
                                            className="text-indigo-800 font-bold text-xs"
                                        >
                                            {t('View')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* LEVEL 1: MAIN NAVIGATION TABS */}
            <div className="max-w-6xl mx-auto flex flex-wrap gap-6 mb-8 border-b-2 border-slate-200 print:hidden">
                <button
                    onClick={() => setActiveMainTab('analytics')}
                    className={`pb-3 text-base font-black transition-all duration-200 border-b-4 ${
                        activeMainTab === 'analytics' 
                        ? 'border-indigo-600 text-indigo-700' 
                        : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                    }`}
                >
                    📊 {t('overview_analytics') || 'Overview Analytics'}
                </button>
                
                {Object.keys(semesters).map(sem => (
                    <button
                        key={sem}
                        onClick={() => setActiveMainTab(sem)}
                        className={`pb-3 text-base font-black transition-all duration-200 border-b-4 ${
                            activeMainTab === sem 
                            ? 'border-indigo-600 text-indigo-700' 
                            : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                        }`}
                    >
                        📝 {sem === 'First Semester' ? t('sem_1') : t('sem_2')} Details
                    </button>
                ))}
            </div>

            <div className="max-w-6xl mx-auto pb-20">
                
                {/* 1. OVERVIEW ANALYTICS TAB CONTENT (Contains Nested Sub-Tabs) */}
                {activeMainTab === 'analytics' && overall && (
                    <div className="animate-fade-in bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
                        
                        {/* LEVEL 2: SUB-TABS (Segmented Control style) */}
                        <div className="flex flex-wrap gap-2 mb-2 bg-slate-100 p-1.5 rounded-xl inline-flex print:hidden">
                            <button
                                onClick={() => setActiveAnalyticsTab('overall')}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                                    activeAnalyticsTab === 'overall' 
                                    ? 'bg-white text-indigo-700 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                🌐 {t('overall_year') || 'Overall Year'}
                            </button>
                            {Object.keys(semesters).map(sem => (
                                <button
                                    key={sem}
                                    onClick={() => setActiveAnalyticsTab(sem)}
                                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                                        activeAnalyticsTab === sem 
                                        ? 'bg-white text-indigo-700 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    📅 {sem === 'First Semester' ? t('sem_1') : t('sem_2')}
                                </button>
                            ))}
                        </div>

                        {/* RENDER THE SELECTED ANALYTICS DATA */}
                        {activeAnalyticsTab === 'overall' && renderAnalyticsBlock(overall)}
                        {Object.entries(semesters).map(([semName, semData]) => (
                            activeAnalyticsTab === semName ? <div key={semName}>{renderAnalyticsBlock(semData)}</div> : null
                        ))}

                    </div>
                )}


                {/* 2. SPECIFIC SEMESTER DETAILS (Just the Subject Breakdown Grades) */}
                {Object.entries(semesters).map(([semesterName, semData]) => {
                    if (activeMainTab !== semesterName) return null;

                    return (
                        <div key={semesterName} className="animate-fade-in mb-12">
                            {/* Semester Header Info */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-slate-800 text-white p-4 rounded-xl shadow-md gap-3">
                                <h2 className="text-xl font-black uppercase tracking-tight">
                                    {semesterName === 'First Semester' ? t('sem_1') : t('sem_2')} Grades
                                </h2>
                                <div className="flex flex-col md:flex-row gap-3">
                                    <div className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg shadow-sm">
                                        <span className="text-xs uppercase font-bold mr-2">{t('sem_average') || 'Sem Average'}:</span>
                                        <span className="text-lg font-black">{semData.stats.avg.toFixed(1)}%</span>
                                    </div>
                                    <div className="bg-indigo-500 text-white px-4 py-1.5 rounded-lg shadow-sm">
                                        <span className="text-xs uppercase font-bold mr-2">{t('sem_rank') || 'Sem Rank'}:</span>
                                        <span className="text-lg font-black">{semesterName === 'First Semester' ? ranks.sem1 : ranks.sem2}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Subject List */}
                            <div className="grid grid-cols-1 gap-6 mt-4">
                                {semData.processedGrades.map((grade) => (
                                    <div key={grade._id} className="subject-card bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                                        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                                            <h3 className="text-lg font-bold uppercase tracking-wide text-slate-800">{grade.subject.name}</h3>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-slate-800">{grade.finalScore} <span className="text-sm opacity-50">/ {grade.subjectTotalMax}</span></p>
                                                <p className="text-xs font-bold text-indigo-600">{grade.percentage.toFixed(1)}%</p>
                                            </div>
                                        </div>
                                        <div className="p-6 space-y-6">
                                            {Object.entries(grade.groupedByMonth).map(([month, tests]) => (
                                                <div key={month} className="border-l-4 border-indigo-500 pl-4">
                                                    <h4 className="text-xs font-black text-indigo-900 uppercase mb-3">{t(month) || month}</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {tests.map(test => (
                                                            <div key={test.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center">
                                                                <span className="text-xs text-slate-500 font-medium">{test.testName}</span>
                                                                <span className="text-sm font-bold text-slate-700">{test.score} <span className="text-[10px] opacity-40">/ {test.totalMarks}</span></span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100">
                                            <div className="h-full bg-indigo-600" style={{ width: `${grade.percentage}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Teacher Comment */}
                            <div className="mt-8 p-6 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl shadow-sm">
                                <p className="text-xs uppercase font-bold text-amber-700 mb-2">{t('teacher_comment')}</p>
                                <p className="text-base text-amber-900 italic font-medium">"{reports.find(r => r.semester === semesterName)?.teacherComment || t('no_comment_available') || "No comment available."}"</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ParentDashboardPage;