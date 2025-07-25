// src/pages/SubjectListPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import subjectService from '../services/subjectService';

const SubjectListPage = () => {
    // --- State Management ---
    const [searchTerm, setSearchTerm] = useState(''); // State for the search input
    const [searchedGrade, setSearchedGrade] = useState(''); // State to track the currently displayed grade
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // States for the "Add New" form
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectCode, setNewSubjectCode] = useState(''); // State for the new subject code

    // --- Event Handlers ---
    const handleSearch = async (e) => {
        // This allows us to call handleSearch without an event object to refresh the list
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        
        const gradeToSearch = e ? searchTerm : searchedGrade; // Use current search term or the last searched one
        if (!gradeToSearch) {
            setError('Please enter a grade level to search for.');
            return;
        }

        setLoading(true);
        setError(null);
        setSubjects([]);
        try {
            const response = await subjectService.getAllSubjects(gradeToSearch);
            setSubjects(response.data.data);
            if (!e) setSearchTerm(gradeToSearch); // Keep search term in sync if refreshing
            setSearchedGrade(gradeToSearch);
        } catch (err) {
            setError(`Failed to fetch subjects for "${gradeToSearch}".`);
        } finally {
            setLoading(false);
        }
    };
    
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const newSubjectData = {
                name: newSubjectName,
                code: newSubjectCode,
                gradeLevel: searchedGrade // The new subject belongs to the currently searched grade
            };
            await subjectService.createSubject(newSubjectData);
            setNewSubjectName('');
            setNewSubjectCode('');
            // Refresh the list after creation
            handleSearch(); 
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create subject.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this subject?')) {
            try {
                await subjectService.deleteSubject(id);
                // Refresh the list
                handleSearch();
            } catch (err) {
                setError('Failed to delete subject.');
            }
        }
    };
    
    // --- Tailwind CSS class strings ---
    const textInput = "shadow-sm border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const buttonPink = "bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200";
    const buttonGreen = "bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200";

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Subject Management</h2>

            {/* --- Search and Import Form --- */}
            <div className="p-4 bg-gray-50 rounded-lg border mb-6">
                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-4">
                    <div>
                        <label htmlFor="gradeSearch" className="font-bold text-gray-700 mr-2">Enter Grade Level:</label>
                        <input
                            id="gradeSearch"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="e.g., Grade 4 A"
                            className="shadow-sm border rounded-lg py-2 px-3 text-gray-700"
                            required
                        />
                    </div>
                    <button type="submit" className={buttonPink} disabled={loading}>
                        {loading ? 'Searching...' : 'Load Subjects'}
                    </button>
                    <Link to="/subjects/import" className={`${buttonGreen} ml-auto`}>
                        Import from Excel
                    </Link>
                </form>
            </div>

            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            {/* --- Results and Add Form Section --- */}
            {searchedGrade && !loading && (
                <div className="mt-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Subjects for "{searchedGrade}"</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: List of Subjects */}
                        <div>
                            <h4 className="font-bold text-gray-700 mb-2">Existing Subjects</h4>
                            {subjects.length > 0 ? (
                                <ul className="list-disc list-inside space-y-2">
                                    {subjects.map(sub => (
                                        <li key={sub._id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                            <span>{sub.name} {sub.code && `(${sub.code})`}</span>
                                            <button onClick={() => handleDelete(sub._id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500">No subjects found for this grade level yet.</p>
                            )}
                        </div>
                        {/* Right Column: Add New Subject Form */}
                        <div>
                             <form onSubmit={handleCreate} className="bg-gray-50 p-4 rounded-lg border">
                                <h4 className="font-bold text-gray-700 mb-2">Add New Subject to "{searchedGrade}"</h4>
                                <div>
                                    <label className="text-sm">Subject Name</label>
                                    <input 
                                        type="text"
                                        value={newSubjectName}
                                        onChange={(e) => setNewSubjectName(e.target.value)}
                                        placeholder="e.g., Integrated Science"
                                        className={textInput}
                                        required
                                    />
                                </div>
                                <div className="mt-4">
                                     <label className="text-sm">Subject Code (Optional)</label>
                                     <input 
                                        type="text"
                                        value={newSubjectCode}
                                        onChange={(e) => setNewSubjectCode(e.target.value)}
                                        placeholder="e.g., Sci-04"
                                        className={textInput}
                                    />
                                </div>
                                <button type="submit" className={`w-full mt-4 ${buttonGreen}`}>
                                    + Add Subject
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectListPage;