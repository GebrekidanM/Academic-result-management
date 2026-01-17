import React, { useState, useEffect } from 'react';
import studentService from '../services/studentService';
import reportCardService from '../services/reportCardService';
import ReportCardDocument from '../components/ReportCardDocument';
import rankService from '../services/rankService';

const ClassReportGenerator = () => {
    
    // --- STATE ---
    const [reportType, setReportType] = useState('year'); // State is HERE now
    const [availableGrades, setAvailableGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [classReportData, setClassReportData] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    // --- SCHOOL INFO ---
    const schoolInfoData = {
        name: "FREEDOM KG & PRIMARY SCHOOL",
        logo: "/frfr.jpg", // Ensure this image exists in public folder
        address: "TuluDimtu-Sheger City, Ethiopia",
        phone: "+251 911 23 45 67",
        email: "info@futuregen.edu.et",
        website: "www.freedomschool.pro.et"
    };

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

    const handleGenerate = async () => {
        if (!selectedGrade) return;
        setLoading(true);
        setClassReportData([]);
        setProgress(0);

        try {
            // 1. Get all students
            const res = await studentService.getAllStudents();
            const allStudents = res.data?.data || [];
            
            // 2. Filter by Grade
            const studentsInGrade = allStudents.filter(s => s.gradeLevel === selectedGrade);

            if (studentsInGrade.length === 0) {
                alert("No students found in this grade.");
                setLoading(false);
                return;
            }

            const reports = [];

            // 3. Loop through students
            for (let i = 0; i < studentsInGrade.length; i++) {
                const student = studentsInGrade[i];
                try {
                    // A. Fetch the Basic Report Card Data
                    const reportRes = await reportCardService.getReportCardByStudent(student._id);
                    const reportData = reportRes.data;

                    // --- RANK INTEGRATION START ---
                    
                    // B. Extract details needed for Rank Calculation
                    // (Assuming classId holds grade level like "Grade 1")
                    const gradeLevel = reportData.studentInfo.classId || selectedGrade; 
                    const academicYear = reportData.studentInfo.academicYear;

                    // C. Fetch Rank specifically for this student
                    // Note: This relies on the rankService.getRankByStudent we created earlier
                    let rankData = { sem1: '-', sem2: '-', overall: '-' }; // Default
                    
                    try {
                        rankData = await rankService.getRankByStudent(student._id, gradeLevel, academicYear);
                    } catch (rankError) {
                        console.warn(`Could not fetch rank for ${student.fullName}`, rankError);
                    }

                    // D. Merge Rank into the Report Data
                    reportData.rank = rankData;

                    // --- RANK INTEGRATION END ---

                    reports.push(reportData);

                } catch (e) {
                    console.error(`Failed to fetch report for ${student.fullName}`, e);
                }

                // Update Progress Bar
                setProgress(Math.round(((i + 1) / studentsInGrade.length) * 100));
            }

            // 4. Sort Alphabetically
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
            
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Oswald:wght@300;500;700&family=Playfair+Display:wght@700&display=swap');
                @media print {
                    @page { size: A4 landscape; margin: 0mm !important; }
                    html, body { width: 100%; height: 100%; margin: 0 !important; padding: 0 !important; }
                    .no-print { display: none !important; }
                    .print-wrapper { position: absolute; top: 0; left: 0; width: 100%; }
                    .print-break { page-break-after: always; }
                    .bg-slate-900 { background-color: #0f172a !important; -webkit-print-color-adjust: exact; }
                    .bg-cyan-500 { background-color: #06b6d4 !important; -webkit-print-color-adjust: exact; }
                }
            `}</style>

            {/* --- CONTROLS (Hidden on Print) --- */}
            <div className="bg-white shadow p-4 mb-8 no-print sticky top-0 z-5">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
                    <h1 className="text-xl font-bold text-slate-800">🖨️ Batch Report Generator</h1>
                    
                    <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
                        
                        {/* 1. Grade Selector */}
                        <select 
                            className="border p-2 rounded w-full md:w-48" 
                            value={selectedGrade} 
                            onChange={(e) => setSelectedGrade(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">-- Select Grade --</option>
                            {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>

                        {/* 2. Report Type Selector (Lifted Up!) */}
                        <div className="bg-gray-100 p-1 rounded-lg flex">
                            {['sem1', 'sem2', 'year'].map(type => (
                                <button 
                                    key={type} 
                                    onClick={() => setReportType(type)} 
                                    className={`px-3 py-1 text-xs font-bold rounded uppercase transition-colors ${reportType === type ? 'bg-slate-900 text-white shadow' : 'text-gray-500 hover:text-slate-900'}`}
                                >
                                    {type === 'year' ? 'Annual' : type === 'sem1' ? 'Sem 1' : 'Sem 2'}
                                </button>
                            ))}
                        </div>

                        {/* 3. Generate Button */}
                        <button 
                            onClick={handleGenerate} 
                            disabled={loading || !selectedGrade}
                            className="bg-cyan-600 text-white px-6 py-2 rounded font-bold hover:bg-cyan-700 disabled:opacity-50"
                        >
                            {loading ? `Fetching... ${progress}%` : "Generate All"}
                        </button>

                        {/* 4. Print Button */}
                        {classReportData.length > 0 && !loading && (
                            <button 
                                onClick={() => window.print()} 
                                className="bg-slate-900 text-white px-6 py-2 rounded font-bold hover:bg-slate-800 shadow-lg"
                            >
                                Print {classReportData.length} Cards
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

            {/* --- PREVIEW / PRINT AREA --- */}
            {classReportData.length > 0 ? (
                <div className="print-wrapper flex flex-col items-center pb-20">
                    {classReportData.map((report, index) => (
                        <div key={index} className="w-[297mm] mb-10 print:mb-0">
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