import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import quizService from '../services/quizService';
import { useTranslation } from 'react-i18next';
import authService from '../services/authService';
import subjectService from '../services/subjectService'
import configService from '../services/configService';


const TeacherCreateQuiz = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [currentUser] = useState(authService.getCurrentUser());
    const [availableGrades, setAvailableGrades] = useState([]);
    const [availableSubjects, setAvailableSubjects] = useState([]);

    const [quizData, setQuizData] = useState({
        title: '',
        description: '',
        subject: '',
        gradeLevel: '',
        durationInMinutes: 30,
        academicYear: '2018',
        startDate: '',
        endDate: '',
        questions: [{ questionText: '', points: 1, options: [{ text: '', isCorrect: false }] }]
    });

    // Inside TeacherCreateQuiz component:
    useEffect(() => {
        const initForm = async () => {
            const grades = await configService.getGradesForUser(currentUser);
            setAvailableGrades(grades);
            
            // If we only have one grade, auto-select it
            if (grades.length === 1) {
                setQuizData(prev => ({ ...prev, gradeLevel: grades[0] }));
            }
        };
        initForm();
    }, [currentUser]);

    useEffect(() => {
        if (quizData.gradeLevel) {
            subjectService.getSubjectsByGrade(quizData.gradeLevel).then(res => {
                setAvailableSubjects(res);
            });
        }
    }, [quizData.gradeLevel]);

    const addQuestion = () => {
        setQuizData({ ...quizData, questions: [...quizData.questions, { questionText: '', points: 1, options: [{ text: '', isCorrect: false }] }] });
    };

    const addOption = (qIndex) => {
        const newQuestions = [...quizData.questions];
        newQuestions[qIndex].options.push({ text: '', isCorrect: false });
        setQuizData({ ...quizData, questions: newQuestions });
    };

    const handleSave = async () => {
        if (!quizData.subject || !quizData.gradeLevel) {
            return alert("Please fill in Subject and Grade Level!");
        }
        if (!quizData.subject || !quizData.gradeLevel || !quizData.title) {
            return alert("Please fill in Title, Subject, and Grade Level!");
        }

        // Check if every question has at least one correct option
        const isInvalid = quizData.questions.some(q => !q.options.some(o => o.isCorrect));
        if (isInvalid) {
            return alert("Please ensure every question has a 'Correct' answer selected.");
        }

        try {
            await quizService.createQuiz(quizData);
            alert("Quiz created successfully!");
            navigate('/teacher/quizzes');
        } catch (err) {
            console.error(err);
            alert("Error creating quiz. Check console for details.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 bg-slate-50 min-h-screen">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-slate-800">{t('create_quiz')}</h1>
                <p className="text-slate-500">Define your quiz details and questions below.</p>
            </header>

            {/* SECTION 1: QUIZ CONFIGURATION */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8">
                <h2 className="text-sm font-black uppercase text-slate-400 mb-6 tracking-wider">Quiz Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input placeholder="Quiz Title" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" onChange={e => setQuizData({...quizData, title: e.target.value})} />
                    <input type="number" placeholder="Duration (minutes)" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none" onChange={e => setQuizData({...quizData, durationInMinutes: e.target.value})} />
                    
                    <select className="bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none" value={quizData.gradeLevel} onChange={e => setQuizData({...quizData, gradeLevel: e.target.value})}>
                        <option value="">Select Grade</option>
                        {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>

                    <select className="bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none" value={quizData.subject} onChange={e => setQuizData({...quizData, subject: e.target.value})}>
                        <option value="">Select Subject</option>
                        {availableSubjects?.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>

                    <input type="datetime-local" className="bg-slate-50 border border-slate-200 p-3 rounded-xl" onChange={e => setQuizData({...quizData, startDate: e.target.value})} />
                    <input type="datetime-local" className="bg-slate-50 border border-slate-200 p-3 rounded-xl" onChange={e => setQuizData({...quizData, endDate: e.target.value})} />
                </div>
            </div>

            {/* SECTION 2: QUESTIONS */}
            <h2 className="text-sm font-black uppercase text-slate-400 mb-4 tracking-wider">Quiz Questions</h2>
            {quizData.questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-6">
                    <input 
                        placeholder={`Question ${qIndex + 1}`} 
                        className="w-full text-lg font-bold mb-4 p-2 border-b-2 border-slate-100 outline-none focus:border-indigo-500" 
                        onChange={e => {
                            const qs = [...quizData.questions];
                            qs[qIndex].questionText = e.target.value;
                            setQuizData({...quizData, questions: qs});
                        }} 
                    />
                    
                    <div className="space-y-3 mb-4">
                        {q.options.map((opt, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                                <input placeholder={`Option ${oIndex + 1}`} className="flex-1 bg-transparent outline-none" onChange={e => {
                                    const qs = [...quizData.questions];
                                    qs[qIndex].options[oIndex].text = e.target.value;
                                    setQuizData({...quizData, questions: qs});
                                }} />
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                    <input type="radio" name={`correct-${qIndex}`} onChange={() => {
                                        const qs = [...quizData.questions];
                                        qs[qIndex].options.forEach((o, i) => o.isCorrect = i === oIndex);
                                        setQuizData({...quizData, questions: qs});
                                    }} /> CORRECT
                                </label>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={() => addOption(qIndex)} className="text-xs font-bold text-indigo-600 uppercase">+ Add Option</button>
                </div>
            ))}

            <div className="flex gap-4">
                <button onClick={addQuestion} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-bold hover:bg-slate-200">+ Add Question</button>
                <button onClick={handleSave} className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">Save Quiz</button>
            </div>
        </div>
    );
};

export default TeacherCreateQuiz;