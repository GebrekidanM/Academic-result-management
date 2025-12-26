import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import Hook
import subjectService from '../services/subjectService';

const AddSubjectPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const [subjectData, setSubjectData] = useState({
        name: '',
        code: '',
        gradeLevel: ''
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

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

        setLoading(true);
        setError(null);
        
        try {
            // Auto-capitalize Grade Level (e.g. "grade 4" -> "Grade 4")
            const formattedData = {
                ...subjectData,
                gradeLevel: subjectData.gradeLevel.replace(/\b\w/g, c => c.toUpperCase())
            };

            await subjectService.createSubject(formattedData);
            alert('Subject created successfully!');
            navigate('/subjects');
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
            setLoading(false);
        }
    };

    // --- Tailwind CSS ---
    const inputLabel = "block text-gray-700 text-sm font-bold mb-2";
    const textInput = "shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const submitButton = `w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading || !isOnline ? 'opacity-50 cursor-not-allowed' : ''}`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto mt-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('add_subject')}</h2>
            
            <Link to="/subjects" className="text-pink-500 hover:underline mb-6 block font-bold text-sm">
                ← {t('back')}
            </Link>
            
            {!isOnline && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded text-sm">
                    ⚠️ {t('offline_warning')}
                </div>
            )}

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
                            placeholder="e.g., English" 
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
                            placeholder="e.g., ENG-04" 
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
                            placeholder="e.g., Grade 4A" 
                            required 
                        />
                    </div>
                </div>

                <div className="mt-8">
                    <button type="submit" className={submitButton} disabled={loading || !isOnline}>
                        {loading ? t('loading') : t('save')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddSubjectPage;