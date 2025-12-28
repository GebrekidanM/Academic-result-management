import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import studentService from '../services/studentService';
import authService from '../services/authService';
import userService from '../services/userService';

const StudentIDPage = () => {
    const { t } = useTranslation();
    
    const [currentUser] = useState(authService.getCurrentUser());
    const [allStudents, setAllStudents] = useState([]);
    const [availableGrades, setAvailableGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [loading, setLoading] = useState(true);

    // --- Configuration ---
    const [schoolName, setSchoolName] = useState('FREEDOM KG & PRIMARY SCHOOL');
    const [validDate, setValidDate] = useState('June 2024');
    const [customLogo, setCustomLogo] = useState(null);
    
    // --- 1. Fetch Data ---
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

    // --- 2. Filter Students ---
    const targetStudents = useMemo(() => {
        if (!selectedGrade) return [];
        return allStudents
            .filter(s => s.gradeLevel === selectedGrade)
            .sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [selectedGrade, allStudents]);

    // --- 3. Pagination (8 Cards per A4 Page) ---
    const CARDS_PER_PAGE = 8;
    const pages = useMemo(() => {
        if (!targetStudents.length) return [];
        const chunks = [];
        for (let i = 0; i < targetStudents.length; i += CARDS_PER_PAGE) {
            chunks.push(targetStudents.slice(i, i + CARDS_PER_PAGE));
        }
        return chunks;
    }, [targetStudents]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCustomLogo(URL.createObjectURL(file));
        }
    };

    if (loading) return <div className="p-10 text-center">{t('loading')}</div>;

    return (
        <div className="bg-gray-100 min-h-screen p-6 font-sans print:bg-white print:p-0">
            
            {/* --- PRINT STYLES --- */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Roboto:wght@400;500;700&display=swap');

                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 10mm; /* Safe margin for printers */
                    }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    
                    .print-page {
                        width: 100%;
                        height: 277mm; /* Printable A4 Height */
                        page-break-after: always;
                        display: grid;
                        grid-template-columns: 1fr 1fr; /* 2 Columns */
                        grid-template-rows: repeat(4, 1fr); /* 4 Rows */
                        gap: 10px; /* Gap between cards for cutting */
                        align-content: start;
                    }
                    .print-page:last-child { page-break-after: auto; }
                }
                
                /* ID Card Specific CSS for layout precision */
                .id-card {
                    width: 86mm;  /* Standard ID Width */
                    height: 54mm; /* Standard ID Height */
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    overflow: hidden;
                    position: relative;
                    background: white;
                    display: flex;
                    flex-direction: column;
                }
                
                .barcode {
                    height: 20px;
                    background-image: linear-gradient(to right, black 2px, white 2px, black 4px, white 4px, black 1px, white 3px, black 5px);
                    width: 80%;
                    margin: 0 auto;
                }
            `}</style>

            {/* --- CONTROLS (No Print) --- */}
            <div className="no-print bg-white p-6 rounded-xl shadow-lg mb-8 border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">🪪 {t('id_card_generator')}</h2>
                    <button onClick={() => window.print()} disabled={!selectedGrade} className="bg-blue-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50">
                        🖨️ {t('print')}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">1. Class</label>
                        <select className="w-full border p-2 rounded" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                            <option value="">-- {t('select_class')} --</option>
                            {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">2. School Name</label>
                        <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="w-full border p-2 rounded font-bold" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">3. Expiry Date</label>
                        <input type="text" value={validDate} onChange={(e) => setValidDate(e.target.value)} className="w-full border p-2 rounded" placeholder="e.g. June 2025" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">4. Logo</label>
                        <input type="file" onChange={handleImageUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                </div>
            </div>

            {/* --- PREVIEW AREA --- */}
            {selectedGrade ? (
                <div className="flex flex-col items-center">
                    {pages.map((pageStudents, pageIndex) => (
                        <div key={pageIndex} className="print-page grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-white p-4 shadow-xl print:shadow-none print:p-0 print:mb-0">
                            
                            {pageStudents.map((student) => (
                                <div key={student._id} className="id-card break-inside-avoid shadow-sm print:shadow-none">
                                    
                                    {/* ID Header */}
                                    <div className="bg-blue-900 text-white h-12 flex items-center px-3 relative">
                                        {/* Color Strip Decoration */}
                                        <div className="absolute top-0 right-0 w-16 h-full bg-yellow-500 opacity-20 transform skew-x-12"></div>
                                        
                                        {/* Logo */}
                                        {customLogo ? (
                                            <img src={customLogo} alt="Logo" className="h-8 w-8 object-contain bg-white rounded-full p-0.5 mr-2" />
                                        ) : (
                                            <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center text-[8px] text-blue-900 font-bold mr-2">LOGO</div>
                                        )}
                                        
                                        <div className="flex-1 overflow-hidden">
                                            <h3 className="font-bold text-xs uppercase truncate" style={{fontFamily: 'Oswald, sans-serif'}}>
                                                {schoolName}
                                            </h3>
                                            <p className="text-[8px] uppercase tracking-widest text-yellow-400">
                                                {t('id_title')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* ID Body */}
                                    <div className="flex flex-1 p-2 gap-3 items-center">
                                        
                                        {/* Photo */}
                                        <div className="w-20 h-24 bg-gray-200 border border-gray-300 flex-shrink-0 overflow-hidden">
                                            {student.imageUrl ? (
                                                <img src={student.imageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500">Photo</div>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 space-y-1">
                                            <div>
                                                <p className="text-[8px] text-gray-500 uppercase font-bold">{t('full_name')}</p>
                                                <p className="text-sm font-bold text-blue-900 leading-tight line-clamp-2">{student.fullName}</p>
                                            </div>
                                            
                                            <div className="flex justify-between">
                                                <div>
                                                    <p className="text-[8px] text-gray-500 uppercase font-bold">{t('id_no')}</p>
                                                    <p className="text-xs font-mono font-bold text-black">{student.studentId}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] text-gray-500 uppercase font-bold">{t('grade')}</p>
                                                    <p className="text-xs font-bold text-black">{student.gradeLevel}</p>
                                                </div>
                                            </div>

                                            <div className="flex justify-between mt-1">
                                                <div>
                                                    <p className="text-[8px] text-gray-500 uppercase font-bold">{t('valid_until')}</p>
                                                    <p className="text-[10px] font-bold text-red-600">{validDate}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ID Footer */}
                                    <div className="h-6 bg-gray-100 border-t border-gray-300 flex items-center justify-between px-3">
                                        <div className="text-[7px] text-gray-500 text-right leading-tight">
                                            {t('director_sign')}: <br/>
                                        </div>
                                    </div>

                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-20 text-gray-400 border-4 border-dashed border-gray-300 rounded-xl">
                    Select a class to generate ID cards.
                </div>
            )}
        </div>
    );
};

export default StudentIDPage;