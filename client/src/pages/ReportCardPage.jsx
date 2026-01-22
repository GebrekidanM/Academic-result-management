import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import reportCardService from '../services/reportCardService';
import rankService from '../services/rankService';
import ReportCoverPage from './ReportCoverPage';

const SUBJECT_PRIORITY = [
    "አማርኛ",
    "ENGLISH",
    "ሒሳብ",
    "አካባቢ ሳይንስ",
    "አጠቃላይ ሳይንስ",
    "ግብረ ገብ",
    "የዜግነት ት/ት",
    "ህብረተሰብ"
];

const ReportCardPage = () => {
    const { id } = useParams();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reportType, setReportType] = useState('year'); 

    const schoolInfoData = {
        name: "FREEDOM KG & PRIMARY SCHOOL",
        logo: "/frfr.jpg",
        address: "TuluDimtu-Sheger City, Ethiopia",
        phone: "+251 911 23 45 67",
        email: "info@futuregen.edu.et",
        website: "www.freedomschool.pro.et"
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const reportResponse = await reportCardService.getReportCardByStudent(id);
                const reportData = reportResponse.data;

                const gradeLevel = reportData.studentInfo.classId; 
                const academicYear = reportData.studentInfo.academicYear;

                const rankData = await rankService.getRankByStudent(id, gradeLevel, academicYear);

                setReportData({
                    ...reportData,
                    rank: rankData
                });

            } catch (err) {
                setError("Could not load student data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

                console.log("response", reportData)
    
    // --- DATA TRANSFORMATION & SORTING ---
    const processedGrades = useMemo(() => {
        if (!reportData || !reportData.grades) return [];
        const sem1Grades = reportData.grades.sem1 || {};
        const sem2Grades = reportData.grades.sem2 || {};
        const allSubjects = new Set([...Object.keys(sem1Grades), ...Object.keys(sem2Grades)]);

        const gradesList = Array.from(allSubjects).map(subject => {
            const s1 = sem1Grades[subject];
            const s2 = sem2Grades[subject];
            let average = null;
            if (typeof s1 === 'number' && typeof s2 === 'number') average = (s1 + s2) / 2;
            else if (typeof s1 === 'number') average = s1;
            else if (typeof s2 === 'number') average = s2;

            return {
                subjectName: subject,
                firstSemester: s1 !== undefined ? s1 : '-',
                secondSemester: s2 !== undefined ? s2 : '-',
                average: average
            };
        });

        // --- CUSTOM SORTING LOGIC ---
        return gradesList.sort((a, b) => {
            const nameA = a.subjectName.trim();
            const nameB = b.subjectName.trim();

            const getIndex = (name) => {
                const idx = SUBJECT_PRIORITY.findIndex(p => p.toLowerCase() === name.toLowerCase());
                return idx === -1 ? Infinity : idx;
            };

            const indexA = getIndex(nameA);
            const indexB = getIndex(nameB);

            if (indexA !== indexB) {
                return indexA - indexB;
            }
            return nameA.localeCompare(nameB);
        });

    }, [reportData]);

    const getReportTitle = () => {
        if (reportType === 'sem1') return "SEMESTER 1";
        if (reportType === 'sem2') return "SEMESTER 2";
        return "ANNUAL REPORT";
    };

    const calculateAge = (dob) => {
        if (!dob) return '-';
        const birthYear = parseInt(String(dob).split('-')[0]);
        const currentYear = new Date().getFullYear();
        return isNaN(birthYear) ? '-' : (currentYear - 8) - birthYear;
    };
 
    console.log(processedGrades)
    // --- DESTRUCTURING (ADDED footerData for Absent/Conduct) ---
    const { 
        studentInfo = {}, 
        semester1 = {}, 
        semester2 = {}, 
        finalAverage = '-', 
        rank = { sem1: '-', sem2: '-', overall: '-' },
        behavior = {},
        footerData = { sem1: {}, sem2: {} }
    } = reportData || {};

    // --- NEW: Automated Teacher Comment Logic ---
    const getAutomatedComment = () => {
        let score = 0;
        if (reportType === 'sem1') score = semester1?.avg || 0;
        else if (reportType === 'sem2') score = semester2?.avg || 0;
        else score = finalAverage || 0;

        const numScore = Number(score);

        if (numScore >= 95) return "Excellent achievement! Keep up the outstanding work.";
        if (numScore >= 90) return "Very superior performance.";
        if (numScore >= 85) return "Superior performance.";
        if (numScore >= 80) return "Very good performance.";
        if (numScore >= 70) return "Good performance.";
        if (numScore >= 60) return "Satisfactory. More effort is needed.";
        if (numScore >= 50) return "Promoted, but needs significant improvement.";
        return "Not Promoted. Hard work is required next year.";
    };

    // Helper for Totals in Footer
    const currentTotal = () => {
        if (reportType === 'sem1') return semester1?.sum;
        if (reportType === 'sem2') return semester2?.sum;
        return (semester1?.sum || 0) + (semester2?.sum || 0);
    };

    const currentAvg = () => {
        if (reportType === 'sem1') return semester1?.avg;
        if (reportType === 'sem2') return semester2?.avg;
        return finalAverage;
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-xl font-bold text-slate-900">Loading Report...</div>;
    if (error) return <div className="flex h-screen items-center justify-center text-xl font-bold text-red-600">{error}</div>;
    if (!reportData) return <div className="flex h-screen items-center justify-center text-xl font-bold text-red-600">No Data Found</div>;

    return (
        <div className="min-h-screen bg-gray-200 flex flex-col items-center p-8 font-sans print:p-0 print:m-0 print:bg-white print:block">
            
            {/* --- CSS --- */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Oswald:wght@300;500;700&family=Playfair+Display:wght@700&display=swap');
                
                .font-montserrat { font-family: 'Montserrat', sans-serif; }
                .font-oswald { font-family: 'Oswald', sans-serif; }
                .font-playfair { font-family: 'Playfair Display', serif; }
                
                .lined-bg {
                    background-image: repeating-linear-gradient(transparent, transparent 24px, #cbd5e1 25px);
                    line-height: 25px;
                }

                @media print {
                    @page { size: A4 landscape; margin: 0mm !important; }
                    html, body, #root { width: 100%; height: 100%; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
                    .no-print { display: none !important; }
                    .print-wrapper { position: absolute; top: 0; left: 0; width: 297mm; margin: 0 !important; padding: 0 !important; }
                    .bg-slate-900 { background-color: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; }
                    .bg-cyan-500 { background-color: #06b6d4 !important; color: white !important; -webkit-print-color-adjust: exact; }
                    .text-cyan-500 { color: #06b6d4 !important; -webkit-print-color-adjust: exact; }
                    .bg-cyan-50 { background-color: #ecfeff !important; -webkit-print-color-adjust: exact; }
                    .print-break { page-break-after: always; }
                }
            `}</style>

            {/* --- CONTROLS --- */}
            <div className="w-[297mm] flex justify-between items-center mb-6 no-print">
                <Link to={`/students`} className="text-slate-900 font-bold hover:underline">&larr; Back</Link>
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

            {/* === PRINT WRAPPER === */}
            <div className="print-wrapper">

                {/* --- SHEET 1: COVER PAGE --- */}
                <div className="print-break">
                    <ReportCoverPage studentInfo={studentInfo} schoolInfo={schoolInfoData} getReportTitle={getReportTitle} />
                </div>

                {/* --- SHEET 2: INNER CONTENT --- */}
                <div className="w-[297mm] h-[210mm] bg-white shadow-2xl flex overflow-hidden relative print:shadow-none print:m-0 print:p-0">
                    
                    {/* --- INSIDE LEFT (Profile, Behavior, Comment) --- */}
                    <div className="w-1/2 h-full bg-[#f8fafc] p-8 flex flex-col border-r border-gray-200 relative z-10">
                        {/* Student Profile */}
                        <div className="flex gap-4 items-center mb-6">
                            <div className="w-20 h-20 rounded-full border-4 border-[#06b6d4] overflow-hidden shadow-md shrink-0 bg-white">
                                {studentInfo?.photoUrl ? <img src={studentInfo.photoUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-gray-200"></div>}
                            </div>
                            <div>
                                <h2 className="text-xl font-montserrat font-bold text-[#0f172a]">{studentInfo?.fullName || '...'}</h2>
                                <div className="flex gap-2 text-xs font-bold text-gray-600 uppercase mt-1">
                                    <span className="bg-white px-2 py-1 rounded shadow-sm border border-gray-100">{studentInfo?.classId || '-'}</span>
                                    <span className="bg-white px-2 py-1 rounded shadow-sm border border-gray-100">Age: {calculateAge(studentInfo?.dateOfBirth)}</span>
                                    <span className="bg-white px-2 py-1 rounded shadow-sm border border-gray-100">Sex: {studentInfo?.sex || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Behavior Table */}
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-4">
                            <h3 className="text-[#06b6d4] text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#06b6d4]"></span> Behavioral Evaluation
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
                                    {behavior.progress && behavior.progress.map((item, index) => (
                                        <tr key={index} className="border-b border-gray-50 last:border-0">
                                            <td className="py-2 text-gray-800 font-medium">{item.area}</td>
                                            <td className="text-center text-[#0f172a] font-bold">{item.sem1}</td>
                                            <td className="text-center text-[#0f172a] font-bold">{item.sem2}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="text-[10px] text-gray-500 text-center border-t border-gray-100 pt-1">
                                <strong>Key:</strong> E=Excellent, VG=Very Good, G=Good, NI=Needs Improvement
                            </div>
                        </div>

                        {/* Teacher's Note (AUTOMATED) */}
                        <div className="mb-4">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-1">Teacher's Note</h4>
                            <div className="p-3 bg-cyan-50 rounded text-xs text-cyan-900 leading-snug italic border border-cyan-100 h-20 print:bg-cyan-50 flex items-center">
                                {/* The automated comment is called here */}
                                "{getAutomatedComment()}"
                            </div>
                        </div>

                        {/* Parent's Feedback */}
                        <div className="flex-1 flex flex-col">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-1">Parent's Feedback & Signature</h4>
                            <div className="flex-1 bg-white border border-gray-300 rounded relative overflow-hidden">
                                <div className="lined-bg w-full h-full absolute top-0 left-0"></div>
                            </div>
                        </div>
                    </div>

                    {/* --- INSIDE RIGHT (Grades & Stats) --- */}
                    <div className="w-1/2 h-full bg-white p-8 flex flex-col relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                            <img src={schoolInfoData.logo} alt="Watermark" className="w-[80%] opacity-[0.04] grayscale transform -rotate-12"/>
                        </div>
                        <div className="relative z-10 flex-1 flex flex-col">
                            <div className="flex justify-between items-end mb-4 border-b-2 border-[#0f172a] pb-2">
                                <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{schoolInfoData.name}</h3>
                                    <h2 className="text-xl font-black text-[#0f172a] uppercase">Academic Results</h2>
                                </div>
                                <span className="text-xs font-bold bg-[#06b6d4] text-white px-2 py-0.5 rounded print:bg-[#06b6d4]">
                                    {getReportTitle()}
                                </span>
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
                                        {processedGrades.map((r, i) => (
                                            <tr key={i} className="border-b border-gray-100 hover:bg-cyan-50">
                                                <td className="py-1.5 px-3 font-bold text-slate-700">{r.subjectName}</td>
                                                {(reportType === 'sem1' || reportType === 'year') && <td className="text-center text-slate-700 font-medium">{r.firstSemester ?? '-'}</td>}
                                                {(reportType === 'sem2' || reportType === 'year') && <td className="text-center text-slate-700 font-medium">{r.secondSemester ?? '-'}</td>}
                                                {reportType === 'year' && <td className="text-center font-bold text-[#06b6d4] bg-cyan-50/30">{typeof r.average === 'number' ? r.average.toFixed(2) : '-'}</td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                    {/* --- NEW FOOTER: TOTAL, AVG, RANK, ABSENT, CONDUCT --- */}
                                    <tfoot>
                                        {/* 4. ABSENT (NEW) */}
                                        <tr className="bg-white border-t border-gray-300">
                                            <td className="py-2 px-3 text-right uppercase text-[9px] font-bold text-red-600 tracking-wider">Absent</td>
                                            {(reportType === 'sem1' || reportType === 'year') && <td className="text-center font-medium border-l border-gray-200">{footerData.sem1?.absent || '-'}</td>}
                                            {(reportType === 'sem2' || reportType === 'year') && <td className="text-center font-medium border-l border-gray-200">{footerData.sem2?.absent || '-'}</td>}
                                            {reportType === 'year' && <td className="text-center border-l border-gray-200 bg-gray-50">-</td>}
                                        </tr>
                                        {/* 5. CONDUCT (NEW) */}
                                        <tr className="bg-white border-t border-gray-200">
                                            <td className="py-2 px-3 text-right uppercase text-[9px] font-bold text-blue-900 tracking-wider">Conduct</td>
                                            {(reportType === 'sem1' || reportType === 'year') && <td className="text-center font-bold border-l border-gray-200">{footerData.sem1?.conduct || '-'}</td>}
                                            {(reportType === 'sem2' || reportType === 'year') && <td className="text-center font-bold border-l border-gray-200">{footerData.sem2?.conduct || '-'}</td>}
                                            {reportType === 'year' && <td className="text-center border-l border-gray-200 bg-gray-50">-</td>}
                                        </tr>
                                        {/* 1. TOTAL */}
                                        <tr className="bg-gray-50 border-t-2 border-slate-200 font-bold text-slate-800">
                                            <td className="py-2 px-3 text-right uppercase text-[9px] tracking-wider">Total Score</td>
                                            {(reportType === 'sem1' || reportType === 'year') && <td className="text-center border-l border-gray-200">{semester1?.sum || 0}</td>}
                                            {(reportType === 'sem2' || reportType === 'year') && <td className="text-center border-l border-gray-200">{semester2?.sum || 0}</td>}
                                            {reportType === 'year' && <td className="text-center border-l border-gray-200 text-[#0f172a]">{currentTotal()}</td>}
                                        </tr>
                                        {/* 2. AVERAGE */}
                                        <tr className="bg-gray-50 border-t border-gray-200 font-bold text-slate-800">
                                            <td className="py-2 px-3 text-right uppercase text-[9px] tracking-wider">Average</td>
                                            {(reportType === 'sem1' || reportType === 'year') && <td className="text-center border-l border-gray-200">{semester1?.avg || 0}</td>}
                                            {(reportType === 'sem2' || reportType === 'year') && <td className="text-center border-l border-gray-200">{semester2?.avg || 0}</td>}
                                            {reportType === 'year' && <td className="text-center border-l border-gray-200 text-[#0f172a]">{currentAvg()}</td>}
                                        </tr>
                                        {/* 3. RANK */}
                                        <tr className="bg-[#0f172a] text-white font-bold print:bg-[#0f172a] print:text-white">
                                            <td className="py-2 px-3 text-right uppercase text-[9px] tracking-wider">Rank</td>
                                            {(reportType === 'sem1' || reportType === 'year') && <td className="text-center border-l border-slate-600">{rank?.sem1 || '-'}</td>}
                                            {(reportType === 'sem2' || reportType === 'year') && <td className="text-center border-l border-slate-600">{rank?.sem2 || '-'}</td>}
                                            {reportType === 'year' && <td className="text-center border-l border-slate-600 bg-[#06b6d4]">{rank?.overall || '-'}</td>}
                                        </tr>
                                        
                                    </tfoot>
                                </table>
                            </div>

                            <div className="mb-6 border-t border-gray-100 pt-4 mt-4">
                                <div className="flex items-end gap-2 text-sm text-[#0f172a]">
                                    <span className="font-bold">Promoted to:</span> 
                                    <span className="flex-1 border-b-2 border-gray-400 border-dotted pl-2 font-mono font-bold">{studentInfo?.promotedTo || ""}</span>
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