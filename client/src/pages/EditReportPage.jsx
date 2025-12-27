import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import Hook
import behavioralReportService from '../services/behavioralReportService';

const EditReportPage = () => {
    const { t } = useTranslation(); // <--- Initialize
    const { reportId } = useParams();
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // --- State Management ---
    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

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

    // --- Data Fetching ---
    useEffect(() => {
        const fetchReport = async () => {
            try {
                const response = await behavioralReportService.getReportById(reportId);
                setReportData(response.data.data);
            } catch (err) {
                setError(t('error') || 'Failed to load report.');
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [reportId, t]);

    // --- Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setReportData({ ...reportData, [name]: value });
    };
    
    const handleEvaluationChange = (index, value) => {
        const newEvaluations = [...reportData.evaluations];
        newEvaluations[index].result = value;
        setReportData({ ...reportData, evaluations: newEvaluations });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isOnline) {
            alert(t('offline_warning') || "You are offline.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await behavioralReportService.updateReport(reportId, reportData);
            alert(t('success_save') || 'Report updated successfully!');
            navigate(`/students/${reportData.student}`);
        } catch (err) {
            setError(t('error') || 'Failed to update report.');
        } finally {
            setLoading(false);
        }
    };

    // --- Render Logic ---
    if (loading) return <p className="text-center text-lg mt-8">{t('loading')}</p>;
    if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;
    if (!reportData) return null;

    // --- Tailwind CSS ---
    const selectInput = "shadow border rounded-lg w-full py-2 px-3 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500";
    const textInput = "shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500";
    const textAreaInput = `${textInput} h-32 resize-y`;
    const submitButton = `w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading || !isOnline ? 'opacity-50 cursor-not-allowed' : ''}`;

    return (
        <div className="bg-white p-8 rounded-xl shadow-md max-w-4xl mx-auto">
            
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{t('edit')} {t('behavioral_traits')}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {reportData.semester} | {reportData.academicYear}
                    </p>
                </div>
                <Link to={`/students/${reportData.student}`} className="text-blue-600 hover:underline font-bold text-sm">
                    &larr; {t('back')}
                </Link>
            </div>

            {!isOnline && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
                    <p className="font-bold">⚠️ {t('offline_mode')}</p>
                    <p className="text-sm">You must be online to update behavioral reports.</p>
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* --- Left Column: Evaluation Traits --- */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2 uppercase tracking-wide">
                            {t('behavioral_traits')}
                        </h3>
                        <div className="space-y-4">
                            {reportData.evaluations.map((evaluation, index) => (
                                <div key={index} className="flex justify-between items-center">
                                    <label className="font-medium text-gray-700 text-sm">{evaluation.area}</label>
                                    <div className="w-1/2">
                                        <select 
                                            value={evaluation.result} 
                                            onChange={(e) => handleEvaluationChange(index, e.target.value)} 
                                            className={selectInput}
                                        >
                                            <option value="E">Excellent (E)</option>
                                            <option value="VG">Very Good (VG)</option>
                                            <option value="G">Good (G)</option>
                                            <option value="NI">Needs Imp. (NI)</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- Right Column: Comments --- */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-700 mb-2">
                                {t('teacher_comment')}
                            </h3>
                            <textarea
                                id="teacherComment"
                                name="teacherComment"
                                value={reportData.teacherComment || ''}
                                onChange={handleChange}
                                className={textAreaInput}
                                placeholder="Enter observation..."
                            />
                        </div>
                        <div>
                             <h3 className="text-lg font-bold text-gray-700 mb-2">
                                {t('conduct')}
                             </h3>
                            <input
                                id="conduct"
                                type="text"
                                name="conduct"
                                value={reportData.conduct || ''}
                                onChange={handleChange}
                                className={textInput}
                                placeholder="e.g. A, B, Good"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <button type="submit" className={submitButton} disabled={loading || !isOnline}>
                        {loading ? t('loading') : t('update')}
                    </button>
                </div>
                
            </form>
        </div>
    );
};

export default EditReportPage;