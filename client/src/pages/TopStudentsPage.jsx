import React, { useState, useEffect } from 'react';
import reportCardService from '../services/reportCardService';

const TopStudentsPage = () => {
    const [highScorers, setHighScorers] = useState({});
    const [loading, setLoading] = useState(false);
    const [academicYear, setAcademicYear] = useState('2018');
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

    // Sort Grade Levels Naturally (1A, 1B, 2A...)
    const sortedGrades = Object.keys(highScorers).sort();

    // Helper for Rank Colors
    const getRankBadge = (rank) => {
        if (rank === 1) return <span className="text-2xl">🥇</span>;
        if (rank === 2) return <span className="text-2xl">🥈</span>;
        if (rank === 3) return <span className="text-2xl">🥉</span>;
    };

    const getRankStyle = (rank) => {
        if (rank === 1) return "bg-yellow-50 border-yellow-200";
        if (rank === 2) return "bg-gray-50 border-gray-200";
        if (rank === 3) return "bg-orange-50 border-orange-200";
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6 font-sans">
            
            {/* Header & Controls */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
                <h1 className="text-3xl font-bold text-slate-800">🏆 Top Scorers / የደረጃ ተማሪዎች</h1>
                
                <div className="flex gap-4 items-center">
                    {/* Year Selector */}
                    <input 
                        type="number" 
                        value={academicYear} 
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className="p-2 border rounded font-bold w-24 text-center"
                    />

                    {/* Mode Selector */}
                    <div className="bg-white p-1 rounded-lg shadow border flex">
                        <button onClick={() => setViewMode('sem1')} className={`px-4 py-2 rounded text-sm font-bold ${viewMode === 'sem1' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>Sem 1</button>
                        <button onClick={() => setViewMode('sem2')} className={`px-4 py-2 rounded text-sm font-bold ${viewMode === 'sem2' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>Sem 2</button>
                        <button onClick={() => setViewMode('overall')} className={`px-4 py-2 rounded text-sm font-bold ${viewMode === 'overall' ? 'bg-purple-600 text-white' : 'text-gray-500'}`}>Overall</button>
                    </div>

                    <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded font-bold hover:bg-slate-700">
                        🖨️ Print
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="text-center text-xl text-gray-500 mt-20">Calculating Ranks...</div>
            ) : (
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedGrades.map(grade => {
                        // Get students for the selected mode
                        const students = highScorers[grade]?.[viewMode] || [];

                        if (students.length === 0) return null;

                        return (
                            <div key={grade} className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-200 break-inside-avoid">
                                {/* Card Header */}
                                <div className="bg-slate-900 text-white p-4 text-center">
                                    <h2 className="text-xl font-bold">{grade}</h2>
                                    <p className="text-xs opacity-70 uppercase tracking-widest">{viewMode === 'overall' ? 'Annual Top 3' : `${viewMode === 'sem1' ? '1st' : '2nd'} Semester Top 3`}</p>
                                </div>

                                {/* List */}
                                <div className="p-2">
                                    {students.map((student) => (
                                        <div key={student._id} className={`flex items-center gap-4 p-3 mb-2 rounded-lg border ${getRankStyle(student.rank)}`}>
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
                                                <h3 className="font-bold text-slate-800 truncate">{student.fullName}</h3>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border">
                                                        Avg: <strong className="text-slate-900 text-sm">{student.average}%</strong>
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
            <div className="hidden print:flex fixed bottom-0 left-0 w-full justify-center p-4 text-xs text-gray-400">
                Generated by Freedom School Management System
            </div>
        </div>
    );
};

export default TopStudentsPage;