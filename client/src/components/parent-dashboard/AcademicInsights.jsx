import React from "react";
import InsightCard from "./InsightCard";

const AcademicInsights = ({ insights }) => {
  return (
    <section className="space-y-6">
      {/* HEADER */}
        <div>
        <h2 className="text-2xl font-black text-slate-800">Academic Insights</h2>
        <p className="text-slate-500 text-sm mt-1"> Subject performance grouped by achievement level.</p>
        </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <InsightCard type="excellent" title="Excellent" subjects={insights.excellent}/>
        <InsightCard type="good" title="Good" subjects={insights.good}/>
        <InsightCard type="average" title="Average" subjects={insights.average}/>
        <InsightCard type="critical" title="Critical" subjects={insights.critical}/>
      </div>
    </section>
  );
};

export default AcademicInsights;