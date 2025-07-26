// src/pages/GradeSheetPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import subjectService from '../services/subjectService';
import assessmentTypeService from '../services/assessmentTypeService';
import gradeService from '../services/gradeService';
import authService from '../services/authService';
import userService from '../services/userService';

const GradeSheetPage = () => {
    const navigate = useNavigate();
     const [academicYear, setAcademicYear] = useState('2017 E.C'); 
    // --- State for Selections ---
    const [currentUser] = useState(authService.getCurrentUser());
    const [subjects, setSubjects] = useState([]);
    const [assessmentTypes, setAssessmentTypes] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedAssessment, setSelectedAssessment] = useState('');
    
    // --- State for Data ---
    const [sheetData, setSheetData] = useState(null); // Holds the list of students and the assessment type
    const [scores, setScores] = useState({}); // Holds the scores being edited: { studentId: score }
    
    // --- UI State ---
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch subjects available to the user
    useEffect(() => {
        const loadSubjects = async () => {
            try {
                let subjectsToDisplay = [];
                if (currentUser.role === 'admin') {
                    const res = await subjectService.getAllSubjects();
                    subjectsToDisplay = res.data.data;
                } else {
                    const res = await userService.getProfile();
                    subjectsToDisplay = res.data.subjectsTaught.map(a => a.subject).filter(Boolean);
                }
                setSubjects(subjectsToDisplay);
            } catch (err) { setError('Failed to load subjects.'); }
        };
        loadSubjects();
    }, [currentUser.role]);

    // Fetch assessment types when a subject is selected
    useEffect(() => {
        if (selectedSubject) {
            setSheetData(null); // Clear previous results
            assessmentTypeService.getBySubject(selectedSubject)
                .then(res => setAssessmentTypes(res.data.data))
                .catch(() => setError('Failed to load assessment types.'));
        }
    }, [selectedSubject]);

    const handleLoadSheet = async () => {
        if (!selectedAssessment) return;
        setLoading(true);
        setError(null);
        try {
            const response = await gradeService.getGradeSheet(selectedAssessment);
            setSheetData(response.data);
            // Initialize the scores state from the fetched data
            const initialScores = {};
            response.data.students.forEach(s => {
                initialScores[s._id] = s.score ?? ''; // Use empty string for null/undefined scores
            });
            setScores(initialScores);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load grade sheet.');
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (studentId, value) => {
        setScores(prevScores => ({ ...prevScores, [studentId]: value }));
    };
    
    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            const scoresPayload = Object.keys(scores)
                .filter(studentId => scores[studentId] !== '' && scores[studentId] !== null) // Only send scores that have been entered
                .map(studentId => ({
                    studentId,
                    score: Number(scores[studentId])
                }));
            
            await gradeService.saveGradeSheet({
                assessmentTypeId: selectedAssessment,
                subjectId: selectedSubject,
                semester: sheetData.assessmentType.semester,
                academicYear: academicYear, // Use the state variable
                scores: scoresPayload
            });
            alert('Grades saved successfully!');
            handleLoadSheet(); // Reload the sheet to confirm changes
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save grades.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Grade Entry Sheet</h2>
            
            <div className="p-4 bg-gray-50 rounded-lg border grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label className="font-bold block mb-1 text-sm">Subject</label>
                    <select onChange={(e) => setSelectedSubject(e.target.value)} value={selectedSubject} className="w-full p-2 border rounded-md">
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.gradeLevel})</option>)}
                    </select>
                </div>
                <div>
                    <label className="font-bold block mb-1 text-sm">Assessment</label>
                    <select onChange={(e) => setSelectedAssessment(e.target.value)} value={selectedAssessment} className="w-full p-2 border rounded-md" disabled={!selectedSubject}>
                        <option value="">Select Assessment</option>
                        {assessmentTypes.map(at => <option key={at._id} value={at._id}>{at.month} - {at.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="font-bold block mb-1 text-sm">Academic Year</label>
                    <input 
                        type="text" 
                        value={academicYear} 
                        onChange={(e) => setAcademicYear(e.target.value)} 
                        className="w-full p-2 border rounded-md"
                    />
                </div>
                <button onClick={handleLoadSheet} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md" disabled={!selectedAssessment || loading}>
                    {loading && sheetData === null ? 'Loading...' : 'Load Grade Sheet'}
                </button>
            </div>

            {error && <div className="text-red-500 text-center p-4 bg-red-50 rounded border border-red-200">{error}</div>}

            {sheetData && (
                <div className="animate-fade-in mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Scores for: <span className="text-pink-600">{sheetData.assessmentType.name}</span></h3>
                            <p className="text-sm text-gray-500">Total Marks: {sheetData.assessmentType.totalMarks}</p>
                        </div>
                        <button onClick={handleSave} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg" disabled={loading}>
                            {loading ? 'Saving...' : 'Save All Grades'}
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sheetData.students.map(student => (
                                    <tr key={student._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{student.fullName}</td>
                                        <td className="px-6 py-4">
                                            <input 
                                                type="number"
                                                value={scores[student._id]}
                                                onChange={(e) => handleScoreChange(student._id, e.target.value)}
                                                max={sheetData.assessmentType.totalMarks}
                                                min="0"
                                                placeholder={`out of ${sheetData.assessmentType.totalMarks}`}
                                                className="w-32 text-center border rounded-md p-1 focus:ring-2 focus:ring-pink-500"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GradeSheetPage;