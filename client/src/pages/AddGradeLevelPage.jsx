// src/pages/AddGradeLevelPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gradeLevelService from '@shared/services/gradeLevelService';

const AddGradeLevelPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        schoolLevel: 'primary',
        roomNumber: '',
        capacity: 40
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) {
            setError(t('class_name_required') || "Class name is required.");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                name: formData.name.trim(),
                schoolLevel: formData.schoolLevel,
                roomNumber: formData.roomNumber.trim(),
                capacity: Number(formData.capacity) || 40
            };

            await gradeLevelService.createGradeLevel(payload);
            alert(t('success_save') || 'Grade level created successfully!');
            navigate('/grade-levels');
        } catch (err) {
            console.error("Create grade level error:", err);
            setError(err.response?.data?.message || t('error'));
        } finally {
            setLoading(false);
        }
    };

    // Tailwind CSS styling matching AddSubjectPage
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const selectInput = "shadow border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight bg-white focus:outline-none focus:ring-2 focus:ring-pink-500";
    const submitButton = `w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto mt-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('add_grade_level') || 'Add New Grade Level / Class'}</h2>
            
            <Link to="/grade-levels" className="text-pink-500 hover:underline mb-6 block font-bold text-sm">
                ← {t('back')}
            </Link>

            {error && (
                <p className="text-red-500 text-center mb-4 bg-red-50 p-2 rounded border border-red-200">
                    {error}
                </p>
            )}

            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    {/* Class Name */}
                    <div>
                        <label htmlFor="name" className={inputLabel}>
                            {t('class_name') || 'Class Name'} <span className="text-red-500">*</span>
                        </label>
                        <input 
                            id="name" 
                            type="text" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            className={textInput} 
                            placeholder="e.g., Grade 1A or Kg 1B" 
                            required 
                        />
                    </div>

                    {/* School Level Category */}
                    <div>
                        <label htmlFor="schoolLevel" className={inputLabel}>
                            {t('school_level') || 'School Level Category'} <span className="text-red-500">*</span>
                        </label>
                        <select 
                            id="schoolLevel" 
                            name="schoolLevel" 
                            value={formData.schoolLevel} 
                            onChange={handleChange} 
                            className={selectInput}
                            required
                        >
                            <option value="kg">{t('section_kg') || 'KG / Kindergarten'}</option>
                            <option value="primary">{t('section_primary') || 'Primary School (Grades 1-8)'}</option>
                            <option value="high school">{t('section_high_school') || 'High School (Grades 9-12)'}</option>
                        </select>
                    </div>

                    {/* Room Number */}
                    <div>
                        <label htmlFor="roomNumber" className={inputLabel}>
                            {t('room_number') || 'Room Number'} ({t('optional') || 'Optional'})
                        </label>
                        <input 
                            id="roomNumber" 
                            type="text" 
                            name="roomNumber" 
                            value={formData.roomNumber} 
                            onChange={handleChange} 
                            className={textInput} 
                            placeholder="e.g., Room 102" 
                        />
                    </div>

                    {/* Capacity */}
                    <div>
                        <label htmlFor="capacity" className={inputLabel}>
                            {t('capacity') || 'Student Capacity'}
                        </label>
                        <input 
                            id="capacity" 
                            type="number" 
                            min="1" 
                            max="100" 
                            name="capacity" 
                            value={formData.capacity} 
                            onChange={handleChange} 
                            className={textInput} 
                            required 
                        />
                    </div>
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

export default AddGradeLevelPage;