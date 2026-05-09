import React, { useState, useEffect } from 'react';
import configService from '../services/configService';
import semesterService from '../services/semesterService';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const SchoolSettingsPage = () => {
    const { t } = useTranslation();
    const [config, setConfig] = useState({
        currentAcademicYear: '',
        currentSemester: 'First Semester',
        schoolName: ''
    });
    const [semesters, setSemesters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [configRes, semestersRes] = await Promise.all([
                    configService.getConfig(),
                    semesterService.getSemesters()
                ]);
                
                if (configRes.data.data) {
                    setConfig(configRes.data.data);
                }
                setSemesters(semestersRes.data.data);
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const handleChange = (e) => {
        setConfig({ ...config, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await configService.updateConfig(config);
            setMessage({ type: 'success', text: t('success_save') || 'Settings updated successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update settings.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">{t('loading')}</div>;

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex justify-between items-center">
                <span>⚙️ {t('school_settings') || 'School Settings'}</span>
                <div className="flex gap-4">
                    <Link to="/admin/semesters" className="text-sm text-blue-500 hover:underline font-normal">Manage Semesters &rarr;</Link>
                    <Link to="/admin/grading-scales" className="text-sm text-blue-500 hover:underline font-normal">Manage Grading Scales &rarr;</Link>
                    <Link to="/admin/divisions" className="text-sm text-blue-500 hover:underline font-normal">Manage Divisions &rarr;</Link>
                </div>
            </h2>

            {message.text && (
                <div className={`p-4 mb-6 rounded-lg border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        🏫 {t('school_name') || 'School Name'}
                    </label>
                    <input 
                        type="text" 
                        name="schoolName"
                        value={config.schoolName}
                        onChange={handleChange}
                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Enter school name"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            📅 {t('active_term') || 'Active Term'}
                        </label>
                        {semesters.length > 0 ? (
                            <select 
                                name="currentSemester"
                                value={config.currentSemester}
                                onChange={handleChange}
                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                            >
                                {semesters.map(s => (
                                    <option key={s._id} value={s.name}>{s.name}</option>
                                ))}
                                <option value="custom">-- Custom (type below) --</option>
                            </select>
                        ) : (
                             <input 
                                type="text" 
                                name="currentSemester"
                                value={config.currentSemester}
                                onChange={handleChange}
                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="e.g. Term 1"
                            />
                        )}
                        
                        {(config.currentSemester === 'custom' || semesters.length === 0) && (
                            <input 
                                type="text" 
                                name="currentSemesterCustom"
                                onChange={(e) => setConfig({ ...config, currentSemester: e.target.value })}
                                className="w-full mt-2 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Type term name"
                            />
                        )}
                        
                        <p className="mt-1 text-xs text-gray-500">
                            This will be the default term for new reports and grades.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            🗓️ {t('active_academic_year') || 'Active Academic Year'}
                        </label>
                        <input 
                            type="text" 
                            name="currentAcademicYear"
                            value={config.currentAcademicYear}
                            onChange={handleChange}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="e.g. 2017"
                        />
                         <p className="mt-1 text-xs text-gray-500">
                            Current Ethiopian Academic Year.
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {saving ? t('saving') : '💾 ' + (t('save_settings') || 'Save Settings')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SchoolSettingsPage;
