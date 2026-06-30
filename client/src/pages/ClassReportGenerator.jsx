import React, { useState, useEffect } from 'react';
import studentService from '@shared/services/studentService';
import reportCardService from '@shared/services/reportCardService';
import ReportCardDocument from '../components/ReportCardDocument';
import rankService from '@shared/services/rankService';
import { schoolInfoData } from '@shared/utils/schoolInfoData';

const ClassReportGenerator = () => {
    const [reportType, setReportType] = useState('year');
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
        setProgress(10); // የሂደት አሞሌ ማስጀመሪያ

        try {
            const res = await reportCardService.getClassReports(selectedGrade);
            let reports = res.data.data;

            if (!reports || reports.length === 0) {
                alert("No reports found for this class.");
                setLoading(false);
                setProgress(0);
                return;
            }

            setProgress(40);

            const academicYear = reports[0]?.studentInfo?.academicYear || '2018';
            const batchRanks = await rankService.getClassRanksBatch(selectedGrade, academicYear);

            setProgress(70);

            const reportsWithRank = reports.map((report) => {
                const dbStudentId = report.studentInfo?._id; 
                
                const rankData = (dbStudentId && batchRanks[dbStudentId]) 
                    ? batchRanks[dbStudentId] 
                    : { sem1: '-', sem2: '-', overall: '-' };

                return { ...report, rank: rankData };
            });

            setClassReportData(reportsWithRank);
            setProgress(100);

        } catch (err) {
            console.error("Error generating reports:", err);
            alert("Error generating reports");
            setProgress(0);
        } finally {
            setTimeout(() => {
                setLoading(false);
            }, 500);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Oswald:wght@300;500;700&family=Playfair+Display:wght@700&display=swap');
                @media print {
                    @page { size: A4 landscape; margin: 0mm !important; }
                    html, body { width: 100%; height: 100%; margin: 0 !important; padding: 0 !important; }
                    .no-print, nav, .sidebar, .sidebar-wrapper, .navbar, header, button, .sidebar-menu, .header-container {display: none !important;}
                    .print-wrapper { position: absolute; top: 0; left: 0; width: 100%; }
                    .print-break { page-break-after: always; }
                    .bg-slate-900 { background-color: #0f172a !important; -webkit-print-color-adjust: exact; }
                    .bg-cyan-500 { background-color: #06b6d4 !important; -webkit-print-color-adjust: exact; }
                }
            `}</style>

            {/* --- CONTROLS --- */}
            <div className="bg-white shadow p-4 mb-8 no-print">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
                    <h1 className="text-xl font-bold text-slate-800">🖨️ Batch Report Generator</h1>
                    
                    <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
                        <select 
                            className="border p-2 rounded w-full md:w-48 bg-white font-semibold text-slate-700" 
                            value={selectedGrade} 
                            onChange={(e) => setSelectedGrade(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">-- Select Grade --</option>
                            {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>

                        <div className="bg-gray-100 p-1 rounded-lg flex border">
                            {['sem1', 'sem2', 'year'].map(type => (
                                <button 
                                    key={type} 
                                    onClick={() => setReportType(type)} 
                                    className={`px-3 py-1.5 text-xs font-bold rounded uppercase transition-all ${reportType === type ? 'bg-slate-900 text-white shadow' : 'text-gray-500 hover:text-slate-900'}`}
                                >
                                    {type === 'year' ? 'Annual' : type === 'sem1' ? 'Sem 1' : 'Sem 2'}
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={handleGenerate} 
                            disabled={loading || !selectedGrade}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded font-bold disabled:opacity-50 transition-colors"
                        >
                            {loading ? `Generating... ${progress}%` : "Generate All"}
                        </button>

                        {classReportData.length > 0 && !loading && (
                            <button 
                                onClick={() => window.print()} 
                                className="bg-slate-900 hover:bg-slate-850 text-white px-6 py-2 rounded font-bold shadow-lg transition-colors"
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
                <div className="flex h-64 items-center justify-center text-gray-400 no-print font-medium">
                    {loading ? "Generating Reports..." : "Select a grade and click Generate to see reports."}
                </div>
            )}
        </div>
    );
};

export default ClassReportGenerator;