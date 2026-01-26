import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
import subjectService from '../services/subjectService';


function formatGrade(input) {
  if (!input) return input;

  input = input.trim().toLowerCase();

  input = input.charAt(0).toUpperCase() + input.slice(1);

  input = input.replace(/(\d)([a-z])/g, (match, num, letter) => {
    return num + letter.toUpperCase();
  });

  return input;
}

const AddSubjectPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [subjectData, setSubjectData] = useState({
        name: '',
        code: '',
        gradeLevel: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSubjectData({ ...subjectData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const formattedData = {
                ...subjectData,
                gradeLevel: formatGrade(subjectData.gradeLevel)
            };


             await subjectService.createSubject(formattedData);
            alert(t('success_save') || 'Subject created successfully!');
            navigate('/subjects');
        } catch (err) {
            console.log(err);
            setError(err.response?.data?.message);
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