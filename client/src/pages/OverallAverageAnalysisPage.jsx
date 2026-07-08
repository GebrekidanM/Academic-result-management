import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import studentService from '@shared/services/studentService';
import analyticsService from '@shared/services/analyticsService'; // ⚠️ አዲሱ የአናሊቲክስ ሰርቪስ

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
    const [availableGrades, setAvailableGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [academicYear, setAcademicYear] = useState(currentYear);
    const [analysisData, setAnalysisData] = useState(null);
    const [activeRangeKey, setActiveRangeKey] = useState('above90'); // above90, between80And90, between70And80

    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState(null);

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
                    setSelectedGrade(uniqueGrades[0]);
                }
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
        if (!selectedGrade) return;
        setFetching(true);
        setError(null);
        setAnalysisData(null);

        try {
            const res = await analyticsService.getClassOverallAverageAnalysis(selectedGrade, academicYear);
            setAnalysisData(res.data.distribution);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to load average analysis.");
        } finally {
            setFetching(false);
        }
    };

    if (loading) return <p className="text-center p-10 font-bold">{t('loading')}</p>;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in print:bg-white print:p-0">
            {/* HIDE ON PRINT */}
            <style>{`
                @media print {
                    .no-print, nav, button, .sidebar, header { display: none !important; }
                    body { background-color: white !important; margin: 5mm !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center border-b pb-4 gap-4 no-print">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">📊 {t('overall_average_analysis') || 'Overall Average Analytics'}</h2>
                    <p className="text-sm text-slate-500 mt-1">Detailed performance ranges by student total averages [2]</p>
                </div>
                <Link to="/" className="text-pink-600 hover:underline font-bold text-sm">
                    &larr; {t('back')}
                </Link>
            </div>

            {/* Selection Controls (No Print) */}
            <div className="p-4 bg-slate-50 rounded-xl border grid grid-cols-1 md:grid-cols-4 gap-4 items-end no-print">
                <div>
                    <label className="font-bold block mb-1 text-xs text-slate-400 uppercase">Grade Level</label>
                    <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="w-full p-2.5 rounded-lg border bg-white font-bold text-slate-700">
                        {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <div>
                    <label className="font-bold block mb-1 text-xs text-slate-400 uppercase">Academic Year</label>
                    <input type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full p-2.5 rounded-lg border bg-white font-bold text-slate-700" />
                </div>
                <button onClick={handleFetchAnalysis} disabled={fetching} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg transition-colors">
                    {fetching ? '...' : 'Analyze averages'}
                </button>
            </div>

            {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-bold text-center no-print">⚠️ {error}</div>}

            {analysisData && (
                <div className="space-y-8">
                    {/* ⚠️ 3. አጠቃላይ ካርዶች (የወንድና ሴት ስርጭቱን በአንድ ላይ ያሳያሉ) [2] */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
                        
                        {/* above90 */}
                        <div 
                            onClick={() => setActiveRangeKey('above90')}
                            className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                                activeRangeKey === 'above90' ? 'bg-green-50 border-green-300 ring-4 ring-green-100 shadow-md' : 'bg-white border-slate-200'
                            }`}
                        >
                            <span className="text-xs font-bold text-green-600 uppercase">Outstanding (ከ90% በላይ)</span>
                            <h3 className="text-3xl font-black text-slate-800 mt-2">{analysisData.above90.total} <span className="text-sm font-normal text-slate-400">Students</span></h3>
                            <p className="text-xs text-slate-500 mt-1 font-semibold">👨 {analysisData.above90.male} Male • 👩 {analysisData.above90.female} Female</p>
                        </div>

                        {/* between80And90 */}
                        <div 
                            onClick={() => setActiveRangeKey('between80And90')}
                            className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                                activeRangeKey === 'between80And90' ? 'bg-blue-50 border-blue-300 ring-4 ring-blue-100 shadow-md' : 'bg-white border-slate-200'
                            }`}
                        >
                            <span className="text-xs font-bold text-blue-600 uppercase">Very Good (ከ80% - 90%)</span>
                            <h3 className="text-3xl font-black text-slate-800 mt-2">{analysisData.between80And90.total} <span className="text-sm font-normal text-slate-400">Students</span></h3>
                            <p className="text-xs text-slate-500 mt-1 font-semibold">👨 {analysisData.between80And90.male} Male • 👩 {analysisData.between80And90.female} Female</p>
                        </div>

                        {/* between70And80 */}
                        <div 
                            onClick={() => setActiveRangeKey('between70And80')}
                            className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                                activeRangeKey === 'between70And80' ? 'bg-yellow-50 border-yellow-300 ring-4 ring-yellow-100 shadow-md' : 'bg-white border-slate-200'
                            }`}
                        >
                            <span className="text-xs font-bold text-yellow-600 uppercase">Good (ከ70% - 80%)</span>
                            <h3 className="text-3xl font-black text-slate-800 mt-2">{analysisData.between70And80.total} <span className="text-sm font-normal text-slate-400">Students</span></h3>
                            <p className="text-xs text-slate-500 mt-1 font-semibold">👨 {analysisData.between70And80.male} Male • 👩 {analysisData.between70And80.female} Female</p>
                        </div>
                    </div>

                    {/* DETAILED STUDENT LIST BY RANGE (የተማሪዎች ዝርዝር) */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-4">
                        <div className="flex justify-between items-center border-b pb-3 no-print">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 uppercase">
                                    Recipients in range: {analysisData[activeRangeKey].label}
                                </h3>
                                <p className="text-xs text-slate-400">Total in range: {analysisData[activeRangeKey].total} students (👨 {analysisData[activeRangeKey].male} • 👩 {analysisData[activeRangeKey].female})</p>
                            </div>
                            <button onClick={() => window.print()} className="bg-slate-800 text-white px-5 py-2 rounded-xl font-bold text-xs hover:bg-slate-900 transition-colors">
                                🖨️ Print list
                            </button>
                        </div>

                        {/* Official Print Header */}
                        <div className="hidden print:block text-center border-b pb-4 mb-6">
                            <h1 className="text-2xl font-black uppercase">Freedom Primary School</h1>
                            <h2 className="text-lg font-bold text-slate-600 uppercase mt-1">Student Performance Range Report</h2>
                            <p className="text-xs text-slate-500 font-mono mt-1">Class: {selectedGrade} • Year: {academicYear} • Range: {analysisData[activeRangeKey].label}</p>
                        </div>

                        {analysisData[activeRangeKey].students.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border border-slate-100">
                                <table className="min-w-full divide-y divide-slate-100 border-collapse border border-slate-300">
                                    <thead className="bg-slate-50 uppercase text-xs font-bold text-slate-400">
                                        <tr>
                                            <th className="px-6 py-4 text-left border border-slate-200">#</th>
                                            <th className="px-6 py-3 text-left border border-slate-200">Student ID</th>
                                            <th className="px-6 py-3 text-left border border-slate-200">Full Name</th>
                                            <th className="px-6 py-3 text-center border border-slate-200">Gender</th>
                                            <th className="px-6 py-3 text-right border border-slate-200">Overall Average</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 bg-white text-xs font-semibold">
                                        {analysisData[activeRangeKey].students.map((student, idx) => (
                                            <tr key={student._id} className="hover:bg-slate-50">
                                                <td className="px-6 py-3.5 border border-slate-200 text-slate-400 font-mono">{idx + 1}</td>
                                                <td className="px-6 py-3.5 border border-slate-200 font-mono text-slate-500">{student.studentId}</td>
                                                <td className="px-6 py-3.5 border border-slate-200 font-bold text-slate-800">{student.fullName}</td>
                                                <td className="px-6 py-3.5 border border-slate-200 text-center text-slate-500">{student.gender}</td>
                                                <td className="px-6 py-3.5 border border-slate-200 text-right text-indigo-600 font-black text-sm">{student.overallAverage}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-slate-400 py-10 italic">No students found in this range for {selectedGrade}.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OverallAverageAnalysisPage;