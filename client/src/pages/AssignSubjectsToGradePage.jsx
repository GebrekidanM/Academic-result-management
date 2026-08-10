// src/pages/AssignSubjectsToGradePage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gradeLevelService from '@shared/services/gradeLevelService';
import subjectService from '@shared/services/subjectService';

const AssignSubjectsToGradePage = () => {
    const { t } = useTranslation();

    const [gradeLevels, setGradeLevels] = useState([]);
    const [allSubjects, setAllSubjects] = useState([]);
    const [selectedGradeId, setSelectedGradeId] = useState('');

    const [assignedSubjectsMap, setAssignedSubjectsMap] = useState(new Map());
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // 1. Fetch initial Grade Levels and Master Subjects
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [gradeRes, subjectRes] = await Promise.all([
                    gradeLevelService.getAllGradeLevels(),
                    subjectService.getSubjects()
                ]);

                const grades = gradeRes.data?.data || gradeRes.data || [];
                const subjects = subjectRes.data?.data || subjectRes.data || [];

                setGradeLevels(grades.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));
                setAllSubjects(subjects.sort((a, b) => a.name.localeCompare(b.name)));

                if (grades.length > 0) {
                    setSelectedGradeId(grades[0]._id);
                }
            } catch (err) {
                console.error("Error loading data:", err);
                setMessage({ type: 'error', text: t('error') });
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [t]);

    // 2. When selected grade level changes, populate currently assigned subjects
    useEffect(() => {
        if (!selectedGradeId || allSubjects.length === 0) return;

        const newMap = new Map();

        allSubjects.forEach(subject => {
            if (Array.isArray(subject.gradeLevels)) {
                const link = subject.gradeLevels.find(g => {
                    const gId = g.gradeLevel?._id || g.gradeLevel;
                    return gId && gId.toString() === selectedGradeId.toString();
                });

                if (link) {
                    newMap.set(subject._id.toString(), {
                        sessionsPerWeek: link.sessionsPerWeek || 3
                    });
                }
            }
        });

        setAssignedSubjectsMap(newMap);
    }, [selectedGradeId, allSubjects]);

    // Toggle subject selection
    const handleToggleSubject = (subjectId) => {
        setAssignedSubjectsMap(prev => {
            const nextMap = new Map(prev);
            if (nextMap.has(subjectId)) {
                nextMap.delete(subjectId);
            } else {
                nextMap.set(subjectId, { sessionsPerWeek: 3 });
            }
            return nextMap;
        });
    };

    // Update sessions per week
    const handleSessionsChange = (subjectId, value) => {
        const sessions = Math.max(1, Math.min(10, Number(value) || 3));
        setAssignedSubjectsMap(prev => {
            const nextMap = new Map(prev);
            if (nextMap.has(subjectId)) {
                nextMap.set(subjectId, { ...nextMap.get(subjectId), sessionsPerWeek: sessions });
            }
            return nextMap;
        });
    };

    // Submit payload
    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedGradeId) return;

        setSaving(true);
        setMessage(null);

        try {
            const subjectsPayload = Array.from(assignedSubjectsMap.entries()).map(([subId, config]) => ({
                subjectId: subId,
                sessionsPerWeek: config.sessionsPerWeek
            }));

            const payload = {
                gradeLevelId: selectedGradeId,
                subjects: subjectsPayload
            };

            await subjectService.assignSubjectsToGrade(payload);
            setMessage({ type: 'success', text: t('success_save') || 'Subjects assigned successfully!' });

            // Refresh master subjects
            const subjectRes = await subjectService.getSubjects();
            setAllSubjects(subjectRes.data?.data || subjectRes.data || []);

        } catch (err) {
            console.error("Error saving subject assignments:", err);
            setMessage({ type: 'error', text: err.response?.data?.message || t('error') });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-600">{t('loading')}</div>;

    const activeGrade = gradeLevels.find(g => g._id === selectedGradeId);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto mt-6">
            <div className="flex justify-between items-center mb-6 pb-2 border-b">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Assign Subjects to Grade Level</h2>
                    <p className="text-xs text-gray-500">Configure curriculum subjects and weekly periods per class</p>
                </div>
                <Link to="/subjects" className="text-pink-500 hover:underline font-bold text-sm">
                    ← {t('back')}
                </Link>
            </div>

            {message && (
                <div className={`p-3 rounded-lg mb-6 text-sm font-semibold border ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave}>
                {/* 1. Grade Level Selector */}
                <div className="mb-6">
                    <label htmlFor="gradeSelect" className="block text-gray-700 text-sm font-bold mb-2 uppercase">
                        Select Target Class Level:
                    </label>
                    <select
                        id="gradeSelect"
                        value={selectedGradeId}
                        onChange={(e) => setSelectedGradeId(e.target.value)}
                        className="shadow border rounded-lg w-full py-3 px-4 text-gray-700 font-bold bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                        {gradeLevels.map(g => (
                            <option key={g._id} value={g._id}>
                                {g.name} ({g.schoolLevel.toUpperCase()})
                            </option>
                        ))}
                    </select>
                </div>

                {/* 2. Subjects Assignment Checklist */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-bold text-gray-700 uppercase">
                            Available Subjects ({allSubjects.length})
                        </label>
                        <span className="text-xs text-gray-500">
                            Assigned to <strong>{activeGrade?.name}</strong>: {assignedSubjectsMap.size} Subjects
                        </span>
                    </div>

                    <div className="border border-gray-300 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto bg-gray-50">
                        {allSubjects.length === 0 ? (
                            <div className="p-6 text-center text-sm text-gray-500">No subjects found in database. Create subjects first.</div>
                        ) : (
                            allSubjects.map(sub => {
                                const isChecked = assignedSubjectsMap.has(sub._id);
                                const config = assignedSubjectsMap.get(sub._id) || { sessionsPerWeek: 3 };

                                return (
                                    <div key={sub._id} className={`p-3 flex items-center justify-between transition-colors ${isChecked ? 'bg-pink-50/60' : 'hover:bg-gray-100'}`}>
                                        <label className="flex items-center space-x-3 cursor-pointer flex-1">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleToggleSubject(sub._id)}
                                                className="rounded text-pink-600 focus:ring-pink-500 h-5 w-5"
                                            />
                                            <div>
                                                <div className="font-bold text-gray-800 text-sm">{sub.name}</div>
                                                {sub.code && <div className="text-xs font-mono text-gray-400">{sub.code}</div>}
                                            </div>
                                        </label>

                                        {/* Sessions/Periods per week input */}
                                        {isChecked && (
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs font-semibold text-gray-600">Periods/Week:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={config.sessionsPerWeek}
                                                    onChange={(e) => handleSessionsChange(sub._id, e.target.value)}
                                                    className="w-16 border border-gray-300 rounded p-1 text-center text-sm font-bold bg-white focus:ring-2 focus:ring-pink-500 outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Save Button */}
                <button
                    type="submit"
                    disabled={saving || !selectedGradeId}
                    className={`w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg shadow transition-colors ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {saving ? t('loading') : `💾 Save Subject Assignments for ${activeGrade?.name || ''}`}
                </button>
            </form>
        </div>
    );
};

export default AssignSubjectsToGradePage;