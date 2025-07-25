// src/pages/EditGradePage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import gradeService from '../services/gradeService';
import assessmentTypeService from '../services/assessmentTypeService';

const EditGradePage = () => {
    const { gradeId } = useParams();
    const navigate = useNavigate();

    // --- State Management ---
    const [gradeData, setGradeData] = useState(null);
    const [assessmentTypes, setAssessmentTypes] = useState([]);
    const [scores, setScores] = useState({});
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching ---
    useEffect(() => {
        const loadGradeData = async () => {
            try {
                const gradeRes = await gradeService.getGradeById(gradeId);
                const fetchedGrade = gradeRes.data.data;
                setGradeData(fetchedGrade);

                const assessmentRes = await assessmentTypeService.getBySubject(fetchedGrade.subject._id);
                setAssessmentTypes(assessmentRes.data.data);

                const initialScores = {};
                // Pre-fill scores with existing data, using the full assessment list as a guide
                assessmentRes.data.data.forEach(at => {
                    const existingScore = fetchedGrade.assessments.find(a => a.assessmentType === at._id);
                    initialScores[at._id] = existingScore ? existingScore.score : 0;
                });
                setScores(initialScores);

            } catch (err) {
                setError('Failed to load grade data for editing.');
            } finally {
                setLoading(false);
            }
        };
        loadGradeData();
    }, [gradeId]);

    // --- Data Processing: Group Assessments by Month ---
    const assessmentsByMonth = useMemo(() => {
        const grouped = {};
        assessmentTypes.forEach(at => {
            const month = at.month;
            if (!grouped[month]) grouped[month] = [];
            grouped[month].push(at);
        });
        return grouped;
    }, [assessmentTypes]);

    // --- THIS IS THE UPDATED HANDLER WITH VALIDATION ---
    const handleScoreChange = (assessmentTypeId, value) => {
        // Find the definition for this assessment to know its max marks
        const assessmentDef = assessmentTypes.find(at => at._id === assessmentTypeId);
        if (!assessmentDef) return; // Safety check

        let newScore = Number(value);

        // --- CRITICAL VALIDATION LOGIC ---
        // 1. Prevent scores higher than the maximum allowed
        if (newScore > assessmentDef.totalMarks) {
            newScore = assessmentDef.totalMarks;
        }
        // 2. Prevent negative numbers
        if (newScore < 0) {
            newScore = 0;
        }
        
        // Update the state with the validated score
        setScores({ ...scores, [assessmentTypeId]: newScore });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const assessmentsPayload = Object.keys(scores).map(id => ({
            assessmentType: id,
            score: scores[id]
        }));
        const updatePayload = { assessments: assessmentsPayload };
        
        try {
            await gradeService.updateGrade(gradeId, updatePayload);
            alert('Grade updated successfully!');
            navigate(`/students/${gradeData.student}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update grade.');
        }
    };
    
    const currentTotal = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);

    if (loading) return <p className="text-center text-lg mt-8">Loading grade for editing...</p>;
    if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;
    if (!gradeData) return null;

    // --- Tailwind CSS class strings ---
    const textInput = "shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const submitButton = `bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Grade</h2>
            <Link to={`/students/${gradeData.student}`} className="text-pink-500 hover:underline mb-6 block">
                ← Back to Student Details
            </Link>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <p><strong>Subject:</strong> {gradeData.subject.name}</p>
                <p><strong>Semester:</strong> {gradeData.semester}</p>
                <p><strong>Academic Year:</strong> {gradeData.academicYear}</p>
            </div>

            <form onSubmit={handleSubmit}>
                {Object.keys(assessmentsByMonth).length > 0 && (
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Update Scores</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {Object.keys(assessmentsByMonth).map(month => (
                                <fieldset key={month} className="border border-gray-300 p-4 rounded-lg">
                                    <legend className="font-bold px-2">{month}</legend>
                                    {assessmentsByMonth[month].map(at => (
                                        <div key={at._id} className="grid grid-cols-2 items-center gap-4 mb-2">
                                            <label htmlFor={at._id} className="text-sm font-medium text-gray-700">
                                                {at.name} (out of {at.totalMarks})
                                            </label>
                                            <input 
                                                id={at._id} type="number"
                                                value={scores[at._id] || 0}
                                                onChange={e => handleScoreChange(at._id, e.target.value)}
                                                max={at.totalMarks} min="0"
                                                className={textInput} required
                                            />
                                        </div>
                                    ))}
                                </fieldset>
                            ))}
                        </div>
                        <div className="text-right text-2xl font-bold text-gray-800 mt-6 p-4 bg-gray-100 rounded-lg">
                            New Final Score: <span className="text-pink-600">{currentTotal}</span>
                        </div>
                    </div>
                )}
                
                <div className="mt-8">
                    <button type="submit" className={submitButton}>Update Grade</button>
                </div>
            </form>
        </div>
    );
};

export default EditGradePage;