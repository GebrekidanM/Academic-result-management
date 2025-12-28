import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
import rosterService from '../services/rosterService';
import subjectService from '../services/subjectService';
import authService from '../services/authService';
import userService from '../services/userService';

const SubjectRosterPage = () => {
    const { t } = useTranslation();
    const location = useLocation();

    // --- State ---
    const [currentUser] = useState(authService.getCurrentUser());
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(location.state?.subjectId || '');
    const [semester, setSemester] = useState('First Semester');
    const [academicYear, setAcademicYear] = useState('2018');
    const [rosterData, setRosterData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const currentSubjectDetails = subjects.find(s => s._id === selectedSubject) || {};

    // --- Load Subjects ---
    useEffect(() => {
        const loadSubjectsForRole = async () => {
            setError(null);
            try {
                let list = [];
                if (['admin', 'staff', 'principal'].includes(currentUser.role)) {
                    const response = await subjectService.getAllSubjects();
                    list = response.data.data;
                } else if (currentUser.role === 'teacher') {
                    const response = await userService.getProfile();
                    list = response.data.subjectsTaught?.map(assignment => assignment.subject).filter(Boolean) || [];
                }
                setSubjects(list);
            } catch (err) {
                setError(t('error'));
            }
        };
        loadSubjectsForRole();
    }, [currentUser.role, t]);

    // --- Auto Generate ---
    useEffect(() => {
        if (subjects.length > 0 && location.state?.subjectId) {
            handleGenerate();
        }
    }, [subjects, location.state]);
    
    const handleGenerate = async (e) => {
        if (e) e.preventDefault();
        if (!selectedSubject) return;
        setLoading(true);
        setError(null);
        setRosterData(null);
        try {
             if (!currentSubjectDetails._id) throw new Error("Subject not found.");
            const response = await rosterService.getSubjectRoster({ 
                gradeLevel: currentSubjectDetails.gradeLevel,
                subjectId: selectedSubject,
                semester,
                academicYear
            });
            setRosterData(response.data);
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        } 
        finally {
            setLoading(false);
        }
    };

    // --- HELPER: Get Color Class based on Score Percentage ---
    const getScoreStyle = (score, total) => {
        if (score === undefined || score === null || score === '-') return "text-gray-400";
        
        const numScore = Number(score);
        const percentage = (numScore / total) * 100;

        if (percentage >= 90) return "text-green-700 font-bold bg-green-50 print:text-green-900 print:bg-green-100"; // Excellent
        if (percentage >= 75) return "text-blue-700 font-bold print:text-blue-900";   // Very Good
        if (percentage >= 50) return "text-yellow-700 font-medium print:text-black";  // Average
        return "text-red-600 font-bold bg-red-50 print:text-red-700 print:bg-red-100"; // Fail
    };

    // --- UI Helpers ---
    const inputLabel = "block text-gray-700 text-sm font-bold mb-1";
    const formInput = "shadow-sm border border-gray-300 rounded-md py-2 px-3 w-full";
    const buttonPrimary = `bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;
    const buttonPrint = "bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-md transition-colors no-print";
    
    // Base Styles
    const thBase = "px-2 py-1 text-center text-xs font-bold uppercase border border-gray-400";
    const tdBase = "px-2 py-1 text-center text-sm border border-gray-300";

    return (
        <div className="bg-gray-100 min-h-screen p-6 font-sans print:bg-white print:p-0">
            
            {/* --- INJECT PRINT STYLES --- */}
            <style>{`
                @media print {
                    @page { 
                        size: A4 landscape; 
                        margin: 5mm; 
                    }
                    
                    .no-print, nav, button, .sidebar, header { display: none !important; }
                    
                    body, .min-h-screen { 
                        background-color: white !important; 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        width: 100% !important;
                    }

                    #printable-area {
                        width: 100% !important;
                    }
                    
                    table { 
                        width: 100% !important; 
                        border-collapse: collapse !important; 
                        font-size: 10px !important; 
                    }
                    
                    th, td { 
                        border: 1px solid black !important; 
                        padding: 4px !important; 
                        color: black !important;
                    }
                    
                    /* IMPORTANT: Forces background colors to show on paper */
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

                    .print-footer {
                        display: flex !important;
                        justify-content: space-between;
                        margin-top: 30px;
                        border-top: 2px solid black;
                        padding-top: 10px;
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            <div className="max-w-full mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
                
                {/* --- HEADER CONTROLS (Hidden on Print) --- */}
                <div className="p-6 border-b border-gray-200 no-print">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">{t('subject_detail')} / {t('class_roster')}</h2>
                        <Link to="/" className="text-blue-600 hover:underline text-sm font-bold">← {t('back')}</Link>
                    </div>

                    <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div>
                            <label className={inputLabel}>{t('subject')}</label>
                            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className={formInput} required>
                                <option value="">-- {t('select_subject')} --</option>
                                {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.gradeLevel})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={inputLabel}>{t('semester')}</label>
                            <select value={semester} onChange={e => setSemester(e.target.value)} className={formInput}>
                                <option value="First Semester">{t('sem_1')}</option>
                                <option value="Second Semester">{t('sem_2')}</option>
                            </select>
                        </div>
                        <div>
                            <label className={inputLabel}>{t('academic_year')}</label>
                            <input type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className={formInput} />
                        </div>
                        <button type="submit" className={buttonPrimary} disabled={!selectedSubject || loading}>
                            {loading ? t('loading') : t('view')}
                        </button>
                    </form>
                </div>

                {error && <div className="p-4 text-center text-red-500 bg-red-50 border-b no-print">{error}</div>}

                {/* --- PRINTABLE ROSTER --- */}
                {rosterData && (
                    <div id="printable-area" className="p-6 print:p-0">
                        
                        {/* Printable Header Card */}
                        <div className="mb-4 border-b-2 border-blue-900 pb-2">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h3 className="text-2xl font-bold text-blue-900 uppercase tracking-wide font-serif">
                                        {t('app_name')}
                                    </h3>
                                    <p className="text-sm text-gray-600 font-bold uppercase mt-1">
                                        {t('class_roster')} (ROSTER)
                                    </p>
                                </div>
                                <div className="text-right">
                                     <p className="text-sm font-bold text-gray-800">{currentSubjectDetails.name} ({currentSubjectDetails.gradeLevel})</p>
                                     <p className="text-xs text-gray-500">{semester} | {academicYear}</p>
                                </div>
                                <button onClick={() => window.print()} className={buttonPrint}>🖨️ {t('print')}</button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto print:overflow-visible">
                            <table className="min-w-full divide-y divide-gray-200 border-collapse border border-gray-400">
                                <thead className="bg-gray-100 print:bg-gray-200">
                                    <tr>
                                        <th rowSpan="2" className={`${thBase} bg-gray-200 w-10`}>#</th>
                                        <th rowSpan="2" className={`${thBase} bg-gray-200 w-24`}>{t('id_no')}</th>
                                        <th rowSpan="2" className={`${thBase} bg-gray-200 text-left w-56`}>{t('full_name')}</th>
                                        <th rowSpan="2" className={`${thBase} bg-gray-200 w-12`}>{t('gender')[0]}</th>
                                        <th rowSpan="2" className={`${thBase} bg-gray-200 w-12`}>{t('age')}</th>
                                        
                                        {/* Dynamic Month Headers */}
                                        {rosterData.sortedMonths.map(month => (
                                            <th key={month} colSpan={rosterData.assessmentsByMonth[month].length} className={`${thBase} bg-blue-100 text-blue-900 print:bg-gray-100`}>
                                                {month}
                                            </th>
                                        ))}
                                        
                                        <th rowSpan="2" className={`${thBase} bg-gray-300 text-black w-16`}>{t('total')}</th>
                                    </tr>
                                    <tr>
                                        {/* Assessment Sub-Headers */}
                                        {rosterData.sortedMonths.map(month => (
                                            rosterData.assessmentsByMonth[month].map(at => (
                                                <th key={at._id} className={`${thBase} bg-white font-normal text-[9px] text-gray-600`}>
                                                    {at.name} <br/> <span className="font-bold">({at.totalMarks})</span>
                                                </th>
                                            ))
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {rosterData.roster.map((student, idx) => (
                                        <tr key={student.studentId} className="odd:bg-white even:bg-gray-50 border-b border-gray-300">
                                            <td className={tdBase}>{idx + 1}</td>
                                            <td className={`${tdBase} font-mono text-xs text-gray-500`}>{student.studentId}</td>
                                            <td className={`${tdBase} text-left font-bold`}>{student.fullName}</td>
                                            <td className={tdBase}>{student.gender === 'Male' ? 'M' : 'F'}</td>
                                            <td className={tdBase}>{student.age}</td>
                                            
                                            {/* Scores with Conditional Coloring */}
                                            {rosterData.sortedMonths.map(month => (
                                                rosterData.assessmentsByMonth[month].map(at => (
                                                    <td 
                                                        key={at._id} 
                                                        className={`${tdBase} ${getScoreStyle(student.detailedScores[at._id], at.totalMarks)}`}
                                                    >
                                                        {student.detailedScores[at._id] !== undefined ? student.detailedScores[at._id] : '-'}
                                                    </td>
                                                ))
                                            ))}
                                            
                                            {/* Final Score (Always Bold) */}
                                            <td className={`${tdBase} font-black text-black bg-gray-100 print:bg-gray-200`}>
                                                {student.finalScore}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Footer */}
                        <div className="hidden print-footer text-xs font-bold text-black px-10 pt-4 mt-8">
                            <div className="text-center w-1/4">
                                <div className="border-b border-black mb-1 w-full h-8"></div>
                                {t('teacher_comment')}
                            </div>
                            <div className="text-center w-1/4">
                                <div className="border-b border-black mb-1 w-full h-8"></div>
                                {t('director_sign')}
                            </div>
                            <div className="text-center w-1/4">
                                <div className="border-b border-black mb-1 w-full h-8"></div>
                                {t('date')}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default SubjectRosterPage;