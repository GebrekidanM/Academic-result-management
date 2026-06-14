import React, { useEffect, useState, memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../utils/theme";

const Quiz = ({ quiz, status, serverTimeOffset }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [now, setNow] = useState(Date.now() + serverTimeOffset);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now() + serverTimeOffset);
    }, 1000);

    return () => clearInterval(interval);
  }, [serverTimeOffset]);

  const getSafeTime = (dateStr) => {
    if (!dateStr) return 0;
    const iso = dateStr.endsWith("Z") ? dateStr : `${dateStr}Z`;
    return new Date(iso).getTime();
  };

  const start = getSafeTime(quiz.startDate);
  const end = getSafeTime(quiz.endDate);
  const isNotStarted = now < start;
  const isExpired = now > end;
  const isActive = !isNotStarted && !isExpired;

  const getStatusText = () => {
    if (isNotStarted) {
      return `${t("starts")}: ${new Date(start).toLocaleString()}`;
    }

    if (isExpired) {
      return t("expired");
    }

    const diff = end - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <View
      className="bg-white rounded-3xl p-5"
      style={{borderWidth: 1, borderColor: COLORS.border}}
    >

      {/* TOP */}
      <View className="flex-row justify-between items-start">
        <Text
          className="font-bold text-lg flex-1 pr-3"
          style={{color: COLORS.textPrimary}}
        >
          {quiz.title}
        </Text>

        <View
          className="px-3 py-1 rounded-xl"
          style={{backgroundColor: isExpired ? "#fee2e2" : "#fef3c7"}}
        >
          <Text
            className="text-xs font-bold"
            style={{ color: isExpired ? "#dc2626" : "#d97706"}}
          >
            {getStatusText()}
          </Text>
        </View>

      </View>

      {/* SUBJECT */}
      {quiz.subject?.name && (
        <Text
          className="mt-3"
          style={{
            color: COLORS.textSecondary,
          }}
        >
          {quiz.subject.name}
        </Text>
      )}

      {/* BUTTON */}
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={!isActive}
        onPress={() => router.push(`/quiz/take/${quiz._id}`)}
        className="mt-5 py-4 rounded-2xl items-center"
        style={{
          backgroundColor: isActive
            ? "#0f172a"
            : "#e2e8f0",
        }}
      >
        <Text
          className="font-bold"
          style={{
            color: isActive
              ? "white"
              : "#94a3b8",
          }}
        >
          {isNotStarted
            ? t("upcoming")
            : isExpired
            ? t("expired")
            : t("start_quiz")}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default memo(Quiz);