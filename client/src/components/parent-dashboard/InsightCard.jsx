import React from "react";

const styles = {
  excellent: {bg: "bg-green-50", border: "border-green-100", title: "text-green-700"},
  good: {bg: "bg-blue-50", border: "border-blue-100", title: "text-blue-700"},
  average: {bg: "bg-yellow-50", border: "border-yellow-100", title: "text-yellow-700"},
  critical: {bg: "bg-red-50", border: "border-red-100", title: "text-red-700"}
};

const InsightCard = ({type, title, subjects}) => {
  const style = styles[type];

  return (
    <div className={`${style.bg} ${style.border} border rounded-2xl p-6 transition-all duration-200`}>
      <div className="flex items-center justify-between mb-5"> 
        <h3 className={`text-sm uppercase tracking-wider font-black ${style.title}`}>{title}</h3>
        <div className="bg-white px-3 py-1 rounded-lg text-xs font-black text-slate-700">{subjects.length}</div>
      </div>

      {/* CONTENT */}
      {subjects.length === 0 ? (<p className="text-slate-400 text-sm italic"> No subjects available</p>) 
      : (
        <div className="space-y-3">
          {subjects.map((subject, index) => (
            <div key={index} className=" bg-white rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
              <span className="font-bold text-slate-700">{subject.name}</span>
              <span className="text-sm font-black text-slate-800">{subject?.pct}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InsightCard;