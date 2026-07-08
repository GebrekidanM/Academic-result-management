import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import studentService from '@shared/services/studentService';
import analyticsService from '@shared/services/analyticsService';

function getCurrentAcademicYear() {
    const today = new Date();
    const gregYear = today.getFullYear();
    const gregMonth = today.getMonth() + 1;
    return gregMonth >= 9 ? gregYear - 7 : gregYear - 8;
}

// KG እና Nursery ክፍሎችን ለመለየት የሚያግዝ ሎጂክ
const isKindergarten = (gradeLevel) => {
    if (!gradeLevel) return false;
    return /^(kg|nursery|pre)/i.test(gradeLevel);
};

// ⚠️ የሰንጠረዥ የጋራ ዲዛይን አወቃቀር (Reusable Sub-Component for Clean Code)
const MatrixTable = ({ title, statusData, totals }) => {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-6 overflow-x-auto print:p-0 print:border-none print:shadow-none animate-slide-up space-y-4">
            <div className="border-b pb-2 mb-2 no-print flex justify-between items-center">
                <h3 className="text-md font-black text-slate-800 uppercase">📊 {title}</h3>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{statusData.length} Classes Found</span>
            </div>
            <table className="min-w-full border-collapse border border-slate-400">
                <thead className="bg-slate-900 text-white print:bg-slate-900 print:text-white text-xs">
                    <tr>
                        <th rowSpan="2" className="p-2 border border-slate-400 text-center align-middle font-black uppercase rounded-tl-xl border-r-2 border-slate-400 bg-slate-950">Grade (ክፍል)</th>
                        <th colSpan="2" className="p-2 border border-slate-400 text-center align-middle font-black uppercase bg-red-900">&lt; 50%</th>
                        <th colSpan="2" className="p-2 border border-slate-400 text-center align-middle font-black uppercase bg-orange-700">50% - 70%</th>
                        <th colSpan="2" className="p-2 border border-slate-400 text-center align-middle font-black uppercase bg-yellow-600">70% - 80%</th>
                        <th colSpan="2" className="p-2 border border-slate-400 text-center align-middle font-black uppercase bg-blue-700">80% - 90%</th>
                        <th colSpan="2" className="p-2 border border-slate-400 text-center align-middle font-black uppercase rounded-tr-xl bg-green-700">&gt; 90%</th>
                    </tr>
                    <tr>
                        <th className="p-1 border border-slate-400 text-center text-[10px] font-bold bg-slate-50 text-slate-600">M (ወ)</th>
                        <th className="p-1 border border-slate-400 text-center text-[10px] font-bold bg-slate-50 text-slate-600">F (ሴ)</th>
                        <th className="p-1 border border-slate-400 text-center text-[10px] font-bold bg-slate-50 text-slate-600">M (ወ)</th>
                        <th className="p-1 border border-slate-400 text-center text-[10px] font-bold bg-slate-50 text-slate-600">F (ሴ)</th>
                        <th className="p-1 border border-slate-400 text-center text-[10px] font-bold bg-slate-50 text-slate-600">M (ወ)</th>
                        <th className="p-1 border border-slate-400 text-center text-[10px] font-bold bg-slate-50 text-slate-600">F (ሴ)</th>
                        <th className="p-1 border border-slate-400 text-center text-[10px] font-bold bg-slate-50 text-slate-600">M (ወ)</th>
                        <th className="p-1 border border-slate-400 text-center text-[10px] font-bold bg-slate-50 text-slate-600">F (ሴ)</th>
                        <th className="p-1 border border-slate-400 text-center text-[10px] font-bold bg-slate-50 text-slate-600">M (ወ)</th>
                        <th className="p-1 border border-slate-400 text-center text-[10px] font-bold bg-slate-50 text-slate-600">F (ሴ)</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 bg-white text-xs font-bold text-slate-700">
                    {statusData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2 border border-slate-300 font-black text-slate-800 bg-slate-50 text-left border-r-2 border-r-slate-400 whitespace-nowrap">{row.gradeLevel}</td>
                            <td className="p-2 border border-slate-300 text-center">{row.under50.m || '-'}</td>
                            <td className="p-2 border border-slate-300 text-center">{row.under50.f || '-'}</td>
                            <td className="p-2 border border-slate-300 text-center">{row.between50And70.m || '-'}</td>
                            <td className="p-2 border border-slate-300 text-center">{row.between50And70.f || '-'}</td>
                            <td className="p-2 border border-slate-300 text-center">{row.between70And80.m || '-'}</td>
                            <td className="p-2 border border-slate-300 text-center">{row.between70And80.f || '-'}</td>
                            <td className="p-2 border border-slate-300 text-center">{row.between80And90.m || '-'}</td>
                            <td className="p-2 border border-slate-300 text-center">{row.between80And90.f || '-'}</td>
                            <td className="p-2 border border-slate-300 text-center">{row.above90.m || '-'}</td>
                            <td className="p-2 border border-slate-300 text-center">{row.above90.f || '-'}</td>
                        </tr>
                    ))}
                    {/* የእያንዳንዱ ምድብ ጠቅላላ ድምር ረድፍ (TOTAL ROW) */}
                    <tr className="bg-slate-900 text-white font-black uppercase border-t-4 border-slate-700 print:bg-slate-900">
                        <td className="p-3 border border-slate-800 text-left border-r-2 border-r-slate-400 bg-slate-950">Total</td>
                        <td className="p-2 border border-slate-800 text-center bg-slate-850">👨 {totals.under50.m}</td>
                        <td className="p-2 border border-slate-800 text-center bg-slate-850">👩 {totals.under50.f}</td>
                        <td className="p-2 border border-slate-800 text-center bg-slate-850">👨 {totals.between50And70.m}</td>
                        <td className="p-2 border border-slate-800 text-center bg-slate-850">👩 {totals.between50And70.f}</td>
                        <td className="p-2 border border-slate-800 text-center bg-slate-850">👨 {totals.between70And80.m}</td>
                        <td className="p-2 border border-slate-800 text-center bg-slate-850">👩 {totals.between70And80.f}</td>
                        <td className="p-2 border border-slate-800 text-center bg-slate-850">👨 {totals.between80And90.m}</td>
                        <td className="p-2 border border-slate-800 text-center bg-slate-850">👩 {totals.between80And90.f}</td>
                        <td className="p-2 border border-slate-800 text-center bg-slate-850">👨 {totals.above90.m}</td>
                        <td className="p-2 border border-slate-800 text-center bg-slate-850">👩 {totals.above90.f}</td>
                    </tr>
                    {/* የክፍሉ ጠቅላላ ተማሪዎች ብዛት ማሳያ (Grand Summary) */}
                    <tr className="bg-[#0f172a] text-white font-black uppercase">
                        <td className="p-3 border border-slate-800 text-left border-r-2 border-r-slate-400 bg-slate-950">Grand Total</td>
                        <td colSpan="10" className="p-2 text-center text-[#06b6d4] font-black tracking-wider">
                            Total Enrolled: {totals.grandTotal} Students (👨 {totals.totalMale} Male • 👩 {totals.totalFemale} Female)
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

const OverallAverageAnalysisPage = () => {
    const { t } = useTranslation();
    const currentYear = getCurrentAcademicYear().toString();

    // --- STATE ---
    const [availableGrades, setAvailableGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState(''); 
    const [academicYear, setAcademicYear] = useState(currentYear);
    const [matrixData, setMatrixData] = useState([]);

    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState(null);

    // 1. የክፍሎችን ዝርዝር መጫን
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

    // 2. የአናሊቲክስ መረጃ መጫን
    const handleFetchAnalysis = async () => {
        setFetching(true);
        setError(null);
        setMatrixData([]);

        try {
            const res = await analyticsService.getClassOverallAverageAnalysis(selectedGrade, academicYear);
            setMatrixData(res.data.data || []);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to load average analysis.");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        handleFetchAnalysis();
    }, []);

    // ⚠️ 3. ዳታዎቹን ለመዋለ ሕፃናት (KG) እና ለመደበኛ (Grades) ለሁለት መክፈያ ሎጂክ [2]
    const { kgMatrix, gradeMatrix } = useMemo(() => {
        const kg = [];
        const grade = [];
        matrixData.forEach(row => {
            if (isKindergarten(row.gradeLevel)) {
                kg.push(row);
            } else {
                grade.push(row);
            }
        });
        return { kgMatrix: kg, gradeMatrix: grade };
    }, [matrixData]);

    // ⚠️ 4. የእያንዳንዱን ክፍል ጠቅላላ ድምር ለየብቻው ማስያ ረዳት ሎጂክ [2]
    const calculateTotals = (data) => {
        const totals = {
            under50: { m: 0, f: 0 },
            between50And70: { m: 0, f: 0 },
            between70And80: { m: 0, f: 0 },
            between80And90: { m: 0, f: 0 },
            above90: { m: 0, f: 0 }
        };

        data.forEach(row => {
            totals.under50.m += row.under50.m;
            totals.under50.f += row.under50.f;

            totals.between50And70.m += row.between50And70.m;
            totals.between50And70.f += row.between50And70.f;

            totals.between70And80.m += row.between70And80.m;
            totals.between70And80.f += row.between70And80.f;

            totals.between80And90.m += row.between80And90.m;
            totals.between80And90.f += row.between80And90.f;

            totals.above90.m += row.above90.m;
            totals.above90.f += row.above90.f;
        });

        const totalMale = Object.values(totals).reduce((sum, r) => sum + r.m, 0);
        const totalFemale = Object.values(totals).reduce((sum, r) => sum + r.f, 0);
        const grandTotal = totalMale + totalFemale;

        return { ...totals, totalMale, totalFemale, grandTotal };
    };

    const kgTotals = useMemo(() => calculateTotals(kgMatrix), [kgMatrix]);
    const gradeTotals = useMemo(() => calculateTotals(gradeMatrix), [gradeMatrix]);

    if (loading) return <p className="text-center p-10 font-bold">{t('loading')}</p>;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in print:bg-white print:p-0">
            {/* HIDE ON PRINT */}
            <style>{`
                @media print {
                    .no-print, nav, button, .sidebar, header { display: none !important; }
                    body { background-color: white !important; margin: 0 !important; }
                    table { width: 100% !important; border-collapse: collapse !important; page-break-inside: avoid; }
                    th, td { border: 1px solid #475569 !important; padding: 4px !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center border-b pb-4 gap-4 no-print">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">📊 {t('class_matrix') || 'School Performance Matrix'}</h2>
                    <p className="text-sm text-slate-500 mt-1">School-wide student distribution across achievement ranges [2]</p>
                </div>
                <div className="flex items-center gap-3">
                    <select 
                        value={selectedGrade} 
                        onChange={e => setSelectedGrade(e.target.value)} 
                        className="border-2 p-2.5 rounded-xl font-bold text-slate-700 bg-white outline-none focus:border-pink-500"
                    >
                        <option value="">All Grade Levels (ሁሉም ክፍሎች በአንድ ላይ)</option>
                        {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <input type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="border-2 p-2.5 rounded-xl font-bold text-slate-700 w-24 outline-none focus:border-pink-500" />
                    <button onClick={handleFetchAnalysis} disabled={fetching} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all">
                        {fetching ? '...' : 'Analyze'}
                    </button>
                    <button onClick={() => window.print()} disabled={matrixData.length === 0} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 transition-all">
                        🖨️ {t('print')}
                    </button>
                </div>
            </div>

            {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-bold text-center no-print">⚠️ {error}</div>}

            {matrixData.length > 0 && (
                <div className="space-y-12">
                    {/* Official Print Header */}
                    <div className="hidden print:block text-center border-b pb-4 mb-6">
                        <h1 className="text-3xl font-black uppercase">Freedom Primary School</h1>
                        <h2 className="text-lg font-bold text-slate-600 uppercase mt-1">Class-Wide Student Performance Matrix</h2>
                        <p className="text-xs text-slate-500 font-mono mt-1">Academic Year: {academicYear}</p>
                    </div>

                    {/* ⚠️ 5. የኪንደርጋርተን (KG) የተማሪዎች ዝርዝር ሰንጠረዥ (ካለ ብቻ ይወጣል) [2] */}
                    {(!selectedGrade || isKindergarten(selectedGrade)) && kgMatrix.length > 0 && (
                        <div className="space-y-4">
                            <MatrixTable 
                                title="🧸 Kindergarten (KG) Performance Matrix" 
                                statusData={kgMatrix} 
                                totals={kgTotals} 
                            />
                        </div>
                    )}

                    {/* ⚠️ 6. የመደበኛ ክፍሎች (Grade 1-12) የተማሪዎች ሰንጠረዥ (ካለ ብቻ ይወጣል) [2] */}
                    {(!selectedGrade || !isKindergarten(selectedGrade)) && gradeMatrix.length > 0 && (
                        <div className="space-y-4 print:mt-10">
                            <MatrixTable 
                                title="📚 Primary & High School Performance Matrix" 
                                statusData={gradeMatrix} 
                                totals={gradeTotals} 
                            />
                        </div>
                    )}

                    {/* Signatures for Print (Visible only on print) */}
                    <div className="hidden print:grid grid-cols-2 gap-12 mt-16 px-6 page-break-inside-avoid">
                        <div className="text-center">
                            <div className="border-b border-black mb-2 h-10"></div>
                            <p className="text-[10px] font-bold uppercase">Auditor / Finance Signature</p>
                        </div>
                        <div className="text-center">
                            <div className="border-b border-black mb-2 h-10"></div>
                            <p className="text-[10px] font-bold uppercase">Director Signature</p>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default OverallAverageAnalysisPage;