import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // <--- Import Hook
import analyticsService from '../services/analyticsService';
import subjectService from '../services/subjectService';
import authService from '../services/authService';
import userService from '../services/userService';
import ClassStreamSelector from '../components/ClassStreamSelector';

const AtRiskStudents = () => {
  const { t } = useTranslation(); // <--- Initialize Hook
  const [currentUser] = useState(authService.getCurrentUser());
  const [availableGrades, setAvailableGrades] = useState([]);
  
  const [filters, setFilters] = useState({
    classId: '',
    streamId: 'all',
    semester: 'First Semester',
    academicYear: '2026'
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- 1. Load Config (With School Level Filtering) ---
    // No manual fetching of unique grades

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const fetchReport = async () => {
    if(!filters.classId) return;
    setLoading(true);
    setError('');
    try {
      const res = await analyticsService.getAtRiskStudents(filters);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      setError(t('error'));
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
          .break-inside-avoid { break-inside: avoid; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-red-700">⚠️ {t('at_risk')} (&lt;60%)</h2>
                <button onClick={() => window.print()} className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold no-print">
                    🖨️ {t('print')}
                </button>
            </div>

            {/* FILTERS */}
            <div className="flex flex-col md:flex-row gap-4 no-print items-end">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ClassStreamSelector 
                    selectedClass={filters.classId}
                    onClassChange={(id) => setFilters(prev => ({ ...prev, classId: id }))}
                    selectedStream={filters.streamId}
                    onStreamChange={(id) => setFilters(prev => ({ ...prev, streamId: id }))}
                    required={true}
                    showAllStreamsOption={true}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                  <select name="semester" value={filters.semester} onChange={handleChange} className="border p-2 rounded w-full">
                      <option value="First Semester">{t('sem_1')}</option>
                      <option value="Second Semester">{t('sem_2')}</option>
                  </select>
                  <input type="text" name="academicYear" value={filters.academicYear} onChange={handleChange} placeholder={t('academic_year')} className="border p-2 rounded w-full"/>
                  <button onClick={fetchReport} disabled={loading} className="bg-red-600 text-white font-bold py-2 rounded hover:bg-red-700 w-full">
                      {loading ? t('loading') : t('view')}
                  </button>
                </div>
            </div>
            
            {error && <p className="text-red-500 mt-2 text-sm no-print">{error}</p>}

            <div className="hidden print:block text-center mb-4">
                <h1 className="text-xl font-bold uppercase">{t('intervention_list')}</h1>
                <p>{filters.semester} | {filters.academicYear}</p>
            </div>
        </div>

        {/* CONTENT */}
        <div className="p-6">
            {data.length === 0 && !loading && (
                <div className="text-center text-green-600 font-bold p-10 bg-green-50 rounded">
                    🎉 {t('no_data_select_filters') || "No students found below 60%."}
                </div>
            )}

            {data.map((subject) => (
                <div key={subject.subjectName} className="mb-8 overflow-x-auto break-inside-avoid">
                    <h3 className="text-lg font-bold text-gray-800 border-b-2 border-red-200 mb-2 flex justify-between">
                        <span>{subject.subjectName}</span>
                        <span className="text-sm font-normal text-gray-500">{t('total')}: {subject.totalPossible}</span>
                    </h3>
                    
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead className="bg-red-50 text-red-900">
                            <tr>
                                <th className="border p-2 text-left w-10">#</th>
                                <th className="border p-2 text-left">{t('full_name')}</th>
                                <th className="border p-2 text-left">{t('id_no')}</th>
                                <th className="border p-2 text-center">{t('gender')}</th>
                                <th className="border p-2 text-center">{t('score')}</th>
                                <th className="border p-2 text-center">%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subject.students.map((student, idx) => (
                                <tr key={student.id} className="hover:bg-red-50">
                                    <td className="border p-2 text-center">{idx + 1}</td>
                                    <td className="border p-2 font-bold">{student.name}</td>
                                    <td className="border p-2 font-mono text-xs">{student.studentId}</td>
                                    <td className="border p-2 text-center">{t(student.gender)}</td>
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