import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const Quiz = ({ quiz, status, serverTimeOffset }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    
    const [now, setNow] = useState(Date.now() + serverTimeOffset);

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now() + serverTimeOffset);
        }, 1000);
        return () => clearInterval(interval);
    }, [serverTimeOffset]);

    const getSafeTime = (dateStr) => {
        if (!dateStr) return 0;
        const iso = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
        return new Date(iso).getTime();
    };

    const start = getSafeTime(quiz.startDate);
    const end = getSafeTime(quiz.endDate);

    const isNotStarted = now < start;
    const isExpired = now > end;
    const isActive = !isNotStarted && !isExpired;

    const getStatusText = () => {
        if (isNotStarted) return `${t('starts')}: ${new Date(start).toLocaleString()}`;
        if (isExpired) return t('expired');
        
        const diff = end - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return `${h}h ${m}m ${s}s`;
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800">{quiz.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isExpired ? 'bg-red-100 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                        {getStatusText()}
                    </span>
                </div>
            </div>
            <button 
                onClick={() => navigate(`/quiz/take/${quiz._id}`)}
                disabled={!isActive}
                className={`w-full py-2 mt-4 rounded-lg font-bold ${
                    isActive ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400'
                }`}
            >
                {isNotStarted ? t('upcoming') : isExpired ? t('expired') : t('start_quiz')}
            </button>
        </div>
    );
};

export default React.memo(Quiz);