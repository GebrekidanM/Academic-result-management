import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import quizService from '../services/quizService';
import { useTranslation } from 'react-i18next';

const QuizResultPage = () => {
    const { id } = useParams();
    const { t } = useTranslation();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const res = await quizService.getQuizResult(id);
                setResult(res.data.data);
            } catch (err) {
                console.error("Error fetching results", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [id]);

    const getFeedbackMessage = (pct) => {
        if (pct >= 90) return "🚀 Excellent Job! You've mastered this topic.";
        if (pct >= 70) return "✅ Great work! Keep it up.";
        return "📚 Keep practicing! You'll get better next time.";
    };

    if (loading) return <div>{t('loading')}...</div>;
    if (!result) return <div>{t('no_results_found')}</div>;

    return (
        <div className="max-w-3xl mx-auto p-6">
            {/* Header with Encouragement */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center mb-8">
                <h1 className="text-2xl font-black text-slate-800">{result.quiz.title}</h1>
                <p className="text-indigo-600 font-bold mt-2">{getFeedbackMessage(result.percentage)}</p>
                
                <div className="flex justify-center gap-12 mt-6">
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Score</p>
                        <p className="text-xl font-black">{result.score} / {result.quiz.totalMarks}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Percentage</p>
                        <p className="text-xl font-black">{result.percentage.toFixed(1)}%</p>
                    </div>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="space-y-6">
                {result.quiz.questions.map((q, index) => {
                    const studentAns = result.studentAnswers.find(a => a.questionId === q._id.toString());
                    const correctOption = q.options.find(o => o.isCorrect);
                    const selectedOption = q.options.find(o => o._id.toString() === studentAns?.selectedOptionId);

                    return (
                        <div key={q._id} className={`p-6 rounded-2xl border ${studentAns?.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <p className="font-bold mb-3">{index + 1}. {q.questionText}</p>
                            
                            <div className="text-sm space-y-1">
                                <p><strong>Your Answer:</strong> <span className={studentAns?.isCorrect ? 'text-green-700' : 'text-red-700'}>
                                    {selectedOption?.text || "No answer selected"}
                                </span></p>
                                
                                {!studentAns?.isCorrect && (
                                    <p className="text-slate-600"><strong>Correct Answer:</strong> {correctOption?.text}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default QuizResultPage;