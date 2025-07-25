import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import userService from '../services/userService';

const ImportUsersPage = () => {
    // --- State Management ---
    const [selectedFile, setSelectedFile] = useState(null);
    const [result, setResult] = useState(null); // Will hold the full success response from the backend
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // --- Event Handlers ---
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
        setResult(null);
        try {
            // We'll add the 'uploadUsers' function to userService next
            const response = await userService.uploadUsers(selectedFile);
            setResult(response.data); // Store the success message and the user list
        } catch (err) {
            setError(err.response?.data?.message || 'File import failed. Please check the file format and content.');
        } finally {
            setLoading(false);
        }
    };

    // --- Reusable Tailwind CSS classes ---
    const cardContainer = "bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto";
    const fileInput = "block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none";
    const submitButton = `w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;
    const tableHeader = "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
    const tableCell = "px-4 py-2 whitespace-nowrap text-sm";
    
    return (
        <div className={cardContainer}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Import Users from Excel</h2>
            <Link to="/admin/users" className="text-pink-500 hover:underline mb-6 block">
                ← Back to User Management
            </Link>

            {/* --- Instructions Section --- */}
            <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg text-sm text-blue-800">
                <p><strong>Instructions:</strong></p>
                <ul className="list-disc list-inside mt-2">
                    <li>Your file must be in .xlsx or .csv format. The first row must be the header.</li>
                    <li>Required columns are: <strong>Full Name</strong> and <strong>Username</strong>.</li>
                    <li>Optional column: <strong>Role</strong>. If left blank, the role will default to 'teacher'. Valid roles are 'teacher' or 'admin'.</li>
                    <li>The system will automatically generate a secure, random initial password for each user.</li>
                    <li>
                        <a href="/user-template.xlsx" download className="font-bold text-blue-600 hover:underline">
                            Download Template File
                        </a>
                    </li>
                </ul>
            </div>

            {/* --- Conditional Rendering: Show results or the upload form --- */}
            {result ? (
                <div className="p-4 bg-green-50 border border-green-300 rounded-lg">
                    <h3 className="text-xl font-bold text-green-800">Import Successful!</h3>
                    <p className="mt-1 text-gray-700">{result.message}</p>
                    <p className="mt-2 text-sm text-red-600 font-bold">Please record these initial passwords. This is the only time they will be shown.</p>
                    <div className="overflow-x-auto mt-4">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className={tableHeader}>Full Name</th>
                                    <th className={tableHeader}>Username</th>
                                    <th className={tableHeader}>Role</th>
                                    <th className={tableHeader}>Initial Password</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {result.data.map(user => (
                                    <tr key={user.username}>
                                        <td className={`${tableCell} text-gray-900`}>{user.fullName}</td>
                                        <td className={`${tableCell} font-mono text-gray-700`}>{user.username}</td>
                                        <td className={`${tableCell} text-gray-500`}>{user.role}</td>
                                        <td className={`${tableCell} font-mono text-red-600`}>{user.initialPassword}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button onClick={() => navigate('/admin/users')} className="mt-6 bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg">
                        Back to User List
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="usersFile" className="block text-gray-700 text-sm font-bold mb-2">Select File</label>
                        <input 
                            id="usersFile"
                            type="file"
                            onChange={handleFileChange}
                            className={fileInput}
                            accept=".xlsx, .csv"
                        />
                    </div>
                    
                    <div className="mt-8">
                        <button type="submit" className={submitButton} disabled={loading}>
                            {loading ? 'Importing...' : 'Upload and Import Users'}
                        </button>
                    </div>

                    {error && <p className="text-red-500 text-center mt-4">{error}</p>}
                </form>
            )}
        </div>
    );
};

export default ImportUsersPage;