// src/pages/AssessmentTypesPage.js
import React, { useState, useEffect, useMemo } from 'react';
import subjectService from '../services/subjectService';
import assessmentTypeService from '../services/assessmentTypeService';
import authService from '../services/authService';
import userService from '../services/userService';

// Define the months array to be used in the dropdown and for sorting
const MONTHS = ["September", "October", "November", "December", "January", "February", "March", "April", "May", "June"];

const AssessmentTypesPage = () => {
    // --- State Management ---
    const [currentUser] = useState(authService.getCurrentUser());
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [assessmentTypes, setAssessmentTypes] = useState([]);
    const [newAssessmentSemester, setNewAssessmentSemester] = useState('First Semester');

    // States for the "Add New" form
    const [newAssessmentName, setNewAssessmentName] = useState('');
    const [newAssessmentMarks, setNewAssessmentMarks] = useState(10);
    const [newAssessmentMonth, setNewAssessmentMonth] = useState('September');
    
    // States for UI feedback
    const [error, setError] = useState('');
    const [pageLoading, setPageLoading] = useState(true);
    const [assessmentsLoading, setAssessmentsLoading] = useState(false);

    // --- Data Fetching: Load the correct list of subjects based on the user's role ---
    useEffect(() => {
        const loadSubjectsForRole = async () => {
            setError('');
            try {
                let subjectsToDisplay = [];
                if (currentUser.role === 'admin') {
                    const response = await subjectService.getAllSubjects();
                    subjectsToDisplay = response.data.data;
                } else if (currentUser.role === 'teacher') {
                    const response = await userService.getProfile();
                    subjectsToDisplay = response.data.subjectsTaught.map(assignment => assignment.subject).filter(Boolean);
                }
                setSubjects(subjectsToDisplay);
            } catch (err) {
                setError('Failed to load subjects for your role.');
            } finally {
                setPageLoading(false);
            }
        };
        loadSubjectsForRole();
    }, [currentUser.role]);

    // --- Data Processing: Group Subjects by Grade Level ---
    const subjectsByGrade = useMemo(() => {
        const grouped = {};
        subjects.forEach(subject => {
            const grade = subject.gradeLevel || 'Uncategorized';
            if (!grouped[grade]) grouped[grade] = [];
            grouped[grade].push(subject);
        });
        return grouped;
    }, [subjects]);

    // Fetch assessment types when a subject is selected
    useEffect(() => {
        if (selectedSubject) {
            setAssessmentsLoading(true);
            setError(''); // Clear previous errors
            assessmentTypeService.getBySubject(selectedSubject._id)
                .then(response => {
                    const sortedTypes = response.data.data.sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month));
                    setAssessmentTypes(sortedTypes);
                })
                .catch(err => setError('Failed to load assessment types for this subject.'))
                .finally(() => setAssessmentsLoading(false));
        } else {
            setAssessmentTypes([]);
        }
    }, [selectedSubject]);

    // --- Action Handlers ---
    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        if (!newAssessmentMonth) {
            setError('Please select a month for the new assessment.');
            return;
        }
        try {
            const newData = {
                name: newAssessmentName,
                totalMarks: newAssessmentMarks,
                subjectId: selectedSubject._id,
                gradeLevel: selectedSubject.gradeLevel,
                month: newAssessmentMonth,
                semester: newAssessmentSemester
            };
            const response = await assessmentTypeService.create(newData);
            const updatedList = [...assessmentTypes, response.data.data].sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month));
            setAssessmentTypes(updatedList);
            setNewAssessmentName('');
            setNewAssessmentMarks(10);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create assessment type.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this assessment type?')) {
            try {
                await assessmentTypeService.remove(id);
                setAssessmentTypes(assessmentTypes.filter(at => at._id !== id));
            } catch (err) {
                setError('Failed to delete. This type might be used in an existing grade record.');
            }
        }
    };

    if (pageLoading) return <p className="text-center text-lg mt-8">Loading configuration...</p>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Manage Assessment Types</h2>
            <p className="text-gray-600 mb-6">Select a subject below to view and manage its grading structure.</p>
            
            {error && !selectedSubject && <p className="text-red-500 mb-4">{error}</p>}
            
            <div className="subject-selection-container space-y-6">
                {Object.keys(subjectsByGrade).length > 0 ? (
                    Object.keys(subjectsByGrade).sort().map(gradeLevel => (
                        <fieldset key={gradeLevel} className="border border-gray-200 p-4 rounded-lg">
                            <legend className="font-bold text-lg text-gray-700 px-2">{gradeLevel}</legend>
                            <div className="flex flex-wrap gap-2">
                                {subjectsByGrade[gradeLevel].map(subject => (
                                    <button 
                                        key={subject._id} 
                                        onClick={() => setSelectedSubject(subject)}
                                        className={`px-3 py-1 rounded-md transition-colors duration-200 text-sm font-medium ${selectedSubject?._id === subject._id ? 'bg-pink-500 text-white shadow' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                                    >
                                        {subject.name}
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                    ))
                ) : (
                     <p>There are no subjects assigned to you. An admin can assign subjects in the 'User Management' page.</p>
                )}
            </div>

            <hr className="my-6 border-t border-gray-200" />

            {selectedSubject && (
                <div className="animate-fade-in">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Assessments for: <span className="text-pink-600">{selectedSubject.name} ({selectedSubject.gradeLevel})</span></h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-bold text-gray-700 mb-3">Existing Types</h4>
                            {assessmentsLoading ? <p>Loading...</p> : (
                                <ul className="space-y-2">
                                    {assessmentTypes.map(at => (
                                        <li key={at._id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                            <span><strong>{at.month}:</strong> {at.name} ({at.totalMarks} Marks)</span>
                                            <button onClick={() => handleDelete(at._id)} className="text-red-500 hover:text-red-700 text-sm font-bold">Delete</button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {assessmentTypes.length === 0 && !assessmentsLoading && <p className="text-gray-500">No assessment types created for this subject yet.</p>}
                        </div>
                        <div>
                            <form onSubmit={handleCreate} className="bg-gray-50 p-4 rounded-lg border">
                                <h4 className="font-bold text-gray-700 mb-3">Add New Assessment Type</h4>
                                <div className="space-y-3">
                                    <select value={newAssessmentSemester} onChange={(e) => setNewAssessmentSemester(e.target.value)} required>
                                        <option value="First Semester">First Semester</option>
                                        <option value="Second Semester">Second Semester</option>
                                    </select>
                                    <select value={newAssessmentMonth} onChange={(e) => setNewAssessmentMonth(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3" required>
                                        <option value="">-- Select Month --</option>
                                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <input type="text" placeholder="Assessment Name (e.g., Quiz 1)" value={newAssessmentName} onChange={(e) => setNewAssessmentName(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3" required />
                                    <input type="number" placeholder="Total Marks" value={newAssessmentMarks} onChange={(e) => setNewAssessmentMarks(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3" min="1" required />
                                    <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">+ Add</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            
            {error && selectedSubject && <p className="text-red-500 text-center mt-4">{error}</p>}
        </div>
    );
};

export default AssessmentTypesPage;