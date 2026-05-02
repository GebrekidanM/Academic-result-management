import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import quizService from '../services/quizService';
import { useTranslation } from 'react-i18next';
import TeacherQuizAnalytics from './TeacherQuizAnalytics';

const TeacherQuizResults = () => {
    const { id } = useParams();
    const { t } = useTranslation();
    const [data, setData] = useState(null);

    useEffect(() => {
        quizService.getQuizAttempts(id).then(res => setData(res.data.data));
    }, [id]);

    if (!data) return <div>{t('loading')}...</div>;


const { attempts, notTaken, quiz } = data;

return (
    <div className="max-w-5xl mx-auto p-8">
        <h1 className="text-2xl font-black mb-6">{quiz.title}</h1>

        <TeacherQuizAnalytics id={id}/>
        {/* COMPLETED TABLE */}
        <div className="mb-10">
            <h2 className="text-lg font-bold mb-4 text-green-600">✓ {t('completed')} ({attempts.length})</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                        <tr>
                            <th className="p-4">{t('student_name')}</th>
                            <th className="p-4">{t('id_no')}</th>
                            <th className="p-4 text-center">{t('score')}</th>
                            <th className="p-4 text-center">{t('percentage')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {attempts.map((attempt) => (
                            <tr key={attempt._id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-bold text-slate-800">{attempt.student.fullName}</td>
                                <td className="p-4 text-slate-500 text-sm">{attempt.student.studentId}</td>
                                <td className="p-4 font-bold text-center text-slate-800">
                                    {attempt.score} <span className="text-slate-400 font-normal">/ {quiz.totalMarks}</span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                                        attempt.percentage >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {attempt.percentage.toFixed(1)}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* NOT TAKEN LIST */}
        <div>
            <h2 className="text-lg font-bold mb-4 text-amber-600">⚠ {t('not_taken')} ({notTaken.length})</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                {notTaken.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {notTaken.map(s => (
                            <div key={s._id} className="p-3 bg-amber-50 rounded-lg text-xs font-bold text-amber-800 border border-amber-100">
                                {s.fullName}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-400 italic">{t('all_students_completed')}</p>
                )}
            </div>
        </div>
    </div>
);
};

export default TeacherQuizResults;