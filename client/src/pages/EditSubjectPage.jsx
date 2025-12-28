import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import subjectService from '../services/subjectService';

const EditSubjectPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const [subjectData, setSubjectData] = useState({ name: '', code: '', gradeLevel: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // --- Monitor Online Status ---
    useEffect(() => {
        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    useEffect(() => {
        const fetchSubject = async () => {
            try {
                const response = await subjectService.getSubjectById(id);
                setSubjectData(response.data.data);
            } catch (err) {
                setError(t('error') || 'Failed to load subject data.');
            } finally {
                setLoading(false);
            }
        };
        fetchSubject();
    }, [id, t]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSubjectData({ ...subjectData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isOnline) {
            setError(t('offline_warning'));
            return;
        }

        setUpdating(true);
        setError(null);
        
        try {
            // Auto-capitalize Grade Level (Consistency)
            const formattedData = {
                ...subjectData,
                gradeLevel: subjectData.gradeLevel.replace(/\b\w/g, c => c.toUpperCase())
            };

            await subjectService.updateSubject(id, formattedData);
            alert(t('success_save') || 'Subject updated successfully!');
            navigate('/subjects');
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
            setUpdating(false);
        }
    };

    if (loading) return <p className="text-center text-lg mt-8">{t('loading')}</p>;
    
    // --- Tailwind CSS class strings ---
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const submitButton = `w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${updating || !isOnline ? 'opacity-50 cursor-not-allowed' : ''}`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto mt-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('edit')} {t('subject')}</h2>
            
            <Link to="/subjects" className="text-pink-500 hover:underline mb-6 block font-bold text-sm">
                ← {t('back')}
            </Link>

            {!isOnline && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded text-sm">
                    ⚠️ {t('offline_warning')}
                </div>
            )}

            {error && <p className="text-red-500 text-center mb-4 bg-red-50 p-2 rounded border border-red-200">{error}</p>}
            
            {subjectData && (
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
                                value={subjectData.code || ''} 
                                onChange={handleChange} 
                                className={textInput} 
                            />
                        </div>
                        
                        {/* Grade Level */}
                        <div>
                            <label htmlFor="gradeLevel" className={inputLabel}>{t('grade')}</label>
                            <input 
                                id="gradeLevel" 
                                type="text" 
                                name="gradeLevel" 
                                value={subjectData.gradeLevel} 
                                onChange={handleChange} 
                                className={textInput} 
                                required 
                            />
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <button type="submit" className={submitButton} disabled={updating || !isOnline}>
                            {updating ? t('loading') : t('update')}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default EditSubjectPage;