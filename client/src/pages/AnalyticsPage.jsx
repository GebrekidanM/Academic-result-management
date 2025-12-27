import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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
  const { t } = useTranslation();
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
        if (['admin', 'staff', 'principal'].includes(currentUser.role)) {
          const res = await subjectService.getAllSubjects();
          subjects = res.data.data || res.data;

          // Filter by School Level for Staff
          if (currentUser.role === 'staff' && currentUser.schoolLevel) {
              const level = currentUser.schoolLevel.toLowerCase();
              if (level === 'kg') {
                  subjects = subjects.filter(s => /^(kg|nursery)/i.test(s.gradeLevel));
              } else if (level === 'primary') {
                  subjects = subjects.filter(s => /^Grade\s*[1-8](\D|$)/i.test(s.gradeLevel));
              } else if (level === 'high school') {
                  subjects = subjects.filter(s => /^Grade\s*(9|1[0-2])(\D|$)/i.test(s.gradeLevel));
              }
          }
        } else {
          const res = await userService.getProfile();
          subjects = res.data.subjectsTaught.map(a => a.subject).filter(Boolean);
        }
        setAvailableSubjects(subjects);
      } catch {
        setError(t('error'));
      } finally {
        setLoadingSubjects(false);
      }
    };
    loadSubjects();
  }, [currentUser]);

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
      .catch(() => setError(t('error')))
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
      .catch(err => setError(err.response?.data?.message || t('error')))
      .finally(() => setLoadingAnalysis(false));
  };

  const gradeLevels = [...new Set(availableSubjects.map(s => s.gradeLevel))].sort();
  const subjectsForGrade = selectedGrade ? availableSubjects.filter(s => s.gradeLevel === selectedGrade) : [];

  const thStyle = "p-2 border border-black text-center align-middle text-xs font-medium uppercase";
  const subThStyle = `${thStyle} bg-gray-100`;
  const tdStyle = "p-2 border border-black text-center text-sm";

  if (loadingSubjects) return <p className="text-center text-lg mt-8">{t('loading')}</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">{t('subject_detail')}</h2>
      
      {/* Quick Links */}
      <div className="flex gap-4 mb-4">
          <Link to="/allsubjectAnalysis" className='px-4 py-2 bg-pink-500 text-white border rounded shadow hover:bg-pink-600 transition-colors font-bold text-sm'>
             {t('class_matrix')}
          </Link>
          <Link to="/subject-performance" className='px-4 py-2 bg-pink-500 text-white border rounded shadow hover:bg-pink-600 transition-colors font-bold text-sm'>
             {t('subject_performance')}
          </Link>
      </div>
    
      {/* Selection Controls */}
      <div className="p-4 bg-gray-50 rounded-lg border grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="font-bold block mb-1 text-sm">{t('grade_level')}</label>
          <select
            onChange={(e) => { setSelectedGrade(e.target.value); setSelectedSubject(''); }}
            value={selectedGrade}
            className="w-full p-2 border rounded-md"
          >
            <option value="">{t('select_class')}</option>
            {gradeLevels.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="font-bold block mb-1 text-sm">{t('subject')}</label>
          <select
            onChange={(e) => setSelectedSubject(e.target.value)}
            value={selectedSubject}
            className="w-full p-2 border rounded-md"
            disabled={!selectedGrade}
          >
            <option value="">{t('subject')}</option>
            {subjectsForGrade.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="font-bold block mb-1 text-sm">{t('assessment')}</label>
          <select
            onChange={(e) => setSelectedAssessment(e.target.value)}
            value={selectedAssessment}
            className="w-full p-2 border rounded-md"
            disabled={!selectedSubject}
          >
            <option value="">{t('assessment')}</option>
            {loadingAssessments
              ? <option>{t('loading')}</option>
              : assessmentTypes.map(at => (
                <option key={at._id} value={at._id}>
                  {at.month} - {at.name} ({at.semester})
                </option>
              ))}
          </select>
        </div>
        <button
          onClick={handleFetchAnalysis}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-md disabled:bg-pink-300"
          disabled={!selectedAssessment || loadingAnalysis}
        >
          {loadingAnalysis ? t('loading') : t('analytics')}
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-center p-4 bg-red-50 rounded border border-red-200">{error}</div>
      )}

      {analysisResult && analysisResult.analysis && (
        <div className="animate-fade-in space-y-8 mt-6">
          <h3 className="text-xl font-bold text-gray-800">
            {t('score')}: <span className="text-pink-600">{analysisResult.assessmentType.month} - {analysisResult.assessmentType.name} ({analysisResult.assessmentType.totalMarks})</span>
          </h3>

          {/* General Summary */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard title={t('total_students')} value={analysisResult.analysis.general.totalStudents} />
            <StatCard title="Active" value={analysisResult.analysis.general.studentsWhoTookAssessment} colorClass="text-green-600" />
            <StatCard title="Missed" value={analysisResult.analysis.general.studentsWhoMissedAssessment} colorClass="text-red-600" />
            <StatCard title={t('male')} value={analysisResult.analysis.general.maleStudents} />
            <StatCard title={t('female')} value={analysisResult.analysis.general.femaleStudents} />
            <StatCard title={t('pass_rate')} value={analysisResult.analysis.scoreStats.passPercentage} unit="%" colorClass="text-blue-600" />
          </div>

          {/* Score Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard title="Highest" value={analysisResult.analysis.scoreStats.highestScore} />
            <StatCard title="Lowest" value={analysisResult.analysis.scoreStats.lowestScore} />
            <StatCard title={t('average')} value={analysisResult.analysis.scoreStats.averageScore} />
            <StatCard title="Highest %" value={analysisResult.analysis.scoreStats.highestPercent} unit="%" />
            <StatCard title="Lowest %" value={analysisResult.analysis.scoreStats.lowestPercent} unit="%" />
            <StatCard title="Avg %" value={analysisResult.analysis.scoreStats.averagePercent} unit="%" />
          </div>

          {/* Distribution Table */}
          <div>
            <h4 className="text-lg font-bold text-gray-700 mb-3">{t('score_distribution')}</h4>
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
                      <React.Fragment key={i}>
                        <th className={subThStyle}>{t('F')}</th>
                        <th className={subThStyle}>{t('M')}</th>
                        <th className={subThStyle}>{t('total')[0]}</th>
                        <th className={subThStyle}>%</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={`${tdStyle} font-bold`}>{t('students')}</td>
                    {Object.values(analysisResult.analysis.distribution).map((range, i) => (
                      <React.Fragment key={i}>
                        <td className={tdStyle}>{range.F}</td>
                        <td className={tdStyle}>{range.M}</td>
                        <td className={`${tdStyle} font-bold`}>{range.T}</td>
                        <td className={`${tdStyle} bg-gray-100`}>{range.P}%</td>
                      </React.Fragment>
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