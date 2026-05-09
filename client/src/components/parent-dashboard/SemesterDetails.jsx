import React from "react";
import SubjectCard from "./SubjectCard";

const SemesterDetails = ({ semesterName, subjects, semesterRank,onGenerateAI, aiInsight,aiLoading}) => {
  const semesterAverage = subjects.length > 0 ? (subjects.reduce((sum, s) => sum + s.percentage, 0) / subjects.length) : 0;

  return (
    <section className="space-y-6">
      {/* HEADER */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800">{semesterName}</h2>
            <p className="text-slate-500 text-sm mt-1">Semester academic performance details</p>
          </div>

          {/* SUMMARY */}
          <div className="flex gap-4 flex-wrap">
            <div className="bg-pink-50 border border-pink-100 px-5 py-3 rounded-xl">
              <p className="text-xs uppercase tracking-wider text-pink-600 font-black"> Semester Average</p>
              <h3 className="text-xl font-black text-pink-700 mt-1">
                {semesterAverage.toFixed(1)}%
              </h3>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 px-5 py-3 rounded-xl">
              <p className="text-xs uppercase tracking-wider text-indigo-600 font-black"> Semester Rank </p>
              <h3 className="text-xl font-black text-indigo-700 mt-1"> {semesterRank || "-"} </h3>
            </div>
          </div>
        </div>
      </div>

      {/* AI INSIGHTS SECTION */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              ✨ AI Performance Insight
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Personalized analysis of {semesterName.toLowerCase()} results
            </p>
          </div>
          
          {/* BUTTONS: Generate (if null) OR Regenerate (if exists) */}
          <div className="flex items-center gap-3">
            {!aiInsight ? (
              <button
                onClick={() => onGenerateAI(false)}
                disabled={aiLoading}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
              >
                {aiLoading ? "Analyzing..." : "Generate AI Insight"}
              </button>
            ) : (
              <button
                onClick={() => onGenerateAI(true)} // pass TRUE for force regeneration
                disabled={aiLoading}
                className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 disabled:opacity-50 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                {aiLoading ? (
                   <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                ) : (
                   "🔄 Regenerate"
                )}
              </button>
            )}
          </div>  
        </div>      

        {/* LOADING SKELETON */}
        {aiLoading && (
          <div className="animate-pulse space-y-4 mt-6">
            <div className="h-4 bg-slate-200 rounded-full w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded-full w-full"></div>
            <div className="h-4 bg-slate-200 rounded-full w-5/6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="h-24 bg-slate-100 rounded-xl"></div>
              <div className="h-24 bg-slate-100 rounded-xl"></div>
            </div>
          </div>
        )}

        {/* AI RESULTS */}
        {aiInsight && !aiLoading && (
          <div className="space-y-5 mt-6 animate-fade-in">
            {/* Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 italic">
              "{aiInsight.summary}"
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl">
                <h4 className="font-black text-emerald-800 mb-3 flex items-center gap-2">
                  <span className="text-emerald-500">↑</span> Core Strengths
                </h4>
                <ul className="list-disc pl-5 text-sm text-emerald-700 space-y-1.5">
                  {aiInsight.strengths?.map((strength, idx) => (
                    <li key={idx}>{strength}</li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="bg-orange-50 border border-orange-100 p-5 rounded-xl">
                <h4 className="font-black text-orange-800 mb-3 flex items-center gap-2">
                  <span className="text-orange-500">↓</span> Areas to Focus
                </h4>
                <ul className="list-disc pl-5 text-sm text-orange-700 space-y-1.5">
                  {aiInsight.weaknesses?.map((weakness, idx) => (
                    <li key={idx}>{weakness}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
              <h4 className="font-black text-blue-800 mb-3">Actionable Recommendations</h4>
              <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1.5">
                {aiInsight.recommendations?.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>

            {/* Parent Guidance */}
            <div className="bg-purple-50 border border-purple-100 p-5 rounded-xl">
              <h4 className="font-black text-purple-800 mb-2">How You Can Help at Home</h4>
              <p className="text-sm text-purple-700 leading-relaxed">
                {aiInsight.parentGuidance}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SUBJECTS LIST */}
      <div className="grid grid-cols-1 gap-6">
        {subjects.map((subject) => (
          <SubjectCard key={subject.id} subject={subject}/>
        ))}
      </div>
    </section>
  );
};

export default SemesterDetails;