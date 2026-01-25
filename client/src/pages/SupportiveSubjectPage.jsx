import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import supportiveGradeService from '../services/supportiveGradeService';

const SupportiveSubjectPage = () => {
    const { t } = useTranslation();

    // --- STATE ---
    const [subjects, setSubjects] = useState([]);
    const [filterGrade, setFilterGrade] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [newName, setNewName] = useState('');
    const [targetGrade, setTargetGrade] = useState('');

    // --- FETCH ---
    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const res = await supportiveGradeService.getAll();
            setSubjects(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    // --- HANDLERS ---
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newName || !targetGrade) return;

        try {
            setLoading(true)
            await supportiveGradeService.create({ name: newName, gradeLevel: targetGrade });
            alert("Subject Created!");
            setNewName('');
            fetchSubjects(); // Refresh list
        } catch (err) {
            alert(err.response?.data?.message || "Error creating subject");
        }finally{
            setLoading(false)
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure? This will delete the subject from the grade.")) {
            try {
                await supportiveGradeService.delete(id);
                fetchSubjects();
            } catch (err) {
                alert("Error deleting");
            }
        }
    };

    // Filter displayed list
    const displayedSubjects = filterGrade 
        ? subjects.filter(s => s.gradeLevel === filterGrade) 
        : subjects;

    // Get unique grades for dropdowns
    const uniqueGrades = [...new Set(subjects.map(s => s.gradeLevel))].sort();

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Manage Co-Curricular Subjects</h1>
                <p className="text-gray-500 mb-8">Manage subjects like Art, Sport, and Handwriting that use Letter Grading (A, B, C).</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* LEFT: LIST */}
                    <div className="md:col-span-2">
                        {/* Filter Bar */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 flex gap-4 items-center">
                            <span className="font-bold text-gray-600">Filter by Class:</span>
                            <select 
                                className="border p-2 rounded w-48"
                                value={filterGrade}
                                onChange={(e) => setFilterGrade(e.target.value)}
                            >
                                <option value="">All Classes</option>
                                {uniqueGrades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                                    <tr>
                                        <th className="p-4">Subject Name</th>
                                        <th className="p-4">Grade Level</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {displayedSubjects.length > 0 ? (
                                        displayedSubjects.map(sub => (
                                            <tr key={sub._id} className="hover:bg-blue-50">
                                                <td className="p-4 font-bold text-gray-800">{sub.name}</td>
                                                <td className="p-4 text-gray-500">
                                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs border">{sub.gradeLevel}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button 
                                                        onClick={() => handleDelete(sub._id)}
                                                        className="text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 px-3 py-1 rounded"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="p-8 text-center text-gray-400">No subjects found. Add one!</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RIGHT: CREATE FORM */}
                    <div>
                        <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 sticky top-6">
                            <h3 className="text-xl font-bold text-blue-900 mb-4 border-b pb-2">Add New Subject</h3>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1">Subject Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Handwriting"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-600 mb-1">Target Grade</label>
                                    <input 
                                        type="text" 
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Grade 1A"
                                        value={targetGrade}
                                        onChange={e => setTargetGrade(e.target.value)}
                                        required
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition"
                                    {...loading ? disabled : ''}
                                >
                                    + Add Subject
                                </button>
                            </form>
                            
                            <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-xs text-yellow-800">
                                <strong>Note:</strong> Subjects added here use the 
                                <strong> Descriptive (Letter)</strong> grading system automatically. 
                                They will appear in the "Co-Curricular" section of the report card.
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SupportiveSubjectPage;