// src/pages/EditStudentPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import studentService from '../services/studentService';

const EditStudentPage = () => {
    const { id: studentId } = useParams();
    const navigate = useNavigate();

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
            .catch(() => setError('Failed to load student data.'))
            .finally(() => setLoading(false));
    }, [studentId]);

    // --- Handle input changes ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setStudentData(prev => ({ ...prev, [name]: value }));
    };

    // --- Photo upload ---
    const handlePhotoUpload = async (e) => {
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
        } catch (err) {
            console.error("Upload error:", err);
            setError('Photo upload failed. Please ensure it is a valid image file.');
        }
    };

    // --- Form submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await studentService.updateStudent(studentId, studentData);
            alert('Student profile updated successfully!');
            navigate('/students');
        } catch (err) {
            setError('Failed to update student profile.');
        }
    };

    if (loading) return <p className="text-center text-lg mt-8">Loading student profile...</p>;
    if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;

    // --- Tailwind CSS classes ---
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const textAreaInput = `${textInput} h-24 resize-y`;
    const submitButton = `w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Student Profile</h2>
            <Link to="/students" className="text-pink-500 hover:underline mb-6 block">← Back to Students List</Link>
            
            <form onSubmit={handleSubmit}>
                {/* Photo Upload */}
                <div className="flex flex-col items-center mb-6">
                    <img 
                        src={`${studentData.imageUrl}?key=${Date.now()}`} // cache-busting
                        alt={`${studentData.fullName}'s profile`} 
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 mb-4" 
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors">
                        Change Photo
                    </label>
                    <input id="photo-upload" type="file" onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                </div>

                {/* Main Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="fullName" className={inputLabel}>Full Name</label>
                        <input id="fullName" type="text" name="fullName" value={studentData.fullName} onChange={handleChange} className={textInput} required />
                    </div>
                    <div>
                        <label htmlFor="gradeLevel" className={inputLabel}>Grade Level</label>
                        <input id="gradeLevel" type="text" name="gradeLevel" value={studentData.gradeLevel} onChange={handleChange} className={textInput} required />
                    </div>
                    <div>
                        <label htmlFor="gender" className={inputLabel}>Gender</label>
                        <select id="gender" name="gender" value={studentData.gender} onChange={handleChange} className={textInput}>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="dateOfBirth" className={inputLabel}>Date of Birth</label>
                        <input id="dateOfBirth" type="date" name="dateOfBirth" value={studentData.dateOfBirth} onChange={handleChange} className={textInput} required />
                    </div>
                </div>

                {/* Parent / Guardian */}
                <fieldset className="mt-8 border-t pt-6">
                    <legend className="text-xl font-bold text-gray-700 mb-4">Parent / Guardian Details</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="motherName" className={inputLabel}>Mother's Name</label>
                            <input id="motherName" type="text" name="motherName" value={studentData.motherName} onChange={handleChange} className={textInput} />
                        </div>
                        <div>
                            <label htmlFor="motherContact" className={inputLabel}>Mother's Phone</label>
                            <input id="motherContact" type="tel" name="motherContact" value={studentData.motherContact} onChange={handleChange} className={textInput} />
                        </div>
                        <div>
                            <label htmlFor="fatherContact" className={inputLabel}>Father's Phone</label>
                            <input id="fatherContact" type="tel" name="fatherContact" value={studentData.fatherContact} onChange={handleChange} className={textInput} />
                        </div>
                    </div>
                </fieldset>

                {/* Health */}
                <fieldset className="mt-8 border-t pt-6">
                    <legend className="text-xl font-bold text-gray-700 mb-4">Health Information</legend>
                    <div>
                        <label htmlFor="healthStatus" className={inputLabel}>Health Status / Known Allergies</label>
                        <textarea id="healthStatus" name="healthStatus" value={studentData.healthStatus} onChange={handleChange} className={textAreaInput} />
                    </div>
                </fieldset>

                <div className="mt-8">
                    <button type="submit" className={submitButton}>Save Changes</button>
                </div>
                {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            </form>
        </div>
    );
};

export default EditStudentPage;
