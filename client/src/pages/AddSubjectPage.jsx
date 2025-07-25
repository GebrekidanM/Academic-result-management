import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import subjectService from '../services/subjectService';

const AddSubjectPage = () => {
    const [subjectData, setSubjectData] = useState({
        name: '',
        code: '',
        gradeLevel: ''
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false); // For button loading state
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSubjectData({ ...subjectData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await subjectService.createSubject(subjectData);
            alert('Subject created successfully!');
            navigate('/subjects');
        } catch (err)  {
            setError(err.response?.data?.message || 'Failed to create subject.');
            setLoading(false);
        }
    };

    // --- Tailwind CSS class strings (reused from EditSubjectPage for consistency) ---
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const submitButton = `w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Subject</h2>
            <Link to="/subjects" className="text-pink-500 hover:underline mb-6 block">
                ← Back to Subjects List
            </Link>
            
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className={inputLabel}>Subject Name</label>
                        <input id="name" type="text" name="name" value={subjectData.name} onChange={handleChange} className={textInput} placeholder="e.g., English" required />
                    </div>
                    <div>
                        <label htmlFor="code" className={inputLabel}>Subject Code (Optional)</label>
                        <input id="code" type="text" name="code" value={subjectData.code} onChange={handleChange} className={textInput} placeholder="e.g., ENG-04" />
                    </div>
                    <div>
                        <label htmlFor="gradeLevel" className={inputLabel}>Grade Level</label>
                        <input id="gradeLevel" type="text" name="gradeLevel" value={subjectData.gradeLevel} onChange={handleChange} className={textInput} placeholder="e.g., Grade 4" required />
                    </div>
                </div>
                <div className="mt-8">
                    <button type="submit" className={submitButton} disabled={loading}>
                        {loading ? 'Adding Subject...' : 'Add Subject'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddSubjectPage;