import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import studentService from '@shared/services/studentService';
import analyticsService from '@shared/services/analyticsService';
import * as XLSX from 'xlsx';

function getCurrentAcademicYear() {
    const today = new Date();
    const gregYear = today.getFullYear();
    const gregMonth = today.getMonth() + 1;
    return gregMonth >= 9 ? gregYear - 7 : gregYear - 8;
}

const isKindergarten = (gradeLevel) => {
    if (!gradeLevel) return false;
    return /^(kg|nursery|pre)/i.test(gradeLevel);
};

const MatrixTable = ({ title, statusData, totals }) => {
    const thStyle = "p-1.5 border border-slate-400 text-center align-middle text-xs font-black uppercase";
    const subThStyle = "p-1 border border-slate-400 text-center text-[9px] font-bold bg-slate-50 text-slate-600";
    const tdStyle = "p-1 border border-slate-300 text-center text-xs font-bold text-slate-700";

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-6 overflow-x-auto print:p-0 print:border-none print:shadow-none animate-slide-up space-y-4">
            <div className="border-b pb-2 mb-2 no-print flex justify-between items-center">
                <h3 className="text-md font-black text-slate-800 uppercase">{title}</h3>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{statusData.length} Classes Found</span>
            </div>
            <table className="min-w-full border-collapse border border-slate-400">
                <thead className="bg-[#f1f5f9] text-slate-800 text-center font-black">
                    <tr>
                        <th rowSpan="2" className={`${thStyle} w-24 bg-slate-200`}>GRADE LEVEL</th>
                        <th rowSpan="2" className={`${thStyle} w-40 bg-slate-200 text-left`}>SUBJECT</th>
                        <th colSpan="3" className={`${thStyle} bg-slate-100`}>ENROLLED STUDENTS</th>
                        <th colSpan="3" className={`${thStyle} bg-slate-100`}>EXAM SITTING STUDENTS</th>
                        <th colSpan="4" className={`${thStyle} bg-red-50 text-red-700`}>&lt; 50% (A)</th>
                        <th colSpan="4" className={`${thStyle} bg-amber-50 text-amber-700`}>50 - 64 (B)</th>
                        <th colSpan="4" className={`${thStyle} bg-yellow-50 text-yellow-700`}>65 - 79 (C)</th>
                        <th colSpan="4" className={`${thStyle} bg-blue-50 text-blue-700`}>80 - 89 (D)</th>
                        <th colSpan="4" className={`${thStyle} bg-green-50 text-green-700`}>&gt;= 90 (E)</th>
                    </tr>
                    <tr>
                        <th className={subThStyle}>M</th><th className={subThStyle}>F</th><th className={`${subThStyle} font-black`}>T</th>
                        <th className={subThStyle}>M</th><th className={subThStyle}>F</th><th className={`${subThStyle} font-black`}>T</th>
                        
                        <th className={subThStyle}>M</th><th className={subThStyle}>F</th><th className={subThStyle}>T</th><th className="bg-red-100 border border-gray-400 p-0.5 text-center text-[9px] font-black">%</th>
                        <th className={subThStyle}>M</th><th className={subThStyle}>F</th><th className={subThStyle}>T</th><th className="bg-amber-100 border border-gray-400 p-0.5 text-center text-[9px] font-black">%</th>
                        <th className={subThStyle}>M</th><th className={subThStyle}>F</th><th className={subThStyle}>T</th><th className="bg-yellow-100 border border-gray-400 p-0.5 text-center text-[9px] font-black">%</th>
                        <th className={subThStyle}>M</th><th className={subThStyle}>F</th><th className={subThStyle}>T</th><th className="bg-blue-100 border border-gray-400 p-0.5 text-center text-[9px] font-black">%</th>
                        <th className={subThStyle}>M</th><th className={subThStyle}>F</th><th className={subThStyle}>T</th><th className="bg-green-100 border border-gray-400 p-0.5 text-center text-[9px] font-black">%</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 bg-white text-xs">
                    {statusData.map((gradeData, gIdx) => (
                        <React.Fragment key={gIdx}>
                            {gradeData.subjects.map((sub, sIdx) => (
                                <tr key={sIdx} className="bg-yellow-50/20 hover:bg-yellow-100/50 text-[10px] font-bold text-slate-700">
                                    {sIdx === 0 && (
                                        <td rowSpan={gradeData.subjects.length + 1} className="border border-slate-400 p-1 text-center font-black bg-slate-100 text-slate-800 border-r-2 border-r-slate-400 whitespace-nowrap">
                                            {gradeData.gradeLevel}
                                        </td>
                                    )}
                                    <td className="border border-slate-300 p-1 text-left whitespace-nowrap font-black">{sub.subject}</td>
                                    
                                    <td className="border border-slate-300 p-1 text-center font-normal">{sub.enrolled.m}</td>
                                    <td className="border border-slate-300 p-1 text-center font-normal">{sub.enrolled.f}</td>
                                    <td className="border border-slate-300 p-1 text-center font-black bg-slate-100">{sub.enrolled.t}</td>

                                    <td className="border border-slate-300 p-1 text-center font-normal">{sub.sitting.m}</td>
                                    <td className="border border-slate-300 p-1 text-center font-normal">{sub.sitting.f}</td>
                                    <td className="border border-slate-300 p-1 text-center font-black bg-slate-100">{sub.sitting.t}</td>

                                    <td className="border border-slate-300 p-1 text-center font-normal">{sub.under50.m || '-'}</td>
                                    <td className="border border-slate-300 p-1 text-center font-normal">{sub.under50.f || '-'}</td>
                                    <td className="border border-slate-300 p-1 text-center font-semibold bg-red-50">{sub.under50.t || '-'}</td>
                                    <td className="border border-slate-300 p-1 text-center font-black bg-blue-100/40 text-blue-700">{sub.under50.pct}%</td>

                                    <td className="border border-slate-300 p-1 text-center font-normal">{sub.between50And64.m || '-'}</td>
                                    <td className="border border-slate-300 p-1 text-center font-normal">{sub.between50And64.f || '-'}</td>
                                    <td className="border border-slate-300 p-1 text-center font-semibold bg-amber-50">{sub.between50And64.t || '-'}</td>
                                    <td className="border border-slate-300 p-1 text-center font-black bg-blue-100/40 text-blue-700">{sub.between50And64.pct}%</td>

                                    <td className="border border-slate-300 p-1 text-center font-normal">{sub.between65And79.m || '-'}</td>
                                    <td className="border border-slate-300 p-1 text-center font-normal">{sub.between65And79.f || '-'}</td>
                                    <td className="border border-slate-300 p-1 text-center font-semibold bg-yellow-50">{sub.between65And79.t || '-'}</td>
                                    <td className="border border-slate-300 p-1 text-center font-black bg-blue-100/40 text-blue-700">{sub.between65And79.pct}%</td>

                                    <td className="border border-slate-300 p-1 text-center font-normal">{sub.between80And89.m || '-'}</td>
                                    <td className="border border-slate-300 p-1 text-center font-normal">{sub.between80And89.f || '-'}</td>
                                    <td className="border border-slate-300 p-1 text-center font-semibold bg-blue-50">{sub.between80And89.t || '-'}</td>
                                    <td className="border border-slate-300 p-1 text-center font-black bg-blue-100/40 text-blue-700">{sub.between80And89.pct}%</td>

                                    <td className="border border-slate-300 p-1 text-center font-normal">{sub.above90.m || '-'}</td>
                                    <td className="border border-slate-300 p-1 text-center font-normal">{sub.above90.f || '-'}</td>
                                    <td className="border border-slate-300 p-1 text-center font-semibold bg-green-50">{sub.above90.t || '-'}</td>
                                    <td className="border border-slate-300 p-1 text-center font-black bg-blue-100/40 text-blue-700">{sub.above90.pct}%</td>
                                </tr>
                            ))}

                            <tr className="bg-green-600 text-white text-[10px] font-black border-t-2 border-slate-400 print:bg-green-600 print:text-white">
                                <td className="border border-slate-400 p-1 text-left uppercase whitespace-nowrap bg-green-700">Total</td>
                                
                                <td className="border border-slate-400 p-1 text-center">{gradeData.totalRow.enrolled.m}</td>
                                <td className="border border-slate-400 p-1 text-center">{gradeData.totalRow.enrolled.f}</td>
                                <td className="border border-slate-400 p-1 text-center bg-green-800 text-white font-black">{gradeData.totalRow.enrolled.t}</td>

                                <td className="border border-slate-400 p-1 text-center">{gradeData.totalRow.sitting.m}</td>
                                <td className="border border-slate-400 p-1 text-center">{gradeData.totalRow.sitting.f}</td>
                                <td className="border border-slate-400 p-1 text-center bg-green-800 text-white font-black">{gradeData.totalRow.sitting.t}</td>

                                <td className="border border-slate-400 p-1 text-center">{gradeData.totalRow.under50.m || '-'}</td>
                                <td className="border border-slate-400 p-1 text-center">{gradeData.totalRow.under50.f || '-'}</td>
                                <td className="border border-slate-400 p-1 text-center bg-green-800 text-white">{gradeData.totalRow.under50.t || '-'}</td>
                                <td className="border border-slate-400 p-1 text-center font-black bg-blue-900 text-white">{gradeData.totalRow.under50.pct}%</td>

                                <td className="border border-slate-400 p-1 text-center">{gradeData.totalRow.between50And64.m || '-'}</td>
                                <td className="border border-slate-400 p-1 text-center">{gradeData.totalRow.between50And64.f || '-'}</td>
                                <td className="border border-slate-400 p-1 text-center bg-green-800 text-white">{gradeData.totalRow.between50And64.t || '-'}</td>
                                <td className="border border-slate-400 p-1 text-center font-black bg-blue-900 text-white">{gradeData.totalRow.between50And64.pct}%</td>

                                <td className="border border-slate-400 p-1 text-center">{gradeData.totalRow.between65And79.m || '-'}</td>
                                <td className="border border-slate-400 p-1 text-center">{gradeData.totalRow.between65And79.f || '-'}</td>
                                <td className="border border-slate-400 p-1 text-center bg-green-800 text-white">{gradeData.totalRow.between65And79.t || '-'}</td>
                                <td className="border border-slate-400 p-1 text-center font-black bg-blue-900 text-white">{gradeData.totalRow.between65And79.pct}%</td>

                                <td className="border border-slate-400 p-1 text-center">{gradeData.totalRow.between80And89.m || '-'}</td>
                                <td className="border border-slate-400 p-1 text-center">{gradeData.totalRow.between80And89.f || '-'}</td>
                                <td className="border border-slate-400 p-1 text-center bg-green-800 text-white">{gradeData.totalRow.between80And89.t || '-'}</td>
                                <td className="border border-slate-400 p-1 text-center font-black bg-blue-900 text-white">{gradeData.totalRow.between80And89.pct}%</td>

                                <td className="border border-slate-400 p-1 text-center">{gradeData.totalRow.above90.m || '-'}</td>
                                <td className="border border-slate-400 p-1 text-center">{gradeData.totalRow.above90.f || '-'}</td>
                                <td className="border border-slate-400 p-1 text-center bg-green-800 text-white">{gradeData.totalRow.above90.t || '-'}</td>
                                <td className="border border-slate-400 p-1 text-center font-black bg-blue-900 text-white">{gradeData.totalRow.above90.pct}%</td>
                            </tr>
                        </React.Fragment>
                    ))}

                    <tr className="bg-slate-900 text-white font-black uppercase border-t-4 border-slate-700 print:bg-slate-900 text-[10px]">
                        <td colSpan="2" className="p-3 border border-slate-800 text-left bg-slate-950">Grand Total</td>
                        <td className="p-2 border border-slate-800 text-center bg-slate-850">👨 {totals.under50.m + totals.between50And64.m + totals.between65And79.m + totals.between80And89.m + totals.above90.m}</td>
                        <td className="p-2 border border-slate-800 text-center bg-slate-850">👩 {totals.under50.f + totals.between50And64.f + totals.between65And79.f + totals.between80And89.f + totals.above90.f}</td>
                        <td className="p-2 border border-slate-800 text-center bg-slate-850 bg-cyan-700 text-white font-black">{totals.grandTotal}</td>
                        <td colSpan="20" className="p-2 text-center text-[#06b6d4] font-black tracking-wider">
                            Total Enrolled: {totals.grandTotal} Students (👨 {totals.totalMale} Male • 👩 {totals.totalFemale} Female)
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

const RegionalPerformancePage = () => {
    const { t } = useTranslation();
    const currentYear = getCurrentAcademicYear().toString();

    // --- STATE ---
    const [availableGrades, setAvailableGrades] = useState([]); 
    const [selectedGrade, setSelectedGrade] = useState(''); 
    const [activeTab, setActiveTab] = useState('grade'); // kg, grade
    const [semester, setSemester] = useState('First Semester');
    const [academicYear, setAcademicYear] = useState(currentYear);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState(null);

    const activeProgram = 'oromo_1_6'; 

    useEffect(() => {
        const loadGrades = async () => {
            try {
                const res = await studentService.getAllStudents();
                const students = res.data?.data || [];
                const uniqueGrades = [...new Set(students.map(s => s.gradeLevel))].sort(
                    (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
                );
                setAvailableGrades(uniqueGrades);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadGrades();
    }, []);

    const fetchRegionalReport = async () => {
        setFetching(true);
        setError(null);
        try {
            const res = await analyticsService.getRegionalPerformance(activeTab, semester, academicYear);
            setReportData(res.data.data || []);
        } catch (err) {
            console.error(err);
            setError("Failed to load regional matrix. Make sure you are online.");
        } finally {
            setFetching(false);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegionalReport();
    }, [activeTab, semester, academicYear]);

    const { kgMatrix, gradeMatrix } = useMemo(() => {
        const kg = [];
        const grade = [];
        reportData.forEach(row => {
            if (isKindergarten(row.gradeLevel)) {
                kg.push(row);
            } else {
                grade.push(row);
            }
        });
        return { kgMatrix: kg, gradeMatrix: grade };
    }, [reportData]);

    const calculateTotals = (data) => {
        const totals = {
            under50: { m: 0, f: 0, t: 0 },
            between50And64: { m: 0, f: 0, t: 0 },
            between65And79: { m: 0, f: 0, t: 0 },
            between80And89: { m: 0, f: 0, t: 0 },
            above90: { m: 0, f: 0, t: 0 }
        };

        data.forEach(row => {
            totals.under50.m += row.totalRow.under50.m;
            totals.under50.f += row.totalRow.under50.f;
            totals.under50.t += row.totalRow.under50.t;

            totals.between50And64.m += row.totalRow.between50And64.m;
            totals.between50And64.f += row.totalRow.between50And64.f;
            totals.between50And64.t += row.totalRow.between50And64.t;

            totals.between65And79.m += row.totalRow.between65And79.m;
            totals.between65And79.f += row.totalRow.between65And79.f;
            totals.between65And79.t += row.totalRow.between65And79.t;

            totals.between80And89.m += row.totalRow.between80And89.m;
            totals.between80And89.f += row.totalRow.between80And89.f;
            totals.between80And89.t += row.totalRow.between80And89.t;

            totals.above90.m += row.totalRow.above90.m;
            totals.above90.f += row.totalRow.above90.f;
            totals.above90.t += row.totalRow.above90.t;
        });

        const totalMale = Object.values(totals).reduce((sum, r) => sum + r.m, 0);
        const totalFemale = Object.values(totals).reduce((sum, r) => sum + r.f, 0);
        const grandTotal = totalMale + totalFemale;

        return { ...totals, totalMale, totalFemale, grandTotal };
    };

    const kgTotals = useMemo(() => calculateTotals(kgMatrix), [kgMatrix]);
    const gradeTotals = useMemo(() => calculateTotals(gradeMatrix), [gradeMatrix]);

    const handleExportExcel = () => {
        if (reportData.length === 0) return;

        const headers = [
            "Grade Level", "Subject", 
            "Enrolled Male", "Enrolled Female", "Enrolled Total", 
            "Exam Sitting Male", "Exam Sitting Female", "Exam Sitting Total",
            "<50 Male (A)", "<50 Female (A)", "<50 Total (A)", "<50 % (A)",
            "50-64 Male (B)", "50-64 Female (B)", "50-64 Total (B)", "50-64 % (B)",
            "65-79 Male (C)", "65-79 Female (C)", "65-79 Total (C)", "65-79 % (C)",
            "80-89 Male (D)", "80-89 Female (D)", "80-89 Total (D)", "80-89 % (D)",
            ">=90 Male (E)", ">=90 Female (E)", ">=90 Total (E)", ">=90 % (E)"
        ];

        const rows = [];
        const targetData = activeTab === 'kg' ? kgMatrix : gradeMatrix;

        targetData.forEach(gradeData => {
            gradeData.subjects.forEach(sub => {
                rows.push({
                    "Grade Level": gradeData.gradeLevel,
                    "Subject": sub.subject,
                    "Enrolled Male": sub.enrolled.m,
                    "Enrolled Female": sub.enrolled.f,
                    "Enrolled Total": sub.enrolled.t,
                    "Exam Sitting Male": sub.sitting.m,
                    "Exam Sitting Female": sub.sitting.f,
                    "Exam Sitting Total": sub.sitting.t,
                    "<50 Male (A)": sub.under50.m,
                    "<50 Female (A)": sub.under50.f,
                    "<50 Total (A)": sub.under50.t,
                    "<50 % (A)": `${sub.under50.pct}%`,
                    "50-64 Male (B)": sub.between50And64.m,
                    "50-64 Female (B)": sub.between50And64.f,
                    "50-64 Total (B)": sub.between50And64.t,
                    "50-64 % (B)": `${sub.between50And64.pct}%`,
                    "65-79 Male (C)": sub.between65And79.m,
                    "65-79 Female (C)": sub.between65And79.f,
                    "65-79 Total (C)": sub.between65And79.t,
                    "65-79 % (C)": `${sub.between65And79.pct}%`,
                    "80-89 Male (D)": sub.between80And89.m,
                    "80-89 Female (D)": sub.between80And89.f,
                    "80-89 Total (D)": sub.between80And89.t,
                    "80-89 % (D)": `${sub.between80And89.pct}%`,
                    "==90 Male (E)": sub.above90.m,
                    ">=90 Female (E)": sub.above90.f,
                    ">=90 Total (E)": sub.above90.t,
                    ">=90 % (E)": `${sub.above90.pct}%`
                });
            });

            rows.push({
                "Grade Level": gradeData.gradeLevel,
                "Subject": "TOTAL",
                "Enrolled Male": gradeData.totalRow.enrolled.m,
                "Enrolled Female": gradeData.totalRow.enrolled.f,
                "Enrolled Total": gradeData.totalRow.enrolled.t,
                "Exam Sitting Male": gradeData.totalRow.sitting.m,
                "Exam Sitting Female": gradeData.totalRow.sitting.f,
                "Exam Sitting Total": gradeData.totalRow.sitting.t,
                "<50 Male (A)": gradeData.totalRow.under50.m,
                "<50 Female (A)": gradeData.totalRow.under50.f,
                "<50 Total (A)": gradeData.totalRow.under50.t,
                "<50 % (A)": `${gradeData.totalRow.under50.pct}%`,
                "50-64 Male (B)": gradeData.totalRow.between50And64.m,
                "50-64 Female (B)": gradeData.totalRow.between50And64.f,
                "50-64 Total (B)": gradeData.totalRow.between50And64.t,
                "50-64 % (B)": `${gradeData.totalRow.between50And64.pct}%`,
                "65-79 Male (C)": gradeData.totalRow.between65And79.m,
                "65-79 Female (C)": gradeData.totalRow.between65And79.f,
                "65-79 Total (C)": gradeData.totalRow.between65And79.t,
                "65-79 % (C)": `${gradeData.totalRow.between65And79.pct}%`,
                "80-89 Male (D)": gradeData.totalRow.between80And89.m,
                "80-89 Female (D)": gradeData.totalRow.between80And89.f,
                "80-89 Total (D)": gradeData.totalRow.between80And89.t,
                "80-89 % (D)": `${gradeData.totalRow.between80And89.pct}%`,
                ">=90 Male (E)": gradeData.totalRow.above90.m,
                ">=90 Female (E)": gradeData.totalRow.above90.f,
                ">=90 Total (E)": gradeData.totalRow.above90.t,
                ">=90 % (E)": `${gradeData.totalRow.above90.pct}%`
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `${activeTab.toUpperCase()} Matrix`);
        XLSX.writeFile(workbook, `Regional_Performance_Matrix_${activeTab}_Bara_${academicYear}.xlsx`);
    };

    if (loading) return <p className="text-center p-10 font-bold no-print">{t('loading')}</p>;

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-6 print:bg-white print:p-0">
            <style>{`
                @media print {
                    @page { size: A4 landscape; margin: 5mm !important; }
                    .no-print, nav, button, header, .sidebar { display: none !important; }
                    body { background-color: white !important; margin: 0 !important; }
                    table { width: 100% !important; font-size: 8px !important; border-collapse: collapse !important; }
                    th, td { padding: 3px !important; border: 1px solid black !important; }
                    .print-wrapper { width: 100% !important; position: absolute; top: 0; left: 0; }
                }
            `}</style>

            <div className="max-w-full mx-auto space-y-6 print-wrapper animate-fade-in">
                
                {/* ⚠️ አዲሱ የመዋለ ሕፃናት (KG) እና የመደበኛ ክፍሎች (Grade) ታብ መቀያየሪያ */}
                <div className="flex bg-white rounded-xl shadow border p-1 gap-1 no-print overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('kg')}
                        className={`px-8 py-3.5 rounded-lg text-sm font-extrabold transition-all whitespace-nowrap flex-1 ${
                            activeTab === 'kg' 
                                ? 'bg-cyan-600 text-white shadow-md' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        🧸 Kindergarten (KG)
                    </button>
                    <button
                        onClick={() => setActiveTab('grade')}
                        className={`px-8 py-3.5 rounded-lg text-sm font-extrabold transition-all whitespace-nowrap flex-1 ${
                            activeTab === 'grade' 
                                ? 'bg-cyan-600 text-white shadow-md' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                        📚 Primary & High School (Grade 1-12)
                    </button>
                </div>

                {/* Controls Form (Hidden on Print) */}
                <div className="bg-white p-5 rounded-xl border shadow-sm no-print">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Select Grade Level</label>
                            <select 
                                value={selectedGrade} 
                                onChange={e => setSelectedGrade(e.target.value)} 
                                className="w-full border p-2.5 rounded-xl font-bold bg-white text-slate-700"
                            >
                                <option value="">All Grade Levels (ሁሉም ክፍሎች በአንድ ላይ)</option>
                                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Semester</label>
                            <select value={semester} onChange={e => setSemester(e.target.value)} className="w-full border p-2.5 rounded-xl font-bold bg-white text-slate-700">
                                <option value="First Semester">First Semester (1ffaa)</option>
                                <option value="Second Semester">Second Semester (2ffaa)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Academic Year</label>
                            <input type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full border p-2.5 rounded-xl font-bold text-slate-700" />
                        </div>
                        
                        <div className="flex gap-2 w-full">
                            <button onClick={handleExportExcel} disabled={reportData.length === 0} className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow transition-colors text-xs whitespace-nowrap">
                                📥 Export Excel
                            </button>
                            <button onClick={fetchRegionalReport} disabled={fetching} className="w-1/2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-xl shadow transition-colors text-xs whitespace-nowrap">
                                {fetching ? '...' : 'Analyze'}
                            </button>
                        </div>
                    </div>
                </div>

                {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl border font-bold text-center no-print">⚠️ {error}</div>}

                {/* ሪፖርት ማውጫ ሰንጠረዦች (በመረጥነው ታብ መሠረት ብቻ ይጫናል) */}
                {fetching ? <p className="text-center p-10 font-bold no-print">Calculating Matrix Data...</p> : (
                    reportData.length > 0 && (
                        <div className="space-y-12">
                            
                            <div className="bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 p-4 rounded-xl text-center no-print">
                                <h1 className="text-sm md:text-md font-black text-[#0f172a] uppercase tracking-wide leading-relaxed">
                                    Bu'aa Raawwii Qaaccessa Qabxii Sem. {semester === 'First Semester' ? '1ffaa' : '2ffaa'} K/Magaala Kooyyee Faccee Bara {academicYear} ({activeTab === 'kg' ? 'Nursery / KG' : 'Kutaa 1-12'}) (Sagantaa A/Oromoo) [2]
                                </h1>
                            </div>

                            {/* 🧸 🧸 🧸 የኪንደርጋርተን ሰንጠረዥ */}
                            {activeTab === 'kg' && kgMatrix.length > 0 && (
                                <div className="space-y-4">
                                    <MatrixTable 
                                        title="🧸 Kindergarten (KG) Performance Matrix" 
                                        statusData={kgMatrix} 
                                        totals={kgTotals} 
                                    />
                                </div>
                            )}

                            {/* 📚 📚 📚 የመደበኛ ሰንጠረዥ */}
                            {activeTab === 'grade' && gradeMatrix.length > 0 && (
                                <div className="space-y-4">
                                    <MatrixTable 
                                        title="📚 Primary & High School Performance Matrix" 
                                        statusData={gradeMatrix} 
                                        totals={gradeTotals} 
                                    />
                                </div>
                            )}

                        </div>
                    )
                )}

                {!fetching && reportData.length === 0 && (
                    <div className="p-12 text-center text-slate-400 italic bg-white rounded-2xl border shadow no-print">
                        No performance matrix records found matching the selections.
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegionalPerformancePage;