// src/pages/AddSubjectPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
import subjectService from '@shared/services/subjectService';
import gradeLevelService from '@shared/services/gradeLevelService';

const AddSubjectPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [availableGrades, setAvailableGrades] = useState([]);
    const [subjectData, setSubjectData] = useState({
        name: '',
        code: '',
        selectedGrades: [], // Stores selected GradeLevel ObjectIDs
        sessionsPerWeek: 3
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch existing GradeLevel objects from backend on load
    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const res = await gradeLevelService.getAllGradeLevels();
                const grades = res.data?.data || res.data || [];
                setAvailableGrades(
                    grades.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
                );
            } catch (err) {
                console.error("Error fetching grade levels:", err);
            }
        };
        fetchGrades();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSubjectData({ ...subjectData, [name]: value });
    };

    // Toggle grade level checkboxes
    const handleGradeToggle = (gradeId) => {
        setSubjectData(prev => {
            const exists = prev.selectedGrades.includes(gradeId);
            const updated = exists 
                ? prev.selectedGrades.filter(id => id !== gradeId)
                : [...prev.selectedGrades, gradeId];
            return { ...prev, selectedGrades: updated };
        });
    };

    // Select/Deselect All Grade Levels
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
            setError(t('select_at_least_one_grade') || "Please select at least one grade level for this subject.");
            return;
        }

        setLoading(true);
        
        try {
            // Format payload to match Subject.js schema structure
            const payload = {
                name: subjectData.name.trim(),
                code: subjectData.code.trim(),
                gradeLevels: subjectData.selectedGrades.map(gradeId => ({
                    gradeLevel: gradeId,
                    sessionsPerWeek: Number(subjectData.sessionsPerWeek) || 3
                }))
            };

            await subjectService.createSubject(payload);
            alert(t('success_save') || 'Subject created successfully!');
            navigate('/subjects');
        } catch (err) {
            console.error("Subject creation error:", err);
            setError(err.response?.data?.message || t('error'));
        } finally {
            setLoading(false);
        }
    };

    // --- Tailwind CSS ---
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const submitButton = `w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto mt-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('add_subject')} (Academic)</h2>
            
            <Link to="/subjects" className="text-pink-500 hover:underline mb-6 block font-bold text-sm">
                ← {t('back')}
            </Link>

            {error && <p className="text-red-500 text-center mb-4 bg-red-50 p-2 rounded border border-red-200">{error}</p>}

            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    {/* Subject Name */}
                    <div>
                        <label htmlFor="name" className={inputLabel}>{t('subject_name')}</label>
                        <input 
                            id="name" 
                            type="text" 
                            name="name" 
                            value={subjectData.name} 
                            onChange={handleChange} 
                            className={textInput} 
                            placeholder="e.g., Mathematics" 
                            required 
                        />
                    </div>

                    {/* Subject Code */}
                    <div>
                        <label htmlFor="code" className={inputLabel}>{t('subject_code')} (Optional)</label>
                        <input 
                            id="code" 
                            type="text" 
                            name="code" 
                            value={subjectData.code} 
                            onChange={handleChange} 
                            className={textInput} 
                            placeholder="e.g., MATH-04" 
                        />
                    </div>

                    {/* Sessions Per Week */}
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

                    {/* Grade Level Selection (Checkboxes) */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className={inputLabel}>{t('assigned_classes')}</label>
                            <div className="space-x-2 text-xs">
                                <button 
                                    type="button" 
                                    onClick={() => handleSelectAll(true)} 
                                    className="text-pink-600 hover:underline font-bold"
                                >
                                    Select All
                                </button>
                                <span>|</span>
                                <button 
                                    type="button" 
                                    onClick={() => handleSelectAll(false)} 
                                    className="text-gray-500 hover:underline"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2 bg-gray-50">
                            {availableGrades.length === 0 ? (
                                <p className="text-xs text-gray-500">Loading grade levels...</p>
                            ) : (
                                availableGrades.map(g => (
                                    <label key={g._id} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                        <input 
                                            type="checkbox" 
                                            checked={subjectData.selectedGrades.includes(g._id)} 
                                            onChange={() => handleGradeToggle(g._id)} 
                                            className="rounded text-pink-600 focus:ring-pink-500 h-4 w-4"
                                        />
                                        <span>{g.name}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 bg-blue-50 p-3 rounded text-xs text-blue-800 border border-blue-100">
                    ℹ️ This form creates <strong>Academic Subjects</strong> (Numeric Grades). 
                    To create Descriptive subjects (Art, Sport), please use the <Link to="/supportive-subjects" className="underline font-bold">Supportive Subjects Page</Link>.
                </div>

                <div className="mt-8">
                    <button type="submit" className={submitButton} disabled={loading}>
                        {loading ? t('loading') : t('save')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddSubjectPage;