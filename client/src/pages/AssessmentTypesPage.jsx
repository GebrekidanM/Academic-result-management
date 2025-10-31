import React, { useState, useEffect, useMemo } from 'react';
import subjectService from '../services/subjectService';
import assessmentTypeService from '../services/assessmentTypeService';
import authService from '../services/authService';
import userService from '../services/userService';
import { Link } from 'react-router-dom';

const MONTHS = [
  "September", "October", "November", "December",
  "January", "February", "March", "April", "May", "June"
];

const AssessmentTypesPage = () => {
  const [currentUser] = useState(authService.getCurrentUser());
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [assessmentTypes, setAssessmentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    totalMarks: 10,
    month: 'September',
    semester: 'First Semester',
    year: new Date().getFullYear(),
  });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // --- Load subjects for user ---
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
          subjectsList = res.data.subjectsTaught.map(s => s.subject).filter(Boolean);
        }
        setSubjects(subjectsList);
      } catch {
        setError('Failed to load subjects.');
      } finally {
        setLoading(false);
      }
    };
    loadSubjects();
  }, [currentUser.role]);

  // --- Group subjects by grade ---
  const subjectsByGrade = useMemo(() => {
    const grouped = {};
    subjects.forEach(sub => {
      const grade = sub.gradeLevel || 'Uncategorized';
      if (!grouped[grade]) grouped[grade] = [];
      grouped[grade].push(sub);
    });
    return grouped;
  }, [subjects]);

  // --- Fetch assessments for selected subject ---
  const fetchAssessments = async () => {
    if (!selectedSubject) return;
    setAssessmentsLoading(true);
    setError('');
    try {
      const res = await assessmentTypeService.getBySubject(selectedSubject._id);
      const sorted = res.data.data.sort(
        (a, b) => MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month)
      );
      setAssessmentTypes(sorted);
    } catch {
      setError('Failed to load assessment types.');
    } finally {
      setAssessmentsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, [selectedSubject]);

  // --- Form handlers ---
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return alert('Select a subject first.');
    setSaving(true);

    try {
      const payload = { ...formData, subjectId: selectedSubject._id, gradeLevel: selectedSubject.gradeLevel };
      if (editingId) {
        await assessmentTypeService.update(editingId, payload);
      } else {
        await assessmentTypeService.create(payload);
      }
      await fetchAssessments();
      setFormData({ name: '', totalMarks: 10, month: 'September', semester: 'First Semester', year: new Date().getFullYear() });
      setEditingId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save assessment type.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (assessment) => {
    setEditingId(assessment._id);
    setFormData({
      name: assessment.name,
      totalMarks: assessment.totalMarks,
      month: assessment.month,
      semester: assessment.semester,
      year: assessment.year,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' }); // scroll to form
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assessment type?')) return;
    try {
      await assessmentTypeService.remove(id);
      setAssessmentTypes(assessmentTypes.filter(at => at._id !== id));
    } catch {
      setError('Failed to delete. This type might be used in an existing grade record.');
    }
  };

  if (loading) return <p className="text-center mt-8">Loading subjects...</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Manage Assessment Types</h2>
      <p className="text-gray-600 mb-6">
        Select a subject below to view and manage its grading structure.
      </p>

      {error && !selectedSubject && <p className="text-red-500 mb-4">{error}</p>}

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
          <p>No subjects assigned yet.</p>
        )}
      </div>

      {selectedSubject && (
        <>
          {/* ADD / EDIT FORM */}
          <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg border mb-6">
            <h3 className="text-xl font-bold mb-3 text-gray-700">
              {editingId ? 'Edit Assessment Type' : 'Add New Assessment Type'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Assessment Name"
                required
                className="border p-2 rounded"
              />
              <input
                type="number"
                name="totalMarks"
                value={formData.totalMarks}
                onChange={handleChange}
                min="1"
                placeholder="Total Marks"
                required
                className="border p-2 rounded"
              />
              <select name="semester" value={formData.semester} onChange={handleChange} className="border p-2 rounded">
                <option>First Semester</option>
                <option>Second Semester</option>
              </select>
              <select name="month" value={formData.month} onChange={handleChange} className="border p-2 rounded">
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="Year"
                className="border p-2 rounded"
              />
              <button
                type="submit"
                disabled={saving}
                className={`col-span-2 py-2 rounded font-semibold text-white ${
                  saving ? 'bg-green-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {saving ? 'Saving...' : editingId ? 'Update Assessment' : 'Add Assessment'}
              </button>
            </div>
          </form>

          {/* EXISTING ASSESSMENTS */}
          <div>
            <h4 className="font-bold mb-3 text-gray-700">Existing Types</h4>
            {assessmentsLoading ? <p>Loading...</p> : (
              assessmentTypes.length > 0 ? (
                <ul className="space-y-2">
                  {assessmentTypes.map(a => (
                    <li key={a._id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <Link
                        to="/grade-sheet"
                        state={{ assessmentType: a, subject: selectedSubject }}
                        className="flex-1 hover:underline"
                      >
                        <strong>{a.month}:</strong> {a.name} ({a.totalMarks} Marks)
                      </Link>
                      <div className="flex gap-3 ml-4">
                        <button onClick={() => handleEdit(a)} className="text-blue-500 hover:text-blue-700 text-sm font-bold">Edit</button>
                        <button onClick={() => handleDelete(a._id)} className="text-red-500 hover:text-red-700 text-sm font-bold">Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-gray-500">No assessment types created for this subject yet.</p>
            )}
          </div>
        </>
      )}

      {error && selectedSubject && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default AssessmentTypesPage;
