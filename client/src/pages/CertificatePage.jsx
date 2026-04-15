import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import authService from '../services/authService';
import userService from '../services/userService';
import subjectService from '../services/subjectService';
import reportCardService from '../services/reportCardService';

// Import Templates
import StandardCertificate from '../components/certificate/StandardCertificate';
import PrimaryCertificate from '../components/certificate/PrimaryCertificate';

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
        academicYear: '2018',
        awardDate: new Date().toLocaleDateString('en-GB'),
        designType: 'standard'
    });
    
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

    // Auto-switch design based on Grade Name
    useEffect(() => {
        const g = formData.grade.toLowerCase();
        const isPrimary = g.includes('kg') || g.includes('nursery') || g.includes('grade 1') || g.includes('grade 2');
        setFormData(prev => ({ ...prev, designType: isPrimary ? 'primary' : 'standard' }));
    }, [formData.grade]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!formData.grade) return;
        
        setLoading(true);
        setError('');
        
        try {
            const response = await reportCardService.getCertificateData(formData.grade, formData.academicYear);
            const roster = response.data;

            // Helper to get specific semester data
            const getSemKey = (sem) => sem === 'First Semester' ? 'sem1' : sem === 'Second Semester' ? 'sem2' : 'overall';

            const formatted = roster
                .map(student => {
                    const stats = student[getSemKey(formData.semester)];
                    return { ...student, rank: stats.rank, avg: stats.avg };
                })
                .filter(s => s.rank !== '-' && Number(s.rank) >= 1 && Number(s.rank) <= 3)
                .sort((a, b) => Number(a.rank) - Number(b.rank));

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
        documentTitle: `Certificates_${formData.grade}_${formData.semester}` 
    });

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Control Panel */}
                <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-200 no-print">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                            <span className="text-3xl">🏆</span> {t('certificate_generator')}
                        </h2>
                        
                        <div className="inline-flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                            {['standard', 'primary'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFormData(p => ({...p, designType: type}))}
                                    className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                                        formData.designType === type 
                                        ? 'bg-white shadow-sm text-blue-700' 
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {type === 'standard' ? 'FORMAL' : 'PLAYFUL (KG)'}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t('grade')}</label>
                            <select name="grade" value={formData.grade} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                                <option value="">-- {t('select')} --</option>
                                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t('semester')}</label>
                            <select name="semester" value={formData.semester} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg">
                                {SEMESTER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{t(opt.label)}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t('academic_year')}</label>
                            <input name="academicYear" type="text" value={formData.academicYear} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">{t('date')}</label>
                            <input name="awardDate" type="text" value={formData.awardDate} onChange={handleInputChange} className="w-full border-gray-300 rounded-lg" placeholder="DD/MM/YYYY" />
                        </div>

                        <div className="md:col-span-4 flex gap-3 mt-4">
                            <button 
                                type="submit" 
                                disabled={loading || !formData.grade}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-2.5 rounded-lg font-bold transition-colors"
                            >
                                {loading ? t('processing') : t('generate')}
                            </button>
                            {processedStudents.length > 0 && (
                                <button type="button" onClick={handlePrint} className="bg-gray-900 hover:bg-black text-white px-8 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-colors">
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
                        formData.designType === 'primary' 
                        ? <PrimaryCertificate students={processedStudents} {...formData} />
                        : <StandardCertificate students={processedStudents} {...formData} />
                    ) : (
                        !loading && <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 font-medium">No certificates generated yet. Select a grade to begin.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CertificatePage;