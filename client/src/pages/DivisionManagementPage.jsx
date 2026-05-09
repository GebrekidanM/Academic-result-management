import React, { useState, useEffect } from 'react';
import divisionService from '../services/divisionService';
import { useTranslation } from 'react-i18next';

const DivisionManagementPage = () => {
    const { t } = useTranslation();
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [editingDivision, setEditingDivision] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadDivisions();
    }, []);

    const loadDivisions = async () => {
        try {
            const res = await divisionService.getAllDivisions();
            setDivisions(res.data.data);
        } catch (err) {
            console.error('Error loading divisions:', err);
            setMessage({ type: 'error', text: 'Failed to load divisions' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingDivision({
            name: '',
            schoolLevel: 'primary',
            applicableClasses: ['P4', 'P5', 'P6', 'P7'],
            ranges: [
                { division: 'Div 1', minScore: 4, maxScore: 12 },
                { division: 'Div 2', minScore: 13, maxScore: 24 },
                { division: 'Div 3', minScore: 25, maxScore: 29 },
                { division: 'Div 4', minScore: 30, maxScore: 33 },
                { division: 'Div U', minScore: 34, maxScore: 36 }
            ],
            isActive: false
        });
        setShowModal(true);
    };

    const handleEdit = (division) => {
        setEditingDivision({ ...division });
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingDivision._id) {
                await divisionService.updateDivision(editingDivision._id, editingDivision);
                setMessage({ type: 'success', text: 'Division updated successfully' });
            } else {
                await divisionService.createDivision(editingDivision);
                setMessage({ type: 'success', text: 'Division created successfully' });
            }
            setShowModal(false);
            loadDivisions();
        } catch (err) {
            console.error('Error saving division:', err);
            setMessage({ type: 'error', text: 'Failed to save division' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this division?')) return;
        
        try {
            await divisionService.deleteDivision(id);
            setMessage({ type: 'success', text: 'Division deleted successfully' });
            loadDivisions();
        } catch (err) {
            console.error('Error deleting division:', err);
            setMessage({ type: 'error', text: 'Failed to delete division' });
        }
    };

    const handleActivate = async (id) => {
        try {
            await divisionService.activateDivision(id);
            setMessage({ type: 'success', text: 'Division activated successfully' });
            loadDivisions();
        } catch (err) {
            console.error('Error activating division:', err);
            setMessage({ type: 'error', text: 'Failed to activate division' });
        }
    };

    const updateRange = (index, field, value) => {
        const newRanges = [...editingDivision.ranges];
        newRanges[index][field] = value;
        setEditingDivision({ ...editingDivision, ranges: newRanges });
    };

    if (loading) return <div className="text-center mt-10">{t('loading')}</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Division Management</h1>
                <button
                    onClick={handleCreate}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Create Division
                </button>
            </div>

            {message.text && (
                <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                School Level
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Classes
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {divisions.map((division) => (
                            <tr key={division._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {division.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {division.schoolLevel}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {division.applicableClasses.join(', ')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        division.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {division.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(division)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleActivate(division._id)}
                                        className="text-green-600 hover:text-green-900 mr-3"
                                        disabled={division.isActive}
                                    >
                                        Activate
                                    </button>
                                    <button
                                        onClick={() => handleDelete(division._id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            {editingDivision._id ? 'Edit Division' : 'Create Division'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    value={editingDivision.name}
                                    onChange={(e) => setEditingDivision({ ...editingDivision, name: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">School Level</label>
                                <select
                                    value={editingDivision.schoolLevel}
                                    onChange={(e) => setEditingDivision({ ...editingDivision, schoolLevel: e.target.value })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                >
                                    <option value="kg">Kindergarten</option>
                                    <option value="primary">Primary</option>
                                    <option value="High School">High School</option>
                                    <option value="all">All</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Applicable Classes</label>
                                <input
                                    type="text"
                                    value={editingDivision.applicableClasses.join(', ')}
                                    onChange={(e) => setEditingDivision({ 
                                        ...editingDivision, 
                                        applicableClasses: e.target.value.split(',').map(c => c.trim()) 
                                    })}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                    placeholder="P1, P2, P3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Division Ranges</label>
                                <div className="space-y-2">
                                    {editingDivision.ranges.map((range, index) => (
                                        <div key={index} className="flex space-x-2 items-center">
                                            <input
                                                type="text"
                                                value={range.division}
                                                onChange={(e) => updateRange(index, 'division', e.target.value)}
                                                className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
                                                placeholder="Division"
                                            />
                                            <input
                                                type="number"
                                                value={range.minScore}
                                                onChange={(e) => updateRange(index, 'minScore', parseInt(e.target.value))}
                                                className="w-20 border border-gray-300 rounded-md shadow-sm p-2"
                                                placeholder="Min"
                                            />
                                            <input
                                                type="number"
                                                value={range.maxScore}
                                                onChange={(e) => updateRange(index, 'maxScore', parseInt(e.target.value))}
                                                className="w-20 border border-gray-300 rounded-md shadow-sm p-2"
                                                placeholder="Max"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DivisionManagementPage;
