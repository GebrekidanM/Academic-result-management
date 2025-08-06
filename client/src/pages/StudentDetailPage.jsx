// src/pages/StudentDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import studentService from '../services/studentService';
import gradeService from '../services/gradeService';
import behavioralReportService from '../services/behavioralReportService';
import authService from '../services/authService';

const StudentDetailPage = () => {
    // --- State Management ---
    const [currentUser] = useState(authService.getCurrentUser());
    const [student, setStudent] = useState(null);
    const [grades, setGrades] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    // --- Data Fetching ---
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true); setError(null);
            try {
                const [studentRes, gradesRes, reportsRes] = await Promise.allSettled([
                    studentService.getStudentById(id),
                    gradeService.getGradesByStudent(id),
                    behavioralReportService.getReportsByStudent(id)
                ]);

                if (studentRes.status === 'fulfilled') {
                    setStudent(studentRes.value.data.data);
                } else {
                    throw new Error('Failed to fetch student details.');
                }

                if (gradesRes.status === 'fulfilled') setGrades(gradesRes.value.data.data); else setGrades([]);
                if (reportsRes.status === 'fulfilled') setReports(reportsRes.value.data.data); else setReports([]);

            } catch (err) { setError(err.message || 'An unexpected error occurred.'); } 
            finally { setLoading(false); }
        };
        fetchAllData();
    }, [id]);

    // --- Action Handlers ---
    const handleStudentDelete = async () => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            try { await studentService.deleteStudent(id); alert('Student deleted successfully.'); navigate('/students'); } 
            catch (err) { alert('Failed to delete student.'); }
        }
    };
    const handleGradeDelete = async (gradeId) => {
        if (window.confirm('Are you sure you want to delete this grade entry?')) {
            try { await gradeService.deleteGrade(gradeId); setGrades(grades.filter(g => g._id !== gradeId)); } 
            catch (err) { alert('Failed to delete grade.'); }
        }
    };
    const handleReportDelete = async (reportId) => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            try { await behavioralReportService.deleteReport(reportId); setReports(reports.filter(r => r._id !== reportId)); } 
            catch (err) { alert('Failed to delete report.'); }
        }
    };
    
    // --- Render Logic ---
    if (loading) return <p className="text-center text-lg mt-8">Loading full student report...</p>;
    if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;
    if (!student) return <p className="text-center text-lg mt-8">Student not found.</p>;

    // --- NEW: Permission Calculation ---
    const isAdmin = currentUser && currentUser.role === 'admin';
    const isHomeroomTeacher = currentUser && currentUser.role === 'teacher' && currentUser.homeroomGrade === student?.gradeLevel;
    
    // --- Tailwind CSS class strings ---
    const sectionWrapper = "bg-white p-6 rounded-lg shadow-md mb-8";
    const sectionTitle = "text-xl font-bold text-gray-800";
    const buttonBase = "py-2 px-4 rounded-md font-semibold transition-colors duration-200 text-sm shadow-sm";
    const greenButton = `${buttonBase} bg-green-500 hover:bg-green-600 text-white`;
    const blueButton = `${buttonBase} bg-blue-500 hover:bg-blue-600 text-white`;
    const yellowButton = `${buttonBase} bg-yellow-500 hover:bg-yellow-600 text-white`;
    const redButton = `${buttonBase} bg-red-500 hover:bg-red-600 text-white`;
    const tableHeader = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
    const tableCell = "px-6 py-4 whitespace-nowrap text-sm";

    return (
        <div className="space-y-8">
            {/* --- Student Info and Actions Section --- */}
            <div className={sectionWrapper}>
                <div className="flex flex-col sm:flex-row justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{student.fullName}</h2>
                        <p className="text-gray-500 mt-1">ID: {student.studentId} | Gender: {student.gender} | Grade: {student.gradeLevel}</p>
                    </div>
                    {isAdmin && (
                        <div className="flex gap-2 mt-4 sm:mt-0">
                            <Link to={`/students/edit/${student._id}`} className={yellowButton}>Edit Info</Link>
                            <button onClick={handleStudentDelete} className={redButton}>Delete Student</button>
                        </div>
                    )}
                </div>
                <div className="mt-6 border-t pt-4">
                     <Link to={`/students/${student._id}/report`} className={`${greenButton} text-base`}>
                        Generate Full Report Card
                    </Link>
                </div>
            </div>

            {/* --- Academic Grades Section --- */}
            <div className={sectionWrapper}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={sectionTitle}>Academic Grades</h3>
                    <Link to={`/grades/add/${student._id}`} className={blueButton}>Add New Grade</Link>
                </div>
                {grades.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-gray-50"><tr><th className={tableHeader}>Subject</th><th className={tableHeader}>Semester</th><th className={tableHeader}>Year</th><th className={tableHeader}>Score</th><th className={tableHeader}>Actions</th></tr></thead>
                           <tbody className="bg-white divide-y divide-gray-200">
                               {grades.map(grade => (
                                   <tr key={grade._id} className="hover:bg-gray-50">
                                       <td className={`${tableCell} font-medium text-gray-900`}>{grade.subject.name}</td>
                                       <td className={`${tableCell} text-gray-500`}>{grade.semester}</td>
                                       <td className={`${tableCell} text-gray-500`}>{grade.academicYear}</td>
                                       <td className={`${tableCell} font-bold text-gray-800`}>{grade.finalScore}</td>
                                       <td className={`${tableCell} flex gap-2`}>
                                           <Link to={`/grades/edit/${grade._id}`} className={yellowButton}>Edit</Link>
                                           <button onClick={() => handleGradeDelete(grade._id)} className={redButton}>Delete</button>
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                        </table>
                    </div>
                ) : <p className="text-gray-500 text-center py-4">No academic grades have been entered yet.</p>}
            </div>

            {/* --- THIS IS THE NEW, SECURE BEHAVIORAL REPORTS SECTION --- */}
            <div className={sectionWrapper}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className={sectionTitle}>Behavioral & Skills Assessment</h3>
                    {/* Only show the "Add" button to the homeroom teacher or an admin */}
                    {(isHomeroomTeacher || isAdmin) && (
                        <Link to={`/reports/add/${student._id}`} className={blueButton}>Add New Report</Link>
                    )}
                </div>
                {reports.length > 0 ? (
                    <div className="space-y-4">
                        {reports.map(report => (
                            <div key={report._id} className="bg-gray-50 p-4 rounded-lg border">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-gray-700">{report.semester} - {report.academicYear}</h4>
                                    {/* Only show Edit/Delete to the homeroom teacher or an admin */}
                                    {(isHomeroomTeacher || isAdmin) && (
                                        <div className="flex gap-2">
                                            <Link to={`/reports/edit/${report._id}`} className={yellowButton}>Edit</Link>
                                            <button onClick={() => handleReportDelete(report._id)} className={redButton}>Delete</button>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-2 text-gray-600"><strong>Comment:</strong> {report.teacherComment || 'N/A'}</p>
                                <ul className="mt-2 list-disc list-inside text-sm text-gray-500">
                                    {report.evaluations.map((ev, i) => <li key={i}>{ev.area}: <strong>{ev.result}</strong></li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-gray-500 text-center py-4">No behavioral reports have been entered yet.</p>}
            </div>
            
            <Link to="/students" className="text-pink-500 hover:underline">← Back to Students List</Link>
        </div>
    );
};

export default StudentDetailPage;