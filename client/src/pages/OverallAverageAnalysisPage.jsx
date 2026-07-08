import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import analyticsService from '@shared/services/analyticsService';

function getCurrentAcademicYear() {
    const today = new Date();
    const gregYear = today.getFullYear();
    const gregMonth = today.getMonth() + 1;
    return gregMonth >= 9 ? gregYear - 7 : gregYear - 8;
}

const OverallAverageAnalysisPage = () => {
    const { t } = useTranslation();
    const currentYear = getCurrentAcademicYear().toString();

    // --- STATE ---
    const [academicYear, setAcademicYear] = useState(currentYear);
    const [matrixData, setMatrixData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 1. የክፍል ውጤት ማትሪክስ በጅምላ መጫን [2]
    const handleFetchAnalysis = async () => {
        setLoading(true);
        setError(null);
        setMatrixData([]);

        try {
            // የባክኤንድ አዲሱን የጅምላ ማትሪክስ ኤፒአይ መጥራት [2]
            const res = await analyticsService.getClassOverallAverageAnalysis("", academicYear);
            setMatrixData(res.data.data || []);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to load average analysis.");
        } finally {
            setLoading(false);
        }
    };

    // ገጹ እንደተከፈተ የዘንድሮውን ዳታ በራስ-ሰር መጫን
    useEffect(() => {
        handleFetchAnalysis();
    }, []);

    // ⚠️ 2. የእያንዳንዱን ምድብ አጠቃላይ ድምር በሪአክት በራስ-ሰር ማስላት (Total of each region) [2]
    const grandTotals = useMemo(() => {
        const totals = {
            under50: { m: 0, f: 0 },
            between50And70: { m: 0, f: 0 },
            between70And80: { m: 0, f: 0 },
            between80And90: { m: 0, f: 0 },
            above90: { m: 0, f: 0 }
        };

        matrixData.forEach(row => {
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

        return totals;
    }, [matrixData]);

    const thStyle = "p-2 border border-slate-400 text-center align-middle text-xs font-black uppercase";
    const subThStyle = "p-1 border border-slate-400 text-center text-[10px] font-bold bg-slate-50 text-slate-600";
    const tdStyle = "p-2 border border-slate-300 text-center text-xs font-bold text-slate-700";

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in print:bg-white print:p-0">
            {/* HIDE ON PRINT */}
            <style>{`
                @media print {
                    .no-print, nav, button, .sidebar, header { display: none !important; }
                    body { background-color: white !important; margin: 5mm !important; }
                    table { width: 100% !important; border-collapse: collapse !important; }
                    th, td { border: 1px solid #475569 !important; padding: 4px !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center border-b pb-4 gap-4 no-print">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">📊 {t('class_matrix') || 'All Grades Performance Matrix'}</h2>
                    <p className="text-sm text-slate-500 mt-1">School-wide student distribution across achievement ranges [2]</p>
                </div>
                <div className="flex items-center gap-3">
                    <input 
                        type="text" 
                        value={academicYear} 
                        onChange={e => setAcademicYear(e.target.value)} 
                        className="border-2 p-2.5 rounded-xl font-bold text-slate-700 w-24 outline-none focus:border-pink-500" 
                    />
                    <button onClick={handleFetchAnalysis} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-all">
                        {loading ? '...' : 'Refresh Matrix'}
                    </button>
                    <button onClick={() => window.print()} disabled={matrixData.length === 0} className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-3 rounded-xl shadow-md transition-all">
                        🖨️ Print
                    </button>
                </div>
            </div>

            {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-bold text-center no-print">⚠️ {error}</div>}

            {/* PRINTABLE HEADER */}
            <div className="hidden print:block text-center border-b pb-4 mb-6">
                <h1 className="text-3xl font-black uppercase">Freedom Primary School</h1>
                <h2 className="text-lg font-bold text-slate-600 uppercase mt-1">School-Wide Student Distribution Matrix (All Grades) [2]</h2>
                <p className="text-xs text-slate-500 font-mono mt-1">Academic Year: {academicYear}</p>
            </div>

            {/* ⚠️ 3. በደብተሩ አቀራረብ መሠረት የተገነባው ማስተር ሰንጠረዥ [2] */}
            {matrixData.length > 0 ? 
                <div className="bg-white rounded-2xl border border-slate-100 shadow-md p-6 overflow-x-auto print:p-0 print:border-none print:shadow-none animate-slide-up">
                    <table className="min-w-full border-collapse border border-slate-400">
                        <thead className="bg-slate-900 text-white print:bg-slate-900 print:text-white">
                            {/* የላይኛው የክልል ክፍሎች ረድፍ */}
                            <tr>
                                <th rowSpan="2" className={`${thStyle} rounded-tl-xl border-r-2 border-slate-400 bg-slate-950`}>Grade (ክፍል)</th>
                                <th colSpan="2" className={`${thStyle} bg-red-900`}>&lt; 50%</th>
                                <th colSpan="2" className={`${thStyle} bg-orange-700 font-black`}>50% - 70%</th>
                                <th colSpan="2" className={`${thStyle} bg-yellow-600`}>70% - 80%</th>
                                <th colSpan="2" className={`${thStyle} bg-blue-700`}>80% - 90%</th>
                                <th colSpan="2" className={`${thStyle} rounded-tr-xl bg-green-700`}>&gt; 90%</th>
                            </tr>
                            {/* የፆታ ክፍፍል ረድፍ (M | F) */}
                            <tr>
                                <th className={subThStyle}>M (ወ)</th>
                                <th className={subThStyle}>F (ሴ)</th>
                                <th className={subThStyle}>M (ወ)</th>
                                <th className={subThStyle}>F (ሴ)</th>
                                <th className={subThStyle}>M (ወ)</th>
                                <th className={subThStyle}>F (ሴ)</th>
                                <th className={subThStyle}>M (ወ)</th>
                                <th className={subThStyle}>F (ሴ)</th>
                                <th className={subThStyle}>M (ወ)</th>
                                <th className={subThStyle}>F (ሴ)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 bg-white">
                            {matrixData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-2 border border-slate-300 font-black text-slate-800 bg-slate-50 text-left border-r-2 border-r-slate-400 whitespace-nowrap">{row.gradeLevel}</td>
                                    
                                    {/* < 50% */}
                                    <td className={tdStyle}>{row.under50.m || '-'}</td>
                                    <td className={tdStyle}>{row.under50.f || '-'}</td>

                                    {/* 50% - 70% */}
                                    <td className={tdStyle}>{row.between50And70.m || '-'}</td>
                                    <td className={tdStyle}>{row.between50And70.f || '-'}</td>

                                    {/* 70% - 80% */}
                                    <td className={tdStyle}>{row.between70And80.m || '-'}</td>
                                    <td className={tdStyle}>{row.between70And80.f || '-'}</td>

                                    {/* 80% - 90% */}
                                    <td className={tdStyle}>{row.between80And90.m || '-'}</td>
                                    <td className={tdStyle}>{row.between80And90.f || '-'}</td>

                                    {/* > 90% */}
                                    <td className={tdStyle}>{row.above90.m || '-'}</td>
                                    <td className={tdStyle}>{row.above90.f || '-'}</td>
                                </tr>
                            ))}

                            {/* ⚠️ 4. የእያንዳንዱ ምድብ አጠቃላይ ድምር ረድፍ (TOTAL ROW) [2] */}
                            <tr className="bg-slate-900 text-white font-black uppercase border-t-4 border-slate-700 print:bg-slate-900">
                                <td className="p-3 border border-slate-800 text-left border-r-2 border-r-slate-400 bg-slate-950 text-white">Total (ጠቅላላ)</td>
                                
                                {/* < 50% Total */}
                                <td className="p-2 border border-slate-800 text-center text-white bg-slate-850">👨 {grandTotals.under50.m}</td>
                                <td className="p-2 border border-slate-800 text-center text-white bg-slate-850">👩 {grandTotals.under50.f}</td>

                                {/* 50% - 70% Total */}
                                <td className="p-2 border border-slate-800 text-center text-white bg-slate-850">👨 {grandTotals.between50And70.m}</td>
                                <td className="p-2 border border-slate-800 text-center text-white bg-slate-850">👩 {grandTotals.between50And70.f}</td>

                                {/* 70% - 80% Total */}
                                <td className="p-2 border border-slate-800 text-center text-white bg-slate-850">👨 {grandTotals.between70And80.m}</td>
                                <td className="p-2 border border-slate-800 text-center text-white bg-slate-850">👩 {grandTotals.between70And80.f}</td>

                                {/* 80% - 90% Total */}
                                <td className="p-2 border border-slate-800 text-center text-white bg-slate-850">👨 {grandTotals.between80And90.m}</td>
                                <td className="p-2 border border-slate-800 text-center text-white bg-slate-850">👩 {grandTotals.between80And90.f}</td>

                                {/* > 90% Total */}
                                <td className="p-2 border border-slate-800 text-center text-white bg-slate-850">👨 {grandTotals.above90.m}</td>
                                <td className="p-2 border border-slate-800 text-center text-white bg-slate-850">👩 {grandTotals.above90.f}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Signatures for Print (Visible only on print) */}
                    <div className="hidden print:grid grid-cols-2 gap-12 mt-16 px-6">
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
             : 
            (
                !loading && <div className="p-10 text-center text-slate-400 no-print font-bold">No performance records found for {academicYear}.</div>
            )}
        </div>
    );
};

export default OverallAverageAnalysisPage;