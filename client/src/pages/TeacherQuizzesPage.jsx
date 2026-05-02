import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import quizService from '../services/quizService';
import { useTranslation } from 'react-i18next';

const TeacherQuizzesPage = () => {
    const { t } = useTranslation();
    const [quizzes, setQuizzes] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const res = await quizService.getTeacherQuizzes();
                setQuizzes(res.data.data);
            } catch (err) {
                console.error("Failed to fetch quizzes", err);
            }
        };
        fetchQuizzes();
    }, []);

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 bg-slate-50 min-h-screen">
            <div className="flex flex-row md:flex-col justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">{t('Quizzes')}</h1>
                    <p className="text-slate-500">{t('manage_your_assessments')}</p>
                </div>
                <button 
                    onClick={() => navigate('/teacher/quizzes/create')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-indigo-200 transition-all"
                >
                    + {t('create_new_quiz')}
                </button>
            </div>
            
            <div className="grid gap-4">
                {quizzes.length > 0 ? (
                    quizzes.map(q => (
                        <div key={q._id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-all">
                            <div>
                                <h3 className="font-black text-slate-800 text-lg">{q.title}</h3>
                                <div className="flex gap-4 mt-2">
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{q.subject?.name}</span>
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{q.gradeLevel}</span>
                                </div>
                            </div>
                            
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => navigate(`/teacher/quizzes/edit/${q._id}`)}
                                    className="text-indigo-600 font-bold text-xs uppercase hover:underline"
                                >
                                    {t('edit')}
                                </button>
                                <button 
                                    onClick={() => navigate(`/teacher/quizzes/${q._id}/results`)}
                                    className="bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase"
                                >
                                    {t('view_results')}
                                </button>
                            </div>
                               
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                        <p className="text-slate-400 font-bold">{t('no_quizzes_yet')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherQuizzesPage;