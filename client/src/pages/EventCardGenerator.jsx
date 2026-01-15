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

    // --- SELECTION STATE ---
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
                if (currentUser && ['admin', 'staff'].includes(currentUser.role)) {
                    const uniqueGrades = [...new Set(students.map(s => s.gradeLevel))].sort();
                    allowed = uniqueGrades;
                } else if (currentUser && currentUser.role === 'teacher') {
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
        if(currentUser) loadData();
    }, [currentUser]);

    // --- 2. LOGIC ---
    
    const studentsInGrade = useMemo(() => {
        if (!selectedGrade) return [];
        return allStudents
            .filter(s => s.gradeLevel === selectedGrade)
            .sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [selectedGrade, allStudents]);

    useEffect(() => {
        if (studentsInGrade.length > 0) {
            setSelectedStudentIds(studentsInGrade.map(s => s._id));
        } else {
            setSelectedStudentIds([]);
        }
    }, [studentsInGrade]);

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
                
                .font-serif-display { font-family: 'Playfair Display', serif; }
                .font-sans-body { font-family: 'Lato', sans-serif; }

                .card-wrapper {
                    width: 100%; height: 100%; padding: 0;
                    display: flex; justify-content: center; align-items: center;
                    border: 1px dashed #e5e7eb;
                }
                .card-inner { width: 100%; height: 100%; position: relative; overflow: hidden; }

                @media print {
                    @page { 
                        size: A4 landscape; 
                        margin: 0mm !important; 
                    }
                    html, body {
                        width: 100%; height: 100%;
                        margin: 0 !important; padding: 0 !important;
                        overflow: visible;
                    }
                    .no-print { display: none !important; }
                    
                    /* === THE NUCLEAR WRAPPER === */
                    .print-wrapper { 
                        position: absolute; 
                        top: 0; 
                        left: 0; 
                        width: 297mm; 
                        margin: 0 !important; 
                        padding: 0 !important; 
                    }

                    .print-sheet {
                        width: 297mm;
                        height: 210mm; /* Force full A4 height */
                        page-break-after: always; /* Ensure new sheet for next set */
                        display: grid;
                        grid-template-columns: 148.5mm 148.5mm; 
                        grid-template-rows: 105mm 105mm; 
                        align-content: start; 
                        overflow: hidden; /* Prevent spillover */
                    }
                    
                    .card-wrapper { border: none; }
                }
            `}</style>

            {/* --- CONTROLS --- */}
            <div className="no-print max-w-6xl mx-auto mb-10">
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
                    
                    {/* Controls Panel */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">1. Select Students</h3>
                            <select className="w-full bg-gray-50 border border-gray-200 p-2 rounded-lg" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                                <option value="">-- Select Grade --</option>
                                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
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
                                                <input type="checkbox" checked={selectedStudentIds.includes(s._id)} onChange={() => toggleStudent(s._id)} className="rounded text-slate-900 focus:ring-slate-900"/>
                                                <span className="truncate">{s.fullName}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">2. Card Text</h3>
                            <div><label className="text-xs text-gray-500">Top Label</label><input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="w-full border p-2 rounded" placeholder="e.g. ANNUAL CEREMONY"/></div>
                            <div><label className="text-xs text-gray-500">Main Header</label><input type="text" value={footerText} onChange={(e) => setFooterText(e.target.value)} className="w-full border p-2 rounded font-bold" placeholder="e.g. VIP INVITATION"/></div>
                            <div><label className="text-xs text-gray-500">Body Message</label><textarea value={bodyMessage} onChange={(e) => setBodyMessage(e.target.value)} className="w-full border p-2 h-16 bg-gray-50 resize-none rounded"/></div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">3. Images</h3>
                            <div className="flex gap-2">
                                <label className="flex-1 cursor-pointer border border-dashed hover:bg-gray-50 rounded-lg h-24 flex flex-col items-center justify-center text-xs text-gray-500 transition-colors"><span className="text-xl">📷</span><span>Upload Logo</span><input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setCustomLogo)} /></label>
                                <label className="flex-1 cursor-pointer border border-dashed hover:bg-gray-50 rounded-lg h-24 flex flex-col items-center justify-center text-xs text-gray-500 transition-colors"><span className="text-xl">🖼️</span><span>Cover Image</span><input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setCoverLogo)} /></label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PRINT AREA --- */}
            {finalStudents.length > 0 ? (
                // === HERE IS THE PRINT WRAPPER ===
                <div className="flex flex-col items-center pb-20 print-wrapper">
                    {pages.map((pageStudents, pageIndex) => (
                        <React.Fragment key={pageIndex}>
                            
                            {/* === SIDE A: FRONTS === */}
                            <div className="print-sheet bg-white shadow-2xl print:shadow-none mb-8 print:mb-0 relative">
                                <div className="absolute -top-6 left-0 text-xs text-gray-400 font-mono no-print">Sheet {pageIndex + 1} (Fronts)</div>
                                
                                {pageStudents.map((student) => (
                                    <div key={`front-${student._id}`} className="card-wrapper">
                                        <div className="card-inner flex bg-slate-800 text-white">
                                            <div className="w-[55%] p-8 flex flex-col justify-center relative z-10">
                                                <div className="absolute -top-12 -left-12 w-40 h-40 bg-slate-700/50 rounded-full blur-xl"></div>
                                                {customLogo && <img src={customLogo} alt="Logo" className="h-10 w-auto mb-6 object-contain self-start relative z-10" />}
                                                <div className="relative z-10">
                                                    <p className="font-sans-body text-[10px] font-bold text-amber-400 uppercase tracking-[0.25em] mb-3">{eventTitle}</p>
                                                    <h1 className="font-serif-display text-4xl text-white leading-none mb-5">{footerText}</h1>
                                                    <div className="w-16 h-1.5 bg-amber-500"></div>
                                                </div>
                                            </div>
                                            <div className="w-[45%] relative overflow-hidden">
                                                {coverLogo ? (
                                                    <>
                                                        <img src={coverLogo} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-slate-900/30 mix-blend-multiply"></div>
                                                    </>
                                                ) : (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                                                        <span className="text-slate-600 text-6xl opacity-20 font-serif-display italic">&</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-0 bottom-0 left-0 w-12 bg-slate-800 -skew-x-12 -ml-6 border-r-4 border-slate-900/20"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* === SIDE B: BACKS === */}
                            <div className="print-sheet bg-white shadow-2xl print:shadow-none relative">
                                <div className="absolute -top-6 left-0 text-xs text-gray-400 font-mono no-print">Sheet {pageIndex + 1} (Backs)</div>

                                {reorderForBackSide(pageStudents).map((student, idx) => (
                                    <div key={student ? `back-${student._id}` : `empty-${idx}`} className="card-wrapper">
                                        {!student ? <div className="card-inner bg-white"/> : (
                                            <div className="card-inner bg-white flex flex-row relative border-l border-gray-100">
                                                <div className="w-1/2 p-8 flex flex-col justify-center bg-white text-slate-800">
                                                    <p className="font-serif-display italic text-xl text-slate-700 leading-relaxed mb-6">"{bodyMessage}"</p>
                                                    <div className="mt-auto border-t pt-4">
                                                        <p className="font-sans-body text-[9px] text-amber-600 uppercase font-bold tracking-wider mb-1">Authorized By</p>
                                                        <div className="font-serif-display text-base font-bold text-slate-900">{t('app_name')}</div>
                                                    </div>
                                                </div>
                                                <div className="w-1/2 p-4 flex flex-col items-center justify-center bg-slate-900 text-white relative">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 z-0"></div>
                                                    <div className="z-10 flex flex-col items-center w-full">
                                                        <div className="w-28 h-28 mb-4 rounded-full border-4 border-amber-500 overflow-hidden shadow-2xl bg-gray-200">
                                                            {student.imageUrl ? (
                                                                <img src={student.imageUrl} onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='flex'}} alt="" className="w-full h-full object-cover" />
                                                            ) : null}
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400" style={{display: student.imageUrl ? 'none' : 'flex'}}><span className="text-4xl">👤</span></div>
                                                        </div>
                                                        <div className="text-center w-full px-2">
                                                            <div className="font-serif-display text-xl font-bold leading-tight mb-2">{student.fullName}</div>
                                                            <div className="inline-block bg-amber-500 text-slate-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Grade {student.gradeLevel}</div>
                                                            <p className="text-[10px] text-slate-400 font-mono mt-3 tracking-widest opacity-60">ID: {student.studentId}</p>
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
                    <p>{selectedGrade ? "No students selected." : "Select a class to start."}</p>
                </div>
            )}
        </div>
    );
};

export default EventCardGenerator;