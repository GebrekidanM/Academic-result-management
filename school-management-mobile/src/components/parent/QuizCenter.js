import React, { useState, useEffect, memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import quizService from "../../services/quizService";
import { COLORS } from "../../utils/theme";
import { useTranslation } from "react-i18next";

const QuizCenter = ({ quizzes = [], quizStatuses = {} }) => {
  const router = useRouter();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState("pending"); // 'pending' | 'completed'
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [now, setNow] = useState(Date.now());

  // 1. SYNC SERVER TIME ONCE
  useEffect(() => {
    const syncServerTime = async () => {
      try {
        const startReq = Date.now();
        const response = await quizService.getTime();
        const endReq = Date.now();
        const serverTime = new Date(response.data.serverTime).getTime();
        const latency = (endReq - startReq) / 2;
        const offset = (serverTime + latency) - endReq;
        setServerTimeOffset(offset);
        setNow(Date.now() + offset);
      } catch (err) {
        console.log("Time sync failed:", err);
      }
    };

    syncServerTime();
  }, []);

  // 2. LIVE COUNTDOWN CLOCK TICKER
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now() + serverTimeOffset);
    }, 1000);

    return () => clearInterval(interval);
  }, [serverTimeOffset]);

  // Helper safely parsing ISO/UTC
  const getSafeTime = (dateStr) => {
    if (!dateStr) return 0;
    const iso = dateStr.endsWith("Z") ? dateStr : `${dateStr}Z`;
    return new Date(iso).getTime();
  };

  const pendingQuizzes = quizzes.filter((q) => quizStatuses[q._id] && !quizStatuses[q._id].hasTaken);
  const completedQuizzes = quizzes.filter((q) => quizStatuses[q._id] && quizStatuses[q._id].hasTaken);

  // Dynamic status text generation from your loved Quiz logic
  const getLiveQuizStatus = (quiz) => {
    const start = getSafeTime(quiz.startDate);
    const end = getSafeTime(quiz.endDate);
    
    const isNotStarted = now < start;
    const isExpired = now > end;
    const isActive = !isNotStarted && !isExpired;

    let text = "";
    if (isNotStarted) {
      text = `${t("starts")}: ${new Date(start).toLocaleString()}`;
    } else if (isExpired) {
      text = t("expired");
    } else {
      const diff = end - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      text = `${h}h ${m}m ${s}s`;
    }

    return { text, isNotStarted, isExpired, isActive };
  };

  return (
    // 📦 REFACTORED COMPACT UNIFIED SYSTEM CONTAINER CARD
    <View 
      className="bg-white rounded-[24px] p-5"
      style={{ 
        borderWidth: 1, 
        borderColor: COLORS.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2
      }}
    >
      {/* CARD TITLE HEADER */}
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-2xl font-black tracking-tight" style={{ color: COLORS.textPrimary }}>
          📝 {t('quiz_center')}
        </Text>
        
        <View className="bg-slate-100 px-2.5 py-1 rounded-full">
          <Text className="text-[11px] font-bold text-slate-500 uppercase">
            {quizzes.length} {t('total', 'Total')}
          </Text>
        </View>
      </View>

      <Text className="text-xs leading-4 mb-5" style={{ color: COLORS.textSecondary }}>
        {t('quiz_center_subtitle', 'Available quizzes, timed examinations, and academic activities.')}
      </Text>

      {/* 🎛️ INTEGRATED TAB SEGMENT CONTROL */}
      <View className="flex-row bg-slate-100 p-1 rounded-xl gap-1 mb-4">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setActiveTab("pending")}
          className="flex-1 flex-row items-center justify-center py-2.5 rounded-lg gap-1.5"
          style={{ 
            backgroundColor: activeTab === "pending" ? "white" : "transparent",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: activeTab === "pending" ? 0.05 : 0,
            shadowRadius: 2,
          }}
        >
          <Text className="font-bold text-xs" style={{ color: activeTab === "pending" ? COLORS.textPrimary : COLORS.textSecondary }}>
            {t('pending_quizzes')}
          </Text>
          <View className={`px-1.5 py-0.5 rounded ${activeTab === "pending" ? 'bg-pink-100' : 'bg-slate-200'}`}>
            <Text className="text-[10px] font-black" style={{ color: activeTab === "pending" ? COLORS.primary : COLORS.textPrimary }}>
              {pendingQuizzes.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setActiveTab("completed")}
          className="flex-1 flex-row items-center justify-center py-2.5 rounded-lg gap-1.5"
          style={{ 
            backgroundColor: activeTab === "completed" ? "white" : "transparent",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: activeTab === "completed" ? 0.05 : 0,
            shadowRadius: 2,
          }}
        >
          <Text className="font-bold text-xs" style={{ color: activeTab === "completed" ? COLORS.textPrimary : COLORS.textSecondary }}>
            {t('completed_quizzes')}
          </Text>
          <View className={`px-1.5 py-0.5 rounded ${activeTab === "completed" ? 'bg-emerald-100' : 'bg-slate-200'}`}>
            <Text className="text-[10px] font-black" style={{ color: activeTab === "completed" ? "#047857" : COLORS.textPrimary }}>
              {completedQuizzes.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 📥 CONDITIONAL CONTENT VIEWS */}
      <View>
        {activeTab === "pending" ? (
          pendingQuizzes.length === 0 ? (
            <View className="bg-slate-50 rounded-2xl py-8 px-4 items-center border border-dashed border-slate-200">
              <Text className="text-xl mb-1">2026 ✅</Text>
              <Text className="font-bold text-xs" style={{ color: COLORS.textPrimary }}>
                {t('no_pending_quizzes')}
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {pendingQuizzes.map((quiz) => {
                const clock = getLiveQuizStatus(quiz);
                return (
                  <View 
                    key={quiz._id} 
                    className="bg-slate-50 rounded-xl p-4 border border-slate-100"
                  >
                    {/* Header metrics alignment */}
                    <View className="flex-row justify-between items-start gap-2">
                      <View className="flex-1">
                        <Text className="font-bold text-sm leading-4" style={{ color: COLORS.textPrimary }}>
                          {quiz.title}
                        </Text>
                        {quiz.subject?.name && (
                          <Text className="text-[10px] font-semibold mt-1 uppercase tracking-wider" style={{ color: COLORS.primary }}>
                            {quiz.subject.name}
                          </Text>
                        )}
                      </View>

                      {/* Ticking live localized badge */}
                      <View 
                        className="px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: clock.isExpired ? "#fee2e2" : "#fef3c7" }}
                      >
                        <Text 
                          className="text-[10px] font-bold" 
                          style={{ color: clock.isExpired ? "#dc2626" : "#d97706" }}
                        >
                          {clock.text}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Integrated clean action button layout wrapper */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={!clock.isActive}
                      onPress={() => router.push(`/quiz/take/${quiz._id}`)}
                      className="mt-3.5 py-2 rounded-xl items-center"
                      style={{ backgroundColor: clock.isActive ? "#0f172a" : "#e2e8f0" }}
                    >
                      <Text 
                        className="font-bold text-xs"
                        style={{ color: clock.isActive ? "white" : "#94a3b8" }}
                      >
                        {clock.isNotStarted ? t("upcoming") : clock.isExpired ? t("expired") : t("start_quiz")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )
        ) : (
          completedQuizzes.length === 0 ? (
            <View className="bg-slate-50 rounded-2xl py-8 px-4 items-center border border-dashed border-slate-200">
              <Text className="text-xl mb-1">🎉</Text>
              <Text className="font-bold text-xs" style={{ color: COLORS.textPrimary }}>
                {t('no_completed_quizzes')}
              </Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {completedQuizzes.map((quiz) => (
                <View 
                  key={quiz._id} 
                  className="bg-slate-50 rounded-xl p-3.5 flex-row items-center justify-between border border-slate-100"
                >
                  <View className="flex-1 pr-3">
                    <Text className="font-bold text-sm leading-4" style={{ color: COLORS.textPrimary }}>
                      {quiz.title}
                    </Text>
                    <Text className="text-[10px] font-medium text-slate-400 mt-1">
                      {quiz.subject?.name}
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push(`/quiz/result/${quiz._id}`)}
                    className="bg-white border px-3.5 py-2 rounded-lg"
                    style={{ borderColor: COLORS.border }}
                  >
                    <Text className="font-bold text-xs" style={{ color: COLORS.textPrimary }}>
                      {t('view_result')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )
        )}
      </View>

    </View>
  );
};

export default memo(QuizCenter);