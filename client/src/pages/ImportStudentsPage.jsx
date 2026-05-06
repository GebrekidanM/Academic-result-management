// src/pages/ImportStudentsPage.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import studentService from '../services/studentService';

const ImportStudentsPage = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
        setResult(null);
        setError(null);
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
            const response = await studentService.uploadStudents(selectedFile);
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'File import failed. Please check the file format.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Import Students from Excel</h2>
            <Link to="/students" className="text-pink-500 hover:underline mb-6 block">← Back to Students List</Link>

            {/* Instructions */}
            <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg text-sm text-blue-800">
                <p><strong>Instructions:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>File must be <strong>.xlsx</strong> format. First row must be the header.</li>
                    <li>
                        <strong>Name columns (any one):</strong>{' '}
                        <code className="bg-blue-100 px-1 rounded">Full Name</code> or{' '}
                        <code className="bg-blue-100 px-1 rounded">First Name</code> +{' '}
                        <code className="bg-blue-100 px-1 rounded">Last Name</code> (+{' '}
                        <code className="bg-blue-100 px-1 rounded">Middle Name</code> optional)
                    </li>
                    <li>
                        <strong>Class column:</strong>{' '}
                        <code className="bg-blue-100 px-1 rounded">Class</code> — supports values like{' '}
                        <code className="bg-blue-100 px-1 rounded">P7</code>,{' '}
                        <code className="bg-blue-100 px-1 rounded">P.7</code>, or{' '}
                        <code className="bg-blue-100 px-1 rounded">P.7 S</code> (stream embedded)
                    </li>
                    <li>
                        <strong>Gender column:</strong>{' '}
                        <code className="bg-blue-100 px-1 rounded">Gender</code> or{' '}
                        <code className="bg-blue-100 px-1 rounded">Sex</code> — supports{' '}
                        <code className="bg-blue-100 px-1 rounded">male/female</code> or{' '}
                        <code className="bg-blue-100 px-1 rounded">M/F</code>
                    </li>
                    <li>
                        <strong>Optional:</strong>{' '}
                        <code className="bg-blue-100 px-1 rounded">Stream</code>,{' '}
                        <code className="bg-blue-100 px-1 rounded">Date of Birth</code>,{' '}
                        <code className="bg-blue-100 px-1 rounded">Mother Name</code>,{' '}
                        <code className="bg-blue-100 px-1 rounded">Mother Contact</code>
                    </li>
                    <li>If a student already exists, their <strong>stream will be updated</strong> instead of creating a duplicate.</li>
                </ul>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
                <div>
                    <label htmlFor="studentsFile" className="block text-gray-700 text-sm font-bold mb-2">
                        Select Excel File (.xlsx)
                    </label>
                    <input
                        id="studentsFile"
                        type="file"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 p-2"
                        accept=".xlsx"
                    />
                    {selectedFile && (
                        <p className="text-xs text-gray-500 mt-1">Selected: {selectedFile.name}</p>
                    )}
                </div>

                <div className="mt-6">
                    <button
                        type="submit"
                        className={`w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={loading}
                    >
                        {loading ? '⏳ Importing...' : '📤 Upload and Import Students'}
                    </button>
                </div>
            </form>

            {/* Error */}
            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    ❌ {error}
                </div>
            )}

            {/* Results Summary */}
            {result && (
                <div className="mt-6">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                        <p className="font-bold text-green-800 mb-2">✅ Import Complete!</p>
                        <div className="flex gap-6 text-sm">
                            <span className="text-green-700">✨ Created: <strong>{result.summary?.created || 0}</strong></span>
                            <span className="text-blue-700">🔄 Updated: <strong>{result.summary?.updated || 0}</strong></span>
                            <span className="text-yellow-700">⏭ Skipped: <strong>{result.summary?.skipped || 0}</strong></span>
                            <span className="text-red-700">❌ Errors: <strong>{result.summary?.errors || 0}</strong></span>
                        </div>
                    </div>

                    {/* Error rows */}
                    {result.results?.filter(r => r.status === 'error').length > 0 && (
                        <div className="mt-4">
                            <p className="font-semibold text-red-700 mb-2">Rows with errors:</p>
                            <div className="max-h-60 overflow-y-auto border rounded-lg">
                                <table className="w-full text-xs">
                                    <thead className="bg-red-50">
                                        <tr>
                                            <th className="p-2 text-left">Row</th>
                                            <th className="p-2 text-left">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.results.filter(r => r.status === 'error').map((r, i) => (
                                            <tr key={i} className="border-t">
                                                <td className="p-2">{r.row}</td>
                                                <td className="p-2 text-red-600">{r.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="mt-4">
                        <Link to="/students" className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded">
                            View Students List →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportStudentsPage;