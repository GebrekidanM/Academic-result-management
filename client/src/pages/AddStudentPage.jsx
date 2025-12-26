import React, { useState, useEffect } from 'react';
import studentService from '../services/studentService';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 

const AddStudentPage = () => {
    const { t } = useTranslation(); 
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // --- State ---
    const [studentData, setStudentData] = useState({
        fullName: '',
        gender: 'Male',
        dateOfBirth: '',
        gradeLevel: '', // User will type "Grade 1A" here
        motherName: '',
        motherContact: '',
        fatherContact: '',
        healthStatus: 'No known conditions',
    });

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setStudentData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isOnline) {
            setError(t('offline_warning') || "Internet required to generate Student ID.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        
        try {
            // Optional: Auto-capitalize 'grade' -> 'Grade' if user types lowercase
            const formattedData = {
                ...studentData,
                // Ensure "grade 1a" becomes "Grade 1A" for consistency
                gradeLevel: studentData.gradeLevel.replace(/\b\w/g, c => c.toUpperCase()) 
            };

            const response = await studentService.createStudent(formattedData);
            setSuccess(response.data.data);
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
            setLoading(false);
        }
    };

    // --- Styling ---
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const textAreaInput = `${textInput} h-24 resize-y`;
    const submitButton = `w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading || !isOnline ? 'opacity-50 cursor-not-allowed' : ''}`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto min-h-screen">
            
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">{t('add_student')}</h2>
                <Link to="/students" className="text-pink-600 hover:underline font-bold text-sm">
                    &larr; {t('back')}
                </Link>
            </div>

            {success ? (
                // --- Success Panel (Credentials) ---
                <div className="p-8 bg-green-50 border border-green-200 rounded-xl text-center animate-fade-in">
                    <div className="text-5xl mb-4">✅</div>
                    <h3 className="text-2xl font-bold text-green-800 mb-2">Student Created!</h3>
                    <p className="text-gray-600 mb-6">Write down these credentials. The parent will need them to login.</p>
                    
                    <div className="inline-block bg-white border-2 border-dashed border-green-400 p-6 rounded-lg text-left shadow-sm">
                        <p className="mb-2"><span className="text-gray-500 font-bold uppercase text-xs">Student Name:</span> <br/><span className="text-xl font-bold">{success.fullName}</span></p>
                        <p className="mb-2"><span className="text-gray-500 font-bold uppercase text-xs">Username / ID:</span> <br/><span className="text-2xl font-mono font-black text-blue-700">{success.studentId}</span></p>
                        <p><span className="text-gray-500 font-bold uppercase text-xs">Initial Password:</span> <br/><span className="text-2xl font-mono font-black text-red-600 tracking-wider">{success.initialPassword}</span></p>
                    </div>

                    <div className="mt-8 flex gap-4 justify-center">
                        <button onClick={() => window.location.reload()} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-lg shadow">
                            + Add Another
                        </button>
                        <Link to={`/students/${success._id}`} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow">
                            View Profile
                        </Link>
                    </div>
                </div>
            ) : (
                // --- Add Student Form ---
                <form onSubmit={handleSubmit}>
                    
                    {!isOnline && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                            <p className="font-bold">⚠️ Offline Mode</p>
                            <p>You cannot add new students while offline because the server needs to generate a unique ID.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <div>
                            <label htmlFor="fullName" className={inputLabel}>{t('full_name')}</label>
                            <input id="fullName" type="text" name="fullName" value={studentData.fullName} onChange={handleChange} className={textInput} placeholder="e.g. Abebe Kebede" required />
                        </div>
                        
                        {/* Grade Level (TEXT INPUT NOW) */}
                        <div>
                            <label htmlFor="gradeLevel" className={inputLabel}>{t('grade')}</label>
                            <input 
                                id="gradeLevel" 
                                type="text" 
                                name="gradeLevel" 
                                value={studentData.gradeLevel} 
                                onChange={handleChange} 
                                className={textInput} 
                                placeholder="e.g. Grade 1A, KG 2B" 
                                required 
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

                        {/* DOB */}
                        <div>
                            <label htmlFor="dateOfBirth" className={inputLabel}>{t('dob')}</label>
                            <input id="dateOfBirth" type="date" name="dateOfBirth" value={studentData.dateOfBirth} onChange={handleChange} className={textInput} />
                        </div>
                    </div>

                    {/* Parents Info */}
                    <fieldset className="mt-8 border-t pt-6">
                        <legend className="text-lg font-bold text-gray-700 mb-4 uppercase tracking-wide">Family Information</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="motherName" className={inputLabel}>{t('parent_name')} (Mother)</label>
                                <input id="motherName" type="text" name="motherName" value={studentData.motherName} onChange={handleChange} className={textInput} />
                            </div>
                            <div>
                                <label htmlFor="motherContact" className={inputLabel}>{t('contact')} (Mother)</label>
                                <input id="motherContact" type="tel" name="motherContact" value={studentData.motherContact} onChange={handleChange} className={textInput} />
                            </div>
                            <div>
                                <label htmlFor="fatherContact" className={inputLabel}>{t('contact')} (Father)</label>
                                <input id="fatherContact" type="tel" name="fatherContact" value={studentData.fatherContact} onChange={handleChange} className={textInput} />
                            </div>
                        </div>
                    </fieldset>

                    {/* Health */}
                    <fieldset className="mt-8 border-t pt-6">
                        <legend className="text-lg font-bold text-gray-700 mb-4 uppercase tracking-wide">{t('health_status')}</legend>
                        <div>
                            <textarea id="healthStatus" name="healthStatus" value={studentData.healthStatus} onChange={handleChange} className={textAreaInput} placeholder="Allergies, conditions, etc..."/>
                        </div>
                    </fieldset>

                    <div className="mt-8">
                        <button type="submit" className={submitButton} disabled={loading || !isOnline}>
                            {loading ? t('loading') : t('save')}
                        </button>
                    </div>

                    {error && <p className="text-red-500 text-center mt-4 bg-red-50 p-2 rounded border border-red-200">{error}</p>}
                </form>
            )}
        </div>
    );
};

export default AddStudentPage;