import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; 
import rosterService from '../services/rosterService';
import authService from '../services/authService';

const RosterPage = () => {
    const { t } = useTranslation(); 
    const [currentUser] = useState(authService.getCurrentUser());
    const [gradeLevel, setGradeLevel] = useState(currentUser.homeroomGrade || ''); 
    const [academicYear, setAcademicYear] = useState('2018');
    const [rosterData, setRosterData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [homeroomTeacher, setHomeroomTeacher] = useState('');

     useEffect(() => {
        if (currentUser.role === 'teacher' && currentUser.homeroomGrade) {
            handleGenerateRoster();
        }
    }, [currentUser]);

    const handleGenerateRoster = async (e) => {
        if (e) e.preventDefault();
        
        if (!gradeLevel) {
            setError(t('error'));
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
    };

    const handlePrint = () => {
        const tableToPrint = document.getElementById('rosterTable');
        if (!tableToPrint) return;

        const printWindow = window.open('', '', 'height=800,width=1200');
        
        const htmlContent = `
            <html>
                <head>
                    <title>${t('roster_for')} ${gradeLevel}</title>
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
                        
                        /* Colors matching your React Component */
                        .bg-blue-200 { background-color: #bfdbfe !important; }
                        .bg-blue-50 { background-color: #eff6ff !important; }
                        .bg-gray-50 { background-color: #f9fafb !important; }
                        .bg-gray-100 { background-color: #f3f4f6 !important; }
                        .bg-gray-200 { background-color: #e5e7eb !important; }
                        .bg-gray-300 { background-color: #d1d5db !important; }
                        .bg-yellow-50 { background-color: #fefce8 !important; }
                        .bg-yellow-100 { background-color: #fef9c3 !important; }
                        .bg-yellow-200 { background-color: #fef08a !important; }

                        /* Text Colors */
                        .text-blue-900 { color: #1e3a8a !important; }
                        .text-gray-500 { color: #6b7280 !important; }
                        .text-gray-900 { color: #111827 !important; }
                        
                        /* Font Weights */
                        .font-bold { font-weight: bold; }
                        .font-black { font-weight: 900; }
                        .font-mono { font-family: monospace; }
                        
                        /* Specific Column Alignment */
                        .text-left { text-align: left !important; padding-left: 5px; }

                        .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${t('app_name')}</h1>
                        <p>${t('roster_for')} ${gradeLevel} - ${academicYear}</p>
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

    // --- Styles ---
    const textInput = "shadow-sm border rounded-lg py-2 px-3 w-full focus:ring-blue-500 focus:border-blue-500";
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
                        <div>
                            <label htmlFor="gradeLevel" className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('grade_level')}</label>
                            <input id="gradeLevel" type="text" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className={textInput}/>
                        </div>
                        <div>
                            <label htmlFor="academicYear" className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('academic_year')}</label>
                            <input id="academicYear" type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className={textInput} />
                        </div>
                        <button type="submit" className={submitButton} disabled={loading}>
                            {loading ? t('loading') : t('generate_roster')}
                        </button>
                        {rosterData && (
                            <button type="button" onClick={handlePrint} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg">
                                🖨️ {t('print_roster')}
                            </button>
                        )}
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
                                        <td rowSpan="3" className={`${tdStyle} text-left font-bold text-gray-900`}>{student.fullName}</td>
                                        <td rowSpan="3" className={tdStyle}>{student.gender.charAt(0)}</td>
                                        <td rowSpan="3" className={tdStyle}>{student.age}</td>
                                        
                                        <td className={semLabelStyle}>{t('sem_1_short')}</td>
                                        
                                        {rosterData.subjects.map(subject => (
                                            <td key={`${subject}-1`} className={tdStyle}>{student.firstSemester.scores[subject] || '-'}</td>
                                        ))}
                                        
                                        <td className={`${tdStyle} bg-gray-50 font-bold`}>{student.firstSemester.total.toFixed(0)}</td>
                                        <td className={`${tdStyle} bg-gray-50 font-bold`}>{student.firstSemester.average.toFixed(1)}</td>
                                        <td className={`${tdStyle} bg-yellow-50 font-bold`}>{student.rank1st}</td>
                                    </tr>,

                                    // Row 2: Second Semester
                                    <tr key={`${student.studentId}-2`} className="hover:bg-blue-50 border-b border-gray-300">
                                        <td className={semLabelStyle}>{t('sem_2_short')}</td>
                                        
                                        {rosterData.subjects.map(subject => (
                                            <td key={`${subject}-2`} className={tdStyle}>{student.secondSemester.scores[subject] || '-'}</td>
                                        ))}
                                        
                                        <td className={`${tdStyle} bg-gray-50 font-bold`}>{student.secondSemester.total.toFixed(0)}</td>
                                        <td className={`${tdStyle} bg-gray-50 font-bold`}>{student.secondSemester.average.toFixed(1)}</td>
                                        <td className={`${tdStyle} bg-yellow-50 font-bold`}>{student.rank2nd}</td>
                                    </tr>,

                                    // Row 3: Subject Average (Summary)
                                    <tr key={`${student.studentId}-avg`} className="bg-gray-100 border-b-2 border-gray-400">
                                        <td className={`${semLabelStyle} bg-gray-200 text-black uppercase`}>{t('subject_average')}</td>
                                        
                                        {rosterData.subjects.map(subject => (
                                            <td key={`${subject}-avg`} className={`${tdStyle} font-bold text-blue-900`}>
                                                {typeof student.subjectAverages[subject] === 'number' ? student.subjectAverages[subject].toFixed(1) : '-'}
                                            </td>
                                        ))}
                                        
                                        <td className={`${tdStyle} bg-gray-300 font-black`}>{(student.overallTotal || 0).toFixed(0)}</td>
                                        <td className={`${tdStyle} bg-gray-300 font-black`}>{(student.overallAverage || 0).toFixed(1)}</td>
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