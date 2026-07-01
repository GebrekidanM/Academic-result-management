import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import attendanceService from '@shared/services/attendanceService';

const AdminAttendancePage = () => {
    // ⚠️ ማስተካከያ፦ ትርፉ የትየባ ስህተት (Translation =) እዚህ ጋር ተወግዷል
    const { t } = useTranslation();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // የዛሬ ቀን
    const [statusData, setStatusData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ለዝርዝር የተማሪዎች እይታ መቆጣጠሪያዎች (Modal States)
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [detailSheet, setDetailSheet] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // 1. የዕለቱን የሁሉም ክፍሎች ሁኔታ መጫን
    const fetchStatusData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await attendanceService.getAttendanceStatusByDate(date);
            setStatusData(res.data.data || []);
        } catch (err) {
            console.error(err);
            setError("Failed to load attendance status.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatusData();
    }, [date]);

    // 2. የአንድን ክፍል ዝርዝር የተማሪዎች መቅረት መዝገብ መጫን (View Details)
    const handleViewDetails = async (gradeLevel) => {
        setSelectedGrade(gradeLevel);
        setDetailLoading(true);
        try {
            const res = await attendanceService.getAttendanceByClass(gradeLevel, date);
            setDetailSheet(res.data.data);
        } catch (err) {
            console.error(err);
            alert("Failed to load detailed class sheet.");
        } finally {
            setDetailLoading(false);
        }
    };

    // 3. አጠቃላይ ስታቶችን ማስላት (KPIs)
    const kpis = useMemo(() => {
        if (statusData.length === 0) return { total: 0, completed: 0, pending: 0, rate: 100 };
        const total = statusData.length;
        const completed = statusData.filter(s => s.status === 'Completed').length;
        const pending = total - completed;
        
        let sumRate = 0;
        statusData.filter(s => s.status === 'Completed').forEach(s => sumRate += s.rate);
        const avgRate = completed > 0 ? (sumRate / completed) : 100;

        return { total, completed, pending, rate: avgRate.toFixed(1) };
    }, [statusData]);

    if (loading) return <p className="text-center p-10 font-bold">{t('loading')}</p>;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in print:bg-white print:p-0">
            {/* HIDE NAVIGATION ON PRINT */}
            <style>{`
                @media print {
                    .no-print, nav, button, .sidebar, header { display: none !important; }
                    body, .min-h-screen { background-color: white !important; margin: 0 !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center border-b pb-4 gap-4 no-print">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">📊 {t('detailed_attendance') || 'Attendance Control Center'}</h2>
                    <p className="text-sm text-slate-500 mt-1">Real-time school-wide attendance logs</p>
                </div>
                <div className="flex items-center gap-3">
                    <input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)} 
                        className="border-2 p-2.5 rounded-xl font-bold text-slate-700 outline-none focus:border-pink-500" 
                    />
                    <Link to="/" className="text-pink-600 hover:underline font-bold text-sm">
                        &larr; {t('back')}
                    </Link>
                </div>
            </div>

            {/* KPI Cards (No Print) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
                <div className="bg-white border p-5 rounded-2xl shadow-sm text-center">
                    <span className="text-xs text-slate-400 font-bold uppercase">Total Classes</span>
                    <h4 className="text-2xl font-black text-slate-800 mt-1">{kpis.total}</h4>
                </div>
                <div className="bg-green-50 border border-green-200 p-5 rounded-2xl text-center">
                    <span className="text-xs text-green-600 font-bold uppercase">Completed</span>
                    <h4 className="text-2xl font-black text-green-700 mt-1">{kpis.completed}</h4>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-2xl text-center">
                    <span className="text-xs text-yellow-600 font-bold uppercase">Pending Check</span>
                    <h4 className="text-2xl font-black text-yellow-700 mt-1">{kpis.pending}</h4>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl text-center">
                    <span className="text-xs text-indigo-600 font-bold uppercase">Average Rate</span>
                    <h4 className="text-2xl font-black text-indigo-700 mt-1">{kpis.rate}%</h4>
                </div>
            </div>

            {/* Class-by-Class Status Table (No Print) */}
            {!selectedGrade && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden no-print">
                    <div className="p-4 bg-slate-50 border-b font-bold text-slate-800">
                        School Attendance Logs by Class
                    </div>
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400">
                            <tr>
                                <th className="px-6 py-4 text-left">Grade Level</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Attendance Rate</th>
                                <th className="px-6 py-4 text-left">Recorded By</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {statusData.map((cls, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 text-sm">
                                    <td className="px-6 py-4 font-bold text-slate-800">{cls.gradeLevel}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                                            cls.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {cls.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-700">{cls.rate}%</td>
                                    <td className="px-6 py-4 text-slate-600">{cls.takenBy}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => handleViewDetails(cls.gradeLevel)}
                                            className="text-pink-600 hover:text-pink-700 font-bold"
                                        >
                                            View Sheet &rarr;
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* DETAILED SHEET VIEW (Printable Section) */}
            {selectedGrade && (
                <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-lg space-y-6">
                    <div className="flex justify-between items-center border-b pb-4 no-print">
                        <div>
                            <button onClick={() => setSelectedGrade(null)} className="text-sm text-blue-600 hover:underline mb-1 block">&larr; Back to all classes</button>
                            <h3 className="text-xl font-black text-slate-800">Detail Sheet: {selectedGrade}</h3>
                        </div>
                        <button onClick={() => window.print()} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-900 transition-colors">
                            🖨️ Print Sheet
                        </button>
                    </div>

                    {/* Official Header (Visible on print only) */}
                    <div className="hidden print:block text-center border-b pb-4 mb-6">
                        <h1 className="text-2xl font-black uppercase">Freedom Primary School</h1>
                        <h2 className="text-lg font-bold text-slate-600 uppercase mt-1">Official Attendance Sheet</h2>
                        <p className="text-xs text-slate-500 font-mono mt-1">Class: {selectedGrade} • Date: {new Date(date).toLocaleDateString()}</p>
                    </div>

                    {detailLoading ? <p className="text-center py-10 font-bold">Loading detailed records...</p> : (
                        detailSheet && detailSheet.records && detailSheet.records.length > 0 ? (
                            <table className="min-w-full divide-y divide-slate-100 border-collapse border border-slate-300">
                                <thead className="bg-slate-50 uppercase text-xs font-bold text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4 text-left border border-slate-200">#</th>
                                        <th className="px-6 py-3 text-left border border-slate-200">Student ID</th>
                                        <th className="px-6 py-3 text-left border border-slate-200">Full Name</th>
                                        <th className="px-6 py-3 text-center border border-slate-200">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 bg-white">
                                    {detailSheet.records.map((rec, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 text-sm">
                                            <td className="px-6 py-3 border border-slate-200 text-slate-400 font-mono">{idx + 1}</td>
                                            <td className="px-6 py-3 border border-slate-200 font-mono text-slate-500">{rec.student?.studentId}</td>
                                            <td className="px-6 py-3 border border-slate-200 font-bold text-slate-800">{rec.student?.fullName}</td>
                                            <td className="px-6 py-3 border border-slate-200 text-center">
                                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs uppercase ${
                                                    rec.status === 'Present' ? 'bg-green-100 text-green-700' :
                                                    rec.status === 'Absent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {rec.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center text-slate-400 py-10 italic">No attendance record found for this class on {new Date(date).toLocaleDateString()}.</p>
                        )
                    )}

                    {/* Signatures for Print */}
                    <div className="hidden print:grid grid-cols-2 gap-12 mt-16 px-6">
                        <div className="text-center">
                            <div className="border-b border-black mb-2 h-10"></div>
                            <p className="text-[10px] font-bold uppercase">Recorded By Signature</p>
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

export default AdminAttendancePage;