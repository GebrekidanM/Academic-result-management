// src/pages/AddStudentPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import studentService from '@shared/services/studentService';
import gradeLevelService from '@shared/services/gradeLevelService';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function getCurrentAcademicYear() {
    const today = new Date();
    const gregYear = today.getFullYear();
    const gregMonth = today.getMonth() + 1;
    return gregMonth >= 9 ? gregYear - 7 : gregYear - 8;
}

const AddStudentPage = () => {
    const { t } = useTranslation();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    const [regMode, setRegMode] = useState('new'); // 'new' | 'returning'

    const [searchType, setSearchType] = useState('id'); // 'id' | 'name'
    const [searchName, setSearchName] = useState('');
    const [allStudents, setAllStudents] = useState([]);
    const [availableGrades, setAvailableGrades] = useState([]); // Dynamic Grade Levels from DB

    const [studentData, setStudentData] = useState({
        fullName: '',
        gender: 'Male',
        dateOfBirth: '',
        gradeLevel: '', // Stores selected GradeLevel ObjectId
        year: getCurrentAcademicYear().toString(), 
        motherName: '',
        motherContact: '',
        fatherContact: '',
        healthStatus: 'No known conditions',
        nationalIdNumber: '',
    });

    const [transferLetter, setTransferLetter] = useState(null);
    const [certificate, setCertificate] = useState(null);
    const [birthCertificate, setBirthCertificate] = useState(null);
    const [nationalId, setNationalId] = useState(null);

    const [searchId, setSearchId] = useState('');
    const [year, setYear] = useState(getCurrentAcademicYear().toString());
    const [foundStudent, setFoundStudent] = useState(null);
    const [newGradeLevel, setNewGradeLevel] = useState(''); // Stores target GradeLevel ObjectId

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

    // Load Master List of Grade Levels & Students
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const gradeRes = await gradeLevelService.getAllGradeLevels();
                const grades = gradeRes.data?.data || gradeRes.data || [];
                const sortedGrades = grades.sort((a, b) => 
                    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
                );
                setAvailableGrades(sortedGrades);

                if (sortedGrades.length > 0) {
                    setStudentData(prev => ({ ...prev, gradeLevel: sortedGrades[0]._id }));
                    setNewGradeLevel(sortedGrades[0]._id);
                }
            } catch (err) {
                console.error("Failed to load grade levels:", err);
            }
        };

        fetchInitialData();
    }, []);

    // Load master list of students for returning student autocomplete
    useEffect(() => {
        if (regMode === 'returning' && allStudents.length === 0 && isOnline) {
            const loadStudents = async () => {
                try {
                    const res = await studentService.getAllStudentsForRe();
                    setAllStudents(res.data?.data || res.data || []);
                } catch (err) {
                    console.error("Failed to load students for auto-complete selection", err);
                }
            };
            loadStudents();
        }
    }, [regMode, allStudents.length, isOnline]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setStudentData(prev => ({ ...prev, [name]: value }));
    };

    // Autocomplete Filter Logic for Returning Students
    const nameResults = useMemo(() => {
        if (!searchName.trim() || searchType !== 'name') return [];
        return allStudents.filter(s => 
            s.fullName.toLowerCase().includes(searchName.toLowerCase())
        ).slice(0, 5);
    }, [searchName, allStudents, searchType]);

    // Handle student selection from the name search dropdown
    const handleSelectStudent = (student) => {
        const gradeName = typeof student.gradeLevel === 'object' ? student.gradeLevel?.name : student.gradeLevel;
        setFoundStudent({
            studentId: student.studentId,
            fullName: student.fullName,
            currentGrade: gradeName || 'Unknown',
            year: student.year
        });
        setSearchName(student.fullName);
        setSearchId(student.studentId);
        setYear(student.year || getCurrentAcademicYear().toString());
    };

    // Logic: Search for Existing Student by ID
    const handleSearchStudent = async () => {
        const trimmedId = searchId.trim().toUpperCase(); 
        if (!trimmedId) return;
        setLoading(true);
        setError(null);
        setFoundStudent(null);

        try {
            const response = await studentService.getStudentByStudentId(trimmedId);
            const student = response.data?.data || response.data;
            const gradeName = typeof student.gradeLevel === 'object' ? student.gradeLevel?.name : student.currentGrade || student.gradeLevel;

            setFoundStudent({
                ...student,
                currentGrade: gradeName || 'Unknown'
            });
            setYear(student.year || getCurrentAcademicYear().toString());
        } catch (err) {
            setError("Student ID not found in database.");
        } finally {
            setLoading(false);
        }
    };

    // Logic: Final Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        if (!isOnline) {
            setError(t('offline_warning') || "Internet required to complete registration.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (regMode === 'new') {
                if (!studentData.gradeLevel) {
                    setError("Please select a grade level.");
                    setLoading(false);
                    return;
                }

                const formDataPayload = new FormData();
                formDataPayload.append('fullName', studentData.fullName.trim());
                formDataPayload.append('gender', studentData.gender);
                formDataPayload.append('dateOfBirth', studentData.dateOfBirth);
                formDataPayload.append('gradeLevel', studentData.gradeLevel); // GradeLevel ObjectId
                formDataPayload.append('year', studentData.year);
                formDataPayload.append('motherName', studentData.motherName.trim());
                formDataPayload.append('motherContact', studentData.motherContact.trim());
                formDataPayload.append('fatherContact', studentData.fatherContact.trim());
                formDataPayload.append('healthStatus', studentData.healthStatus.trim());
                formDataPayload.append('nationalIdNumber', studentData.nationalIdNumber.trim());

                if (transferLetter) formDataPayload.append('transferLetter', transferLetter);
                if (certificate) formDataPayload.append('certificate', certificate);
                if (birthCertificate) formDataPayload.append('birthCertificate', birthCertificate);
                if (nationalId) formDataPayload.append('nationalId', nationalId);

                const response = await studentService.createStudent(formDataPayload);
                const createdData = response.data?.data || response.data;
                
                // Get class name for success display
                const classDoc = availableGrades.find(g => g._id === studentData.gradeLevel);
                createdData.gradeLevelName = classDoc ? classDoc.name : 'Class';

                setSuccess(createdData);
            } else {
                if (!newGradeLevel) {
                    setError("Please select the target grade level.");
                    setLoading(false);
                    return;
                }

                const response = await studentService.reRegisterStudent({
                    studentId: foundStudent.studentId,
                    newGradeLevel: newGradeLevel, // GradeLevel ObjectId
                    newYear: year
                });

                const classDoc = availableGrades.find(g => g._id === newGradeLevel);
                const classDisplay = classDoc ? classDoc.name : 'Class';

                setSuccess({
                    ...foundStudent,
                    gradeLevelName: classDisplay,
                    isReRegistration: true
                });
                
                setSearchId('');
                setSearchName('');
                setFoundStudent(null);
            }
        } catch (err) {
            console.error("Registration error:", err);
            setError(err.response?.data?.message || t('error'));
        } finally {
             setLoading(false);
        }
    };

    // Styling Variables
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white";
    const fileInput = "shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50 file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100";
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
                
                {/* Mode Toggle Switch */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                        type="button"
                        onClick={() => { setRegMode('new'); setSuccess(null); setError(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${regMode === 'new' ? 'bg-white shadow text-pink-600' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                        New Student
                    </button>
                    <button 
                        type="button"
                        onClick={() => { setRegMode('returning'); setSuccess(null); setError(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${regMode === 'returning' ? 'bg-white shadow text-pink-600' : 'text-gray-500 hover:text-gray-800'}`}
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
                            ? `${success.fullName} is now enrolled in ${success.gradeLevelName}.`
                            : "Write down these credentials. The parent/student will need them to login."}
                    </p>
                    
                    <div className="inline-block bg-white border-2 border-dashed border-green-400 p-6 rounded-lg text-left shadow-sm">
                        <p className="mb-2"><span className="text-gray-500 font-bold uppercase text-xs">Student Name:</span> <br/><span className="text-xl font-bold">{success.fullName}</span></p>
                        <p className="mb-2"><span className="text-gray-500 font-bold uppercase text-xs">Student ID:</span> <br/><span className="text-2xl font-mono font-black text-blue-700">{success.studentId}</span></p>
                        {!success.isReRegistration && (
                            <p><span className="text-gray-500 font-bold uppercase text-xs">Initial Password:</span> <br/><span className="text-2xl font-mono font-black text-red-600 tracking-wider">{success.initialPassword}</span></p>
                        )}
                        {success.isReRegistration && (
                            <p><span className="text-gray-500 font-bold uppercase text-xs">New Grade:</span> <br/><span className="text-2xl font-bold text-pink-600">{success.gradeLevelName}</span></p>
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
                            <p>You need to be online to access the database and register students.</p>
                        </div>
                    )}

                    {/* --- MODE: RETURNING STUDENT FLOW --- */}
                    {regMode === 'returning' && (
                        <div className="max-w-2xl mx-auto py-4">
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm">
                                
                                {/* Search Type Selector Tabs */}
                                <div className="flex border-b border-blue-200 mb-4 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => { setSearchType('id'); setFoundStudent(null); setSearchName(''); }}
                                        className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                                            searchType === 'id' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500'
                                        }`}
                                    >
                                        Search by ID
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setSearchType('name'); setFoundStudent(null); setSearchId(''); }}
                                        className={`pb-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                                            searchType === 'name' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500'
                                        }`}
                                    >
                                        Search by Name
                                    </button>
                                </div>

                                <label className={inputLabel}>
                                    {searchType === 'id' ? 'Step 1: Search by Student ID' : 'Step 1: Type Student Name'}
                                </label>

                                {searchType === 'id' ? (
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            className={textInput} 
                                            placeholder="e.g. FKS-2018-001" 
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
                                ) : (
                                    <div className="relative w-full">
                                        <input 
                                            type="text" 
                                            className={textInput} 
                                            placeholder="Type student name to search..." 
                                            value={searchName}
                                            onChange={(e) => setSearchName(e.target.value)}
                                        />
                                        {nameResults.length > 0 && (
                                            <ul className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 divide-y divide-gray-100 max-h-60 overflow-y-auto">
                                                {nameResults.map(s => (
                                                    <li 
                                                        key={s._id}
                                                        onClick={() => handleSelectStudent(s)}
                                                        className="px-4 py-2.5 hover:bg-pink-50 cursor-pointer text-sm flex justify-between items-center transition-colors"
                                                    >
                                                        <span className="font-bold text-gray-800">{s.fullName}</span>
                                                        <span className="text-xs text-gray-500 font-mono">{s.studentId} ({getGradeName(s.gradeLevel)})</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>

                            {foundStudent && (
                                <div className="mt-8 p-6 bg-white border-2 border-green-500 rounded-xl shadow-lg animate-fade-in">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-xs font-bold text-green-600 uppercase">Student Selected</p>
                                            <h3 className="text-2xl font-black text-gray-800">{foundStudent.fullName}</h3>
                                            <p className="text-gray-600 italic">Currently in: {foundStudent.currentGrade} ({foundStudent.studentId})</p>
                                        </div>
                                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                                            Verified
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                                        {/* Step 2: Dynamic GradeLevel Select Dropdown */}
                                        <div>
                                            <label className={inputLabel}>Step 2: Assign New Grade Level</label>
                                            <select
                                                value={newGradeLevel}
                                                onChange={(e) => setNewGradeLevel(e.target.value)}
                                                className={textInput}
                                                required
                                            >
                                                <option value="">-- Select New Grade Level --</option>
                                                {availableGrades.map(g => (
                                                    <option key={g._id} value={g._id}>{g.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Step 3: Academic Year */}
                                        <div>
                                            <label className={inputLabel}>Step 3: Assign New Academic Year</label> 
                                            <input
                                                type='text'
                                                className={textInput} 
                                                value={year}
                                                placeholder="e.g. 2019"   
                                                onChange={(e) => setYear(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <button 
                                            onClick={handleSubmit}
                                            disabled={loading || !newGradeLevel}
                                            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg shadow-lg transition-all transform hover:scale-[1.01]"
                                        >
                                            {loading ? 'Processing...' : `Promote ${foundStudent.fullName.split(' ')[0]}`}
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
                                {/* Full Name */}
                                <div>
                                    <label htmlFor="fullName" className={inputLabel}>{t('full_name')}</label>
                                    <input id="fullName" type="text" name="fullName" value={studentData.fullName} onChange={handleChange} className={textInput} placeholder="e.g. Abebe Kebede" required />
                                </div>
                                
                                {/* Dynamic Grade Level Selector */}
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
                                    <label htmlFor="year" className={inputLabel}>{t('academic_year') || "Academic Year"}</label>
                                    <input id="year" type="text" name="year" value={studentData.year} onChange={handleChange} className={textInput} placeholder="e.g. 2018" required />
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
                                    <input id="dateOfBirth" type="text" placeholder='yyyy-mm-dd' name="dateOfBirth" value={studentData.dateOfBirth} onChange={handleChange} className={textInput} />
                                </div>

                                {/* National ID Number text input */}
                                <div>
                                    <label htmlFor="nationalIdNumber" className={inputLabel}>
                                        🪪 {t('national_id_number') || 'National ID Number (Optional)'}
                                    </label>
                                    <input 
                                        id="nationalIdNumber" 
                                        type="text" 
                                        name="nationalIdNumber" 
                                        value={studentData.nationalIdNumber} 
                                        onChange={handleChange} 
                                        className={textInput} 
                                        placeholder="e.g. ID-89874" 
                                    />
                                </div>
                            </div>

                            {/* Family Information */}
                            <fieldset className="mt-8 border-t pt-6">
                                <legend className="text-lg font-bold text-gray-700 mb-4 uppercase tracking-wide">Family Information</legend>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="motherName" className={inputLabel}>{t('parent_name')} (Mother)</label>
                                        <input id="motherName" type="text" name="motherName" value={studentData.motherName} onChange={handleChange} className={textInput} required />
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

                            {/* Scanned Documents */}
                            <fieldset className="mt-8 border-t pt-6">
                                <legend className="text-lg font-bold text-gray-700 mb-4 uppercase tracking-wide">
                                    📂 {t('scanned_documents') || 'Scanned Documents (Optional)'}
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
                                    </div>

                                    {/* Report Card */}
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
                                    </div>

                                    {/* National ID Scanned File */}
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
                                    </div>
                                </div>
                            </fieldset>

                            {/* Health Status */}
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