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
  
  // የፈተና ስሞች ስቴቶች (State)
  const [assessmentNames, setAssessmentNames] = useState([]);
  const [namesLoading, setNamesLoading] = useState(true);

  // ⚠️ አዲሶቹ የ Autocomplete ፍለጋ መቆጣጠሪያ ስቴቶች
  const [nameSearch, setNameSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const currentEthiopianYear = getEthiopianYear();
  const [formData, setFormData] = useState({
    name: '', // ይህ አሁንም የ AssessmentName ID (ObjectId) ይይዛል
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

  // --- የፈተና ስሞችን (AssessmentNames) መጫን ---
  useEffect(() => {
    const loadNames = async () => {
      try {
        const res = await assessmentNameService.getAllNames();
        setAssessmentNames(res.data.data || res.data || []);
      } catch (err) {
        console.error("Error loading assessment names:", err);
      } finally {
        setNamesLoading(false);
      }
    };
    loadNames();
  }, []);

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

  // --- ⚠️ 2. የፈተና ስሞችን በጻፍነው ፊደል መሠረት መለየት (Memoized Filter) ---
  const filteredNames = useMemo(() => {
    if (!nameSearch) return assessmentNames;
    return assessmentNames.filter(n =>
        n.name.toLowerCase().includes(nameSearch.toLowerCase())
    );
  }, [assessmentNames, nameSearch]);

  // --- Fetch assessments (Online/Cache + Offline Local) ---
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
        } else if (res.data && res.data.error) {
             console.warn("Offline mode: API cache miss.");
        } else {
             console.warn("Invalid response format.");
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

  useEffect(() => {
    fetchAssessments();
  }, [selectedSubject]);

  // --- Form Handlers ---
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ⚠️ 3. ተጠቃሚው መጻፊያ ሳጥኑ ላይ ሲጽፍ መቆጣጠሪያ ሃንድለር
  const handleNameInputChange = (e) => {
    const val = e.target.value;
    setNameSearch(val);
    setShowSuggestions(true);
    // ስሙ ከተቀየረ የድሮውን ID እናጸዳዋለን (አዲስ ምርጫ እንዲሆን)
    setFormData(prev => ({ ...prev, name: '' }));
  };

  // ⚠️ 4. ተጠቃሚው ከፍለጋ ዝርዝሩ ውስጥ ሲመርጥ መቆጣጠሪያ ሃንድለር
  const handleSelectSuggestion = (nameObj) => {
    setNameSearch(nameObj.name);
    setFormData(prev => ({ ...prev, name: nameObj._id }));
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return alert(t('select_class') || 'Select a subject first.');
    if (!formData.name) return alert(t('select_assessment_name_error') || 'Please select an assessment name from the list.');
    
    setSaving(true);
    setError('');

    // ለማረም (Update) የምንጠቀመው ፔይሎድ (subjectId እና gradeLevel አይካተቱም)
    const updatePayload = {
      name: formData.name, // ይህ የ AssessmentName ObjectId ነው
      totalMarks: Number(formData.totalMarks),
      month: formData.month,
      semester: formData.semester,
      year: String(formData.year)
    };

    // ለአዲስ መፍጠሪያ (Create) የምንጠቀመው ፔይሎድ (ሁሉንም ያካትታል)
    const createPayload = { 
      ...updatePayload, 
      subjectId: selectedSubject._id, 
      gradeLevel: selectedSubject.gradeLevel 
    };

    // --- OFFLINE MODE WRITE ---
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
            setFormData({ name: '', totalMarks: 10, month: 'September', semester: 'First Semester', year: currentEthiopianYear });
            setNameSearch(''); // ⚠️ ፍለጋውን ማጽዳት
            setEditingId(null);
        } catch (err) {
            setError("Failed to save offline.");
        }
        setSaving(false);
        return;
    }

    // --- ONLINE MODE WRITE ---
    try {
      if (editingId && !editingId.startsWith('TEMP_')) {
        await assessmentTypeService.update(editingId, updatePayload);
      } else {
        await assessmentTypeService.create(createPayload);
      }
      await fetchAssessments();
      setFormData({ name: '', totalMarks: 10, month: 'September', semester: 'First Semester', year: currentEthiopianYear });
      setNameSearch(''); // ⚠️ ፍለጋውን ማጽዳት
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
    setNameSearch(selectedNameString || ''); // ⚠️ ፎርሙ ላይ ስሙን መጫን
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
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      selectedSubject?._id === sub._id
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    {sub.name}
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
          {/* FORM */}
          <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border mb-6">
            <h3 className="text-xl font-bold mb-3 text-gray-700">
              {editingId ? t('edit') : t('add')} {t('assessment')}
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row gap-3">
                
                {/* ⚠️ 5. አዲሱ Autocomplete የፍለጋ መጻፊያ ፎርም */}
                <div className="relative w-full">
                  <input
                    type="text"
                    name="nameSearch"
                    value={nameSearch}
                    onChange={handleNameInputChange}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // focus ሲጠፋ ፓነሉን ለመዝጋት
                    placeholder={t('search_assessment_name_placeholder') || "Type to search assessment name..."}
                    required
                    autoComplete="off"
                    className="border p-2.5 rounded w-full bg-white text-gray-800 focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                  {/* ለ HTML5 ፎርም ቫሊዴሽን እና ለ submit የሚሆን የተደበቀ ID ፎርም */}
                  <input type="hidden" name="name" value={formData.name} required />

                  {/* የፍለጋ ውጤቶች ዝርዝር ፓነል */}
                  {showSuggestions && (
                    <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {namesLoading ? (
                        <li className="p-3 text-xs text-gray-400 italic">{t('loading')}</li>
                      ) : filteredNames.length > 0 ? (
                        filteredNames.map(n => (
                          <li
                            key={n._id}
                            onMouseDown={() => handleSelectSuggestion(n)} // mouse click ቶሎ እንዲያዝ
                            className="p-2 text-sm text-gray-700 hover:bg-pink-100 hover:text-pink-900 cursor-pointer transition-colors"
                          >
                            {n.name}
                          </li>
                        ))
                      ) : (
                        <li className="p-3 text-xs text-gray-400 italic">
                          {t('no_match_found') || "No matching assessment names found."}
                        </li>
                      )}
                    </ul>
                  )}
                </div>

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
              <input type="text" name="year" value={formData.year} onChange={handleChange} placeholder={t('academic_year')} className="border p-2 rounded" />
              
              <button type="submit" disabled={saving || namesLoading} className={`col-span-2 py-2 rounded font-semibold text-white ${saving ? 'bg-green-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}>
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
                        <span className="text-gray-800 font-bold">
                          {typeof a.name === 'object' ? a.name?.name : a.name} ({a.totalMarks})
                        </span>
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
    </div>
  );
};

export default AssessmentTypesPage;