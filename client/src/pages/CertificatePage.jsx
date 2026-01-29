import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import reportCardService from '../services/reportCardService';
import authService from '../services/authService';
import userService from '../services/userService';
import subjectService from '../services/subjectService';

// --- 1. ADD DATE HELPER ---
const getCurrentEthYear = () => {
    const now = new Date();
    const gcYear = now.getFullYear();
    const gcMonth = now.getMonth() + 1; 
    // If Month is Sept (9) or later, it's the new Eth Year (GC - 7), else (GC - 8)
    return gcMonth >= 9 ? (gcYear - 7).toString() : (gcYear - 8).toString();
};

const CertificatePage = () => {
    const { t } = useTranslation();
    const componentRef = useRef();

    const [currentUser] = useState(authService.getCurrentUser());
    
    // --- STATE ---
    const [availableGrades, setAvailableGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [semester, setSemester] = useState('First Semester');
    
    // --- 2. FIX: USE DYNAMIC YEAR ---
    const [academicYear, setAcademicYear] = useState(getCurrentEthYear());
    
    const [awardDate, setAwardDate] = useState(new Date().toLocaleDateString('en-GB'));
    const [topStudents, setTopStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // --- Load available grades ---
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

    // --- Generate Certificates ---
    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!selectedGrade) return;
        setLoading(true);
        setError('');
        setTopStudents([]);

        try {
            // Sends the corrected academicYear to the backend
            const response = await reportCardService.getCertificateData(selectedGrade, academicYear);
            const roster = response.data; 
            
            const rankedList = roster.filter(student => {
                let rank = 999;
                if (semester === 'First Semester') rank = student.sem1.rank;
                else if (semester === 'Second Semester') rank = student.sem2.rank;
                else rank = student.overall.rank; 

                // Strictly check rank 1, 2, or 3
                return rank !== '-' && Number(rank) >= 1 && Number(rank) <= 3;
            });

            rankedList.sort((a, b) => {
                let rA, rB;
                if (semester === 'First Semester') { rA = a.sem1.rank; rB = b.sem1.rank; }
                else if (semester === 'Second Semester') { rA = a.sem2.rank; rB = b.sem2.rank; }
                else { rA = a.overall.rank; rB = b.overall.rank; }
                return rA - rB;
            });

            if (rankedList.length === 0) {
                setError(t('no_top_students') || "No top students found for this year/grade.");
            } else {
                setTopStudents(rankedList);
            }

        } catch (err) {
            console.error(err);
            setError(t('error_generating') || "Error loading data.");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Certificates_${selectedGrade}`,
    });

    const getStudentStats = (student) => {
        if (semester === 'First Semester') {
            return { rank: student.sem1.rank, avg: student.sem1.avg };
        } else if (semester === 'Second Semester') {
            return { rank: student.sem2.rank, avg: student.sem2.avg };
        } else {
            return { rank: student.overall.rank, avg: student.overall.avg };
        }
    };

    const getRankColor = (rank) => {
        if (Number(rank) === 1) return "text-yellow-700 border-yellow-500 bg-yellow-50"; 
        if (Number(rank) === 2) return "text-gray-600 border-gray-400 bg-gray-100";     
        if (Number(rank) === 3) return "text-orange-700 border-orange-600 bg-orange-50"; 
        return "text-blue-900 border-blue-900";
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6 font-sans print:bg-white print:p-0">
            
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cinzel:wght@700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Noto+Sans+Ethiopic:wght@400;700&display=swap');
                
                @media print {
                    @page { size: A4 landscape; margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
                    .no-print { display: none !important; }
                    .print-page {
                        width: 277mm; 
                        height: 190mm; 
                        page-break-after: always;
                        border: 8px double #1e3a8a !important; 
                        background-color: #fffdf5 !important;
                        margin: 0 auto;
                    }
                    .bg-yellow-50 { background-color: #fefce8 !important; }
                    .bg-gray-100 { background-color: #f3f4f6 !important; }
                    .bg-orange-50 { background-color: #fff7ed !important; }
                }

                .font-script { font-family: 'Great Vibes', cursive; }
                .font-cinzel { font-family: 'Cinzel', serif; }
                .font-amharic { font-family: 'Noto Sans Ethiopic', serif; }
            `}</style>

            {/* CONTROLS */}
            <div className="no-print bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">🏆 {t('certificate_generator')}</h2>
                <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">{t('grade')}</label>
                        <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="w-full border p-2 rounded">
                            <option value="">-- Select --</option>
                            {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">{t('semester')}</label>
                        <select value={semester} onChange={e => setSemester(e.target.value)} className="w-full border p-2 rounded">
                            <option value="First Semester">{t('sem_1')}</option>
                            <option value="Second Semester">{t('sem_2')}</option>
                            <option value="Annual">Annual (Overall)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">{t('academic_year')}</label>
                        <input type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full border p-2 rounded" />
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 w-full" disabled={loading}>
                            {loading ? t('loading') : "Generate"}
                        </button>
                        {topStudents.length > 0 && (
                            <button type="button" onClick={handlePrint} className="bg-gray-800 text-white px-4 py-2 rounded font-bold hover:bg-gray-900 shadow-lg">
                                🖨️ Print All
                            </button>
                        )}
                    </div>
                </form>
                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
            </div>

            {/* PREVIEW */}
            <div ref={componentRef} className="flex flex-col items-center gap-10 print:block">
                {topStudents.map((student) => {
                    const stats = getStudentStats(student);
                    
                    return (
                        <div key={student.studentId} className="print-page w-[270mm] h-[190mm] bg-[#fffdf5] border-[8px] border-double border-blue-900 p-8 relative shadow-xl print:shadow-none mx-auto flex flex-col justify-between mb-10 print:mb-0">
                            
                            {/* Decorative Corners */}
                            <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-yellow-500"></div>
                            <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-yellow-500"></div>
                            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-yellow-500"></div>
                            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-yellow-500"></div>

                            {/* HEADER */}
                            <div className="text-center mt-6">
                                <h1 className="text-5xl font-cinzel font-bold text-blue-900 uppercase tracking-widest mb-2">
                                    {t('certificate_of_excellence') || "CERTIFICATE OF EXCELLENCE"}
                                </h1>
                                <h2 className="text-3xl font-amharic font-bold text-blue-900">
                                    የላቀ ውጤት የምስክር ወረቀት
                                </h2>
                                <div className="w-1/3 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mt-6"></div>
                            </div>

                            {/* BODY */}
                            <div className="flex-1 flex flex-col justify-center items-center gap-6">
                                
                                <div className="flex w-full justify-center items-end gap-6 text-gray-600">
                                    <div className="text-right w-1/2 font-serif italic text-xl">This certificate is proudly awarded to</div>
                                    <div className="w-px h-8 bg-gray-300"></div>
                                    <div className="text-left w-1/2 font-amharic font-bold text-xl">ይህ የምስክር ወረቀት የተሰጠው ለ</div>
                                </div>

                                <h2 className="text-6xl font-script text-black px-12 border-b-2 border-gray-300 pb-2 min-w-[60%] text-center">
                                    {student.fullName}
                                </h2>

                                <div className="flex w-full justify-between items-center px-16 gap-8 mt-4">
                                    
                                    <div className="text-right flex-1">
                                        <p className="font-serif text-gray-700 text-xl">
                                            For achieving <span className={`font-bold px-3 py-1 rounded border ${getRankColor(Number(stats.rank))}`}>
                                                {stats.rank == 1 ? '1st' : stats.rank == 2 ? '2nd' : '3rd'} Place
                                            </span>
                                        </p>
                                        <p className="font-serif text-gray-700 text-lg mt-2">
                                            With an Average of <strong>{stats.avg}%</strong>
                                        </p>
                                        <p className="text-sm text-gray-500 mt-2 font-bold uppercase tracking-widest">
                                            {selectedGrade} | {semester}
                                        </p>
                                    </div>

                                    <div className="w-px h-24 bg-yellow-500"></div>

                                    <div className="text-left flex-1 font-amharic">
                                        <p className="text-gray-700 text-xl">
                                            <span className={`font-bold px-3 py-1 rounded border ${getRankColor(Number(stats.rank))}`}>
                                                {stats.rank}ኛ ደረጃ
                                            </span> በመውጣት
                                        </p>
                                        <p className="text-gray-700 text-lg mt-2">
                                            እንዲሁም <strong>{stats.avg}%</strong> አማካይ በማምጣት
                                        </p>
                                        <p className="text-sm text-gray-500 mt-2 font-bold">
                                            በ{academicYear} ዓ.ም ተሰጥታአል።
                                        </p>
                                    </div>

                                </div>
                            </div>

                            {/* FOOTER */}
                            <div className="w-full flex justify-between px-20 mb-8 items-end relative">
                                <div className="text-center">
                                    <div className="w-64 border-b-2 border-black mb-2"></div>
                                    <p className="font-bold text-blue-900 uppercase text-xs tracking-wider">{t('date')}</p>
                                    <p className="text-xs font-bold text-gray-500">{awardDate}</p>
                                </div>
                                
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                                     <div className="w-32 h-32 bg-yellow-500 rounded-full flex items-center justify-center text-white font-black shadow-xl border-[6px] border-yellow-300">
                                        <div className="text-center leading-none">
                                            <span className="block text-sm opacity-80 mb-1">RANK</span>
                                            <span className="block text-5xl drop-shadow-md">{stats.rank}</span>
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