import React from "react";
import { View, Text } from "react-native";

const styles = {
  excellent: { bg: "#ecfdf5", border: "#bbf7d0", title: "#15803d"},
  good: {bg: "#eff6ff", border: "#bfdbfe", title: "#2563eb"},
  average: { bg: "#fefce8", border: "#fde68a", title: "#ca8a04"},
  critical: { bg: "#fef2f2", border: "#fecaca", title: "#dc2626"}
};

export default function InsightCard({type, title, subjects = []}) {
  const style = styles[type];

  return (
    <View className="rounded-xl p-5" style={{ backgroundColor: style.bg, borderWidth: 1, borderColor: style.border }}>

      {/* HEADER */}
      <View className="flex-row items-center justify-between mb-5">
        <Text className="text-xs uppercase font-bold" style={{color: style.title, letterSpacing: 1}}>
          {title}
        </Text>

        <View className="bg-white px-3 py-1 rounded-xl">
          <Text className="text-xs font-bold text-slate-700">
            {subjects.length}
          </Text>
        </View>
      </View>

      {/* CONTENT */}
      {subjects.length === 0 ? (<Text className="text-sm italic text-slate-400"> No subjects available</Text>) 
      : (
        <View className="gap-3">
          {subjects.map((subject, index) => (
            <View key={index} className="bg-white rounded-sm px-4 py-3 flex-row items-center justify-between">
              <Text className="font-bold" style={{ color: "#334155" }}> {subject.name} </Text>
              <Text className="text-sm font-bold" style={{ color: "#0f172a" }}>{subject?.pct}%</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}