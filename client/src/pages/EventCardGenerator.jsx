import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import studentService from '../services/studentService';
import authService from '../services/authService';
import userService from '../services/userService';

const EventCardGenerator = () => {
    const { t } = useTranslation();
    
    // --- STATE ---
    const [currentUser] = useState(authService.getCurrentUser());
    const [allStudents, setAllStudents] = useState([]);
    const [availableGrades, setAvailableGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [loading, setLoading] = useState(true);

    // --- CARD CONFIGURATION ---
    const [eventTitle, setEventTitle] = useState('CONGRATULATIONS');
    const [bodyMessage, setBodyMessage] = useState('We are proud of your great achievement!');
    const [footerText, setFooterText] = useState('Thank You'); 
    
    // Fixed: 4 cards per A4 page (A6 Size)
    const cardsPerPage = 4; 
    
    const [customLogo, setCustomLogo] = useState(null); 
    const [coverLogo, setCoverLogo] = useState(null);

    // --- 1. FETCH DATA ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await studentService.getAllStudents();
                setAllStudents(res.data.data);

                let allowed = [];
                if (['admin', 'staff'].includes(currentUser.role)) {
                    const uniqueGrades = [...new Set(res.data.data.map(s => s.gradeLevel))].sort();
                    allowed = uniqueGrades;
                } else if (currentUser.role === 'teacher') {
                    const profile = await userService.getProfile();
                    const gradeSet = new Set();
                    if (profile.data.homeroomGrade) gradeSet.add(profile.data.homeroomGrade);
                    allowed = Array.from(gradeSet).sort();
                }
                setAvailableGrades(allowed);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        loadData();
    }, [currentUser]);

    // --- 2. FILTER & PAGINATION ---
    const targetStudents = useMemo(() => {
        if (!selectedGrade) return [];
        return allStudents.filter(s => s.gradeLevel === selectedGrade).sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [selectedGrade, allStudents]);

    const pages = useMemo(() => {
        if (!targetStudents.length) return [];
        const chunks = [];
        for (let i = 0; i < targetStudents.length; i += cardsPerPage) {
            chunks.push(targetStudents.slice(i, i + cardsPerPage));
        }
        return chunks;
    }, [targetStudents, cardsPerPage]);

    // --- HANDLERS ---
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) setCustomLogo(URL.createObjectURL(file));
    };

    const handleCoverUpload = (e) => {
        const file = e.target.files[0];
        if (file) setCoverLogo(URL.createObjectURL(file));
    };

    if (loading) return <div className="p-10 text-center">{t('loading')}</div>;

    return (
        <div className="bg-gray-100 min-h-screen p-6 font-sans print:bg-white print:p-0">
            
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&family=Caveat:wght@700&family=Great+Vibes&family=Cinzel:wght@700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');

                @media print {
                    @page { 
                        size: A4 landscape; 
                        margin: 0; 
                    }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                    
                    /* The Page Container */
                    .print-sheet {
                        width: 297mm;
                        height: 210mm;
                        page-break-after: always;
                        display: grid;
                        grid-template-columns: 1fr 1fr; /* 2 Wide */
                        grid-template-rows: 1fr 1fr;    /* 2 High */
                        padding: 0; 
                        gap: 0; 
                    }
                    
                    /* Fix Shadows/Gradients for Print */
                    .shadow-xl, .shadow-lg, .shadow-md, .shadow-sm {
                        box-shadow: none !important;
                        border: 1px solid #ddd !important;
                    }
                    .backdrop-blur-sm, .blur-3xl {
                        filter: none !important;
                        backdrop-filter: none !important;
                        display: none !important; /* Hide decorative blobs on print to save ink/confusion */
                    }
                }
                
                /* --- CARD DESIGN --- */
                .postcard-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border: 1px dotted #e5e7eb; /* Cutting Guide */
                }

                /* FRONT DESIGN */
                .card-front {
                    background: white;
                    width: 100%; height: 100%;
                    display: flex;
                    flex-direction: row;
                    position: relative;
                }

                /* BACK DESIGN */
                .card-back {
                    background: #fff;
                    width: 100%; height: 100%;
                    display: flex;
                    flex-direction: row;
                    padding: 10px;
                }

                .back-left {
                    width: 40%;
                    border-right: 1px dashed #ccc;
                    padding-right: 10px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                }

                .back-right {
                    width: 60%;
                    padding-left: 10px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
            `}</style>

            {/* --- CONTROLS (Hidden on Print) --- */}
            <div className="no-print bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">📇 Postcard Generator (A6)</h2>
                    <button onClick={() => window.print()} disabled={!selectedGrade} className="bg-blue-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50">
                        🖨️ Print
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">1. {t('audience')}</label>
                        <select className="w-full border p-2 rounded" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                            <option value="">-- {t('select_class')} --</option>
                            {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">2. {t('content')}</label>
                        <input type="text" placeholder="Front Text (e.g. Thank You)" value={footerText} onChange={(e) => setFooterText(e.target.value)} className="w-full border p-2 rounded mb-2 font-bold" />
                        <input type="text" placeholder="Back Header (e.g. CONGRATS)" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="w-full border p-2 rounded mb-2 font-bold" />
                        <textarea placeholder="Back Message..." value={bodyMessage} onChange={(e) => setBodyMessage(e.target.value)} className="w-full border p-2 rounded text-sm h-12" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">3. Images</label>
                        <label className="block w-full border border-dashed border-blue-400 p-2 rounded text-center text-sm cursor-pointer hover:bg-blue-50 text-blue-800 font-bold mb-2">
                            📷 {customLogo ? t('change_logo') : t('upload_logo')}
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                        <label className="block w-full border border-dashed border-gray-400 p-2 rounded text-center text-sm cursor-pointer hover:bg-gray-50 text-gray-600">
                            🖼️ {coverLogo ? "Change Cover" : "Upload Cover"}
                            <input type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} />
                        </label>
                    </div>
                </div>
            </div>

            {/* --- PREVIEW AREA --- */}
            {selectedGrade ? (
                <div className="flex flex-col items-center gap-10">
                    {pages.map((pageStudents, pageIndex) => (
                        <React.Fragment key={pageIndex}>
                            
                            {/* === PAGE 1: FRONTS (4 Cards) === */}
                            <div className="print-sheet bg-white shadow-xl print:shadow-none grid grid-cols-2 grid-rows-2 w-[297mm] h-[210mm] mb-10">
                                {pageStudents.map((student) => (
                                    <div key={`front-${student._id}`} className="postcard-container p-2">
                                        <div className="card-front relative w-full h-full rounded-lg overflow-hidden border border-gray-200">
                                            
                                            {/* Decorative Background (Screen Only) */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-pink-50 to-yellow-50 print:bg-white"></div>
                                            <div className="absolute -top-10 -left-10 w-44 h-44 bg-pink-200 rounded-full blur-3xl opacity-60 print:hidden"></div>
                                            <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-blue-200 rounded-full blur-3xl opacity-60 print:hidden"></div>

                                            {/* LEFT HALF: Title & Logo */}
                                            <div className="relative z-10 w-1/2 h-full flex flex-col items-center justify-center p-4 text-center bg-white/80 print:bg-white">
                                                {customLogo && <img src={customLogo} alt="Logo" className="h-12 w-12 object-contain mb-3" />}
                                                
                                                <h1 className="text-3xl font-extrabold text-gray-800 tracking-wide font-script leading-none">
                                                    {footerText}
                                                </h1>
                                                
                                                <div className="w-12 h-1 bg-blue-600 my-3 rounded-full print:bg-black"></div>
                                                
                                                <p className="text-[10px] font-bold text-blue-900 uppercase tracking-[0.2em]">
                                                    {t('app_name')}
                                                </p>
                                            </div>

                                            {/* RIGHT HALF: Cover Image */}
                                            <div className="w-1/2 h-full relative overflow-hidden bg-gray-100 print:border-l print:border-gray-200">
                                                {coverLogo ? (
                                                    <img src={coverLogo} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">No Cover Image</div>
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* === PAGE 2: BACKS (4 Cards) === */}
                            <div className="print-sheet bg-white shadow-xl print:shadow-none grid grid-cols-2 grid-rows-2 w-[297mm] h-[210mm]">
                                {pageStudents.map((student) => (
                                    <div key={`back-${student._id}`} className="postcard-container p-2">
                                        <div className="card-back rounded-lg border border-gray-200">
                                            
                                            {/* Left: Message */}
                                            <div className="back-left bg-gradient-to-br from-blue-50 to-white print:bg-white">
                                                <h3 className="text-sm font-extrabold text-blue-800 uppercase tracking-widest mb-1">{eventTitle}</h3>
                                                <div className="text-xl mb-2">🎉</div>
                                                <p className="text-[10px] font-serif italic text-gray-700 leading-relaxed px-1">
                                                    "{bodyMessage}"
                                                </p>
                                                <div className="mt-auto pt-2 w-full text-center">
                                                    <p className="text-[8px] text-gray-400 uppercase font-bold">From</p>
                                                    <p className="text-[10px] font-bold text-black border-b border-gray-300 pb-1">{t('app_name')}</p>
                                                </div>
                                            </div>

                                            {/* Right: Student Details (Centered Photo) */}
                                            <div className="back-right bg-white">
                                                
                                                {/* Large Photo */}
                                                <div className="w-24 h-28 rounded-md overflow-hidden border-[3px] border-blue-200 shadow-sm bg-gray-200 mb-2 relative print:border-black print:shadow-none">
                                                    {student.imageUrl ? (
                                                        <img src={student.imageUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400">Photo</div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <h2 className="text-lg font-bold text-gray-900 leading-tight font-script">
                                                    {student.fullName}
                                                </h2>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded border text-gray-600 print:border-black">
                                                        {student.gradeLevel}
                                                    </span>
                                                    <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded border text-gray-600 print:border-black">
                                                        {student.studentId}
                                                    </span>
                                                </div>

                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>

                        </React.Fragment>
                    ))}
                </div>
            ) : (
                <div className="text-center p-20 text-gray-400 border-4 border-dashed border-gray-300 rounded-xl bg-white">
                    Select a grade to generate A6 postcards.
                </div>
            )}
        </div>
    );
};

export default EventCardGenerator;