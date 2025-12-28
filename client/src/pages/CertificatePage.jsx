import React, { useState, useEffect } from 'react';
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

    // --- 1. Load available grades ---
    useEffect(() => {
        const loadConfig = async () => {
            try {
                let grades = [];
                if (['admin', 'staff', 'principal'].includes(currentUser.role)) {
                    const res = await subjectService.getAllSubjects();
                    const allSubjects = res.data.data || res.data;
                    grades = [...new Set(allSubjects.map(s => s.gradeLevel))].sort();
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
                return typeof rank === 'number' && rank >= 1 && rank <= 3;
            });

            // Sort 1 -> 3
            rankedList.sort((a, b) => {
                const rA = semester === 'First Semester' ? a.rank1st : a.rank2nd;
                const rB = semester === 'First Semester' ? b.rank1st : b.rank2nd;
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

    // --- Helpers ---
    const getStudentStats = (student) => {
        if (semester === 'First Semester') {
            return { 
                rank: student.rank1st, 
                avg: student.firstSemester.average.toFixed(1) 
            };
        } else {
            return { 
                rank: student.rank2nd, 
                avg: student.secondSemester.average.toFixed(1) 
            };
        }
    };

    const getRankColor = (rank) => {
        if (rank === 1) return "text-yellow-600 border-yellow-500 bg-yellow-50"; // Gold
        if (rank === 2) return "text-gray-500 border-gray-400 bg-gray-50";     // Silver
        if (rank === 3) return "text-orange-700 border-orange-600 bg-orange-50"; // Bronze
        return "text-blue-900 border-blue-900";
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6 font-sans print:bg-white print:p-0">
            
            {/* PRINT CSS */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cinzel:wght@700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Noto+Sans+Ethiopic:wght@400;700&display=swap');
                
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
                .font-amharic { font-family: 'Noto Sans Ethiopic', serif; }
            `}</style>

            {/* CONTROLS (Hidden on Print) */}
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
                {topStudents.map((student, index) => {
                    const stats = getStudentStats(student);
                    
                    return (
                        <div key={student.studentId} className="print-page w-full max-w-[270mm] h-[190mm] bg-[#fffdf5] border-[10px] border-double border-blue-900 p-8 relative shadow-xl print:shadow-none mx-auto flex flex-col justify-between">
                            
                            {/* Decorative Corners */}
                            <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-yellow-500"></div>
                            <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-yellow-500"></div>
                            <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-yellow-500"></div>
                            <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-yellow-500"></div>

                            {/* --- HEADER --- */}
                            <div className="text-center mt-4">
                                <h1 className="text-4xl md:text-5xl font-cinzel font-bold text-blue-900 uppercase tracking-widest mb-1">
                                    {t('certificate_of_excellence')}
                                </h1>
                                <h2 className="text-2xl font-amharic font-bold text-blue-900">
                                    የላቀ ውጤት የምስክር ወረቀት
                                </h2>
                                <div className="w-1/3 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mt-4"></div>
                            </div>

                            {/* --- BODY (Side by Side) --- */}
                            <div className="flex-1 flex flex-col justify-center items-center gap-6">
                                
                                {/* 1. Awarded To */}
                                <div className="flex w-full justify-center items-end gap-4 text-gray-600">
                                    <div className="text-right w-1/2 font-serif italic text-lg">{t('certificate_body_en')}</div>
                                    <div className="w-px h-6 bg-gray-300"></div>
                                    <div className="text-left w-1/2 font-amharic font-bold text-lg">{t('certificate_body_am')}</div>
                                </div>

                                {/* 2. Student Name */}
                                <h2 className="text-4xl md:text-5xl font-script text-black px-12 border-b-2 border-gray-300 pb-2">
                                    {student.fullName}
                                </h2>

                                {/* 3. Achievement Details (English & Amharic Side by Side) */}
                                <div className="flex w-full justify-between items-center px-10 gap-4 mt-2">
                                    
                                    {/* English Side */}
                                    <div className="text-right flex-1">
                                        <p className="font-serif text-gray-700 text-lg">
                                            For achieving <span className={`font-bold px-2 py-0.5 rounded border ${getRankColor(stats.rank)}`}>{stats.rank === 1 ? '1st' : stats.rank === 2 ? '2nd' : '3rd'} Place</span>
                                        </p>
                                        <p className="font-serif text-gray-700 text-lg mt-1">
                                            {t('with_average')} <strong>{stats.avg}%</strong>
                                        </p>
                                        <p className="text-sm text-gray-500 mt-2 font-bold uppercase tracking-widest">
                                            {selectedGrade} | {semester}
                                        </p>
                                    </div>

                                    {/* Divider */}
                                    <div className="w-px h-20 bg-yellow-500"></div>

                                    {/* Amharic Side */}
                                    <div className="text-left flex-1 font-amharic">
                                        <p className="text-gray-700 text-lg">
                                            <span className={`font-bold px-2 py-0.5 rounded border ${getRankColor(stats.rank)}`}>{stats.rank}ኛ ደረጃ</span> በመውጣት
                                        </p>
                                        <p className="text-gray-700 text-lg mt-1">
                                            እንዲሁም <strong>{stats.avg}%</strong> አማካይ በማምጣት
                                        </p>
                                        <p className="text-sm text-gray-500 mt-2 font-bold">
                                            በ{academicYear} ዓ.ም ተሰጥታአል።
                                        </p>
                                    </div>

                                </div>
                            </div>

                            {/* --- FOOTER --- */}
                            <div className="w-full flex justify-between px-20 mb-8">
                                <div className="text-center">
                                    <div className="w-64 border-b-2 border-black mb-2"></div>
                                    <p className="font-bold text-blue-900 uppercase text-xs tracking-wider">{t('date_awarded')}</p>
                                    <p className="text-xs font-bold text-gray-500">{awardDate}</p>
                                </div>
                                
                                {/* Gold Seal */}
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                                     <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center text-white font-black shadow-lg border-4 border-yellow-300">
                                        <div className="text-center leading-none">
                                            <span className="block text-sm opacity-80">RANK</span>
                                            <span className="block text-4xl">{stats.rank}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <div className="w-64 border-b-2 border-black mb-2"></div>
                                    <p className="font-bold text-blue-900 uppercase text-xs tracking-wider">{t('principal_signature')}</p>
                                </div>
                            </div>

                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CertificatePage;