import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import studentService from '@shared/services/studentService';
import paymentService from '@shared/services/paymentService'; // ⚠️ የክፍያ ሰርቪስ

// የኢትዮጵያን የአሁኑን ዓመተ ምህረት በራስ-ሰር ለማግኘት የሚያግዝ ረዳት ፈንክሽን
function getCurrentAcademicYear() {
    const today = new Date();
    const gregYear = today.getFullYear();
    const gregMonth = today.getMonth() + 1;
    return gregMonth >= 9 ? gregYear - 7 : gregYear - 8;
}

const PaymentAnalyticsPage = () => {
    const { t } = useTranslation();
    const currentYear = getCurrentAcademicYear().toString();

    // --- STATE ---
    const [availableGrades, setAvailableGrades] = useState([]);
    const [filters, setFilters] = useState({
        gradeLevel: '',
        paymentReason: 'Tuition Fee',
        paidFor: 'September',
        academicYear: currentYear
    });

    const [analyticsData, setAnalyticsData] = useState(null);
    const [activeTab, setActiveTab] = useState('unpaid'); // unpaid, paid

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
                if (uniqueGrades.length > 0) {
                    setFilters(prev => ({ ...prev, gradeLevel: uniqueGrades[0] }));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadGrades();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // 2. የክፍያ አናሊቲክስ መጫን
    const handleFetchAnalytics = async () => {
        if (!filters.gradeLevel) return;
        setFetching(true);
        setError(null);
        setAnalyticsData(null);

        try {
            const res = await paymentService.getPaymentAnalytics(filters);
            setAnalyticsData(res.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to load payment analytics.");
        } finally {
            setFetching(false);
        }
    };

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
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">📊 {t('payment_analytics') || 'Fee & Defaulter Tracker'}</h2>
                    <p className="text-sm text-slate-500 mt-1">Track collected revenue and identify non-paying students [2]</p>
                </div>
                <Link to="/" className="text-pink-600 hover:underline font-bold text-sm">
                    &larr; {t('back')}
                </Link>
            </div>

            {/* Selection Controls (No Print) */}
            <div className="p-4 bg-slate-50 rounded-xl border grid grid-cols-1 md:grid-cols-5 gap-4 items-end no-print">
                <div>
                    <label className="font-bold block mb-1 text-xs text-slate-400 uppercase">Grade Level</label>
                    <select name="gradeLevel" value={filters.gradeLevel} onChange={handleFilterChange} className="w-full p-2.5 rounded-lg border bg-white font-bold text-slate-700">
                        {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <div>
                    <label className="font-bold block mb-1 text-xs text-slate-400 uppercase">Payment Reason</label>
                    <select name="paymentReason" value={filters.paymentReason} onChange={handleFilterChange} className="w-full p-2.5 rounded-lg border bg-white font-bold text-slate-700">
                        <option value="Tuition Fee">Tuition Fee</option>
                        <option value="Registration Fee">Registration Fee</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Uniform">Uniform</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                    <label className="font-bold block mb-1 text-xs text-slate-400 uppercase">Paid For (Period)</label>
                    <select name="paidFor" value={filters.paidFor} onChange={handleFilterChange} className="w-full p-2.5 rounded-lg border bg-white font-bold text-slate-700">
                        <option value="Annual">Annual</option>
                        <option value="1st Quarter">1st Quarter</option>
                        <option value="2nd Quarter">2nd Quarter</option>
                        <option value="3rd Quarter">3rd Quarter</option>
                        <option value="September">September</option>
                        <option value="October">October</option>
                        <option value="November">November</option>
                        <option value="December">December</option>
                        <option value="January">January</option>
                        <option value="February">February</option>
                        <option value="March">March</option>
                        <option value="April">April</option>
                        <option value="May">May</option>
                        <option value="June">June</option>
                    </select>
                </div>
                <div>
                    <label className="font-bold block mb-1 text-xs text-slate-400 uppercase">Academic Year</label>
                    <input type="text" name="academicYear" value={filters.academicYear} onChange={handleFilterChange} className="w-full p-2.5 rounded-lg border bg-white font-bold text-slate-700" />
                </div>
                <button onClick={handleFetchAnalytics} disabled={fetching} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg transition-colors">
                    {fetching ? '...' : 'Track Fees'}
                </button>
            </div>

            {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-bold text-center no-print">⚠️ {error}</div>}

            {analyticsData && (
                <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-center">
                            <span className="text-xs text-emerald-600 font-bold uppercase">{t('total_collected') || 'Birr Collected'}</span>
                            <h4 className="text-2xl font-black text-emerald-700 mt-1">{analyticsData.summary.totalCollectedETB.toFixed(2)} Birr</h4>
                        </div>
                        <div className="bg-green-50 border border-green-200 p-5 rounded-2xl text-center">
                            <span className="text-xs text-green-600 font-bold uppercase">{t('paid_students_count') || 'Students Paid'}</span>
                            <h4 className="text-2xl font-black text-green-700 mt-1">{analyticsData.summary.paidCount} / {analyticsData.summary.totalStudents}</h4>
                        </div>
                        <div className="bg-red-50 border border-red-200 p-5 rounded-2xl text-center">
                            <span className="text-xs text-red-600 font-bold uppercase">{t('unpaid_students_count') || 'Students Unpaid (Defaulters)'}</span>
                            <h4 className="text-2xl font-black text-red-700 mt-1">{analyticsData.summary.unpaidCount} / {analyticsData.summary.totalStudents}</h4>
                        </div>
                        <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl text-center">
                            <span className="text-xs text-indigo-600 font-bold uppercase">{t('payment_rate') || 'Payment Rate'}</span>
                            <h4 className="text-2xl font-black text-indigo-700 mt-1">
                                {analyticsData.summary.totalStudents > 0 
                                    ? ((analyticsData.summary.paidCount / analyticsData.summary.totalStudents) * 100).toFixed(1) 
                                    : '100'}%
                            </h4>
                        </div>
                    </div>

                    {/* Printable Header (Visible ONLY on Print) */}
                    <div className="hidden print:block text-center border-b pb-4 mb-6">
                        <h1 className="text-3xl font-black uppercase">Freedom Primary School</h1>
                        <h2 className="text-lg font-bold text-slate-600 uppercase mt-1">Class Fee Defaulters & Payments Report</h2>
                        <p className="text-xs text-slate-500 font-mono mt-1">Class: {filters.gradeLevel} • Reason: {filters.paymentReason} • Period: {filters.paidFor} • Year: {filters.academicYear}</p>
                    </div>

                    {/* Detailed Lists with Tabs */}
                    <div className="bg-white border rounded-2xl p-6 shadow-md space-y-6">
                        <div className="flex justify-between items-center border-b pb-3 no-print">
                            {/* Tab toggler */}
                            <div className="flex bg-slate-100 p-1 rounded-xl border">
                                <button onClick={() => setActiveTab('unpaid')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'unpaid' ? 'bg-white shadow text-red-600 font-black' : 'text-slate-500'}`}>
                                    ⚠️ Unpaid ({analyticsData.unpaidStudents.length})
                                </button>
                                <button onClick={() => setActiveTab('paid')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'paid' ? 'bg-white shadow text-green-600 font-black' : 'text-slate-500'}`}>
                                    ✅ Paid ({analyticsData.paidStudents.length})
                                </button>
                            </div>
                            <button onClick={() => window.print()} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold shadow text-xs">
                                🖨️ Print Report
                            </button>
                        </div>

                        {/* LIST: UNPAID (Defaulters) [2] */}
                        {(activeTab === 'unpaid' || window.matchMedia('print').matches) && (
                            <div className="space-y-4">
                                <h4 className="font-black text-red-700 text-sm border-b pb-2 uppercase tracking-wide">⚠️ {t('unpaid_students_list') || 'Unpaid Students (Defaulters)'}</h4>
                                {analyticsData.unpaidStudents.length > 0 ? (
                                    <table className="min-w-full divide-y divide-slate-100 border border-slate-200">
                                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                                            <tr>
                                                <th className="px-4 py-3 border border-slate-200">#</th>
                                                <th className="px-4 py-3 border border-slate-200 text-left">Student ID</th>
                                                <th className="px-4 py-3 border border-slate-200 text-left">Full Name</th>
                                                <th className="px-4 py-3 border border-slate-200 text-left">Gender</th>
                                                <th className="px-4 py-3 border border-slate-200 text-left">Parent Contacts</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {analyticsData.unpaidStudents.map((student, idx) => (
                                                <tr key={student._id} className="hover:bg-red-50 text-xs">
                                                    <td className="px-4 py-3 border border-slate-200 text-slate-400 font-mono text-center">{idx + 1}</td>
                                                    <td className="px-4 py-3 border border-slate-200 font-mono text-slate-500">{student.studentId}</td>
                                                    <td className="px-4 py-3 border border-slate-200 font-bold text-slate-800">{student.fullName}</td>
                                                    <td className="px-4 py-3 border border-slate-200 text-slate-600">{student.gender}</td>
                                                    <td className="px-4 py-3 border border-slate-200 text-slate-600">
                                                        <div className="flex flex-wrap gap-3">
                                                            {student.motherContact && (
                                                                <a href={`tel:${student.motherContact}`} className="bg-slate-100 hover:bg-pink-100 px-2 py-0.5 rounded text-[10px] font-bold">
                                                                    👩 Mother: {student.motherContact}
                                                                </a>
                                                            )}
                                                            {student.fatherContact && (
                                                                <a href={`tel:${student.fatherContact}`} className="bg-slate-100 hover:bg-pink-100 px-2 py-0.5 rounded text-[10px] font-bold">
                                                                    👨 Father: {student.fatherContact}
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-center text-xs text-slate-400 py-6 italic">No outstanding fees! All students have paid.</p>
                                )}
                            </div>
                        )}

                        {/* LIST: PAID [2] */}
                        {(activeTab === 'paid' && !window.matchMedia('print').matches) && (
                            <div className="space-y-4 animate-fade-in">
                                <h4 className="font-black text-green-700 text-sm border-b pb-2 uppercase tracking-wide">✅ {t('paid_students_list') || 'Paid Students'}</h4>
                                {analyticsData.paidStudents.length > 0 ? (
                                    <table className="min-w-full divide-y divide-slate-100 border border-slate-200">
                                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                                            <tr>
                                                <th className="px-4 py-3 border border-slate-200">#</th>
                                                <th className="px-4 py-3 border border-slate-200 text-left">Student ID</th>
                                                <th className="px-4 py-3 border border-slate-200 text-left">Full Name</th>
                                                <th className="px-4 py-3 border border-slate-200 text-center">Receipt Code</th>
                                                <th className="px-4 py-3 border border-slate-200 text-right">Amount Paid</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {analyticsData.paidStudents.map((student, idx) => (
                                                <tr key={student._id} className="hover:bg-green-50 text-xs">
                                                    <td className="px-4 py-3 border border-slate-200 text-slate-400 font-mono text-center">{idx + 1}</td>
                                                    <td className="px-4 py-3 border border-slate-200 font-mono text-slate-500">{student.studentId}</td>
                                                    <td className="px-4 py-3 border border-slate-200 font-bold text-slate-800">{student.fullName}</td>
                                                    <td className="px-4 py-3 border border-slate-200 font-mono text-center text-slate-500 font-bold">{student.receiptCode}</td>
                                                    <td className="px-4 py-3 border border-slate-200 text-right font-bold text-emerald-600">{student.amountPaid.toFixed(2)} Birr</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-center text-xs text-slate-400 py-6 italic">No payments recorded yet for this period.</p>
                                )}
                            </div>
                        )}

                        {/* Signatures for Print */}
                        <div className="hidden print:grid grid-cols-2 gap-12 mt-16 px-6">
                            <div className="text-center">
                                <div className="border-b border-black mb-2 h-10"></div>
                                <p className="text-[10px] font-bold uppercase">Finance Officer Signature</p>
                            </div>
                            <div className="text-center">
                                <div className="border-b border-black mb-2 h-10"></div>
                                <p className="text-[10px] font-bold uppercase">Director Signature</p>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentAnalyticsPage;