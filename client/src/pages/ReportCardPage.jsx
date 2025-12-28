import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import Hook
import studentService from '../services/studentService';
import gradeService from '../services/gradeService';
import behavioralReportService from '../services/behavioralReportService';
import rankService from '../services/rankService';
import authService from '../services/authService';

const ReportCardPage = () => {
    const { t } = useTranslation(); // <--- Initialize Hook
    const { id } = useParams();
    
    // --- STATE ---
    const [student, setStudent] = useState(null);
    const [allGrades, setAllGrades] = useState([]);
    const [allReports, setAllReports] = useState([]);
    const [rank1stSem, setRank1stSem] = useState('-');
    const [rank2ndSem, setRank2ndSem] = useState('-');
    const [overallRank, setOverallRank] = useState('-');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- 1. DATA FETCHING ---
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Fetch Basic Data
                const [studentRes, gradesRes, reportsRes] = await Promise.all([
                    studentService.getStudentById(id),
                    gradeService.getGradesByStudent(id),
                    behavioralReportService.getReportsByStudent(id)
                ]);

                const studentData = studentRes.data.data;
                const reportsData = reportsRes.data.data;
                
                setStudent(studentData);
                setAllGrades(gradesRes.data.data);
                setAllReports(reportsData);

                // Fetch Ranks
                if (studentData) {
                    const firstReport = reportsData.find(r => r.semester === 'First Semester');
                    const secondReport = reportsData.find(r => r.semester === 'Second Semester');
                    const academicYear = firstReport?.academicYear || '2018'; 
                    const gradeLevel = studentData.gradeLevel;

                    const rankPromises = [];
                    
                    // Sem 1 Rank
                    rankPromises.push(rankService.getRank({ studentId: id, academicYear, semester: 'First Semester', gradeLevel }));
                    
                    // Sem 2 Rank
                    if (secondReport) {
                        rankPromises.push(rankService.getRank({ studentId: id, academicYear, semester: 'Second Semester', gradeLevel }));
                    } else {
                        rankPromises.push(Promise.resolve(null));
                    }
                    
                    // Overall Rank
                    rankPromises.push(rankService.getOverallRank({ studentId: id, academicYear, gradeLevel }));

                    const [rank1Res, rank2Res, overallRankRes] = await Promise.allSettled(rankPromises);

                    if (rank1Res.status === 'fulfilled') setRank1stSem(rank1Res.value.data.rank);
                    if (rank2Res.status === 'fulfilled' && rank2Res.value) setRank2ndSem(rank2Res.value.data.rank);
                    if (overallRankRes.status === 'fulfilled') setOverallRank(overallRankRes.value.data.rank);
                }
            } catch (err) {
                console.error(err);
                setError(t('error'));
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [id, t]);

    // --- 2. CALCULATIONS ---
    const processedResults = useMemo(() => {
        if (!allGrades || allGrades.length === 0) return [];
        const subjectMap = new Map();
        
        allGrades.forEach(grade => {
            if (!grade.subject) return; 

            const subjectId = grade.subject._id;
            const subjectName = grade.subject.name;
            
            if (!subjectMap.has(subjectId)) {
                subjectMap.set(subjectId, { subjectName, firstSemester: null, secondSemester: null });
            }
            
            const subjectEntry = subjectMap.get(subjectId);
            if (grade.semester === 'First Semester') subjectEntry.firstSemester = grade.finalScore;
            else if (grade.semester === 'Second Semester') subjectEntry.secondSemester = grade.finalScore;
        });

        // Calculate Averages
        subjectMap.forEach(subject => {
            const scores = [subject.firstSemester, subject.secondSemester].filter(s => s !== null && s !== undefined);
            subject.average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
        });

        return Array.from(subjectMap.values());
    }, [allGrades]);

    const finalSummary = useMemo(() => {
        if (processedResults.length === 0) return null;
        const summary = {
            total1st: processedResults.reduce((sum, sub) => sum + (sub.firstSemester || 0), 0),
            total2nd: processedResults.reduce((sum, sub) => sum + (sub.secondSemester || 0), 0),
        };
        
        const numSubjects = processedResults.length;
        summary.average1st = numSubjects > 0 ? summary.total1st / numSubjects : 0;
        summary.average2nd = numSubjects > 0 ? summary.total2nd / numSubjects : 0;
        summary.overallTotal = (summary.total1st + summary.total2nd); 
        summary.overallAverage = (summary.average1st + summary.average2nd) / 2;
        
        return summary;
    }, [processedResults]);

    // --- HELPERS ---
    const firstSemesterReport = allReports.find(r => r.semester === 'First Semester');
    const secondSemesterReport = allReports.find(r => r.semester === 'Second Semester');
    const EVALUATION_AREAS = ["Punctuality", "Attendance", "Responsibility", "Respect", "Cooperation", "Initiative", "Completes Work"];
    
    const calculateAge = (dob) => {
        if (!dob) return '-';
        const now = new Date();
        const gcYear = now.getFullYear();
        const gcMonth = now.getMonth(); 
        const gcDay = now.getDate();
        let currentEthYear = gcYear - 8;
        if (gcMonth > 8 || (gcMonth === 8 && gcDay >= 11)) {
            currentEthYear = gcYear - 7;
        }
        const birthYear = parseInt(String(dob).split('-')[0]);
        return isNaN(birthYear) ? '-' : currentEthYear - birthYear;
    };

    if (loading) return <div className="p-10 text-center">{t('loading')}</div>;
    if (error) return <div className="p-10 text-center text-red-600">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 print:bg-white print:p-0 print:block">
            
            {/* --- INJECT PRINT SETTINGS --- */}
            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .print-break { page-break-after: always; }
                    
                    /* Clean up Shadows/Borders for Print */
                    .shadow-2xl { box-shadow: none !important; border: 1px solid #000 !important; }
                }
            `}</style>

            {/* Controls */}
            <div className="w-[210mm] flex justify-between mb-4 no-print">
                <Link to={`/students/${id}`} className="text-blue-900 font-bold hover:underline">&larr; {t('back')}</Link>
                <button onClick={() => window.print()} className="bg-blue-900 text-white px-4 py-2 rounded font-bold hover:bg-blue-800">
                    🖨️ {t('print')}
                </button>
            </div>

            {/* ===== PAGE 1: ACADEMICS ===== */}
            <div className="bg-white w-[210mm] min-h-[297mm] p-[10mm] shadow-2xl mb-8 print:shadow-none print:mb-0 print:w-full print:h-full print-break">
                
                {/* Header */}
                <div className="text-center border-b-4 border-double border-blue-900 pb-4 mb-6">
                    <h1 className="text-2xl font-serif font-bold text-blue-900 uppercase tracking-wide">
                        {t('app_name')}
                    </h1>
                    <p className="text-xs text-gray-600 mt-1">Addis Ababa, Ethiopia | OFFICIAL REPORT CARD</p>
                </div>

                {/* Student Profile */}
                <div className="flex gap-4 bg-gray-50 border border-gray-300 p-4 rounded-lg mb-6">
                    <div className="w-[90px] h-[110px] bg-gray-200 border-2 border-white shadow-sm overflow-hidden shrink-0">
                        {student?.imageUrl ? <img src={student.imageUrl} className="w-full h-full object-cover" alt="" /> : null}
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 w-full text-[11px]">
                        <div className="flex justify-between border-b border-dotted border-gray-400">
                            <span className="font-bold text-blue-900">{t('full_name')}:</span> 
                            <span className="font-mono font-bold text-black">{student?.fullName}</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted border-gray-400">
                            <span className="font-bold text-blue-900">{t('id_no')}:</span> 
                            <span className="font-mono font-bold text-black">{student?.studentId}</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted border-gray-400">
                            <span className="font-bold text-blue-900">{t('grade')}:</span> 
                            <span className="font-mono font-bold text-black">{student?.gradeLevel}</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted border-gray-400">
                            <span className="font-bold text-blue-900">{t('academic_year')}:</span> 
                            <span className="font-mono font-bold text-black">{firstSemesterReport?.academicYear || '2018'}</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted border-gray-400">
                            <span className="font-bold text-blue-900">{t('age')}:</span> 
                            <span className="font-mono font-bold text-black">{calculateAge(student?.dateOfBirth)}</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted border-gray-400">
                            <span className="font-bold text-blue-900">{t('gender')}:</span> 
                            <span className="font-mono font-bold text-black">{t(student?.gender)}</span>
                        </div>
                    </div>
                </div>

                {/* Academic Table */}
                <h3 className="text-lg font-serif font-bold text-blue-900 border-b-2 border-gray-200 mb-2">{t('academics')}</h3>
                <table className="w-full border-collapse border border-gray-400 text-[11px] mb-6">
                    <thead>
                        <tr className="bg-blue-900 text-white uppercase print:bg-blue-900 print:text-white">
                            <th className="border border-black p-2 text-left w-1/3">{t('subject')}</th>
                            <th className="border border-black p-2">{t('sem_1')}</th>
                            <th className="border border-black p-2">{t('sem_2')}</th>
                            <th className="border border-black p-2">{t('average')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedResults.map((r, i) => (
                            <tr key={i} className="text-center hover:bg-gray-50">
                                <td className="border border-gray-400 p-1 text-left font-bold pl-2">{r.subjectName}</td>
                                <td className="border border-gray-400 p-1">{r.firstSemester ?? '-'}</td>
                                <td className="border border-gray-400 p-1">{r.secondSemester ?? '-'}</td>
                                <td className="border border-gray-400 p-1 font-bold">{r.average ? r.average.toFixed(1) : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="font-bold bg-gray-100 text-center print:bg-gray-100">
                            <td className="border border-gray-400 p-2 text-left pl-2 text-blue-900">{t('total')}</td>
                            <td className="border border-gray-400 p-2">{finalSummary?.total1st.toFixed(0)}</td>
                            <td className="border border-gray-400 p-2">{finalSummary?.total2nd.toFixed(0)}</td>
                            <td className="border border-gray-400 p-2">{finalSummary?.overallTotal.toFixed(0)}</td>
                        </tr>
                        <tr className="font-bold bg-gray-100 text-center print:bg-gray-100">
                            <td className="border border-gray-400 p-2 text-left pl-2 text-blue-900">{t('average')}</td>
                            <td className="border border-gray-400 p-2">{finalSummary?.average1st.toFixed(1)}</td>
                            <td className="border border-gray-400 p-2">{finalSummary?.average2nd.toFixed(1)}</td>
                            <td className="border border-gray-400 p-2">{finalSummary?.overallAverage.toFixed(1)}</td>
                        </tr>
                        {/* Rank Row Highlighted */}
                        <tr className="bg-yellow-600 text-white font-bold text-center print:bg-yellow-600 print:text-white">
                            <td className="border border-black p-2 text-left pl-2">{t('rank')}</td>
                            <td className="border border-black p-2">{rank1stSem}</td>
                            <td className="border border-black p-2">{rank2ndSem}</td>
                            <td className="border border-black p-2">{overallRank}</td>
                        </tr>
                    </tfoot>
                </table>

                {/* Footer */}
                <div className="mt-auto border-t-2 border-gray-300 pt-4 flex justify-between text-xs font-bold text-gray-700">
                    <div>{t('promoted_to')}: _______________________</div>
                    <div>{t('date')}: _______________________</div>
                </div>
            </div>

            {/* ===== PAGE 2: BEHAVIOR ===== */}
            <div className="bg-white w-[210mm] min-h-[297mm] p-[10mm] shadow-2xl print:shadow-none print:w-full print:h-full print:m-0">
                <div className="text-center border-b border-gray-300 mb-6 pb-2">
                    <h2 className="text-lg font-bold text-gray-700">{student?.fullName} - {student?.studentId}</h2>
                </div>

                <div className="flex gap-8">
                    {/* Left Column */}
                    <div className="flex-1">
                        <h3 className="font-serif font-bold text-blue-900 border-b border-gray-300 mb-2 text-sm uppercase">{t('behavioral_traits')}</h3>
                        <table className="w-full border-collapse border border-gray-400 text-[10px]">
                            <thead>
                                <tr className="bg-blue-900 text-white print:bg-blue-900 print:text-white">
                                    <th className="border border-black p-1 text-left pl-2">Trait</th>
                                    <th className="border border-black p-1">{t('sem_1')}</th>
                                    <th className="border border-black p-1">{t('sem_2')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {EVALUATION_AREAS.map(trait => (
                                    <tr key={trait} className="text-center">
                                        <td className="border border-gray-400 p-1 text-left pl-2">{trait}</td>
                                        <td className="border border-gray-400 p-1">{firstSemesterReport?.evaluations.find(e => e.area === trait)?.result ?? '-'}</td>
                                        <td className="border border-gray-400 p-1">{secondSemesterReport?.evaluations.find(e => e.area === trait)?.result ?? '-'}</td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-100 font-bold print:bg-gray-100">
                                    <td className="border border-gray-400 p-1 text-left pl-2">{t('conduct')}</td>
                                    <td className="border border-gray-400 p-1">{firstSemesterReport?.conduct || '-'}</td>
                                    <td className="border border-gray-400 p-1">{secondSemesterReport?.conduct || '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="mt-2 p-2 bg-gray-100 text-[9px] border border-gray-300 print:bg-gray-100">
                            <strong>Key:</strong> E=Excellent, VG=Very Good, G=Good, NI=Needs Improvement
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="border border-gray-300 p-2 rounded">
                            <h4 className="text-[10px] font-bold text-blue-900 uppercase border-b border-dotted border-gray-400 mb-1">{t('teacher_comment')} ({t('sem_1')})</h4>
                            <div className="h-6 border-b border-dotted border-gray-400 mb-1 font-mono text-xs">{firstSemesterReport?.teacherComment}</div>
                            <div className="h-6 border-b border-dotted border-gray-400"></div>
                        </div>
                        <div className="border border-gray-300 p-2 rounded">
                            <h4 className="text-[10px] font-bold text-blue-900 uppercase border-b border-dotted border-gray-400 mb-1">{t('teacher_comment')} ({t('sem_2')})</h4>
                            <div className="h-6 border-b border-dotted border-gray-400 mb-1 font-mono text-xs">{secondSemesterReport?.teacherComment}</div>
                            <div className="h-6 border-b border-dotted border-gray-400"></div>
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <div className="mt-8 flex justify-between px-4">
                    <div className="text-center w-1/3">
                        <div className="border-b border-black h-8 mb-1"></div>
                        <span className="text-[10px] font-bold">{t('homeroom_teacher')}</span>
                    </div>
                    <div className="text-center w-1/3">
                        <div className="border-b border-black h-8 mb-1"></div>
                        <span className="text-[10px] font-bold">{t('director_sign')}</span>
                    </div>
                    <div className="text-center w-1/3">
                        <div className="border-b border-black h-8 mb-1"></div>
                        <span className="text-[10px] font-bold">{t('parent_sign')}</span>
                    </div>
                </div>

                {/* Message */}
                <div className="mt-auto bg-orange-50 border-l-4 border-yellow-600 p-3 text-[10px] text-justify rounded print:bg-orange-50">
                    <h5 className="font-bold text-yellow-700 mb-1">Message to Parents / ለወላጆች መልእክት</h5>
                    <p className="mb-2">The above report card primarily focuses on your child's behavioral development in various aspects. Please review this carefully and support your child at home.</p>
                    <p className="font-serif">በሰርተፍኬት ላይ የሰፈረው ውጤት የልጅዎ የጠባይ እድገት እና ለውጥ በተለየ ምልከታ እና ምዘና መሰረት የተገለፀ ነው። ውጤቱን በአፅኖት ተመለክተው በቤት ውስጥ ክትትል እንዲያደርጉ እንጠይቃለን።</p>
                </div>
            </div>
        </div>
    );
};

export default ReportCardPage;