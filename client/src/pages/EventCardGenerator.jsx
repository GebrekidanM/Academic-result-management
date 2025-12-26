import React, { useState, useEffect, useMemo } from 'react';
import studentService from '../services/studentService';
import authService from '../services/authService';
import userService from '../services/userService';

const EventCardGenerator = () => {
    // --- STATE ---
    const [currentUser] = useState(authService.getCurrentUser());
    const [allStudents, setAllStudents] = useState([]);
    const [availableGrades, setAvailableGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [loading, setLoading] = useState(true);

    // --- CARD CONFIGURATION ---
    const [eventTitle, setEventTitle] = useState('Graduation Day');
    const [bodyMessage, setBodyMessage] = useState('We proudly invite the family of this student to celebrate their academic achievement with us.');
    const [footerText, setFooterText] = useState('ADMIT TWO • VIP ENTRY'); 
    
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

    // --- 2. FILTER ---
    const targetStudents = useMemo(() => {
        if (!selectedGrade) return [];
        return allStudents
            .filter(s => s.gradeLevel === selectedGrade)
            .sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [selectedGrade, allStudents]);

    // --- 3. IMAGE UPLOAD ---
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCustomLogo(url);
        }
    };

    // --- 4. PAGINATION ---
    const pages = useMemo(() => {
        if (!targetStudents.length) return [];
        const chunks = [];
        for (let i = 0; i < targetStudents.length; i += cardsPerPage) {
            chunks.push(targetStudents.slice(i, i + cardsPerPage));
        }
        return chunks;
    }, [targetStudents, cardsPerPage]);

    // --- 5. GRID CONFIGURATION (UPDATED: Removed Rows) ---
    // We only control columns now. Height is automatic.
    const getGridClass = () => {
        switch (Number(cardsPerPage)) {
            case 2: return "grid-cols-1 gap-y-10"; 
            case 4: return "grid-cols-2 gap-8";   
            case 6: return "grid-cols-2 gap-6";   
            case 8: return "grid-cols-2 gap-4";   
            default: return "grid-cols-2 gap-6";
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="bg-gray-200 min-h-screen p-6 font-sans print:bg-white print:p-0">
            
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');

                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 10mm; /* Give printer some breathing room */
                    }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    
                    .print-page {
                        width: 100%;
                        /* REMOVED FIXED HEIGHT */
                        height: auto; 
                        min-height: 95vh;
                        page-break-after: always;
                        display: grid;
                        align-content: start; /* Pack items to top, don't stretch */
                    }
                    .print-page:last-child { page-break-after: auto; }
                    
                    /* Clean up shadows for print */
                    .shadow-sm, .shadow-md, .shadow-lg, .shadow-xl, .shadow-2xl {
                        box-shadow: none !important;
                        border: 1px solid #ddd !important;
                    }
                }
                
                /* Ceremonial Border */
                .ceremonial-border {
                    border: 2px solid #1e3a8a; /* Navy Double Border */
                    position: relative;
                }
                .ceremonial-border::after {
                    content: '';
                    position: absolute;
                    top: 4px; left: 4px; right: 4px; bottom: 4px;
                    border: 1px solid #d4af37; /* Thin Gold Line inside */
                    pointer-events: none;
                }
            `}</style>

            {/* --- CONTROLS (Hidden on Print) --- */}
            <div className="no-print bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">🎖️ Ceremonial Card Generator</h2>
                    <button onClick={() => window.print()} disabled={!selectedGrade} className="bg-gradient-to-r from-blue-800 to-blue-900 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                        🖨️ Print Cards
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">1. Audience</label>
                        <select className="w-full border p-2 rounded bg-gray-50" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                            <option value="">-- Choose Grade --</option>
                            {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">2. Content</label>
                        <input type="text" placeholder="Title (e.g. INVITATION)" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="w-full border p-2 rounded mb-2 font-bold" />
                        <textarea placeholder="Message..." value={bodyMessage} onChange={(e) => setBodyMessage(e.target.value)} className="w-full border p-2 rounded mb-2 text-sm h-12 resize-none" />
                        <input type="text" placeholder="Footer (e.g. VIP)" value={footerText} onChange={(e) => setFooterText(e.target.value)} className="w-full border p-2 rounded text-sm" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">3. Design</label>
                        <div className="flex gap-2">
                             <select className="border p-2 rounded w-1/2 text-sm bg-gray-50" value={cardsPerPage} onChange={(e) => setCardsPerPage(Number(e.target.value))}>
                                <option value={2}>2 Large</option>
                                <option value={4}>4 Medium</option>
                                <option value={6}>6 Small</option>
                                <option value={8}>8 Mini</option>
                            </select>
                            <div className="relative w-1/2">
                                <input type="file" id="logoUpload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                <label htmlFor="logoUpload" className="block w-full border border-dashed border-gray-400 p-2 rounded text-center text-sm cursor-pointer hover:bg-gray-50">
                                    📷 {customLogo ? "Change Logo" : "Upload Logo"}
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
                                <div key={student._id} className="relative bg-[#fffdf5] ceremonial-border flex flex-col overflow-hidden break-inside-avoid">
                                    
                                    {/* Watermark */}
                                    {customLogo && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
                                            <img src={customLogo} className="w-3/4 h-3/4 object-contain grayscale blur-[1px]" alt="" />
                                        </div>
                                    )}

                                    {/* --- CARD HEADER --- */}
                                    <div className="relative z-10 text-center pt-5 pb-2">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1.5 bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-600 rounded-b-lg shadow-sm"></div>

                                        {customLogo && (
                                            <img src={customLogo} alt="Logo" className="h-10 w-10 object-contain mx-auto mb-2" />
                                        )}

                                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                                            Freedom School
                                        </h3>

                                        <h2
                                            className="text-2xl md:text-3xl font-bold text-blue-900 tracking-wide mt-1 drop-shadow-sm"
                                            style={{ fontFamily: '"Cinzel", serif' }}
                                        >
                                            {eventTitle}
                                        </h2>
                                    </div>

                                    {/* --- CARD BODY --- */}
                                    <div className="z-10 flex-1 flex items-center px-6 py-4 gap-5">

                                        {/* Photo Frame */}
                                        <div className="shrink-0 relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg blur opacity-30"></div>
                                            <div className="relative w-24 h-28 rounded-lg overflow-hidden shadow-md border-2 border-white bg-white">
                                                {student.imageUrl ? (
                                                    <img src={student.imageUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[9px] text-gray-400">No Photo</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Text Info */}
                                        <div className="flex-1 text-center">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Presented To</p>
                                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-none tracking-tight mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>
                                                {student.fullName}
                                            </h3>
                                            <div className="inline-flex items-center px-3 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-bold uppercase text-blue-800 tracking-wide mb-3">
                                                {student.gradeLevel}
                                            </div>
                                            <div className="w-12 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mb-3"></div>
                                            <p className="text-xs font-serif italic text-gray-600 leading-snug px-1">
                                                “{bodyMessage}”
                                            </p>
                                        </div>
                                    </div>

                                    {/* --- CARD FOOTER --- */}
                                    <div className="z-10 bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-2 px-5 flex justify-between items-center text-[10px] uppercase tracking-widest shadow-inner mt-2">
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
                        Select a grade to generate ceremonial cards.
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventCardGenerator;