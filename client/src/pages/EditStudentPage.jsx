import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import Hook
import studentService from '../services/studentService';

const EditStudentPage = () => {
    const { t } = useTranslation(); // <--- Initialize
    const { id: studentId } = useParams();
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // --- State Management ---
    const [studentData, setStudentData] = useState({
        fullName: '',
        gender: 'Male',
        dateOfBirth: '',
        gradeLevel: '',
        motherName: '',
        motherContact: '',
        fatherContact: '',
        healthStatus: 'No known conditions',
        imageUrl: '',
    });
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
                    motherName: data.motherName || '',
                    motherContact: data.motherContact || '',
                    fatherContact: data.fatherContact || '',
                    healthStatus: data.healthStatus || 'No known conditions',
                    imageUrl: data.imageUrl || '/images/students/default-avatar.png',
                });
            })
            .catch(() => setError(t('error') || 'Failed to load student data.'))
            .finally(() => setLoading(false));
    }, [studentId, t]);

    // --- Handle input changes ---
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
            // Add timestamp to force refresh the image
            setStudentData(prev => ({ ...prev, imageUrl: res.data.imageUrl }));
        } catch (err) {
            console.error("Upload error:", err);
            setError(t('error'));
        }
    };

    // --- Form submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isOnline) {
            setError(t('offline_warning'));
            return;
        }

        setError(null);
        try {
            await studentService.updateStudent(studentId, studentData);
            alert(t('success_save') || 'Student profile updated successfully!');
            navigate(`/students/${studentId}`);
        } catch (err) {
            setError(t('error') || 'Failed to update student profile.');
        }
    };

    if (loading) return <p className="text-center text-lg mt-8">{t('loading')}</p>;
    if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;

    // --- Tailwind CSS classes ---
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const textAreaInput = `${textInput} h-24 resize-y`;
    const submitButton = `w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`;

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
                        src={`${studentData.imageUrl}?key=${Date.now()}`} 
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

                {/* Main Details */}
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
                        <label htmlFor="gender" className={inputLabel}>{t('gender')}</label>
                        <select id="gender" name="gender" value={studentData.gender} onChange={handleChange} className={textInput}>
                            <option value="Male">{t('Male')}</option>
                            <option value="Female">{t('Female')}</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="dateOfBirth" className={inputLabel}>{t('dob')}</label>
                        <input id="dateOfBirth" type="date" name="dateOfBirth" value={studentData.dateOfBirth} onChange={handleChange} className={textInput} />
                    </div>
                </div>

                {/* Parent / Guardian */}
                <fieldset className="mt-8 border-t pt-6">
                    <legend className="text-lg font-bold text-gray-700 mb-4 uppercase tracking-wide">{t('family_information')}</legend>
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

                {/* Health */}
                <fieldset className="mt-8 border-t pt-6">
                    <legend className="text-lg font-bold text-gray-700 mb-4 uppercase tracking-wide">{t('health_status')}</legend>
                    <div>
                        <textarea id="healthStatus" name="healthStatus" value={studentData.healthStatus} onChange={handleChange} className={textAreaInput} />
                    </div>
                </fieldset>

                <div className="mt-8">
                    <button type="submit" className={submitButton} disabled={!isOnline}>
                        {t('update')} Profile
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditStudentPage;