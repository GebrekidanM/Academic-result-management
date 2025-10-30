// src/pages/GradeSheetPage.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import subjectService from '../services/subjectService';
import assessmentTypeService from '../services/assessmentTypeService';
import gradeService from '../services/gradeService';
import authService from '../services/authService';
import userService from '../services/userService';
import { saveOfflineGrade } from '../offlineDB';

const GradeSheetPage = () => {
  const location = useLocation();

  // Data received from AssessmentTypesPage (if navigated from there)
  const assessmentTypeFromLink = location.state?.assessmentType || null;
  const subjectFromLink = location.state?.subject || null;

  // --- State ---
  const [saveDisabled, setSaveDisabled] = useState(false);
  const [academicYear, setAcademicYear] = useState('');
  const [currentUser] = useState(authService.getCurrentUser());
  const [subjects, setSubjects] = useState([]);
  const [assessmentTypes, setAssessmentTypes] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [sheetData, setSheetData] = useState(null);
  const [scores, setScores] = useState({});

  // --- UI State ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Load Subjects ---
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        let subjectsToDisplay = [];
        if (currentUser.role === 'admin') {
          const res = await subjectService.getAllSubjects();
          subjectsToDisplay = res.data.data;
        } else {
          const res = await userService.getProfile();
          subjectsToDisplay = res.data.subjectsTaught
            .map(a => a.subject)
            .filter(Boolean);
        }

        const gregorianYear = new Date().getFullYear();
        const gregorianMonth = new Date().getMonth() + 1;
        const currentYear = gregorianMonth > 8 ? gregorianYear - 7 : gregorianYear - 8;
        setAcademicYear(currentYear);
        setSubjects(subjectsToDisplay);
      } catch {
        setError('Failed to load subjects.');
      }
    };
    loadSubjects();
  }, [currentUser.role]);

  // --- Load Assessment Types When Subject Selected ---
  useEffect(() => {
    if (selectedSubject) {
      setSheetData(null);
      assessmentTypeService.getBySubject(selectedSubject)
        .then(res => setAssessmentTypes(res.data.data))
        .catch(() => setError('Failed to load assessment types.'));
    }
  }, [selectedSubject]);

  // --- Preselect Subject & Assessment if Coming from Link ---
  useEffect(() => {
    if (subjectFromLink && assessmentTypeFromLink) {
      setSelectedSubject(subjectFromLink.id);
      setSelectedAssessment(assessmentTypeFromLink._id);
    }
  }, [subjectFromLink, assessmentTypeFromLink]);

  // --- Auto Load Sheet if Coming From Link ---
  useEffect(() => {
    if (subjectFromLink && assessmentTypeFromLink) {
      // Wait until subject and assessment are both set
      setTimeout(() => {
        handleLoadSheet();
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentTypeFromLink]);

  // --- Load Grade Sheet ---
  const handleLoadSheet = async () => {
    if (!selectedAssessment) return;
    setLoading(true);
    setError(null);
    try {
      const response = await gradeService.getGradeSheet(selectedAssessment);
      setSheetData(response.data);
      const initialScores = {};
      response.data.students.forEach(s => {
        initialScores[s._id] = s.score ?? '';
      });
      setScores(initialScores);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load grade sheet.');
    } finally {
      setLoading(false);
    }
  };

  // --- Handle Input Change ---
  const handleScoreChange = (studentId, value) => {
    setScores(prevScores => ({ ...prevScores, [studentId]: value }));
  };

  // --- Save Grade Sheet ---
  const handleSave = async () => {
  if (saveDisabled) return; // prevent double-clicks

  setSaveDisabled(true); // disable the button immediately

  const scoresPayload = Object.keys(scores)
    .filter(id => scores[id] !== '' && scores[id] !== null)
    .map(id => ({ studentId: id, score: Number(scores[id]) }));

  const payload = {
    assessmentTypeId: selectedAssessment,
    subjectId: selectedSubject,
    semester: sheetData.assessmentType.semester,
    academicYear,
    scores: scoresPayload,
  };

  try {
    if (navigator.onLine) {
      await gradeService.saveGradeSheet(payload);
      alert('Grades saved successfully!');
    } else {
      await saveOfflineGrade(payload);
      alert('No internet: grades saved offline ✅');
    }
  } catch (err) {
    console.error(err);
    alert('Failed to save grades.');
    setSaveDisabled(false); // allow retry if save failed
  }
};


  return (
    <div>
      <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <Link
          to={'/subject-roster'}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md"
        >
          Marklist
        </Link>

        <h2 className="text-2xl font-bold text-gray-800 mt-4">Grade Entry Sheet</h2>

        {/* Subject & Assessment Selection */}
        <div className="p-4 bg-gray-50 rounded-lg border grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="font-bold block mb-1 text-sm">Subject</label>
            <select
              onChange={(e) => setSelectedSubject(e.target.value)}
              value={selectedSubject}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Select Subject</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.gradeLevel})
                </option>
              ))}
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
              {assessmentTypes.map(at => (
                <option key={at._id} value={at._id}>
                  {at.month} - {at.name}
                </option>
              ))}
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

          <div className="flex justify-between px-3 w-full">
            <button
              onClick={handleLoadSheet}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md"
              disabled={!selectedAssessment || loading}
            >
              {loading && sheetData === null ? 'Loading...' : 'Load Grade Sheet'}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-center p-4 bg-red-50 rounded border border-red-200">
            {error}
          </div>
        )}

        {/* --- Subject Info if Coming from Link --- */}
        {subjectFromLink && (
          <div className="bg-gray-100 border rounded p-4 mt-4">
            <h3 className="font-semibold text-gray-800">Subject Information</h3>
            <p><strong>Name:</strong> {subjectFromLink.name}</p>
            <p><strong>Grade:</strong> {subjectFromLink.gradeLevel}</p>
            {subjectFromLink.type && <p><strong>Type:</strong> {subjectFromLink.type}</p>}
          </div>
        )}

        {/* --- Grade Sheet Table --- */}
        {sheetData && (
          <div className="animate-fade-in mt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Scores for:{' '}
                  <span className="text-pink-600">{sheetData.assessmentType.name}</span>
                </h3>
                <p className="text-sm text-gray-500">
                  Total Marks: {sheetData.assessmentType.totalMarks}
                </p>
              </div>
              <button
                onClick={handleSave}
                className={`bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg ${
                    saveDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={loading || saveDisabled}
                >
                {saveDisabled ? 'Saved ✅' : loading ? 'Saving...' : 'Save All Grades'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sheetData.students.map(student => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {student.fullName}
                      </td>
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
    </div>
  );
};

export default GradeSheetPage;
