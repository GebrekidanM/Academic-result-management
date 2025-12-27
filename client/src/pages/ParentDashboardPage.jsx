import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next'; // <--- Import Hook
import studentAuthService from '../services/studentAuthService';
import studentService from '../services/studentService';
import gradeService from '../services/gradeService';
import behavioralReportService from '../services/behavioralReportService';
import rankService from '../services/rankService';

// --- CHART IMPORTS ---
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ParentDashboardPage = () => {
    const { t } = useTranslation(); // <--- Initialize Hook
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

                    if (studentRes.status === 'fulfilled') {
                        setStudent(studentRes.value.data.data);
                    } else {
                        throw new Error('Could not fetch student profile.');
                    }

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
                } catch (err) { 
                    newRanks[sem] = '-'; 
                }
            }
            setRankBySemester(newRanks);
        };
        fetchRanks();
    }, [student, grades]);

    // 3. Analytics Logic
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
                    subjectPerformance[g.subject.name] = { score: 0, max: 0, count: 0 };
                }
                subjectPerformance[g.subject.name].score += totalScore;
                subjectPerformance[g.subject.name].max += totalMax;
                subjectPerformance[g.subject.name].count += 1;
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
            allSubjects: performanceArray,
            overallAverage: overallAverage
        };
    }, [grades]);

    // --- Chart Config ---
    const chartData = {
        labels: studentStats?.allSubjects.map(s => s.subject) || [],
        datasets: [
            {
                label: 'Performance (%)',
                data: studentStats?.allSubjects.map(s => s.percentage.toFixed(1)) || [],
                backgroundColor: studentStats?.allSubjects.map(s => 
                    s.percentage >= 80 ? 'rgba(34, 197, 94, 0.6)' : 
                    s.percentage >= 50 ? 'rgba(59, 130, 246, 0.6)' : 
                    'rgba(239, 68, 68, 0.6)'
                ),
                borderColor: 'rgba(200, 200, 200, 1)',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true, max: 100, grid: { borderDash: [2, 2] } },
            x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
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

    const tableHeader = "px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-200";
    const tableCell = "px-4 py-3 text-sm border-b border-gray-100 text-gray-700";

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            
            {/* 1. Student Info */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-8 flex flex-col md:flex-row gap-8 items-center md:items-start border-l-4 border-blue-600">
                <div className="flex-shrink-0">
                    {student.imageUrl ? (
                        <img src={student.imageUrl} alt={student.fullName} className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-sm" />
                    ) : (
                        <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">No Photo</div>
                    )}
                </div>
                <div className="flex-grow text-center md:text-left">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">{student.fullName}</h2>
                    <p className="text-gray-500 mb-4 font-medium">{t('grade')}: {student.gradeLevel} | {t('id_no')}: {student.studentId}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
                        <p><strong>{t('age')}:</strong> {calculateAge(student.dateOfBirth)}</p>
                        <p><strong>{t('parent_name')}:</strong> {student.motherName}</p>
                        <p><strong>{t('contact')}:</strong> {student.motherContact}</p>
                        <p><strong>{t('status')}:</strong> <span className="text-green-600 font-bold">{t('active')}</span></p>
                    </div>
                </div>
            </div>

            {/* 2. Insights */}
            {studentStats && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h3 className="text-xl font-bold text-gray-700 mb-6 border-l-4 border-purple-600 pl-3">{t('performance_insights')}</h3>
                    
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

                    <div className="h-64 w-full">
                        <Bar data={chartData} options={chartOptions} />
                    </div>
                </div>
            )}

            {/* 3. Detailed Grades */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-xl font-bold text-gray-700 mb-6 border-l-4 border-blue-600 pl-3">{t('detailed_grades')}</h3>
                
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

                            // Display "1st Semester" or "2nd Semester" translated
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
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-700 mb-4 border-l-4 border-yellow-500 pl-3">{t('teacher_comments')}</h3>
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