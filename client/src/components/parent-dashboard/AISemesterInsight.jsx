import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, RefreshCcw, CheckCircle2, AlertTriangle, TrendingUp, Users } from "lucide-react";
import aiService from "../../services/aiService";

const AISemesterInsight = ({ studentId, semester, academicYear, analytics }) => {
  const { i18n } = useTranslation();
  const [loading,setLoading] = useState(false);
  const [aiData,setAiData] = useState(null);
  const [cached,setCached] = useState(false);

  const languageMap = {
    en: "English",
    am: "አማርኛ",
    om: "Afaan Oromo",
    ti: "ትግርኛ",
    so: "Soomaali",
    af: "Qafar Af"
  };

  const generateInsight = async () => {
    try {
      setLoading(true);
      const response = await aiService.generateSemesterInsight({studentId,semester,academicYear, analytics,language: i18n.language});

      let parsedInsight = response.data.insight;
      if (typeof parsedInsight === "string") {
        parsedInsight = JSON.parse(parsedInsight);
      }
      setAiData(parsedInsight);
      setCached(response.data.cached);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 mt-8 transition-all duration-300 hover:bg-gray-200">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center">
              <Sparkles className="text-pink-600 w-6 h-6" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-800">
                AI Semester Insight
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                AI-powered academic analysis
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-100 px-4 py-2 rounded-xl text-sm font-bold text-slate-700">
            {languageMap[i18n.language]}
          </div>

          {cached && (
            <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-bold">
              Cached
            </div>
          )}
          <button
            onClick={generateInsight}
            disabled={loading}
            className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-bold transition-all duration-200 flex items-center gap-2"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="mt-8 space-y-4">
          <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
            <div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
          </div>
        </div>
      )}

      {/* AI CONTENT */}
      {!loading && aiData && (
        <div className="mt-8 space-y-6">
          {/* SUMMARY */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-pink-600" />
              <h3 className="text-lg font-black text-slate-800">
                Summary
              </h3>
            </div>
            <p className="text-slate-700 leading-7">
              {aiData.summary}
            </p>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* STRENGTHS */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-black text-emerald-700">
                  Strengths
                </h3>
              </div>
              <div className="space-y-3">
                {aiData.strengths?.map((item,index) => (
                  <div key={index} className="bg-white rounded-xl p-4 border border-emerald-100 text-slate-700 font-medium">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* WEAKNESSES */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-black text-red-700">
                  Needs Improvement
                </h3>
              </div>
              <div className="space-y-3">
                {aiData.weaknesses?.map((item,index) => (
                  <div key={index} className="bg-white rounded-xl p-4 border border-red-100 text-slate-700 font-medium">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RECOMMENDATIONS */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-black text-blue-700">
                Recommendations
              </h3>
            </div>
            <div className="space-y-3">
              {aiData.recommendations?.map((item,index) => (
                <div key={index} className="bg-white rounded-xl p-4 border border-blue-100 text-slate-700 font-medium">
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* PARENT GUIDANCE */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">

            <div className="flex items-center gap-2 mb-4">

              <Users className="w-5 h-5 text-amber-600" />

              <h3 className="text-lg font-black text-amber-700">
                Parent Guidance
              </h3>

            </div>

            <p className="text-slate-700 leading-7">
              {aiData.parentGuidance}
            </p>

          </div>

        </div>
      )}

    </div>
  );

};

export default AISemesterInsight;