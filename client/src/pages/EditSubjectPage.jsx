// src/pages/EditSubjectPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
import subjectService from '@shared/services/subjectService';
import gradeLevelService from '@shared/services/gradeLevelService';

const EditSubjectPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams(); // Subject ID

    const [availableGrades, setAvailableGrades] = useState([]);
    const [subjectData, setSubjectData] = useState({
        name: '',
        code: '',
        selectedGrades: [],
        sessionsPerWeek: 3
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [gradeRes, subjectRes] = await Promise.all([
                    gradeLevelService.getAllGradeLevels(),
                    subjectService.getSubjectById(id)
                ]);

                const grades = gradeRes.data?.data || gradeRes.data || [];
                const subject = subjectRes.data?.data || subjectRes.data;

                setAvailableGrades(
                    grades.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
                );

                if (subject) {
                    // Extract checked GradeLevel ObjectIDs
                    const selected = Array.isArray(subject.gradeLevels) 
                        ? subject.gradeLevels.map(g => (typeof g.gradeLevel === 'object' ? g.gradeLevel?._id : g.gradeLevel)).filter(Boolean)
                        : [];

                    const sessions = Array.isArray(subject.gradeLevels) && subject.gradeLevels.length > 0 
                        ? subject.gradeLevels[0].sessionsPerWeek 
                        : 3;

                    setSubjectData({
                        name: subject.name || '',
                        code: subject.code || '',
                        selectedGrades: selected,
                        sessionsPerWeek: sessions || 3
                    });
                }
            } catch (err) {
                console.error("Error loading subject data:", err);
                setError(err.response?.data?.message || t('error'));
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [id, t]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSubjectData({ ...subjectData, [name]: value });
    };

    const handleGradeToggle = (gradeId) => {
        setSubjectData(prev => {
            const exists = prev.selectedGrades.includes(gradeId);
            const updated = exists 
                ? prev.selectedGrades.filter(gId => gId !== gradeId)
                : [...prev.selectedGrades, gradeId];
            return { ...prev, selectedGrades: updated };
        });
    };

    const handleSelectAll = (selectAll) => {
        setSubjectData(prev => ({
            ...prev,
            selectedGrades: selectAll ? availableGrades.map(g => g._id) : []
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (subjectData.selectedGrades.length === 0) {
            setError(t('select_at_least_one_grade') || "Please select at least one grade level.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                name: subjectData.name.trim(),
                code: subjectData.code.trim(),
                gradeLevels: subjectData.selectedGrades.map(gradeId => ({
                    gradeLevel: gradeId,
                    sessionsPerWeek: Number(subjectData.sessionsPerWeek) || 3
                }))
            };

            await subjectService.updateSubject(id, payload);
            alert(t('success_save') || 'Subject updated successfully!');
            navigate('/subjects');
        } catch (err) {
            console.error("Update subject error:", err);
            setError(err.response?.data?.message || t('error'));
        } finally {
            setSaving(false);
        }
    };

    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const submitButton = `w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`;

    if (loading) return <div className="p-10 text-center text-gray-600">{t('loading')}</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto mt-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('edit_subject') || 'Edit Subject'}</h2>
            
            <Link to="/subjects" className="text-pink-500 hover:underline mb-6 block font-bold text-sm">
                ← {t('back')}
            </Link>

            {error && <p className="text-red-500 text-center mb-4 bg-red-50 p-2 rounded border border-red-200">{error}</p>}

            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name" className={inputLabel}>{t('subject_name')}</label>
                        <input 
                            id="name" 
                            type="text" 
                            name="name" 
                            value={subjectData.name} 
                            onChange={handleChange} 
                            className={textInput} 
                            required 
                        />
                    </div>

                    <div>
                        <label htmlFor="code" className={inputLabel}>{t('subject_code')}</label>
                        <input 
                            id="code" 
                            type="text" 
                            name="code" 
                            value={subjectData.code} 
                            onChange={handleChange} 
                            className={textInput} 
                        />
                    </div>

                    <div>
                        <label htmlFor="sessionsPerWeek" className={inputLabel}>Sessions Per Week (Periods)</label>
                        <input 
                            id="sessionsPerWeek" 
                            type="number" 
                            min="1" 
                            max="10" 
                            name="sessionsPerWeek" 
                            value={subjectData.sessionsPerWeek} 
                            onChange={handleChange} 
                            className={textInput} 
                            required 
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className={inputLabel}>{t('assigned_classes')}</label>
                            <div className="space-x-2 text-xs">
                                <button type="button" onClick={() => handleSelectAll(true)} className="text-pink-600 hover:underline font-bold">Select All</button>
                                <span>|</span>
                                <button type="button" onClick={() => handleSelectAll(false)} className="text-gray-500 hover:underline">Clear</button>
                            </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2 bg-gray-50">
                            {availableGrades.map(g => (
                                <label key={g._id} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                    <input 
                                        type="checkbox" 
                                        checked={subjectData.selectedGrades.includes(g._id)} 
                                        onChange={() => handleGradeToggle(g._id)} 
                                        className="rounded text-pink-600 focus:ring-pink-500 h-4 w-4"
                                    />
                                    <span>{g.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <button type="submit" className={submitButton} disabled={saving}>
                        {saving ? t('loading') : t('save')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditSubjectPage;