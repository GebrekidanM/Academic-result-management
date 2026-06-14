import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import SubjectCard from "./SubjectCard";
import AskAIChat from "./AskAIChat";
import FadeContainer from "./FadeContainer";
import { COLORS } from "../../utils/theme";
import { useTranslation } from "react-i18next";

export default function SemesterDetails({ semesterName, subjects, semesterRank, onGenerateAI, aiInsight, aiLoading, gradeLevel }) {
  const { t } = useTranslation();
  
  const semesterAverage = subjects.length > 0 
    ? (subjects.reduce((sum, s) => sum + s.percentage, 0) / subjects.length) 
    : 0;
  
  const isKindergarten = /^(kg|nursery|pre)/i.test(gradeLevel || "");

  const renderList = (items, color, icon) => {
    return items?.map((item, index) => (
      <View key={index} className="flex-row items-start mb-2.5">
        <Text className="mr-2 text-sm">{icon}</Text>
        <Text className="flex-1 text-sm leading-5 font-medium" style={{ color }}>
          {item}
        </Text>
      </View>
    ));
  };

  return (
    <View className="gap-6">
      
      {/* 📊 TOP SCORECARD SUMMARY PANEL */}
      <View 
        className="bg-white rounded-2xl p-5" 
        style={{ borderWidth: 1, borderColor: COLORS.border }}
      >
        <Text className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: COLORS.textSecondary }}>
          {semesterName} Overview
        </Text>
        
        <View className="flex-row gap-3">
          {/* AVERAGE */}
          <View className="flex-1 rounded-xl p-4" style={{ backgroundColor: "#fdf2f8" }}>
            <Text className="text-xs font-bold uppercase" style={{ color: "#be185d" }}>
              {t('average')}
            </Text>
            <Text className="text-3xl font-black mt-1" style={{ color: "#9d174d" }}>
              {semesterAverage.toFixed(1)}%
            </Text>
          </View>

          {/* RANK */}
          {!isKindergarten && (
            <View className="flex-1 rounded-xl p-4" style={{ backgroundColor: "#eef2ff" }}>
              <Text className="text-xs font-bold uppercase" style={{ color: "#4f46e5" }}>
                {t('rank')}
              </Text>
              <Text className="text-3xl font-black mt-1" style={{ color: "#4338ca" }}>
                {semesterRank || "-"}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 📚 INDIVIDUAL SUBJECT CARDS SECTION */}
      <View className="gap-4">
        {subjects.map(subject => (
          <View key={subject.id}>
            <SubjectCard subject={subject} />
          </View>
        ))}
      </View>

      {/* 🤖 ✨ INTERACTIVE AI PERFORMANCE INSIGHT BLOCK */}
      <View 
        className="bg-white rounded-3xl p-5" 
        style={{ borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }}
      >
        <View className="flex-row items-center gap-2">
          <Text className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
            ✨ {t('performance_insights')}
          </Text>
        </View>

        <Text className="mt-1 text-sm" style={{ color: COLORS.textSecondary }}>
          {t('overall_performance')}
        </Text>

        {/* INTERACTIVE ACTION TOGGLE BUTTON */}
        {!aiLoading && (
          <TouchableOpacity
            className="rounded-2xl p-4 items-center mt-5"
            style={{ 
              backgroundColor: aiInsight ? "#eef2ff" : COLORS.primary,
              borderWidth: aiInsight ? 1 : 0,
              borderColor: "#c7d2fe"
            }}
            onPress={() => onGenerateAI(!!aiInsight)}
          >
            <Text
              className="font-bold text-base"
              style={{ color: aiInsight ? "#4338ca" : "white" }}
            >
              {aiInsight ? `🔄 ${t('retry')}` : `🧠 ${t('generate_report')}`}
            </Text>
          </TouchableOpacity>
        )}

        {/* LOADING PROGRESS SKELETON */}
        {aiLoading && (
          <View className="mt-6 py-8 items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="mt-3 text-sm font-medium animate-pulse" style={{ color: COLORS.textSecondary }}>
              Analyzing assignment breakdowns...
            </Text>
          </View>
        )}

        {/* EXPANDED AI METRICS REPORT */}
        {aiInsight && !aiLoading && (
          <FadeContainer>
            <View className="mt-6 gap-5">
              
              {/* QUOTE BLOCK */}
              <View className="rounded-2xl p-4 border-l-4 border-pink-500" style={{ backgroundColor: "#f8fafc" }}>
                <Text className="italic text-slate-700 text-sm leading-5">
                  "{aiInsight.summary}"
                </Text>
              </View>

              {/* STRENGTHS */}
              <View className="rounded-2xl p-4" style={{ backgroundColor: "#ecfdf5" }}>
                <Text className="font-bold text-sm mb-3 uppercase tracking-wider" style={{ color: "#065f46" }}>
                  💪 {t('strongest_subject')}
                </Text>
                {renderList(aiInsight.strengths, "#047857", "✅")}
              </View>

              {/* WEAKNESSES */}
              <View className="rounded-2xl p-4" style={{ backgroundColor: "#fff7ed" }}>
                <Text className="font-bold text-sm mb-3 uppercase tracking-wider" style={{ color: "#9a3412" }}>
                  ⚠️ {t('needs_focus')}
                </Text>
                {renderList(aiInsight.weaknesses, "#c2410c", "🔍")}
              </View>

              {/* RECOMMENDATIONS */}
              <View className="rounded-2xl p-4" style={{ backgroundColor: "#eff6ff" }}>
                <Text className="font-bold text-sm mb-3 uppercase tracking-wider" style={{ color: "#1d4ed8" }}>
                  💡 {t('help')}
                </Text>
                {renderList(aiInsight.recommendations, "#2563eb", "👉")}
              </View>

              {/* PARENT GUIDANCE */}
              <View className="rounded-2xl p-4" style={{ backgroundColor: "#faf5ff" }}>
                <Text className="font-bold text-sm mb-3 uppercase tracking-wider" style={{ color: "#7e22ce" }}>
                  🏠 {t('teacher_comments')}
                </Text>
                <Text className="text-sm leading-6 font-medium" style={{ color: "#6b21a8" }}>
                  {aiInsight.parentGuidance}
                </Text>
              </View>

              {/* INTERACTIVE CHAT PORTAL ENGINE */}
              <View className="mt-2 pt-4 border-t border-slate-100">
                <AskAIChat semesterName={semesterName} subjects={subjects} />
              </View>
              
            </View>
          </FadeContainer>
        )}
      </View>
    </View>
  );
}