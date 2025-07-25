// src/pages/StudentListPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import studentService from '../services/studentService';
import authService from '../services/authService';
import userService from '../services/userService';

const StudentListPage = () => {
    // --- State Management ---
    const [currentUser] = useState(authService.getCurrentUser());
    const [allStudents, setAllStudents] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [availableGrades, setAvailableGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching (This logic is perfect and remains unchanged) ---
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const studentRes = await studentService.getAllStudents();
                const allFetchedStudents = studentRes.data.data;
                setAllStudents(allFetchedStudents);

                if (currentUser.role === 'admin') {
                    const uniqueGrades = [...new Set(allFetchedStudents.map(s => s.gradeLevel))].sort();
                    setAvailableGrades(uniqueGrades);
                } else if (currentUser.role === 'teacher' || currentUser.role === 'hometeacher') {
                    const profileRes = await userService.getProfile();
                    const uniqueGrades = [...new Set(profileRes.data.subjectsTaught.map(a => a.subject?.gradeLevel).filter(Boolean))].sort();
                    setAvailableGrades(uniqueGrades);
                }
            } catch (err) {
                setError('Failed to load initial student data.');
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [currentUser.role]);

    // --- Memoized Filtering (unchanged) ---
    const filteredStudents = useMemo(() => {
        if (!selectedGrade) return [];
        return allStudents.filter(student => student.gradeLevel === selectedGrade).sort((a,b) => a.fullName.localeCompare(b.fullName));
    }, [selectedGrade, allStudents]);

    if (loading) return <p className="text-center text-lg mt-8">Loading student data...</p>;
    if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;

    // --- Tailwind CSS class strings ---
    const gradeButton = "px-4 py-2 border rounded-md transition-colors duration-200";
    const selectedGradeButton = "bg-pink-500 text-white border-pink-500";
    const deselectedGradeButton = "bg-white hover:bg-gray-100 text-gray-700 border-gray-300";
    const tableHeader = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
    const tableCell = "px-6 py-4 whitespace-nowrap text-sm";

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Students List</h2>
                {currentUser.role === 'admin' && (
                    <div className="flex gap-4">
                        <Link to="/students/add" className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                            Add New Student
                        </Link>
                        <Link to="/students/import" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                            Import from Excel
                        </Link>
                    </div>
                )}
            </div>

            {/* --- Grade Level Selection Buttons --- */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-bold text-gray-700 mb-3">Select a Grade Level to View Students:</h4>
                <div className="flex flex-wrap gap-2">
                    {availableGrades.length > 0 ? (
                        availableGrades.map(grade => (
                            <button 
                                key={grade} 
                                onClick={() => setSelectedGrade(grade)}
                                className={`${gradeButton} ${selectedGrade === grade ? selectedGradeButton : deselectedGradeButton}`}
                            >
                                {grade}
                            </button>
                        ))
                    ) : (
                        <p className="text-gray-500">No grade levels are assigned to you.</p>
                    )}
                    {selectedGrade && <button onClick={() => setSelectedGrade(null)} className="text-sm text-gray-500 hover:underline ml-4">Clear Selection</button>}
                </div>
            </div>

            {/* --- Conditionally Render the Student List --- */}
            {selectedGrade && (
                <div className="student-list-container animate-fade-in">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Students in {selectedGrade}</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className={tableHeader}>Student ID</th>
                                    <th scope="col" className={tableHeader}>Full Name</th>
                                    <th scope="col" className={tableHeader}>Gender</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map(student => (
                                        <tr key={student._id} className="hover:bg-gray-50">
                                            <td className={`${tableCell} text-gray-500`}>{student.studentId}</td>
                                            <td className={`${tableCell} font-medium text-gray-900`}>
                                                <Link to={`/students/${student._id}`} className="text-pink-600 hover:text-pink-800">{student.fullName}</Link>
                                            </td>
                                            <td className={`${tableCell} text-gray-500`}>{student.gender}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="3" className={`${tableCell} text-center text-gray-500`}>No students found for this grade level.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentListPage;