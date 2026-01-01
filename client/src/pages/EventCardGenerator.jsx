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

    // *** NEW: FILTER STATE ***
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);

    // --- CARD CONFIGURATION ---
    const [eventTitle, setEventTitle] = useState('ANNUAL CEREMONY');
    const [bodyMessage, setBodyMessage] = useState('We are honored to invite you to celebrate excellence with us.');
    const [footerText, setFooterText] = useState('VIP INVITATION'); 
    
    // Images
    const [customLogo, setCustomLogo] = useState(null); 
    const [coverLogo, setCoverLogo] = useState(null);

    const cardsPerPage = 4;

    // --- 1. FETCH DATA ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const res = await studentService.getAllStudents();
                const students = res.data?.data || [];
                setAllStudents(students);

                let allowed = [];
                if (['admin', 'staff'].includes(currentUser.role)) {
                    const uniqueGrades = [...new Set(students.map(s => s.gradeLevel))].sort();
                    allowed = uniqueGrades;
                } else if (currentUser.role === 'teacher') {
                    const profile = await userService.getProfile();
                    const gradeSet = new Set();
                    if (profile.data.homeroomGrade) gradeSet.add(profile.data.homeroomGrade);
                    allowed = Array.from(gradeSet).sort();
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

    // --- 2. LOGIC ---
    
    // Get all students in the selected grade
    const studentsInGrade = useMemo(() => {
        if (!selectedGrade) return [];
        return allStudents
            .filter(s => s.gradeLevel === selectedGrade)
            .sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [selectedGrade, allStudents]);

    // *** NEW: AUTO-SELECT ALL WHEN GRADE CHANGES ***
    useEffect(() => {
        if (studentsInGrade.length > 0) {
            setSelectedStudentIds(studentsInGrade.map(s => s._id));
        } else {
            setSelectedStudentIds([]);
        }
    }, [studentsInGrade]);

    // *** NEW: FILTER LOGIC ***
    const finalStudents = useMemo(() => {
        return studentsInGrade.filter(s => selectedStudentIds.includes(s._id));
    }, [studentsInGrade, selectedStudentIds]);

    const pages = useMemo(() => {
        if (!finalStudents.length) return [];
        const chunks = [];
        for (let i = 0; i < finalStudents.length; i += cardsPerPage) {
            chunks.push(finalStudents.slice(i, i + cardsPerPage));
        }
        return chunks;
    }, [finalStudents, cardsPerPage]);

    // Toggle Checkboxes
    const toggleStudent = (id) => {
        setSelectedStudentIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (select) => {
        if (select) setSelectedStudentIds(studentsInGrade.map(s => s._id));
        else setSelectedStudentIds([]);
    };

    const reorderForBackSide = (students) => {
        const slots = [null, null, null, null];
        students.forEach((s, i) => { slots[i] = s; });
        return [slots[1], slots[0], slots[3], slots[2]];
    };

    const handleImageUpload = (e, setter) => {
        const file = e.target.files[0];
        if (file) setter(URL.createObjectURL(file));
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>;

    return (
        <div className="bg-gray-50 min-h-screen p-6 font-sans print:bg-white print:p-0">
            
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cinzel:wght@700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Noto+Sans+Ethiopic:wght@400;700&display=swap');
                @media print {
                    @page { 
                        size: A4 landscape; 
                        margin: 0; 
                    }
                    html, body {
                        height: 100%;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible;
                    }
                    .no-print { display: none !important; }
                    
                    .print-sheet {
                        width: 297mm;
                        height: 200mm; 
                        page-break-after: always;
                        display: grid;
                        grid-template-columns: 148.5mm 148.5mm;
                        grid-template-rows: 100mm 100mm; 
                        align-content: center; 
                    }
                    .print-sheet:last-child { page-break-after: auto; }
                }
                
                .font-serif-display { font-family: 'Playfair Display', serif; }
                .font-sans-body { font-family: 'Lato', sans-serif; }

                .card-wrapper {
                    width: 100%; height: 100%; padding: 0;
                    display: flex; justify-content: center; align-items: center;
                }
                .card-wrapper:nth-child(1) { border-right: 1px dashed #ddd; border-bottom: 1px dashed #ddd; }
                .card-wrapper:nth-child(2) { border-bottom: 1px dashed #ddd; }
                .card-wrapper:nth-child(3) { border-right: 1px dashed #ddd; }
                .font-script { font-family: 'Great Vibes', cursive; }


                .card-inner { width: 100%; height: 100%; position: relative; overflow: hidden; }
            `}</style>

            {/* --- CONTROLS --- */}
            <div className="no-print max-w-5xl mx-auto mb-10">
                <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                        <h2 className="text-xl font-bold font-serif-display tracking-wider">📇 Event Card Studio</h2>
                        <button 
                            onClick={() => window.print()} 
                            disabled={!finalStudents.length} 
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-6 py-2 rounded font-bold shadow-lg transition-all disabled:opacity-50">
                            🖨️ Print {finalStudents.length > 0 ? `(${finalStudents.length})` : ''}
                        </button>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* 1. Selection & Filtering */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">1. Select Students</h3>
                            <select className="w-full bg-gray-50 border border-gray-200 p-3 rounded-lg" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                                <option value="">-- Select Grade --</option>
                                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>

                            {/* *** STUDENT CHECKLIST *** */}
                            {selectedGrade && (
                                <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-48">
                                    <div className="bg-gray-100 p-2 border-b flex justify-between text-xs font-bold text-gray-600">
                                        <span>Select: {selectedStudentIds.length}/{studentsInGrade.length}</span>
                                        <div className="space-x-2">
                                            <button onClick={() => handleSelectAll(true)} className="text-blue-600 hover:underline">All</button>
                                            <button onClick={() => handleSelectAll(false)} className="text-red-600 hover:underline">None</button>
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-2 space-y-1 bg-white">
                                        {studentsInGrade.map(s => (
                                            <label key={s._id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedStudentIds.includes(s._id)} 
                                                    onChange={() => toggleStudent(s._id)}
                                                    className="rounded text-slate-900 focus:ring-slate-900"
                                                />
                                                <span className="truncate">{s.fullName}</span>
                                            </label>
                                        ))}
                                        {studentsInGrade.length === 0 && <p className="text-xs text-center p-4 text-gray-400">No students found.</p>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Text */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">2. Text</h3>
                            <input type="text" value={footerText} onChange={(e) => setFooterText(e.target.value)} className="w-full border-b pb-2 font-bold" placeholder="Header"/>
                            <textarea value={bodyMessage} onChange={(e) => setBodyMessage(e.target.value)} className="w-full border p-2 h-20 bg-gray-50 resize-none"/>
                        </div>

                        {/* 3. Logos */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">3. Logos</h3>
                            <div className="flex gap-2">
                                <label className="flex-1 cursor-pointer border border-dashed rounded-lg h-24 flex items-center justify-center text-xs">
                                    📷 Logo <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setCustomLogo)} />
                                </label>
                                <label className="flex-1 cursor-pointer border border-dashed rounded-lg h-24 flex items-center justify-center text-xs">
                                    🖼️ Cover <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setCoverLogo)} />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PRINT AREA --- */}
            {finalStudents.length > 0 ? (
                <div className="flex flex-col items-center pb-20">
                    {pages.map((pageStudents, pageIndex) => (
                        <React.Fragment key={pageIndex}>
                            
                            {/* === SIDE A: FRONTS === */}
                            <div className="print-sheet bg-white shadow-2xl print:shadow-none mb-8 relative">
                                <div className="absolute -top-6 left-0 text-xs text-gray-400 font-mono no-print">Page {pageIndex + 1} - Fronts</div>
                                
                                {pageStudents.map((student) => (
                                    <div key={`front-${student._id}`} className="card-wrapper">
                                        <div className="card-inner flex bg-slate-900 text-white">
                                            <div className="w-[55%] p-6 flex flex-col justify-center relative z-10">
                                                <div className="absolute -top-10 -left-10 w-32 h-32 bg-slate-800 rounded-full opacity-50"></div>
                                                {customLogo && <img src={customLogo} alt="Logo" className="h-8 w-auto mb-6 object-contain self-start relative z-10" />}
                                                
                                                <div className="relative z-10">
                                                    <p className="font-sans-body text-[10px] font-bold text-amber-500 uppercase tracking-[0.25em] mb-2 ">{eventTitle}</p>
                                                    <h1 className="font-serif-display text-4xl text-white leading-none mb-4">{footerText}</h1>
                                                    <div className="w-12 h-1 bg-amber-500"></div>
                                                </div>
                                            </div>

                                            <div className="w-[45%] relative overflow-hidden">
                                                {coverLogo ? (
                                                    <>
                                                        <img src={coverLogo} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-slate-900/40 mix-blend-multiply"></div>
                                                    </>
                                                ) : (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                                        <span className="text-slate-700 text-4xl opacity-20 font-serif-display italic">&</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-0 bottom-0 left-0 w-8 bg-slate-900 -skew-x-12 -ml-4"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* === SIDE B: BACKS === */}
                            <div className="print-sheet bg-white shadow-2xl print:shadow-none relative">
                                <div className="absolute -top-6 left-0 text-xs text-gray-400 font-mono no-print">Page {pageIndex + 1} - Backs</div>

                                {reorderForBackSide(pageStudents).map((student, idx) => (
                                    <div key={student ? `back-${student._id}` : `empty-${idx}`} className="card-wrapper">
                                        {!student ? <div className="card-inner bg-white"/> : (
                                            /* Split Layout */
                                            <div className="card-inner flex flex-row relative">
                                                
                                                {/* Left: Message */}
                                                <div className="w-1/2 p-6 flex flex-col justify-center bg-white">
                                                    <p className="font-serif-display italic text-lg text-slate-800 leading-snug mb-4">"{bodyMessage}"</p>
                                                    <div className="mt-auto">
                                                        <p className="font-sans-body text-[8px] text-amber-600 uppercase font-bold tracking-wider">Authorized Signature</p>
                                                        <div className="font-serif-display text-sm text-slate-900 mt-1">{t('app_name')}</div>
                                                    </div>
                                                </div>

                                                {/* Right: Student Info (Color) */}
                                                <div className="w-1/2 p-4 flex flex-col items-center justify-center bg-slate-900 text-white relative">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 z-0"></div>
                                                    <div className="z-10 flex flex-col items-center w-full">
                                                        <div className="w-24 h-24 mb-3 rounded-lg border-2 border-amber-500 overflow-hidden shadow-lg bg-gray-200">
                                                            {student.imageUrl ? (
                                                                <img src={student.imageUrl} 
                                                                     onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='flex'}} 
                                                                     alt="" className="w-full h-full object-cover" />
                                                            ) : null}
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400" style={{display: student.imageUrl ? 'none' : 'flex'}}>
                                                                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="font-serif-display text-lg font-bold leading-tight mb-1 truncate px-2 font-script">{student.fullName}</div>
                                                            <div className="inline-block bg-amber-500 text-slate-900 text-[10px] font-bold px-3 py-0.5 rounded mt-1">
                                                                Grade {student.gradeLevel}
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 font-mono mt-2 tracking-widest">{student.studentId}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                        </React.Fragment>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl bg-white m-10">
                    <p>{selectedGrade ? "No students selected. Check the list above." : "Select a class to start."}</p>
                </div>
            )}
        </div>
    );
};

export default EventCardGenerator;