// src/pages/SubjectPerformance.js

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

  // --- Load Config (Grades) ---
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
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loadingConfig) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Subject Performance Leaderboard</h2>
        <button 
          onClick={() => window.print()}
          className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold"
        >
          🖨️ Print
        </button>
      </div>

      {/* --- Filters --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded border">
        {/* Same filters as before */}
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

      {/* --- Data Table --- */}
      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th rowSpan="2" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-600">Rank</th>
                <th rowSpan="2" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-600">Subject</th>
                <th rowSpan="2" className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider border-r border-gray-600">Avg</th>
                <th rowSpan="2" className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider border-r border-gray-600">Pass Rate</th>
                
                {/* Header for Ranges */}
                <th colSpan="4" className="px-2 py-1 text-center text-xs font-bold uppercase bg-gray-700">Score Distribution (Count)</th>
              </tr>
              <tr className="bg-gray-700">
                <th className="px-2 py-2 text-center text-[10px] uppercase bg-red-800 text-white">&lt; 50%</th>
                <th className="px-2 py-2 text-center text-[10px] uppercase bg-yellow-700 text-white">50 - 75</th>
                <th className="px-2 py-2 text-center text-[10px] uppercase bg-blue-700 text-white">75 - 90</th>
                <th className="px-2 py-2 text-center text-[10px] uppercase bg-green-800 text-white">&gt; 90</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((subject, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-bold border-r">#{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 border-r">{subject.subjectName}</td>
                  
                  {/* Avg Score */}
                  <td className={`px-2 py-3 text-center font-bold border-r ${
                    subject.averageScore < 50 ? 'text-red-600' : 
                    subject.averageScore > 80 ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {subject.averageScore}
                  </td>
                  
                  {/* Pass Rate */}
                  <td className="px-2 py-3 text-center border-r">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                       parseFloat(subject.passRate) < 50 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {subject.passRate}
                    </span>
                  </td>

                  {/* Range Data Cells */}
                  <td className={`px-2 py-3 text-center text-sm border-r ${subject.ranges.below50 > 0 ? 'bg-red-50 text-red-700 font-bold' : 'text-gray-300'}`}>
                    {subject.ranges.below50}
                  </td>
                  <td className={`px-2 py-3 text-center text-sm border-r ${subject.ranges.below75 > 0 ? 'bg-yellow-50 text-yellow-800' : 'text-gray-300'}`}>
                    {subject.ranges.below75}
                  </td>
                  <td className={`px-2 py-3 text-center text-sm border-r ${subject.ranges.below90 > 0 ? 'bg-blue-50 text-blue-800' : 'text-gray-300'}`}>
                    {subject.ranges.below90}
                  </td>
                  <td className={`px-2 py-3 text-center text-sm ${subject.ranges.above90 > 0 ? 'bg-green-50 text-green-800 font-bold' : 'text-gray-300'}`}>
                    {subject.ranges.above90}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <p className="text-center text-gray-500 mt-10">No data available. Click Analyze.</p>
      )}
    </div>
  );
};

export default SubjectPerformance;