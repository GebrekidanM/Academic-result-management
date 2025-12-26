import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next'; // <--- 1. Import Hook
import analyticsService from '../services/analyticsService';
import authService from '../services/authService';
import subjectService from '../services/subjectService';
import userService from '../services/userService';

const AllSubjectAnalytics = () => {
  const { t } = useTranslation(); // <--- 2. Initialize Hook
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
        const user = authService.getCurrentUser();
        if(user) {
             const res = await userService.getProfile();
             setCurrentUser(res.data.data || res.data);
        }
      } catch(err) {
          console.error(err);
      }
    };
    fetchUser();
  }, []);

  // --- 2. Load Grades based on Role & School Level ---
  useEffect(() => {
    const fetchGrade = async () => {
      if (!currentUser) return;

      let uniqueGrades = [];

      // CASE 1: ADMIN, STAFF, PRINCIPAL
      if (['admin', 'staff', 'principal'].includes(currentUser.role)) {
        try {
          const res = await subjectService.getAllSubjects();
          if (res.data) {
            const subjects = res.data.data || res.data;
            let allGrades = [...new Set(subjects.map(s => s.gradeLevel))];

            // --- FILTER BASED ON SCHOOL LEVEL FOR STAFF ---
            if (currentUser.role === 'staff' && currentUser.schoolLevel) {
               const level = currentUser.schoolLevel.toLowerCase();

               if (level === 'kg') {
                   allGrades = allGrades.filter(g => /^(kg|nursery)/i.test(g));
               } 
               else if (level === 'primary') {
                   allGrades = allGrades.filter(g => /^Grade\s*[1-8](\D|$)/i.test(g));
               } 
               else if (level === 'high school') {
                   allGrades = allGrades.filter(g => /^Grade\s*(9|1[0-2])(\D|$)/i.test(g));
               }
            }

            uniqueGrades = allGrades.sort();
          }
        } catch (err) { console.error(err); }
      } 
      // CASE 2: TEACHER
      else if (currentUser.role === 'teacher') {
        if (currentUser.subjectsTaught?.length > 0) {
          const teacherGrades = currentUser.subjectsTaught.map(s => s.subject?.gradeLevel).filter(g => g);
          uniqueGrades = [...new Set(teacherGrades)].sort();
        }
      }

      setAvailableGrades(uniqueGrades);
      if (uniqueGrades.length > 0) {
          setFilters(prev => ({ ...prev, gradeLevel: uniqueGrades[0] }));
      }
    }
    fetchGrade();
  }, [currentUser]);

  // --- 3. Helper: Qualitative Level (Moved inside to use 't') ---
  const getPerformanceLevel = (rate) => {
    if (rate >= 90) return { label: t('Excellent') || 'Excellent', color: 'bg-green-100 text-green-800 border-green-200' };
    if (rate >= 75) return { label: t('Very Good') || 'Very Good', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (rate >= 50) return { label: t('Satisfactory') || 'Satisfactory', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    return { label: t('Critical') || 'Critical', color: 'bg-red-100 text-red-800 border-red-200' };
  };

  // --- 4. Calculate Ranks & Stats ---
  const dataWithRanks = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const calculated = data.map(row => {
        const total = row.attended.total;
        const failed = row.below50.total;
        const passed = total - failed;
        const passRate = total > 0 ? (passed / total) * 100 : 0;
        return { ...row, passRate };
    });

    calculated.sort((a, b) => b.passRate - a.passRate);
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
  }, [dataWithRanks]); // Added dependency on getPerformanceLevel implicitly via render

  // --- Handlers ---
  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    
    if(!filters.gradeLevel) {
        setLoading(false);
        return setError(t('select_class') || "Please select a Grade Level.");
    }
    if(!filters.assessmentName.trim()) {
        setLoading(false);
        return setError(t('error') || "Please enter an Assessment Name.");
    }

    try {
      const res = await analyticsService.getClassAnalytics(filters);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      setError(t('error') || 'Error fetching analytics.');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Helper Component: Triple Cell (M | F | T) ---
  const TripleCell = ({ stats, bgColor = '' }) => (
    <>
      <td className={`border border-gray-300 px-1 py-1 text-center text-[10px] text-gray-600 ${bgColor}`}>{stats.male}</td>
      <td className={`border border-gray-300 px-1 py-1 text-center text-[10px] text-gray-600 ${bgColor}`}>{stats.female}</td>
      <td className={`border-r-2 border-gray-400 px-1 py-1 text-center text-[11px] font-bold text-black ${bgColor}`}>{stats.total}</td>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-sans print:bg-white print:p-0">
      
      {/* --- INJECT PRINT SETTINGS (LANDSCAPE) --- */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 5mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          table { width: 100% !important; font-size: 9px !important; }
          .print-static { position: static !important; }
        }
      `}</style>

      <div className="max-w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
        
        {/* HEADER & FILTERS (Hidden on Print) */}
        <div className="p-6 border-b border-gray-200 no-print">
           <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('class_matrix')}</h2>
           
           <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <select name="gradeLevel" value={filters.gradeLevel} onChange={handleChange} disabled={availableGrades.length === 0} className="block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                  {availableGrades.length > 0 ? availableGrades.map(g => <option key={g} value={g}>{g}</option>) : <option value="">{t('loading')}</option>}
                </select>
                <input type="text" name="assessmentName" value={filters.assessmentName} onChange={handleChange} placeholder={t('assessment')} className="block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                <select name="semester" value={filters.semester} onChange={handleChange} className="block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                  <option value="First Semester">{t('sem_1')}</option>
                  <option value="Second Semester">{t('sem_2')}</option>
                </select>
                <input type="text" name="academicYear" value={filters.academicYear} onChange={handleChange} placeholder={t('academic_year')} className="block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                
                <button onClick={fetchAnalytics} disabled={loading || !filters.gradeLevel} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">
                  {loading ? t('loading') : t('view')}
                </button>
                
                <button onClick={() => window.print()} disabled={data.length === 0} className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-md">
                  🖨️ {t('print')}
                </button>
           </div>
           {error && <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">{error}</div>}
        </div>

        {/* PRINTABLE HEADER (Visible ONLY on Print) */}
        <div className="hidden print:block text-center mb-4 pt-4 border-b pb-2">
            <h1 className="text-xl font-bold uppercase text-gray-800">{t('class_matrix')}</h1>
            <p className="text-sm text-gray-600">{t('grade')}: {filters.gradeLevel} | {t('assessment')}: {filters.assessmentName} | {t('academic_year')}: {filters.academicYear}</p>
        </div>

        {/* BEST PERFORMANCE BANNER */}
        {bestPerformance && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 m-4 mb-0 shadow-sm flex items-center print:border print:bg-green-50 print:m-0 print:mb-2">
                <div className="text-2xl mr-4">🏆</div>
                <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{t('strongest_subject')}: {bestPerformance.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-700">{t('pass_rate')}: <strong>{bestPerformance.passRate}%</strong></span>
                        <span className={`text-xs px-2 py-0.5 rounded border font-bold ${bestPerformance.levelColor}`}>
                            {bestPerformance.levelLabel}
                        </span>
                    </div>
                </div>
            </div>
        )}

        {/* MATRIX TABLE */}
        {dataWithRanks.length > 0 ? (
            <div className="overflow-x-auto p-4 print:p-0 print:overflow-visible">
                <table className="min-w-full border-collapse border border-gray-400">
                    <thead className="bg-gray-800 text-white print:bg-gray-800 print:text-white">
                        <tr>
                            <th rowSpan="2" className="border border-gray-500 px-2 py-2 text-center text-xs font-bold uppercase w-10 bg-gray-900 sticky left-0 z-20 print-static">{t('rank')}</th>
                            <th rowSpan="2" className="border border-gray-500 px-2 py-2 text-left text-xs font-bold uppercase w-40 bg-gray-900 sticky left-10 z-10 print-static">{t('subject')}</th>
                            
                            <th colSpan="3" className="border border-gray-500 px-1 text-center text-[10px] font-bold uppercase">{t('total')}</th>
                            <th colSpan="3" className="border border-gray-500 px-1 text-center text-[10px] font-bold uppercase bg-gray-700 print:bg-gray-700">{t('active')}</th>
                            <th colSpan="3" className="border border-gray-500 px-1 text-center text-[10px] font-bold uppercase bg-red-900 print:bg-red-900">Missed</th>
                            <th colSpan="3" className="border border-gray-500 px-1 text-center text-[10px] font-bold uppercase bg-red-700 print:bg-red-700">&lt; 50%</th>
                            <th colSpan="3" className="border border-gray-500 px-1 text-center text-[10px] font-bold uppercase bg-yellow-600 print:bg-yellow-600">50-75%</th>
                            <th colSpan="3" className="border border-gray-500 px-1 text-center text-[10px] font-bold uppercase bg-blue-700 print:bg-blue-700">75-90%</th>
                            <th colSpan="3" className="border border-gray-500 px-1 text-center text-[10px] font-bold uppercase bg-green-700 print:bg-green-700">&gt; 90%</th>
                        </tr>
                        {/* Sub-headers M/F/T */}
                        <tr className="text-[9px] bg-gray-700 text-gray-200 print:bg-gray-700 print:text-white">
                            {[...Array(7)].map((_, i) => (
                                <React.Fragment key={i}>
                                    <th className="border border-gray-500 px-1">{t('M')}</th>
                                    <th className="border border-gray-500 px-1">{t('F')}</th>
                                    <th className="border border-gray-500 px-1 border-r-2 border-white">{t('total')[0]}</th>
                                </React.Fragment>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {dataWithRanks.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 border-b border-gray-300 print:border-gray-400">
                                {/* Rank */}
                                <td className={`border border-gray-300 px-1 py-1 text-center font-bold text-xs sticky left-0 z-20 print-static 
                                    ${row.rank === 1 ? 'bg-yellow-100 text-yellow-800' : 
                                      row.rank === 2 ? 'bg-gray-200 text-gray-800' : 
                                      row.rank === 3 ? 'bg-orange-100 text-orange-800' : 'bg-white text-gray-500'}
                                `}>
                                    #{row.rank}
                                </td>

                                {/* Subject Name */}
                                <td className="border border-gray-300 px-2 py-1 font-bold text-xs sticky left-10 z-10 bg-white print-static">
                                    <div className="flex items-center justify-between">
                                        <span>{row.subject}</span>
                                        <span className="text-[9px] text-gray-400 font-normal">({row.totalMarks})</span>
                                    </div>
                                </td>
                                
                                <TripleCell stats={row.students} />
                                <TripleCell stats={row.attended} bgColor="bg-gray-50 print:bg-gray-100" />
                                <TripleCell stats={row.missed} bgColor="bg-red-50 text-red-700 print:bg-red-50" />
                                <TripleCell stats={row.below50} bgColor="bg-red-100 print:bg-red-100" />
                                <TripleCell stats={row.below75} bgColor="bg-yellow-50 print:bg-yellow-50" />
                                <TripleCell stats={row.below90} bgColor="bg-blue-50 print:bg-blue-50" />
                                <TripleCell stats={row.above90} bgColor="bg-green-50 print:bg-green-50" />
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        ) : (
            !loading && <div className="p-10 text-center text-gray-500 no-print">{t('no_data_select_filters')}</div>
        )}
      </div>
    </div>
  );
};

export default AllSubjectAnalytics;