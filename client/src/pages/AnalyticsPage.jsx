// src/pages/AnalyticsPage.js
import React, { useState, useEffect } from 'react';
import subjectService from '../services/subjectService';
import assessmentTypeService from '../services/assessmentTypeService';
import analyticsService from '../services/analyticsService';
import authService from '../services/authService';
import userService from '../services/userService';

// --- Reusable Stat Card Component ---
const StatCard = ({ title, value, unit = '', colorClass = 'text-gray-900' }) => (
    <div className="bg-white p-4 rounded-lg shadow text-center border">
        <p className="text-sm text-gray-500 uppercase font-semibold">{title}</p>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}{unit}</p>
    </div>
);

const AnalyticsPage = () => {
    // --- State Management ---
    const [currentUser] = useState(authService.getCurrentUser());
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [assessmentTypes, setAssessmentTypes] = useState([]);
    const [analysisResult, setAnalysisResult] = useState(null);

    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedAssessment, setSelectedAssessment] = useState('');

    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [loadingAssessments, setLoadingAssessments] = useState(false);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [error, setError] = useState(null);

    // --- Data Fetching Logic ---
    useEffect(() => {
        const loadSubjects = async () => {
            try {
                let subjects = [];
                if (currentUser.role === 'admin') {
                    const res = await subjectService.getAllSubjects();
                    subjects = res.data.data;
                } else {
                    const res = await userService.getProfile();
                    subjects = res.data.subjectsTaught.map(a => a.subject).filter(Boolean);
                }
                setAvailableSubjects(subjects);
            } catch (err) { setError('Failed to load subject list.'); } 
            finally { setLoadingSubjects(false); }
        };
        loadSubjects();
    }, [currentUser.role]);

    useEffect(() => {
        if (!selectedSubject) {
            setAssessmentTypes([]);
            setSelectedAssessment('');
            return;
        }
        setLoadingAssessments(true);
        assessmentTypeService.getBySubject(selectedSubject)
            .then(res => {
                // In a real app, you'd also  filter by semester here
                setAssessmentTypes(res.data.data);
            })
            .catch(err => setError('Could not fetch assessments.'))
            .finally(() => setLoadingAssessments(false));
        setSelectedAssessment('');
    }, [selectedSubject]);

    const handleFetchAnalysis = () => {
        if (!selectedAssessment) return;
        setLoadingAnalysis(true); setError(null); setAnalysisResult(null);
        analyticsService.getAnalysis(selectedAssessment)
            .then(res => setAnalysisResult(res.data))
            .catch(err => setError(err.response?.data?.message || 'Failed to get analysis.'))
            .finally(() => setLoadingAnalysis(false));
    };
    
    const gradeLevels = [...new Set(availableSubjects.map(s => s.gradeLevel))].sort();
    const subjectsForGrade = selectedGrade ? availableSubjects.filter(s => s.gradeLevel === selectedGrade) : [];

    // --- Style strings for the crosstab table ---
    const thStyle = "p-2 border border-black text-center align-middle text-xs font-medium uppercase";
    const subThStyle = `${thStyle} bg-gray-100`;
    const tdStyle = "p-2 border border-black text-center text-sm";
    
    if (loadingSubjects) return <p className="text-center text-lg mt-8">Loading configuration...</p>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Assessment Analysis</h2>
            
            <div className="p-4 bg-gray-50 rounded-lg border grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="font-bold block mb-1 text-sm">Grade Level</label>
                    <select onChange={(e) => { setSelectedGrade(e.target.value); setSelectedSubject(''); }} value={selectedGrade} className="w-full p-2 border rounded-md">
                        <option value="">Select Grade</option>
                        {gradeLevels.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <div>
                    <label className="font-bold block mb-1 text-sm">Subject</label>
                    <select onChange={(e) => setSelectedSubject(e.target.value)} value={selectedSubject} className="w-full p-2 border rounded-md" disabled={!selectedGrade}>
                        <option value="">Select Subject</option>
                        {subjectsForGrade.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="font-bold block mb-1 text-sm">Assessment</label>
                    <select onChange={(e) => setSelectedAssessment(e.target.value)} value={selectedAssessment} className="w-full p-2 border rounded-md" disabled={!selectedSubject}>
                        <option value="">Select Assessment</option>
                        {loadingAssessments ? <option>Loading...</option> : assessmentTypes.map(at => <option key={at._id} value={at._id}>{at.month} - {at.name} ({at.semester})</option>)}
                    </select>
                </div>
                <button onClick={handleFetchAnalysis} className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-md" disabled={!selectedAssessment || loadingAnalysis}>
                    {loadingAnalysis ? 'Analyzing...' : 'Get Analysis'}
                </button>
            </div>
            
            {error && <div className="text-red-500 text-center p-4 bg-red-50 rounded border border-red-200">{error}</div>}

            {loadingAnalysis && <p className="text-center">Calculating results...</p>}

            {analysisResult && (
                <div className="animate-fade-in space-y-8 mt-6">
                    <h3 className="text-xl font-bold text-gray-800">Results for: <span className="text-pink-600">{analysisResult.assessmentType.name}</span></h3>
                    {analysisResult.analysis ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard title="Average Score" value={analysisResult.analysis.stats.averageScore.toFixed(1)} unit="%" colorClass="text-blue-600" />
                                <StatCard title="Highest Score" value={analysisResult.analysis.stats.maxScore.toFixed(1)} unit="%" colorClass="text-green-600" />
                                <StatCard title="Lowest Score" value={analysisResult.analysis.stats.minScore.toFixed(1)} unit="%" colorClass="text-red-600" />
                                <StatCard title="Students Graded" value={analysisResult.analysis.stats.studentCount} />
                            </div>
                            
                            <div>
                                <h4 className="text-lg font-bold text-gray-700 mb-3">Score Distribution Analysis</h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border-collapse border border-black">
                                        <thead>
                                            <tr>
                                                <th rowSpan="2" className={thStyle}>Student Number</th>
                                                <th colSpan="4" className={thStyle}> &lt; 50% </th>
                                                <th colSpan="4" className={thStyle}> 50% - 74.9% </th>
                                                <th colSpan="4" className={thStyle}> 75% - 89.9% </th>
                                                <th colSpan="4" className={thStyle}> &gt;= 90% </th>
                                            </tr>
                                            <tr>
                                                <th className={subThStyle}>F</th><th className={subThStyle}>M</th><th className={subThStyle}>T</th><th className={subThStyle}>%</th>
                                                <th className={subThStyle}>F</th><th className={subThStyle}>M</th><th className={subThStyle}>T</th><th className={subThStyle}>%</th>
                                                <th className={subThStyle}>F</th><th className={subThStyle}>M</th><th className={subThStyle}>T</th><th className={subThStyle}>%</th>
                                                <th className={subThStyle}>F</th><th className={subThStyle}>M</th><th className={subThStyle}>T</th><th className={subThStyle}>%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className={`${tdStyle} font-bold`}>{analysisResult.analysis.totalCounts.F} F, {analysisResult.analysis.totalCounts.M} M, {analysisResult.analysis.totalCounts.T} T</td>
                                                <td className={tdStyle}>{analysisResult.analysis.distribution.under50.F}</td><td className={tdStyle}>{analysisResult.analysis.distribution.under50.M}</td><td className={`${tdStyle} font-bold`}>{analysisResult.analysis.distribution.under50.T}</td><td className={`${tdStyle} bg-gray-100`}>{analysisResult.analysis.distribution.under50.P}%</td>
                                                <td className={tdStyle}>{analysisResult.analysis.distribution.between50and75.F}</td><td className={tdStyle}>{analysisResult.analysis.distribution.between50and75.M}</td><td className={`${tdStyle} font-bold`}>{analysisResult.analysis.distribution.between50and75.T}</td><td className={`${tdStyle} bg-gray-100`}>{analysisResult.analysis.distribution.between50and75.P}%</td>
                                                <td className={tdStyle}>{analysisResult.analysis.distribution.between75and90.F}</td><td className={tdStyle}>{analysisResult.analysis.distribution.between75and90.M}</td><td className={`${tdStyle} font-bold`}>{analysisResult.analysis.distribution.between75and90.T}</td><td className={`${tdStyle} bg-gray-100`}>{analysisResult.analysis.distribution.between75and90.P}%</td>
                                                <td className={tdStyle}>{analysisResult.analysis.distribution.over90.F}</td><td className={tdStyle}>{analysisResult.analysis.distribution.over90.M}</td><td className={`${tdStyle} font-bold`}>{analysisResult.analysis.distribution.over90.T}</td><td className={`${tdStyle} bg-gray-100`}>{analysisResult.analysis.distribution.over90.P}%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : <p className="text-center text-gray-500 p-4">{analysisResult.message}</p>}
                </div>
            )}
        </div>
    );
};

export default AnalyticsPage;