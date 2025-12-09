import React, { useState, useEffect } from 'react';
import studentAuthService from '../services/studentAuthService';
import studentService from '../services/studentService';
import gradeService from '../services/gradeService';
import behavioralReportService from '../services/behavioralReportService';
import rankService from '../services/rankService';

const ParentDashboardPage = () => {
    const [student, setStudent] = useState(null);
    const [grades, setGrades] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rankBySemester, setRankBySemester] = useState({});

    // 1. Fetch Primary Data
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
                    console.error(`Error fetching rank for ${sem}`, err);
                    newRanks[sem] = '-';
                }
            }
            setRankBySemester(newRanks);
        };

        fetchRanks();
    }, [student, grades]);

    // 3. Helper: Calculate Age (Ethiopian)
    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const now = new Date();
        let ethYear = now.getFullYear() - 8;
        if (now.getMonth() > 8 || (now.getMonth() === 8 && now.getDate() >= 11)) {
            ethYear = now.getFullYear() - 7;
        }
        const birthYear = parseInt(String(dob).substring(0, 4));
        return isNaN(birthYear) ? 'N/A' : ethYear - birthYear;
    };

    // 4. Helper: Process Grades
    const processSemesterGrades = (semesterGrades) => {
        return semesterGrades.map(grade => {
            const flatAssessments = grade.assessments.map(a => ({
                id: a._id || Math.random(),
                monthName: a.assessmentType?.month,
                testName: a.assessmentType?.name,
                score: a.score,
                totalMarks: a.assessmentType?.totalMarks
            }));

            // Total Possible Score for Subject
            const subjectTotalMax = flatAssessments.reduce((sum, a) => sum + (a.totalMarks || 0), 0);

            return { ...grade, flatAssessments, subjectTotalMax };
        });
    };

    if (loading) return <div className="flex justify-center items-center h-screen text-lg">Loading...</div>;
    if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;
    if (!student) return null;

    const tableHeader = "px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase bg-gray-50 border-b border-gray-200";
    const tableCell = "px-4 py-3 text-sm border-b border-gray-100 text-gray-700";

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            
            {/* Student Info Card */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="flex-shrink-0">
                    {student.imageUrl ? (
                        <img src={student.imageUrl} alt={student.fullName} className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-sm" />
                    ) : (
                        <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">No Photo</div>
                    )}
                </div>
                <div className="flex-grow text-center md:text-left">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">{student.fullName}</h2>
                    <p className="text-gray-500 mb-4 font-medium">{student.gradeLevel} | ID: {student.studentId}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
                        <p><strong>Age:</strong> {calculateAge(student.dateOfBirth)}</p>
                        <p><strong>Parent:</strong> {student.motherName}</p>
                        <p><strong>Contact:</strong> {student.motherContact}</p>
                        <p><strong>Status:</strong> <span className="text-green-600 font-bold">Active</span></p>
                    </div>
                </div>
            </div>

            {/* Academic Performance */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-xl font-bold text-gray-700 mb-6 border-l-4 border-blue-600 pl-3">Academic Performance</h3>
                
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

                            return (
                                <div key={semester} className="border rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-blue-900 text-white p-4 flex justify-between items-center">
                                        <h4 className="text-lg font-bold">Semester: {semester}</h4>
                                        <div className="text-sm bg-blue-800 px-3 py-1 rounded border border-blue-700">
                                            Rank: <strong>{rankBySemester[semester] || '...'}</strong>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border-collapse">
                                            <thead>
                                                <tr>
                                                    <th className={`${tableHeader} w-1/4`}>Subject</th>
                                                    <th className={tableHeader}>Month</th>
                                                    <th className={tableHeader}>Assessment</th>
                                                    <th className={`${tableHeader} text-right w-30`}>Score</th>
                                                    <th className={`${tableHeader} text-center bg-gray-100`}>Subject Total</th>
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
                                                            <td className={tableCell}>{assess.monthName || '-'}</td>
                                                            <td className={tableCell}>{assess.testName || 'No assessments'}</td>
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
                                                    <td colSpan={3} className="px-4 py-3 font-bold text-right text-gray-600 uppercase text-xs tracking-wider">Grand Total:</td>
                                                    <td colSpan={2} className="px-4 py-3 font-bold text-center text-lg text-gray-900">{semesterObtained.toFixed(2)} / {semesterMax}</td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-2 font-bold text-right text-gray-600 uppercase text-xs tracking-wider">Average:</td>
                                                    <td colSpan={2} className="px-4 py-2 font-bold text-center text-blue-600 text-lg">{semesterAvg}%</td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-2 font-bold text-right text-gray-600 uppercase text-xs tracking-wider">Rank</td>
                                                    <td colSpan={2} className="px-4 py-2 font-bold text-center text-blue-600 text-lg"><strong>{rankBySemester[semester] || '...'}</strong></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center p-10 bg-gray-50 rounded-lg text-gray-500">No grades recorded yet.</div>
                )}
            </div>

            {/* Comments */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-700 mb-4 border-l-4 border-yellow-500 pl-3">Teacher's Comments</h3>
                {reports.length > 0 ? (
                    <div className="grid gap-4">
                        {reports.map(report => (
                            <div key={report._id} className="p-4 border rounded-lg bg-yellow-50 border-yellow-100">
                                <div className="flex justify-between mb-2">
                                    <h4 className="font-bold text-yellow-800">{report.semester}</h4>
                                    <span className="text-xs text-yellow-600">{report.academicYear}</span>
                                </div>
                                <p className="text-sm text-gray-700 italic">"{report.teacherComment || 'No comment.'}"</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No comments available.</p>
                )}
            </div>
        </div>
    );
};

export default ParentDashboardPage;