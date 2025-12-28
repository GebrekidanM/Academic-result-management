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

const ParentDashboardPage = () => {
    const { t } = useTranslation(); 
    const [student, setStudent] = useState(null);
    const [grades, setGrades] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rankBySemester, setRankBySemester] = useState({});

    // 1. Fetch Data
    useEffect(() => {
        const currentStudent = studentAuthService.getCurrentStudent();
        if (currentStudent) {
            const fetchData = async () => {
                try {
                    const [studentRes, gradesRes, reportsRes] = await Promise.allSettled([
                        studentService.getStudentById(currentStudent._id),
                        gradeService.getGradesByStudent(currentStudent._id),
                        behavioralReportService.getReportsByStudent(currentStudent._id)
                    ]);

                    if (studentRes.status === 'fulfilled') setStudent(studentRes.value.data.data);
                    else throw new Error('Could not fetch student profile.');

                    if (gradesRes.status === 'fulfilled') setGrades(gradesRes.value.data.data);
                    if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.data.data);

                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        } else {
            setLoading(false);
            setError("Could not find logged in student information.");
        }
    }, []);

    // 2. Fetch Ranks
    useEffect(() => {
        if (!student || grades.length === 0) return;
        const fetchRanks = async () => {
            const semesters = [...new Set(grades.map(g => g.semester))];
            const academicYear = student.studentId.includes('-') ? student.studentId.split('-')[1] : '2018';
            const newRanks = {};

            for (const sem of semesters) {
                try {
                    const res = await rankService.getRank({
                        studentId: student._id,
                        academicYear,
                        semester: sem,
                        gradeLevel: student.gradeLevel
                    });
                    newRanks[sem] = res.data.rank;
                } catch (err) { newRanks[sem] = '-'; }
            }
            setRankBySemester(newRanks);
        };
        fetchRanks();
    }, [student, grades]);

    // --- 3. SUBJECT ANALYTICS (Best/Worst & Overall) ---
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
                if (!subjectPerformance[g.subject.name]) {
                    subjectPerformance[g.subject.name] = { score: 0, max: 0 };
                }
                subjectPerformance[g.subject.name].score += totalScore;
                subjectPerformance[g.subject.name].max += totalMax;
            }
        });

        const performanceArray = Object.keys(subjectPerformance).map(subject => {
            const data = subjectPerformance[subject];
            return {
                subject,
                percentage: ((data.score / data.max) * 100)
            };
        });

        performanceArray.sort((a, b) => b.percentage - a.percentage);
        const overallAverage = grandTotalMax > 0 ? (grandTotalScore / grandTotalMax) * 100 : 0;

        return {
            bestSubject: performanceArray[0],
            worstSubject: performanceArray[performanceArray.length - 1],
            overallAverage: overallAverage
        };
    }, [grades]);

    // --- 4. NEW: INSIGHTS BUCKETS (Critical, Average, Good, Excellent) ---
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

    // --- 5. MONTHLY TREND ANALYTICS ---
    const monthlyTrendData = useMemo(() => {
        if (!grades || grades.length === 0) return null;
        const monthOrder = ["September", "October", "November", "December", "January", "February", "March", "April", "May", "June"];
        const monthlyTotals = {};

        grades.forEach(grade => {
            grade.assessments.forEach(assess => {
                const month = assess.assessmentType?.month;
                const score = assess.score || 0;
                const max = assess.assessmentType?.totalMarks || 0;

                if (month && max > 0) {
                    if (!monthlyTotals[month]) monthlyTotals[month] = { obtained: 0, max: 0 };
                    monthlyTotals[month].obtained += score;
                    monthlyTotals[month].max += max;
                }
            });
        });

        const labels = [];
        const dataPoints = [];
        monthOrder.forEach(month => {
            if (monthlyTotals[month]) {
                labels.push(t(month));
                const pct = (monthlyTotals[month].obtained / monthlyTotals[month].max) * 100;
                dataPoints.push(pct.toFixed(1));
            }
        });
        return { labels, dataPoints };
    }, [grades, t]);

    const chartData = {
        labels: monthlyTrendData?.labels || [],
        datasets: [{
            label: t('performance_trend') + ' (%)',
            data: monthlyTrendData?.dataPoints || [],
            borderColor: 'rgb(79, 70, 229)',
            backgroundColor: 'rgba(79, 70, 229, 0.2)',
            pointBackgroundColor: '#fff',
            pointBorderColor: 'rgb(79, 70, 229)',
            pointRadius: 6,
            fill: true,
            tension: 0.4,
        }],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true, max: 100, grid: { borderDash: [2, 2] }, title: { display: true, text: '%' } },
            x: { grid: { display: false } }
        },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => `${t('average')}: ${c.raw}%` } } }
    };

    // --- Helpers ---
    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const now = new Date();
        let ethYear = now.getFullYear() - 8;
        if (now.getMonth() > 8 || (now.getMonth() === 8 && now.getDate() >= 11)) ethYear = now.getFullYear() - 7;
        const birthYear = parseInt(String(dob).substring(0, 4));
        return isNaN(birthYear) ? 'N/A' : ethYear - birthYear;
    };

    const processSemesterGrades = (semesterGrades) => {
        return semesterGrades.map(grade => {
            const flatAssessments = grade.assessments.map(a => ({
                id: a._id || Math.random(),
                monthName: a.assessmentType?.month,
                testName: a.assessmentType?.name,
                score: a.score,
                totalMarks: a.assessmentType?.totalMarks
            }));
            const subjectTotalMax = flatAssessments.reduce((sum, a) => sum + (a.totalMarks || 0), 0);
            return { ...grade, flatAssessments, subjectTotalMax };
        });
    };

    if (loading) return <div className="flex justify-center items-center h-screen text-lg">{t('loading')}</div>;
    if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;
    if (!student) return null;

    // UI Constants
    const sectionWrapper = "bg-white p-6 rounded-lg shadow-md mb-8";
    const sectionTitle = "text-xl font-bold text-gray-700";
    const tableHeader = "px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-200";
    const tableCell = "px-4 py-3 text-sm border-b border-gray-100 text-gray-700";

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            
            {/* 1. Student Info Card */}
            <div className={`${sectionWrapper} border-l-4 border-blue-600`}>
                <div className="flex flex-col sm:flex-row justify-between items-start">
                    <div className="flex items-center gap-6">
                        <img src={student.imageUrl} alt={student.fullName} className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-sm" />
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800">{student.fullName}</h2>
                            <p className="text-gray-500 mt-1 text-sm font-mono">{t('grade')}: {student.gradeLevel} | {t('id_no')}: {student.studentId}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
                                <p><strong>{t('age')}:</strong> {calculateAge(student.dateOfBirth)}</p>
                                <p><strong>{t('parent_name')}:</strong> {student.motherName}</p>
                                <p><strong>{t('contact')}:</strong> {student.motherContact}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Insights & Monthly Trend */}
            {studentStats && (
                <div className={`${sectionWrapper} border-l-4 border-purple-600`}>
                    <h3 className={`${sectionTitle} mb-6 pl-3`}>{t('performance_insights')}</h3>
                    
                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex flex-col items-center justify-center">
                            <div className="text-green-600 text-4xl mb-2">🏆</div>
                            <div className="text-sm text-gray-500 uppercase font-bold">{t('strongest_subject')}</div>
                            <div className="text-xl font-bold text-gray-800">{studentStats.bestSubject?.subject || '-'}</div>
                            <div className="text-sm font-bold text-green-700">{studentStats.bestSubject?.percentage.toFixed(1) || 0}%</div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col items-center justify-center">
                            <div className="text-blue-600 text-4xl mb-2">📊</div>
                            <div className="text-sm text-gray-500 uppercase font-bold">{t('average')}</div>
                            <div className="text-2xl font-bold text-gray-800">{studentStats.overallAverage.toFixed(1)}%</div>
                        </div>

                        <div className="bg-red-50 p-4 rounded-xl border border-red-200 flex flex-col items-center justify-center">
                            <div className="text-red-500 text-4xl mb-2">🎯</div>
                            <div className="text-sm text-gray-500 uppercase font-bold">{t('needs_focus')}</div>
                            <div className="text-xl font-bold text-gray-800">{studentStats.worstSubject?.subject || '-'}</div>
                            <div className="text-sm font-bold text-red-600">{studentStats.worstSubject?.percentage.toFixed(1) || 0}%</div>
                        </div>
                    </div>

                    {/* --- NEW: DETAILED INSIGHTS BUCKETS --- */}
                    {insights && (
                        <div className="mb-8 border-t pt-6">
                             <h4 className="text-sm font-bold text-gray-500 uppercase mb-4">{t('academic_insights')} ({t('score_distribution')})</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="text-red-800 font-bold text-sm uppercase mb-2 border-b border-red-200 pb-1">⚠️ {t('critical_range')}</h4>
                                    {insights.critical.length > 0 ? (
                                        <ul className="space-y-1">{insights.critical.map((s, i) => <li key={i} className="text-sm flex justify-between text-red-700"><span>{s.name}</span> <strong>{s.pct}%</strong></li>)}</ul>
                                    ) : <p className="text-xs text-gray-400 italic">{t('no_subjects_in_range')}</p>}
                                </div>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h4 className="text-yellow-800 font-bold text-sm uppercase mb-2 border-b border-yellow-200 pb-1">⚖️ {t('average_range')}</h4>
                                    {insights.average.length > 0 ? (
                                        <ul className="space-y-1">{insights.average.map((s, i) => <li key={i} className="text-sm flex justify-between text-yellow-900"><span>{s.name}</span> <strong>{s.pct}%</strong></li>)}</ul>
                                    ) : <p className="text-xs text-gray-400 italic">{t('no_subjects_in_range')}</p>}
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="text-blue-800 font-bold text-sm uppercase mb-2 border-b border-blue-200 pb-1">👍 {t('good_range')}</h4>
                                    {insights.good.length > 0 ? (
                                        <ul className="space-y-1">{insights.good.map((s, i) => <li key={i} className="text-sm flex justify-between text-blue-900"><span>{s.name}</span> <strong>{s.pct}%</strong></li>)}</ul>
                                    ) : <p className="text-xs text-gray-400 italic">{t('no_subjects_in_range')}</p>}
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="text-green-800 font-bold text-sm uppercase mb-2 border-b border-green-200 pb-1">🌟 {t('excellent_range')}</h4>
                                    {insights.excellent.length > 0 ? (
                                        <ul className="space-y-1">{insights.excellent.map((s, i) => <li key={i} className="text-sm flex justify-between text-green-900"><span>{s.name}</span> <strong>{s.pct}%</strong></li>)}</ul>
                                    ) : <p className="text-xs text-gray-400 italic">{t('no_subjects_in_range')}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Monthly Graph */}
                    {monthlyTrendData && monthlyTrendData.labels.length > 0 && (
                        <div className="border-t pt-6">
                            <h4 className="text-sm font-bold text-gray-500 uppercase mb-4">{t('monthly_progress')}</h4>
                            <div className="h-64 w-full">
                                <Line data={chartData} options={chartOptions} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 3. Detailed Grades Tables */}
            <div className={`${sectionWrapper} border-l-4 border-blue-600`}>
                <h3 className={`${sectionTitle} mb-6 pl-3`}>{t('detailed_grades')}</h3>
                
                {grades.length > 0 ? (
                    <div className="space-y-12">
                        {Object.entries(
                            grades.reduce((acc, g) => {
                                acc[g.semester] = acc[g.semester] || [];
                                acc[g.semester].push(g);
                                return acc;
                            }, {})
                        ).map(([semester, rawGrades]) => {
                            const processedGrades = processSemesterGrades(rawGrades);
                            const semesterObtained = processedGrades.reduce((sum, g) => sum + g.finalScore, 0);
                            const semesterMax = processedGrades.reduce((sum, g) => sum + g.subjectTotalMax, 0);
                            const semesterAvg = semesterMax > 0 ? ((semesterObtained / semesterMax) * 100).toFixed(1) : 0;
                            const displaySemester = semester === 'First Semester' ? t('sem_1') : t('sem_2');

                            return (
                                <div key={semester} className="border rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-blue-900 text-white p-4 flex justify-between items-center">
                                        <h4 className="text-lg font-bold">{t('semester')}: {displaySemester}</h4>
                                        <div className="text-sm bg-blue-800 px-3 py-1 rounded border border-blue-700 min-w-20 text-center">
                                            {t('rank')}: <strong>{rankBySemester[semester] || '...'}</strong>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border-collapse">
                                            <thead>
                                                <tr>
                                                    <th className={`${tableHeader} w-1/4`}>{t('subject')}</th>
                                                    <th className={tableHeader}>{t('assessment')}</th>
                                                    <th className={`${tableHeader} text-right`}>{t('score')}</th>
                                                    <th className={`${tableHeader} text-center bg-gray-100`}>{t('total')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white">
                                                {processedGrades.map((grade) => {
                                                    const rows = grade.flatAssessments.length > 0 ? grade.flatAssessments : [{ id: 'empty' }]; 
                                                    return rows.map((assess, index) => (
                                                        <tr key={`${grade._id}-${index}`} className="hover:bg-gray-50">
                                                            {index === 0 && (
                                                                <td rowSpan={rows.length} className={`${tableCell} font-bold text-gray-800 align-top border-r border-gray-100 bg-white`}>
                                                                    {grade.subject.name}
                                                                </td>
                                                            )}
                                                            <td className={tableCell}>{assess.testName || '-'}</td>
                                                            <td className={`${tableCell} text-right font-mono`}>{assess.score !== undefined ? `${assess.score} / ${assess.totalMarks}` : '-'}</td>
                                                            {index === 0 && (
                                                                <td rowSpan={rows.length} className={`${tableCell} font-bold text-center align-middle bg-gray-50 text-blue-900 border-l border-gray-200`}>
                                                                    {grade.finalScore} / {grade.subjectTotalMax}
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ));
                                                })}
                                            </tbody>
                                            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-3 font-bold text-right text-gray-600 uppercase text-xs tracking-wider">{t('grand_total')}:</td>
                                                    <td className="px-4 py-3 font-bold text-center text-lg text-gray-900">{semesterObtained.toFixed(1)} / {semesterMax}</td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-2 font-bold text-right text-gray-600 uppercase text-xs tracking-wider">{t('average')}:</td>
                                                    <td className="px-4 py-2 font-bold text-center text-blue-600 text-lg">{semesterAvg}%</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center p-10 bg-gray-50 rounded-lg text-gray-500">{t('no_grades')}</div>
                )}
            </div>

            {/* 4. Comments */}
            <div className={`${sectionWrapper} border-l-4 border-yellow-500`}>
                <h3 className={`${sectionTitle} mb-6 pl-3`}>{t('teacher_comments')}</h3>
                {reports.length > 0 ? (
                    <div className="grid gap-4">
                        {reports.map(report => (
                            <div key={report._id} className="p-4 border rounded-lg bg-yellow-50 border-yellow-100">
                                <div className="flex justify-between mb-2">
                                    <h4 className="font-bold text-yellow-800">{report.semester === 'First Semester' ? t('sem_1') : t('sem_2')}</h4>
                                    <span className="text-xs text-yellow-600">{report.academicYear}</span>
                                </div>
                                <p className="text-sm text-gray-700 italic">"{report.teacherComment || '...'}"</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">{t('no_comments')}</p>
                )}
            </div>
        </div>
    );
};

export default ParentDashboardPage;