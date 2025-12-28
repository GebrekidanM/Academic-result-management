import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import rosterService from '../services/rosterService';
import authService from '../services/authService';
import userService from '../services/userService';
import subjectService from '../services/subjectService';

const CertificatePage = () => {
    const { t } = useTranslation();
    const [currentUser] = useState(authService.getCurrentUser());
    
    // Config State
    const [availableGrades, setAvailableGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [semester, setSemester] = useState('First Semester');
    const [academicYear, setAcademicYear] = useState('2018');
    const [awardDate, setAwardDate] = useState(new Date().toLocaleDateString());

    // Data State
    const [topStudents, setTopStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // --- 1. Load available grades (Reused logic) ---
    useEffect(() => {
        const loadConfig = async () => {
            try {
                let grades = [];
                if (['admin', 'staff'].includes(currentUser.role)) {
                    const res = await subjectService.getAllSubjects();
                    grades = [...new Set(res.data.data.map(s => s.gradeLevel))].sort();
                } else if (currentUser.role === 'teacher') {
                    const res = await userService.getProfile();
                    const gradeSet = new Set();
                    if (res.data.homeroomGrade) gradeSet.add(res.data.homeroomGrade);
                    res.data.subjectsTaught?.forEach(s => s.subject && gradeSet.add(s.subject.gradeLevel));
                    grades = Array.from(gradeSet).sort();
                }
                setAvailableGrades(grades);
            } catch (err) { console.error(err); }
        };
        loadConfig();
    }, [currentUser]);

    // --- 2. Generate Certificates ---
    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!selectedGrade) return;
        setLoading(true);
        setError('');
        setTopStudents([]);

        try {
            // We use the Roster Service because it calculates ranks automatically
            const response = await rosterService.getRoster({
                gradeLevel: selectedGrade,
                academicYear
            });

            const roster = response.data.roster;
            
            // Filter Top 3 based on selected semester
            const rankedList = roster.filter(student => {
                let rank = 999;
                if (semester === 'First Semester') rank = student.rank1st;
                else if (semester === 'Second Semester') rank = student.rank2nd;
                
                // Ensure rank is a number and between 1 and 3
                return typeof rank === 'number' && rank >= 1 && rank <= 3;
            });

            // Sort 1 -> 3
            rankedList.sort((a, b) => {
                const rA = semester === 'First Semester' ? a.rank1st : a.rank1st;
                const rB = semester === 'First Semester' ? b.rank1st : b.rank1st;
                return rA - rB;
            });

            if (rankedList.length === 0) {
                setError(t('no_top_students'));
            } else {
                setTopStudents(rankedList);
            }

        } catch (err) {
            setError(t('error'));
        } finally {
            setLoading(false);
        }
    };

    // Helper to get Rank Text
    const getRankText = (student) => {
        const rank = semester === 'First Semester' ? student.rank1st : student.rank2nd;
        if (rank === 1) return t('rank_1'); 
        if (rank === 2) return t('rank_2'); 
        if (rank === 3) return t('rank_3');
        return `${rank}th`;
    };

    // Helper for Rank Color
    const getRankColor = (student) => {
        const rank = semester === 'First Semester' ? student.rank1st : student.rank2nd;
        if (rank === 1) return "text-yellow-600 border-yellow-500"; // Gold
        if (rank === 2) return "text-gray-500 border-gray-400";     // Silver
        if (rank === 3) return "text-orange-700 border-orange-600"; // Bronze
        return "text-blue-900 border-blue-900";
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6 font-sans print:bg-white print:p-0">
            
            {/* PRINT CSS */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cinzel:wght@700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
                
                @media print {
                    @page { size: A4 landscape; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .print-page {
                        width: 100%;
                        height: 190mm; /* Fit on Landscape A4 */
                        page-break-after: always;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                }

                .font-script { font-family: 'Great Vibes', cursive; }
                .font-cinzel { font-family: 'Cinzel', serif; }
            `}</style>

            {/* CONTROLS */}
            <div className="no-print bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">🏆 {t('certificate_generator')}</h2>
                <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">{t('grade')}</label>
                        <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="w-full border p-2 rounded">
                            <option value="">-- {t('select_class')} --</option>
                            {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">{t('semester')}</label>
                        <select value={semester} onChange={e => setSemester(e.target.value)} className="w-full border p-2 rounded">
                            <option value="First Semester">{t('sem_1')}</option>
                            <option value="Second Semester">{t('sem_2')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">{t('date')}</label>
                        <input type="text" value={awardDate} onChange={e => setAwardDate(e.target.value)} className="w-full border p-2 rounded" />
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 w-full" disabled={loading}>
                            {loading ? t('loading') : t('generate_certificates')}
                        </button>
                        {topStudents.length > 0 && (
                            <button type="button" onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-2 rounded font-bold hover:bg-gray-900">
                                🖨️
                            </button>
                        )}
                    </div>
                </form>
                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
            </div>

            {/* PREVIEW AREA */}
            <div className="flex flex-col items-center gap-8">
                {topStudents.map((student, index) => (
                    <div key={student.studentId} className="print-page w-full max-w-[270mm] h-[190mm] bg-[#fffdf5] border-[10px] border-double border-blue-900 p-8 relative shadow-xl print:shadow-none mx-auto">
                        
                        {/* Decorative Corners */}
                        <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-yellow-500"></div>
                        <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-yellow-500"></div>
                        <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-yellow-500"></div>
                        <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-yellow-500"></div>

                        {/* Certificate Content */}
                        <div className="h-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center p-8 relative">
                            
                            {/* Gold Seal Effect */}
                            <div className="absolute top-4 right-8">
                                <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center text-white font-black shadow-lg border-4 border-yellow-300 transform rotate-12">
                                    <div className="text-center leading-none">
                                        <span className="block text-sm">RANK</span>
                                        <span className="block text-4xl">{index + 1}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Header */}
                            <h1 className="text-4xl md:text-5xl font-cinzel font-bold text-blue-900 uppercase tracking-widest mb-2">
                                {t('certificate_of_excellence')}
                            </h1>
                            <div className="w-1/3 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mb-8"></div>

                            {/* Body */}
                            <p className="text-lg text-gray-600 uppercase tracking-wide mb-4 font-serif">
                                {t('awarded_to')}
                            </p>
                            
                            <h2 className="text-4xl md:text-5xl font-script text-black mb-6 px-8 border-b-2 border-gray-300 inline-block min-w-[50%] pb-2">
                                {student.fullName}
                            </h2>

                            <p className="text-xl text-gray-700 font-serif leading-relaxed">
                                {t('for_achieving')} <span className={`font-bold border-b-2 px-2 ${getRankColor(student)}`}>{getRankText(student)}</span> {t('in_grade')} <strong>{selectedGrade}</strong> <br/>
                                <span className="text-base text-gray-500 mt-2 block">{semester} | {academicYear}</span>
                            </p>

                            {/* Footer / Signatures */}
                            <div className="absolute bottom-10 w-full flex justify-between px-20">
                                <div className="text-center">
                                    <div className="w-64 border-b-2 border-black mb-2"></div>
                                    <p className="font-bold text-blue-900 uppercase text-sm">{t('date_awarded')}: {awardDate}</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-64 border-b-2 border-black mb-2"></div>
                                    <p className="font-bold text-blue-900 uppercase text-sm">{t('principal_signature')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CertificatePage;