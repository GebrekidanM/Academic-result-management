// src/pages/ParentDashboardPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import studentAuthService from '../services/studentAuthService';
import studentService from '../services/studentService';
import gradeService from '../services/gradeService';
import behavioralReportService from '../services/behavioralReportService';

const ParentDashboardPage = () => {
    // --- State Management ---
    const [student, setStudent] = useState(null);
    const [grades, setGrades] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
console.log(grades)

    // --- Data Fetching (remains the same) ---
    useEffect(() => {
        const currentStudent = studentAuthService.getCurrentStudent();
        if (currentStudent) {
            const studentId = currentStudent._id;
            const fetchData = async () => {
                try {
                    const results = await Promise.allSettled([
                        studentService.getStudentById(studentId),
                        gradeService.getGradesByStudent(studentId),
                        behavioralReportService.getReportsByStudent(studentId)
                    ]);
                    if (results[0].status === 'fulfilled') setStudent(results[0].value.data.data); else throw new Error('Could not fetch student profile.');
                    if (results[1].status === 'fulfilled') setGrades(results[1].value.data.data);
                    if (results[2].status === 'fulfilled') setReports(results[2].value.data.data);
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

    // --- Style Strings ---
    const card = "bg-white p-6 rounded-lg shadow-md mb-6";
    const title = "text-2xl font-bold text-gray-800 mb-4 border-b pb-2";
    const sectionTitle = "text-xl font-bold text-gray-700 mb-3";
    const grid = "grid grid-cols-1 md:grid-cols-2 gap-4";
    const infoLabel = "font-bold text-gray-600";
    const infoValue = "text-gray-800";
    const buttonLink = "inline-block bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 text-center";
    const tableHeader = "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
    const tableCell = "px-4 py-2 whitespace-nowrap text-sm";


    if (loading) return <p className="text-center text-lg mt-8">Loading your child's information...</p>;
    if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;

    return (
        <div>
            {/* --- Main Info Card --- */}
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6 bg-white p-4 rounded-lg shadow">
                <img
                    src={student.imageUrl}
                    alt={student.fullName}
                    className="w-30 h-30 rounded-full object-cover"
                />
                <div>
                    <h2 className="text-2xl font-bold">{student.fullName}</h2>
                    <div className="flex flex-wrap gap-6">
                        <div className='text-lg'>
                            <p className="text-gray-600">Student ID: {student.studentId}</p>
                            <p className="text-gray-600">Grade Level: {student.gradeLevel}</p>
                            <p className="text-gray-600">Gender: {student.gender}</p>
                            <p className="text-gray-600">Date of Birth: {student.dateOfBirth || "N/A"}</p>
                            <p className="text-gray-600">Promotion Status: {student.promotionStatus}</p>
                            <p className="text-gray-600">Mother Name: {student.motherName}</p>
                        </div>
                        <div className='text-lg'>
                            <p className="text-gray-600">Mother Contact: {student.motherContact || "N/A"}</p>
                            <p className="text-gray-600">Father Contact: {student.fatherContact || "N/A"}</p>
                            <p className="text-gray-600">Health Status: {student.healthStatus}</p>
                            <p className="text-gray-600">Overall Average: {student.overallAverage}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- NEW: Academic Grades Summary --- */}
            <div className={card}>
                <h3 className={sectionTitle}>Recent Academic Performance</h3>
                {grades.length > 0 ? (
                    <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className={tableHeader}>Subject</th>
                            <th className={tableHeader}>Semester</th>
                            <th className={tableHeader}>Month</th>
                            <th className={tableHeader}>Assessment</th>
                            <th className={tableHeader}>Score</th>
                            <th className={tableHeader}>Total Marks</th>
                            <th className={tableHeader}>Final Score</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {grades.map((grade) =>
                            grade.assessments.map((assess, index) => (
                            <tr key={`${grade._id}-${index}`}>
                                {index === 0 && (
                                <>
                                    <td
                                        className={`${tableCell} font-medium text-gray-900`}
                                        rowSpan={grade.assessments.length}
                                    >
                                        {grade.subject.name}
                                    </td>
                                    <td className={`${tableCell} text-gray-500`} rowSpan={grade.assessments.length}>
                                        {grade.semester}
                                    </td>
                                    <td className={`${tableCell} text-gray-500`} rowSpan={grade.assessments.length}>
                                        {assess.assessmentType.month}
                                    </td>
                                    
                                </>
                                )}
                                
                                <td className={`${tableCell} text-gray-700`}>{assess.assessmentType.name}</td>
                                <td className={`${tableCell} text-gray-800 font-semibold`}>{assess.score}</td>
                                <td className={`${tableCell} text-gray-500`}>{assess.assessmentType.totalMarks}</td>
                                {index === 0 && (
                                    <td className={`${tableCell} text-gray-800 font-bold`} rowSpan={grade.assessments.length}>
                                        {grade.finalScore}
                                    </td>
                                )}
                            </tr>
                            ))
                        )}
                        </tbody>
                        <tfoot className="bg-gray-100">
                            <tr>
                                <td className={`${tableCell} font-bold`} colSpan={6}>Total</td>
                                <td className={`${tableCell} font-bold`}>
                                    {grades.reduce((sum, g) => sum + g.finalScore, 0)}
                                </td>
                            </tr>
                            <tr>
                                <td className={`${tableCell} font-bold`} colSpan={6}>Average</td>
                                <td className={`${tableCell} font-bold`}>
                                    {(grades.reduce((sum, g) => sum + g.finalScore, 0) / grades.length).toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                    </div>
                ) : (
                    <p className="text-gray-500">No academic grades have been recorded yet.</p>
                )}
            </div>

            {/* --- NEW: Behavioral Reports Summary --- */}
            <div className={card}>
                <h3 className={sectionTitle}>Recent Behavioral Reports</h3>
                {reports.length > 0 ? (
                    <div className="space-y-4">
                        {reports.map(report => (
                            <div key={report._id} className="p-4 border rounded-lg bg-gray-50">
                                <h4 className="font-bold text-gray-800">{report.semester} ({report.academicYear})</h4>
                                <p className="text-sm text-gray-600 mt-2"><strong>Comment:</strong> {report.teacherComment || 'N/A'}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No behavioral reports have been recorded yet.</p>
                )}
            </div>
        </div>
    );
};

export default ParentDashboardPage;