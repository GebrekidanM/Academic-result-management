import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import studentService from '@shared/services/studentService';
import paymentService from '@shared/services/paymentService';

function getCurrentAcademicYear() {
    const today = new Date();
    const gregYear = today.getFullYear();
    const gregMonth = today.getMonth() + 1;
    return gregMonth >= 9 ? gregYear - 7 : gregYear - 8;
}

const PaymentRegistryPage = () => {
    const { t } = useTranslation();
    const currentYear = getCurrentAcademicYear().toString();

    const [activeTab, setActiveTab] = useState('record');
    const [academicYear, setAcademicYear] = useState(currentYear);
    
    const [searchId, setSearchId] = useState('');
    const [foundStudent, setFoundStudent] = useState(null);
    const [paymentData, setPaymentData] = useState({ paymentReason: 'Tuition Fee', paidFor: 'September', amount: '', receiptCode: '' });

    const [historyData, setHistoryData] = useState([]);
    const [filterReason, setFilterReason] = useState('');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSearchStudent = async () => {
        const trimmedId = searchId.trim().toUpperCase();
        if (!trimmedId) return;

        setLoading(true);
        setError(null);
        setFoundStudent(null);
        setSuccess(null);

        try {
            const res = await studentService.getStudentByStudentId(trimmedId);
            setFoundStudent(res.data);
        } catch (err) {
            setError("❌ Student ID not found in database.");
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const filters = { academicYear };
            if (filterReason) filters.paymentReason = filterReason;

            const res = await paymentService.getAllPayments(filters);
            setHistoryData(res.data.data || []);
        } catch (err) {
            console.error(err);
            setError("Failed to load transaction history.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'history') {
            fetchPaymentHistory();
        }
    }, [activeTab, academicYear, filterReason]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setPaymentData(prev => ({ ...prev, [name]: value }));
    };

    const handleSavePayment = async (e) => {
        e.preventDefault();
        if (!foundStudent) return alert("Please verify student ID first.");
        
        setSaving(true);
        setError(null);
        setSuccess(null);

        const payload = {
            studentId: foundStudent._id,
            paymentReason: paymentData.paymentReason,
            paidFor: paymentData.paidFor,
            amount: Number(paymentData.amount),
            receiptCode: paymentData.receiptCode.trim().toUpperCase(),
            academicYear
        };

        try {
            await paymentService.createPayment(payload);
            setSuccess(`Successfully recorded payment of ${paymentData.amount} Birr for ${foundStudent.fullName}`);
            
            setSearchId('');
            setFoundStudent(null);
            setPaymentData({ paymentReason: 'Tuition Fee', paidFor: 'September', amount: '', receiptCode: '' });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to record payment.");
        } finally {
            setSaving(false);
        }
    };

    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white font-bold";
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in print:bg-white print:p-0">
            <style>{`
                @media print {
                    .no-print, nav, button, .sidebar, header { display: none !important; }
                    body { background-color: white !important; margin: 5mm !important; }
                    table { width: 100% !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center border-b pb-4 gap-4 no-print">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">💰 {t('payment_registry') || 'Payment Registry'}</h2>
                    <p className="text-sm text-slate-500 mt-1">Record manual student fees and transaction logs</p>
                </div>
                
                {/* Tabs Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-xl border">
                    <button 
                        onClick={() => { setActiveTab('record'); setError(null); setSuccess(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'record' ? 'bg-white shadow text-pink-600' : 'text-gray-500'}`}
                    >
                        📝 Record Payment
                    </button>
                    <button
                        onClick={() => { setActiveTab('history'); setError(null); setSuccess(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white shadow text-pink-600' : 'text-gray-500'}`}
                    >
                        📜 History Logs
                    </button>
                </div>

                <Link to="/" className="text-pink-600 hover:underline font-bold text-sm">
                    &larr; {t('back')}
                </Link>
            </div>

            {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-bold text-center no-print">⚠️ {error}</div>}
            {success && <div className="p-4 bg-green-50 text-green-600 rounded-xl border border-green-100 font-bold text-center no-print">✅ {success}</div>}

            {/* =========================================
                TAB 1: RECORD NEW PAYMENT
            ========================================= */}
            {activeTab === 'record' && (
                <div className="max-w-2xl mx-auto space-y-6 no-print">
                    {/* Step 1: Student Search */}
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-inner">
                        <label className={inputLabel}>Step 1: Search Student by ID</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                className={textInput} 
                                placeholder="e.g. FKS-2018-001" 
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                            />
                            <button 
                                type="button" 
                                onClick={handleSearchStudent}
                                disabled={loading || !searchId}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-bold transition-colors"
                            >
                                {loading ? '...' : 'Search'}
                            </button>
                        </div>
                    </div>

                    {/* Step 2: Payment Form (Only shown if student is verified) [2] */}
                    {foundStudent && (
                        <form onSubmit={handleSavePayment} className="p-6 bg-white border-2 border-green-500 rounded-2xl shadow-lg space-y-6 animate-fade-in">
                            <div className="flex justify-between items-start border-b pb-4 mb-4">
                                <div>
                                    <p className="text-xs font-bold text-green-600 uppercase">Verified Student</p>
                                    <h3 className="text-2xl font-black text-gray-800">{foundStudent.fullName}</h3>
                                    <p className="text-gray-500 italic text-sm mt-0.5">Grade: {foundStudent.currentGrade} • ID: {foundStudent.studentId}</p>
                                </div>
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Ready</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Academic Year */}
                                <div>
                                    <label className={inputLabel}>Academic Year</label>
                                    <input 
                                        type="text" 
                                        value={academicYear} 
                                        onChange={e => setAcademicYear(e.target.value)} 
                                        className={textInput}
                                        required
                                    />
                                </div>

                                {/* Receipt Code */}
                                <div>
                                    <label className={inputLabel}>Receipt reference (Code)</label>
                                    <input 
                                        type="text" 
                                        name="receiptCode"
                                        value={paymentData.receiptCode} 
                                        onChange={handleFormChange} 
                                        placeholder="e.g. REC-12345"
                                        className={textInput}
                                        required
                                    />
                                </div>

                                {/* Payment Reason */}
                                <div>
                                    <label className={inputLabel}>Payment Reason</label>
                                    <select 
                                        name="paymentReason"
                                        value={paymentData.paymentReason} 
                                        onChange={handleFormChange} 
                                        className={textInput}
                                    >
                                        <option value="Tuition Fee">Tuition Fee (ወርሃዊ ክፍያ)</option>
                                        <option value="Registration Fee">Registration Fee (ምዝገባ)</option>
                                        <option value="Transportation">Transportation (ትራንስፖርት)</option>
                                        <option value="Uniform">Uniform (ዩኒፎርም)</option>
                                        <option value="Other">Other (ሌላ)</option>
                                    </select>
                                </div>

                                {/* Paid For (Month / Period) */}
                                <div>
                                    <label className={inputLabel}>Paid For (Period)</label>
                                    <select 
                                        name="paidFor"
                                        value={paymentData.paidFor} 
                                        onChange={handleFormChange} 
                                        className={textInput}
                                    >
                                        <option value="Annual">Annual (ዓመታዊ)</option>
                                        <option value="1st Quarter">1st Quarter (ሩብ ዓመት)</option>
                                        <option value="2nd Quarter">2nd Quarter</option>
                                        <option value="3rd Quarter">3rd Quarter</option>
                                        <option value="September">September (መስከረም)</option>
                                        <option value="October">October (ጥቅምት)</option>
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

                                {/* Amount (ETB) */}
                                <div className="sm:col-span-2">
                                    <label className={inputLabel}>Amount paid (ETB)</label>
                                    <input 
                                        type="number" 
                                        name="amount"
                                        value={paymentData.amount} 
                                        onChange={handleFormChange} 
                                        min="0"
                                        placeholder="e.g. 1500"
                                        className={textInput}
                                        required
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={saving}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-50"
                            >
                                {saving ? 'Recording...' : `Record Payment of ${paymentData.amount || '0'} Birr`}
                            </button>
                        </form>
                    )}
                </div>
            )}

            {/* =========================================
                TAB 2: TRANSACTION HISTORY / LOGS
            ========================================= */}
            {activeTab === 'history' && (
                <div className="space-y-6">
                    {/* Filter controls (Hidden on Print) */}
                    <div className="p-4 bg-slate-100 rounded-xl border flex flex-col sm:flex-row gap-4 items-end no-print">
                        <div className="grow w-full">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Academic Year</label>
                            <input 
                                type="text" 
                                value={academicYear} 
                                onChange={e => setAcademicYear(e.target.value)} 
                                className="w-full p-2.5 rounded-lg border bg-white font-bold text-slate-700"
                            />
                        </div>
                        <div className="grow w-full">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Payment Reason</label>
                            <select 
                                value={filterReason} 
                                onChange={e => setFilterReason(e.target.value)} 
                                className="w-full p-2.5 rounded-lg border bg-white font-bold text-slate-700"
                            >
                                <option value="">All Reasons</option>
                                <option value="Tuition Fee">Tuition Fee</option>
                                <option value="Registration Fee">Registration Fee</option>
                                <option value="Transportation">Transportation</option>
                                <option value="Uniform">Uniform</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <button onClick={() => window.print()} className="bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold shadow">
                            🖨️ Print Logs
                        </button>
                    </div>

                    {/* Official Document Header (Visible only on Print) */}
                    <div className="hidden print:block text-center border-b-2 border-black pb-4">
                        <h1 className="text-3xl font-black uppercase">Freedom Primary School</h1>
                        <h2 className="text-lg font-bold text-slate-600 uppercase mt-1">Transaction History & Audit Logs</h2>
                        <p className="text-xs text-slate-500 font-mono mt-1">Year: {academicYear} | Filter: {filterReason || 'All Transactions'}</p>
                    </div>

                    {/* Table */}
                    {loading ? <p className="text-center p-10 font-bold">{t('loading')}</p> : (
                        historyData.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-md">
                                <table className="min-w-full divide-y divide-slate-100 border-collapse border border-slate-300">
                                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3 border border-slate-200">#</th>
                                            <th className="px-4 py-3 border border-slate-200 text-left">Date</th>
                                            <th className="px-4 py-3 border border-slate-200 text-left">Student</th>
                                            <th className="px-4 py-3 border border-slate-200 text-left">Reason</th>
                                            <th className="px-4 py-3 border border-slate-200 text-left">Period</th>
                                            <th className="px-4 py-3 border border-slate-200">Receipt</th>
                                            <th className="px-4 py-3 border border-slate-200 text-right">Amount (Birr)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {historyData.map((tx, idx) => (
                                            <tr key={tx._id} className="hover:bg-slate-50 text-xs">
                                                <td className="px-4 py-3 border border-slate-200 font-mono text-slate-400 text-center">{idx + 1}</td>
                                                <td className="px-4 py-3 border border-slate-200 text-slate-500 whitespace-nowrap">
                                                    {new Date(tx.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 border border-slate-200 font-bold text-slate-800">
                                                    <div>{tx.student?.fullName || 'Deleted Student'}</div>
                                                    <span className="text-[10px] text-slate-400 font-mono">ID: {tx.student?.studentId} • {tx.student?.gradeLevel}</span>
                                                </td>
                                                <td className="px-4 py-3 border border-slate-200 text-slate-600 font-bold">{tx.paymentReason}</td>
                                                <td className="px-4 py-3 border border-slate-200 text-slate-600">{tx.paidFor}</td>
                                                <td className="px-4 py-3 border border-slate-200 font-mono font-bold text-slate-500 text-center">{tx.receiptCode}</td>
                                                <td className="px-4 py-3 border border-slate-200 text-right text-emerald-600 font-black text-sm">{tx.amount.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-slate-400 py-10 italic">No transaction records found matching the filters.</p>
                        )
                    )}

                    {/* Official Signatures (Visible only on print) */}
                    <div className="hidden print:grid grid-cols-2 gap-12 mt-16 px-6">
                        <div className="text-center">
                            <div className="border-b border-black mb-2 h-10"></div>
                            <p className="text-[10px] font-bold uppercase">Finance Officer Signature</p>
                        </div>
                        <div className="text-center">
                            <div className="border-b border-black mb-2 h-10"></div>
                            <p className="text-[10px] font-bold uppercase">Auditor / Director Signature</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentRegistryPage;