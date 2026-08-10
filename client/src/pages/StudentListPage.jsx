// src/pages/StudentListPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import studentService from '@shared/services/studentService';
import authService from '@shared/services/authService';
import StudentStats from '../components/StudentStats';

// Helper to dynamically calculate current Ethiopian Calendar (EC) Year
const getEthiopianYear = (gregorianDate = new Date()) => {
    const year = gregorianDate.getFullYear();
    const month = gregorianDate.getMonth(); // 0-indexed (8 is September)
    const day = gregorianDate.getDate();

    let ethiopianYear = year - 8;
    if (month > 8 || (month === 8 && day >= 11)) {
        ethiopianYear = year - 7;
    }
    return ethiopianYear;
};

// Safe helper to extract readable Grade Level name string
const getGradeName = (gl) => {
    if (!gl) return '';
    if (typeof gl === 'object' && gl.name) return gl.name;
    return String(gl);
};

// Safe helper to extract Grade Level ObjectId
const getGradeId = (gl) => {
    if (!gl) return '';
    if (typeof gl === 'object' && gl._id) return gl._id.toString();
    return String(gl);
};

const StudentListPage = () => {
    const { t } = useTranslation(); 
    const [currentUser] = useState(authService.getCurrentUser());
    const [searchParams, setSearchParams] = useSearchParams();
    const [allStudents, setAllStudents] = useState([]);
    
    // Academic Year Filter State (Defaults to Current EC Year)
    const [selectedYear, setSelectedYear] = useState(getEthiopianYear().toString());

    const [selectedSection, setSelectedSection] = useState(searchParams.get('section') || null); 
    const [selectedGrade, setSelectedGrade] = useState(searchParams.get('grade') || null); 
    const [searchTerm, setSearchTerm] = useState(''); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load initial student list from GET /api/students/getallstudents
    const fetchStudents = async () => {
        try {
            const studentRes = await studentService.getAllStudents();
            
            if (!studentRes.data || !Array.isArray(studentRes.data.data)) {
                if (studentRes.data?.error) throw new Error(t('offline_mode'));
                throw new Error(t('error'));
            }

            setAllStudents(studentRes.data.data);

        } catch (err) {
            setError(err.message || t('error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    // Sync URL Parameters
    useEffect(() => {
        const params = {};
        if (selectedSection) params.section = selectedSection;
        if (selectedGrade) params.grade = selectedGrade;
        setSearchParams(params);
    }, [selectedSection, selectedGrade, setSearchParams]);

    // DYNAMIC ACADEMIC YEARS DISCOVERY
    const availableYears = useMemo(() => {
        const yearsSet = new Set();
        yearsSet.add(getEthiopianYear().toString()); // Current EC year

        allStudents.forEach(s => {
            if (s.year) yearsSet.add(String(s.year));
            if (Array.isArray(s.academicHistory)) {
                s.academicHistory.forEach(h => {
                    if (h.year) yearsSet.add(String(h.year));
                });
            }
        });

        return Array.from(yearsSet).sort((a, b) => b.localeCompare(a)); // Descending order
    }, [allStudents]);

    // FILTER STUDENTS & DETERMINE CLASS FOR THE SELECTED YEAR
    const yearFilteredStudents = useMemo(() => {
        if (!selectedYear) return [];

        const result = [];

        allStudents.forEach(student => {
            // Case A: Student's active year matches selectedYear
            if (String(student.year) === String(selectedYear)) {
                result.push({
                    ...student,
                    yearGrade: student.gradeLevel // Active populated gradeLevel
                });
            } 
            // Case B: Student has historical record matching selectedYear
            else if (Array.isArray(student.academicHistory)) {
                const histRecord = student.academicHistory.find(h => String(h.year) === String(selectedYear));
                if (histRecord) {
                    result.push({
                        ...student,
                        yearGrade: histRecord.gradeAtThatTime || student.gradeLevel, // Populated historical grade
                        historicalStatus: histRecord.statusAtEnd
                    });
                }
            }
        });

        return result;
    }, [allStudents, selectedYear]);

    // EXTRACT CLASSES AVAILABLE IN THE SELECTED YEAR
    const allAllowedGrades = useMemo(() => {
        const gradeMap = new Map();
        
        yearFilteredStudents.forEach(s => {
            const name = getGradeName(s.yearGrade);
            const id = getGradeId(s.yearGrade);
            if (name) {
                gradeMap.set(name, { _id: id || name, name });
            }
        });

        return Array.from(gradeMap.values()).sort((a, b) => 
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );
    }, [yearFilteredStudents]);

    // STATS FOR SELECTED YEAR (Total, Male, Female)
    const gradeStatsMap = useMemo(() => {
        const stats = new Map();

        yearFilteredStudents.forEach(s => {
            const gName = getGradeName(s.yearGrade);
            const gId = getGradeId(s.yearGrade);
            const gender = (s.gender || '').trim().toLowerCase();

            const updateStatsForKey = (key) => {
                if (!key) return;
                if (!stats.has(key)) {
                    stats.set(key, { total: 0, male: 0, female: 0 });
                }
                const st = stats.get(key);
                st.total++;
                if (gender === 'male') st.male++;
                else if (gender === 'female') st.female++;
            };

            updateStatsForKey(gName);
            if (gId && gId !== gName) updateStatsForKey(gId);
        });

        return stats;
    }, [yearFilteredStudents]);

    // AUTOMATED ATOMIC BACKEND BULK END OF YEAR HANDLER
    const handleBulkEndOfYear = async () => {
        const currentECYear = getEthiopianYear().toString();
        
        try {
            const countRes = await studentService.getBulkEndOfYearCount();
            const eligibleCount = countRes.data?.eligibleCount || 0;

            if (eligibleCount === 0) {
                alert(`No active students found matching current academic year ${currentECYear} E.C.`);
                return;
            }

            const confirmMessage = `Are you sure you want to transition ${eligibleCount} students in year ${currentECYear} E.C. to "End of Year"? This will archive their academic history.`;
            if (!window.confirm(confirmMessage)) return;

            setLoading(true);
            setError(null);

            const response = await studentService.bulkSetEndOfYear();
            alert(response.data?.message || `Successfully processed ${eligibleCount} students!`);
            
            await fetchStudents();

        } catch (err) {
            console.error("Bulk End of Year error:", err);
            setError(err.response?.data?.message || "Failed to process bulk year-end update.");
        } finally {
            setLoading(false);
        }
    };

    // FILTERS
    const visibleGradeButtons = useMemo(() => {
        if (!selectedSection) return [];
        return allAllowedGrades.filter(g => {
            const gradeName = g.name;
            if (selectedSection === 'kg') return /^(kg|nursery)/i.test(gradeName);
            if (selectedSection === 'primary') return /^Grade\s*[1-8](\D|$)/i.test(gradeName);
            if (selectedSection === 'highSchool') return /^Grade\s*(9|1[0-2])(\D|$)/i.test(gradeName);
            return false;
        });
    }, [selectedSection, allAllowedGrades]);

    const tableStudents = useMemo(() => {
        if (!selectedGrade) return [];
        return yearFilteredStudents
            .filter(s => {
                const gName = getGradeName(s.yearGrade);
                const gId = getGradeId(s.yearGrade);
                return gName === selectedGrade || gId === selectedGrade;
            })
            .filter(s => 
                searchTerm === '' || 
                s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.nationalIdNumber && s.nationalIdNumber.toLowerCase().includes(searchTerm.toLowerCase()))
            )
            .sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [yearFilteredStudents, selectedGrade, searchTerm]);

    const activeGradeStats = useMemo(() => {
        if (!selectedGrade) return { total: 0, male: 0, female: 0 };
        return gradeStatsMap.get(selectedGrade) || { total: tableStudents.length, male: 0, female: 0 };
    }, [selectedGrade, gradeStatsMap, tableStudents.length]);

    // Section Card Counter
    const SectionCard = ({ id, label, color }) => {
        const count = yearFilteredStudents.filter(s => {
            const gName = getGradeName(s.yearGrade);
            if (id === 'kg') return /^(kg|nursery)/i.test(gName);
            if (id === 'primary') return /^Grade\s*[1-8](\D|$)/i.test(gName);
            if (id === 'highSchool') return /^Grade\s*(9|1[0-2])(\D|$)/i.test(gName);
            return false;
        }).length;

        if (count === 0) return null;

        return (
            <div onClick={() => { setSelectedSection(id); setSelectedGrade(null); }}
                className={`flex-1 min-w-[200px] p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:-translate-y-1 hover:shadow-lg bg-white ${selectedSection === id ? 'ring-4 ring-offset-2 ring-pink-400 border-transparent shadow-xl' : color}`}
            >
                <h3 className="text-xl font-bold uppercase tracking-wide opacity-80">{label}</h3>
                <div className="mt-2 text-3xl font-black">{count} <span className="text-sm font-normal opacity-60">{t('students')}</span></div>
            </div>
        );
    };

    if (loading && allStudents.length === 0) return <div className="p-10 text-center text-gray-600">{t('loading')}</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">{t('students_list')}</h2>
                    <p className="text-sm text-gray-500">{t('manage_records_desc')}</p>
                </div>

                {/* ACADEMIC YEAR SELECTOR DROPDOWN */}
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
                    <span className="text-xs font-bold text-gray-500 uppercase ml-2">Academic Year:</span>
                    <select
                        value={selectedYear}
                        onChange={(e) => {
                            setSelectedYear(e.target.value);
                            setSelectedSection(null);
                            setSelectedGrade(null);
                        }}
                        className="font-bold text-sm text-pink-600 bg-gray-50 border border-gray-300 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
                    >
                        {availableYears.map(yr => (
                            <option key={yr} value={yr}>{yr} E.C.</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-wrap gap-3">
                    {['admin', 'staff', 'accountant'].includes(currentUser.role) && (
                        <>
                            <Link to="/students/add" className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded shadow transition-colors">+ {t('add')}</Link>
                            <Link to="/students/import" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow transition-colors">{t('import_excel')}</Link>
                        </>
                    )}
                    
                    {currentUser.role === 'admin' && (
                        <button 
                            onClick={handleBulkEndOfYear}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded shadow transition-colors"
                            disabled={loading}
                        >
                            ⚙️ {t('end_of_year') || 'End of Year'}
                        </button>
                    )}
                </div>
            </div>

            {!selectedGrade && (
                <StudentStats 
                    students={yearFilteredStudents} 
                    sectionName={
                        selectedSection === 'kg' ? t('section_kg') :
                        selectedSection === 'primary' ? t('section_primary') :
                        selectedSection === 'highSchool' ? t('section_high_school') :
                        `${t('school_overview')} (${selectedYear} E.C.)`
                    } 
                />
            )}

            {!selectedGrade && (
                <div className="flex flex-wrap gap-6 mb-8">
                    <SectionCard id="kg" label={t('section_kg')} color="border-purple-200 text-purple-800" />
                    <SectionCard id="primary" label={t('section_primary')} color="border-blue-200 text-blue-800" />
                    <SectionCard id="highSchool" label={t('section_high_school')} color="border-indigo-200 text-indigo-800" />
                </div>
            )}

            {/* --- GRADE SELECTOR WITH MALE & FEMALE BREAKDOWN --- */}
            {selectedSection && (
                <div className="mb-8 bg-white p-5 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-gray-700 uppercase">
                            {t('select_class')} ({selectedYear} E.C.):
                        </h4>
                        <button onClick={() => { setSelectedSection(null); setSelectedGrade(null); }} className="text-sm text-blue-600 hover:underline font-semibold">
                            {t('clear_section')}
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {visibleGradeButtons.map(g => {
                            const st = gradeStatsMap.get(g.name) || { total: 0, male: 0, female: 0 };
                            const isSelected = selectedGrade === g.name;

                            return (
                                <button 
                                    key={g._id || g.name} 
                                    onClick={() => setSelectedGrade(g.name)}
                                    className={`px-4 py-2.5 border rounded-xl font-bold text-sm transition-all flex flex-col items-center gap-1 ${
                                        isSelected 
                                            ? 'bg-pink-600 text-white border-pink-600 shadow-md ring-2 ring-pink-300' 
                                            : 'bg-white text-gray-800 border-gray-200 hover:border-pink-300 hover:bg-pink-50/30 shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{g.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${isSelected ? 'bg-pink-800 text-pink-100' : 'bg-gray-100 text-gray-700'}`}>
                                            {st.total}
                                        </span>
                                    </div>
                                    
                                    <div className={`text-[10px] font-semibold flex items-center gap-2 ${isSelected ? 'text-pink-100' : 'text-gray-500'}`}>
                                        <span>👦 {st.male} M</span>
                                        <span>•</span>
                                        <span>👧 {st.female} F</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* --- STUDENT TABLE --- */}
            {selectedGrade && (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden animate-slide-up">
                    <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50">
                        <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-800">{selectedGrade} <span className="text-xs text-gray-400 font-mono">({selectedYear} E.C.)</span></h3>
                            <span className="text-xs bg-pink-100 text-pink-800 px-3 py-1 rounded-full font-bold border border-pink-200">
                                Total: {activeGradeStats.total} {t('students')}
                            </span>
                            <span className="text-xs bg-blue-50 text-blue-800 px-3 py-1 rounded-full font-bold border border-blue-200">
                                👦 Male: {activeGradeStats.male}
                            </span>
                            <span className="text-xs bg-purple-50 text-purple-800 px-3 py-1 rounded-full font-bold border border-purple-200">
                                👧 Female: {activeGradeStats.female}
                            </span>
                        </div>

                        <input 
                            type="text" 
                            placeholder={t('search_placeholder')} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 text-sm w-full md:w-64 focus:ring-2 focus:ring-pink-500 outline-none bg-white"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-4 py-3 text-left">{t('No.')}</th>
                                    <th className="px-4 py-3 text-left">{t('full_name')}</th>
                                    <th className="px-4 py-3 text-left">{t('status') || 'Status'}</th>
                                    <th className="px-4 py-3 text-left">{t('gender')}</th>
                                    <th className="px-4 py-3 text-left">{t('dob') || 'Date of Birth'}</th>
                                    <th className="px-4 py-3 text-left">{t('mother') || 'Mother'}</th>
                                    <th className="px-4 py-3 text-left">{t('contacts') || 'Contacts'}</th>
                                    <th className="px-4 py-3 text-left">{t('health_status') || 'Health'}</th>
                                    <th className="px-4 py-3 text-center">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {tableStudents.length > 0 ? (
                                    tableStudents.map((student, index )=> (
                                        <tr key={student._id} className="hover:bg-pink-50 transition-colors text-sm">
                                            <td className="px-4 py-4 font-mono text-gray-500">{index + 1}</td>
                                            
                                            {/* Avatar + Full Name + National ID */}
                                            <td className="px-4 py-4 font-bold text-gray-800 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <img 
                                                        src={student.imageUrl} 
                                                        alt={student.fullName} 
                                                        className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm"
                                                    />
                                                    <div>
                                                        <Link to={`/students/${student._id}?section=${selectedSection}&grade=${selectedGrade}`} className="hover:text-pink-600 hover:underline">
                                                            {student.fullName}
                                                        </Link>
                                                        <p className="text-[10px] text-gray-400">{student.studentId}</p>
                                                        {student.nationalIdNumber && (
                                                            <div className="text-[10px] text-gray-400 font-mono">
                                                                🪪 {student.nationalIdNumber}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-4 py-4 text-xs font-bold whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full ${
                                                    student.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                    student.status === 'End of Year' ? 'bg-blue-100 text-blue-800' :
                                                    student.status === 'Graduated' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {student.status || 'Active'}
                                                </span>
                                            </td>

                                            {/* Gender */}
                                            <td className="px-4 py-4 text-gray-600">{t(student.gender)}</td>

                                            {/* Date of Birth */}
                                            <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                                                {student.dateOfBirth ? String(student.dateOfBirth).split('T')[0] : '-'}
                                            </td>

                                            {/* Mother Name */}
                                            <td className="px-4 py-4 text-gray-600">
                                                <div className="text-xs font-bold">{student.motherName || '-'}</div>
                                            </td>

                                            {/* Contacts */}
                                            <td className="px-4 py-4 text-gray-600 text-xs whitespace-nowrap">
                                                {student.motherContact && <div>👩 {student.motherContact}</div>}
                                                {student.fatherContact && <div>👨 {student.fatherContact}</div>}
                                                {!student.motherContact && !student.fatherContact && '-'}
                                            </td>

                                            {/* Health Status */}
                                            <td className="px-4 py-4 text-gray-600 max-w-[150px] truncate" title={student.healthStatus}>
                                                {student.healthStatus || 'No known conditions'}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-4 text-center">
                                                <Link to={`/students/${student._id}?section=${selectedSection}&grade=${selectedGrade}`} className="text-indigo-600 hover:text-indigo-900 font-bold">{t('view')}</Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="9" className="px-6 py-8 text-center text-gray-500">{t('no_students_match')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentListPage;