// src/pages/AddReportPage.js
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import behavioralReportService from '../services/behavioralReportService';

// Predefined areas for evaluation
const EVALUATION_AREAS = [
    "Punctuality", "Attendance", "Responsibility", "Respect",
    "Cooperation", "Initiative", "Completes Work"
];

const AddReportPage = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();

    // --- State Management ---
    const [semester, setSemester] = useState('First Semester');
    const [academicYear, setAcademicYear] = useState('2017 E.C');
    const [teacherComment, setTeacherComment] = useState('');
    const [conduct, setConduct] = useState('A');
    const [evaluations, setEvaluations] = useState(
        EVALUATION_AREAS.map(area => ({ area, result: 'G' }))
    );
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- Handlers ---
    const handleEvaluationChange = (index, value) => {
        const newEvaluations = [...evaluations];
        newEvaluations[index].result = value;
        setEvaluations(newEvaluations);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const reportData = { studentId, semester, academicYear, teacherComment, conduct, evaluations };
        try {
            await behavioralReportService.addReport(reportData);
            alert('Behavioral report added successfully!');
            navigate(`/students/${studentId}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add report.');
            setLoading(false);
        }
    };

    // --- Tailwind CSS class strings ---
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const selectInput = "shadow border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const textInput = "shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const textAreaInput = "shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500 h-24";
    const submitButton = `w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Add Behavioral & Skills Assessment</h2>
            <Link to={`/students/${studentId}`} className="text-pink-500 hover:underline mb-6 block">
                ← Back to Student Details
            </Link>
            
            <form onSubmit={handleSubmit}>
                {/* --- Top Section: Semester, Year, Conduct --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label htmlFor="semester" className={inputLabel}>Semester</label>
                        <select id="semester" value={semester} onChange={(e) => setSemester(e.target.value)} className={selectInput}>
                            <option value="First Semester">First Semester</option>
                            <option value="Second Semester">Second Semester</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="academicYear" className={inputLabel}>Academic Year</label>
                        <input id="academicYear" type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className={textInput} />
                    </div>
                    <div>
                        <label htmlFor="conduct" className={inputLabel}>Overall Conduct</label>
                        <input id="conduct" type="text" value={conduct} onChange={(e) => setConduct(e.target.value)} className={textInput} />
                    </div>
                </div>

                {/* --- Main Section: Evaluations and Comments --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left side: Evaluation traits */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Evaluations</h3>
                        <div className="space-y-4">
                            {evaluations.map((evaluation, index) => (
                                <div key={index} className="grid grid-cols-2 items-center">
                                    <label className="font-medium text-gray-700">{evaluation.area}:</label>
                                    <select value={evaluation.result} onChange={(e) => handleEvaluationChange(index, e.target.value)} className={selectInput}>
                                        <option value="E">E - Excellent</option>
                                        <option value="VG">VG - Very Good</option>
                                        <option value="G">G - Good</option>
                                        <option value="NI">NI - Needs Improvement</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Right side: Teacher's Comment */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Teacher's Comment</h3>
                        <div>
                            <label htmlFor="teacherComment" className="sr-only">Teacher's Comment</label>
                            <textarea
                                id="teacherComment"
                                value={teacherComment}
                                onChange={(e) => setTeacherComment(e.target.value)}
                                className={textAreaInput}
                                placeholder="Enter your comments here..."
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <button type="submit" className={submitButton} disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Report'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            </form>
        </div>
    );
};

export default AddReportPage;