import React, { useState, useEffect } from 'react';
import supportiveGradeService from '../services/supportiveGradeService';
import studentService from '../services/studentService';

// Grading Scale
const GRADING_SCALE = ["A", "B", "C", "D", "E", "F"]; 

// Helper: Get Current Ethiopian Year
const getCurrentEthYear = () => {
    const now = new Date();
    const gcYear = now.getFullYear();
    const gcMonth = now.getMonth() + 1; 
    return gcMonth >= 9 ? (gcYear - 7).toString() : (gcYear - 8).toString();
};

const SupportiveGradingPage = () => {
    // --- STATE ---
    const [availableGrades, setAvailableGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [semester, setSemester] = useState('First Semester');
    const [academicYear, setAcademicYear] = useState(getCurrentEthYear());
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [marksMatrix, setMarksMatrix] = useState({}); 
    
    const [loading, setLoading] = useState(false);

    // 1. Load Grade Levels
    useEffect(() => {
        const loadClasses = async () => {
            try {
                const res = await studentService.getAllStudents();
                // Extract unique grades
                const uniqueGrades = [...new Set(res.data.data.map(s => s.gradeLevel))].sort();
                setAvailableGrades(uniqueGrades);
            } catch (err) { console.error(err); }
        };
        loadClasses();
    }, []);

    // 2. Fetch Sheet Data
    const fetchSheet = async () => {
        if (!selectedGrade) return;
        setLoading(true);
        try {
            const res = await supportiveGradeService.getSheet(selectedGrade, academicYear, semester);
            const { students, subjects, grades } = res.data;
            
            setStudents(students);
            setSubjects(subjects);

            // Map existing marks
            const initialMatrix = {};
            grades.forEach(g => {
                const key = `${g.student}_${g.subject}`;
                initialMatrix[key] = g.score;
            });
            setMarksMatrix(initialMatrix);

        } catch (err) {
            alert("Error loading data. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    // 3. Handle Input Change
    const handleMarkChange = (studentId, subjectId, value) => {
        setMarksMatrix(prev => ({
            ...prev,
            [`${studentId}_${subjectId}`]: value
        }));
    };

    // 4. Save
    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = [];
            
            students.forEach(student => {
                subjects.forEach(subject => {
                    const val = marksMatrix[`${student._id}_${subject._id}`];
                    // Only push if a value is selected
                    if (val) {
                        payload.push({
                            student: student._id,
                            subject: subject._id,
                            score: val
                        });
                    }
                });
            });

            if (payload.length === 0) {
                alert("No marks entered to save.");
                setLoading(false);
                return;
            }

            await supportiveGradeService.saveGrades({ 
                gradesData: payload,
                academicYear,
                semester 
            });
            
            alert("✅ Grades Saved Successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to save grades.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
                
                {/* Header Controls */}
                <div className="bg-slate-900 p-6 text-white flex flex-col lg:flex-row gap-6 items-end justify-between">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold">Skills / Co-Curricular Grading</h2>
                        <p className="text-gray-400 text-sm mt-1">Enter letter grades for non-academic subjects.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full lg:w-auto text-slate-900">
                        {/* Grade Select */}
                        <select className="p-2 bg-neutral-50 rounded font-bold" value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)}>
                            <option value="">Select Class</option>
                            {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        
                        {/* Semester Select */}
                        <select className="p-2 bg-neutral-50 rounded" value={semester} onChange={e => setSemester(e.target.value)}>
                            <option value="First Semester">Sem 1</option>
                            <option value="Second Semester">Sem 2</option>
                        </select>
                        
                        {/* NEW: Year Input */}
                        <input 
                            type="number" 
                            className="p-2 bg-neutral-50 rounded w-full"
                            value={academicYear}
                            onChange={e => setAcademicYear(e.target.value)}
                            placeholder="Year"
                        />

                        <button 
                            onClick={fetchSheet} 
                            disabled={!selectedGrade || loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-500 disabled:opacity-50"
                        >
                            {loading ? "Loading..." : "Load Sheet"}
                        </button>
                    </div>
                </div>

                {/* Grading Table */}
                <div className="p-6 overflow-x-auto">
                    {students.length > 0 && subjects.length > 0 ? (
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                                <tr>
                                    <th className="border p-3 text-left w-64 bg-gray-200 sticky left-0 z-10">Student Name</th>
                                    {subjects.map(sub => (
                                        <th key={sub._id} className="border p-3 text-center min-w-[100px]">
                                            {sub.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, idx) => (
                                    <tr key={student._id} className="hover:bg-blue-50 transition-colors">
                                        <td className="border p-3 font-bold text-gray-800 bg-gray-50 sticky left-0 z-10">
                                            {idx + 1}. {student.fullName}
                                        </td>
                                        {subjects.map(subject => {
                                            const currentVal = marksMatrix[`${student._id}_${subject._id}`] || "";
                                            return (
                                                <td key={subject._id} className="border p-1 text-center">
                                                    <select 
                                                        value={currentVal} 
                                                        onChange={(e) => handleMarkChange(student._id, subject._id, e.target.value)}
                                                        className={`w-full p-2 border rounded text-center font-bold cursor-pointer
                                                            ${currentVal ? 'bg-white border-blue-400 text-blue-800' : 'bg-gray-50 text-gray-400'}
                                                        `}
                                                    >
                                                        <option value="">-</option>
                                                        {GRADING_SCALE.map(g => (
                                                            <option key={g} value={g}>{g}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center text-gray-400 py-16 flex flex-col items-center">
                            <span className="text-4xl mb-2">📋</span>
                            <p>{selectedGrade ? "No students or supportive subjects found for this class." : "Please select a Class and Year above to start."}</p>
                        </div>
                    )}
                </div>

                {/* Save Button */}
                {students.length > 0 && (
                    <div className="p-6 border-t bg-gray-50 flex justify-end sticky bottom-0 z-20">
                        <button 
                            onClick={handleSave} 
                            disabled={loading}
                            className="bg-green-600 text-white px-8 py-3 rounded shadow-lg hover:bg-green-700 font-bold transition transform active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save All Grades"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportiveGradingPage;