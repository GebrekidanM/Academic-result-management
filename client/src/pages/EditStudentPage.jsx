// src/pages/EditStudentPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import studentService from '@shared/services/studentService';
import gradeLevelService from '@shared/services/gradeLevelService';

// Helper to construct safe, non-looping avatar URLs
const getStudentAvatar = (imageUrl) => {
    if (!imageUrl || imageUrl.includes('default-avatar.png')) {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%239CA3AF' viewBox='0 0 24 24'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
    }
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    const backendHost = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${backendHost.replace(/\/api\/?$/, '')}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
};

const EditStudentPage = () => {
    const { t } = useTranslation();
    const { id: studentId } = useParams();
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const [availableGrades, setAvailableGrades] = useState([]);

    // --- State Management ---
    const [studentData, setStudentData] = useState({
        fullName: '',
        gender: 'Male',
        dateOfBirth: '',
        gradeLevel: '', // Stores GradeLevel ObjectId
        year: '', 
        nationalIdNumber: '',
        motherName: '',
        motherContact: '',
        fatherContact: '',
        healthStatus: 'No known conditions',
        imageUrl: '',
    });

    // Currently saved documents in database
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
    
    const [photoKey, setPhotoKey] = useState(Date.now());
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // Monitor Online Status
    useEffect(() => {
        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    // Fetch Grade Levels & Student Data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [gradeRes, studentRes] = await Promise.all([
                    gradeLevelService.getAllGradeLevels(),
                    studentService.getStudentById(studentId)
                ]);

                // 1. Grade Levels
                const grades = gradeRes.data?.data || gradeRes.data || [];
                setAvailableGrades(
                    grades.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
                );

                // 2. Student Data
                const data = studentRes.data?.data || studentRes.data;
                if (data) {
                    // Extract GradeLevel ObjectId safely (whether populated or string)
                    const gId = typeof data.gradeLevel === 'object' ? data.gradeLevel?._id : data.gradeLevel;

                    setStudentData({
                        fullName: data.fullName || '',
                        gender: data.gender || 'Male',
                        dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth).split('T')[0] : '',
                        gradeLevel: gId || '',
                        year: data.year || '', 
                        nationalIdNumber: data.nationalIdNumber || '',
                        motherName: data.motherName || '',
                        motherContact: data.motherContact || '',
                        fatherContact: data.fatherContact || '',
                        healthStatus: data.healthStatus || 'No known conditions',
                        imageUrl: data.imageUrl || '',
                    });

                    setExistingUrls({
                        transferLetterUrl: data.transferLetterUrl || '',
                        certificateUrl: data.certificateUrl || '',
                        birthCertificateUrl: data.birthCertificateUrl || '',
                        nationalIdUrl: data.nationalIdUrl || '',
                    });
                }
            } catch (err) {
                console.error("Error loading student data:", err);
                setError(t('error') || 'Failed to load student data.');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [studentId, t]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setStudentData(prev => ({ ...prev, [name]: value }));
    };

    // Photo Upload Handler
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
            setStudentData(prev => ({ ...prev, imageUrl: res.data?.imageUrl || res.data }));
            setPhotoKey(Date.now()); 
        } catch (err) {
            console.error("Upload error:", err);
            setError(err.response?.data?.message || t('error'));
        }
    };

    // Form Submission Handler
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (studentData.dateOfBirth) {
            const datePattern = /^\d{4}-\d{2}-\d{2}$/;
            const isCorrectFormat = typeof studentData.dateOfBirth === 'string' && datePattern.test(studentData.dateOfBirth);

            if (!isCorrectFormat) {
                setError('Birth date must follow format YYYY-MM-DD');
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

            const formDataPayload = new FormData();
            formDataPayload.append('fullName', studentData.fullName.trim());
            formDataPayload.append('gender', studentData.gender);
            formDataPayload.append('dateOfBirth', studentData.dateOfBirth);
            formDataPayload.append('gradeLevel', studentData.gradeLevel); // GradeLevel ObjectId
            formDataPayload.append('year', studentData.year); 
            formDataPayload.append('nationalIdNumber', studentData.nationalIdNumber.trim());
            formDataPayload.append('motherName', studentData.motherName.trim());
            formDataPayload.append('motherContact', studentData.motherContact.trim());
            formDataPayload.append('fatherContact', studentData.fatherContact.trim());
            formDataPayload.append('healthStatus', studentData.healthStatus.trim());

            // Files are appended only if new files were selected
            if (transferLetter) formDataPayload.append('transferLetter', transferLetter);
            if (certificate) formDataPayload.append('certificate', certificate);
            if (birthCertificate) formDataPayload.append('birthCertificate', birthCertificate);
            if (nationalId) formDataPayload.append('nationalId', nationalId);

            await studentService.updateStudent(studentId, formDataPayload);
            alert(t('success_save') || 'Student profile updated successfully!');
            navigate(`/students/${studentId}`);
        } catch (err) {
            console.error("Update error:", err);
            setError(err.response?.data?.message || t('error') || 'Failed to update student profile.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !studentData.fullName) return <p className="text-center text-lg mt-8">{t('loading')}</p>;

    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white";
    const fileInput = "shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50 file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100";
    const textAreaInput = `${textInput} h-24 resize-y`;
    const submitButton = `w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${!isOnline || loading ? 'opacity-50 cursor-not-allowed' : ''}`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto my-6">
            
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">{t('edit')} {t('student')}</h2>
                <Link to={`/students/${studentId}`} className="text-pink-600 hover:underline font-bold text-sm">
                    &larr; {t('back')}
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}

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
                        src={getStudentAvatar(studentData.imageUrl ? `${studentData.imageUrl}?key=${photoKey}` : '')} 
                        alt={studentData.fullName} 
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 mb-4 shadow-sm bg-gray-100" 
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%239CA3AF' viewBox='0 0 24 24'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
                        }}
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

                {/* Main Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                        <label htmlFor="fullName" className={inputLabel}>{t('full_name')}</label>
                        <input id="fullName" type="text" name="fullName" value={studentData.fullName} onChange={handleChange} className={textInput} required />
                    </div>

                    {/* Grade Level Select Dropdown */}
                    <div>
                        <label htmlFor="gradeLevel" className={inputLabel}>{t('grade')}</label>
                        <select 
                            id="gradeLevel" 
                            name="gradeLevel" 
                            value={studentData.gradeLevel} 
                            onChange={handleChange} 
                            className={textInput} 
                            required
                        >
                            <option value="">-- Select Grade Level --</option>
                            {availableGrades.map(g => (
                                <option key={g._id} value={g._id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Academic Year */}
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

                    {/* Gender */}
                    <div>
                        <label htmlFor="gender" className={inputLabel}>{t('gender')}</label>
                        <select id="gender" name="gender" value={studentData.gender} onChange={handleChange} className={textInput}>
                            <option value="Male">{t('Male')}</option>
                            <option value="Female">{t('Female')}</option>
                        </select>
                    </div>

                    {/* Date of Birth */}
                    <div>
                        <label htmlFor="dateOfBirth" className={inputLabel}>{t('dob')}</label>
                        <input id="dateOfBirth" type="text" name="dateOfBirth" placeholder='yyyy-mm-dd' value={studentData.dateOfBirth} onChange={handleChange} className={textInput} />
                    </div>
                    
                    {/* National ID Number */}
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
                    <legend className="text-lg font-bold text-gray-700 mb-4 uppercase tracking-wide">{t('family_information')}</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="motherName" className={inputLabel}>{t('parent_name')} ({t('mother')})</label>
                            <input id="motherName" type="text" name="motherName" value={studentData.motherName} onChange={handleChange} className={textInput} />
                        </div>
                        <div>
                            <label htmlFor="motherContact" className={inputLabel}>{t('contact')} ({t('mother')})</label>
                            <input id="motherContact" type="tel" name="motherContact" value={studentData.motherContact} onChange={handleChange} className={textInput} />
                        </div>
                        <div>
                            <label htmlFor="fatherContact" className={inputLabel}>{t('contact')} ({t('father')})</label>
                            <input id="fatherContact" type="tel" name="fatherContact" value={studentData.fatherContact} onChange={handleChange} className={textInput} />
                        </div>
                    </div>
                </fieldset>

                {/* Scanned Documents (File Updating Section) */}
                <fieldset className="mt-8 border-t pt-6">
                    <legend className="text-lg font-bold text-gray-700 mb-4 uppercase tracking-wide">
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
                                <a href={existingUrls.transferLetterUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block mt-1 font-bold">
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
                                <a href={existingUrls.certificateUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block mt-1 font-bold">
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
                                <a href={existingUrls.birthCertificateUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block mt-1 font-bold">
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
                                <a href={existingUrls.nationalIdUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline block mt-1 font-bold">
                                    📄 {t('view_current') || 'View Current File'}
                                </a>
                            )}
                        </div>
                    </div>
                </fieldset>

                {/* Health status */}
                <fieldset className="mt-8 border-t pt-6">
                    <legend className="text-lg font-bold text-gray-700 mb-4 uppercase tracking-wide">{t('health_status')}</legend>
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