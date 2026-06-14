import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { COLORS } from "../../utils/theme";
import { useTranslation } from "react-i18next";

export default function QuizCard({ quiz, status, onAction }) {
  const { t } = useTranslation();
  
  // Destructure with fallbacks safely
  const { title = "Untitled Quiz", subject = {}, duration = 0, totalPoints = 0, isLocked = false } = quiz || {};
  const isTaken = status?.hasTaken || false;

  return (
    <View 
      className="bg-white rounded-2xl p-4 mb-3" 
      style={{ 
        borderWidth: 1, 
        borderColor: COLORS.border,
        // Soft elevation shadow for modern depth
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      }}
    >
      {/* CARD HEADER: Subject Tag & Meta Indicators */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="bg-slate-100 px-2.5 py-1 rounded-lg">
          <Text className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            {subject?.name || t('general', 'General')}
          </Text>
        </View>

        {/* Dynamic State Badge */}
        <View className="flex-row items-center gap-1.5">
          {isTaken ? (
            <View className="bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              <Text className="text-[11px] font-bold text-emerald-700 uppercase">
                {t('completed', 'Completed')}
              </Text>
            </View>
          ) : isLocked ? (
            <View className="bg-slate-100 px-2 py-0.5 rounded-md">
              <Text className="text-[11px] font-bold text-slate-500 uppercase">
                🔒 {t('locked', 'Locked')}
              </Text>
            </View>
          ) : (
            <View className="bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">
              <Text className="text-[11px] font-bold text-pink-700 uppercase animate-pulse">
                ⚡ {t('active_status', 'Available')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* QUIZ MAIN INFO */}
      <Text className="text-lg font-bold leading-6 mb-4" style={{ color: COLORS.textPrimary }}>
        {title}
      </Text>

      {/* FOOTER METRICS METADATA */}
      <View className="flex-row items-center justify-between pt-3 border-t border-slate-50">
        <View className="flex-row gap-4">
          {/* Duration info */}
          <View className="flex-row items-center gap-1">
            <Text className="text-xs">⏱️</Text>
            <Text className="text-xs font-semibold text-slate-500">
              {duration} {t('minutes_short', 'mins')}
            </Text>
          </View>

          {/* Point Allocation info */}
          <View className="flex-row items-center gap-1">
            <Text className="text-xs">🎯</Text>
            <Text className="text-xs font-semibold text-slate-500">
              {totalPoints} {t('pts_short', 'pts')}
            </Text>
          </View>
        </View>

        {/* INTERACTIVE CALL TO ACTION ACCENT BUTTON */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isLocked && !isTaken}
          onPress={onAction}
          className="px-4 py-2 rounded-xl"
          style={{ 
            backgroundColor: isTaken 
              ? "#f1f5f9" 
              : isLocked 
                ? "#f1f5f9" 
                : COLORS.primary 
          }}
        >
          <Text 
            className="font-bold text-xs"
            style={{ 
              color: isTaken 
                ? COLORS.textPrimary 
                : isLocked 
                  ? COLORS.textSecondary 
                  : "white" 
            }}
          >
            {isTaken 
              ? t('view_result', 'View Result') 
              : isLocked 
                ? t('start_quiz', 'Locked') 
                : t('start_quiz', 'Start Quiz')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}