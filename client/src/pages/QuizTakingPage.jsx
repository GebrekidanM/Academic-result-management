import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import quizService from '../services/quizService';
import { useTranslation } from 'react-i18next';

const QuizTakingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    
    const [timeLeft, setTimeLeft] = useState(null);
    const timerRef = useRef(null);
    const isSubmittedRef = useRef(false);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const res = await quizService.getQuizToTake(id);
                const quizData = res.data.data;
                setQuiz(quizData);
                
                // Initialize timer in seconds
                setTimeLeft(quizData.durationInMinutes * 60);
            } catch (err) {
                console.error(err);
                alert("Failed to load quiz");
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [id]);

    // Timer Interval logic
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Cleanup interval on unmount
        return () => clearInterval(timerRef.current);
    }, [timeLeft]);

    const formatTime = (seconds) => {
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        // Only show days if they exist, otherwise show HH:MM:SS
        const parts = [];
        if (d > 0) parts.push(`${d}d`);
        parts.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        
        return parts.join(' ');
    };

    const handleOptionChange = (questionId, optionId) => {
        setAnswers({ ...answers, [questionId]: optionId });
    };

    const handleSubmit = async () => {
        // Prevent double submission
        if (isSubmittedRef.current) return;
        isSubmittedRef.current = true;

        if (timerRef.current) clearInterval(timerRef.current);

        const formattedAnswers = Object.keys(answers).map(qId => ({
            questionId: qId,
            selectedOptionId: answers[qId]
        }));

        try {
            
            await quizService.submitQuiz(id, formattedAnswers);
            alert(timeLeft === 0 ? "Time is up! Quiz submitted." : "Quiz submitted successfully!");
            navigate('/parent/dashboard'); 
        } catch (err) {
            isSubmittedRef.current = false; // Reset so they can try again if it was a network error
            alert(err.response?.data?.message || "Submission failed");
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen">{t('loading')}...</div>;
    if (!quiz) return <div className="text-center mt-10 text-red-500">Quiz not found.</div>;

    return (
        <div className="max-w-3xl mx-auto pb-20 font-sans">
            {/* Sticky Timer Header */}
            {/* Sticky Timer Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center z-10 shadow-sm mb-6">
                <h1 className="text-lg font-bold text-slate-800 truncate mr-4">{quiz.title}</h1>
                
                {/* Dynamic styling based on urgency */}
                <div className={`px-4 py-2 rounded-lg font-mono font-black text-sm border flex items-center gap-2 ${
                    timeLeft < 300 
                        ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' 
                        : 'bg-slate-900 text-white border-slate-900'
                }`}>
                    <span>⏱</span>
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div className="px-4">
                <p className="text-slate-600 mb-8 italic">{quiz.description}</p>

                <div className="space-y-8">
                    {quiz.questions.map((q, index) => (
                        <div key={q._id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <p className="font-bold text-slate-800 text-lg mb-4">
                                {index + 1}. {q.questionText}
                            </p>
                            <div className="space-y-3">
                                {q.options.map(opt => (
                                    <label key={opt._id} className="flex items-center p-4 border rounded-xl cursor-pointer hover:bg-indigo-50 transition-colors border-slate-100">
                                        <input
                                            type="radio"
                                            name={q._id}
                                            value={opt._id}
                                            onChange={() => handleOptionChange(q._id, opt._id)}
                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="ml-3 font-medium text-slate-700">{opt.text}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleSubmit}
                    className="mt-10 w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-lg"
                >
                    {t('submit_quiz')}
                </button>
            </div>
        </div>
    );
};

export default QuizTakingPage;