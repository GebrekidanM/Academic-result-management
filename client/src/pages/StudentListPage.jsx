import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import studentService from '../services/studentService';
import authService from '../services/authService';
import userService from '../services/userService';
import StudentStats from '../components/StudentStats'; // <--- IMPORT THE GRAPHS

const StudentListPage = () => {
    const [currentUser] = useState(authService.getCurrentUser());
    const [allStudents, setAllStudents] = useState([]);
    
    // Stores which grades the user is ALLOWED to see
    const [allAllowedGrades, setAllAllowedGrades] = useState([]);
    
    // UI State
    const [selectedSection, setSelectedSection] = useState(null); // 'kg', 'primary', 'highSchool'
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- 1. Data Fetching ---
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const studentRes = await studentService.getAllStudents();
                
                if (!studentRes.data || !Array.isArray(studentRes.data.data)) {
                    if (studentRes.data?.error) throw new Error("Offline mode: Connect once to load data.");
                    throw new Error("Invalid data.");
                }

                const fetchedStudents = studentRes.data.data;
                setAllStudents(fetchedStudents);

                // Determine Allowed Grades based on Role
                let allowed = [];
                if (currentUser.role === 'staff' || currentUser.role === 'admin') {
                    const uniqueGrades = [...new Set(fetchedStudents.map(s => s.gradeLevel))].sort();
                    const level = currentUser.schoolLevel ? currentUser.schoolLevel.toLowerCase() : 'all';
                    
                    if (currentUser.role === 'admin' || level === 'all') allowed = uniqueGrades;
                    else if (level === 'kg') allowed = uniqueGrades.filter(g => /^(kg|nursery)/i.test(g));
                    else if (level === 'primary') allowed = uniqueGrades.filter(g => /^Grade\s*[1-8](\D|$)/i.test(g));
                    else if (level === 'high school') allowed = uniqueGrades.filter(g => /^Grade\s*(9|1[0-2])(\D|$)/i.test(g));
                } 
                else if (currentUser.role === 'teacher') {
                    try {
                        const profileRes = await userService.getProfile();
                        if (profileRes.data) {
                            const gradeSet = new Set();
                            if (profileRes.data.homeroomGrade) gradeSet.add(profileRes.data.homeroomGrade);
                            profileRes.data.subjectsTaught?.forEach(assign => {
                                if (assign.subject?.gradeLevel) gradeSet.add(assign.subject.gradeLevel);
                            });
                            allowed = Array.from(gradeSet).sort();
                        }
                    } catch (e) {
                        allowed = [...new Set(fetchedStudents.map(s => s.gradeLevel))].sort();
                    }
                }
                setAllAllowedGrades(allowed);

            } catch (err) {
                setError(err.message || 'Failed to load data.');
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [currentUser]);

    // --- 2. Filter Logic ---

    // A. Buttons to show based on section
    const visibleGradeButtons = useMemo(() => {
        if (!selectedSection) return [];
        return allAllowedGrades.filter(g => {
            if (selectedSection === 'kg') return /^(kg|nursery)/i.test(g);
            if (selectedSection === 'primary') return /^Grade\s*[1-8](\D|$)/i.test(g);
            if (selectedSection === 'highSchool') return /^Grade\s*(9|1[0-2])(\D|$)/i.test(g);
            return false;
        });
    }, [selectedSection, allAllowedGrades]);

    // B. Students for the Table (Specific Class)
    const tableStudents = useMemo(() => {
        if (!selectedGrade) return [];
        return allStudents
            .filter(s => s.gradeLevel === selectedGrade)
            .filter(s => searchTerm === '' || s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || s.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [selectedGrade, allStudents, searchTerm]);

    // C. Students for Graphs (Entire Section or Entire School)
    const graphStudents = useMemo(() => {
        // Only include students in grades the user is allowed to see
        let relevantStudents = allStudents.filter(s => allAllowedGrades.includes(s.gradeLevel));

        // If a section is selected, filter further
        if (selectedSection === 'kg') return relevantStudents.filter(s => /^(kg|nursery)/i.test(s.gradeLevel));
        if (selectedSection === 'primary') return relevantStudents.filter(s => /^Grade\s*[1-8](\D|$)/i.test(s.gradeLevel));
        if (selectedSection === 'highSchool') return relevantStudents.filter(s => /^Grade\s*(9|1[0-2])(\D|$)/i.test(s.gradeLevel));
        
        return relevantStudents; // Show all allowed if no section selected
    }, [allStudents, allAllowedGrades, selectedSection]);


    // --- 3. Section Card Component ---
    const SectionCard = ({ id, label, color }) => {
        // Calculate count for this specific section card
        const count = allStudents.filter(s => allAllowedGrades.includes(s.gradeLevel) && (
            id === 'kg' ? /^(kg|nursery)/i.test(s.gradeLevel) :
            id === 'primary' ? /^Grade\s*[1-8](\D|$)/i.test(s.gradeLevel) :
            /^Grade\s*(9|1[0-2])(\D|$)/i.test(s.gradeLevel)
        )).length;

        // If user has no access or 0 students, hide card
        if (count === 0) return null;

        return (
            <div 
                onClick={() => { setSelectedSection(id); setSelectedGrade(null); }}
                className={`flex-1 min-w-[200px] p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:-translate-y-1 hover:shadow-lg bg-white ${selectedSection === id ? 'ring-4 ring-offset-2 ring-pink-400 border-transparent shadow-xl' : color}`}
            >
                <h3 className="text-xl font-bold uppercase tracking-wide opacity-80">{label}</h3>
                <div className="mt-2 text-3xl font-black">{count} <span className="text-sm font-normal opacity-60">Students</span></div>
            </div>
        );
    };

    if (loading) return <div className="p-10 text-center text-gray-600">Loading...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Students List</h2>
                    <p className="text-sm text-gray-500">Manage student records</p>
                </div>
                <div className="flex gap-3">
                    {['admin', 'staff'].includes(currentUser.role) && (
                        <>
                            <Link to="/students/add" className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded shadow">+ Add</Link>
                            <Link to="/students/import" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow">Import</Link>
                        </>
                    )}
                </div>
            </div>

            {/* --- GRAPHS AREA --- */}
            {/* Only show graphs if no specific class is selected (to save space) */}
            {!selectedGrade && (
                <StudentStats 
                    students={graphStudents} 
                    sectionName={selectedSection ? selectedSection.toUpperCase() : "Total School"} 
                />
            )}

            {/* --- SECTION SELECTION --- */}
            {!selectedGrade && (
                <div className="flex flex-wrap gap-6 mb-8">
                    <SectionCard id="kg" label="Kindergarten" color="border-purple-200 text-purple-800" />
                    <SectionCard id="primary" label="Primary" color="border-blue-200 text-blue-800" />
                    <SectionCard id="highSchool" label="High School" color="border-indigo-200 text-indigo-800" />
                </div>
            )}

            {/* --- CLASS SELECTION --- */}
            {selectedSection && (
                <div className="mb-8 bg-white p-5 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-gray-700 uppercase">Select Class:</h4>
                        <button onClick={() => { setSelectedSection(null); setSelectedGrade(null); }} className="text-sm text-blue-600 hover:underline">
                            Clear Section
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {visibleGradeButtons.map(grade => (
                            <button 
                                key={grade} 
                                onClick={() => setSelectedGrade(grade)}
                                className={`px-4 py-2 border rounded-md font-bold text-sm transition-all ${selectedGrade === grade ? 'bg-pink-600 text-white border-pink-600 shadow-md' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                            >
                                {grade}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* --- STUDENT TABLE --- */}
            {selectedGrade && (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden animate-slide-up">
                    <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50">
                        <h3 className="text-xl font-bold text-gray-800">
                            {selectedGrade} <span className="text-sm font-normal text-gray-500">({tableStudents.length} Students)</span>
                        </h3>
                        <input 
                            type="text" 
                            placeholder="Search Name or ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 text-sm w-full md:w-64 focus:ring-2 focus:ring-pink-500 outline-none"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-6 py-3 text-left">ID</th>
                                    <th className="px-6 py-3 text-left">Name</th>
                                    <th className="px-6 py-3 text-left">Gender</th>
                                    <th className="px-6 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {tableStudents.length > 0 ? (
                                    tableStudents.map(student => (
                                        <tr key={student._id} className="hover:bg-pink-50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-sm text-gray-500">{student.studentId}</td>
                                            <td className="px-6 py-4 font-bold text-gray-800">
                                                <Link to={`/students/${student._id}`} className="hover:text-pink-600 hover:underline">{student.fullName}</Link>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{student.gender}</td>
                                            <td className="px-6 py-4 text-center">
                                                <Link to={`/students/${student._id}`} className="text-indigo-600 hover:text-indigo-900 font-bold text-sm">View</Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No students match your search.</td></tr>
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