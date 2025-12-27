import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import Hook
import gradeService from '../services/gradeService';
import assessmentTypeService from '../services/assessmentTypeService';
import offlineGradeService from '../services/offlineGradeService'; // <--- Import Offline Service

const EditGradePage = () => {
    const { t } = useTranslation(); // <--- Initialize
    const { gradeId } = useParams();
    const navigate = useNavigate();
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // --- State Management ---
    const [gradeData, setGradeData] = useState(null);
    const [assessmentTypes, setAssessmentTypes] = useState([]);
    const [scores, setScores] = useState({});
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        const loadGradeData = async () => {
            try {
                // 1. Fetch Grade Data
                const gradeRes = await gradeService.getGradeById(gradeId);
                const fetchedGrade = gradeRes.data.data;
                setGradeData(fetchedGrade);

                // 2. Fetch Assessment Types for this Subject
                const assessmentRes = await assessmentTypeService.getBySubject(fetchedGrade.subject._id);
                setAssessmentTypes(assessmentRes.data.data);

                // 3. Map existing scores
                const initialScores = {};
                assessmentRes.data.data.forEach(at => {
                    // Find score in the fetched grade object
                    const existingScore = fetchedGrade.assessments.find(a => a.assessmentType === at._id || a.assessmentType._id === at._id);
                    initialScores[at._id] = existingScore ? existingScore.score : '';
                });
                setScores(initialScores);

            } catch (err) {
                setError(t('error') || 'Failed to load grade data.');
            } finally {
                setLoading(false);
            }
        };
        loadGradeData();
    }, [gradeId, t]);

    // --- Data Processing ---
    const assessmentsByMonth = useMemo(() => {
        const grouped = {};
        assessmentTypes.forEach(at => {
            const month = at.month;
            if (!grouped[month]) grouped[month] = [];
            grouped[month].push(at);
        });
        return grouped;
    }, [assessmentTypes]);

    const handleScoreChange = (assessmentTypeId, value) => {
        const assessmentDef = assessmentTypes.find(at => at._id === assessmentTypeId);
        if (!assessmentDef) return;

        // Allow empty string for typing, otherwise parse number
        if (value === '') {
            setScores({ ...scores, [assessmentTypeId]: '' });
            return;
        }

        let newScore = Number(value);
        if (newScore > assessmentDef.totalMarks) newScore = assessmentDef.totalMarks;
        if (newScore < 0) newScore = 0;
        
        setScores({ ...scores, [assessmentTypeId]: newScore });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        // Prepare Payload for Online Update
        const assessmentsPayload = Object.keys(scores)
            .filter(key => scores[key] !== '')
            .map(id => ({
                assessmentType: id,
                score: Number(scores[id])
            }));

        // --- OFFLINE LOGIC ---
        if (!isOnline) {
            try {
                // We must break this "Single Student" update into "Grade Sheet" payloads 
                // because the offline queue expects the GradeSheet format.
                assessmentsPayload.forEach(item => {
                    const queuePayload = {
                        assessmentTypeId: item.assessmentType,
                        subjectId: gradeData.subject._id,
                        semester: gradeData.semester,
                        academicYear: gradeData.academicYear,
                        scores: [{ 
                            studentId: gradeData.student._id || gradeData.student, 
                            score: item.score 
                        }]
                    };
                    offlineGradeService.addToQueue(queuePayload);
                });

                alert(t('offline_warning') + "\n" + "Changes saved to Sync Queue.");
                navigate(`/students/${gradeData.student._id || gradeData.student}`);
            } catch (err) {
                alert("Error saving offline.");
            }
            return;
        }

        // --- ONLINE LOGIC ---
        try {
            const updatePayload = { assessments: assessmentsPayload };
            await gradeService.updateGrade(gradeId, updatePayload);
            alert(t('success_save') || 'Grade updated successfully!');
            navigate(`/students/${gradeData.student._id || gradeData.student}`);
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        }
    };
    
    // Calculate totals for display
    const currentObtained = Object.values(scores).reduce((sum, score) => sum + (Number(score) || 0), 0);
    const currentMax = assessmentTypes.reduce((sum, at) => sum + at.totalMarks, 0);

    if (loading) return <p className="text-center text-lg mt-8">{t('loading')}</p>;
    if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;
    if (!gradeData) return null;

    // --- Tailwind CSS ---
    const textInput = "shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500 text-center font-bold";
    const submitButton = `w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">{t('edit')} {t('score')}</h2>
                <Link to={`/students/${gradeData.student._id || gradeData.student}`} className="text-pink-600 hover:underline font-bold text-sm">
                    ← {t('back')}
                </Link>
            </div>
            
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <p className="text-sm text-gray-500 uppercase font-bold">{t('subject')}</p>
                    <p className="text-lg font-bold text-blue-900">{gradeData.subject.name}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500 uppercase font-bold">{t('semester')}</p>
                    <p className="text-lg font-bold text-blue-900">{gradeData.semester}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500 uppercase font-bold">{t('academic_year')}</p>
                    <p className="text-lg font-bold text-blue-900">{gradeData.academicYear}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {Object.keys(assessmentsByMonth).length > 0 && (
                    <div className="space-y-6">
                        {Object.keys(assessmentsByMonth).map(month => (
                            <fieldset key={month} className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                                <legend className="font-bold px-3 text-gray-700 bg-white border rounded shadow-sm text-sm">{month}</legend>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                    {assessmentsByMonth[month].map(at => (
                                        <div key={at._id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                            <label htmlFor={at._id} className="text-sm font-medium text-gray-700 mr-2 flex-1">
                                                {at.name} <span className="text-xs text-gray-400">(/ {at.totalMarks})</span>
                                            </label>
                                            <input 
                                                id={at._id} 
                                                type="number"
                                                value={scores[at._id]}
                                                onChange={e => handleScoreChange(at._id, e.target.value)}
                                                className={`w-20 ${textInput}`} 
                                                placeholder="-"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </fieldset>
                        ))}

                        {/* Total Score Display */}
                        <div className="flex justify-end items-center gap-4 p-4 bg-gray-100 rounded-lg border border-gray-200">
                            <span className="text-gray-600 font-bold uppercase text-sm">{t('grand_total')}:</span>
                            <span className="text-3xl font-black text-gray-800">{currentObtained} <span className="text-sm text-gray-400 font-normal">/ {currentMax}</span></span>
                        </div>
                    </div>
                )}
                
                <div className="mt-8">
                    <button type="submit" className={submitButton} disabled={loading}>
                        {isOnline ? t('update') : `${t('save')} (Offline)`}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditGradePage;