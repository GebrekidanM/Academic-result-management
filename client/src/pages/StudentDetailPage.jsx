import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import Hook
import studentService from '../services/studentService';
import gradeService from '../services/gradeService';
import behavioralReportService from '../services/behavioralReportService';
import authService from '../services/authService';
import rankService from '../services/rankService';

const StudentDetailPage = () => {
    const { t } = useTranslation(); // <--- Initialize
    const [currentUser] = useState(authService.getCurrentUser());
    const [student, setStudent] = useState(null);
    const [grades, setGrades] = useState([]);
    const [reports, setReports] = useState([]);
    const [ranks, setRanks] = useState({ sem1: '-', sem2: '-', overall: '-' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    // --- 1. Fetch Data ---
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [studentRes, gradesRes, reportsRes] = await Promise.allSettled([
                    studentService.getStudentById(id),
                    gradeService.getGradesByStudent(id),
                    behavioralReportService.getReportsByStudent(id)
                ]);

                let studentData = null;
                if (studentRes.status === 'fulfilled') {
                    studentData = studentRes.value.data.data;
                    setStudent(studentData);
                } else throw new Error(t('error'));

                if (gradesRes.status === 'fulfilled') setGrades(gradesRes.value.data.data);
                else setGrades([]);

                if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.data.data);
                else setReports([]);

                if (studentData) {
                    const academicYear = gradesRes.value?.data?.data[0]?.academicYear || '2018'; 
                    const gradeLevel = studentData.gradeLevel;

                    const [r1, r2, rAll] = await Promise.allSettled([
                        rankService.getRank({ studentId: id, academicYear, semester: 'First Semester', gradeLevel }),
                        rankService.getRank({ studentId: id, academicYear, semester: 'Second Semester', gradeLevel }),
                        rankService.getOverallRank({ studentId: id, academicYear, gradeLevel })
                    ]);

                    setRanks({
                        sem1: r1.status === 'fulfilled' ? r1.value.data.rank : '-',
                        sem2: r2.status === 'fulfilled' ? r2.value.data.rank : '-',
                        overall: rAll.status === 'fulfilled' ? rAll.value.data.rank : '-'
                    });
                }
            } catch (err) {
                setError(err.message || t('error'));
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [id, t]);

    // --- 2. Permissions & Stats Logic ---
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'staff';
    const isHomeroomTeacher = currentUser?.role === 'teacher' && student && currentUser.homeroomGrade === student.gradeLevel;
    const canViewFullInsights = isAdmin || isHomeroomTeacher;

    const academicStats = useMemo(() => {
        if (!grades || grades.length === 0) return { average: 0, totalScore: 0, totalMax: 0 };
        let grandTotal = 0;
        let grandMax = 0;
        grades.forEach(grade => {
            grandTotal += grade.finalScore || 0;
            grandMax += grade.assessments?.reduce((sum, a) => sum + (a.assessmentType?.totalMarks || 0), 0) || 0;
        });
        const avg = grandMax > 0 ? (grandTotal / grandMax) * 100 : 0;
        return { average: avg.toFixed(1) };
    }, [grades]);

    const subjectTeacherStats = useMemo(() => {
        if (isAdmin || isHomeroomTeacher || !currentUser.subjectsTaught || grades.length === 0) return null;
        const mySubjectIds = currentUser.subjectsTaught.map(s => s.subject?._id || s.subject);
        const myGrades = grades.filter(g => mySubjectIds.includes(g.subject._id));

        return myGrades.map(g => {
             const max = g.assessments?.reduce((sum, a) => sum + (a.assessmentType?.totalMarks || 0), 0) || 0;
             const pct = max > 0 ? (g.finalScore / max) * 100 : 0;
             
             let label = "Critical";
             let color = "text-red-600 bg-red-100 border-red-200";
             
             if(pct >= 90) { label = "Excellent"; color = "text-green-700 bg-green-100 border-green-200"; }
             else if(pct >= 75) { label = "Good"; color = "text-blue-700 bg-blue-100 border-blue-200"; }
             else if(pct >= 60) { label = "Average"; color = "text-yellow-700 bg-yellow-100 border-yellow-200"; }

             return { subjectName: g.subject.name, score: g.finalScore, max, pct: pct.toFixed(1), label, color };
        });
    }, [grades, currentUser, isAdmin, isHomeroomTeacher]);

    const insights = useMemo(() => {
        if (!grades || grades.length === 0) return null;
        const categories = { critical: [], average: [], good: [], excellent: [] };

        grades.forEach(grade => {
            const subjectName = grade.subject?.name || "Unknown";
            const obtained = grade.finalScore || 0;
            const maxScore = grade.assessments?.reduce((sum, a) => sum + (a.assessmentType?.totalMarks || 0), 0) || 0;
            const percentage = maxScore > 0 ? (obtained / maxScore) * 100 : 0;
            const item = { name: subjectName, pct: percentage.toFixed(1) };

            if (percentage < 60) categories.critical.push(item);
            else if (percentage < 75) categories.average.push(item);
            else if (percentage < 90) categories.good.push(item);
            else categories.excellent.push(item);
        });
        return categories;
    }, [grades]);

    // --- Handlers ---
    const handleStudentDelete = async () => {
        if (window.confirm(t('confirm_delete_student'))) {
            try {
                await studentService.deleteStudent(id);
                navigate('/students');
            } catch { alert(t('failed_delete_student')); }
        }
    };
    const handleReportDelete = async (reportId) => {
        if (window.confirm(t('confirm_delete_report'))) {
            try {
                await behavioralReportService.deleteReport(reportId);
                setReports(reports.filter(r => r._id !== reportId));
            } catch { alert(t('failed_delete_report')); }
        }
    };
    const handleResetPassword = async (studentId) => {
        if (!window.confirm(t('confirm_reset_password'))) return;
        try {
            const res = await studentService.resetStudentPassword(studentId);
            alert(`✅ ${res.data.message}`);
        } catch (error) { alert(t('failed_reset_password')); }
    }

    if (loading) return <p className="text-center text-lg mt-8">{t('loading')}</p>;
    if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;
    if (!student) return <p className="text-center text-lg mt-8">Student not found.</p>;

    const sectionWrapper = "bg-white p-6 rounded-lg shadow-md mb-8";
    const sectionTitle = "text-xl font-bold text-gray-800";
    const buttonBase = "py-2 px-4 rounded-md font-semibold transition-colors duration-200 text-sm shadow-sm";

    return (
        <div className="space-y-8">
            
            {/* 1. Header & Quick Stats */}
            <div className={sectionWrapper}>
                <div className="flex flex-col sm:flex-row justify-between items-start">
                    <div className="flex items-center gap-6">
                        <img src={`${student.imageUrl}?key=${Date.now()}`} alt={student.fullName} className="w-32 h-32 rounded-full object-cover border-4 border-gray-200" />
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800">{student.fullName}</h2>
                            <p className="text-gray-500 mt-1 text-sm font-mono">{t('id_no')}: {student.studentId}</p>
                            <div className="flex gap-4 mt-3">
                                <div className="bg-blue-50 px-3 py-1 rounded border border-blue-200 text-center">
                                    <span className="block text-xs text-blue-500 font-bold uppercase">{t('average')}</span>
                                    <span className="text-lg font-black text-blue-800">{academicStats.average}%</span>
                                </div>
                                <div className="bg-purple-50 px-3 py-1 rounded border border-purple-200 text-center">
                                    <span className="block text-xs text-purple-500 font-bold uppercase">{t('rank')}</span>
                                    <span className="text-lg font-black text-purple-800">{ranks.overall}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {(isAdmin || isHomeroomTeacher) && (
                        <div className="flex gap-2 mt-4 sm:mt-0 flex-wrap">
                            <Link to={`/students/edit/${student._id}`} className={`${buttonBase} bg-yellow-500 hover:bg-yellow-600 text-white`}>{t('edit')}</Link>
                            {isAdmin && <button onClick={handleStudentDelete} className={`${buttonBase} bg-red-500 hover:bg-red-600 text-white`}>{t('delete')}</button>}
                            <button onClick={()=> handleResetPassword(student._id)} className={`${buttonBase} bg-gray-600 hover:bg-gray-700 text-white`}>{t('reset_password')}</button>
                        </div>
                    )}
                </div>
                <div className="mt-6 border-t pt-4">
                    <Link to={`/students/${student._id}/report`} className={`${buttonBase} bg-green-500 hover:bg-green-600 text-white inline-block`}>
                        📄 {t('generate_report')}
                    </Link>
                </div>
            </div>

            {/* 2A. Subject Teacher View */}
            {subjectTeacherStats && subjectTeacherStats.length > 0 && (
                <div className={sectionWrapper}>
                    <h3 className={`${sectionTitle} mb-4 text-indigo-700 border-b pb-2`}>
                        👨‍🏫 {t('your_subject_analysis')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subjectTeacherStats.map((stat, idx) => (
                            <div key={idx} className={`p-4 rounded-lg border-l-4 shadow-sm ${stat.color} bg-white`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-gray-800">{stat.subjectName}</h4>
                                        <p className="text-2xl font-black mt-1">{stat.pct}%</p>
                                        <p className="text-xs text-gray-500">{t('score')}: {stat.score}/{stat.max}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase bg-white bg-opacity-50`}>
                                        {t(stat.label)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2B. Admin/Homeroom View */}
            {canViewFullInsights && insights && (
                <div className={sectionWrapper}>
                    <h3 className={`${sectionTitle} mb-4 flex items-center gap-2`}>
                        📊 {t('academic_insights')}
                    </h3>
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

            {/* 3. Grades Table */}
            <div className={sectionWrapper}>
                <h3 className={sectionTitle}>{t('detailed_grades')}</h3>
                {grades.length ? (
                    <div className="overflow-x-auto mt-4">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('subject')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('semester')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('score')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {grades.map(grade => {
                                    const max = grade.assessments?.reduce((sum, a) => sum + (a.assessmentType?.totalMarks || 0), 0) || 1;
                                    const pct = ((grade.finalScore / max) * 100).toFixed(0);
                                    return (
                                        <tr key={grade._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{grade.subject?.name}</td>
                                            <td className="px-6 py-4 text-gray-500">{grade.semester === 'First Semester' ? t('sem_1') : t('sem_2')}</td>
                                            <td className="px-6 py-4 font-bold text-gray-800">{grade.finalScore} / {max}</td>
                                            <td className="px-6 py-4 text-gray-600 font-mono text-xs">{pct}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="text-gray-500 text-center py-4">{t('no_grades')}</p>}
            </div>

            {/* 4. Behavioral Reports */}
            <div className={sectionWrapper}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={sectionTitle}>{t('behavioral_traits')}</h3>
                    {canViewFullInsights && <Link to={`/reports/add/${student._id}`} className={`${buttonBase} bg-blue-500 hover:bg-blue-600 text-white`}>{t('add_new_report')}</Link>}
                </div>
                {reports.length ? (
                    <div className="space-y-4">
                        {reports.map(report => (
                            <div key={report._id} className="bg-gray-50 p-4 rounded-lg border">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-gray-700">
                                        {report.semester === 'First Semester' ? t('sem_1') : t('sem_2')} - {report.academicYear}
                                    </h4>
                                    {canViewFullInsights && (
                                        <div className="flex gap-2">
                                            <Link to={`/reports/edit/${report._id}`} className={`${buttonBase} bg-yellow-500 text-white py-1 px-3`}>{t('edit')}</Link>
                                            <button onClick={() => handleReportDelete(report._id)} className={`${buttonBase} bg-red-500 text-white py-1 px-3`}>{t('delete')}</button>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-2 text-gray-600"><strong>{t('teacher_comment')}:</strong> {report.teacherComment || 'N/A'}</p>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-gray-500 text-center py-4">{t('no_comments')}</p>}
            </div>

            <Link to="/students" className="text-pink-500 hover:underline">← {t('back')}</Link>
        </div>
    );
};

export default StudentDetailPage;