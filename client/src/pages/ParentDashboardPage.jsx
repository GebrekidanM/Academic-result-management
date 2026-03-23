import React, { useState, useEffect, useMemo} from 'react';
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

const monthOrder = {
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

                const academicYear = fetchedGrades.length > 0 ? fetchedGrades[0].academicYear : '2017'; 
                
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

    // --- ANALYTICS ---
    const studentStats = useMemo(() => {
        if (!grades.length) return null;
        const subjectPerformance = {};
        let grandTotalScore = 0;
        let grandTotalMax = 0;

        grades.forEach(g => {
            const totalScore = g.assessments.reduce((acc, curr) => acc + curr.score, 0);
            const totalMax = g.assessments.reduce((acc, curr) => acc + (curr.assessmentType?.totalMarks || 0), 0);
            grandTotalScore += totalScore;
            grandTotalMax += totalMax;

            if (totalMax > 0) {
                if (!subjectPerformance[g.subject.name]) subjectPerformance[g.subject.name] = { score: 0, max: 0 };
                subjectPerformance[g.subject.name].score += totalScore;
                subjectPerformance[g.subject.name].max += totalMax;
            }
        });

        const performanceArray = Object.keys(subjectPerformance).map(subject => ({
            subject,
            percentage: ((subjectPerformance[subject].score / subjectPerformance[subject].max) * 100)
        }));

        performanceArray.sort((a, b) => b.percentage - a.percentage);
        const overallAverage = grandTotalMax > 0 ? (grandTotalScore / grandTotalMax) * 100 : 0;

        return {
            bestSubject: performanceArray[0],
            worstSubject: performanceArray[performanceArray.length - 1],
            overallAverage: overallAverage
        };
    }, [grades]);

    const insights = useMemo(() => {
        if (!grades || grades.length === 0) return null;
        const categories = { critical: [], average: [], good: [], excellent: [] };

        grades.forEach(grade => {
            const subjectName = grade.subject?.name || "Unknown";
            const totalScore = grade.assessments.reduce((acc, curr) => acc + curr.score, 0);
            const totalMax = grade.assessments.reduce((acc, curr) => acc + (curr.assessmentType?.totalMarks || 0), 0);
            const percentage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
            const item = { name: subjectName, pct: percentage.toFixed(1) };

            if (percentage < 60) categories.critical.push(item);
            else if (percentage < 75) categories.average.push(item);
            else if (percentage < 90) categories.good.push(item);
            else categories.excellent.push(item);
        });
        return categories;
    }, [grades]);

    const chartData = useMemo(() => {
        if (!grades.length) return null;
        const monthNames = Object.keys(monthOrder); 
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

        const labels = [];
        const dataPoints = [];
        monthNames.forEach(month => {
            if (monthlyTotals[month]) {
                labels.push(t(month));
                dataPoints.push(((monthlyTotals[month].obtained / monthlyTotals[month].max) * 100).toFixed(1));
            }
        });

        return {
            labels,
            datasets: [{
                label: 'Performance %',
                data: dataPoints,
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                fill: true,
                tension: 0.3
            }]
        };
    }, [grades, t]);

    // --- HELPER: SORT & GROUP BY MONTH ---
    const processSemesterGrades = (semesterGrades) => {
        return semesterGrades.map(grade => {
            let flatAssessments = grade.assessments.map(a => ({
                id: a._id || Math.random(),
                monthName: a.assessmentType?.month || 'Other',
                testName: a.assessmentType?.name,
                score: a.score,
                totalMarks: a.assessmentType?.totalMarks
            }));

            // Sort by Month
            flatAssessments.sort((a, b) => {
                const orderA = monthOrder[a.monthName] || 99;
                const orderB = monthOrder[b.monthName] || 99;
                return orderA - orderB;
            });

            // Calculate Row Spans
            const monthCounts = flatAssessments.reduce((acc, curr) => {
                acc[curr.monthName] = (acc[curr.monthName] || 0) + 1;
                return acc;
            }, {});

            const seenMonths = new Set();
            flatAssessments = flatAssessments.map(assess => {
                if (!seenMonths.has(assess.monthName)) {
                    assess.monthRowSpan = monthCounts[assess.monthName];
                    seenMonths.add(assess.monthName);
                } else {
                    assess.monthRowSpan = 0;
                }
                return assess;
            });

            // Calculate Subject Total Max (The sum of all assessment max marks)
            const subjectTotalMax = flatAssessments.reduce((sum, a) => sum + (a.totalMarks || 0), 0);
            
            return { ...grade, flatAssessments, subjectTotalMax };
        });
    };

    const calculateAge = (dob) => {
        if (!dob) return '-';
        const birthYear = parseInt(String(dob).substring(0, 4));
        const currentYear = new Date().getFullYear();
        return isNaN(birthYear) ? '-' : (currentYear - 8) - birthYear;
    };

    if (loading) return <div className="flex justify-center items-center h-screen text-lg font-bold text-slate-600">{t('loading')}</div>;
    if (error) return <div className="p-10 text-center text-red-500 font-bold bg-red-50 h-screen flex items-center justify-center">{error}</div>;
    if (!student) return null;

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans">
            {/* Header */}
            <div className="w-full justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row items-center gap-6">
                <div className='flex flex-col justify-center items-center'>
                    <img src={student.imageUrl} alt={student.fullName} className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-sm" />
                    <h2 className="text-3xl text-center font-bold text-gray-800">{student.fullName}</h2>
                </div>
                <div className="flex items-center gap-6">
                    <div className='flex flex-col md:flex-row'>
                        <div className="flex flex-col">
                            <p className="text-gray-500 mt-1 text-sm font-mono"><span className='font-bold'>{t('grade')}:</span> {student.gradeLevel}</p>
                            <p className="text-gray-500 mt-1 text-sm font-mono"> <span className='font-bold'>{t('id_no')}:</span>  {student.studentId}</p>
                            <p><strong>{t('age')}:</strong> {calculateAge(student.dateOfBirth)}</p>
                            <p><strong>{t('parent_name')}:</strong> {student.motherName}</p>
                            <p><strong>{t('contact')}:</strong> {student.motherContact}</p>
                            <p><strong>{t('Father_contact')}:</strong> {student.fatherContact}</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="text-center bg-blue-600 text-white p-4 rounded-xl shadow-lg shadow-blue-200">
                        <div className="text-xs font-bold uppercase opacity-80 mb-1">{t('rank')} (Overall)</div>
                        <div className="text-3xl font-black">{ranks.overall}</div>
                    </div>
                </div>
            </div>

            {/* Charts & Insights */}
            {chartData && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-1 space-y-8">
                        {/* Stats */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider">{t('key_stats')}</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                                    <div><div className="text-xs text-green-600 font-bold uppercase">{t('best_subject')}</div><div className="font-bold text-slate-800">{studentStats?.bestSubject?.subject}</div></div>
                                    <div className="text-xl font-black text-green-700">{studentStats?.bestSubject?.percentage.toFixed(0)}%</div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                                    <div><div className="text-xs text-red-500 font-bold uppercase">{t('needs_focus')}</div><div className="font-bold text-slate-800">{studentStats?.worstSubject?.subject}</div></div>
                                    <div className="text-xl font-black text-red-600">{studentStats?.worstSubject?.percentage.toFixed(0)}%</div>
                                </div>
                            </div>
                        </div>
                        {/* Buckets */}
                        {insights && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider">{t('score_distribution')}</h3>
                                <div className="space-y-3">
                                    {insights.excellent.length > 0 && <div className="text-xs flex justify-between"><span className="text-green-700 font-bold">🌟 Excellent ({insights.excellent.length})</span> <span className="text-gray-400">90%+</span></div>}
                                    {insights.good.length > 0 && <div className="text-xs flex justify-between"><span className="text-blue-700 font-bold">👍 Good ({insights.good.length})</span> <span className="text-gray-400">75-89%</span></div>}
                                    {insights.average.length > 0 && <div className="text-xs flex justify-between"><span className="text-yellow-700 font-bold">⚖️ Average ({insights.average.length})</span> <span className="text-gray-400">60-74%</span></div>}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
                        <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-wider">{t('monthly_progress')}</h3>
                        <div className="h-64 w-full">
                            <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Insights Grid */}
            {insights && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                    <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">📊 {t('academic_insights')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="text-red-800 font-bold text-sm uppercase mb-2 border-b border-red-200 pb-1">⚠️ {t('critical_range')}</h4>
                            {insights.critical.length > 0 ? (<ul className="space-y-1">{insights.critical.map((s, i) => <li key={i} className="text-sm flex justify-between text-red-700"><span>{s.name}</span> <strong>{s.pct}%</strong></li>)}</ul>) : <p className="text-xs text-gray-400 italic">{t('no_subjects_in_range')}</p>}
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="text-yellow-800 font-bold text-sm uppercase mb-2 border-b border-yellow-200 pb-1">⚖️ {t('average_range')}</h4>
                            {insights.average.length > 0 ? (<ul className="space-y-1">{insights.average.map((s, i) => <li key={i} className="text-sm flex justify-between text-yellow-900"><span>{s.name}</span> <strong>{s.pct}%</strong></li>)}</ul>) : <p className="text-xs text-gray-400 italic">{t('no_subjects_in_range')}</p>}
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="text-blue-800 font-bold text-sm uppercase mb-2 border-b border-blue-200 pb-1">👍 {t('good_range')}</h4>
                            {insights.good.length > 0 ? (<ul className="space-y-1">{insights.good.map((s, i) => <li key={i} className="text-sm flex justify-between text-blue-900"><span>{s.name}</span> <strong>{s.pct}%</strong></li>)}</ul>) : <p className="text-xs text-gray-400 italic">{t('no_subjects_in_range')}</p>}
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="text-green-800 font-bold text-sm uppercase mb-2 border-b border-green-200 pb-1">🌟 {t('excellent_range')}</h4>
                            {insights.excellent.length > 0 ? (<ul className="space-y-1">{insights.excellent.map((s, i) => <li key={i} className="text-sm flex justify-between text-green-900"><span>{s.name}</span> <strong>{s.pct}%</strong></li>)}</ul>) : <p className="text-xs text-gray-400 italic">{t('no_subjects_in_range')}</p>}
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white  rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
                <div className="p-8">
                    <style>{`@media print { @page { size: A4 landscape; margin: 10mm; } body { background: white; -webkit-print-color-adjust: exact; } .no-print { display: none !important; } table { page-break-inside: auto; } tr { page-break-inside: avoid; page-break-after: auto; } .print-header { display: block !important; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; } }`}</style>
                    <div className="hidden print-header"><h1 className="text-2xl font-bold uppercase">Future Generation Academy</h1><p className="text-sm">Student Performance Report - {student.fullName}</p></div>

                    {grades.length > 0 ? (
                        <div className="space-y-12">
                            {Object.entries(grades.reduce((acc, g) => { acc[g.semester] = acc[g.semester] || []; acc[g.semester].push(g); return acc; }, {})).map(([semester, rawGrades]) => {
                                const processedGrades = processSemesterGrades(rawGrades);
                                const semesterObtained = processedGrades.reduce((sum, g) => sum + g.finalScore, 0);
                                const semesterMax = processedGrades.reduce((sum, g) => sum + g.subjectTotalMax, 0);
                                const semesterAvg = semesterMax > 0 ? ((semesterObtained / semesterMax) * 100).toFixed(1) : 0;
                                const displaySemester = semester === 'First Semester' ? t('sem_1') : t('sem_2');
                                const currentRank = semester === 'First Semester' ? ranks.sem1 : ranks.sem2;

                                return (
                                    <div key={semester} className="mb-8 break-inside-avoid">
                                        <div className="flex justify-between items-end mb-4 border-b-2 border-slate-800 pb-2">
                                            <h4 className="text-xl font-black text-slate-800 uppercase">{displaySemester}</h4>
                                            <div className="flex gap-4 text-sm font-bold">
                                                <span className="text-slate-500">{t('average')}: <span className="text-slate-900">{semesterAvg}%</span></span>
                                                <span className="bg-slate-900 text-white px-3 py-0.5 rounded">{t('rank')}: {currentRank}</span>
                                            </div>
                                        </div>

                                        {processedGrades.map((grade) => (
    <div key={grade._id} className="mb-6 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {/* SUBJECT TITLE BAR */}
        <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
            <h5 className="text-lg font-bold tracking-wide uppercase">{grade.subject.name}</h5>
            <div className="text-right">
                <span className="text-xs opacity-70 uppercase block">{t('subject_total')}</span>
                <span className="text-xl font-black">
                    {grade.finalScore} <span className="text-sm opacity-50">/ {grade.subjectTotalMax}</span>
                </span>
            </div>
        </div>

        {/* MONTHLY BREAKDOWN */}
        <div className="p-4 space-y-4">
            {/* Grouping by Month inside the card */}
            {Object.entries(
                grade.flatAssessments.reduce((acc, curr) => {
                    acc[curr.monthName] = acc[curr.monthName] || [];
                    acc[curr.monthName].push(curr);
                    return acc;
                }, {})
            ).map(([month, assessments]) => (
                <div key={month} className="border-l-4 border-blue-500 pl-4 py-1">
                    <h6 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                        📅 {t(month)}
                    </h6>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {assessments.map((assess) => (
                            <div key={assess.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                                <span className="text-sm text-slate-600">{assess.testName}</span>
                                <span className="font-mono font-bold text-slate-800">
                                    {assess.score} <span className="text-[10px] text-slate-400">/ {assess.totalMarks}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>

        {/* PROGRESS VISUALIZER */}
        <div className="h-1.5 w-full bg-slate-100">
            <div 
                className="h-full bg-blue-500 transition-all duration-500" 
                style={{ width: `${(grade.finalScore / grade.subjectTotalMax) * 100}%` }}
            ></div>
        </div>
    </div>
))}

                                        <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-sm italic text-slate-700">
                                            <strong>{t('teacher_comment')}:</strong> "{reports.find(r => r.semester === semester)?.teacherComment || "No comment available."}"
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <div className="text-center p-10 text-slate-400 italic">{t('no_grades')}</div>}
                </div>
            </div>
        </div>
    );
};

export default ParentDashboardPage;