import React, { useState, useEffect, useMemo } from 'react';
import subjectService from '../services/subjectService';
import assessmentTypeService from '../services/assessmentTypeService';
import offlineAssessmentService from '../services/offlineAssessmentService';
import authService from '../services/authService';
import userService from '../services/userService';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const MONTHS = [
  "September", "October", "November", "December",
  "January", "February", "March", "April", "May", "June"
];

function getEthiopianYear() {
    const today = new Date();
    const gregYear = today.getFullYear();
    const gregMonth = today.getMonth() + 1;
    return gregMonth >= 9 ? gregYear - 7 : gregYear - 8;
}

const AssessmentTypesPage = () => {
  const { t } = useTranslation(); 
  const location = useLocation();
  const subjectFromLink = location.state?.subject || null;

  const [currentUser] = useState(authService.getCurrentUser());
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [assessmentTypes, setAssessmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [error, setError] = useState('');
  const currentEthiopianYear = getEthiopianYear();

  const [formData, setFormData] = useState({
    name: '',
    totalMarks: 10,
    month: 'September',
    semester: 'First Semester',
    year: currentEthiopianYear,
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // --- Pre-select subject ---
  useEffect(() => {
    if (subjectFromLink) {
      setSelectedSubject(subjectFromLink);
    }
  }, [subjectFromLink]);

  // --- Load subjects ---
  useEffect(() => {
    const loadSubjects = async () => {
      setError('');
      try {
        let subjectsList = [];
        if (currentUser.role === 'admin') {
          const res = await subjectService.getAllSubjects();
          subjectsList = res.data.data;
        } else if (currentUser.role === 'teacher') {
          const res = await userService.getProfile();
          subjectsList = res.data.subjectsTaught ? res.data.subjectsTaught.map(s => s.subject).filter(Boolean) : [];
        }
        setSubjects(subjectsList);
      } catch (err) {
        console.error("Error loading subjects:", err);
        setError(t('error') || 'Failed to load subjects. Ensure you visited this page online once.');
      } finally {
        setLoading(false);
      }
    };
    loadSubjects();
  }, [currentUser.role, t]);

  const subjectsByGrade = useMemo(() => {
    const grouped = {};
    subjects.forEach(sub => {
      const grade = sub.gradeLevel || 'Uncategorized';
      if (!grouped[grade]) grouped[grade] = [];
      grouped[grade].push(sub);
    });
    return grouped;
  }, [subjects]);

  // --- Fetch assessments ---
  const fetchAssessments = async () => {
    if (!selectedSubject) return;
    setAssessmentsLoading(true);
    setError('');
    
    let onlineData = [];
    let offlineData = [];

    try {
        const res = await assessmentTypeService.getBySubject(selectedSubject._id);
        if (res.data && Array.isArray(res.data.data)) {
            onlineData = res.data.data;
        } 
    } catch (err) {
        console.log("Using only offline items (No cache available).", err);
    }

    const allLocal = offlineAssessmentService.getLocalAssessments();
    offlineData = allLocal.filter(a => a.subject === selectedSubject._id);

    const merged = [...onlineData, ...offlineData].sort(
        (a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month)
    );
    
    setAssessmentTypes(merged);
    setAssessmentsLoading(false);
  };

  // FETCH ASSESSMENTS ONLY IF SUBJECT IS NUMERIC
  useEffect(() => {
    if (selectedSubject && selectedSubject.gradingType !== 'descriptive') {
        fetchAssessments();
    }
  }, [selectedSubject]);

  // --- Form Handlers ---
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return alert(t('select_class') || 'Select a subject first.');
    
    setSaving(true);
    setError('');

    const payload = { ...formData, subjectId: selectedSubject._id, gradeLevel: selectedSubject.gradeLevel };

    if (!navigator.onLine) {
        if (editingId && !editingId.startsWith('TEMP_')) {
            alert("Cannot edit online assessments while offline.");
            setSaving(false);
            return;
        }
        try {
            if (editingId && editingId.startsWith('TEMP_')) {
                 offlineAssessmentService.removeLocalAssessment(editingId);
                 offlineAssessmentService.addLocalAssessment({ ...payload, subject: selectedSubject._id });
                 alert("Offline assessment updated locally.");
            } else {
                offlineAssessmentService.addLocalAssessment({ ...payload, subject: selectedSubject._id });
                alert("📴 Offline: Assessment created locally! Use Sync when online.");
            }
            await fetchAssessments(); 
            setFormData({ name: '', totalMarks: 10, month: 'September', semester: 'First Semester', year: currentEthiopianYear });
            setEditingId(null);
        } catch (err) {
            setError("Failed to save offline.");
        }
        setSaving(false);
        return;
    }

    try {
      if (editingId && !editingId.startsWith('TEMP_')) {
        await assessmentTypeService.update(editingId, payload);
      } else {
        await assessmentTypeService.create(payload);
      }
      await fetchAssessments();
      setFormData({ name: '', totalMarks: 10, month: 'September', semester: 'First Semester', year: currentEthiopianYear });
      setEditingId(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save.';
      if (msg.includes("already exists")) {
          setError("⚠️ This Assessment already exists! Check the list below.");
      } else {
          setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (assessment) => {
    if (assessment._id.startsWith('TEMP_')) {
        if(!window.confirm("Editing offline items is limited. Do you want to delete and recreate?")) return;
        offlineAssessmentService.removeLocalAssessment(assessment._id);
        fetchAssessments();
    }

    setEditingId(assessment._id);
    setFormData({
      name: assessment.name,
      totalMarks: assessment.totalMarks,
      month: assessment.month,
      semester: assessment.semester,
      year: assessment.year,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('delete') + '?')) return;
    
    if (id.startsWith('TEMP_')) {
        offlineAssessmentService.removeLocalAssessment(id);
        setAssessmentTypes(assessmentTypes.filter(at => at._id !== id));
        return;
    }

    try {
      await assessmentTypeService.remove(id);
      setAssessmentTypes(assessmentTypes.filter(at => at._id !== id));
    } catch {
      setError('Failed to delete. It may contain grades.');
    }
  };

  if (loading) return <p className="text-center mt-8">{t('loading')}</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('manage_assessments')}</h2>
      
      {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded border border-red-200">{error}</div>}

      {/* SUBJECT SELECTION */}
      <div className="space-y-4 mb-6">
        {Object.keys(subjectsByGrade).length > 0 ? (
          Object.keys(subjectsByGrade).sort().map(grade => (
            <fieldset key={grade} className="border border-gray-200 p-4 rounded-lg">
              <legend className="font-bold text-lg text-gray-700 px-2">{grade}</legend>
              <div className="flex flex-wrap gap-2">
                {subjectsByGrade[grade].map(sub => (
                  <button
                    key={sub._id}
                    onClick={() => setSelectedSubject(sub)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors border ${
                      selectedSubject?._id === sub._id
                        ? 'bg-pink-500 text-white border-pink-500'
                        : 'bg-gray-50 hover:bg-gray-200 text-gray-800 border-gray-300'
                    }`}
                  >
                    {sub.name} {sub.gradingType === 'descriptive' && ' (Letter Grades)'}
                  </button>
                ))}
              </div>
            </fieldset>
          ))
        ) : (
          <p>{t('no_data_select_filters')} (Connect online once to load)</p>
        )}
      </div>

      {selectedSubject && (
        <>
          {/* --- CONDITIONAL RENDERING BASED ON GRADING TYPE --- */}
          {selectedSubject.gradingType === 'descriptive' ? (
            
            // 1. DESCRIPTIVE SUBJECT VIEW (No Assessments needed)
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg shadow-sm text-blue-900">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <span>📝</span> Descriptive Subject Selected
                </h3>
                <p className="mb-4 text-sm font-medium">
                    "{selectedSubject.name}" uses descriptive letter grading (e.g., E, VG, G, NI). 
                    Individual numeric assessments (quizzes, tests) are not required for this subject type.
                </p>
                <Link 
                    to="/subject-roster" 
                    state={{ subjectId: selectedSubject._id }}
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow transition-all"
                >
                    Go to Grade Sheet to Enter Marks &rarr;
                </Link>
            </div>

          ) : (

            // 2. NUMERIC SUBJECT VIEW (Form and List)
            <>
              {/* FORM */}
              <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border mb-6">
                <h3 className="text-xl font-bold mb-3 text-gray-700">
                  {editingId ? t('edit') : t('add')} {t('assessment')}
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col md:flex-row gap-3">
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder={t('assessment') + " Name"} required className="border p-2 rounded w-full" />
                    <input type="number" name="totalMarks" value={formData.totalMarks} onChange={handleChange} min="1" placeholder={t('total')} required className="border p-2 rounded w-full" />
                  </div>
                  <div className="flex flex-col md:flex-row gap-3">
                    <select name="semester" value={formData.semester} onChange={handleChange} className="border p-2 rounded w-full">
                      <option value="First Semester">{t('sem_1')}</option>
                      <option value="Second Semester">{t('sem_2')}</option>
                    </select>
                    <select name="month" value={formData.month} onChange={handleChange} className="border p-2 rounded w-full">
                      {MONTHS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <input type="number" name="year" value={formData.year} onChange={handleChange} placeholder={t('academic_year')} className="border p-2 rounded" />
                  
                  <button type="submit" disabled={saving} className={`col-span-2 py-2 rounded font-semibold text-white ${saving ? 'bg-green-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}>
                    {saving ? t('loading') : editingId ? t('update') : t('add')}
                  </button>
                </div>
              </form>

              {/* LIST */}
              <div>
                <h4 className="font-bold mb-3 text-gray-700">{t('overview')}</h4>
                {assessmentsLoading ? <p>{t('loading')}</p> : (
                  assessmentTypes.length > 0 ? (
                    <ul className="space-y-2">
                      {assessmentTypes.map(a => (
                        <li key={a._id} className={`flex justify-between items-center bg-gray-50 p-2 rounded border-l-4 ${a._id.startsWith('TEMP_') ? 'border-l-red-500' : 'border-l-blue-500'}`}>
                          
                          <Link
                            to="/grade-sheet"
                            state={{
                                assessmentType: a,
                                subject: { id: selectedSubject._id, name: selectedSubject.name, gradeLevel: selectedSubject.gradeLevel }
                            }}
                            className="flex-1 hover:underline flex flex-col"
                          >
                            <span className="text-gray-800 font-bold">{a.name} ({a.totalMarks})</span>
                            <span className="text-xs text-gray-500">{a.month} | {a.semester} | {a.year}</span>
                            {a._id.startsWith('TEMP_') && <span className="text-xs text-red-500 font-bold">[Offline - Pending Sync]</span>}
                          </Link>

                          <div className="flex gap-3 ml-4">
                            {!a._id.startsWith('TEMP_') && (
                                <button onClick={() => handleEdit(a)} className="text-blue-500 hover:text-blue-700 text-sm font-bold">{t('edit')}</button>
                            )}
                            <button onClick={() => handleDelete(a._id)} className="text-red-500 hover:text-red-700 text-sm font-bold">{t('delete')}</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-gray-500">{t('no_data_select_filters')} (If offline, ensure you loaded this page once while online)</p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AssessmentTypesPage;