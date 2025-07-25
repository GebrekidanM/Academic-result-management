// src/pages/EditSubjectPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import subjectService from '../services/subjectService';

const EditSubjectPage = () => {
    const [subjectData, setSubjectData] = useState({ name: '', code: '', gradeLevel: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false); // For button loading state
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSubject = async () => {
            try {
                const response = await subjectService.getSubjectById(id);
                setSubjectData(response.data.data);
            } catch (err) {
                setError('Failed to load subject data.');
            } finally {
                setLoading(false);
            }
        };
        fetchSubject();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSubjectData({ ...subjectData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError(null);
        try {
            await subjectService.updateSubject(id, subjectData);
            alert('Subject updated successfully!');
            navigate('/subjects');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update subject.');
            setUpdating(false);
        }
    };

    if (loading) return <p className="text-center text-lg mt-8">Loading subject data...</p>;
    
    // --- Tailwind CSS class strings ---
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const submitButton = `w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${updating ? 'opacity-50 cursor-not-allowed' : ''}`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Edit Subject</h2>
            <Link to="/subjects" className="text-pink-500 hover:underline mb-6 block">
                ← Back to Subjects List
            </Link>

            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            
            {/* We only render the form if subjectData is not null */}
            {subjectData && (
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className={inputLabel}>Subject Name</label>
                            <input id="name" type="text" name="name" value={subjectData.name} onChange={handleChange} className={textInput} required />
                        </div>
                        <div>
                            <label htmlFor="code" className={inputLabel}>Subject Code (Optional)</label>
                            <input id="code" type="text" name="code" value={subjectData.code || ''} onChange={handleChange} className={textInput} />
                        </div>
                        <div>
                            <label htmlFor="gradeLevel" className={inputLabel}>Grade Level</label>
                            <input id="gradeLevel" type="text" name="gradeLevel" value={subjectData.gradeLevel} onChange={handleChange} className={textInput} required />
                        </div>
                    </div>
                    <div className="mt-8">
                        <button type="submit" className={submitButton} disabled={updating}>
                            {updating ? 'Updating...' : 'Update Subject'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default EditSubjectPage;