import React from "react";

const DashboardHeader = ({ student, ranks, overallAvg }) => {
  if (!student) return null;
 
  const isKindergarten = (gradeLevel) => {
      if (!gradeLevel) return false;
      return /^(kg|nursery|pre)/i.test(gradeLevel);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-gray-200 transition-all duration-200">
      {/* LEFT: Student Info */}
      <div className="flex flex-col items-center md:flex-row gap-4">
        <img src={student.imageUrl} alt="student" className="w-40 h-40 md:w-20 md:h-20 rounded-xl object-cover border border-slate-200"/>
        <div>
          <h2 className="text-slate-800 font-black text-xl">{student.fullName}</h2>
          <p className="text-slate-500 text-sm">Grade {student.gradeLevel} • ID: {student.studentId}</p>
        </div>
      </div>

      {/* RIGHT: Key Metrics */}
      <div className="flex gap-3 flex-wrap justify-center md:justify-end">
        {/* Rank */}
        {!isKindergarten(student.gradeLevel) && <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl text-center">
          <p className="text-[10px] uppercase text-indigo-600 font-bold">Rank</p>
          <p className="text-lg font-black text-indigo-700">{ranks?.overall ?? "-"}</p>
        </div>}
        {/* Average */}
        <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl text-center">
          <p className="text-[10px] uppercase text-emerald-600 font-bold">Average</p>
          <p className="text-lg font-black text-emerald-700"> {overallAvg ? `${overallAvg.toFixed(1)}%` : "-"}</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;