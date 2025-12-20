import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import userService from '../services/userService';

const UserManagementPage = () => {
    // --- State ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // --- Filter States ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterLevel, setFilterLevel] = useState('');

    // --- Data Fetching ---
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await userService.getAll();
                setUsers(response.data);
            } catch (err) {
                setError('Failed to fetch users.');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // --- Filtering Logic ---
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            // 1. Search (Name or Username)
            const searchMatch = 
                user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                user.username.toLowerCase().includes(searchTerm.toLowerCase());
            
            // 2. Role Filter
            const roleMatch = filterRole === '' || user.role === filterRole;

            // 3. Level Filter
            const levelMatch = filterLevel === '' || user.schoolLevel === filterLevel;

            return searchMatch && roleMatch && levelMatch;
        }).sort((a, b) => {
            // Sort Admins first, then by Name
            if (a.role === 'admin' && b.role !== 'admin') return -1;
            if (a.role !== 'admin' && b.role === 'admin') return 1;
            return a.fullName.localeCompare(b.fullName);
        });
    }, [users, searchTerm, filterRole, filterLevel]);

    // --- Helper: Role Colors ---
    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800 border-red-200';
            case 'staff': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'teacher': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // --- Helper: Level Colors ---
    const getLevelBadge = (level) => {
        switch (level) {
            case 'kg': return 'bg-pink-100 text-pink-800';
            case 'primary': return 'bg-teal-100 text-teal-800';
            case 'High School': return 'bg-indigo-100 text-indigo-800';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const handleDelete = async (user) => {
        if (window.confirm(`Are you sure you want to delete ${user.fullName}?`)) {
            try {
                await userService.deleteUser(user._id);
                setUsers(prev => prev.filter(u => u._id !== user._id));
            } catch (err) {
                alert('Delete failed.');
            }
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Loading Users...</div>;
    if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                
                {/* --- Header Section --- */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Total Users: <span className="font-bold text-black">{filteredUsers.length}</span> / {users.length}
                        </p>
                    </div>
                    <div className="flex gap-3 mt-4 md:mt-0">
                        <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors flex items-center gap-2">
                            <span>+</span> Add User
                        </Link>
                        <Link to="/admin/users/import" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors flex items-center gap-2">
                            <span>↑</span> Import Excel
                        </Link>
                    </div>
                </div>

                {/* --- Search & Filter Bar --- */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
                    
                    {/* Search Input */}
                    <div className="relative flex-grow">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Search by name or username..." 
                            className="w-full pl-10 pr-4 py-2  rounded-lg  focus:outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Role Filter */}
                    <select 
                        className="p-2 rounded-lg bg-gray-200 focus:outline-none"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        <option value="admin">Admins</option>
                        <option value="teacher">Teachers</option>
                        <option value="staff">Staff</option>
                    </select>

                    {/* Level Filter */}
                    <select 
                        className="p-2 rounded-lg bg-gray-200 focus:outline-none"
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                    >
                        <option value="">All Levels</option>
                        <option value="kg">Kindergarten</option>
                        <option value="primary">Primary</option>
                        <option value="High School">High School</option>
                    </select>
                </div>

                {/* --- Users Table --- */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role & Level</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Assignments</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredUsers.map(user => (
                                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                        
                                        {/* Name & Avatar */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                                                    {user.fullName.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <Link to={'/otherprofile'} state={{profileData:user}} className="text-sm font-bold text-gray-900 hover:text-blue-600 hover:underline">
                                                        {user.fullName}
                                                    </Link>
                                                    <div className="text-xs text-gray-500">@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role & School Level */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1 items-start">
                                                <span className={`px-2 py-1 text-xs font-bold rounded-full border uppercase ${getRoleBadge(user.role)}`}>
                                                    {user.role}
                                                </span>
                                                {user.schoolLevel && (
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getLevelBadge(user.schoolLevel)}`}>
                                                        {user.schoolLevel}
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Assignments (Chips instead of list) */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {user.homeroomGrade && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                                        🏠 {user.homeroomGrade}
                                                    </span>
                                                )}
                                                {user.subjectsTaught?.map((assign, idx) => (
                                                    assign.subject && (
                                                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-300">
                                                            {assign.subject.name} ({assign.subject.gradeLevel})
                                                        </span>
                                                    )
                                                ))}
                                                {(!user.homeroomGrade && (!user.subjectsTaught || user.subjectsTaught.length === 0)) && (
                                                    <span className="text-xs text-gray-400 italic">No assignments</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link to={`/admin/users/${user._id}`} className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 transition-colors mr-2">
                                                Edit
                                            </Link>
                                            <button 
                                                onClick={() => handleDelete(user)}
                                                className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded hover:bg-red-100 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredUsers.length === 0 && (
                        <div className="p-10 text-center text-gray-500">
                            No users found matching your search filters.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserManagementPage;