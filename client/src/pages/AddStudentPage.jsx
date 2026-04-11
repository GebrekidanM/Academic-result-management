import React, { useState, useEffect } from 'react';
import studentService from '../services/studentService';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AddStudentPage = () => {
    const { t } = useTranslation();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    const [regMode, setRegMode] = useState('new'); 

    const [studentData, setStudentData] = useState({
        fullName: '',
        gender: 'Male',
        dateOfBirth: '',
        gradeLevel: '',
        motherName: '',
        motherContact: '',
        fatherContact: '',
        healthStatus: 'No known conditions',
    });

    // --- State for RETURNING Student ---
    const [searchId, setSearchId] = useState('');
    const [foundStudent, setFoundStudent] = useState(null);
    const [newGradeLevel, setNewGradeLevel] = useState('');

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

    // --- Logic: Search for Existing Student ---
    const handleSearchStudent = async () => {
        if (!searchId) return;
        setLoading(true);
        setError(null);
        setFoundStudent(null);

        try {
            // This calls GET /api/students/id/:studentId
            const response = await studentService.getStudentByStudentId(searchId);
            setFoundStudent(response.data.data);
            setLoading(false);
        } catch (err) {
            setError("Student ID not found. Please check and try again.");
            setLoading(false);
        }
    };

    // --- Logic: Final Submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isOnline) {
            setError(t('offline_warning') || "Internet required.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (regMode === 'new') {
                // HANDLE NEW STUDENT
                const formattedData = {
                    ...studentData,
                    gradeLevel: studentData.gradeLevel.replace(/\b\w/g, c => c.toUpperCase())
                };
                const response = await studentService.createStudent(formattedData);
                setSuccess(response.data.data);
            } else {
                // HANDLE RETURNING STUDENT (RE-REGISTER)
                if (!newGradeLevel) {
                    setError("Please enter the new grade level.");
                    setLoading(false);
                    return;
                }

                const response = await studentService.reRegisterStudent({
                    studentId: foundStudent.studentId,
                    newGradeLevel: newGradeLevel.replace(/\b\w/g, c => c.toUpperCase())
                });

                // Set success state to show confirmation
                setSuccess({
                    ...foundStudent,
                    gradeLevel: newGradeLevel,
                    isReRegistration: true
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
            setLoading(false);
        }
    };

    // --- Styling Variables ---
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const textAreaInput = `${textInput} h-24 resize-y`;
    const submitButton = `w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading || !isOnline ? 'opacity-50 cursor-not-allowed' : ''}`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto min-h-screen">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{t('add_student')}</h2>
                    <p className="text-sm text-gray-500">Register new or promote existing students</p>
                </div>
                
                {/* Toggle Switch */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                        onClick={() => { setRegMode('new'); setSuccess(null); setError(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${regMode === 'new' ? 'bg-white shadow text-pink-600' : 'text-gray-500'}`}
                    >
                        New Student
                    </button>
                    <button 
                        onClick={() => { setRegMode('returning'); setSuccess(null); setError(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${regMode === 'returning' ? 'bg-white shadow text-pink-600' : 'text-gray-500'}`}
                    >
                        Returning Student
                    </button>
                </div>

                <Link to="/students" className="text-pink-600 hover:underline font-bold text-sm">
                    &larr; {t('back')}
                </Link>
            </div>

            {success ? (
                /* --- SUCCESS PANEL --- */
                <div className="p-8 bg-green-50 border border-green-200 rounded-xl text-center animate-fade-in">
                    <div className="text-5xl mb-4">✅</div>
                    <h3 className="text-2xl font-bold text-green-800 mb-2">
                        {success.isReRegistration ? "Re-registration Complete!" : "Student Created!"}
                    </h3>
                    <p className="text-gray-600 mb-6">
                        {success.isReRegistration 
                            ? `${success.fullName} is now enrolled in ${success.gradeLevel}.`
                            : "Write down these credentials. The parent will need them to login."}
                    </p>
                    
                    <div className="inline-block bg-white border-2 border-dashed border-green-400 p-6 rounded-lg text-left shadow-sm">
                        <p className="mb-2"><span className="text-gray-500 font-bold uppercase text-xs">Student Name:</span> <br/><span className="text-xl font-bold">{success.fullName}</span></p>
                        <p className="mb-2"><span className="text-gray-500 font-bold uppercase text-xs">Student ID:</span> <br/><span className="text-2xl font-mono font-black text-blue-700">{success.studentId}</span></p>
                        {!success.isReRegistration && (
                            <p><span className="text-gray-500 font-bold uppercase text-xs">Initial Password:</span> <br/><span className="text-2xl font-mono font-black text-red-600 tracking-wider">{success.initialPassword}</span></p>
                        )}
                        {success.isReRegistration && (
                            <p><span className="text-gray-500 font-bold uppercase text-xs">New Grade:</span> <br/><span className="text-2xl font-bold text-pink-600">{success.gradeLevel}</span></p>
                        )}
                    </div>

                    <div className="mt-8 flex gap-4 justify-center">
                        <button onClick={() => window.location.reload()} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-lg shadow">
                            Done
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Offline Warning */}
                    {!isOnline && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                            <p className="font-bold">⚠️ Offline Mode</p>
                            <p>You need to be online to access the database.</p>
                        </div>
                    )}

                    {/* --- MODE: RETURNING STUDENT FLOW --- */}
                    {regMode === 'returning' && (
                        <div className="max-w-2xl mx-auto py-8">
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm">
                                <label className={inputLabel}>Step 1: Search by Student ID</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        className={textInput} 
                                        placeholder="e.g. FKS-2023-001" 
                                        value={searchId}
                                        onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleSearchStudent}
                                        disabled={loading || !searchId}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-bold transition-colors"
                                    >
                                        {loading ? '...' : 'Search'}
                                    </button>
                                </div>
                            </div>

                            {foundStudent && (
                                <div className="mt-8 p-6 bg-white border-2 border-green-500 rounded-xl shadow-lg animate-fade-in">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-xs font-bold text-green-600 uppercase">Student Found</p>
                                            <h3 className="text-2xl font-black text-gray-800">{foundStudent.fullName}</h3>
                                            <p className="text-gray-600 italic">Currently in: {foundStudent.gradeLevel}</p>
                                        </div>
                                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                            Verified
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <label className={inputLabel}>Step 2: Assign New Grade Level</label>
                                        <input 
                                            type="text" 
                                            className={textInput} 
                                            placeholder="Enter New Grade (e.g. Grade 3B)" 
                                            value={newGradeLevel}
                                            onChange={(e) => setNewGradeLevel(e.target.value)}
                                            required
                                        />
                                        <p className="text-xs text-gray-400 mt-2">Example: If they were in 2A, put 3A.</p>

                                        <button 
                                            onClick={handleSubmit}
                                            disabled={loading || !newGradeLevel}
                                            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg shadow-lg transition-all transform hover:scale-[1.01]"
                                        >
                                            {loading ? 'Processing...' : `Promote ${foundStudent.fullName.split(' ')[0]} to ${newGradeLevel}`}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- MODE: NEW STUDENT FLOW --- */}
                    {regMode === 'new' && (
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="fullName" className={inputLabel}>{t('full_name')}</label>
                                    <input id="fullName" type="text" name="fullName" value={studentData.fullName} onChange={handleChange} className={textInput} placeholder="e.g. Abebe Kebede" required />
                                </div>
                                
                                <div>
                                    <label htmlFor="gradeLevel" className={inputLabel}>{t('grade')}</label>
                                    <input id="gradeLevel" type="text" name="gradeLevel" value={studentData.gradeLevel} onChange={handleChange} className={textInput} placeholder="e.g. Grade 1A, KG 2B" required />
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
                                    <input id="dateOfBirth" type="text" placeholder='dd/mm/yyyy' name="dateOfBirth" value={studentData.dateOfBirth} onChange={handleChange} className={textInput} />
                                </div>
                            </div>

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
                        </form>
                    )}
                </>
            )}

            {error && <p className="text-red-500 text-center mt-4 bg-red-50 p-2 rounded border border-red-200">{error}</p>}
        </div>
    );
};

export default AddStudentPage;