import React, { useState, useEffect } from 'react';
import studentAuthService from '../services/studentAuthService';
import studentService from '../services/studentService';
import gradeService from '../services/gradeService';
import behavioralReportService from '../services/behavioralReportService';
import rankService from '../services/rankService';

const ParentDashboardPage = () => {
    // --- State Management ---
    const [student, setStudent] = useState(null);
    const [grades, setGrades] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rankBySemester, setRankBySemester] = useState({});

    // --- 1. Fetch Primary Data ---
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

    // --- 2. Fetch Ranks (FIXED: Moved to useEffect to prevent infinite loop) ---
    useEffect(() => {
        if (!student || grades.length === 0) return;

        const fetchRanks = async () => {
            // Get unique semesters from grades
            const semesters = [...new Set(grades.map(g => g.semester))];
            
            // Extract academic year safely (fallback to '2018' or similar if parsing fails)
            // Ideally, use the year from the grade object, but we'll use your ID logic safely
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
    }, [student, grades]); // Only runs when student or grades change


    // --- 3. Helper: Process Grades for Table Display ---
    const processSemesterGrades = (semesterGrades) => {
        return semesterGrades.map(grade => {
            // Flatten assessments for easier table rendering
            // Sort by month order if needed
            const flatAssessments = grade.assessments.map(a => ({
                ...a,
                monthName: a.assessmentType?.month,
                testName: a.assessmentType?.name,
                totalMarks: a.assessmentType?.totalMarks
            }));

            // Calculate total possible score for this subject
            const subjectTotalMax = flatAssessments.reduce((sum, a) => sum + (a.totalMarks || 0), 0);

            return {
                ...grade,
                flatAssessments,
                subjectTotalMax
            };
        });
    };


    if (loading) return <div className="flex justify-center items-center h-screen text-lg">Loading your child's information...</div>;
    if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;
    if (!student) return null;

    const card = "bg-white p-6 rounded-lg shadow-md mb-6";
    const tableHeader = "px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase bg-gray-50 border-b";
    const tableCell = "px-4 py-2 text-sm border-b border-gray-100";

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            
            {/* --- Main Info Card --- */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                    {student.imageUrl ? (
                        <img src={student.imageUrl} alt={student.fullName} className="w-40 h-48 rounded-lg object-cover shadow-md" />
                    ) : (
                        <div className="w-40 h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">No Photo</div>
                    )}
                </div>

                {/* Info Section */}
                <div className="flex-grow w-full">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4 border-b pb-2">{student.fullName}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                        <p><span className="font-bold text-gray-600">ID:</span> {student.studentId}</p>
                        <p><span className="font-bold text-gray-600">Grade:</span> {student.gradeLevel}</p>
                        <p><span className="font-bold text-gray-600">Gender:</span> {student.gender}</p>
                        <p><span className="font-bold text-gray-600">Age:</span> {student.dateOfBirth ? new Date().getFullYear() - new Date(student.dateOfBirth).getFullYear() : 'N/A'}</p>
                        <p><span className="font-bold text-gray-600">Parent:</span> {student.motherName} / {student.motherContact}</p>
                        <p><span className="font-bold text-gray-600">Health:</span> <span className="text-red-500">{student.healthStatus}</span></p>
                    </div>
                </div>
            </div>

            {/* --- Academic Grades Summary --- */}
            <div className={card}>
                <h3 className="text-xl font-bold text-gray-700 mb-6 border-l-4 border-blue-600 pl-3">Academic Performance</h3>
                
                {grades.length > 0 ? (
                    <div className="space-y-12">
                        {/* Group by Semester */}
                        {Object.entries(
                            grades.reduce((acc, g) => {
                                acc[g.semester] = acc[g.semester] || [];
                                acc[g.semester].push(g);
                                return acc;
                            }, {})
                        ).map(([semester, rawGrades]) => {
                            
                            const processedGrades = processSemesterGrades(rawGrades);
                            
                            // Calculate Semester Totals
                            const semesterTotalScore = processedGrades.reduce((sum, g) => sum + g.finalScore, 0);
                            const semesterMaxScore = processedGrades.reduce((sum, g) => sum + g.subjectTotalMax, 0);
                            const semesterAvg = semesterMaxScore > 0 ? ((semesterTotalScore / semesterMaxScore) * 100).toFixed(1) : 0;

                            return (
                                <div key={semester} className="border rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-blue-900 text-white p-4 flex justify-between items-center">
                                        <h4 className="text-lg font-bold">Semester: {semester}</h4>
                                        <div className="text-sm bg-blue-800 px-3 py-1 rounded">
                                            Rank: <strong>{rankBySemester[semester] || '...'}</strong>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead>
                                                <tr>
                                                    <th className={tableHeader}>Subject</th>
                                                    <th className={tableHeader}>Assessment Breakdown</th>
                                                    <th className={`${tableHeader} text-center`}>Subject Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white">
                                                {processedGrades.map((grade) => (
                                                    <tr key={grade._id} className="hover:bg-gray-50">
                                                        {/* Subject Name */}
                                                        <td className={`${tableCell} font-bold text-gray-800 align-top w-1/4`}>
                                                            {grade.subject.name}
                                                        </td>

                                                        {/* Nested Table for Assessments (Cleaner than RowSpan) */}
                                                        <td className="p-2 border-b border-gray-100">
                                                            <table className="w-full text-xs">
                                                                <tbody>
                                                                    {grade.flatAssessments.map((assess, idx) => (
                                                                        <tr key={idx} className="border-b border-gray-100 last:border-0">
                                                                            <td className="py-1 text-gray-500 w-1/3">{assess.monthName}</td>
                                                                            <td className="py-1 w-1/3">{assess.testName}</td>
                                                                            <td className="py-1 font-bold text-right w-1/3">
                                                                                {assess.score} / {assess.totalMarks}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </td>

                                                        {/* Final Subject Score */}
                                                        <td className={`${tableCell} font-bold text-center align-middle bg-gray-50 text-blue-900`}>
                                                            {grade.finalScore} / {grade.subjectTotalMax}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            {/* Semester Summary Footer */}
                                            <tfoot className="bg-gray-100 border-t-2 border-gray-200">
                                                <tr>
                                                    <td className="px-4 py-3 font-bold text-right" colSpan={2}>Grand Total:</td>
                                                    <td className="px-4 py-3 font-bold text-center text-lg">{semesterTotalScore}</td>
                                                </tr>
                                                <tr>
                                                    <td className="px-4 py-3 font-bold text-right" colSpan={2}>Average:</td>
                                                    <td className="px-4 py-3 font-bold text-center text-blue-600">{semesterAvg}%</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg">No academic grades found.</div>
                )}
            </div>

            {/* --- Behavioral Reports --- */}
            <div className={card}>
                <h3 className="text-xl font-bold text-gray-700 mb-4 border-l-4 border-yellow-500 pl-3">Teacher's Comments</h3>
                {reports.length > 0 ? (
                    <div className="grid gap-4">
                        {reports.map(report => (
                            <div key={report._id} className="p-4 border rounded-lg bg-yellow-50 border-yellow-100">
                                <div className="flex justify-between mb-2">
                                    <h4 className="font-bold text-yellow-800">{report.semester}</h4>
                                    <span className="text-xs text-yellow-600">{report.academicYear}</span>
                                </div>
                                <p className="text-sm text-gray-700 italic">"{report.teacherComment || 'No comment provided.'}"</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No behavioral reports available.</p>
                )}
            </div>
        </div>
    );
};

export default ParentDashboardPage;