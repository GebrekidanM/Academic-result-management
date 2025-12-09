import React, { useState, useEffect, useMemo } from 'react';
import analyticsService from '../services/analyticsService';
import authService from '../services/authService';
import subjectService from '../services/subjectService';
import userService from '../services/userService';

const AllSubjectAnalytics = () => {
  const [currentUser, setCurrentUser] = useState(null);
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

  // --- 1. Load User Profile ---
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // If you store full user details in authService, you can skip this
        // But if you need 'subjectsTaught' populated, fetch profile
        const user = authService.getCurrentUser();
        if(user) {
             const res = await userService.getProfile();
             setCurrentUser(res.data.data || res.data); // Adjust based on your API response structure
        }
      } catch(err) {
          console.error(err);
      }
    };
    fetchUser();
  }, []);

  // --- 2. Load Grades based on User Role ---
  useEffect(() => {
    const fetchGrade = async () => {
      if (!currentUser) return;

      if (currentUser.role === 'teacher') {
        if (currentUser.subjectsTaught?.length > 0) {
          const teacherGrades = currentUser.subjectsTaught.map(s => s.subject?.gradeLevel).filter(g => g);
          const uniqueGrades = [...new Set(teacherGrades)].sort();
          setAvailableGrades(uniqueGrades);
          if (uniqueGrades.length > 0) setFilters(prev => ({ ...prev, gradeLevel: uniqueGrades[0] }));
        }
      } else if (['admin', 'staff', 'principal'].includes(currentUser.role)) {
        try {
          const res = await subjectService.getAllSubjects();
          if (res.data) {
            const subjects = res.data.data || res.data; 
            const allDbGrades = [...new Set(subjects.map(s => s.gradeLevel))].sort();
            setAvailableGrades(allDbGrades);
            if (allDbGrades.length > 0) setFilters(prev => ({ ...prev, gradeLevel: allDbGrades[0] }));
          }
        } catch (err) { console.error(err); }
      }
    }
    fetchGrade();
  }, [currentUser]);

  // --- 3. HELPER: Performance Level ---
  const getPerformanceLevel = (rate) => {
    if (rate >= 90) return { label: 'Excellent', color: 'text-green-800 bg-green-200' };
    if (rate >= 75) return { label: 'Very Good', color: 'text-blue-800 bg-blue-200' };
    if (rate >= 50) return { label: 'Satisfactory', color: 'text-yellow-800 bg-yellow-200' };
    return { label: 'Critical', color: 'text-red-800 bg-red-200' };
  };

  // --- 4. CALCULATE RANKS & BEST PERF ---
  const dataWithRanks = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Calculate pass rates
    const calculated = data.map(row => {
        const total = row.attended.total;
        const failed = row.below50.total;
        const passed = total - failed;
        const passRate = total > 0 ? (passed / total) * 100 : 0;
        return { ...row, passRate };
    });

    // Sort by Pass Rate (Descending)
    calculated.sort((a, b) => b.passRate - a.passRate);

    // Assign Rank
    return calculated.map((row, index) => ({ ...row, rank: index + 1 }));
  }, [data]);

  const bestPerformance = useMemo(() => {
    if (!dataWithRanks.length) return null;
    const top = dataWithRanks[0];
    const level = getPerformanceLevel(top.passRate);
    return {
        name: top.subject,
        passRate: top.passRate.toFixed(1),
        levelLabel: level.label,
        levelColor: level.color
    };
  }, [dataWithRanks]);

  // --- HANDLERS ---
  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    
    if(!filters.gradeLevel) {
        setLoading(false);
        return setError("Please select a Grade Level.");
    }
    if(!filters.assessmentName.trim()) {
        setLoading(false);
        return setError("Please enter an Assessment Name.");
    }

    try {
      const res = await analyticsService.getClassAnalytics(filters);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      setError('Error fetching analytics.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // --- CELL COMPONENT ---
  const TripleCell = ({ stats, totalStudents, bgColor = '' }) => {
    const percentage = totalStudents > 0 ? ((stats.total / totalStudents) * 100).toFixed(1) : 0;
    return (
      <>
        <td className={`border px-2 py-2 text-center text-xs text-gray-500 ${bgColor}`}>{stats.male}</td>
        <td className={`border px-2 py-2 text-center text-xs text-gray-500 ${bgColor}`}>{stats.female}</td>
        <td className={`border px-2 py-2 text-center text-sm font-bold text-gray-800 border-r-2 ${bgColor}`}>{stats.total}</td>
        <td className={`border px-2 py-2 text-center text-xs font-bold text-gray-600 border-r-2 ${bgColor}`}>{percentage}%</td>
      </>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        
        {/* === PRINTABLE AREA WRAPPER === */}
        <div id="printable-area">

            {/* HEADER */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                    Class Performance Matrix {filters.gradeLevel ? `- ${filters.gradeLevel}` : ""}
                </h2>
              </div>
              
              {/* FILTERS (Hidden on Print) */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 no-print">
                <select name="gradeLevel" value={filters.gradeLevel} onChange={handleChange} disabled={availableGrades.length === 0} className="block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                  {availableGrades.length > 0 ? availableGrades.map(g => <option key={g} value={g}>{g}</option>) : <option value="">No Grades</option>}
                </select>
                <input type="text" name="assessmentName" value={filters.assessmentName} onChange={handleChange} placeholder="Exam Name" className="block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                <select name="semester" value={filters.semester} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                  <option value="First Semester">First Semester</option>
                  <option value="Second Semester">Second Semester</option>
                </select>
                <input type="text" name="academicYear" value={filters.academicYear} onChange={handleChange} placeholder="Year" className="block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                
                <button onClick={fetchAnalytics} disabled={loading || !filters.gradeLevel} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">
                  {loading ? '...' : 'Load'}
                </button>
                
                {/* PRINT BUTTON */}
                <button onClick={() => window.print()} disabled={data.length === 0} className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-md">
                  🖨️ Print
                </button>
              </div>

              {error && <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded no-print">{error}</div>}
            </div>

            {/* BEST PERFORMANCE BANNER */}
            {bestPerformance && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 m-6 mb-0 shadow-sm flex items-center">
                <div className="flex-shrink-0 text-3xl">🏆</div>
                <div className="ml-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Rank #1: {bestPerformance.name}</h3>
                    <div className="mt-1 text-sm text-gray-600">Pass Rate: <span className="font-bold">{bestPerformance.passRate}%</span></div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${bestPerformance.levelColor}`}>
                        {bestPerformance.levelLabel}
                    </span>
                </div>
              </div>
            )}

            {/* DATA TABLE */}
            {dataWithRanks.length > 0 ? (
              <div className="overflow-x-auto p-4">
                <table className="min-w-full divide-y divide-gray-200 border-collapse">
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      {/* Rank Column */}
                      <th rowSpan="2" className="sticky left-0 z-20 bg-gray-900 px-2 py-3 text-center text-xs font-bold uppercase border-r border-gray-600 w-16">Rank</th>
                      
                      {/* Subject Column */}
                      <th rowSpan="2" className="sticky left-16 z-10 bg-gray-900 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-600 w-48 shadow-lg">Subject</th>
                      
                      <th colSpan="4" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600">Total</th>
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
                    {dataWithRanks.map((row) => (
                      <tr key={row.subject} className="hover:bg-gray-50 transition-colors">
                        
                        {/* Rank Data */}
                        <td className={`sticky left-0 z-20 px-2 py-3 text-center text-sm font-bold border-r-2 border-gray-200 
                            ${row.rank === 1 ? 'bg-yellow-100 text-yellow-800' : 
                              row.rank === 2 ? 'bg-gray-200 text-gray-800' : 
                              row.rank === 3 ? 'bg-orange-100 text-orange-800' : 'bg-white text-gray-500'}
                        `}>
                            #{row.rank}
                        </td>

                        {/* Subject Data */}
                        <td className="sticky left-16 z-10 bg-white px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r-2 border-gray-200">
                          {row.subject} <span className="ml-2 text-xs text-gray-400 font-normal">({row.totalMarks} pts)</span>
                          {row.rank === 1 && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Best</span>}
                        </td>

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
              !loading && <div className="p-10 text-center text-gray-500 no-print">Select filters and click "Load Report".</div>
            )}
        
        </div>
        {/* === PRINTABLE AREA ENDS === */}

      </div>
    </div>
  );
};

export default AllSubjectAnalytics;