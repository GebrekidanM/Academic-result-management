// src/pages/AssessmentTypesPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import subjectService from '../shared/services/subjectService';
import assessmentTypeService from '../shared/services/assessmentTypeService';
import assessmentNameService from '../shared/services/assessmentNameService';
import offlineAssessmentService from '../shared/services/offlineAssessmentService';
import authService from '../shared/services/authService';
import userService from '../shared/services/userService';
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

const getGradeName = (gl) => {
    if (!gl) return 'Uncategorized';
    if (typeof gl === 'object') return gl.name || 'Uncategorized';
    return String(gl);
};

const getGradeId = (gl) => {
    if (!gl) return '';
    if (typeof gl === 'object') return gl._id ? gl._id.toString() : '';
    return String(gl);
};

const AssessmentTypesPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const subjectFromLink = location.state?.subject || null;

  const [currentUser] = useState(authService.getCurrentUser());
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedGradeContext, setSelectedGradeContext] = useState({ gradeId: '', gradeName: '' });
  
  const [assessmentTypes, setAssessmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [assessmentNames, setAssessmentNames] = useState([]);
  const [namesLoading, setNamesLoading] = useState(true);
  const [creatingName, setCreatingName] = useState(false);

  const [nameSearch, setNameSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  // Pre-select subject from link state
  useEffect(() => {
    if (subjectFromLink) {
      setSelectedSubject(subjectFromLink);
      if (subjectFromLink.gradeLevelId) {
          setSelectedGradeContext({
              gradeId: subjectFromLink.gradeLevelId,
              gradeName: subjectFromLink.gradeLevelName || ''
          });
      }
    }
  }, [subjectFromLink]);

  // Load Assessment Names
  useEffect(() => {
    const loadNames = async () => {
      try {
        const res = await assessmentNameService.getAllNames();
        setAssessmentNames(res.data?.data || res.data || []);
      } catch (err) {
        console.error("Error loading assessment names:", err);
      } finally {
        setNamesLoading(false);
      }
    };
    loadNames();
  }, []);

  // FIXED: Load Subjects using getAllSubjects()
  useEffect(() => {
    const loadSubjects = async () => {
      setError('');
      try {
        let subjectsList = [];
        if (currentUser.role === 'admin' || currentUser.role === 'staff') {
          const res = await subjectService.getAllSubjects(); // FIXED: Changed to getAllSubjects()
          subjectsList = res.data?.data || res.data || [];
        } else if (currentUser.role === 'teacher') {
          const res = await userService.getProfile();
          const profile = res.data?.data || res.data;
          subjectsList = profile.subjectsTaught ? profile.subjectsTaught.map(s => s.subject).filter(Boolean) : [];
        }
        setSubjects(subjectsList);
      } catch (err) {
        console.error("Error loading subjects:", err);
        setError(t('error') || 'Failed to load subjects.');
      } finally {
        setLoading(false);
      }
    };
    loadSubjects();
  }, [currentUser.role, t]);

  // Group subjects under assigned Grade Levels
  const subjectsByGrade = useMemo(() => {
    const grouped = {};

    subjects.forEach(sub => {
      if (Array.isArray(sub.gradeLevels) && sub.gradeLevels.length > 0) {
        sub.gradeLevels.forEach(item => {
          const gradeObj = item.gradeLevel;
          const gradeName = getGradeName(gradeObj);
          const gradeId = getGradeId(gradeObj) || gradeName;

          if (!grouped[gradeName]) {
            grouped[gradeName] = { gradeId, gradeName, subjects: [] };
          }

          const exists = grouped[gradeName].subjects.some(s => s._id === sub._id);
          if (!exists) {
            grouped[gradeName].subjects.push(sub);
          }
        });
      } else if (sub.gradeLevel) {
        const gradeName = getGradeName(sub.gradeLevel);
        const gradeId = getGradeId(sub.gradeLevel) || gradeName;

        if (!grouped[gradeName]) {
          grouped[gradeName] = { gradeId, gradeName, subjects: [] };
        }
        grouped[gradeName].subjects.push(sub);
      } else {
        if (!grouped['Uncategorized']) {
          grouped['Uncategorized'] = { gradeId: '', gradeName: 'Uncategorized', subjects: [] };
        }
        grouped['Uncategorized'].subjects.push(sub);
      }
    });

    return grouped;
  }, [subjects]);

  // Filter assessment names for autocomplete
  const filteredNames = useMemo(() => {
    if (!nameSearch) return assessmentNames;
    return assessmentNames.filter(n =>
        n.name.toLowerCase().includes(nameSearch.toLowerCase())
    );
  }, [assessmentNames, nameSearch]);

  const handleSelectSubject = (subject, gradeContext) => {
      setSelectedSubject(subject);
      setSelectedGradeContext(gradeContext);
      setEditingId(null);
      setFormData({ name: '', totalMarks: 10, month: 'September', semester: 'First Semester', year: currentEthiopianYear });
      setNameSearch('');
  };

  // Fetch Assessments
  const fetchAssessments = async () => {
    if (!selectedSubject) return;
    setAssessmentsLoading(true);
    setError('');
    
    let onlineData = [];
    let offlineData = [];

    try {
        const res = await assessmentTypeService.getBySubject(selectedSubject._id, selectedGradeContext.gradeId);
        
        if (res.data && Array.isArray(res.data.data)) {
            onlineData = res.data.data;
        } else if (Array.isArray(res.data)) {
            onlineData = res.data;
        }
    } catch (err) {
        console.warn("Using only offline items (No cache available).", err);
    }

    const allLocal = offlineAssessmentService.getLocalAssessments();
    offlineData = allLocal.filter(a => a.subject === selectedSubject._id);

    const merged = [...onlineData, ...offlineData];
    setAssessmentTypes(merged);
    setAssessmentsLoading(false);
  };

  useEffect(() => {
    fetchAssessments();
  }, [selectedSubject, selectedGradeContext]);

  // 🌟 DYNAMICALLY DETECT MOST RECENT YEAR 🌟
  const latestAcademicYear = useMemo(() => {
    if (assessmentTypes.length === 0) return String(currentEthiopianYear);
    
    const validYears = assessmentTypes
        .map(a => parseInt(a.year, 10))
        .filter(y => !isNaN(y));

    if (validYears.length === 0) return String(currentEthiopianYear);
    return String(Math.max(...validYears));
  }, [assessmentTypes, currentEthiopianYear]);

  // 🌟 FILTER ASSESSMENTS FOR THE MOST RECENT YEAR ONLY 🌟
  const recentYearAssessments = useMemo(() => {
    return assessmentTypes.filter(a => String(a.year) === latestAcademicYear);
  }, [assessmentTypes, latestAcademicYear]);

  // 🌟 GROUP RECENT YEAR ASSESSMENTS BY SEMESTER 🌟
  const assessmentsBySemester = useMemo(() => {
    const grouped = {
        "First Semester": [],
        "Second Semester": []
    };

    recentYearAssessments.forEach(a => {
        const sem = a.semester || "First Semester";
        if (!grouped[sem]) grouped[sem] = [];
        grouped[sem].push(a);
    });

    Object.keys(grouped).forEach(sem => {
        grouped[sem].sort((a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month));
    });

    return grouped;
  }, [recentYearAssessments]);

  // Form Handlers
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNameInputChange = (e) => {
    const val = e.target.value;
    setNameSearch(val);
    setShowSuggestions(true);
    setFormData(prev => ({ ...prev, name: '' }));
  };

  const handleSelectSuggestion = (nameObj) => {
    setNameSearch(nameObj.name);
    setFormData(prev => ({ ...prev, name: nameObj._id }));
    setShowSuggestions(false);
  };

  const handleCreateNewAssessmentName = async () => {
      const trimmedName = nameSearch.trim();
      if (!trimmedName) return;

      setCreatingName(true);
      setError('');

      try {
          const res = await assessmentNameService.createName({ name: trimmedName });
          const newNameObj = res.data?.data || res.data;

          if (newNameObj && newNameObj._id) {
              setAssessmentNames(prev => [...prev, newNameObj]);
              setFormData(prev => ({ ...prev, name: newNameObj._id }));
              setNameSearch(newNameObj.name);
              setShowSuggestions(false);
          }
      } catch (err) {
          console.error("Error creating assessment name:", err);
          setError(err.response?.data?.message || "Failed to create assessment name.");
      } finally {
          setCreatingName(false);
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return alert(t('select_class') || 'Select a subject first.');
    if (!formData.name) return alert(t('select_assessment_name_error') || 'Please select or create an assessment name.');
    
    setSaving(true);
    setError('');

    const updatePayload = {
      name: formData.name,
      totalMarks: Number(formData.totalMarks),
      month: formData.month,
      semester: formData.semester,
      year: String(formData.year)
    };

    const createPayload = { 
      ...updatePayload, 
      subject: selectedSubject._id, 
      gradeLevel: selectedGradeContext.gradeId 
    };

    if (!navigator.onLine) {
        if (editingId && !editingId.startsWith('TEMP_')) {
            alert("Cannot edit online assessments while offline.");
            setSaving(false);
            return;
        }
        try {
            if (editingId && editingId.startsWith('TEMP_')) {
                offlineAssessmentService.removeLocalAssessment(editingId);
                offlineAssessmentService.addLocalAssessment({
                    ...createPayload, 
                    subject: selectedSubject._id
                });
                alert("Offline assessment updated locally.");
            } else {
                offlineAssessmentService.addLocalAssessment({
                    ...createPayload, 
                    subject: selectedSubject._id 
                });
                alert("📴 Offline: Assessment created locally! Use Sync when online.");
            }
            
            await fetchAssessments(); 
            setFormData(prev => ({ ...prev, name: '', totalMarks: 10 }));
            setNameSearch('');
            setEditingId(null);
        } catch (err) {
            setError("Failed to save offline.");
        }
        setSaving(false);
        return;
    }

    try {
      if (editingId && !editingId.startsWith('TEMP_')) {
        await assessmentTypeService.update(editingId, updatePayload);
      } else {
        await assessmentTypeService.create(createPayload);
      }
      await fetchAssessments();
      setFormData(prev => ({ ...prev, name: '', totalMarks: 10 }));
      setNameSearch('');
      setEditingId(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save.';
      if (msg.includes("already exists")) {
          setError("⚠️ This Assessment already exists for this subject/month/semester!");
      } else {
          setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (assessment) => {
    if (assessment._id.startsWith('TEMP_')) {
        if(!window.confirm("Editing offline items is limited. We will replace it upon saving. Do you want to proceed?")) {
            return;
        }
    }

    setEditingId(assessment._id);
    
    const selectedNameId = typeof assessment.name === 'object' ? assessment.name?._id : assessment.name;
    const selectedNameString = typeof assessment.name === 'object' ? assessment.name?.name : '';

    setFormData({
      name: selectedNameId || '',
      totalMarks: assessment.totalMarks,
      month: assessment.month,
      semester: assessment.semester,
      year: assessment.year,
    });
    setNameSearch(selectedNameString || '');
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

      {/* SUBJECT SELECTION BY GRADE LEVEL */}
      <div className="space-y-4 mb-6">
        {Object.keys(subjectsByGrade).length > 0 ? (
          Object.keys(subjectsByGrade).sort().map(gradeName => {
            const group = subjectsByGrade[gradeName];
            return (
              <fieldset key={gradeName} className="border border-gray-200 p-4 rounded-lg">
                <legend className="font-bold text-lg text-gray-700 px-2">{gradeName}</legend>
                <div className="flex flex-wrap gap-2">
                  {group.subjects.map(sub => (
                    <button
                      key={`${group.gradeId}-${sub._id}`}
                      onClick={() => handleSelectSubject(sub, { gradeId: group.gradeId, gradeName: group.gradeName })}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        selectedSubject?._id === sub._id && selectedGradeContext.gradeName === group.gradeName
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              </fieldset>
            );
          })
        ) : (
          <p className="text-gray-500">{t('no_data_select_filters')}</p>
        )}
      </div>

      {selectedSubject && (
        <>
          <div className="mb-4 bg-pink-50 p-3 rounded-lg border border-pink-200 flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase">Selected Subject:</span>
              <h3 className="text-lg font-bold text-pink-900">{selectedSubject.name} — <span className="text-blue-700">{selectedGradeContext.gradeName}</span></h3>
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border mb-6">
            <h3 className="text-xl font-bold mb-3 text-gray-700">
              {editingId ? t('edit') : t('add')} {t('assessment')}
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row gap-3">
                
                {/* Autocomplete Assessment Name Input */}
                <div className="relative w-full">
                  <input
                    type="text"
                    name="nameSearch"
                    value={nameSearch}
                    onChange={handleNameInputChange}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                    placeholder={t('search_assessment_name_placeholder') || "Type assessment name (e.g. Quiz 1, Midterm)..."}
                    required
                    autoComplete="off"
                    className="border p-2.5 rounded w-full bg-white text-gray-800 focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                  <input type="hidden" name="name" value={formData.name} required />

                  {/* Suggestions Dropdown */}
                  {showSuggestions && (
                    <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {namesLoading ? (
                        <li className="p-3 text-xs text-gray-400 italic">{t('loading')}</li>
                      ) : filteredNames.length > 0 ? (
                        <>
                          {filteredNames.map(n => (
                            <li
                              key={n._id}
                              onMouseDown={() => handleSelectSuggestion(n)}
                              className="p-2 text-sm text-gray-700 hover:bg-pink-100 hover:text-pink-900 cursor-pointer transition-colors"
                            >
                              {n.name}
                            </li>
                          ))}

                          {!filteredNames.some(n => n.name.toLowerCase() === nameSearch.trim().toLowerCase()) && nameSearch.trim() && (
                            <li 
                              onMouseDown={handleCreateNewAssessmentName}
                              className="p-2.5 text-xs font-bold text-pink-700 bg-pink-50 hover:bg-pink-100 cursor-pointer border-t border-pink-100 flex items-center justify-between"
                            >
                              <span>＋ Create new name "{nameSearch.trim()}"</span>
                              {creatingName && <span className="text-gray-400">...</span>}
                            </li>
                          )}
                        </>
                      ) : (
                        <li className="p-3 text-center bg-gray-50">
                          <p className="text-xs text-gray-500 mb-2 font-medium">"{nameSearch}" not found in database.</p>
                          <button
                            type="button"
                            onMouseDown={handleCreateNewAssessmentName}
                            disabled={creatingName}
                            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors shadow-sm"
                          >
                            {creatingName ? t('loading') : `＋ Create & Select "${nameSearch.trim()}"`}
                          </button>
                        </li>
                      )}
                    </ul>
                  )}
                </div>

                <input type="number" name="totalMarks" value={formData.totalMarks} onChange={handleChange} min="1" max="100" placeholder={t('total')} required className="border p-2.5 rounded w-full bg-white" />
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <select name="semester" value={formData.semester} onChange={handleChange} className="border p-2.5 rounded w-full bg-white">
                  <option value="First Semester">{t('sem_1')}</option>
                  <option value="Second Semester">{t('sem_2')}</option>
                </select>
                <select name="month" value={formData.month} onChange={handleChange} className="border p-2.5 rounded w-full bg-white">
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <input type="text" name="year" value={formData.year} onChange={handleChange} placeholder={t('academic_year')} className="border p-2.5 rounded bg-white" />
              
              <button type="submit" disabled={saving || namesLoading || creatingName} className={`col-span-2 py-2.5 rounded font-bold text-white shadow transition-colors ${saving ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}>
                {saving ? t('loading') : editingId ? t('update') : t('add')}
              </button>
            </div>
          </form>

          {/* 🌟 OVERVIEW LIST: MOST RECENT ACADEMIC YEAR BY SEMESTER 🌟 */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h4 className="font-bold text-gray-800 text-lg">{t('overview')}</h4>
              <span className="text-xs bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full border border-purple-200">
                Most Recent Academic Year: {latestAcademicYear} E.C.
              </span>
            </div>

            {assessmentsLoading ? (
              <p className="text-gray-500 italic">{t('loading')}</p>
            ) : (
              ["First Semester", "Second Semester"].map(semesterName => {
                const semAssessments = assessmentsBySemester[semesterName] || [];
                const semTotalMarks = semAssessments.reduce((sum, a) => sum + Number(a.totalMarks || 0), 0);

                return (
                  <div key={semesterName} className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
                      <h5 className="font-bold text-gray-700 text-sm uppercase flex items-center gap-2">
                        <span>📅</span> {semesterName}
                      </h5>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${semTotalMarks > 100 ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200'}`}>
                        Total: {semTotalMarks} / 100 Marks
                      </span>
                    </div>

                    {semAssessments.length > 0 ? (
                      <ul className="space-y-2">
                        {semAssessments.map(a => (
                          <li key={a._id} className={`flex justify-between items-center bg-white p-3 rounded-lg border-l-4 shadow-sm hover:shadow transition-shadow ${a._id.startsWith('TEMP_') ? 'border-l-red-500' : 'border-l-pink-500'}`}>
                            <Link
                              to="/grade-sheet"
                              state={{
                                assessmentType: a, 
                                subjectName: selectedSubject.name,
                                gradeName: selectedGradeContext.gradeName
                              }}
                              className="flex-1 hover:underline flex flex-col"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-gray-800 font-bold">
                                  {typeof a.name === 'object' ? a.name?.name : a.name}
                                </span>
                                <span className="text-xs font-mono font-bold bg-pink-100 text-pink-800 px-2 py-0.5 rounded">
                                  {a.totalMarks} Marks
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 mt-1">
                                {a.month} | {a.semester} | {a.year} E.C.
                              </span>
                              {a._id.startsWith('TEMP_') && <span className="text-xs text-red-500 font-bold">[Offline - Pending Sync]</span>}
                            </Link>

                            <div className="flex gap-3 ml-4">
                              {!a._id.startsWith('TEMP_') && (
                                  <button onClick={() => handleEdit(a)} className="text-blue-600 hover:text-blue-800 text-sm font-bold">{t('edit')}</button>
                              )}
                              <button onClick={() => handleDelete(a._id)} className="text-red-600 hover:text-red-800 text-sm font-bold">{t('delete')}</button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-400 italic py-2">No assessments created for {semesterName} ({latestAcademicYear} E.C.) yet.</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AssessmentTypesPage;