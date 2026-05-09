import React, { useState, useEffect } from 'react';
import gradingScaleService from '../services/gradingScaleService';
import { useTranslation } from 'react-i18next';

const GradingScaleManagementPage = () => {
    const { t } = useTranslation();
    const [scales, setScales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [editingScale, setEditingScale] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        loadScales();
    }, []);

    const loadScales = async () => {
        try {
            const res = await gradingScaleService.getAllGradingScales();
            setScales(res.data.data);
        } catch (err) {
            console.error('Error loading grading scales:', err);
            setMessage({ type: 'error', text: 'Failed to load grading scales' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingScale({
            name: '',
            schoolLevel: 'primary',
            applicableClasses: ['P4', 'P5', 'P6', 'P7'],
            ranges: [
                { grade: '1', minScore: 90, maxScore: 100 },
                { grade: 'D2', minScore: 80, maxScore: 89 },
                { grade: 'C3', minScore: 70, maxScore: 79 },
                { grade: 'C4', minScore: 60, maxScore: 69 },
                { grade: 'C5', minScore: 50, maxScore: 59 },
                { grade: 'C6', minScore: 45, maxScore: 49 },
                { grade: 'P7', minScore: 40, maxScore: 44 },
                { grade: 'P8', minScore: 35, maxScore: 39 },
                { grade: 'F9', minScore: 0, maxScore: 34 }
            ],
            isActive: false
        });
        setShowModal(true);
    };

    const handleEdit = (scale) => {
        setEditingScale({ ...scale });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this grading scale?')) return;
        try {
            await gradingScaleService.deleteGradingScale(id);
            setMessage({ type: 'success', text: 'Grading scale deleted successfully' });
            loadScales();
        } catch (err) {
            console.error('Error deleting grading scale:', err);
            setMessage({ type: 'error', text: 'Failed to delete grading scale' });
        }
    };

    const handleActivate = async (id) => {
        try {
            await gradingScaleService.activateGradingScale(id);
            setMessage({ type: 'success', text: 'Grading scale activated successfully' });
            loadScales();
        } catch (err) {
            console.error('Error activating grading scale:', err);
            setMessage({ type: 'error', text: 'Failed to activate grading scale' });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            if (editingScale._id) {
                await gradingScaleService.updateGradingScale(editingScale._id, editingScale);
            } else {
                await gradingScaleService.createGradingScale(editingScale);
            }
            setMessage({ type: 'success', text: 'Grading scale saved successfully' });
            setShowModal(false);
            loadScales();
        } catch (err) {
            console.error('Error saving grading scale:', err);
            setMessage({ type: 'error', text: 'Failed to save grading scale' });
        } finally {
            setSaving(false);
        }
    };

    const handleRangeChange = (index, field, value) => {
        const newRanges = [...editingScale.ranges];
        newRanges[index][field] = field === 'grade' ? value : Number(value);
        setEditingScale({ ...editingScale, ranges: newRanges });
    };

    const addRange = () => {
        setEditingScale({
            ...editingScale,
            ranges: [...editingScale.ranges, { grade: '', minScore: 0, maxScore: 0 }]
        });
    };

    const removeRange = (index) => {
        const newRanges = editingScale.ranges.filter((_, i) => i !== index);
        setEditingScale({ ...editingScale, ranges: newRanges });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">{t('loading')}</div>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">📊 Grading Scale Management</h2>
                <button
                    onClick={handleCreate}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all"
                >
                    + Create New Scale
                </button>
            </div>

            {message.text && (
                <div className={`p-4 mb-6 rounded-lg border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scales.map((scale) => (
                    <div key={scale._id} className={`bg-white rounded-xl shadow-lg p-6 border-2 ${scale.isActive ? 'border-green-500' : 'border-gray-200'}`}>
                        {scale.isActive && (
                            <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                                ✓ Active
                            </div>
                        )}
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{scale.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Level: {scale.schoolLevel} | Classes: {scale.applicableClasses.join(', ')}
                        </p>
                        
                        <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Ranges:</h4>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {scale.ranges.map((range, i) => (
                                    <div key={i} className="text-sm text-gray-600">
                                        {range.grade}: {range.minScore} - {range.maxScore}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {!scale.isActive && (
                                <button
                                    onClick={() => handleActivate(scale._id)}
                                    className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm"
                                >
                                    Activate
                                </button>
                            )}
                            <button
                                onClick={() => handleEdit(scale)}
                                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(scale._id)}
                                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h3 className="text-2xl font-bold text-gray-800">
                                {editingScale._id ? 'Edit Grading Scale' : 'Create Grading Scale'}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={editingScale.name}
                                    onChange={(e) => setEditingScale({ ...editingScale, name: e.target.value })}
                                    className="w-full border border-gray-300 p-3 rounded-lg"
                                    placeholder="e.g., Primary P4-P7"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">School Level</label>
                                <select
                                    value={editingScale.schoolLevel}
                                    onChange={(e) => setEditingScale({ ...editingScale, schoolLevel: e.target.value })}
                                    className="w-full border border-gray-300 p-3 rounded-lg bg-white"
                                >
                                    <option value="kg">KG</option>
                                    <option value="primary">Primary</option>
                                    <option value="High School">High School</option>
                                    <option value="all">All</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Applicable Classes (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={editingScale.applicableClasses.join(', ')}
                                    onChange={(e) => setEditingScale({ ...editingScale, applicableClasses: e.target.value.split(',').map(s => s.trim()) })}
                                    className="w-full border border-gray-300 p-3 rounded-lg"
                                    placeholder="e.g., P4, P5, P6, P7"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-sm font-semibold text-gray-700">Grade Ranges</label>
                                    <button
                                        onClick={addRange}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        + Add Range
                                    </button>
                                </div>
                                {editingScale.ranges.map((range, index) => (
                                    <div key={index} className="flex gap-2 items-center mb-2">
                                        <input
                                            type="text"
                                            value={range.grade}
                                            onChange={(e) => handleRangeChange(index, 'grade', e.target.value)}
                                            placeholder="Grade"
                                            className="w-24 border border-gray-300 p-2 rounded"
                                        />
                                        <input
                                            type="number"
                                            value={range.minScore}
                                            onChange={(e) => handleRangeChange(index, 'minScore', e.target.value)}
                                            placeholder="Min"
                                            className="w-24 border border-gray-300 p-2 rounded"
                                        />
                                        <span className="text-gray-500">-</span>
                                        <input
                                            type="number"
                                            value={range.maxScore}
                                            onChange={(e) => handleRangeChange(index, 'maxScore', e.target.value)}
                                            placeholder="Max"
                                            className="w-24 border border-gray-300 p-2 rounded"
                                        />
                                        <button
                                            onClick={() => removeRange(index)}
                                            className="text-red-600 hover:text-red-800 px-2"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t flex gap-3 justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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

export default GradingScaleManagementPage;
