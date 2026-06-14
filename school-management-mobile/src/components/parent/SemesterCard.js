import React from "react";
import { View, Text } from "react-native";
import { COLORS } from "../../utils/theme";
import { useTranslation } from "react-i18next";

export default function SemesterCard({ title, average, rank, gradeLevel, isActive }) {
  const isKindergarten = /^(kg|nursery|pre)/i.test(gradeLevel || "");
  const { t } = useTranslation();

  return (
    <View 
      className="rounded-xl p-5" 
      style={{ 
        borderWidth: 2, 
        borderColor: isActive ? COLORS.primary : COLORS.border,
        backgroundColor: isActive ? "#fdf2f8" : "#ffffff" 
      }}
    >
      {/* HEADER SECTION */}
      <View className="flex-row justify-between items-center">
        <Text 
          className="text-xl font-bold" 
          style={{ color: isActive ? COLORS.primary : COLORS.textPrimary }}
        >
          {title}
        </Text>
        
        {/* Active badge indicator */}
        {isActive && (
          <View className="bg-pink-600 px-2 py-1 rounded-md">
            <Text className="text-white text-xs font-bold uppercase">Viewing</Text>
          </View>
        )}
      </View>

      <Text className="mt-1 text-sm" style={{ color: COLORS.textSecondary }}>
        {t('view')}
      </Text>

      {/* STATS MATRIX */}
      <View className="flex-row gap-3 mt-5">
        
        {/* AVERAGE BLOCK */}
        <View 
          className="flex-1 rounded-xl p-4" 
          style={{ backgroundColor: isActive ? "#fce7f3" : "#f8fafc" }} // Darker pink block if active
        >
          <Text className="text-xs font-bold uppercase" style={{ color: "#be185d" }}>
            {t('average')}
          </Text>
          <Text className="text-2xl font-bold mt-2" style={{ color: "#9d174d" }}>
            {average?.toFixed(1)}%
          </Text>
        </View>

        {/* RANK BLOCK */}
        {!isKindergarten && (
          <View 
            className="flex-1 rounded-xl p-4" 
            style={{ backgroundColor: isActive ? "#fae8ff" : "#f1f5f9" }}
          >
            <Text className="text-xs font-bold uppercase" style={{ color: "#4f46e5" }}>
              {t('rank')}
            </Text>
            <Text className="text-2xl font-bold mt-2" style={{ color: "#4338ca" }}>
              {rank || "-"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}