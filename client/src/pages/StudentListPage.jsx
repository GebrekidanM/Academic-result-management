import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import studentService from '../services/studentService';
import authService from '../services/authService';
import userService from '../services/userService';

const StudentListPage = () => {
    // --- State Management ---
    const [currentUser] = useState(authService.getCurrentUser());
    const [allStudents, setAllStudents] = useState([]);
    const [availableGrades, setAvailableGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // NEW: Search state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching ---
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // 1. Fetch the students (The backend now filters this based on role!)
                const studentRes = await studentService.getAllStudents();
                const fetchedStudents = studentRes.data.data;
                setAllStudents(fetchedStudents);

                // 2. Determine which Grade Buttons to show
                // From your existing code:
                if (currentUser.role === 'admin' || currentUser.role === 'staff') {
                    const uniqueGrades = [...new Set(fetchedStudents.map(s => s.gradeLevel))].sort();
                    setAvailableGrades(uniqueGrades);
                }
                 
                else if (currentUser.role === 'teacher') {
                    // Teachers see grades based on their Profile (Homeroom + Subjects)
                    const profileRes = await userService.getProfile();
                    const teacherProfile = profileRes.data;

                    const gradeSet = new Set();

                    // A. Add Homeroom Grade
                    if (teacherProfile.homeroomGrade) {
                        gradeSet.add(teacherProfile.homeroomGrade);
                    }

                    // B. Add Grades from Subjects Taught
                    if (teacherProfile.subjectsTaught) {
                        teacherProfile.subjectsTaught.forEach(assign => {
                            if (assign.subject?.gradeLevel) {
                                gradeSet.add(assign.subject.gradeLevel);
                            }
                        });
                    }

                    const sortedGrades = Array.from(gradeSet).sort();
                    setAvailableGrades(sortedGrades);
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load student data.');
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [currentUser.role]);

    // --- Memoized Filtering (Grade + Search) ---
    const filteredStudents = useMemo(() => {
        if (!selectedGrade) return [];

        return allStudents
            .filter(student => {
                // 1. Match Grade
                const matchGrade = student.gradeLevel === selectedGrade;
                // 2. Match Search Term (Name or ID)
                const matchSearch = searchTerm === '' || 
                    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
                
                return matchGrade && matchSearch;
            })
            .sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [selectedGrade, allStudents, searchTerm]);

    if (loading) return <div className="p-10 text-center text-lg text-gray-600">Loading student data...</div>;
    if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;

    // --- Styling ---
    const gradeButton = "px-4 py-2 border rounded-md transition-all duration-200 font-medium text-sm shadow-sm";
    const selectedBtn = "bg-pink-600 text-white border-pink-600 shadow-md transform scale-105";
    const deselectedBtn = "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400";

    return (
        <div className="bg-white p-6 rounded-lg shadow-md min-h-screen">
            
            {/* --- Header --- */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Students List</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage and view student records</p>
                </div>
                
                <div className="flex gap-3">
                    {/* Only Admin/Staff can add/import */}
                    {['admin', 'staff'].includes(currentUser.role) && (
                        <>
                            <Link to="/students/add" className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded shadow transition-colors">
                                + Add Student
                            </Link>
                            <Link to="/students/import" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow transition-colors">
                                Import Excel
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* --- Grade Level Selector --- */}
            <div className="mb-8 bg-gray-50 p-5 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Filter by Grade:</h4>
                    {selectedGrade && (
                        <button onClick={() => { setSelectedGrade(null); setSearchTerm(''); }} className="text-xs text-red-500 hover:text-red-700 font-bold underline">
                            Reset Filter
                        </button>
                    )}
                </div>
                
                <div className="flex flex-wrap gap-3">
                    {availableGrades.length > 0 ? (
                        availableGrades.map(grade => (
                            <button 
                                key={grade} 
                                onClick={() => setSelectedGrade(grade)}
                                className={`${gradeButton} ${selectedGrade === grade ? selectedBtn : deselectedBtn}`}
                            >
                                {grade}
                            </button>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 italic">No classes assigned to you.</p>
                    )}
                </div>
            </div>

            {/* --- Student List Table --- */}
            {selectedGrade ? (
                <div className="animate-fade-in">
                    
                    {/* Search Bar & Title */}
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-4 gap-4">
                        <h3 className="text-xl font-bold text-gray-800">
                            Class: <span className="text-pink-600">{selectedGrade}</span> 
                            <span className="text-sm text-gray-400 font-normal ml-2">({filteredStudents.length} students)</span>
                        </h3>
                        
                        <input 
                            type="text" 
                            placeholder="Search by name or ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 text-sm w-full md:w-64 focus:outline-none focus:border-pink-500"
                        />
                    </div>

                    <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Gender</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map(student => (
                                        <tr key={student._id} className="hover:bg-pink-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">{student.studentId}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link to={`/students/${student._id}`} className="text-base font-medium text-gray-900 hover:text-pink-600">
                                                    {student.fullName}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.gender}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <Link to={`/students/${student._id}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                                            {searchTerm ? 'No students match your search.' : 'No students found in this grade.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-gray-500 text-lg">Select a Grade Level above to view students.</p>
                </div>
            )}
        </div>
    );
};

export default StudentListPage;