import React, { useState, useEffect } from 'react';
import analyticsService from '../services/analyticsService';
import authService from '../services/authService';
import userService from '../services/userService';
import subjectService from '../services/subjectService';

const SubjectPerformance = () => {
  const [currentUser] = useState(authService.getCurrentUser());
  const [availableGrades, setAvailableGrades] = useState([]);
  
  const [filters, setFilters] = useState({
    gradeLevel: '',
    semester: 'First Semester',
    academicYear: '2018'
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // --- Load Config (With School Level Filtering) ---
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        let uniqueGrades = [];
        // CASE 1: ADMIN, STAFF, PRINCIPAL
        if (currentUser.role === 'admin' || currentUser.role === 'staff') {
          const res = await subjectService.getAllSubjects();
          const allSubjects = res.data.data || res.data;
          
          // Get all unique grades first
          let allGrades = [...new Set(allSubjects.map(s => s.gradeLevel))];
          // --- FILTER BASED ON SCHOOL LEVEL FOR STAFF ---
          if (currentUser.role === 'staff' && currentUser.schoolLevel) {
             const level = currentUser.schoolLevel.toLowerCase();

             if (level === 'kg') {
                 // Keep only KG/Nursery
                 allGrades = allGrades.filter(g => /^Kg/i.test(g));
             } 
             else if (level === 'primary') {
                 // Keep Grade 1-8 (e.g., Grade 1, Grade 8A)
                 allGrades = allGrades.filter(g => /^Grade\s*[1-8](\D|$)/i.test(g));
             } 
             else if (level === 'high school') {
                 // Keep Grade 9-12
                 allGrades = allGrades.filter(g => /^Grade\s*(9|1[0-2])(\D|$)/i.test(g));
             }
             // if level is 'all', keep everything
          }

          uniqueGrades = allGrades.sort();
        } 
        // CASE 2: TEACHER (Based on Subjects)
        else {
          const res = await userService.getProfile();
          // Extract grades from subjects taught
          uniqueGrades = [...new Set(res.data.subjectsTaught.map(a => a.subject?.gradeLevel).filter(Boolean))].sort();
        }

        setAvailableGrades(uniqueGrades);
        
        // Auto-select first grade if available
        if (uniqueGrades.length > 0) {
            setFilters(prev => ({ ...prev, gradeLevel: uniqueGrades[0] }));
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoadingConfig(false);
      }
    };
    loadConfiguration();
  }, [currentUser]);

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const fetchReport = async () => {
    if(!filters.gradeLevel) return;
    setLoading(true);
    try {
      const res = await analyticsService.getSubjectPerformance(filters);
      // Sort data by Average Percentage (Highest to Lowest)
      const sortedData = res.data.data.sort((a, b) => {
         const pctA = a.totalPossibleScore ? (a.averageScore / a.totalPossibleScore) : 0;
         const pctB = b.totalPossibleScore ? (b.averageScore / b.totalPossibleScore) : 0;
         return pctB - pctA;
      });
      setData(sortedData);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // --- HELPER: Renders the 3 sub-columns (M | F | %) ---
  const RangeGroup = ({ bucket, totalStudents, bgClass }) => {
    const pct = totalStudents > 0 ? ((bucket.total / totalStudents) * 100).toFixed(0) : 0;
    const textColor = bucket.total === 0 ? 'text-gray-300' : 'text-gray-800';
    const pctColor = bucket.total === 0 ? 'text-gray-300' : 'text-black font-bold';

    return (
      <>
        <td className={`px-1 py-1 text-center text-[10px] border-r border-gray-400 ${bgClass} ${textColor}`}>
          {bucket.m}
        </td>
        <td className={`px-1 py-1 text-center text-[10px] border-r border-gray-400 ${bgClass} ${textColor}`}>
          {bucket.f}
        </td>
        <td className={`px-1 py-1 text-center text-[10px] border-r-2 border-gray-500 ${bgClass} ${pctColor}`}>
          {pct}%
        </td>
      </>
    );
  };

  if (loadingConfig) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md min-h-screen">
      
      {/* === PRINTABLE WRAPPER (Triggers Landscape CSS) === */}
      <div id="printable-area" className="print-landscape">
          
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-800">
                Subject Performance: {filters.gradeLevel}
            </h2>
            <button 
              onClick={() => window.print()}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold print:hidden"
            >
              🖨️ Print
            </button>
          </div>

          {/* FILTERS (Hidden on Print) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded border print:hidden">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Grade Level</label>
              <select name="gradeLevel" value={filters.gradeLevel} onChange={handleChange} className="w-full p-2 border rounded">
                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Semester</label>
              <select name="semester" value={filters.semester} onChange={handleChange} className="w-full p-2 border rounded">
                <option value="First Semester">First Semester</option>
                <option value="Second Semester">Second Semester</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Year</label>
              <input type="text" name="academicYear" value={filters.academicYear} onChange={handleChange} className="w-full p-2 border rounded"/>
            </div>
            <div className="flex items-end">
              <button onClick={fetchReport} disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-2 rounded hover:bg-indigo-700">
                {loading ? "Analyzing..." : "Analyze Subjects"}
              </button>
            </div>
          </div>

          {/* DATA TABLE */}
          {data.length > 0 ? (
            <div className="overflow-x-auto p-2">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-500">
                <thead className="bg-gray-800 text-white">
                  
                  {/* Row 1: Metrics */}
                  <tr>
                    <th rowSpan="3" className="px-2 py-2 text-center text-xs font-bold uppercase border-r border-gray-500 w-10 bg-gray-900">Rank</th>
                    <th rowSpan="3" className="px-2 py-2 text-left text-xs font-bold uppercase border-r border-gray-500 w-40 bg-gray-900">Subject</th>
                    
                    <th rowSpan="3" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-500">Avg %</th>
                    <th rowSpan="3" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-500">Pass Rate</th>
                    
                    <th colSpan="12" className="px-2 py-1 text-center text-sm font-bold uppercase border-b border-gray-500 bg-gray-700">Score Distribution</th>
                  </tr>

                  {/* Row 2: Ranges */}
                  <tr className="bg-gray-700 text-white text-[10px] uppercase">
                    <th colSpan="3" className="py-1 border-r border-gray-500 bg-red-900">&lt; 50% (Fail)</th>
                    <th colSpan="3" className="py-1 border-r border-gray-500 bg-yellow-700">50 - 75%</th>
                    <th colSpan="3" className="py-1 border-r border-gray-500 bg-blue-800">75 - 90%</th>
                    <th colSpan="3" className="py-1 bg-green-800">&gt; 90% (Top)</th>
                  </tr>

                  {/* Row 3: Sub-columns */}
                  <tr className="bg-gray-200 text-gray-800 text-[9px] font-bold">
                    {[1, 2, 3, 4].map((i) => (
                      <React.Fragment key={i}>
                        <th className="py-1 border-r border-gray-400">M</th>
                        <th className="py-1 border-r border-gray-400">F</th>
                        <th className="py-1 border-r-2 border-gray-500 bg-gray-300">%</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((subject, index) => {
                    // Calc Average Percentage
                    const avgPct = subject.totalPossibleScore > 0 
                        ? ((subject.averageScore / subject.totalPossibleScore) * 100).toFixed(1) 
                        : 0;

                    return (
                      <tr key={index} className="hover:bg-gray-50 border-b border-gray-300">
                        
                        {/* Rank */}
                        <td className="px-2 py-1 text-gray-600 font-bold border-r border-gray-400 text-center text-xs">#{index + 1}</td>
                        
                        {/* Subject */}
                        <td className="px-2 py-1 whitespace-nowrap font-medium text-gray-900 border-r border-gray-400 text-xs">
                          {subject.subjectName}
                          <span className="text-gray-500 text-[10px] ml-1 font-normal">({subject.totalPossibleScore})</span>
                        </td>
                        
                        {/* Avg % */}
                        <td className={`px-1 py-1 text-center font-bold border-r border-gray-400 text-xs ${avgPct < 50 ? 'text-red-600' : 'text-gray-800'}`}>
                          {avgPct}%
                        </td>
                        
                        {/* Pass Rate */}
                        <td className="px-1 py-1 text-center border-r-2 border-gray-500 text-xs">
                          <span className={`px-1 rounded font-bold ${parseFloat(subject.passRate) < 50 ? 'text-red-600' : 'text-green-700'}`}>
                            {subject.passRate}
                          </span>
                        </td>

                        {/* Distribution Columns */}
                        <RangeGroup bucket={subject.ranges.below50} totalStudents={subject.submittedGrades} bgClass="bg-red-50" />
                        <RangeGroup bucket={subject.ranges.below75} totalStudents={subject.submittedGrades} bgClass="bg-yellow-50" />
                        <RangeGroup bucket={subject.ranges.below90} totalStudents={subject.submittedGrades} bgClass="bg-blue-50" />
                        <RangeGroup bucket={subject.ranges.above90} totalStudents={subject.submittedGrades} bgClass="bg-green-50" />

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            !loading && <p className="text-center text-gray-500 mt-10 no-print">No data available. Click Analyze.</p>
          )}
      </div> 
    </div>
  );
};

export default SubjectPerformance;