import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import studentService from '../services/studentService';

const EditStudentPage = () => {
    // Initial state is null until we fetch data
    const [studentData, setStudentData] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const { id } = useParams();
    const navigate = useNavigate();

    // Fetch the student's current data when the page loads
    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const response = await studentService.getStudentById(id);
                const student = response.data.data;
                // Format the date correctly for the date input field
                const formattedDate = new Date(student.dateOfBirth).toISOString().split('T')[0];
                setStudentData({ ...student, dateOfBirth: formattedDate });
            } catch (err) {
                setError('Failed to load student data.');
            }
        };
        fetchStudent();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setStudentData({ ...studentData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await studentService.updateStudent(id,studentData);

            setSuccess('Student updated successfully! Redirecting...');
            setTimeout(() => {
                navigate(`/students/${id}`); // Go back to the student's detail page
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update student.');
            setLoading(false);
        }
    };

    // --- Tailwind CSS class strings (reused for consistency) ---
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const submitButton = `w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;
    const successText = "text-green-600 text-center mt-4";
    const errorText = "text-red-500 text-center mt-4";

    // Show a loading message while student data is being fetched
    if (!studentData) {
        return <p className="text-center text-lg mt-8">Loading student data for editing...</p>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Student: {studentData.fullName}</h2>
            <Link to={`/students/${id}`} className="text-pink-500 hover:underline mb-6 block">
                ← Back to Student Details
            </Link>
            
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Student ID */}
                    <div>
                        <label htmlFor="studentId" className={inputLabel}>Student ID</label>
                        <input id="studentId" type="text" name="studentId" value={studentData.studentId} onChange={handleChange} className={textInput} required />
                    </div>

                    {/* Full Name */}
                    <div>
                        <label htmlFor="fullName" className={inputLabel}>Full Name</label>
                        <input id="fullName" type="text" name="fullName" value={studentData.fullName} onChange={handleChange} className={textInput} required />
                    </div>

                    {/* Date of Birth */}
                    <div>
                        <label htmlFor="dateOfBirth" className={inputLabel}>Date of Birth</label>
                        <input id="dateOfBirth" type="date" name="dateOfBirth" value={studentData.dateOfBirth} onChange={handleChange} className={textInput} required />
                    </div>

                    {/* Grade Level */}
                    <div>
                        <label htmlFor="gradeLevel" className={inputLabel}>Grade Level</label>
                        <input id="gradeLevel" type="text" name="gradeLevel" value={studentData.gradeLevel} onChange={handleChange} className={textInput} required />
                    </div>

                    {/* Gender */}
                    <div className="md:col-span-2">
                        <label htmlFor="gender" className={inputLabel}>Gender</label>
                        <select id="gender" name="gender" value={studentData.gender} onChange={handleChange} className={textInput}>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                </div>


                <div className="mt-8">
                    <button type="submit" className={submitButton} disabled={loading}>
                        {loading ? 'Updating Student...' : 'Update Student'}
                    </button>
                </div>

                {success && <p className={successText}>{success}</p>}
                {error && <p className={errorText}>{error}</p>}
            </form>
        </div>
    );
};

export default EditStudentPage;