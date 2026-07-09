import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import reportCardService from '@shared/services/reportCardService';

// ⚠️ የኢትዮጵያን የአሁኑን ዓመተ ምህረት በራስ-ሰር ለማግኘት የሚያግዝ ረዳት ፈንክሽን
function getCurrentAcademicYear() {
    const today = new Date();
    const gregYear = today.getFullYear();
    const gregMonth = today.getMonth() + 1;
    return gregMonth >= 9 ? gregYear - 7 : gregYear - 8;
}

const TopStudentsPage = () => {
    const { t } = useTranslation();
    const currentYear = getCurrentAcademicYear().toString();

    // --- STATE ---
    const [highScorers, setHighScorers] = useState({});
    const [loading, setLoading] = useState(false);
    // ⚠️ ማስተካከያ 1፦ አመቱ በነባሪነት የአሁኑን የኢትዮጵያ ዓመት እንዲይዝ ተደርጓል [11]
    const [academicYear, setAcademicYear] = useState(currentYear);
    const [viewMode, setViewMode] = useState('overall'); // 'sem1', 'sem2', 'overall'

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await reportCardService.getHighScorers(academicYear);
                setHighScorers(res.data.data || {});
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [academicYear]);

    // ⚠️ ማስተካከያ 2፦ የክፍል ደረጃዎችን በቁጥር ቅደም ተከተል (Grade 2 ከ Grade 10 በፊት እንዲመጣ) ማሰለፍ
    const sortedGrades = useMemo(() => {
        return Object.keys(highScorers).sort((a, b) => 
            a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
        );
    }, [highScorers]);

    // Helper for Rank Badges
    const getRankBadge = (rank) => {
        if (rank === 1) return <span className="text-2xl">🥇</span>;
        if (rank === 2) return <span className="text-2xl">🥈</span>;
        if (rank === 3) return <span className="text-2xl">🥉</span>;
        return <span className="text-sm font-bold">#{rank}</span>;
    };

    const getRankStyle = (rank) => {
        if (rank === 1) return "bg-yellow-50 border-yellow-200";
        if (rank === 2) return "bg-gray-50 border-gray-200";
        if (rank === 3) return "bg-orange-50 border-orange-200";
        return "bg-slate-50 border-slate-200";
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-6 font-sans print:bg-white print:p-0">
            {/* HIDE ON PRINT */}
            <style>{`
                @media print {
                    .no-print, nav, button, .sidebar, header { display: none !important; }
                    body { background-color: white !important; margin: 5mm !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
            
            {/* Header & Controls (Hidden on Print) */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4 no-print border-b pb-4">
                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">🏆 {t('high_scorers') || 'Top Scorers / የደረጃ ተማሪዎች'}</h1>
                
                <div className="flex gap-4 items-center flex-wrap">
                    {/* Year Selector */}
                    <input 
                        type="text" // ⚠️ ወደ text ተቀይሯል
                        value={academicYear} 
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className="p-2 border-2 rounded-xl font-bold w-20 text-center outline-none focus:border-pink-500"
                    />

                    {/* Mode Selector */}
                    <div className="bg-white p-1 rounded-xl shadow border flex gap-1">
                        <button onClick={() => setViewMode('sem1')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'sem1' ? 'bg-pink-600 text-white shadow' : 'text-gray-500 hover:text-slate-850'}`}>{t('sem_1_short') || 'Sem 1'}</button>
                        <button onClick={() => setViewMode('sem2')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'sem2' ? 'bg-pink-600 text-white shadow' : 'text-gray-500 hover:text-slate-850'}`}>{t('sem_2_short') || 'Sem 2'}</button>
                        <button onClick={() => setViewMode('overall')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'overall' ? 'bg-pink-600 text-white shadow' : 'text-gray-500 hover:text-slate-850'}`}>{t('overall') || 'Overall'}</button>
                    </div>

                    <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow">
                        🖨️ {t('print')}
                    </button>
                </div>
            </div>

            {/* Print Header (Visible ONLY on Print) */}
            <div className="hidden print:block text-center border-b pb-4 mb-8">
                <h1 className="text-3xl font-black uppercase">Freedom Primary School</h1>
                <h2 className="text-lg font-bold text-slate-600 uppercase mt-1">Outstanding Student Rankings (Top 3)</h2>
                <p className="text-xs text-slate-500 font-mono mt-1">Academic Year: {academicYear} | Mode: {viewMode.toUpperCase()}</p>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="text-center text-xl text-gray-500 mt-20 font-bold animate-pulse">{t('loading')}</div>
            ) : (
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedGrades.map(grade => {
                        const students = highScorers[grade]?.[viewMode] || [];

                        if (students.length === 0) return null;

                        return (
                            <div key={grade} className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden break-inside-avoid animate-slide-up">
                                {/* Card Header */}
                                <div className="bg-slate-900 text-white p-4 text-center">
                                    <h2 className="text-lg font-black">{grade}</h2>
                                    <p className="text-[10px] opacity-70 uppercase tracking-widest font-bold">
                                        {viewMode === 'overall' ? 'Annual Top 3 (አመታዊ)' : `${viewMode === 'sem1' ? '1st' : '2nd'} Semester Top 3`}
                                    </p>
                                </div>

                                {/* List */}
                                <div className="p-3 space-y-2">
                                    {students.map((student) => (
                                        <div key={student._id || student.studentId} className={`flex items-center gap-4 p-3 rounded-xl border ${getRankStyle(student.rank)}`}>
                                            {/* Rank Icon */}
                                            <div className="w-10 text-center">{getRankBadge(student.rank)}</div>
                                            
                                            {/* Photo */}
                                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-200">
                                                {student.photoUrl ? (
                                                    <img src={student.photoUrl} alt="" className="w-full h-full object-cover" />
                                                ) : <span className="text-xl flex items-center justify-center h-full">🎓</span>}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-slate-800 truncate text-sm">{student.fullName}</h3>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded border font-semibold">
                                                        {/* ⚠️ ማስተካከያ 3፦ በመረጥነው viewMode መሰረት መለያው በራስ-ሰር ይቀየራል */}
                                                        {viewMode === 'overall' ? t('average') : t('score')}: <strong className="text-slate-900 text-xs">{(student.average)/2}</strong>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {/* Print Footer */}
            <div className="hidden print:flex fixed bottom-0 left-0 w-full justify-center p-4 text-[10px] text-gray-400 font-bold border-t">
                Generated by Freedom School Information System (SIS)
            </div>
        </div>
    );
};

export default TopStudentsPage;