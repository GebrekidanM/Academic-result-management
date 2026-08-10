// src/pages/RosterPage.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next'; 
import rosterService from '@shared/services/rosterService';
import studentService from '@shared/services/studentService';
import authService from '@shared/services/authService';
import { Link } from 'react-router-dom';

// Programmatic Ethiopian Calendar (E.C.) year calculator
const getEthiopianYear = (gregorianDate = new Date()) => {
    const year = gregorianDate.getFullYear();
    const month = gregorianDate.getMonth();
    const day = gregorianDate.getDate();

    let ethiopianYear = year - 8;
    if (month > 8 || (month === 8 && day >= 11)) {
        ethiopianYear = year - 7;
    }
    return ethiopianYear;
};

const RosterPage = () => {
    const { t } = useTranslation(); 
    const [currentUser] = useState(authService.getCurrentUser());
    
    // Active Filter States
    const [academicYear, setAcademicYear] = useState(getEthiopianYear().toString()); 
    const [gradeLevel, setGradeLevel] = useState('');
    
    const [allStudents, setAllStudents] = useState([]);
    const [rosterData, setRosterData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [homeroomTeacher, setHomeroomTeacher] = useState('');

    const availableYears = useMemo(() => {
        const currentEC = getEthiopianYear();
        return Array.from({ length: 5 }, (_, i) => (currentEC - 3 + i).toString()).sort((a, b) => b.localeCompare(a));
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const res = await studentService.getAllStudentsForRe();
                setAllStudents(res.data?.data || res.data || []);
            } catch (err) {
                console.error("Failed to load students:", err);
            }
        };
        loadInitialData();
    }, []);

    const availableGrades = useMemo(() => {
        if (!academicYear || allStudents.length === 0) return [];
        
        const gradeMap = new Map();
        
        allStudents.forEach(student => {
            if (String(student.year) === String(academicYear)) {
                const gl = student.gradeLevel;
                if (gl && gl._id) {
                    gradeMap.set(gl._id.toString(), gl.name);
                }
            }
            
            if (Array.isArray(student.academicHistory)) {
                student.academicHistory.forEach(history => {
                    if (String(history.year) === String(academicYear)) {
                        const gl = history.gradeAtThatTime;
                        if (gl && gl._id) {
                            gradeMap.set(gl._id.toString(), gl.name);
                        }
                    }
                });
            }
        });

        return Array.from(gradeMap.entries())
            .map(([id, name]) => ({ _id: id, name }))
            .sort((a, b) => 
                a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
            );
    }, [allStudents, academicYear]);

    useEffect(() => {
        if (currentUser.role === 'teacher' && currentUser.homeroomGrade) {
            const homeroomId = currentUser.homeroomGrade._id || currentUser.homeroomGrade;
            setGradeLevel(homeroomId.toString());
        } else if (gradeLevel && !availableGrades.some(g => g._id === gradeLevel)) {
            setGradeLevel('');
            setRosterData(null);
        }
    }, [academicYear, availableGrades, gradeLevel, currentUser]);


    const handleGenerateRoster = useCallback(async (e) => {
        if (e) e.preventDefault();
        
        if (!gradeLevel) {
            setError(t('select_class_warning') || "Please select a grade level.");
            return;
        }
        setLoading(true); setError(null); setRosterData(null);
        
        try {
            const response = await rosterService.getRoster({ gradeLevel, academicYear });
            setRosterData(response.data);
            setHomeroomTeacher(response.data.homeroomTeacherName);
        } catch (err) { 
            setError(err.response?.data?.message || t('error')); 
        } finally { 
            setLoading(false); 
        }
    }, [gradeLevel, academicYear, t]);


    useEffect(() => {
        if (currentUser.role === 'teacher' && gradeLevel && academicYear) {
            handleGenerateRoster();
        }
    }, [gradeLevel, academicYear, currentUser.role, handleGenerateRoster]);

    const handlePrint = () => {
        const tableToPrint = document.getElementById('rosterTable');
        if (!tableToPrint) return;

        const activeGradeName = availableGrades.find(g => g._id === gradeLevel)?.name || 'Class';
        const printWindow = window.open('', '', 'height=800,width=1200');
        
        const htmlContent = `
            <html>
                <head>
                    <title>${t('roster_for')} ${activeGradeName}</title>
                    <style>
                        @page { 
                            size: A4 landscape; 
                            margin: 10mm; 
                        }
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 20px; 
                            -webkit-print-color-adjust: exact !important; 
                            print-color-adjust: exact !important; 
                            background-color: white;
                        }
                        
                        /* HEADER STYLES */
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                        .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; color: #333; }
                        .header p { margin: 5px 0; font-size: 14px; color: #555; }
                        
                        /* TABLE STYLES */
                        table { width: 100%; border-collapse: collapse; font-size: 9pt; }
                        
                        th, td { 
                            border: 1px solid #999; 
                            padding: 4px; 
                            text-align: center; 
                            vertical-align: middle;
                        }
                        
                        .bg-blue-200 { background-color: #bfdbfe !important; }
                        .bg-blue-50 { background-color: #eff6ff !important; }
                        .bg-gray-50 { background-color: #f9fafb !important; }
                        .bg-gray-100 { background-color: #f3f4f6 !important; }
                        .bg-gray-200 { background-color: #e5e7eb !important; }
                        .bg-gray-300 { background-color: #d1d5db !important; }
                        .bg-yellow-50 { background-color: #fefce8 !important; }
                        .bg-yellow-100 { background-color: #fef9c3 !important; }
                        .bg-yellow-200 { background-color: #fef08a !important; }

                        .text-blue-900 { color: #1e3a8a !important; }
                        .text-gray-500 { color: #6b7280 !important; }
                        .text-gray-900 { color: #111827 !important; }
                        
                        .font-bold { font-weight: bold; }
                        .font-black { font-weight: 900; }
                        .font-mono { font-family: monospace; }
                        
                        .text-left { text-align: left !important; padding-left: 5px; }
                        .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${t('app_name')}</h1>
                        <p>${t('roster_for')} ${activeGradeName} - ${academicYear} E.C.</p>
                        <p>${t('homeroom_teacher_label')}: ${homeroomTeacher}</p>
                    </div>

                    ${tableToPrint.outerHTML}

                    <div class="footer">
                        <div>${t('teacher_comment')}: __________________</div>
                        <div>${t('director_sign')}: __________________</div>
                        <div>${t('date')}: __________________</div>
                    </div>
                </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 1000);
    };

    const textInput = "shadow-sm border rounded-lg py-2 px-3 w-full bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";
    const submitButton = `bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;
    
    // Table Classes
    const thStyle = "p-2 border border-gray-400 bg-blue-200 text-xs font-bold uppercase text-gray-800 align-middle";
    const tdStyle = "p-2 border border-gray-300 text-xs text-gray-800 align-middle";
    const semLabelStyle = "p-2 border border-gray-300 text-xs font-bold text-gray-500 bg-gray-50 text-left";

    return (
        <div className="bg-gray-100 min-h-screen p-6 font-sans print:hidden">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-full overflow-hidden">
                
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">{t('yearly_roster')}</h2>
                
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6">
                    <form onSubmit={handleGenerateRoster} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        
                        {/* Year Selector Dropdown (Must be selected first) */}
                        <div>
                            <label htmlFor="academicYear" className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('academic_year')}</label>
                            <select 
                                id="academicYear" 
                                value={academicYear} 
                                onChange={(e) => setAcademicYear(e.target.value)} 
                                className={textInput}
                                disabled={loading}
                            >
                                {availableYears.map(yr => (
                                    <option key={yr} value={yr}>{yr} E.C.</option>
                                ))}
                            </select>
                        </div>

                        {/* Grade Level Selector (Dynamically filtered by academicYear using ObjectIDs) */}
                        <div>
                            <label htmlFor="gradeLevel" className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('grade_level')}</label>
                            <select 
                                id="gradeLevel" 
                                value={gradeLevel} 
                                onChange={(e) => setGradeLevel(e.target.value)} 
                                className={textInput}
                                disabled={loading || availableGrades.length === 0}
                            >
                                <option value="">-- Select Grade --</option>
                                {availableGrades.map(g => (
                                    <option key={g._id} value={g._id}>{g.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-2">
                            <button type="submit" className={submitButton} disabled={loading || !gradeLevel}>
                                {loading ? t('loading') : t('generate_roster')}
                            </button>
                            {rosterData && (
                                <button type="button" onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg">
                                    🖨️ {t('print_roster')}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                
                {rosterData && (
                    <div className="overflow-x-auto border border-gray-300 rounded-lg">
                        <table id="rosterTable" className="min-w-full text-sm divide-y divide-gray-200">
                            <thead>
                                <tr className='bg-blue-200'>
                                    <th className={`${thStyle} w-16`}>{t('student_id')}</th>
                                    <th className={`${thStyle} text-left w-48`}>{t('full_name')}</th>
                                    <th className={`${thStyle} w-10`}>{t('gender')[0]}</th>
                                    <th className={`${thStyle} w-10`}>{t('age')}</th>
                                    <th className={`${thStyle} w-20`}>{t('semester')}</th>
                                    
                                    {rosterData.subjects.map(subjectName => (
                                        <th key={subjectName} className={thStyle}>{subjectName}</th>
                                    ))}
                                    
                                    <th className={thStyle}>{t('total')}</th>
                                    <th className={thStyle}>{t('average')}</th>
                                    <th className={`${thStyle} bg-yellow-100`}>{t('rank')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {rosterData.roster.map(student => ([
                                    // Row 1: First Semester
                                    <tr key={`${student.studentId}-1`} className="hover:bg-blue-50">
                                        <td rowSpan="3" className={`${tdStyle} bg-blue-50 font-mono text-gray-500`}>{student.studentId}</td>
                                        <td rowSpan="3" className={`${tdStyle} text-left font-bold text-gray-900`}>
                                            <Link to={`/students/${student._id}`}>{student.fullName}</Link>
                                        </td>
                                        <td rowSpan="3" className={tdStyle}>{student.gender.charAt(0)}</td>
                                        <td rowSpan="3" className={tdStyle}>{student.age}</td>
                                        
                                        <td className={semLabelStyle}>{t('sem_1_short')}</td>
                                        
                                        {rosterData.subjects.map(subject => (
                                            <td key={`${subject}-1`} className={tdStyle}>{student.firstSemester.scores[subject] || '-'}</td>
                                        ))}
                                        
                                        <td className={`${tdStyle} bg-gray-50 font-bold`}>{student.firstSemester.total}</td>
                                        <td className={`${tdStyle} bg-gray-50 font-bold`}>{student.firstSemester.average}</td>
                                        <td className={`${tdStyle} bg-yellow-50 font-bold`}>{student.rank1st}</td>
                                    </tr>,

                                    // Row 2: Second Semester
                                    <tr key={`${student.studentId}-2`} className="hover:bg-blue-50 border-b border-gray-300">
                                        <td className={semLabelStyle}>{t('sem_2_short')}</td>
                                        
                                        {rosterData.subjects.map(subject => (
                                            <td key={`${subject}-2`} className={tdStyle}>{student.secondSemester.scores[subject] || '-'}</td>
                                        ))}
                                        
                                        <td className={`${tdStyle} bg-gray-50 font-bold`}>{student.secondSemester.total}</td>
                                        <td className={`${tdStyle} bg-gray-50 font-bold`}>{student.secondSemester.average}</td>
                                        <td className={`${tdStyle} bg-yellow-50 font-bold`}>{student.rank2nd}</td>
                                    </tr>,

                                    // Row 3: Subject Average (Summary)
                                    <tr key={`${student.studentId}-avg`} className="bg-gray-100 border-b-2 border-gray-400">
                                        <td className={`${semLabelStyle} bg-gray-200 text-black uppercase`}>{t('subject_average')}</td>
                                        
                                        {rosterData.subjects.map(subject => (
                                            <td key={`${subject}-avg`} className={`${tdStyle} font-bold text-blue-900`}>
                                                {typeof student.subjectAverages[subject] === 'number' ? student.subjectAverages[subject] : '-'}
                                            </td>
                                        ))}
                                        
                                        <td className={`${tdStyle} bg-gray-300 font-black`}>{(student.overallTotal || 0)}</td>
                                        <td className={`${tdStyle} bg-gray-300 font-black`}>{(student.overallAverage || 0)}</td>
                                        <td className={`${tdStyle} bg-yellow-200 font-black border-2 border-yellow-400`}>{student.overallRank}</td>
                                    </tr>
                                ]))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RosterPage;