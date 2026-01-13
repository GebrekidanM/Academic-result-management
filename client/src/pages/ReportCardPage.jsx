import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import studentService from '../services/studentService';
import gradeService from '../services/gradeService';
import behavioralReportService from '../services/behavioralReportService';
import rankService from '../services/rankService';

const ReportCardPage = () => {
    const { id } = useParams();

    // --- STATE ---
    const [student, setStudent] = useState(null);
    const [allGrades, setAllGrades] = useState([]);
    const [allReports, setAllReports] = useState([]);
    const [rank1stSem, setRank1stSem] = useState('-');
    const [rank2ndSem, setRank2ndSem] = useState('-');
    const [overallRank, setOverallRank] = useState('-');
    const [loading, setLoading] = useState(true);
    const [reportType, setReportType] = useState('year'); 
    const [academicYear, setAcademicYear] = useState('');

    // --- MOCK SCHOOL INFO ---
    const schoolInfo = {
        name: "Freedom KG & Primary School",
        logo: "/frfr.jpg", // Using a larger placeholder for watermark
        address: "Addis Ababa, Bole Sub-city",
        phone: "+251 911 23 45 67",
        email: "info@futuregen.edu.et",
        website: "www.freedomschool.pro.et"
    };

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchAllData = async () => {
            try {
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

                if (studentData) {
                    const firstReport = reportsData.find(r => r.semester === 'First Semester');
                    const secondReport = reportsData.find(r => r.semester === 'Second Semester');
                    const academicYear = firstReport?.academicYear || reportsData[0]?.academicYear || new Date().getFullYear().toString();
                    const gradeLevel = studentData.gradeLevel;
                    setAcademicYear(academicYear);

                    const rankPromises = [];
                    rankPromises.push(rankService.getRank({ studentId: id, academicYear, semester: 'First Semester', gradeLevel }));
                    
                    if (secondReport) {
                        rankPromises.push(rankService.getRank({ studentId: id, academicYear, semester: 'Second Semester', gradeLevel }));
                    } else {
                        rankPromises.push(Promise.resolve(null));
                    }
                    rankPromises.push(rankService.getOverallRank({ studentId: id, academicYear, gradeLevel }));

                    const [rank1Res, rank2Res, overallRankRes] = await Promise.allSettled(rankPromises);
                    if (rank1Res.status === 'fulfilled') setRank1stSem(rank1Res.value.data.rank);
                    if (rank2Res.status === 'fulfilled' && rank2Res.value) setRank2ndSem(rank2Res.value.data.rank);
                    if (overallRankRes.status === 'fulfilled') setOverallRank(overallRankRes.value.data.rank);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [id]);

    // --- CALCULATIONS ---
    const processedResults = useMemo(() => {
        if (!allGrades || allGrades.length === 0) return [];
        const subjectMap = new Map();
        allGrades.forEach(grade => {
            if (!grade.subject) return;
            const subjectId = grade.subject._id;
            const subjectName = grade.subject.name;
            if (!subjectMap.has(subjectId)) subjectMap.set(subjectId, { subjectName, firstSemester: null, secondSemester: null });
            const entry = subjectMap.get(subjectId);
            if (grade.semester === 'First Semester') entry.firstSemester = grade.finalScore;
            else if (grade.semester === 'Second Semester') entry.secondSemester = grade.finalScore;
        });
        subjectMap.forEach(subject => {
            const scores = [subject.firstSemester, subject.secondSemester].filter(s => s !== null && s !== undefined);
            subject.average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
        });
        return Array.from(subjectMap.values());
    }, [allGrades]);

    const finalSummary = useMemo(() => {
        if (processedResults.length === 0) return null;
        const count1st = processedResults.filter(s => s.firstSemester !== null).length;
        const count2nd = processedResults.filter(s => s.secondSemester !== null).length;
        
        const summary = {
            total1st: processedResults.reduce((sum, sub) => sum + (sub.firstSemester || 0), 0),
            total2nd: processedResults.reduce((sum, sub) => sum + (sub.secondSemester || 0), 0),
        };
        summary.average1st = count1st > 0 ? summary.total1st / count1st : 0;
        summary.average2nd = count2nd > 0 ? summary.total2nd / count2nd : 0;
        summary.overallTotal = (summary.total1st + summary.total2nd);
        summary.overallAverage = (summary.average1st + summary.average2nd) / 2;
        return summary;
    }, [processedResults]);

    const firstSemesterReport = allReports.find(r => r.semester === 'First Semester');
    const secondSemesterReport = allReports.find(r => r.semester === 'Second Semester');
    const EVALUATION_AREAS = ["Punctuality", "Attendance", "Responsibility", "Respect", "Cooperation", "Initiative"];
    const displayYear = firstSemesterReport?.academicYear || academicYear || new Date().getFullYear();

    const calculateAge = (dob) => {
        if (!dob) return '-';
        const birthYear = parseInt(String(dob).split('-')[0]);
        const currentYear = new Date().getFullYear();
        return isNaN(birthYear) ? '-' : (currentYear - 8) - birthYear;
    };

    const getReportTitle = () => {
        if (reportType === 'sem1') return "SEMESTER 1";
        if (reportType === 'sem2') return "SEMESTER 2";
        return "ANNUAL REPORT";
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-xl font-bold text-slate-900">Generating Booklet...</div>;

    return (
        <div className="min-h-screen bg-gray-200 flex flex-col items-center p-8 font-sans print:p-0 print:m-0 print:bg-white print:block">
            
            {/* --- STYLES --- */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Oswald:wght@300;500;700&family=Playfair+Display:wght@700&display=swap');
                
                .font-montserrat { font-family: 'Montserrat', sans-serif; }
                .font-oswald { font-family: 'Oswald', sans-serif; }
                .font-playfair { font-family: 'Playfair Display', serif; }
                
                .shape-arrow-cover { clip-path: polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%); }
                .shape-slant-cover { clip-path: polygon(20% 0, 100% 0, 100% 100%, 0% 100%); }

                .lined-bg {
                    background-image: repeating-linear-gradient(transparent, transparent 24px, #cbd5e1 25px);
                    line-height: 25px;
                }

                @media print {
                    @page { 
                        size: A4 landscape; 
                        margin: 0mm !important; 
                    }
                    html, body, #root { 
                        width: 100%;
                        height: 100%;
                        margin: 0 !important; 
                        padding: 0 !important; 
                        overflow: visible !important;
                    }
                    .no-print { display: none !important; }
                    .print-wrapper {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 297mm;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .bg-slate-900 { background-color: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; }
                    .bg-cyan-500 { background-color: #06b6d4 !important; color: white !important; -webkit-print-color-adjust: exact; }
                    .text-cyan-500 { color: #06b6d4 !important; -webkit-print-color-adjust: exact; }
                    .bg-cyan-50 { background-color: #ecfeff !important; -webkit-print-color-adjust: exact; }
                    .print-break { page-break-after: always; }
                }
            `}</style>

            {/* --- CONTROLS --- */}
            <div className="w-[297mm] flex justify-between items-center mb-6 no-print">
                <Link to={`/students/${id}`} className="text-slate-900 font-bold hover:underline">&larr; Back</Link>
                <div className="bg-white px-4 py-2 rounded-full shadow flex gap-4">
                    <span className="text-xs font-bold text-gray-400 uppercase self-center">View Mode:</span>
                    {['sem1', 'sem2', 'year'].map(type => (
                        <button key={type} onClick={() => setReportType(type)} className={`text-xs font-bold uppercase ${reportType === type ? 'text-cyan-600 underline' : 'text-gray-500'}`}>
                            {type === 'year' ? 'Annual' : type === 'sem1' ? 'Sem 1' : 'Sem 2'}
                        </button>
                    ))}
                </div>
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-full font-bold shadow hover:bg-cyan-600 transition flex items-center gap-2">
                    🖨️ Print Booklet
                </button>
            </div>

            {/* === PRINT WRAPPER START === */}
            <div className="print-wrapper">

                {/* ==================================================================================
                    SHEET 1: OUTER SHELL (BACK COVER + FRONT COVER)
                   ================================================================================== */}
                <div className="w-[297mm] h-[210mm] bg-white shadow-2xl flex overflow-hidden relative print:shadow-none print-break print:m-0 print:p-0">
                    
                    {/* --- BACK COVER (Left Half) --- */}
                    <div className="w-1/2 h-full bg-[#0f172a] text-white flex flex-col justify-center items-center p-12 text-center relative print:bg-[#0f172a]">
                         <div className="absolute top-0 left-0 w-full h-2 bg-[#06b6d4]"></div>
                         
                         <div className="w-24 h-24 mb-4 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-lg border-4 border-[#06b6d4]">
                             <img src={schoolInfo.logo} alt="Logo" className="w-full h-full object-contain" />
                         </div>

                         <h2 className="text-2xl font-montserrat font-bold tracking-widest mb-2 leading-tight">
                            {schoolInfo.name}
                         </h2>
                         <div className="w-16 h-1 bg-[#06b6d4] mb-6"></div>
                         
                         <p className="text-sm font-montserrat opacity-80 leading-relaxed mb-8 max-w-xs">
                            "Empowering the next generation with knowledge, character, and excellence. We are committed to fostering a supportive and innovative learning environment."
                         </p>

                         <div className="text-xs font-mono opacity-80 space-y-2">
                            <p>📍 {schoolInfo.address}</p>
                            <p>📞 {schoolInfo.phone}</p>
                            <p>✉️ {schoolInfo.email}</p>
                            <p>🌐 {schoolInfo.website}</p>
                         </div>
                    </div>

                    {/* --- FRONT COVER (Right Half) --- */}
                    <div className="w-1/2 h-full bg-white relative overflow-hidden flex flex-col justify-center p-8">
                        <div className="absolute top-0 right-[-20%] w-[60%] h-full bg-[#06b6d4] transform skew-x-[-15deg] opacity-20 print:bg-[#06b6d4]"></div>
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#0f172a] shape-slant opacity-10"></div>

                        <div className="relative z-10 text-right">
                            <h3 className="text-sm font-montserrat font-bold text-[#06b6d4] uppercase tracking-[0.3em] mb-2">Official Transcript</h3>
                            <h1 className="text-6xl font-oswald font-bold text-[#0f172a] leading-tight mb-2">
                                {getReportTitle()}<br/>
                                <span className="text-[#06b6d4]">CARD</span>
                            </h1>
                            <div className="inline-block bg-[#0f172a] text-white text-xl font-oswald font-bold px-6 py-2 transform -skew-x-12 mt-4 shadow-lg print:bg-[#0f172a]">
                                <span className="transform skew-x-12 inline-block">{displayYear}</span>
                            </div>
                        </div>

                        <div className="mt-16 border-r-4 border-[#06b6d4] pr-4 text-right">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Prepared For</p>
                            <h2 className="text-3xl font-montserrat font-bold text-[#0f172a] mt-1">{student?.fullName}</h2>
                            <p className="text-sm text-gray-600 mt-1 font-mono">ID: {student?.studentId}</p>
                            <p className="text-sm text-gray-600 font-bold uppercase">Grade {student?.gradeLevel}</p>
                        </div>
                    </div>

                    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] border-l border-dashed border-gray-300 no-print"></div>
                </div>


                {/* ==================================================================================
                    SHEET 2: INNER CONTENT (INSIDE LEFT + INSIDE RIGHT)
                   ================================================================================== */}
                <div className="w-[297mm] h-[210mm] bg-white shadow-2xl flex overflow-hidden relative print:shadow-none print:m-0 print:p-0">
                    
                    {/* --- INSIDE LEFT (Profile, Behavior, Parent Comment) --- */}
                    <div className="w-1/2 h-full bg-[#f8fafc] p-8 flex flex-col border-r border-gray-200 relative z-10">
                        
                        <div className="flex gap-4 items-center mb-6">
                            <div className="w-16 h-16 rounded-full border-4 border-[#06b6d4] overflow-hidden shadow-md shrink-0 bg-white">
                                {student?.imageUrl ? <img src={student.imageUrl} className="w-full h-full object-cover" alt="" /> : null}
                            </div>
                            <div>
                                <h2 className="text-xl font-montserrat font-bold text-[#0f172a]">{student?.fullName}</h2>
                                <div className="flex gap-2 text-xs font-bold text-gray-600 uppercase mt-1">
                                    <span className="bg-white px-2 py-1 rounded shadow-sm border border-gray-100">Grade {student?.gradeLevel}</span>
                                    <span className="bg-white px-2 py-1 rounded shadow-sm border border-gray-100">Age: {calculateAge(student?.dateOfBirth)}</span>
                                    <span className="bg-white px-2 py-1 rounded shadow-sm border border-gray-100">Sex: {student?.gender?.charAt(0)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-4">
                            <h3 className="text-[#06b6d4] text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#06b6d4]"></span> 
                                Behavioral Evaluation
                            </h3>
                            <table className="w-full text-xs border-collapse mb-2">
                                <thead>
                                    <tr className="text-gray-500 border-b border-gray-200">
                                        <th className="text-left font-bold pb-2">Trait</th>
                                        <th className="text-center font-bold pb-2 w-10">S1</th>
                                        <th className="text-center font-bold pb-2 w-10">S2</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {EVALUATION_AREAS.map((trait) => {
                                        const sem1Score = firstSemesterReport?.evaluations.find(e => e.area === trait)?.result || '-';
                                        const sem2Score = secondSemesterReport?.evaluations.find(e => e.area === trait)?.result || '-';
                                        return (
                                            <tr key={trait} className="border-b border-gray-50 last:border-0">
                                                <td className="py-2 text-gray-800 font-medium">{trait}</td>
                                                <td className="text-center text-[#0f172a] font-bold">{sem1Score}</td>
                                                <td className="text-center text-[#0f172a] font-bold">{sem2Score}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            <div className="text-[10px] text-gray-500 text-center border-t border-gray-100 pt-1">
                                <strong>Key:</strong> E=Excellent, VG=Very Good, G=Good, NI=Needs Improvement
                            </div>
                        </div>

                        <div className="mb-4">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-1">Teacher's Note</h4>
                            <div className="p-3 bg-cyan-50 rounded text-xs text-cyan-900 leading-snug italic border border-cyan-100 h-20 print:bg-cyan-50">
                                {reportType === 'sem1' ? firstSemesterReport?.teacherComment : reportType === 'sem2' ? secondSemesterReport?.teacherComment : (secondSemesterReport?.teacherComment || firstSemesterReport?.teacherComment || "No comments available.")}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-1">Parent's Feedback & Signature</h4>
                            <div className="flex-1 bg-white border border-gray-300 rounded relative overflow-hidden">
                                <div className="lined-bg w-full h-full absolute top-0 left-0"></div>
                            </div>
                        </div>
                    </div>

                    {/* --- INSIDE RIGHT (Grades & Signatures) --- */}
                    <div className="w-1/2 h-full bg-white p-8 flex flex-col relative overflow-hidden">
                        
                        {/* === WATERMARK === */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                            <img 
                                src={schoolInfo.logo} 
                                alt="Watermark" 
                                className="w-[80%] opacity-[0.07] grayscale transform -rotate-12"
                            />
                        </div>

                        <div className="relative z-10 flex-1 flex flex-col">
                            <div className="flex justify-between items-end mb-4 border-b-2 border-[#0f172a] pb-2">
                                <h2 className="text-xl font-black text-[#0f172a] uppercase">Academic Results</h2>
                                <span className="text-xs font-bold bg-[#06b6d4] text-white px-2 py-0.5 rounded print:bg-[#06b6d4]">{getReportTitle()}</span>
                            </div>

                            <div className="flex-1 overflow-hidden">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-900 text-white uppercase text-[10px] print:bg-slate-900">
                                            <th className="py-2 px-3 text-left w-1/2 rounded-l">Subject</th>
                                            {(reportType === 'sem1' || reportType === 'year') && <th className="py-2 text-center">Sem 1</th>}
                                            {(reportType === 'sem2' || reportType === 'year') && <th className="py-2 text-center">Sem 2</th>}
                                            {reportType === 'year' && <th className="py-2 text-center rounded-r bg-[#06b6d4]">Avg</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {processedResults.map((r, i) => (
                                            <tr key={i} className="border-b border-gray-100 hover:bg-cyan-50">
                                                <td className="py-1.5 px-3 font-bold text-slate-700">{r.subjectName}</td>
                                                {(reportType === 'sem1' || reportType === 'year') && <td className="text-center text-slate-700 font-medium">{r.firstSemester ?? '-'}</td>}
                                                {(reportType === 'sem2' || reportType === 'year') && <td className="text-center text-slate-700 font-medium">{r.secondSemester ?? '-'}</td>}
                                                {reportType === 'year' && <td className="text-center font-bold text-[#06b6d4] bg-cyan-50/30">{r.average ? r.average.toFixed(0) : '-'}</td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex gap-4 mt-4 mb-4">
                                <div className="flex-1 bg-[#0f172a] text-white p-2 rounded text-center print:bg-[#0f172a]">
                                    <p className="text-[10px] uppercase font-bold opacity-70">Rank</p>
                                    <p className="text-2xl font-bold">{reportType === 'sem1' ? rank1stSem : reportType === 'sem2' ? rank2ndSem : overallRank}</p>
                                </div>
                                <div className="flex-1 border border-gray-200 p-2 rounded text-center bg-white/50">
                                    <p className="text-[10px] uppercase font-bold text-gray-500">Total</p>
                                    <p className="text-xl font-bold text-[#0f172a]">{reportType === 'sem1' ? finalSummary?.total1st.toFixed(0) : reportType === 'sem2' ? finalSummary?.total2nd.toFixed(0) : finalSummary?.overallTotal.toFixed(0)}</p>
                                </div>
                                <div className="flex-1 border border-gray-200 p-2 rounded text-center bg-white/50">
                                    <p className="text-[10px] uppercase font-bold text-gray-500">Avg</p>
                                    <p className="text-xl font-bold text-[#0f172a]">{reportType === 'sem1' ? finalSummary?.average1st.toFixed(1) : reportType === 'sem2' ? finalSummary?.average2nd.toFixed(1) : finalSummary?.overallAverage.toFixed(1)}</p>
                                </div>
                            </div>

                            <div className="mb-6 border-t border-gray-100 pt-4">
                                <div className="flex items-end gap-2 text-sm text-[#0f172a]">
                                    <span className="font-bold">Promoted to Grade:</span> 
                                    <span className="flex-1 border-b-2 border-gray-400 border-dotted"></span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end">
                                {['Homeroom', 'Director', 'Parent'].map((role) => (
                                    <div key={role} className="text-center w-1/3">
                                        <div className="h-4 border-b border-gray-300 w-2/3 mx-auto"></div>
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 block">{role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] border-l border-dashed border-gray-300 no-print"></div>
                </div>

            </div>
            {/* === PRINT WRAPPER END === */}

        </div>
    );
};

export default ReportCardPage;