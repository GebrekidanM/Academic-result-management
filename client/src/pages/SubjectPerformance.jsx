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

  // --- Load Config ---
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        let subjects = [];
        if (['admin', 'staff', 'principal'].includes(currentUser.role)) {
          const res = await subjectService.getAllSubjects();
          subjects = res.data.data || res.data; 
        } else {
          const res = await userService.getProfile();
          subjects = res.data.subjectsTaught.map(a => a.subject).filter(Boolean);
        }
        const uniqueGrades = [...new Set(subjects.map(s => s.gradeLevel))].sort();
        setAvailableGrades(uniqueGrades);
        if (uniqueGrades.length > 0) setFilters(prev => ({ ...prev, gradeLevel: uniqueGrades[0] }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingConfig(false);
      }
    };
    loadConfiguration();
  }, [currentUser.role]);

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const fetchReport = async () => {
    if(!filters.gradeLevel) return;
    setLoading(true);
    try {
      const res = await analyticsService.getSubjectPerformance(filters);
      // OPTIONAL: Sort data by Average Percentage on the frontend for better ranking visualization
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

  // --- HELPER: Renders the 3 columns (M, F, %) for a specific range ---
  const RangeGroup = ({ bucket, totalStudents, bgClass }) => {
    const pct = totalStudents > 0 ? ((bucket.total / totalStudents) * 100).toFixed(0) : 0;
    const textColor = bucket.total === 0 ? 'text-gray-500' : 'text-gray-800';
    const pctColor = bucket.total === 0 ? 'text-gray-500' : 'text-black font-bold';

    return (
      <>
        <td className={`px-1 py-2 text-center text-[10px] border-r border-gray-300 ${bgClass} ${textColor}`}>
          {bucket.m}
        </td>
        <td className={`px-1 py-2 text-center text-[10px] border-r border-gray-300 ${bgClass} ${textColor}`}>
          {bucket.f}
        </td>
        <td className={`px-1 py-2 text-center text-[10px] border-r-2 border-gray-400 ${bgClass} ${pctColor}`}>
          {pct}%
        </td>
      </>
    );
  };

  if (loadingConfig) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md min-h-screen">
      
      {/* === PRINTABLE AREA === */}
      <div id="printable-area" className="print-landscape print-container">
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Subject Performance: {filters.gradeLevel}</h2>
            <button 
              onClick={() => window.print()}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold no-print"
            >
              🖨️ Print
            </button>
          </div>

          {/* FILTERS (Hidden on Print) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded border no-print">
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-400">
                <thead className="bg-gray-800 text-white">
                  
                  {/* Row 1: Main Headers */}
                  <tr>
                    <th rowSpan="3" className="px-2 py-2 text-center text-xs font-bold uppercase border-r border-gray-600 w-10">Rank</th>
                    <th rowSpan="3" className="px-2 py-2 text-left text-xs font-bold uppercase border-r border-gray-600 w-40">Subject</th>
                    
                    {/* CHANGED HEADER TO 'Avg %' */}
                    <th rowSpan="3" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600">Avg %</th>
                    
                    <th rowSpan="3" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600">Pass Rate</th>
                    <th colSpan="12" className="px-2 py-1 text-center text-sm font-bold uppercase border-b border-gray-500 bg-gray-700">Score Distribution</th>
                  </tr>

                  {/* Row 2: Range Headers */}
                  <tr className="bg-gray-700 text-white text-[10px] uppercase">
                    <th colSpan="3" className="py-1 border-r border-gray-500 bg-red-900">&lt; 50% (Fail)</th>
                    <th colSpan="3" className="py-1 border-r border-gray-500 bg-yellow-700">50 - 75%</th>
                    <th colSpan="3" className="py-1 border-r border-gray-500 bg-blue-800">75 - 90%</th>
                    <th colSpan="3" className="py-1 bg-green-800">&gt; 90% (Top)</th>
                  </tr>

                  {/* Row 3: M/F/% Sub-headers */}
                  <tr className="bg-gray-200 text-gray-800 text-[9px] font-bold">
                    {[1, 2, 3, 4].map((i) => (
                      <React.Fragment key={i}>
                        <th className="py-1 border-r border-gray-300">M</th>
                        <th className="py-1 border-r border-gray-300">F</th>
                        <th className="py-1 border-r-2 border-gray-400 bg-gray-300">%</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((subject, index) => {
                    
                    // --- CALCULATE AVERAGE PERCENTAGE ---
                    const avgPct = subject.totalPossibleScore > 0 
                        ? ((subject.averageScore / subject.totalPossibleScore) * 100).toFixed(1) 
                        : 0;

                    return (
                        <tr key={index} className="hover:bg-gray-50 border-b border-gray-300">
                        
                        {/* Rank */}
                        <td className="px-2 py-1 text-gray-500 font-bold border-r border-gray-300 text-center text-xs">#{index + 1}</td>
                        
                        {/* Subject Name (Total) */}
                        <td className="px-2 py-1 whitespace-nowrap font-medium text-gray-900 border-r border-gray-300 text-xs">
                            {subject.subjectName}
                            <span className="text-gray-500 text-[10px] ml-1 font-normal">({subject.totalPossibleScore})</span>
                        </td>
                        
                        {/* --- UPDATED: AVERAGE PERCENTAGE --- */}
                        <td className={`px-1 py-1 text-center font-bold border-r border-gray-300 text-xs ${avgPct < 50 ? 'text-red-600' : 'text-gray-800'}`}>
                            {avgPct}%
                        </td>
                        
                        {/* Pass Rate */}
                        <td className="px-1 py-1 text-center border-r-2 border-gray-400 text-xs">
                            <span className={`px-1 rounded font-bold ${parseFloat(subject.passRate) < 50 ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'}`}>
                            {subject.passRate}
                            </span>
                        </td>

                        {/* --- DISTRIBUTION GROUPS --- */}
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