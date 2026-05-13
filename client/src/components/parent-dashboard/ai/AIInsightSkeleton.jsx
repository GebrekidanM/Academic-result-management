import React from "react";

const AIInsightSkeleton = () => {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 animate-pulse">
      <div className="h-6 w-52 bg-slate-200 rounded mb-6" />
      <div className="space-y-4">
        <div className="h-20 bg-slate-100 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-slate-100 rounded-xl" />
          <div className="h-32 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-24 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
};

export default AIInsightSkeleton;