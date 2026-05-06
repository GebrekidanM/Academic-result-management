import React, { useState, useEffect } from 'react';
import semesterService from '../services/semesterService';
import { useTranslation } from 'react-i18next';

const SemesterManagementPage = () => {
    const { t } = useTranslation();
    const [semesters, setSemesters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '' });
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSemesters();
    }, []);

    const fetchSemesters = async () => {
        try {
            const res = await semesterService.getSemesters();
            setSemesters(res.data.data);
        } catch (err) {
            console.error("Error fetching semesters:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            if (editingId) {
                await semesterService.updateSemester(editingId, formData);
                setMessage({ type: 'success', text: 'Semester updated successfully!' });
            } else {
                await semesterService.createSemester(formData);
                setMessage({ type: 'success', text: 'Semester created successfully!' });
            }
            setFormData({ name: '', startDate: '', endDate: '' });
            setEditingId(null);
            fetchSemesters();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Operation failed.' });
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (semester) => {
        setEditingId(semester._id);
        setFormData({
            name: semester.name,
            startDate: semester.startDate ? semester.startDate.split('T')[0] : '',
            endDate: semester.endDate ? semester.endDate.split('T')[0] : ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this semester?')) return;
        try {
            await semesterService.deleteSemester(id);
            setMessage({ type: 'success', text: 'Semester deleted successfully!' });
            fetchSemesters();
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to delete semester.' });
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">{t('loading')}</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h2 className="text-3xl font-black text-gray-800 mb-6 flex items-center gap-3">
                    🗓️ {t('manage_terms') || 'Manage Terms'}
                </h2>

                {message.text && (
                    <div className={`p-4 mb-6 rounded-xl border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">Term Name</label>
                        <input 
                            type="text" 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 outline-none transition-all font-bold"
                            placeholder="e.g. Term 1"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">Start Date</label>
                        <input 
                            type="date" 
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleChange}
                            className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">End Date</label>
                        <input 
                            type="date" 
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleChange}
                            className="w-full border-2 border-gray-100 p-3 rounded-xl focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="md:col-span-3">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {saving ? 'Processing...' : editingId ? 'Update Term' : 'Add New Term'}
                        </button>
                        {editingId && (
                            <button 
                                type="button"
                                onClick={() => { setEditingId(null); setFormData({ name: '', startDate: '', endDate: '' }); }}
                                className="w-full mt-2 text-gray-400 font-bold py-2 hover:text-gray-600 transition-all text-sm"
                            >
                                Cancel Edit
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Dates</th>
                            <th className="px-6 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {semesters.map((sem) => (
                            <tr key={sem._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-lg font-bold text-gray-700">{sem.name}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-gray-500 font-medium">
                                        {sem.startDate ? new Date(sem.startDate).toLocaleDateString() : 'N/A'} - {sem.endDate ? new Date(sem.endDate).toLocaleDateString() : 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right space-x-3">
                                    <button 
                                        onClick={() => handleEdit(sem)}
                                        className="text-blue-500 hover:text-blue-700 font-black text-sm uppercase tracking-tighter"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(sem._id)}
                                        className="text-red-400 hover:text-red-600 font-black text-sm uppercase tracking-tighter"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {semesters.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-6 py-12 text-center text-gray-400 font-medium italic">
                                    No terms found. Add your first one above!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SemesterManagementPage;
