import React, { useEffect, useState } from "react";

import aiInsightService from "../../../services/aiInsightService";

import AISemesterInsightCard from "./AISemesterInsightCard";
import AIInsightSkeleton from "./AIInsightSkeleton";

import { useTranslation } from "react-i18next";

const AIInsightSection = ({
  student,
  semester,
  academicYear,
  analytics
}) => {

  const { i18n } = useTranslation();

  const [loading, setLoading] = useState(true);

  const [insight, setInsight] = useState(null);

  const [cached, setCached] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {

    const loadInsight = async () => {

      try {

        setLoading(true);

        const response =
          await aiInsightService.generateSemesterInsight({
            studentId: student._id,
            semester,
            academicYear,
            analytics,
            language: i18n.language
          });

        setInsight(response.data.insight);

        setCached(response.data.cached);

      } catch (err) {

        console.error(err);

        setError("Failed to generate AI insight");

      } finally {

        setLoading(false);

      }

    };

    if (
      student &&
      semester &&
      analytics
    ) {
      loadInsight();
    }

  }, [
    student,
    semester,
    academicYear,
    analytics,
    i18n.language
  ]);

  // LOADING

  if (loading) {
    return <AIInsightSkeleton />;
  }

  // ERROR

  if (error) {

    return (
      <div className="bg-red-50 border border-red-100 text-red-500 rounded-2xl p-6">
        {error}
      </div>
    );

  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-6">

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <div>

          <h2 className="text-xl font-black text-slate-800">
            AI Academic Insight
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            {semester}
          </p>

        </div>

        {cached && (
          <div className="bg-green-100 text-green-700 text-xs font-black px-3 py-1 rounded-lg">
            Cached
          </div>
        )}

      </div>

      {/* SUMMARY */}

      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">

        <h3 className="font-black text-slate-700 mb-3">
          Summary
        </h3>

        <p className="text-slate-600 leading-relaxed">
          {insight.summary}
        </p>

      </div>

      {/* CARDS */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <AISemesterInsightCard
          title="Strengths"
          items={insight.strengths}
          type="strengths"
        />

        <AISemesterInsightCard
          title="Weaknesses"
          items={insight.weaknesses}
          type="weaknesses"
        />

        <AISemesterInsightCard
          title="Recommendations"
          items={insight.recommendations}
          type="recommendations"
        />

      </div>

      {/* PARENT GUIDANCE */}

      <div className="bg-pink-50 border border-pink-100 rounded-2xl p-5">

        <h3 className="font-black text-pink-700 mb-3">
          Parent Guidance
        </h3>

        <p className="text-slate-700 leading-relaxed">
          {insight.parentGuidance}
        </p>

      </div>

    </div>
  );

};

export default AIInsightSection;