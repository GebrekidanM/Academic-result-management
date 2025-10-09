// src/pages/ImportStudentsPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import studentService from '../services/studentService';

const ImportStudentsPage = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            setError('Please select a file to upload.');
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await studentService.uploadStudents(selectedFile);
            setSuccess(response.data.message);
            setTimeout(() => {
                navigate('/students');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'File import failed. Please check the file format.');
        } finally {
            setLoading(false);
        }
    };

    // --- Tailwind CSS class strings ---
    const cardContainer = "bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto";
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const fileInput = "block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none";
    const submitButton = `w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;
    
    return (
        <div className={cardContainer}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Import Students from Excel/CSV</h2>
            <Link to="/students" className="text-pink-500 hover:underline mb-6 block">
                ← Back to Students List
            </Link>

            {/* --- Instructions --- */}
            <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg text-sm text-blue-800">
                <p><strong>Instructions:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Your file must be in .xlsx or .csv format. The first row must be the header.</li>
                    <li>
                        <strong>Required columns:</strong> 
                        <code className="bg-blue-100 p-1 rounded">Full Name</code>, 
                        <code className="bg-blue-100 p-1 rounded">Gender</code>, 
                        <code className="bg-blue-100 p-1 rounded">Date of Birth</code>, 
                        <code className="bg-blue-100 p-1 rounded">Grade Level</code>.
                    </li>
                    <li>
                        <strong>Optional columns:</strong> 
                        <code className="bg-blue-100 p-1 rounded">Parent Name</code>, 
                        <code className="bg-blue-100 p-1 rounded">Parent Phone</code>, 
                        <code className="bg-blue-100 p-1 rounded">Health Status</code>.
                    </li>
                    <li>The system will automatically generate a unique Student ID and an initial password for each student.</li>
                    <li>
                        <a href="/student-template.xlsx" download className="font-bold text-blue-600 hover:underline">
                            Download the Correct Template File
                        </a>
                    </li>
                </ul>
            </div>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="studentsFile" className={inputLabel}>Select File</label>
                    <input 
                        id="studentsFile"
                        type="file"
                        onChange={handleFileChange}
                        className={fileInput}
                        accept=".xlsx, .csv"
                    />
                </div>
                
                <div className="mt-8">
                    <button type="submit" className={submitButton} disabled={loading}>
                        {loading ? 'Importing...' : 'Upload and Import Students'}
                    </button>
                </div>

                {success && <p className="text-green-600 text-center mt-4">{success}</p>}
                {error && <p className="text-red-500 text-center mt-4">{error}</p>}
            </form>
        </div>
    );
};

export default ImportStudentsPage;