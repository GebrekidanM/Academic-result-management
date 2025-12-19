import React, { useState, useEffect, useMemo } from 'react';
import subjectService from '../services/subjectService';
import assessmentTypeService from '../services/assessmentTypeService';
import offlineAssessmentService from '../services/offlineAssessmentService';
import authService from '../services/authService';
import userService from '../services/userService';
import { Link, useLocation } from 'react-router-dom';

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
        // TRY-CATCH here allows caching to work for subjects list too
        if (currentUser.role === 'admin') {
          const res = await subjectService.getAllSubjects();
          subjectsList = res.data.data;
        } else if (currentUser.role === 'teacher') {
          const res = await userService.getProfile();
          subjectsList = res.data.subjectsTaught.map(s => s.subject).filter(Boolean);
        }
        setSubjects(subjectsList);
      } catch {
        setError('Failed to load subjects. Ensure you visited this page online once.');
      } finally {
        setLoading(false);
      }
    };
    loadSubjects();
  }, [currentUser.role]);

  const subjectsByGrade = useMemo(() => {
    const grouped = {};
    subjects.forEach(sub => {
      const grade = sub.gradeLevel || 'Uncategorized';
      if (!grouped[grade]) grouped[grade] = [];
      grouped[grade].push(sub);
    });
    return grouped;
  }, [subjects]);

  // --- UPDATED: Fetch assessments (Cache + Offline Local) ---
  const fetchAssessments = async () => {
    if (!selectedSubject) return;
    setAssessmentsLoading(true);
    setError('');
    
    let onlineData = [];
    let offlineData = [];

    // 1. FETCH FROM API (Service Worker handles caching if offline)
    // We removed 'if (navigator.onLine)' so the SW can return cached data
    try {
        const res = await assessmentTypeService.getBySubject(selectedSubject._id);
        
        // Validation: Ensure we actually got data (not an offline error object)
        if (res.data && Array.isArray(res.data.data)) {
            onlineData = res.data.data;
        } else {
            console.warn("No cached assessments found or invalid response.");
        }
    } catch (err) {
        // If Axios fails completely (no cache available), just ignore and show offline items
        console.log("Using only offline items (No cache available).");
    }

    // 2. Fetch Locally Created Items (Pending Sync)
    const allLocal = offlineAssessmentService.getLocalAssessments();
    offlineData = allLocal.filter(a => a.subject === selectedSubject._id);

    // 3. Merge & Sort
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return alert('Select a subject first.');
    
    setSaving(true);
    setError('');

    const payload = { ...formData, subjectId: selectedSubject._id, gradeLevel: selectedSubject.gradeLevel };

    // --- OFFLINE MODE WRITE ---
    // Use navigator.onLine here because we CANNOT write to the server offline
    if (!navigator.onLine) {
        if (editingId) {
            alert("Cannot edit online assessments while offline.");
            setSaving(false);
            return;
        }
        try {
            offlineAssessmentService.addLocalAssessment({
                ...payload,
                subject: selectedSubject._id 
            });
            alert("📴 Offline: Assessment created locally! Use Sync when online.");
            await fetchAssessments(); 
            setFormData({ name: '', totalMarks: 10, month: 'September', semester: 'First Semester', year: currentEthiopianYear });
        } catch (err) {
            setError("Failed to save offline.");
        }
        setSaving(false);
        return;
    }

    // --- ONLINE MODE WRITE ---
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
        if(window.confirm("Delete this offline item and create new one?")) {
            offlineAssessmentService.removeLocalAssessment(assessment._id);
            fetchAssessments();
        }
        return;
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
    if (!window.confirm('Delete this assessment type?')) return;
    
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

  if (loading) return <p className="text-center mt-8">Loading subjects...</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Manage Assessment Types</h2>
      
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
          <p>No subjects assigned yet. (Connect online once to load)</p>
        )}
      </div>

      {selectedSubject && (
        <>
          {/* FORM */}
          <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border mb-6">
            <h3 className="text-xl font-bold mb-3 text-gray-700">
              {editingId ? 'Edit Assessment Type' : 'Add New Assessment Type'}
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row gap-3">
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Assessment Name" required className="border p-2 rounded w-full" />
                <input type="number" name="totalMarks" value={formData.totalMarks} onChange={handleChange} min="1" placeholder="Total Marks" required className="border p-2 rounded w-full" />
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <select name="semester" value={formData.semester} onChange={handleChange} className="border p-2 rounded w-full">
                  <option>First Semester</option>
                  <option>Second Semester</option>
                </select>
                <select name="month" value={formData.month} onChange={handleChange} className="border p-2 rounded w-full">
                  {MONTHS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <input type="number" name="year" value={formData.year} onChange={handleChange} placeholder="Year" className="border p-2 rounded" />
              
              <button type="submit" disabled={saving} className={`col-span-2 py-2 rounded font-semibold text-white ${saving ? 'bg-green-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add Assessment'}
              </button>
            </div>
          </form>

          {/* LIST */}
          <div>
            <h4 className="font-bold mb-3 text-gray-700">Existing Types</h4>
            {assessmentsLoading ? <p>Loading...</p> : (
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
                            <button onClick={() => handleEdit(a)} className="text-blue-500 hover:text-blue-700 text-sm font-bold">Edit</button>
                        )}
                        <button onClick={() => handleDelete(a._id)} className="text-red-500 hover:text-red-700 text-sm font-bold">Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-gray-500">No assessments found. (If offline, ensure you loaded this page once while online)</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AssessmentTypesPage;