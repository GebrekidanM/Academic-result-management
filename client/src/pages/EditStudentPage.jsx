// src/pages/EditStudentPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import studentService from '@shared/services/studentService';

// Standardized grade level formatting logic
function formatGrade(input) {
  if (!input) return input;

  let formatted = input.trim().toLowerCase();
  formatted = formatted.replace(/\b([a-z])/g, (match) => match.toUpperCase());
  formatted = formatted.replace(/(\d)\s*([a-z])/gi, (match, num, letter) => {
    return num + letter.toUpperCase();
  });
  return formatted;
}

const EditStudentPage = () => {
    const { t } = useTranslation();
    const { id: studentId } = useParams();
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // --- State Management ---
    const [studentData, setStudentData] = useState({
        fullName: '',
        gender: 'Male',
        dateOfBirth: '',
        gradeLevel: '',
        year: '', 
        nationalIdNumber: '',
        motherName: '',
        motherContact: '',
        fatherContact: '',
        healthStatus: 'No known conditions',
        imageUrl: '',
    });

    // Tracking currently saved documents in database
    const [existingUrls, setExistingUrls] = useState({
        transferLetterUrl: '',
        certificateUrl: '',
        birthCertificateUrl: '',
        nationalIdUrl: '',
    });

    // File Upload States
    const [transferLetter, setTransferLetter] = useState(null);
    const [certificate, setCertificate] = useState(null);
    const [birthCertificate, setBirthCertificate] = useState(null);
    const [nationalId, setNationalId] = useState(null);
    
    // State to prevent profile photo re-fetching on every single keystroke
    const [photoKey, setPhotoKey] = useState(Date.now());
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- Monitor Online Status ---
    useEffect(() => {
        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    // --- Fetch student data ---
    useEffect(() => {
        studentService.getStudentById(studentId)
            .then(res => {
                const data = res.data.data;
                setStudentData({
                    fullName: data.fullName || '',
                    gender: data.gender || 'Male',
                    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
                    gradeLevel: data.gradeLevel || '',
                    year: data.year || '', 
                    nationalIdNumber: data.nationalIdNumber || '',
                    motherName: data.motherName || '',
                    motherContact: data.motherContact || '',
                    fatherContact: data.fatherContact || '',
                    healthStatus: data.healthStatus || 'No known conditions',
                    imageUrl: data.imageUrl || '/images/students/default-avatar.png',
                });

                setExistingUrls({
                    transferLetterUrl: data.transferLetterUrl || '',
                    certificateUrl: data.certificateUrl || '',
                    birthCertificateUrl: data.birthCertificateUrl || '',
                    nationalIdUrl: data.nationalIdUrl || '',
                });
            })
            .catch(() => setError(t('error') || 'Failed to load student data.'))
            .finally(() => setLoading(false));
    }, [studentId, t]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setStudentData(prev => ({ ...prev, [name]: value }));
    };

    // --- Photo upload ---
    const handlePhotoUpload = async (e) => {
        if (!isOnline) {
            alert(t('offline_warning'));
            return;
        }

        const file = e.target.files[0];
        if (!file) return;
        setError(null);

        if (!file.type.startsWith('image/')) {
            setError('Only image files are allowed.');
            return;
        }

        try {
            const res = await studentService.uploadPhoto(studentId, file);
            setStudentData(prev => ({ ...prev, imageUrl: res.data.imageUrl }));
            setPhotoKey(Date.now()); 
        } catch (err) {
            console.error("Upload error:", err);
            setError(t('error'));
        }
    };

    // --- Form submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (studentData.dateOfBirth) {
            const datePattern = /^\d{4}-\d{2}-\d{2}$/;
            const isCorrectFormat = typeof studentData.dateOfBirth === 'string' && datePattern.test(studentData.dateOfBirth);

            if (!isCorrectFormat) {
                setError('The birth date must follow this format YYYY-MM-DD');
                return;
            } 
        }

        if (!isOnline) {
            setError(t('offline_warning'));
            return;
        }

        setError(null);
        try {
            setLoading(true);

            // Construct FormData payload to support file streams
            const formDataPayload = new FormData();
            formDataPayload.append('fullName', studentData.fullName);
            formDataPayload.append('gender', studentData.gender);
            formDataPayload.append('dateOfBirth', studentData.dateOfBirth);
            formDataPayload.append('gradeLevel', formatGrade(studentData.gradeLevel));
            formDataPayload.append('year', studentData.year); 
            formDataPayload.append('nationalIdNumber', studentData.nationalIdNumber);
            formDataPayload.append('motherName', studentData.motherName);
            formDataPayload.append('motherContact', studentData.motherContact);
            formDataPayload.append('fatherContact', studentData.fatherContact);
            formDataPayload.append('healthStatus', studentData.healthStatus);

            // Only append files if the user has selected new ones to replace the old ones
            if (transferLetter) formDataPayload.append('transferLetter', transferLetter);
            if (certificate) formDataPayload.append('certificate', certificate);
            if (birthCertificate) formDataPayload.append('birthCertificate', birthCertificate);
            if (nationalId) formDataPayload.append('nationalId', nationalId);

            await studentService.updateStudent(studentId, formDataPayload);
            alert(t('success_save') || 'Student profile updated successfully!');
            navigate(`/students/${studentId}`);
        } catch (err) {
            setError(t('error') || 'Failed to update student profile.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !studentData.fullName) return <p className="text-center text-lg mt-8">{t('loading')}</p>;
    if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;

    // --- Tailwind CSS classes (FIXED: fileInput added) ---
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const fileInput = "shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50 file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100";
    const textAreaInput = `${textInput} h-24 resize-y`;
    const submitButton = `w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${!isOnline || loading ? 'opacity-50 cursor-not-allowed' : ''}`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
            
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">{t('edit')} {t('student')}</h2>
                <Link to="/students" className="text-pink-600 hover:underline font-bold text-sm">
                    &larr; {t('back')}
                </Link>
            </div>

            {!isOnline && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                    <p className="font-bold">⚠️ {t('offline_mode')}</p>
                    <p className="text-sm">You must be online to update student profiles.</p>
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                {/* Photo Upload */}
                <div className="flex flex-col items-center mb-6">
                    <img 
                        src={`${studentData.imageUrl}?key=${photoKey}`} 
                        alt={studentData.fullName} 
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 mb-4 shadow-sm" 
                    />
                    
                    <label 
                        htmlFor="photo-upload" 
                        className={`cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        📷 {t('edit')} Photo
                    </label>
                    <input 
                        id="photo-upload" 
                        type="file" 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                        accept="image/*" 
                        disabled={!isOnline}
                    />
                </div>

                {/* Main Details (3-row, 2-column grid layout) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="fullName" className={inputLabel}>{t('full_name')}</label>
                        <input id="fullName" type="text" name="fullName" value={studentData.fullName} onChange={handleChange} className={textInput} required />
                    </div>
                    <div>
                        <label htmlFor="gradeLevel" className={inputLabel}>{t('grade')}</label>
                        <input id="gradeLevel" type="text" name="gradeLevel" value={studentData.gradeLevel} onChange={handleChange} className={textInput} required />
                    </div>
                    
                    <div>
                        <label htmlFor="year" className={inputLabel}>{t('academic_year') || 'Academic Year'}</label>
                        <input 
                            id="year" 
                            type="text" 
                            name="year" 
                            value={studentData.year} 
                            onChange={handleChange} 
                            className={textInput} 
                            required 
                            placeholder="e.g. 2018"
                        />
                    </div>

                    <div>
                        <label htmlFor="gender" className={inputLabel}>{t('gender')}</label>
                        <select id="gender" name="gender" value={studentData.gender} onChange={handleChange} className={textInput}>
                            <option value="Male">{t('Male')}</option>
                            <option value="Female">{t('Female')}</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="dateOfBirth" className={inputLabel}>{t('dob')}</label>
                        <input id="dateOfBirth" type="text" name="dateOfBirth" placeholder='yyyy-mm-dd' value={studentData.dateOfBirth} onChange={handleChange} className={textInput} />
                    </div>
                    
                    <div>
                        <label htmlFor="nationalIdNumber" className={inputLabel}>{t('national_id_number') || 'National ID Number'}</label>
                        <input 
                            id="nationalIdNumber" 
                            type="text" 
                            name="nationalIdNumber" 
                            value={studentData.nationalIdNumber} 
                            onChange={handleChange} 
                            className={textInput} 
                            placeholder="e.g. ID-89478" 
                        />
                    </div>
                </div>

                {/* Parent / Guardian */}
                <fieldset className="mt-8 border-t pt-6">
                    <legend className="text-lg font-bold text-slate-700 mb-4 uppercase tracking-wide">{t('family_information')}</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="motherName" className={inputLabel}>{t('parent_name')} {t('mother')}</label>
                            <input id="motherName" type="text" name="motherName" value={studentData.motherName} onChange={handleChange} className={textInput} />
                        </div>
                        <div>
                            <label htmlFor="motherContact" className={inputLabel}>{t('contact')} {t('mother')}</label>
                            <input id="motherContact" type="tel" name="motherContact" value={studentData.motherContact} onChange={handleChange} className={textInput} />
                        </div>
                        <div>
                            <label htmlFor="fatherContact" className={inputLabel}>{t('contact')} {t('father')}</label>
                            <input id="fatherContact" type="tel" name="fatherContact" value={studentData.fatherContact} onChange={handleChange} className={textInput} />
                        </div>
                    </div>
                </fieldset>

                {/* Scanned Documents (File Updating Section) */}
                <fieldset className="mt-8 border-t pt-6">
                    <legend className="text-lg font-bold text-slate-700 mb-4 uppercase tracking-wide">
                        📂 {t('scanned_documents') || 'Scanned Documents (Upload New to Replace)'}
                    </legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Transfer Letter */}
                        <div>
                            <label htmlFor="transferLetter" className={inputLabel}>
                                📄 {t('transfer_letter') || 'Transfer Letter'}
                            </label>
                            <input 
                                id="transferLetter" 
                                type="file" 
                                accept="image/*,application/pdf"
                                onChange={(e) => setTransferLetter(e.target.files[0])} 
                                className={fileInput} 
                            />
                            {existingUrls.transferLetterUrl && (
                                <a href={existingUrls.transferLetterUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block mt-1">
                                    📄 {t('view_current') || 'View Current File'}
                                </a>
                            )}
                        </div>

                        {/* Certificate / Report Card */}
                        <div>
                            <label htmlFor="certificate" className={inputLabel}>
                                🎓 {t('prev_certificate') || 'Report Card'}
                            </label>
                            <input 
                                id="certificate" 
                                type="file" 
                                accept="image/*,application/pdf"
                                onChange={(e) => setCertificate(e.target.files[0])} 
                                className={fileInput} 
                            />
                            {existingUrls.certificateUrl && (
                                <a href={existingUrls.certificateUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block mt-1">
                                    📄 {t('view_current') || 'View Current File'}
                                </a>
                            )}
                        </div>

                        {/* Birth Certificate */}
                        <div>
                            <label htmlFor="birthCertificate" className={inputLabel}>
                                👶 {t('birth_certificate') || 'Birth Certificate'}
                            </label>
                            <input 
                                id="birthCertificate" 
                                type="file" 
                                accept="image/*,application/pdf"
                                onChange={(e) => setBirthCertificate(e.target.files[0])} 
                                className={fileInput} 
                            />
                            {existingUrls.birthCertificateUrl && (
                                <a href={existingUrls.birthCertificateUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block mt-1">
                                    📄 {t('view_current') || 'View Current File'}
                                </a>
                            )}
                        </div>

                        {/* National ID */}
                        <div>
                            <label htmlFor="nationalId" className={inputLabel}>
                                🪪 {t('national_id') || 'National ID'}
                            </label>
                            <input 
                                id="nationalId" 
                                type="file" 
                                accept="image/*,application/pdf"
                                onChange={(e) => setNationalId(e.target.files[0])} 
                                className={fileInput} 
                            />
                            {existingUrls.nationalIdUrl && (
                                <a href={existingUrls.nationalIdUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block mt-1">
                                    📄 {t('view_current') || 'View Current File'}
                                </a>
                            )}
                        </div>
                    </div>
                </fieldset>

                {/* Health status */}
                <fieldset className="mt-8 border-t pt-6">
                    <legend className="text-lg font-bold text-slate-700 mb-4 uppercase tracking-wide">{t('health_status')}</legend>
                    <div>
                        <textarea id="healthStatus" name="healthStatus" value={studentData.healthStatus} onChange={handleChange} className={textAreaInput} />
                    </div>
                </fieldset>

                <div className="mt-8">
                    <button type="submit" className={submitButton} disabled={!isOnline || loading}>
                        {loading ? t('loading') : `${t('update')} Profile`}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditStudentPage;