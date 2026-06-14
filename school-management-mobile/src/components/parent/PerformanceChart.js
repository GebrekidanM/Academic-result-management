import React from "react";
import { View, Text, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { COLORS } from "../../utils/theme";
import { useTranslation } from "react-i18next";

const screenWidth = Dimensions.get("window").width;

export default function PerformanceChart({ chartData }) {
  const { t } = useTranslation();

  return (
    <View className="bg-white rounded-xl p-5" style={{ borderWidth: 1, borderColor: COLORS.border }}>

      {/* HEADER */}
      <View>
        <Text className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
          {t('performance_trend')}
        </Text>
        <Text className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>
          {t('monthly_progress')}
        </Text>
      </View>

      {/* CHART */}
      {chartData && chartData.labels && chartData.labels.length > 0 && (
        <LineChart
          data={chartData}
          width={screenWidth - 40} // 💡 Subtracted padding so the chart fits cleanly inside the container card
          height={220}
          yAxisSuffix="%"
          // 🔄 Automatically translates X-axis labels (e.g., "September" -> "መስከረም")
          formatXLabel={(label) => t(label.toLowerCase(), label)}
          chartConfig={{
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(219,39,119,${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
            strokeWidth: 2,
          }}
          bezier
          style={{
            borderRadius: 16,
            marginTop: 15,
            marginLeft: -15, // Smooths out left margin layout clipping issues in react-native-chart-kit
          }}
        />
      )}
    </View>
  );
}