import React, { useState, useEffect } from 'react';
import analyticsService from '../services/analyticsService';
import subjectService from '../services/subjectService';
import authService from '../services/authService';
import userService from '../services/userService';

const AtRiskStudents = () => {
  const [currentUser] = useState(authService.getCurrentUser());
  const [availableGrades, setAvailableGrades] = useState([]);
  
  const [filters, setFilters] = useState({
    gradeLevel: '',
    semester: 'First Semester',
    academicYear: '2018'
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- 1. Load Config (Same as other pages) ---
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        let subjects = [];
        if (['admin', 'staff'].includes(currentUser.role)) {
          const res = await subjectService.getAllSubjects();
          subjects = res.data.data || res.data; 
        } else {
          const res = await userService.getProfile();
          subjects = res.data.subjectsTaught.map(a => a.subject).filter(Boolean);
        }
        const uniqueGrades = [...new Set(subjects.map(s => s.gradeLevel))].sort();
        setAvailableGrades(uniqueGrades);
        if (uniqueGrades.length > 0) setFilters(prev => ({ ...prev, gradeLevel: uniqueGrades[0] }));
      } catch (err) { console.error(err); }
    };
    loadConfiguration();
  }, [currentUser.role]);

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const fetchReport = async () => {
    if(!filters.gradeLevel) return;
    setLoading(true);
    try {
      const res = await analyticsService.getAtRiskStudents(filters);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6 font-sans print:bg-white print:p-0">
      
      {/* INJECT PRINT CSS */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-red-700">⚠️ At-Risk Students (&lt;60%)</h2>
                <button onClick={() => window.print()} className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold no-print">
                    🖨️ Print List
                </button>
            </div>

            {/* FILTERS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
                <select name="gradeLevel" value={filters.gradeLevel} onChange={handleChange} className="border p-2 rounded">
                    {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select name="semester" value={filters.semester} onChange={handleChange} className="border p-2 rounded">
                    <option value="First Semester">First Semester</option>
                    <option value="Second Semester">Second Semester</option>
                </select>
                <input type="text" name="academicYear" value={filters.academicYear} onChange={handleChange} className="border p-2 rounded"/>
                <button onClick={fetchReport} disabled={loading} className="bg-red-600 text-white font-bold py-2 rounded hover:bg-red-700">
                    {loading ? "Scanning..." : "Find Students"}
                </button>
            </div>
            
            {/* PRINT HEADER */}
            <div className="hidden print:block text-center mb-4">
                <h1 className="text-xl font-bold uppercase">Intervention List - Students Below 60%</h1>
                <p>Grade: {filters.gradeLevel} | {filters.semester} | {filters.academicYear}</p>
            </div>
        </div>

        {/* CONTENT */}
        <div className="p-6">
            {data.length === 0 && !loading && (
                <div className="text-center text-green-600 font-bold p-10 bg-green-50 rounded">
                    🎉 Excellent! No students found below 60% in this grade.
                </div>
            )}

            {data.map((subject) => (
                <div key={subject.subjectName} className="mb-8 break-inside-avoid">
                    <h3 className="text-lg font-bold text-gray-800 border-b-2 border-red-200 mb-2 flex justify-between">
                        <span>{subject.subjectName}</span>
                        <span className="text-sm font-normal text-gray-500">Out of {subject.totalPossible}</span>
                    </h3>
                    
                    <table className="w-full border-collapse border border-gray-300 text-sm overflow-x-auto">
                        <thead className="bg-red-50 text-red-900">
                            <tr>
                                <th className="border p-2 text-left w-10">#</th>
                                <th className="border p-2 text-left">Student Name</th>
                                <th className="border p-2 text-left">ID</th>
                                <th className="border p-2 text-center">Gender</th>
                                <th className="border p-2 text-center">Score</th>
                                <th className="border p-2 text-center">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subject.students.map((student, idx) => (
                                <tr key={student.id} className="hover:bg-red-50">
                                    <td className="border p-2 text-center">{idx + 1}</td>
                                    <td className="border p-2 font-bold">{student.name}</td>
                                    <td className="border p-2 font-mono text-xs">{student.studentId}</td>
                                    <td className="border p-2 text-center">{student.gender}</td>
                                    <td className="border p-2 text-center font-bold text-red-600">{student.score}</td>
                                    <td className="border p-2 text-center font-bold text-red-600 bg-red-100">{student.percentage}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>

      </div>
    </div>
  );
};

export default AtRiskStudents;