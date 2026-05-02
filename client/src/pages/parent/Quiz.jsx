import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const Quiz = ({ quiz, status }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    if (!status) return <div className="text-xs p-2 text-slate-400 italic">{t('loading')}...</div>;

    const now = new Date();
    const start = new Date(quiz.startDate);
    const end = new Date(quiz.endDate);

    const isNotStarted = now < start;
    const isExpired = now > end;
    const isActive = !isNotStarted && !isExpired;

    // Determine status text/label
    let statusText = "";
    if (isNotStarted) statusText = t('not_started');
    else if (isExpired) statusText = t('expired');
    else statusText = `${Math.floor((end - now) / (1000 * 60 * 60))} ${t('hours_left')}`;

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 text-md">{quiz.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isExpired ? 'bg-red-100 text-red-600' : 
                        isNotStarted ? 'bg-blue-100 text-blue-600' : 
                        'bg-amber-50 text-amber-600'
                    }`}>
                        {statusText}
                    </span>
                </div>
                <p className="text-slate-500 text-xs mb-4">{quiz.description}</p>
            </div>
            
            <button 
                onClick={() => navigate(`/quiz/take/${quiz._id}`)}
                // Disabled if not active
                disabled={!isActive}
                className={`w-full py-2 rounded-lg font-bold text-sm transition-colors ${
                    !isActive 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                    : 'bg-slate-800 text-white hover:bg-slate-900'
                }`}
            >
                {isNotStarted ? t('upcoming') : isExpired ? t('expired') : t('start_quiz')}
            </button>
        </div>
    );
};

export default Quiz;