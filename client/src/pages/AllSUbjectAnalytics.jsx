import React, { useState, useEffect, useMemo } from 'react';
import analyticsService from '../services/analyticsService';
import authService from '../services/authService';
import subjectService from '../services/subjectService';

const AllSubjectAnalytics = () => {
  const [currentUser] = useState(authService.getCurrentUser());
  const [availableGrades, setAvailableGrades] = useState([]);
  
  const [filters, setFilters] = useState({
    gradeLevel: '',
    assessmentName: '',
    semester: 'First Semester',
    academicYear: '2018'
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- EFFECT 1: Determine Available Grades ---
  useEffect(() => {
    const fetchGrades = async () => {
      if (!currentUser) return;

      if (currentUser.role === 'teacher') {
        if (currentUser.subjectsTaught && currentUser.subjectsTaught.length > 0) {
          const teacherGrades = currentUser.subjectsTaught
            .map(s => s.subject?.gradeLevel)
            .filter(g => g);

          const uniqueGrades = [...new Set(teacherGrades)].sort();
          setAvailableGrades(uniqueGrades);
          
          if (uniqueGrades.length > 0) {
            setFilters(prev => ({ ...prev, gradeLevel: uniqueGrades[0] }));
          }
        }
      } 
      else if (['admin', 'staff', 'principal'].includes(currentUser.role)) {
        try {
          const res = await subjectService.getAllSubjects();
          if (res.data) {
            const subjects = res.data.data || res.data; 
            const allDbGrades = [...new Set(subjects.map(s => s.gradeLevel))].sort();
            setAvailableGrades(allDbGrades);
            if (allDbGrades.length > 0) {
              setFilters(prev => ({ ...prev, gradeLevel: allDbGrades[0] }));
            }
          }
        } catch (err) {
          console.error("Could not fetch grade levels:", err);
          setError("Failed to load grade levels.");
        }
      }
    };
    fetchGrades();
  }, [currentUser]);

  // --- HELPER: Determine Qualitative Level ---
  const getPerformanceLevel = (rate) => {
    if (rate >= 90) return { label: 'Excellent', color: 'text-green-800 bg-green-200' };
    if (rate >= 75) return { label: 'Very Good', color: 'text-blue-800 bg-blue-200' };
    if (rate >= 50) return { label: 'Satisfactory', color: 'text-yellow-800 bg-yellow-200' };
    return { label: 'Critical', color: 'text-red-800 bg-red-200' };
  };

  // --- CALCULATE BEST PERFORMANCE ---
  const bestPerformance = useMemo(() => {
    if (!data || data.length === 0) return null;

    let topSubject = null;
    let maxPassRate = -1;

    data.forEach(item => {
      const totalAttended = item.attended.total;
      
      if (totalAttended === 0) return;

      // Pass = Total Attended - Failed (<50%)
      const failedCount = item.below50.total;
      const passedCount = totalAttended - failedCount;
      
      const passRate = (passedCount / totalAttended) * 100;

      if (passRate > maxPassRate) {
        maxPassRate = passRate;
        
        // Get the qualitative level
        const levelData = getPerformanceLevel(passRate);

        topSubject = {
          name: item.subject,
          passRate: passRate.toFixed(1),
          totalStudents: totalAttended,
          levelLabel: levelData.label,
          levelColor: levelData.color
        };
      }
    });

    return topSubject;
  }, [data]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    
    if(!filters.gradeLevel) {
        setError("Please select a Grade Level.");
        return;
    }
    if(!filters.assessmentName.trim()) {
        setError("Please enter an Assessment Name.");
        return;
    }

    try {
      const res = await analyticsService.getClassAnalytics(filters);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error fetching analytics.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // --- UPDATED CELL COMPONENT (Fixes Math Logic) ---
  const TripleCell = ({ stats, totalStudents, bgColor = '' }) => {
    // Calculate percentage based on the class total, not the cell total
    const percentage = totalStudents > 0 ? ((stats.total / totalStudents) * 100).toFixed(1) : 0;

    return (
      <>
        <td className={`border px-2 py-2 text-center text-xs text-gray-500 ${bgColor}`}>
          {stats.male}
        </td>
        <td className={`border px-2 py-2 text-center text-xs text-gray-500 ${bgColor}`}>
          {stats.female}
        </td>
        <td className={`border px-2 py-2 text-center text-sm font-bold text-gray-800 border-r-2 ${bgColor}`}>
          {stats.total}
        </td>
        <td className={`border px-2 py-2 text-center text-xs font-bold text-gray-600 border-r-2 ${bgColor}`}>
          {percentage}%
        </td>
      </>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        
        {/* Header & Filters */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Class Performance Matrix</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              name="gradeLevel"
              value={filters.gradeLevel}
              onChange={handleChange}
              disabled={availableGrades.length === 0}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            >
              {availableGrades.length > 0 ? (
                availableGrades.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))
              ) : (
                <option value="">{loading ? "Loading..." : "No Grades Found"}</option>
              )}
            </select>

            <input
              type="text"
              name="assessmentName"
              value={filters.assessmentName}
              onChange={handleChange}
              placeholder="Exam Name (e.g. Test 1)"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            />

            <select
              name="semester"
              value={filters.semester}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            >
              <option value="First Semester">First Semester</option>
              <option value="Second Semester">Second Semester</option>
            </select>

            <input
              type="text"
              name="academicYear"
              value={filters.academicYear}
              onChange={handleChange}
              placeholder="Year (e.g. 2018)"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            />

            <button
              onClick={fetchAnalytics}
              disabled={loading || !filters.gradeLevel}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${(loading || !filters.gradeLevel) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {loading ? 'Analyzing...' : 'Load Report'}
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">
              {error}
            </div>
          )}
        </div>

        {/* --- BEST PERFORMANCE HIGHLIGHT --- */}
        {bestPerformance && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 m-6 mb-0 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Top Performance: {bestPerformance.name}
                </h3>
                <div className="mt-1 text-sm text-gray-600">
                  Achieved a <span className="font-bold text-gray-900">{bestPerformance.passRate}%</span> Pass Rate.
                </div>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bestPerformance.levelColor}`}>
                    Level: {bestPerformance.levelLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Matrix Table */}
        {data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border-collapse">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th rowSpan="2" className="sticky left-0 z-10 bg-gray-900 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-600 w-48 shadow-lg">
                    Subject
                  </th>
                  <th colSpan="4" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600">Total Students</th>
                  <th colSpan="4" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600 bg-gray-700">Attended</th>
                  <th colSpan="4" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600 bg-red-900">Missed</th>
                  <th colSpan="4" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600 bg-red-700"> &lt; 50% (Fail)</th>
                  <th colSpan="4" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600 bg-yellow-600"> 50% - 74%</th>
                  <th colSpan="4" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600 bg-blue-600"> 75% - 89%</th>
                  <th colSpan="4" className="px-1 py-2 text-center text-xs font-bold uppercase bg-green-700"> &gt; 90% (Top)</th>
                </tr>
                <tr className="bg-gray-100 text-gray-600">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <React.Fragment key={i}>
                      <th className="px-2 py-1 text-center text-[10px] font-bold border border-gray-300">M</th>
                      <th className="px-2 py-1 text-center text-[10px] font-bold border border-gray-300">F</th>
                      <th className="px-2 py-1 text-center text-[10px] font-bold border border-gray-300 border-r-2 border-r-gray-400">T</th>
                      <th className="px-2 py-1 text-center text-[10px] font-bold border border-gray-300">%</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r-2 border-gray-200 shadow-[4px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      <div className="flex items-center">
                        <div>
                            {row.subject}
                            <span className="block text-xs text-gray-400 font-normal">({row.totalMarks} pts)</span>
                        </div>
                        {bestPerformance && bestPerformance.name === row.subject && (
                           <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold border border-green-200">
                             ★ Best
                           </span>
                        )}
                      </div>
                    </td>
                    
                    {/* Pass totalStudents to TripleCell to calculate % correctly */}
                    <TripleCell stats={row.students} totalStudents={row.students.total} />
                    <TripleCell stats={row.attended} totalStudents={row.students.total} bgColor="bg-gray-50" />
                    <TripleCell stats={row.missed} totalStudents={row.students.total} bgColor="bg-red-50 text-red-600" />
                    
                    <TripleCell stats={row.below50} totalStudents={row.attended.total} bgColor="bg-red-100" />
                    <TripleCell stats={row.below75} totalStudents={row.attended.total} bgColor="bg-yellow-50" />
                    <TripleCell stats={row.below90} totalStudents={row.attended.total} bgColor="bg-blue-50" />
                    <TripleCell stats={row.above90} totalStudents={row.attended.total} bgColor="bg-green-50" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !loading && (
            <div className="p-10 text-center text-gray-500">
               <p className="text-lg">No analysis data loaded.</p>
               <p className="text-sm">Select filters above and click "Load Report".</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AllSubjectAnalytics;