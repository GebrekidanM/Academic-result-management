import React from "react";

const AISemesterInsightCard = ({ title, items, type }) => {

  const colorMap = {
    strengths: "bg-green-50 border-green-100 text-green-700",
    weaknesses: "bg-red-50 border-red-100 text-red-700",
    recommendations: "bg-blue-50 border-blue-100 text-blue-700"
  };

  return (
    <div className={`border rounded-2xl p-5 ${colorMap[type]}`}>

      <h3 className="font-black text-sm uppercase tracking-wider mb-4">
        {title}
      </h3>

      <div className="space-y-3">

        {items?.map((item, index) => (
          <div key={index} className="text-sm font-medium leading-relaxed">
            • {item}
          </div>
        ))}

      </div>

    </div>
  );

};

export default AISemesterInsightCard;