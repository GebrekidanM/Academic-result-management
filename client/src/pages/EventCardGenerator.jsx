import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import studentService from '../services/studentService';
import authService from '../services/authService';
import userService from '../services/userService';

const EventCardGenerator = () => {
    const { t } = useTranslation();
    
    const [currentUser] = useState(authService.getCurrentUser());
    const [allStudents, setAllStudents] = useState([]);
    const [availableGrades, setAvailableGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [loading, setLoading] = useState(true);

    const [eventTitle, setEventTitle] = useState(t('default_event_title') || 'EVENT TITLE');
    const [bodyMessage, setBodyMessage] = useState(t('default_event_msg') || 'You are invited.');
    const [footerText, setFooterText] = useState(t('default_event_footer') || 'ADMIT ONE'); 
    
    const [cardsPerPage, setCardsPerPage] = useState(4); 
    const [customLogo, setCustomLogo] = useState(null); 

    // --- 1. FETCH DATA ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await studentService.getAllStudents();
                const students = res.data.data;
                setAllStudents(students);

                let allowed = [];
                if (['admin', 'staff'].includes(currentUser.role)) {
                    const uniqueGrades = [...new Set(students.map(s => s.gradeLevel))].sort();
                    const level = currentUser.schoolLevel ? currentUser.schoolLevel.toLowerCase() : 'all';
                    if (currentUser.role === 'admin' || level === 'all') allowed = uniqueGrades;
                    else if (level === 'kg') allowed = uniqueGrades.filter(g => /^(kg|nursery)/i.test(g));
                    else if (level === 'primary') allowed = uniqueGrades.filter(g => /^Grade\s*[1-8](\D|$)/i.test(g));
                    else if (level === 'high school') allowed = uniqueGrades.filter(g => /^Grade\s*(9|1[0-2])(\D|$)/i.test(g));
                } else if (currentUser.role === 'teacher') {
                    try {
                        const profile = await userService.getProfile();
                        const gradeSet = new Set();
                        if (profile.data.homeroomGrade) gradeSet.add(profile.data.homeroomGrade);
                        profile.data.subjectsTaught?.forEach(s => s.subject && gradeSet.add(s.subject.gradeLevel));
                        allowed = Array.from(gradeSet).sort();
                    } catch (e) {
                        allowed = [...new Set(students.map(s => s.gradeLevel))].sort();
                    }
                }
                setAvailableGrades(allowed);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [currentUser]);

    const targetStudents = useMemo(() => {
        if (!selectedGrade) return [];
        return allStudents
            .filter(s => s.gradeLevel === selectedGrade)
            .sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [selectedGrade, allStudents]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCustomLogo(url);
        }
    };

    const pages = useMemo(() => {
        if (!targetStudents.length) return [];
        const chunks = [];
        for (let i = 0; i < targetStudents.length; i += cardsPerPage) {
            chunks.push(targetStudents.slice(i, i + cardsPerPage));
        }
        return chunks;
    }, [targetStudents, cardsPerPage]);

    // --- DYNAMIC STYLING HELPERS ---
    
    // 1. Grid Gap Logic (Tighter for 8 cards)
    const getGridClass = () => {
        switch (Number(cardsPerPage)) {
            case 2: return "grid-cols-1 grid-rows-2 gap-y-10"; 
            case 4: return "grid-cols-2 grid-rows-2 gap-6";   
            case 6: return "grid-cols-2 grid-rows-3 gap-4";   
            case 8: return "grid-cols-2 grid-rows-4 gap-y-2 gap-x-4"; // Very tight vertical gap
            default: return "grid-cols-2 gap-6";
        }
    };

    // 2. Element Sizing Logic (Mini vs Normal)
    const isMini = cardsPerPage >= 8;

    const size = {
        title: isMini ? "text-lg" : "text-2xl md:text-3xl",
        schoolName: isMini ? "text-[8px] tracking-wide" : "text-[10px] tracking-[0.2em]",
        logo: isMini ? "h-6 w-6" : "h-10 w-10",
        photoContainer: isMini ? "w-14 h-16" : "w-20 h-24", // Smaller photo box
        name: isMini ? "text-sm" : "text-xl",
        gradeLabel: isMini ? "text-[9px] px-2 py-0" : "text-[10px] px-3 py-0.5",
        message: isMini ? "text-[10px] leading-tight" : "text-xs leading-snug",
        padding: isMini ? "px-3 py-1" : "px-6 py-2",
        headerPadding: isMini ? "pt-2 pb-1" : "pt-4 pb-2",
        footerPadding: isMini ? "py-1 px-3" : "py-2 px-5",
    };

    const flexType = () => {

        return cardsPerPage <= 4 ? "flex-col items-center justify-center" : "flex-row items-center ";
    };

    if (loading) return <div className="p-10 text-center">{t('loading')}</div>;

    return (
        <div className="bg-gray-200 min-h-screen p-6 font-sans print:bg-white print:p-0">
            
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');

                @media print {
                    @page { 
                        size: A4 portrait; 
                        /* Tighter margins to fit 4 rows */
                        margin: 8mm; 
                    }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    
                    .print-page {
                        width: 100%;
                        /* A4 height is 297mm. Minus 16mm margin = ~280mm safe area. */
                        height: 280mm; 
                        page-break-after: always;
                        display: grid;
                        align-content: stretch; /* Stretch to fill space */
                    }
                    .print-page:last-child { page-break-after: auto; }
                }
                
                .ceremonial-border {
                    border: 3px double #1e3a8a;
                    position: relative;
                }
                /* Thin inner gold line */
                .ceremonial-border::after {
                    content: '';
                    position: absolute;
                    top: 3px; left: 3px; right: 3px; bottom: 3px;
                    border: 1px solid #d4af37;
                    pointer-events: none;
                }
            `}</style>

            {/* --- CONTROLS (Hidden on Print) --- */}
            <div className="no-print bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200 max-w-6xl mx-auto">
                {/* ... (Controls UI remains the same) ... */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">🎖️ {t('event_generator_title')}</h2>
                    <button onClick={() => window.print()} disabled={!selectedGrade} className="bg-gradient-to-r from-blue-800 to-blue-900 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                        🖨️ {t('print')}
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">1. {t('audience')}</label>
                        <select className="w-full border p-2 rounded bg-gray-50" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                            <option value="">-- {t('select_class')} --</option>
                            {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">2. {t('content')}</label>
                        <input type="text" placeholder={t('card_title_placeholder')} value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="w-full border p-2 rounded mb-2 font-bold" />
                        <textarea placeholder={t('card_body_placeholder')} value={bodyMessage} onChange={(e) => setBodyMessage(e.target.value)} className="w-full border p-2 rounded mb-2 text-sm h-12 resize-none" />
                        <input type="text" placeholder={t('card_footer_placeholder')} value={footerText} onChange={(e) => setFooterText(e.target.value)} className="w-full border p-2 rounded text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">3. {t('design')}</label>
                        <div className="flex gap-2">
                             <select className="border p-2 rounded w-1/2 text-sm bg-gray-50" value={cardsPerPage} onChange={(e) => setCardsPerPage(Number(e.target.value))}>
                                <option value={2}>{t('layout_2')}</option>
                                <option value={4}>{t('layout_4')}</option>
                                <option value={6}>{t('layout_6')}</option>
                                <option value={8}>{t('layout_8')}</option>
                            </select>
                            <div className="relative w-1/2">
                                <input type="file" id="logoUpload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                <label htmlFor="logoUpload" className="block w-full border border-dashed border-gray-400 p-2 rounded text-center text-sm cursor-pointer hover:bg-gray-50">
                                    📷 {customLogo ? t('change_logo') : t('upload_logo')}
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PREVIEW AREA --- */}
            {selectedGrade ? (
                <div className="flex flex-col items-center">
                    {pages.map((pageStudents, pageIndex) => (
                        <div key={pageIndex} className={`print-page ${getGridClass()} grid bg-white shadow-2xl mb-8 print:shadow-none print:mb-0`}>
                            {pageStudents.map((student) => (
                                <div key={student._id} className="relative bg-[#fffdf5] ceremonial-border rounded-lg flex flex-col overflow-hidden break-inside-avoid print:break-inside-avoid shadow-sm h-full">
                                    
                                    {/* Watermark */}
                                    {customLogo && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
                                            <img src={customLogo} className="w-3/4 h-3/4 object-contain grayscale blur-[1px]" alt="" />
                                        </div>
                                    )}

                                    {/* --- HEADER --- */}
                                    <div className={`relative z-10 text-center ${size.headerPadding}`}>
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-600 rounded-b-lg shadow-sm"></div>

                                        {customLogo && (
                                            <img src={customLogo} alt="Logo" className={`${size.logo} object-contain mx-auto mb-1`} />
                                        )}

                                        <h3 className={`${size.schoolName} font-bold text-gray-400 uppercase`}>
                                            {t('app_name')}
                                        </h3>

                                        <h2
                                            className={`${size.title} font-bold text-blue-900 tracking-wide mt-0.5 drop-shadow-sm`}
                                            style={{ fontFamily: '"Cinzel", serif' }}
                                        >
                                            {eventTitle}
                                        </h2>
                                    </div>

                                    {/* --- BODY --- */}
                                    <div className={`z-10 flex-1 flex ${flexType()} ${size.padding} gap-3`}>
                                        
                                        {/* Photo Frame */}
                                        <div className="shrink-0 relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg blur opacity-30"></div>
                                            <div className={`relative ${size.photoContainer} rounded-lg overflow-hidden shadow-md border-2 border-white bg-white`}>
                                                {student.imageUrl ? (
                                                    <img src={student.imageUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[8px] text-gray-400">No Photo</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Text Info */}
                                        <div className="flex-1 text-center">
                                            <p className="text-[8px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">{t('presented_to')}</p>
                                            <h3 className={`${size.name} font-bold text-gray-900 leading-none tracking-wide`} style={{ fontFamily: '"Playfair Display", serif' }}>
                                                {student.fullName}
                                            </h3>
                                            <div className={`inline-flex items-center ${size.gradeLabel} rounded-full bg-blue-50 border border-blue-100 font-bold uppercase text-blue-800 tracking-wide mb-1 mt-1`}>
                                                {student.gradeLevel}
                                            </div>
                                            {/* Hide separator line if mini to save space */}
                                            {!isMini && <div className="w-10 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mb-1"></div>}
                                            
                                            <p className={`${size.message} font-serif italic text-gray-600 px-1`}>
                                                “{bodyMessage}”
                                            </p>
                                        </div>
                                    </div>

                                    {/* --- FOOTER --- */}
                                    <div className={`z-10 bg-gradient-to-r from-blue-900 to-indigo-900 text-white ${size.footerPadding} flex justify-between items-center text-[9px] uppercase tracking-widest shadow-inner mt-auto`}>
                                        <span className="opacity-80 font-mono">{student.studentId}</span>
                                        <span className="font-bold text-yellow-400 drop-shadow-md">{footerText}</span>
                                    </div>

                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center mt-20">
                    <div className="inline-block p-8 border-4 border-dashed border-gray-300 rounded-2xl bg-white text-gray-400 font-bold text-xl">
                        {t('select_grade_msg')}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventCardGenerator;