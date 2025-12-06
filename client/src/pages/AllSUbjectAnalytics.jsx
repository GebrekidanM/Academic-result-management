import React, { useState, useEffect } from 'react';
import analyticsService from '../services/analyticsService';
import authService from '../services/authService';
import subjectService from '../services/subjectService';
import userService from '../services/userService';
import { Link } from 'react-router-dom';
import './AllSubjectAnalytics.css'

const AllSubjectAnalytics = () => {
  const [currentUser] = useState(authService.getCurrentUser());
  
  // State for dynamic dropdowns
  const [availableGrades, setAvailableGrades] = useState([]);
  
  const [filters, setFilters] = useState({
    gradeLevel: '',
    assessmentName: 'Test 1',
    semester: 'First Semester',
    academicYear: '2018'
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState('');

  // --- 1. Load Grades based on Role (Matches your existing pattern) ---
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        let subjects = [];
        
        // ADMIN / STAFF: Get ALL Subjects
        if (['admin', 'staff', 'principal'].includes(currentUser.role)) {
          const res = await subjectService.getAllSubjects(); // Assuming this returns { data: [...] }
          subjects = res.data.data || res.data; 
        } 
        // TEACHER: Get Profile -> Subjects Taught
        else {
          const res = await userService.getProfile();
          // Extract subject objects from the teacher's profile
          subjects = res.data.subjectsTaught.map(a => a.subject).filter(Boolean);
        }

        // Extract Unique Grade Levels from the subjects list
        const uniqueGrades = [...new Set(subjects.map(s => s.gradeLevel))].sort();
        setAvailableGrades(uniqueGrades);

        // Auto-select first grade if available
        if (uniqueGrades.length > 0) {
          setFilters(prev => ({ ...prev, gradeLevel: uniqueGrades[0] }));
        }

      } catch (err) {
        console.error(err);
        setError('Failed to load grade configuration.');
      } finally {
        setLoadingConfig(false);
      }
    };

    loadConfiguration();
  }, [currentUser.role]);


  // --- 2. Handle Input Changes ---
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };


  // --- 3. Fetch Matrix Data ---
  const fetchAnalytics = async () => {
    if (!filters.gradeLevel) return;
    
    setLoading(true);
    setError('');
    setData([]);

    try {
      const res = await analyticsService.getClassAnalytics(filters);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error fetching analytics.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for Table Cells
  const TripleCell = ({ stats, bgColor = '' }) => (
    <>
      <td className={`border px-1 py-2 text-center text-xs text-gray-500 ${bgColor}`}>{stats.male}</td>
      <td className={`border px-1 py-2 text-center text-xs text-gray-500 ${bgColor}`}>{stats.female}</td>
      <td className={`border px-1 py-2 text-center text-sm font-bold text-gray-800 border-r-2 ${bgColor}`}>{stats.total}</td>
    </>
  );

  if (loadingConfig) return <div className="p-10 text-center">Loading permissions...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md min-h-screen">
      
      {/* Navigation Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">All Subjects Matrix</h2>
        <Link to="/analytics" className="text-pink-600 hover:text-pink-800 underline text-sm">
          &larr; Back to Single Subject Analysis
        </Link>
      </div>

      {/* --- Filter Controls --- */}
      <div className="flex-col mb-4">
        {/* Dynamic Grade Selector */}
        <div className='p-4 bg-gray-50 rounded-lg border grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-6'>
            <div>
            <label className="font-bold block mb-1 text-xs uppercase text-gray-500">Grade Level</label>
            <select
                name="gradeLevel"
                value={filters.gradeLevel}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
            >
                {availableGrades.length > 0 ? (
                availableGrades.map(g => <option key={g} value={g}>{g}</option>)
                ) : (
                <option value="">No Grades Found</option>
                )}
            </select>
            </div>

            <div>
            <label className="font-bold block mb-1 text-xs uppercase text-gray-500">Assessment Name</label>
            <input
                type="text"
                name="assessmentName"
                value={filters.assessmentName}
                onChange={handleChange}
                placeholder="e.g. Test 1"
                className="w-full p-2 border rounded-md"
            />
            </div>

            <div>
            <label className="font-bold block mb-1 text-xs uppercase text-gray-500">Semester</label>
            <select name="semester" value={filters.semester} onChange={handleChange} className="w-full p-2 border rounded-md">
                <option value="First Semester">First Semester</option>
                <option value="Second Semester">Second Semester</option>
            </select>
            </div>

            <div>
            <label className="font-bold block mb-1 text-xs uppercase text-gray-500">Year</label>
            <input
                type="text"
                name="academicYear"
                value={filters.academicYear}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
            />
            </div>
        </div>
        <div className='flex gap-6'>
            <button
                onClick={fetchAnalytics}
                disabled={loading || !filters.gradeLevel}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-md disabled:bg-pink-300"
                >
                {loading ? 'Loading...' : 'Load Matrix'}
            </button>
            <button
                onClick={() => window.print()}
                disabled={data.length === 0}
                className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-md disabled:bg-gray-400"
                >
                🖨️ Print Report
            </button>
        </div>
        
      </div>

      {error && (
        <div className="mb-4 text-red-500 text-center p-3 bg-red-50 rounded border border-red-200">{error}</div>
      )}

      {/* --- Matrix Table --- */}
      {data.length > 0 ? (
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 border-collapse">
            <thead className="bg-gray-800 text-white">
              {/* Top Header */}
              <tr>
                <th rowSpan="2" className="sticky left-0 z-10 bg-gray-900 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-600 w-48 shadow-lg">Subject</th>
                <th colSpan="3" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600">Total</th>
                <th colSpan="3" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600 bg-gray-700">Attended</th>
                <th colSpan="3" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600 bg-red-900">Missed</th>
                <th colSpan="3" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600 bg-red-700">&lt; 50%</th>
                <th colSpan="3" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600 bg-yellow-600">50-75%</th>
                <th colSpan="3" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600 bg-blue-600">75-90%</th>
                <th colSpan="3" className="px-1 py-2 text-center text-xs font-bold uppercase bg-green-700">&gt; 90%</th>
              </tr>
              {/* M/F/T Sub Header */}
              <tr className="bg-gray-100 text-gray-600">
                {[1,2,3,4,5,6,7].map(i => (
                  <React.Fragment key={i}>
                    <th className="px-1 py-1 text-center text-[10px] border border-gray-300">M</th>
                    <th className="px-1 py-1 text-center text-[10px] border border-gray-300">F</th>
                    <th className="px-1 py-1 text-center text-[10px] border border-r-2 border-r-gray-400 font-bold text-black">T</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm font-medium text-gray-900 border-r-2 border-gray-200 shadow-sm">
                    {row.subject} <span className="text-xs text-gray-400">({row.totalMarks})</span>
                  </td>
                  <TripleCell stats={row.students} />
                  <TripleCell stats={row.attended} bgColor="bg-gray-50" />
                  <TripleCell stats={row.missed} bgColor="bg-red-50 text-red-600" />
                  <TripleCell stats={row.below50} bgColor="bg-red-100" />
                  <TripleCell stats={row.below75} bgColor="bg-yellow-50" />
                  <TripleCell stats={row.below90} bgColor="bg-blue-50" />
                  <TripleCell stats={row.above90} bgColor="bg-green-50" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <div className="text-center text-gray-500 mt-10">No data found for this selection.</div>
      )}
    </div>
  );
};

export default AllSubjectAnalytics;