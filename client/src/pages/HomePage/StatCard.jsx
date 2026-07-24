import React from 'react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon, link }) => {
    return (
        <div className="group relative cursor-pointer bg-white border border-slate-200 rounded-sm p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-gray-400 flex items-center gap-3">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-pink-600 shadow-md flex items-center justify-center text-white transition-colors duration-300 group-hover:bg-gray-700">{icon}</div>
            <div className='flex gap-3 items-center'>
                <p className="text-xs font-bold text-slate-500 capitilize tracking-wider mb-1"> {title}</p>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
            </div>
        </div>
    );
};

export default StatCard;