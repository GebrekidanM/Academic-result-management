import React from "react";
import { View, Text } from "react-native";
import InsightCard from "./InsightCard";
import { COLORS } from "../../utils/theme";
import { useTranslation } from "react-i18next";

export default function AcademicInsights({ insights = {} }) {
  const { t } = useTranslation();

  return (
    <View className="gap-5">
      {/* HEADER */}
      <View>
        <Text className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
          {t('academic_insights')}
        </Text>
        <Text className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
          {t('subject_analysis')}
        </Text>
      </View>

      {/* CARDS MATRIX */}
      <View className="gap-4">
        <InsightCard 
          type="excellent" 
          title={t('excellent_range')} 
          subjects={insights?.excellent || []} 
        />
        <InsightCard 
          type="good" 
          title={t('good_range')} 
          subjects={insights?.good || []} 
        />
        <InsightCard 
          type="average" 
          title={t('average_range')} 
          subjects={insights?.average || []} 
        />
        <InsightCard 
          type="critical" 
          title={t('critical_range')} 
          subjects={insights?.critical || []} 
        />
      </View>
    </View>
  );
}