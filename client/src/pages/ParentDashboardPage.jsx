import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import studentAuthService from '../services/studentAuthService';
import studentService from '../services/studentService';
import gradeService from '../services/gradeService';
import behavioralReportService from '../services/behavioralReportService';
import rankService from '../services/rankService';

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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const MONTH_ORDER = {
    "September": 1, "October": 2, "November": 3, "December": 4,
    "January": 5, "February": 6, "March": 7, "April": 8, "May": 9, "June": 10,
    "July": 11, "August": 12
};

const ParentDashboardPage = () => {
    const { t } = useTranslation();

    const [student, setStudent] = useState(null);
    const [grades, setGrades] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ranks, setRanks] = useState({ sem1: '-', sem2: '-', overall: '-' });

    useEffect(() => {
        const loadDashboard = async () => {
            setLoading(true);
            try {
                const currentStudent = studentAuthService.getCurrentStudent();
                if (!currentStudent) throw new Error("Authentication failed.");

                const [studentRes, gradesRes, reportsRes] = await Promise.allSettled([
                    studentService.getStudentById(currentStudent._id),
                    gradeService.getGradesByStudent(currentStudent._id),
                    behavioralReportService.getReportsByStudent(currentStudent._id)
                ]);

                if (studentRes.status === 'rejected') throw new Error("Could not load student profile.");
                const studentData = studentRes.value.data.data;
                setStudent(studentData);

                const fetchedGrades = gradesRes.status === 'fulfilled' ? gradesRes.value.data.data : [];
                setGrades(fetchedGrades);
                const fetchedReports = reportsRes.status === 'fulfilled' ? reportsRes.value.data.data : [];
                setReports(fetchedReports);

                const academicYear = fetchedGrades.length > 0 ? fetchedGrades[0].academicYear : '2018';

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
    }, []);

    // --- RESTORED ANALYTICS ENGINE ---
    const { studentStats, insights, processedSemesters } = useMemo(() => {
        if (!grades.length) return { studentStats: null, insights: null, processedSemesters: {} };

        const subjectPerformance = {};
        const categories = { critical: [], average: [], good: [], excellent: [] };
        let grandTotalScore = 0;
        let grandTotalMax = 0;

        // Group by Semester for the UI
        const semGroup = grades.reduce((acc, g) => {
            acc[g.semester] = acc[g.semester] || [];
            acc[g.semester].push(g);
            return acc;
        }, {});

        const processedSem = {};
        Object.entries(semGroup).forEach(([semName, rawGrades]) => {
            processedSem[semName] = rawGrades.map(grade => {
                const totalScore = grade.assessments.reduce((acc, curr) => acc + curr.score, 0);
                const totalMax = grade.assessments.reduce((acc, curr) => acc + (curr.assessmentType?.totalMarks || 0), 0);
                const percentage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
                
                grandTotalScore += totalScore;
                grandTotalMax += totalMax;

                // For Insights
                const item = { name: grade.subject?.name, pct: percentage.toFixed(1) };
                if (percentage < 60) categories.critical.push(item);
                else if (percentage < 75) categories.average.push(item);
                else if (percentage < 90) categories.good.push(item);
                else categories.excellent.push(item);

                // For Subject Mapping
                const flatAssessments = grade.assessments.map(a => ({
                    id: a._id || Math.random(),
                    monthName: a.assessmentType?.month || 'Other',
                    testName: a.assessmentType?.name,
                    score: a.score,
                    totalMarks: a.assessmentType?.totalMarks
                })).sort((a, b) => (MONTH_ORDER[a.monthName] || 99) - (MONTH_ORDER[b.monthName] || 99));

                const groupedByMonth = flatAssessments.reduce((acc, curr) => {
                    if (!acc[curr.monthName]) acc[curr.monthName] = [];
                    acc[curr.monthName].push(curr);
                    return acc;
                }, {});

                return { ...grade, groupedByMonth, subjectTotalMax: totalMax, percentage };
            });
        });

        // Best/Worst Calculation
        const perfArray = Object.values(processedSem).flat().map(g => ({ name: g.subject.name, pct: g.percentage }));
        perfArray.sort((a, b) => b.pct - a.pct);

        return {
            studentStats: {
                best: perfArray[0],
                worst: perfArray[perfArray.length - 1],
                avg: (grandTotalScore / grandTotalMax) * 100
            },
            insights: categories,
            processedSemesters: processedSem
        };
    }, [grades]);

    const chartData = useMemo(() => {
        if (!grades.length) return null;
        const monthlyTotals = {};
        grades.forEach(grade => {
            grade.assessments.forEach(assess => {
                const month = assess.assessmentType?.month;
                if (month && assess.assessmentType?.totalMarks > 0) {
                    if (!monthlyTotals[month]) monthlyTotals[month] = { obtained: 0, max: 0 };
                    monthlyTotals[month].obtained += assess.score;
                    monthlyTotals[month].max += assess.assessmentType.totalMarks;
                }
            });
        });
        const labels = Object.keys(MONTH_ORDER).filter(m => monthlyTotals[m]);
        return {
            labels: labels.map(l => t(l)),
            datasets: [{
                label: 'Performance %',
                data: labels.map(m => ((monthlyTotals[m].obtained / monthlyTotals[m].max) * 100).toFixed(1)),
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };
    }, [grades, t]);

    const calculateAge = (dob) => {
        if (!dob) return '-';
        const birthYear = parseInt(String(dob).substring(0, 4));
        const gcYear = new Date().getFullYear();
        const gcMonth = new Date().getMonth() + 1;
        const ethYear = gcMonth > 9 ? gcYear - 7 : gcYear - 8;
        return isNaN(birthYear) ? '-' : ethYear - birthYear;
    };

    if (loading) return <div className="flex justify-center items-center h-screen font-bold text-slate-400">{t('loading')}...</div>;
    if (error) return <div className="p-10 text-center text-red-500 bg-red-50 h-screen flex flex-col items-center justify-center">{error}</div>;

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans print:bg-white print:p-0">
            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 12mm; }
                    .no-print { display: none !important; }
                    .subject-card { break-inside: avoid; border: 1px solid #cbd5e1 !important; margin-bottom: 1.5rem !important; }
                    .print-bg-dark { background-color: #1e293b !important; color: white !important; -webkit-print-color-adjust: exact; }
                    .print-bg-blue { background-color: #3b82f6 !important; -webkit-print-color-adjust: exact; }
                    .print-border-blue { border-left: 4px solid #3b82f6 !important; }
                }
            `}</style>

            {/* RESTORED HEADER WITH FULL CONTACT INFO */}
            <div className="max-w-6xl mx-auto mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-8 justify-between">
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
                            <p><strong>{t('Father_contact')}:</strong> {student.fatherContact}</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-center gap-4">
                    <div className="bg-indigo-600 text-white p-4 rounded-2xl text-center shadow-lg w-32">
                        <p className="text-[10px] uppercase font-bold opacity-70">{t('rank')}</p>
                        <p className="text-3xl font-black">{ranks.overall}</p>
                    </div>
                    <button onClick={() => window.print()} className="no-print bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold">🖨️ {t('print')}</button>
                </div>
            </div>

            {/* CHARTS & STATS CARDS */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 no-print">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-64">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">{t('monthly_progress')}</h3>
                    {chartData && <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />}
                </div>
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">{t('key_performance')}</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                <div><p className="text-[10px] text-green-600 font-bold uppercase">{t('best_subject')}</p><p className="font-bold text-slate-800">{studentStats?.best?.name}</p></div>
                                <p className="text-xl font-black text-green-700">{studentStats?.best?.pct.toFixed(0)}%</p>
                            </div>
                            <div className="flex justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                <div><p className="text-[10px] text-red-600 font-bold uppercase">{t('needs_focus')}</p><p className="font-bold text-slate-800">{studentStats?.worst?.name}</p></div>
                                <p className="text-xl font-black text-red-700">{studentStats?.worst?.pct.toFixed(0)}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RESTORED INSIGHTS GRID */}
            <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 no-print">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">📊 {t('academic_insights')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['critical', 'average', 'good', 'excellent'].map((cat) => (
                        <div key={cat} className={`rounded-xl p-4 border ${cat === 'critical' ? 'bg-red-50 border-red-100' : cat === 'average' ? 'bg-yellow-50 border-yellow-100' : cat === 'good' ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
                            <h4 className="text-[10px] font-bold uppercase mb-2 opacity-70">{t(`${cat}_range`)}</h4>
                            {insights[cat].length > 0 ? (
                                <ul className="space-y-1">{insights[cat].map((s, i) => <li key={i} className="text-xs flex justify-between font-medium"><span>{s.name}</span> <span>{s.pct}%</span></li>)}</ul>
                            ) : <p className="text-[10px] italic text-slate-400">{t('no_subjects')}</p>}
                        </div>
                    ))}
                </div>
            </div>

            {/* CARDS FEED */}
            <div className="max-w-6xl mx-auto pb-20">
                {Object.entries(processedSemesters).map(([semesterName, subjectGrades]) => (
                    <div key={semesterName} className="mb-12">
                        <div className="flex justify-between items-end mb-6 border-b-2 border-slate-800 pb-2">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{semesterName === 'First Semester' ? t('sem_1') : t('sem_2')}</h2>
                            <span className="text-sm font-bold text-slate-500">{t('rank')}: {semesterName === 'First Semester' ? ranks.sem1 : ranks.sem2}</span>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {subjectGrades.map((grade) => (
                                <div key={grade._id} className="subject-card bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                                    <div className="print-bg-dark bg-slate-800 px-6 py-4 flex justify-between items-center text-white">
                                        <h3 className="text-lg font-bold uppercase tracking-wide">{grade.subject.name}</h3>
                                        <p className="text-2xl font-black">{grade.finalScore} <span className="text-sm opacity-40">/ {grade.subjectTotalMax}</span></p>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        {Object.entries(grade.groupedByMonth).map(([month, tests]) => (
                                            <div key={month} className="print-border-blue border-l-4 border-indigo-500 pl-4">
                                                <h4 className="text-xs font-black text-indigo-900 uppercase mb-3">{t(month)}</h4>
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
                                    <div className="h-2 w-full bg-slate-100">
                                        <div className="print-bg-blue h-full bg-indigo-600" style={{ width: `${(grade.finalScore / grade.subjectTotalMax) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl">
                            <p className="text-[10px] uppercase font-bold text-amber-700 mb-1">{t('teacher_comment')}</p>
                            <p className="text-sm text-amber-900 italic font-medium">"{reports.find(r => r.semester === semesterName)?.teacherComment || "No comment available."}"</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ParentDashboardPage;