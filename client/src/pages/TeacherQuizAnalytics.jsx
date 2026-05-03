import { useState,useEffect } from "react";
import quizService from '../services/quizService'
const TeacherQuizAnalytics = ({id}) => {
    const [analytics, setAnalytics] = useState([]);

    useEffect(() => {
        quizService.getQuizAnalytics(id).then(res => setAnalytics(res.data.data));
    }, [id]);

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h2 className="text-sm text-teal-800">Class Performance Breakdown</h2>
            <div className="space-y-6">
                {analytics.map((item, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between mb-2">
                            <p className="font-bold text-slate-800">{i + 1}. {item.questionText}</p>
                            <span className="font-black text-indigo-600">{item.successRate.toFixed(0)}% Correct</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                            <div className="bg-green-500 h-full" style={{ width: `${item.successRate}%` }}></div>
                            <div className="bg-red-500 h-full" style={{ width: `${100 - item.successRate}%` }}></div>
                        </div>
                        
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 uppercase">
                            <span>{item.correctCount} Students Correct</span>
                            <span>{item.incorrectCount} Students Missed</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeacherQuizAnalytics;