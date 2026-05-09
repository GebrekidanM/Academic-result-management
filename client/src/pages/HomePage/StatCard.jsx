import React from 'react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon, link }) => {
    return (
        <div className="group relative bg-white border border-slate-200 rounded-sm p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-gray-400 flex items-center gap-5">
            
            {/* Vibrant Solid Icon Box */}
            <div className="w-14 h-14 shrink-0 rounded-xl bg-pink-600 shadow-md flex items-center justify-center text-white transition-colors duration-300 group-hover:bg-gray-700">
                {icon}
            </div>
            
            {/* Text Content */}
            <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {title}
                </p>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {value}
                </h3>
            </div>

            {/* Invisible Clickable Overlay */}
            {link && (
                <Link 
                    to={link} 
                    className="absolute inset-0 z-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" 
                    aria-label={`View ${title}`} 
                />
            )}
        </div>
    );
};

export default StatCard;