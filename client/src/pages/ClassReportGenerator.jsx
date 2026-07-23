// src/pages/ClassReportGenerator.js
import React, { useState, useEffect, useMemo } from 'react';
import studentService from '@shared/services/studentService';
import reportCardService from '@shared/services/reportCardService';
import ReportCardDocument from '../components/ReportCardDocument';
import rankService from '@shared/services/rankService';
import { schoolInfoData } from '@shared/utils/schoolInfoData';

// Programmatic Ethiopian Calendar (E.C.) year calculator
const getEthiopianYear = (gregorianDate = new Date()) => {
    const year = gregorianDate.getFullYear();
    const month = gregorianDate.getMonth(); // 0-indexed (8 is September)
    const day = gregorianDate.getDate();

    let ethiopianYear = year - 8;
    if (month > 8 || (month === 8 && day >= 11)) {
        ethiopianYear = year - 7;
    }
    return ethiopianYear;
};

const ClassReportGenerator = () => {
    const [reportType, setReportType] = useState('year');
    const [selectedGrade, setSelectedGrade] = useState('');
    
    // Active Academic Year State (defaults to current calculated EC year)
    const [selectedYear, setSelectedYear] = useState(getEthiopianYear().toString());
    
    const [allStudents, setAllStudents] = useState([]); // Master enrollment timeline list
    const [classReportData, setClassReportData] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    // Generate unique years for dropdown selection (e.g., last 3 years to next year)
    const availableYears = useMemo(() => {
        const currentEC = getEthiopianYear();
        return Array.from({ length: 5 }, (_, i) => (currentEC - 3 + i).toString()).sort((a, b) => b.localeCompare(a));
    }, []);

    // Load master list of all students including academicHistory on page load
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Calls GET /api/students/getallstudents
                const res = await studentService.getAllStudentsForRe();
                setAllStudents(res.data?.data || res.data || []);
            } catch (err) {
                console.error("Failed to load students:", err);
            }
        };
        loadInitialData();
    }, []);

    // --- NEW: DYNAMIC GRADE LEVEL EXTRACTOR ---
    // Scans all students and extracts grade levels that existed in the selectedYear [1]
    const availableGrades = useMemo(() => {
        if (!selectedYear || allStudents.length === 0) return [];
        
        const gradeSet = new Set();
        
        allStudents.forEach(student => {
            // 1. If the student's active year matches, add their active grade Level [1]
            if (String(student.year) === String(selectedYear)) {
                if (student.gradeLevel) gradeSet.add(student.gradeLevel);
            }
            
            // 2. If the student has historical records matching the year, add that grade Level [1]
            if (Array.isArray(student.academicHistory)) {
                student.academicHistory.forEach(history => {
                    if (String(history.year) === String(selectedYear)) {
                        if (history.gradeAtThatTime) gradeSet.add(history.gradeAtThatTime);
                    }
                });
            }
        });

        // Convert the set to an alphabetically sorted array
        return Array.from(gradeSet).sort((a, b) => 
            a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
        );
    }, [allStudents, selectedYear]);

    // SAFE-GUARD: Reset the selected grade if it does not exist in the newly selected year's directory [1]
    useEffect(() => {
        if (selectedGrade && !availableGrades.includes(selectedGrade)) {
            setSelectedGrade('');
            setClassReportData([]);
        }
    }, [selectedYear, availableGrades, selectedGrade]);

    const handleGenerate = async () => {
        if (!selectedGrade || !selectedYear) return;
        
        setLoading(true);
        setClassReportData([]);
        setProgress(10); 

        try {
            // Passes both Grade Level and Selected Year to the backend
            const res = await reportCardService.getClassReports(selectedGrade, selectedYear);
            let reports = res.data.data;

            if (!reports || reports.length === 0) {
                alert(`No reports found for ${selectedGrade} in the year ${selectedYear} E.C.`);
                setLoading(false);
                setProgress(0);
                return;
            }

            setProgress(40);

            // Fetches batch ranks using the explicitly selected academic year
            const batchRanks = await rankService.getClassRanksBatch(selectedGrade, selectedYear);

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
            alert("Error generating reports. Make sure student grades and ranks are recorded.");
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
                        
                        {/* Year Selector Dropdown (Must be selected first) */}
                        <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Year:</span>
                            <select 
                                className="border p-2 rounded w-full md:w-36 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500" 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(e.target.value)}
                                disabled={loading}
                            >
                                {availableYears.map(yr => (
                                    <option key={yr} value={yr}>{yr} E.C.</option>
                                ))}
                            </select>
                        </div>

                        {/* Grade Level Selector (Dynamically filtered by selectedYear) [1] */}
                        <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Class:</span>
                            <select 
                                className="border p-2 rounded w-full md:w-48 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500" 
                                value={selectedGrade} 
                                onChange={(e) => setSelectedGrade(e.target.value)}
                                disabled={loading || availableGrades.length === 0}
                            >
                                <option value="">-- Select Grade --</option>
                                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>

                        {/* Semester Option Buttons */}
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
                            disabled={loading || !selectedGrade || !selectedYear}
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
                    {loading ? "Generating Reports..." : "Select academic year and grade level, then click Generate."}
                </div>
            )}
        </div>
    );
};

export default ClassReportGenerator;