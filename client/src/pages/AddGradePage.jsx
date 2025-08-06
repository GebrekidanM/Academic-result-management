import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import gradeService from '../services/gradeService';
import subjectService from '../services/subjectService';
import assessmentTypeService from '../services/assessmentTypeService';
import authService from '../services/authService';
import userService from '../services/userService';
import studentService from '../services/studentService';

const AddGradePage = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();

    // --- State Management ---
    const [currentUser] = useState(authService.getCurrentUser());
    const [student, setStudent] = useState(null);
    const [subjectsForDropdown, setSubjectsForDropdown] = useState([]);
    
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [allAssessments, setAllAssessments] = useState([]);
    
    const [semester, setSemester] = useState('First Semester');
    const [academicYear, setAcademicYear] = useState('2017 E.C');
    const [scores, setScores] = useState({});
    
    const [loading, setLoading] = useState(true);
    const [loadingAssessments, setLoadingAssessments] = useState(false);
    const [error, setError] = useState(null);

    // --- Data Fetching and Filtering Logic ---
    useEffect(() => {
        const loadInitialData = async () => {
            setError(null);
            try {
                const studentRes = await studentService.getStudentById(studentId);
                const currentStudent = studentRes.data.data;
                setStudent(currentStudent);

                let availableSubjects = [];
                if (currentUser.role === 'admin') {
                    const subjectsRes = await subjectService.getAllSubjects();
                    availableSubjects = subjectsRes.data.data;
                } else if (currentUser.role === 'teacher') {
                    const profileRes = await userService.getProfile();
                    availableSubjects = profileRes.data.subjectsTaught
                        .map(assignment => assignment.subject)
                        .filter(Boolean);
                }

                const filteredSubjects = availableSubjects.filter(
                    subject => subject.gradeLevel === currentStudent.gradeLevel
                );
                setSubjectsForDropdown(filteredSubjects);

            } catch (err) {
                setError('Failed to load required data for this page.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [studentId, currentUser.role]);

    // Fetch assessment types for the selected subject
    useEffect(() => {
        if (selectedSubjectId && semester) {
            setLoadingAssessments(true);
            assessmentTypeService.getBySubject(selectedSubjectId, semester)
                .then(res => {
                    setAllAssessments(res.data.data);
                    const initialScores = {};
                    res.data.data.forEach(at => { initialScores[at._id] = 0; });
                    setScores(initialScores);
                })
                .catch(err => setError('Failed to load assessments for this subject and semester.'))
                .finally(() => setLoadingAssessments(false));
        } else {
            setAllAssessments([]);
        }
    }, [selectedSubjectId, semester]);
    
    // --- Data Processing: Group Assessments by Month ---
    const assessmentsByMonth = useMemo(() => {
        const MONTH_ORDER = ["September", "October", "November", "December", "January", "February", "March", "April", "May", "June"];
        const grouped = {};
        allAssessments.forEach(at => {
            const month = at.month;
            if (!grouped[month]) grouped[month] = [];
            grouped[month].push(at);
        });
        // Sort the months chronologically
        const sortedGrouped = {};
        MONTH_ORDER.forEach(month => {
            if(grouped[month]){
                sortedGrouped[month] = grouped[month];
            }
        });
        return sortedGrouped;
    }, [allAssessments]);

    // --- Event Handlers ---
    const handleScoreChange = (assessmentTypeId, value) => {
        setScores({ ...scores, [assessmentTypeId]: Number(value) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const assessmentsPayload = Object.keys(scores).map(assessmentTypeId => ({
            assessmentType: assessmentTypeId,
            score: scores[assessmentTypeId]
        }));
        const gradeData = { studentId, subjectId: selectedSubjectId, semester, academicYear, assessments: assessmentsPayload };
        try {
            await gradeService.createGrade(gradeData);
            alert('Grade added successfully!');
            navigate(`/students/${studentId}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add grade.');
        }
    };
    
    const currentTotal = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);
    
    // --- Tailwind CSS class strings ---
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const selectInput = "shadow border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const textInput = "shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const submitButton = `w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${!selectedSubjectId || loadingAssessments ? 'opacity-50 cursor-not-allowed' : ''}`;


    if (loading) return <p className="text-center text-lg mt-8">Loading student and subject data...</p>;
    if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Add New Grade</h2>
            <p className="text-lg text-gray-600 mb-4">For: <strong>{student?.fullName}</strong> ({student?.gradeLevel})</p>
            <Link to={`/students/${studentId}`} className="text-pink-500 hover:underline mb-6 block">
                ← Back to Student Details
            </Link>
            
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label htmlFor="subject-select" className={inputLabel}>Subject</label>
                        <select id="subject-select" value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} className={selectInput} required>
                            <option value="">-- Choose a Subject for {student?.gradeLevel} --</option>
                            {subjectsForDropdown.length > 0 ? (
                                subjectsForDropdown.map(s => <option key={s._id} value={s._id}>{s.name}</option>)
                            ) : (
                                <option disabled>No assigned subjects for this grade</option>
                            )}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="semester" className={inputLabel}>Semester</label>
                        <select id="semester" value={semester} onChange={e => setSemester(e.target.value)} className={selectInput} required>
                            <option value="First Semester">First Semester</option>
                            <option value="Second Semester">Second Semester</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="academicYear" className={inputLabel}>Academic Year</label>
                        <input id="academicYear" type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className={textInput} required />
                    </div>
                </div>

                {loadingAssessments && <p className="text-center text-gray-500">Loading assessment fields...</p>}
                
                {Object.keys(assessmentsByMonth).length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Enter Scores</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            {Object.keys(assessmentsByMonth).map(month => (
                                <fieldset key={month} className="border border-gray-300 p-4 rounded-lg">
                                    <legend className="font-bold px-2">{month}</legend>
                                    {assessmentsByMonth[month].map(at => (
                                        <div key={at._id} className="grid grid-cols-2 items-center gap-4 mb-2">
                                            <label htmlFor={at._id} className="text-sm font-medium text-gray-700">{at.name} (out of {at.totalMarks})</label>
                                            <input id={at._id} type="number" value={scores[at._id] || 0} onChange={e => handleScoreChange(at._id, e.target.value)} max={at.totalMarks} min="0" className={textInput} required />
                                        </div>
                                    ))}
                                </fieldset>
                            ))}
                        </div>
                        <div className="text-right text-2xl font-bold text-gray-800 mt-6 p-4 bg-gray-100 rounded-lg">
                            Final Score: <span className="text-pink-600">{currentTotal}</span>
                        </div>
                    </div>
                )}

                {!loadingAssessments && selectedSubjectId && allAssessments.length === 0 && (
                    <p className="text-center text-gray-500 mt-6">
                        No assessment types configured for this subject. An admin or the assigned teacher can 
                        <Link to="/manage-assessments" className="text-pink-500 hover:underline ml-1">configure them here</Link>.
                    </p>
                )}
                
                <div className="mt-8">
                    <button type="submit" className={submitButton} disabled={!selectedSubjectId || loadingAssessments}>
                        Submit Grade
                    </button>
                </div>
                {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            </form>
        </div>
    );
};

export default AddGradePage;