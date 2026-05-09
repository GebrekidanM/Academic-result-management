import React from "react";

const SubjectCard = ({ subject }) => {
  return (
    <div className="bg-white hover:bg-gray-200 border border-slate-100 rounded-2xl shadow-sm overflow-hidden transition-all duration-200">

      {/* HEADER */}
      <div className="border-b border-slate-100 px-6 py-5 flex items-center justify-between">

        <div>
          <h3 className="text-lg font-black text-slate-800"> {subject.subjectName} </h3>
          <p className="text-sm text-slate-500 mt-1"> Subject assessment breakdown </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-slate-500"> {subject.score}/{subject.totalMarks}</p>
        </div>
      </div>

      {/* BODY */}
      <div className="p-6 space-y-6">

        {Object.entries(subject.groupedByMonth).map(
          ([month, assessments]) => (

            <div key={month}>

              {/* MONTH */}
              <div className="flex items-center justify-between mb-4">

                <h4 className="text-sm font-black uppercase tracking-wider text-pink-600">{month}</h4>

                <div className="bg-pink-100 text-pink-700 px-3 py-1 rounded-lg text-xs font-black">
                  {assessments.length} Assessments
                </div>
              </div>

              {/* ASSESSMENTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {assessments.map((assessment) => (
                  <div key={assessment.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-700">{assessment.name}</p>
                      <p className="text-xs text-slate-400 mt-1">Assessment</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-800">{assessment.score}/{assessment.totalMarks}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {/* FOOTER */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-slate-500">Performance</span>
          <span className="text-sm font-black text-slate-800">{subject.percentage.toFixed(1)}%</span>
        </div>

        {/* PROGRESS */}
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
          <div className="bg-pink-600 h-full rounded-full transition-all duration-500"
            style={{width: `${subject.percentage}%`}}/>
        </div>
      </div>

    </div>
  );
};

export default SubjectCard;