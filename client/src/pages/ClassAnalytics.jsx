import React, { useState } from 'react';
import analyticsService from '../services/analyticsService';

const ClassAnalytics = () => {
  const [currentUser, setCurrentUser] = useState(null);

  const [filters, setFilters] = useState({
    gradeLevel: 'Grade 4A',
    assessmentName: 'Test 1',
    semester: 'First Semester',
    academicYear: '2018'
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };



  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await analyticsService.getClassAnalytics(filters)
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error fetching analytics.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper component to render the M | F | T triplet cells
  const TripleCell = ({ stats, bgColor = '' }) => (
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
    </>
  );

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
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            >
              {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
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
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
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

        {/* Matrix Table */}
        {data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border-collapse">
              <thead className="bg-gray-800 text-white">
                {/* Top Header Row */}
                <tr>
                  <th rowSpan="2" className="sticky left-0 z-10 bg-gray-900 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-r border-gray-600 w-48 shadow-lg">
                    Subject
                  </th>
                  
                  <th colSpan="3" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600">Total Students</th>
                  <th colSpan="3" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600 bg-gray-700">Attended</th>
                  <th colSpan="3" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600 bg-red-900">Missed</th>
                  
                  {/* Results Ranges */}
                  <th colSpan="3" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600 bg-red-700"> &lt; 50% (Fail)</th>
                  <th colSpan="3" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600 bg-yellow-600"> 50% - 74%</th>
                  <th colSpan="3" className="px-1 py-2 text-center text-xs font-bold uppercase border-r border-gray-600 bg-blue-600"> 75% - 89%</th>
                  <th colSpan="3" className="px-1 py-2 text-center text-xs font-bold uppercase bg-green-700"> &gt; 90% (Top)</th>
                </tr>

                {/* Sub Header Row (M | F | T) */}
                <tr className="bg-gray-100 text-gray-600">
                  {/* Repeated headers for each section */}
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <React.Fragment key={i}>
                      <th className="px-2 py-1 text-center text-[10px] font-bold border border-gray-300">M</th>
                      <th className="px-2 py-1 text-center text-[10px] font-bold border border-gray-300">F</th>
                      <th className="px-2 py-1 text-center text-[10px] font-bold border border-gray-300 border-r-2 border-r-gray-400">T</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    {/* Sticky Subject Column */}
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r-2 border-gray-200 shadow-[4px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      {row.subject} 
                      <span className="ml-2 text-xs text-gray-400 font-normal">({row.totalMarks} pts)</span>
                    </td>

                    {/* Data Cells */}
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
          !loading && (
            <div className="p-10 text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg">No analysis data loaded.</p>
              <p className="text-sm">Select filters above and click "Load Report".</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ClassAnalytics;