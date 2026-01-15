import React, { useState, useEffect } from 'react';
import studentService from '../services/studentService';
import reportCardService from '../services/reportCardService';
import ReportCardDocument from '../components/ReportCardDocument';

const ClassReportGenerator = () => {
    const [reportType, setReportType] = useState('year'); 
    // --- STATE ---
    const [availableGrades, setAvailableGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [classReportData, setClassReportData] = useState([]); // Array of full report objects
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    // --- SCHOOL INFO ---
    const schoolInfoData = {
        name: "FREEDOM KG & PRIMARY SCHOOL",
        logo: "/frfr.jpg",
        address: "TuluDimtu-Sheger City, Ethiopia",
        phone: "+251 911 23 45 67",
        email: "info@futuregen.edu.et",
        website: "www.freedomschool.pro.et"
    };

    // 1. Load available grades on mount
    useEffect(() => {
        const loadGrades = async () => {
            try {
                const res = await studentService.getAllStudents();
                const students = res.data?.data || [];
                const uniqueGrades = [...new Set(students.map(s => s.gradeLevel))].sort();
                setAvailableGrades(uniqueGrades);
            } catch (err) {
                console.error(err);
            }
        };
        loadGrades();
    }, []);

    // 2. Fetch All Reports for Selected Grade
    const handleGenerate = async () => {
        if (!selectedGrade) return;
        setLoading(true);
        setClassReportData([]);
        setProgress(0);

        try {
            // A. Get list of students in this grade
            const res = await studentService.getAllStudents();
            const allStudents = res.data?.data || [];
            const studentsInGrade = allStudents.filter(s => s.gradeLevel === selectedGrade);

            if (studentsInGrade.length === 0) {
                alert("No students found in this grade.");
                setLoading(false);
                return;
            }

            // B. Fetch detailed report for EACH student
            const reports = [];
            for (let i = 0; i < studentsInGrade.length; i++) {
                const student = studentsInGrade[i];
                try {
                    // Fetch individual report
                    const reportRes = await reportCardService.getReportCardByStudent(student._id);
                    reports.push(reportRes.data);
                } catch (e) {
                    console.error(`Failed to fetch report for ${student.fullName}`);
                }
                // Update progress bar
                setProgress(Math.round(((i + 1) / studentsInGrade.length) * 100));
            }

            // C. Sort alphabetically or by ID if needed
            reports.sort((a, b) => a.studentInfo.fullName.localeCompare(b.studentInfo.fullName));

            setClassReportData(reports);

        } catch (err) {
            console.error(err);
            alert("Error generating reports");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            
            {/* --- GLOBAL PRINT STYLES --- */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Oswald:wght@300;500;700&family=Playfair+Display:wght@700&display=swap');
                
                .font-montserrat { font-family: 'Montserrat', sans-serif; }
                .font-oswald { font-family: 'Oswald', sans-serif; }
                .font-playfair { font-family: 'Playfair Display', serif; }
                .lined-bg { background-image: repeating-linear-gradient(transparent, transparent 24px, #cbd5e1 25px); line-height: 25px; }
                .shape-sidebar { clip-path: polygon(0 0, 75% 0, 100% 50%, 75% 100%, 0 100%); }
                .shape-slant { clip-path: polygon(20% 0, 100% 0, 100% 100%, 0% 100%); }

                @media print {
                    @page { size: A4 landscape; margin: 0mm !important; }
                    html, body { width: 100%; height: 100%; margin: 0 !important; padding: 0 !important; }
                    .no-print { display: none !important; }
                    .print-wrapper { position: absolute; top: 0; left: 0; width: 100%; }
                    .print-break { page-break-after: always; }
                    
                    /* Force Colors */
                    .bg-slate-900 { background-color: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; }
                    .bg-cyan-500 { background-color: #06b6d4 !important; color: white !important; -webkit-print-color-adjust: exact; }
                    .text-cyan-500 { color: #06b6d4 !important; -webkit-print-color-adjust: exact; }
                    .bg-cyan-50 { background-color: #ecfeff !important; -webkit-print-color-adjust: exact; }
                }
            `}</style>

            {/* --- CONTROLS (Hide on Print) --- */}
            <div className="bg-white shadow p-4 mb-8 no-print sticky top-16 z-50">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
                    <h1 className="text-xl font-bold text-slate-800">🖨️ Batch Report Generator</h1>
                    
                    <div className="flex gap-2 items-center w-full md:w-auto">
                        <select 
                            className="border p-2 rounded w-full md:w-48" 
                            value={selectedGrade} 
                            onChange={(e) => setSelectedGrade(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">-- Select Grade --</option>
                            {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>

                        <button 
                            onClick={handleGenerate} 
                            disabled={loading || !selectedGrade}
                            className="bg-slate-900 text-white px-6 py-2 rounded font-bold hover:bg-slate-700 disabled:opacity-50"
                        >
                            {loading ? `Fetching... ${progress}%` : "Generate All"}
                        </button>

                        {classReportData.length > 0 && !loading && (
                            <button 
                                onClick={() => window.print()} 
                                className="bg-cyan-600 text-white px-6 py-2 rounded font-bold hover:bg-cyan-700 shadow-lg animate-pulse"
                            >
                                Print {classReportData.length} Reports
                            </button>
                        )}
                    </div>
                </div>
                {loading && (
                    <div className="w-full bg-gray-200 h-2 mt-4 rounded overflow-hidden">
                        <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                )}
            </div>

            <div className="bg-white px-4 py-2 rounded-full shadow flex gap-4 justify-center mb-6 no-print max-w-md mx-auto">
                <span className="text-xs font-bold text-gray-400 uppercase self-center">View Mode:</span>
                {['sem1', 'sem2', 'year'].map(type => (
                    <button key={type} onClick={() => setReportType(type)} className={`text-xs font-bold uppercase ${reportType === type ? 'text-cyan-600 underline' : 'text-gray-500'}`}>
                        {type === 'year' ? 'Annual' : type === 'sem1' ? 'Sem 1' : 'Sem 2'}
                    </button>
                ))}
            </div>

            {/* --- PREVIEW / PRINT AREA --- */}
            {classReportData.length > 0 ? (
                <div className="print-wrapper flex flex-col items-center pb-20">
                    {classReportData.map((report, index) => (
                        <div key={index} className="w-[297mm] mb-10 print:mb-0">
                            {/* Pass data to reusable component */}
                            <ReportCardDocument 
                                reportData={report} 
                                schoolInfoData={schoolInfoData} 
                                reportType={reportType}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex h-64 items-center justify-center text-gray-400 no-print">
                    {loading ? "Generating Reports..." : "Select a grade and click Generate to see reports."}
                </div>
            )}

        </div>
    );
};

export default ClassReportGenerator;