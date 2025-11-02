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

  // --- Load subjects ---
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
      } catch {
        setError('Failed to load subject list.');
      } finally {
        setLoadingSubjects(false);
      }
    };
    loadSubjects();
  }, [currentUser.role]);

  // --- Load assessment types ---
  useEffect(() => {
    if (!selectedSubject) {
      setAssessmentTypes([]);
      setSelectedAssessment('');
      return;
    }
    setLoadingAssessments(true);
    assessmentTypeService.getBySubject(selectedSubject)
      .then(res => setAssessmentTypes(res.data.data))
      .catch(() => setError('Could not fetch assessments.'))
      .finally(() => setLoadingAssessments(false));
    setSelectedAssessment('');
  }, [selectedSubject]);

  // --- Fetch analysis ---
  const handleFetchAnalysis = () => {
    if (!selectedAssessment || !selectedGrade) return;

    setLoadingAnalysis(true);
    setError(null);
    setAnalysisResult(null);

    analyticsService.getAnalysis(selectedAssessment, selectedGrade)
      .then(res => setAnalysisResult(res.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to get analysis.'))
      .finally(() => setLoadingAnalysis(false));
  };

  const gradeLevels = [...new Set(availableSubjects.map(s => s.gradeLevel))].sort();
  const subjectsForGrade = selectedGrade ? availableSubjects.filter(s => s.gradeLevel === selectedGrade) : [];

  const thStyle = "p-2 border border-black text-center align-middle text-xs font-medium uppercase";
  const subThStyle = `${thStyle} bg-gray-100`;
  const tdStyle = "p-2 border border-black text-center text-sm";

  if (loadingSubjects) return <p className="text-center text-lg mt-8">Loading configuration...</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Assessment Analysis</h2>

      {/* Selection Controls */}
      <div className="p-4 bg-gray-50 rounded-lg border grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="font-bold block mb-1 text-sm">Grade Level</label>
          <select
            onChange={(e) => { setSelectedGrade(e.target.value); setSelectedSubject(''); }}
            value={selectedGrade}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select Grade</option>
            {gradeLevels.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="font-bold block mb-1 text-sm">Subject</label>
          <select
            onChange={(e) => setSelectedSubject(e.target.value)}
            value={selectedSubject}
            className="w-full p-2 border rounded-md"
            disabled={!selectedGrade}
          >
            <option value="">Select Subject</option>
            {subjectsForGrade.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="font-bold block mb-1 text-sm">Assessment</label>
          <select
            onChange={(e) => setSelectedAssessment(e.target.value)}
            value={selectedAssessment}
            className="w-full p-2 border rounded-md"
            disabled={!selectedSubject}
          >
            <option value="">Select Assessment</option>
            {loadingAssessments
              ? <option>Loading...</option>
              : assessmentTypes.map(at => (
                <option key={at._id} value={at._id}>
                  {at.month} - {at.name} ({at.semester})
                </option>
              ))}
          </select>
        </div>
        <button
          onClick={handleFetchAnalysis}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-md"
          disabled={!selectedAssessment || loadingAnalysis}
        >
          {loadingAnalysis ? 'Analyzing...' : 'Get Analysis'}
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-center p-4 bg-red-50 rounded border border-red-200">{error}</div>
      )}

      {loadingAnalysis && <p className="text-center">Calculating results...</p>}

      {analysisResult && analysisResult.analysis && (
        <div className="animate-fade-in space-y-8 mt-6">
          <h3 className="text-xl font-bold text-gray-800">
            Results for: <span className="text-pink-600">{analysisResult.assessmentType.month} - {analysisResult.assessmentType.name} out of {analysisResult.assessmentType.totalMarks}</span>
          </h3>

          {/* General Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard title="Total Students" value={analysisResult.analysis.general.totalStudents} />
            <StatCard title="Took Assessment" value={analysisResult.analysis.general.studentsWhoTookAssessment} colorClass="text-green-600" />
            <StatCard title="Missed Assessment" value={analysisResult.analysis.general.studentsWhoMissedAssessment} colorClass="text-red-600" />
            <StatCard title="Male" value={analysisResult.analysis.general.maleStudents} />
            <StatCard title="Female" value={analysisResult.analysis.general.femaleStudents} />
            <StatCard title="Pass %" value={analysisResult.analysis.scoreStats.passPercentage} unit="%" colorClass="text-blue-600" />
          </div>

          {/* Score Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard title="Highest Score" value={analysisResult.analysis.scoreStats.highestScore} />
            <StatCard title="Lowest Score" value={analysisResult.analysis.scoreStats.lowestScore} />
            <StatCard title="Average Score" value={analysisResult.analysis.scoreStats.averageScore} />
            <StatCard title="Highest %" value={analysisResult.analysis.scoreStats.highestPercent} unit="%" />
            <StatCard title="Lowest %" value={analysisResult.analysis.scoreStats.lowestPercent} unit="%" />
            <StatCard title="Average %" value={analysisResult.analysis.scoreStats.averagePercent} unit="%" />
          </div>

          {/* Distribution Table */}
          <div>
            <h4 className="text-lg font-bold text-gray-700 mb-3">Score Distribution Analysis</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-black">
                <thead>
                  <tr>
                    <th rowSpan="2" className={thStyle}>Range</th>
                    <th colSpan="4" className={thStyle}>&lt; 50%</th>
                    <th colSpan="4" className={thStyle}>50% - 74.9%</th>
                    <th colSpan="4" className={thStyle}>75% - 89.9%</th>
                    <th colSpan="4" className={thStyle}>&gt;= 90%</th>
                  </tr>
                  <tr>
                    {Array(4).fill().map((_, i) => (
                      ['F', 'M', 'T', '%'].map(h => <th key={`${i}-${h}`} className={subThStyle}>{h}</th>)
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${tdStyle} font-bold`}>Students</td>
                    {Object.values(analysisResult.analysis.distribution).map((range, i) => (
                      <>
                        <td key={`F-${i}`} className={tdStyle}>{range.F}</td>
                        <td key={`M-${i}`} className={tdStyle}>{range.M}</td>
                        <td key={`T-${i}`} className={`${tdStyle} font-bold`}>{range.T}</td>
                        <td key={`P-${i}`} className={`${tdStyle} bg-gray-100`}>{range.P}%</td>
                      </>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
