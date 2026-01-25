import React, { useState, useEffect } from 'react';
import supportiveGradeService from '../services/supportiveGradeService';
import studentService from '../services/studentService'; // To get grade levels

const GRADING_SCALE = ["A", "B", "C", "D","E","F"]; // Or ["E", "VG", "G", "NI"]

const SupportiveGradingPage = () => {
    // --- STATE ---
    const [availableGrades, setAvailableGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [semester, setSemester] = useState('First Semester');
    const [academicYear, setAcademicYear] = useState('2018');
    
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    // Matrix State: { "studentID_subjectID": "A" }
    const [marksMatrix, setMarksMatrix] = useState({}); 
    
    const [loading, setLoading] = useState(false);

    // 1. Load Grade Levels (Classes)
    useEffect(() => {
        const loadClasses = async () => {
            try {
                const res = await studentService.getAllStudents();
                const uniqueGrades = [...new Set(res.data.data.map(s => s.gradeLevel))].sort();
                setAvailableGrades(uniqueGrades);
            } catch (err) { console.error(err); }
        };
        loadClasses();
    }, []);

    // 2. Fetch Sheet Data when selection changes
    const fetchSheet = async () => {
        if (!selectedGrade) return;
        setLoading(true);
        try {
            const res = await supportiveGradeService.getSheet(selectedGrade, academicYear, semester);
            const { students, subjects, grades } = res.data;
            
            setStudents(students);
            setSubjects(subjects);

            // Populate existing marks into state
            const initialMatrix = {};
            grades.forEach(g => {
                const key = `${g.student}_${g.subject}`;
                initialMatrix[key] = g.score;
            });
            setMarksMatrix(initialMatrix);

        } catch (err) {
            alert("Error loading data");
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
            // Convert Matrix back to Array for API
            const payload = [];
            
            students.forEach(student => {
                subjects.forEach(subject => {
                    const val = marksMatrix[`${student._id}_${subject._id}`];
                    if (val) {
                        payload.push({
                            student: student._id,
                            subject: subject._id,
                            score: val
                        });
                    }
                });
            });

            await supportiveGradeService.saveGrades({ 
                gradesData: payload,
                academicYear,
                semester 
            });
            
            alert("Grades Saved Successfully!");
        } catch (err) {
            alert("Failed to save");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
                
                {/* Header Controls */}
                <div className="bg-slate-900 p-6 text-white flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold">Skills / Co-Curricular Grading</h2>
                        <p className="text-gray-400 text-sm">Enter letter grades (A, B, C...) for non-academic subjects.</p>
                    </div>
                    
                    <div className="flex gap-2">
                        <select className="text-black p-2 rounded" value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)}>
                            <option value="">Select Grade</option>
                            {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select className="text-black p-2 rounded" value={semester} onChange={e => setSemester(e.target.value)}>
                            <option value="First Semester">Sem 1</option>
                            <option value="Second Semester">Sem 2</option>
                        </select>
                        <button onClick={fetchSheet} className="bg-blue-600 px-4 py-2 rounded font-bold hover:bg-blue-500">
                            Load Sheet
                        </button>
                    </div>
                </div>

                {/* Grading Table */}
                <div className="p-6 overflow-x-auto">
                    {students.length > 0 && subjects.length > 0 ? (
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead className="bg-gray-100 text-gray-700">
                                <tr>
                                    <th className="border p-3 text-left w-64">Student Name</th>
                                    {subjects.map(sub => (
                                        <th key={sub._id} className="border p-3 text-center min-w-[100px]">
                                            {sub.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, idx) => (
                                    <tr key={student._id} className="hover:bg-gray-50">
                                        <td className="border p-3 font-medium">
                                            {idx + 1}. {student.fullName}
                                        </td>
                                        {subjects.map(subject => (
                                            <td key={subject._id} className="border p-2 text-center">
                                                <select 
                                                    value={marksMatrix[`${student._id}_${subject._id}`] || ""} 
                                                    onChange={(e) => handleMarkChange(student._id, subject._id, e.target.value)}
                                                    className="w-full p-1 border rounded text-center font-bold text-slate-800"
                                                >
                                                    <option value="">-</option>
                                                    {GRADING_SCALE.map(g => (
                                                        <option key={g} value={g}>{g}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center text-gray-400 py-10">
                            {selectedGrade ? "No students or supportive subjects found." : "Please select a grade and load."}
                        </div>
                    )}
                </div>

                {/* Save Button */}
                {students.length > 0 && (
                    <div className="p-6 border-t bg-gray-50 flex justify-end">
                        <button 
                            onClick={handleSave} 
                            disabled={loading}
                            className="bg-green-600 text-white px-8 py-3 rounded shadow hover:bg-green-700 font-bold transition"
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