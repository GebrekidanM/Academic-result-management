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
    const [eventTitle, setEventTitle] = useState('INVITATION');
    const [bodyMessage, setBodyMessage] = useState('We are honored to invite you to our annual ceremony.');
    const [footerText, setFooterText] = useState('VIP PASS'); 
    
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
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;800&family=Cinzel:wght@700&family=Caveat:wght@600&display=swap');

                @media print {
                    @page { 
                        size: A4 landscape; 
                        margin: 0; 
                    }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                    
                    /* The Page Container (A4 Landscape) */
                    .print-sheet {
                        width: 297mm;
                        height: 210mm;
                        page-break-after: always;
                        display: grid;
                        grid-template-columns: 148.5mm 148.5mm; /* Exact A6 Width */
                        grid-template-rows: 105mm 105mm;        /* Exact A6 Height */
                        padding: 0; 
                        gap: 0; 
                    }
                }
                
                /* Fonts */
                .font-luxury { font-family: 'Cinzel', serif; }
                .font-modern { font-family: 'Montserrat', sans-serif; }
                .font-hand { font-family: 'Caveat', cursive; }

                /* Card Container */
                .postcard-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    overflow: hidden;
                    border: 1px dotted #ccc; /* Cutting Guide */
                    background: white;
                }

                /* FRONT DESIGN */
                .card-front {
                    width: 100%; height: 100%;
                    display: flex;
                    flex-direction: row;
                }
                
                .front-left {
                    width: 50%;
                    background: #ffffff;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 20px;
                    position: relative;
                }

                .front-right {
                    width: 50%;
                    background: #1a365d; /* Fallback color */
                    position: relative;
                    overflow: hidden;
                }

                /* BACK DESIGN */
                .card-back {
                    width: 100%; height: 100%;
                    background: #fff;
                    display: flex;
                    padding: 15px;
                }
                
                .divider {
                    width: 1px;
                    background: #e5e7eb;
                    margin: 10px 15px;
                }
                
                .back-message {
                    width: 50%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding-right: 10px;
                }

                .back-address {
                    width: 50%;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                }
            `}</style>

            {/* --- CONTROLS --- */}
            <div className="no-print bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">📇 Premium Postcard (A6)</h2>
                    <button onClick={() => window.print()} disabled={!selectedGrade} className="bg-gray-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-black disabled:opacity-50 shadow-md">
                        🖨️ Print Cards
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">1. Class</label>
                        <select className="w-full border p-2 rounded" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                            <option value="">-- Select Class --</option>
                            {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">2. Content</label>
                        <input type="text" placeholder="Front Main Title" value={footerText} onChange={(e) => setFooterText(e.target.value)} className="w-full border p-2 rounded mb-2 font-bold" />
                        <input type="text" placeholder="Front Subtitle" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="w-full border p-2 rounded mb-2 text-sm" />
                        <textarea placeholder="Back Message..." value={bodyMessage} onChange={(e) => setBodyMessage(e.target.value)} className="w-full border p-2 rounded text-sm h-12" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">3. Visuals</label>
                        <label className="block w-full border border-dashed border-gray-300 p-2 rounded text-center text-xs cursor-pointer hover:bg-gray-50 mb-2">
                            📷 {customLogo ? "Change Logo" : "Upload Small Logo"}
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                        <label className="block w-full border border-dashed border-gray-300 p-2 rounded text-center text-xs cursor-pointer hover:bg-gray-50">
                            🖼️ {coverLogo ? "Change Cover Image" : "Upload Front Image"}
                            <input type="file" className="hidden" accept="image/*" onChange={handleCoverUpload} />
                        </label>
                    </div>
                </div>
            </div>

            {/* --- PREVIEW --- */}
            {selectedGrade ? (
                <div className="flex flex-col items-center gap-10">
                    {pages.map((pageStudents, pageIndex) => (
                        <React.Fragment key={pageIndex}>
                            
                            {/* === PAGE 1: FRONTS (Design Side) === */}
                            <div className="print-sheet bg-white shadow-xl print:shadow-none grid grid-cols-2 grid-rows-2 w-[297mm] h-[210mm] mb-10">
                                {pageStudents.map((student) => (
                                    <div key={`front-${student._id}`} className="postcard-container">
                                        <div className="card-front">
                                            
                                            {/* LEFT: Text & Branding */}
                                            <div className="front-left">
                                                {customLogo && <img src={customLogo} alt="Logo" className="h-8 w-auto mb-6 object-contain self-start" />}
                                                
                                                <h3 className="font-modern text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">
                                                    {t('app_name')}
                                                </h3>
                                                <h1 className="font-luxury text-3xl text-gray-900 leading-none mb-2 text-left">
                                                    {footerText}
                                                </h1>
                                                <div className="w-10 h-1 bg-yellow-500 mb-2"></div>
                                                <p className="font-modern text-xs font-medium text-gray-500 uppercase tracking-widest">
                                                    {eventTitle}
                                                </p>
                                            </div>

                                            {/* RIGHT: Cover Image */}
                                            <div className="front-right">
                                                {coverLogo ? (
                                                    <img src={coverLogo} alt="Cover" className="absolute inset-0 w-full h-full object-cover grayscale brightness-125 contrast-125 mix-blend-multiply" />
                                                ) : (
                                                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">NO IMAGE</div>
                                                )}
                                                <div className="absolute inset-0 bg-blue-900 mix-blend-overlay opacity-80"></div>
                                            </div>

                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* === PAGE 2: BACKS (Info Side) === */}
                            <div className="print-sheet bg-white shadow-xl print:shadow-none grid grid-cols-2 grid-rows-2 w-[297mm] h-[210mm]">
                                {pageStudents.map((student) => (
                                    <div key={`back-${student._id}`} className="postcard-container">
                                        <div className="card-back">
                                            
                                            {/* Left: Message */}
                                            <div className="back-message">
                                                <h4 className="font-modern text-xs font-bold text-gray-800 uppercase mb-2">Dear Parent,</h4>
                                                <p className="font-hand text-xl text-gray-600 leading-snug">
                                                    "{bodyMessage}"
                                                </p>
                                                <div className="mt-auto">
                                                    <p className="font-modern text-[8px] text-gray-400 uppercase">Sent From</p>
                                                    <p className="font-modern text-[10px] font-bold text-gray-800">{t('app_name')}</p>
                                                </div>
                                            </div>

                                            <div className="divider"></div>

                                            {/* Right: Address & Stamp */}
                                            <div className="back-address">
                                                
                                                {/* Student Photo as Stamp */}
                                                <div className="absolute top-0 right-0 w-16 h-20 bg-gray-100 border border-gray-300 p-1 shadow-sm transform rotate-2">
                                                    {student.imageUrl ? (
                                                        <img src={student.imageUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200"></div>
                                                    )}
                                                </div>

                                                <div className="mt-10">
                                                    <p className="font-modern text-[9px] text-gray-400 uppercase tracking-wider mb-1">To Student</p>
                                                    
                                                    <div className="border-b border-gray-300 pb-1 mb-3 pr-20">
                                                        <span className="font-luxury text-lg font-bold text-gray-900">{student.fullName}</span>
                                                    </div>

                                                    <div className="border-b border-gray-300 pb-1 mb-3 pr-10 flex justify-between items-end">
                                                        <span className="font-modern text-xs text-gray-600">Grade: {student.gradeLevel}</span>
                                                    </div>

                                                    <div className="border-b border-gray-300 pb-1 pr-10">
                                                        <span className="font-mono text-xs text-gray-500">ID: {student.studentId}</span>
                                                    </div>
                                                </div>

                                                {/* Bottom Bar Code Visual */}
                                                <div className="mt-auto w-full h-4 opacity-30" style={{background: 'repeating-linear-gradient(90deg, black, black 1px, white 1px, white 3px)'}}></div>
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
                    Select a class to generate postcards.
                </div>
            )}
        </div>
    );
};

export default EventCardGenerator;