import React from 'react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon, link }) => {
  // Reusable card content layout
  const CardContent = () => (
    <>
      {/* Soft-colored, modern translucent icon container */}
      <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center transition-colors group-hover:bg-pink-100 shrink-0">
        {icon}
      </div>
      <div className="grow">
        {/* Clean, uppercase tracking label */}
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        {/* Bold, tracking-tight numerical value */}
        <h4 className="text-2xl font-black text-slate-800 mt-1 transition-colors group-hover:text-pink-600">
          {value}
        </h4>
      </div>
    </>
  );

  // Soft transitions: slight lift, subtle shadow, and pink border tint on hover
  const baseClasses = "group bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-pink-200 cursor-pointer";

  // If a destination link is provided, render as a React Router Link
  if (link) {
    return (
      <Link to={link} className={baseClasses}>
        <CardContent />
      </Link>
    );
  }

  // Fallback to static div if no link is provided
  return (
    <div className={baseClasses}>
      <CardContent />
    </div>
  );
};

export default StatCard;