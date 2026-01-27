import React, { useState, useEffect } from 'react';
import studentService from '../services/studentService';
import reportCardService from '../services/reportCardService';
import ReportCardDocument from '../components/ReportCardDocument';
import rankService from '../services/rankService';
import {schoolInfoData} from '../utils/schoolInfoData';

const ClassReportGenerator = () => {
    
    // --- STATE ---
    const [reportType, setReportType] = useState('year'); // State is HERE now
    const [availableGrades, setAvailableGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [classReportData, setClassReportData] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

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

        try {
            // 1. SINGLE CALL TO BACKEND
            const res = await reportCardService.getClassReports(selectedGrade);
            let reports = res.data.data;

            if (!reports || reports.length === 0) {
                alert("No reports found for this class.");
                setLoading(false);
                return;
            }

            // 2. Fetch Ranks for the whole list (Still needs to be done)
            // Optimization: We can do this in parallel now that we have the list
            const reportsWithRank = await Promise.all(reports.map(async (report) => {
                const { studentId, classId, academicYear } = report.studentInfo;
                try {
                    // This is still 1 call per student, but it's fast. 
                    // (Ideally, backend rank controller should also support batch, but this works for now)
                    const rankData = await rankService.getRankByStudent(studentId, classId, academicYear);
                    return { ...report, rank: rankData };
                } catch (e) {
                    return { ...report, rank: { sem1: '-', sem2: '-', overall: '-' } };
                }
            }));

            setClassReportData(reportsWithRank);

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