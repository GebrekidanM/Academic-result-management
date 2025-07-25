// src/pages/UserEditPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import userService from '../services/userService';
import subjectService from '../services/subjectService';

const UserEditPage = () => {
    const { id: userId } = useParams();
    const navigate = useNavigate();

    // --- State Management ---
    const [user, setUser] = useState(null);
    const [allSubjects, setAllSubjects] = useState([]);
    const [assignedSubjects, setAssignedSubjects] = useState(new Set());
    const [isHomeroom, setIsHomeroom] = useState(false);
    const [homeroomGrade, setHomeroomGrade] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching (your logic is perfect) ---
    useEffect(() => {
        const loadData = async () => {
            try {
                const [userRes, subjectsRes] = await Promise.all([
                    userService.getById(userId),
                    subjectService.getAllSubjects()
                ]);
                const userData = userRes.data;
                setUser(userData);
                setAllSubjects(subjectsRes.data.data);
                setIsHomeroom(!!userData.homeroomGrade);
                setHomeroomGrade(userData.homeroomGrade || '');
                const assignedIds = new Set(userData.subjectsTaught.map(item => item.subject?._id).filter(Boolean));
                setAssignedSubjects(assignedIds);
            } catch (err) {
                setError('Failed to load user and subject data.');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [userId]);

    // --- Event Handlers (your logic is perfect) ---
    const handleCheckboxChange = (subjectId) => {
        const newAssignedSubjects = new Set(assignedSubjects);
        if (newAssignedSubjects.has(subjectId)) {
            newAssignedSubjects.delete(subjectId);
        } else {
            newAssignedSubjects.add(subjectId);
        }
        setAssignedSubjects(newAssignedSubjects);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const updatedSubjectsTaught = Array.from(assignedSubjects).map(id => ({ subject: id }));
        const updatePayload = {
            subjectsTaught: updatedSubjectsTaught,
            homeroomGrade: isHomeroom ? homeroomGrade : "" 
        };
        try {
            await userService.update(userId, updatePayload);
            alert('User updated successfully!');
            navigate('/admin/users');
        } catch (err) {
            if (err.response && err.response.data && err.response.data.message) {
                // If yes, we display that exact message to the admin.
                setError(err.response.data.message);
            } else {
                // Otherwise, we show a generic fallback message.
                setError('An unexpected error occurred. Failed to update user.');
            }
            console.error(err.message);
        }
    };

    if (loading) return <p className="text-center text-lg mt-8">Loading user for editing...</p>;
   

    // --- Tailwind CSS class strings ---
    const fieldset = "border border-gray-300 p-4 rounded-lg";
    const legend = "font-bold text-lg text-gray-700 px-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const submitButton = "w-full md:w-auto bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200";

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit User: {user?.fullName}</h2>
            <Link to="/admin/users" className="text-pink-500 hover:underline mb-6 block">
                ← Back to User List
            </Link>
            
            {user && !loading && (
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {/* --- Homeroom Teacher Assignment --- */}
                        <fieldset className={fieldset}>
                            <legend className={legend}>Homeroom Duties</legend>
                            <label className="flex items-center space-x-3 p-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                                    checked={isHomeroom}
                                    onChange={(e) => setIsHomeroom(e.target.checked)}
                                />
                                <span className="text-gray-700">Assign as Homeroom Teacher</span>
                            </label>
                            
                            {isHomeroom && (
                                <div className="mt-4 pl-8">
                                    <label htmlFor="homeroomGrade" className="block text-gray-700 text-sm font-bold mb-2">Homeroom Grade Level</label>
                                    <input 
                                        id="homeroomGrade"
                                        type="text"
                                        className={textInput}
                                        value={homeroomGrade}
                                        onChange={(e) => setHomeroomGrade(e.target.value)}
                                        placeholder="e.g., Grade 4"
                                        required
                                    />
                                </div>
                            )}
                        </fieldset>

                        {/* --- Subject Assignment Section --- */}
                        {user.role === 'teacher' && (
                             <fieldset className={fieldset}>
                                <legend className={legend}>Assign Subjects to Teach</legend>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-2">
                                    {allSubjects.map(subject => (
                                        <label key={subject._id} className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                                                checked={assignedSubjects.has(subject._id)}
                                                onChange={() => handleCheckboxChange(subject._id)}
                                            />
                                            <span className="text-gray-700">{subject.name} ({subject.gradeLevel})</span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        )}
                    </div>
                    
                    {error && <p className="text-red-500 mt-2">{error}</p>}
                    
                    <div className="mt-8 flex justify-end">
                        <button type="submit" className={submitButton}>Save Changes</button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default UserEditPage;