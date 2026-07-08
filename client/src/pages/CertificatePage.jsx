import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import authService from '@shared/services/authService';
import userService from '@shared/services/userService';
import subjectService from '@shared/services/subjectService';
import reportCardService from '@shared/services/reportCardService';

// Import Templates
import StandardCertificate from '../components/certificate/StandardCertificate';
import PrimaryCertificate from '../components/certificate/PrimaryCertificate';
import ProfessionalCertificate from '../components/certificate/ProfessionalCertificate'; // ⚠️ አዲሱ ፕሮፌሽናል ሰርተፊኬት መጥቷል [2]

// የኢትዮጵያን የአሁኑን ዓመተ ምህረት በራስ-ሰር ለማግኘት የሚያግዝ ረዳት ፈንክሽን
function getCurrentAcademicYear() {
    const today = new Date();
    const gregYear = today.getFullYear();
    const gregMonth = today.getMonth() + 1;
    return gregMonth >= 9 ? gregYear - 7 : gregYear - 8;
}

// የደረጃ ጽሁፍን ሰንጥቆ ወደ ቁጥር የሚቀይር ረዳት ፈንክሽን
const getRankNumber = (rankStr) => {
    if (!rankStr) return 0;
    const parts = String(rankStr).split('/');
    return parseInt(parts[0].trim(), 10) || 0;
};

const SEMESTER_OPTIONS = [
    { label: 'sem_1', value: 'First Semester' },
    { label: 'sem_2', value: 'Second Semester' },
    { label: 'annual', value: 'Annual' },
];

const CertificatePage = () => {
    const { t } = useTranslation();
    const componentRef = useRef();

    // User & Config State
    const [currentUser] = useState(authService.getCurrentUser());
    const [availableGrades, setAvailableGrades] = useState([]);
    
    // Form State
    const [formData, setFormData] = useState({
        grade: '',
        semester: 'First Semester',
        academicYear: getCurrentAcademicYear().toString(),
        awardDate: new Date().toLocaleDateString('en-GB'),
        designType: 'standard' // standard, primary, teacher, partner
    });

    // ⚠️ መምህራን እና አጋሮችን በእጅ ለመጻፍ የሚያግዝ አዲስ ስቴት [2]
    const [manualRecipient, setManualRecipient] = useState('');
    
    const [processedStudents, setProcessedStudents] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Load available grades based on role
    useEffect(() => {
        const fetchGrades = async () => {
            try {
                let grades = [];
                if (['admin', 'staff', 'principal'].includes(currentUser.role)) {
                    const res = await subjectService.getAllSubjects();
                    const data = res.data.data || res.data;
                    grades = [...new Set(data.map(s => s.gradeLevel))].sort();
                } else if (currentUser.role === 'teacher') {
                    const res = await userService.getProfile();
                    const teacherData = res.data;
                    const gradeSet = new Set();
                    if (teacherData.homeroomGrade) gradeSet.add(teacherData.homeroomGrade);
                    teacherData.subjectsTaught?.forEach(s => s.subject && gradeSet.add(s.subject.gradeLevel));
                    grades = Array.from(gradeSet).sort();
                }
                setAvailableGrades(grades);
            } catch (err) {
                console.error("Failed to load grades:", err);
            }
        };
        fetchGrades();
    }, [currentUser]);

    // Auto-switch student design based on Grade Name
    useEffect(() => {
        // የቆዩት የተማሪዎች ዲዛይኖች ብቻ በክፍል ስም እንዲቀያየሩ ማድረግ
        if (['standard', 'primary'].includes(formData.designType)) {
            const g = formData.grade.toLowerCase();
            const isPrimary = g.includes('kg') || g.includes('nursery') || g.includes('grade 1') || g.includes('grade 2');
            setFormData(prev => ({ ...prev, designType: isPrimary ? 'primary' : 'standard' }));
        }
    }, [formData.grade]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        setError('');
        
        // ⚠️ 1. አዲሱ ሎጂክ፦ ተሸላሚው መምህር ወይም አጋር ከሆነ በእጅ የተጻፈውን ስም መጠቀም [2]
        if (['teacher', 'partner'].includes(formData.designType)) {
            if (!manualRecipient.trim()) {
                setError("Please enter at least one recipient name.");
                return;
            }
            // ስሞችን በኮማ በመሰንጠቅ በጅምላ ለማተም ማዘጋጀት [2]
            const names = manualRecipient.split(',').map(n => n.trim()).filter(Boolean);
            const formattedRecipients = names.map((name, index) => ({
                id: `manual_${index}`,
                fullName: name
            }));
            setProcessedStudents(formattedRecipients);
            return;
        }

        // 2. ተሸላሚው ተማሪ ከሆነ ከባክኤንድ በደረጃ መጫን
        if (!formData.grade) return;
        
        setLoading(true);
        try {
            const response = await reportCardService.getCertificateData(formData.grade, formData.academicYear);
            const roster = response.data;

            const getSemKey = (sem) => sem === 'First Semester' ? 'sem1' : sem === 'Second Semester' ? 'sem2' : 'overall';

            const formatted = roster
                .map(student => {
                    const stats = student[getSemKey(formData.semester)];
                    const parsedRank = getRankNumber(stats?.rank);
                    return { ...student, rank: parsedRank, avg: stats?.avg };
                })
                .filter(s => s.rank >= 1 && s.rank <= 3)
                .sort((a, b) => a.rank - b.rank);

            if (formatted.length === 0) {
                setError(t('no_top_students'));
                setProcessedStudents([]);
            } else {
                setProcessedStudents(formatted);
            }
        } catch (err) {
            setError(t('error_fetching_data'));
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = useReactToPrint({ 
        contentRef: componentRef, 
        documentTitle: `Certificates_${formData.grade || formData.designType}_${formData.academicYear}` 
    });

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Control Panel */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-200 no-print">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                        <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                            <span className="text-3xl">🏆</span> {t('certificate_generator')}
                        </h2>
                        
                        {/* ⚠️ ማስተካከያ 1፦ አራቱንም የሰርተፊኬት ዲዛይኖች በታብ ምርጫዎች ማደራጀት [2] */}
                        <div className="inline-flex bg-gray-100 p-1 rounded-lg border border-gray-200 flex-wrap gap-1">
                            {[
                                { id: 'standard', label: 'STUDENT PRIMARY' },
                                { id: 'primary', label: 'STUDENT SECONDARY' },
                                { id: 'teacher', label: 'BEST TEACHER' },
                                { id: 'partner', label: 'HONOR PARTNER' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setFormData(p => ({...p, designType: tab.id}));
                                        setProcessedStudents([]); 
                                        setError('');
                                    }}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${
                                        formData.designType === tab.id 
                                        ? 'bg-slate-900 text-white shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        
                        {/* ⚠️ ማስተካከያ 2፦ ተማሪ ከተመረጠ ብቻ የክፍልና የሴሚስተር ምርጫዎችን ማሳየት [2] */}
                        {['standard', 'primary'].includes(formData.designType) && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">{t('grade')}</label>
                                    <select name="grade" value={formData.grade} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white font-semibold text-slate-700">
                                        <option value="">-- {t('select')} --</option>
                                        {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">{t('semester')}</label>
                                    <select name="semester" value={formData.semester} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg bg-white font-semibold text-slate-700">
                                        {SEMESTER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{t(opt.label)}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        {/* ⚠️ ማስተካከያ 3፦ መምህር ወይም አጋር ከተመረጠ የክፍል መመዝገቢያ ፎርም በራስ-ሰር መተካት [2] */}
                        {['teacher', 'partner'].includes(formData.designType) && (
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Recipient Name(s)</label>
                                <input 
                                    type="text" 
                                    value={manualRecipient}
                                    onChange={(e) => setManualRecipient(e.target.value)}
                                    placeholder="e.g. Mr. Abebe Kebede, Commercial Bank of Ethiopia (comma separated)" 
                                    className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 border font-bold text-slate-700 placeholder:font-normal"
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t('academic_year')}</label>
                            <input name="academicYear" type="text" value={formData.academicYear} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Award Date</label>
                            <input name="awardDate" type="text" value={formData.awardDate} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg" />
                        </div>

                        <div className="md:col-span-4 flex gap-3 mt-4">
                            <button 
                                type="submit" 
                                disabled={loading || (['standard', 'primary'].includes(formData.designType) && !formData.grade) || (['teacher', 'partner'].includes(formData.designType) && !manualRecipient)}
                                className="bg-pink-600 hover:bg-pink-700 capitalize disabled:bg-gray-400 text-white px-8 py-2.5 rounded-lg font-bold transition-colors"
                            >
                                {loading ? t('processing') : t('generate')}
                            </button>
                            {processedStudents.length > 0 && (
                                <button type="button" onClick={handlePrint} className="bg-gray-900 capitalize hover:bg-black text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors">
                                    <span>🖨️</span> {t('print_all')}
                                </button>
                            )}
                        </div>
                    </form>

                    {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100">{error}</div>}
                </div>

                {/* Preview Area */}
                <div ref={componentRef} className="print-container">
                    {processedStudents.length > 0 ? (
                        formData.designType === 'primary' ? (
                            <PrimaryCertificate students={processedStudents} {...formData} />
                        ) : formData.designType === 'standard' ? (
                            <StandardCertificate students={processedStudents} {...formData} />
                        ) : (
                            /* ⚠️ ማስተካከያ 4፦ አዲሱን የባለሙያ/አጋር የምስክር ወረቀቶች እዚህ ጋር ማገናኘት [2] */
                            <ProfessionalCertificate 
                                recipients={processedStudents} 
                                type={formData.designType} 
                                {...formData} 
                            />
                        )
                    ) : (
                        !loading && <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium">No certificates generated yet. Select a template and fill info to begin.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CertificatePage;