// src/pages/UserManagementPage.js
import React,  { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import userService from '../services/userService';

const UserManagementPage = () => {
    // --- State Management ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await userService.getAll();
                // Sort users for consistent order, maybe admins first then by name
                const sortedUsers = response.data.sort((a, b) => {
                    if (a.role === 'admin' && b.role !== 'admin') return -1;
                    if (a.role !== 'admin' && b.role === 'admin') return 1;
                    return a.fullName.localeCompare(b.fullName);
                });
                setUsers(sortedUsers);
            } catch (err) {
                setError('Failed to fetch users. You may not be an authorized admin.');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // --- Style Strings ---
    const card = "bg-white p-6 rounded-lg shadow-md";
    const title = "text-2xl font-bold text-gray-800";
    const buttonPink = "bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200";
    const buttonGreen = "bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200";
    const tableHeader = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
    const tableCell = "px-6 py-4 whitespace-nowrap text-sm";
    
    if (loading) return <p className="text-center text-lg mt-8">Loading users...</p>;
    if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;

    return (
    <div className={card}>
        {/* --- Page Header (remains the same) --- */}
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
            <h2 className={title}>User Management</h2>
            <div className="flex gap-4">
                <Link to="/register" className={buttonPink}>+ Create Single User</Link>
                <Link to="/admin/users/import" className={buttonGreen}>↑ Import Users</Link>
            </div>
        </div>

        {/* --- Users Table (with the new column) --- */}
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className={tableHeader}>Full Name</th>
                        <th scope="col" className={tableHeader}>Username</th>
                        <th scope="col" className={tableHeader}>Role</th>
                        
                        {/* --- THIS IS THE NEW COLUMN HEADER --- */}
                        <th scope="col" className={tableHeader}>Assignments</th>
                        
                        <th scope="col" className={tableHeader}>Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(user => (
                        <tr key={user._id} className="hover:bg-gray-50">
                            <td className={`${tableCell} font-medium text-gray-900`}>{user.fullName}</td>
                            <td className={`${tableCell} text-gray-700`}>{user.username}</td>
                            <td className={`${tableCell} text-gray-500 capitalize`}>{user.role}</td>
                            
                            {/* --- THIS IS THE NEW CELL FOR ASSIGNMENTS --- */}
                            <td className={tableCell}>
                                {/* For Homeroom Teachers, display their assigned grade */}
                                {user.homeroomGrade && (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-pink-100 text-pink-800">
                                        Homeroom: {user.homeroomGrade}
                                    </span>
                                )}
                                {/* For all teachers, list their subjects */}
                                {user.subjectsTaught && user.subjectsTaught.length > 0 && (
                                    <ul className="list-disc list-inside text-gray-600 mt-1">
                                        {user.subjectsTaught.map(assignment => (
                                            // Ensure assignment.subject is not null before rendering
                                            assignment.subject && (
                                                <li key={assignment.subject._id}>
                                                    {assignment.subject.name} ({assignment.subject.gradeLevel})
                                                </li>
                                            )
                                        ))}
                                    </ul>
                                )}
                            </td>

                            <td className={tableCell}>
                                <Link to={`/admin/users/${user._id}`} className="text-pink-600 hover:text-pink-900 font-medium">
                                    Edit
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {users.length === 0 && !loading && <p className="text-center text-gray-500 mt-6">No users found.</p>}
    </div>
);
};

export default UserManagementPage;