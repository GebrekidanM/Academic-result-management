import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import Hook
import subjectService from '../services/subjectService';
import assessmentTypeService from '../services/assessmentTypeService';
import gradeService from '../services/gradeService';
import authService from '../services/authService';
import userService from '../services/userService';
import studentService from '../services/studentService';
import offlineGradeService from '../services/offlineGradeService'; 
import offlineAssessmentService from '../services/offlineAssessmentService';

const GradeSheetPage = () => {
  const { t } = useTranslation(); // <--- Initialize Hook
  const location = useLocation();
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
        setError(t('error'));
      }
    };
    loadSubjects();
  }, [currentUser.role, t]);

  // --- Load Assessment Types ---
  useEffect(() => {
      const fetchAssessments = async () => {
          if (!selectedSubject) return;
          
          let onlineAssessments = [];
          let offlineAssessments = [];

          if (navigator.onLine) {
              try {
                  const res = await assessmentTypeService.getBySubject(selectedSubject);
                  onlineAssessments = res.data.data;
              } catch (err) {
                  console.error("Couldn't fetch online assessments");
              }
          }

          const allLocal = offlineAssessmentService.getLocalAssessments();
          offlineAssessments = allLocal.filter(a => a.subject === selectedSubject);

          setAssessmentTypes([...onlineAssessments, ...offlineAssessments]);
      };

      fetchAssessments();
  }, [selectedSubject]);

  // --- Load Grade Sheet ---
  const handleLoadSheet = async () => {
    if (!selectedAssessment) return;
    
    setLoading(true);
    setError(null);

    if (selectedAssessment.toString().startsWith('TEMP_')) {
      console.log("Loading offline assessment locally...");

      try {
        const localAssessments = offlineAssessmentService.getLocalAssessments();
        const currentAssessment = localAssessments.find(a => a._id === selectedAssessment);

        if (!currentAssessment) throw new Error("Offline assessment data not found.");

        const currentSubject = subjects.find(s => s._id === selectedSubject);
        if (!currentSubject) throw new Error("Subject details not found.");

        const studentRes = await studentService.getAllStudents();
        
        if (!studentRes.data || !Array.isArray(studentRes.data.data)) {
             throw new Error("Student list not cached. Please view 'Students List' while online once.");
        }
        
        const allStudents = studentRes.data.data;

        const classStudents = allStudents
          .filter(s => s.gradeLevel === currentSubject.gradeLevel)
          .sort((a, b) => a.fullName.localeCompare(b.fullName));

        if (classStudents.length === 0) {
          throw new Error(`No students found for ${currentSubject.gradeLevel}.`);
        }

        const mockSheetData = {
          assessmentType: currentAssessment,
          students: classStudents.map(s => ({
            _id: s._id,
            fullName: s.fullName,
            studentId: s.studentId,
            score: null 
          }))
        };

        setSheetData(mockSheetData);
        const initialScores = {};
        mockSheetData.students.forEach(s => { initialScores[s._id] = ''; });
        setScores(initialScores);

      } catch (err) {
        console.error(err);
        setError(err.message || t('error'));
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const response = await gradeService.getGradeSheet(selectedAssessment);
      setSheetData(response.data);
      
      const initialScores = {};
      response.data.students.forEach(s => {
        initialScores[s._id] = s.score ?? '';
      });
      setScores(initialScores);

    } catch (err) {
      console.error(err);
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subjectFromLink && assessmentTypeFromLink) {
      setSelectedSubject(subjectFromLink.id);
      setSelectedAssessment(assessmentTypeFromLink._id);
    }
  }, [subjectFromLink, assessmentTypeFromLink]);

  useEffect(() => {
    if (subjectFromLink && assessmentTypeFromLink) {
      setTimeout(() => {
        handleLoadSheet();
      }, 300);
    }
  }, [assessmentTypeFromLink]);

  const handleScoreChange = (studentId, value) => {
    if (sheetData && Number(value) > sheetData.assessmentType.totalMarks) {
        return;
    }
    setScores(prevScores => ({ ...prevScores, [studentId]: value }));
  };

  // --- SAVE ---
  const handleSave = async () => {
    if (saveDisabled) return;
    setSaveDisabled(true);

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

    // Case A: TEMP ID
    if (selectedAssessment.toString().startsWith('TEMP_')) {
        try {
            offlineGradeService.addToQueue(payload);
            // Translated Alert
            alert(`✅ ${t('success_save')} (Offline). \n\n${t('sync_now')}`);
            setSaveDisabled(false);
        } catch (e) {
            alert(t('error'));
            setSaveDisabled(false);
        }
        return; 
    }

    // Case B: Real ID
    if (!navigator.onLine) {
        try {
            offlineGradeService.addToQueue(payload);
            // Translated Alert
            alert(`${t('saved_offline_msg')}`);
            setSaveDisabled(false); 
        } catch (e) {
            alert(t('error'));
            setSaveDisabled(false);
        }
    } else {
        try {
            await gradeService.saveGradeSheet(payload);
            // Translated Alert
            alert(t('saved_online_msg'));
            setSaveDisabled(false);
        } catch (err) {
            console.error(err);
            if(window.confirm(`${t('error')} ${t('save')} offline?`)) {
                offlineGradeService.addToQueue(payload);
                alert(t('success_save'));
            }
            setSaveDisabled(false);
        }
    }
  };


  return (
    <div>
      <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <Link
          to={'/subject-roster'}
          state={{subjectId: selectedSubject}}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md text-center block"
        >
          {t('class_roster')} / Marklist
        </Link>

        <h2 className="text-2xl font-bold text-gray-800 mt-4">{t('grade_entry_title')}</h2>

        <div className="p-4 bg-gray-50 rounded-lg border grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Subject Select */}
          <div>
            <label className="font-bold block mb-1 text-sm">{t('subject')}</label>
            <select
              onChange={(e) => setSelectedSubject(e.target.value)}
              value={selectedSubject}
              className="w-full p-2 border rounded-md"
            >
              <option value="">-- {t('select_subject')} --</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.gradeLevel})
                </option>
              ))}
            </select>
          </div>

          {/* Assessment Select */}
          <div>
            <label className="font-bold block mb-1 text-sm">{t('assessment')}</label>
            <select
              onChange={(e) => setSelectedAssessment(e.target.value)}
              value={selectedAssessment}
              className="w-full p-2 border rounded-md"
              disabled={!selectedSubject}
            >
              <option value="">-- {t('select_assessment')} --</option>
              {assessmentTypes.map(at => (
                <option key={at._id} value={at._id}>
                  {at._id.startsWith('TEMP_') ? `[Offline] ` : ''}{at.month} - {at.name}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year */}
          <div>
            <label className="font-bold block mb-1 text-sm">{t('academic_year')}</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div className="flex justify-between px-3 w-full md:col-span-3">
            <button
              onClick={handleLoadSheet}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-blue-300"
              disabled={!selectedAssessment || loading}
            >
              {loading && sheetData === null ? t('loading') : t('load_sheet')}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-center p-4 bg-red-50 rounded border border-red-200">
            {error}
          </div>
        )}

        {/* --- Subject Info --- */}
        {subjectFromLink && (
          <div className="bg-gray-100 border rounded p-4 mt-4">
            <h3 className="font-semibold text-gray-800">{t('subject_info')}</h3>
            <p><strong>{t('full_name')}:</strong> {subjectFromLink.name}</p>
            <p><strong>{t('grade')}:</strong> {subjectFromLink.gradeLevel}</p>
          </div>
        )}

        {/* --- Grade Sheet Table --- */}
        {sheetData && (
          <div className="animate-fade-in mt-6">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  {t('scores_for')} <span className="text-pink-600">{sheetData.assessmentType.name}</span>
                  <span className="text-sm text-gray-500 ml-2">({sheetData.assessmentType.month})</span>
                </h3>
                <p className="text-sm text-gray-500">
                  {t('total_marks')}: {sheetData.assessmentType.totalMarks}
                </p>
              </div>
              <button
                onClick={handleSave}
                className={`bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-lg shadow ${
                    saveDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={loading}
                >
                {loading ? t('loading') : t('save_all')}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                      {t('full_name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                      {t('score')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sheetData.students.map(student => (
                    <tr key={student._id} className="hover:bg-pink-50 transition-colors">
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
                          placeholder={`/ ${sheetData.assessmentType.totalMarks}`}
                          className="w-24 text-center border-2 border-gray-300 rounded-md p-1 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 font-bold"
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