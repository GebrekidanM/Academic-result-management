import React from "react";
import { View, ScrollView } from "react-native";
import Skeleton from "./Skeleton";

export default function DashboardSkeleton() {
  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ padding: 16, gap: 16}}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View className="bg-white rounded-2xl p-5" style={{ gap: 20 }}>
        <View className="flex-row items-center">
          <Skeleton style={{ width: 64, height: 64, borderRadius: 12 }} />

          <View style={{ flex: 1, marginLeft: 16, gap: 10 }}>
            <Skeleton style={{ height: 20, width: 180 }} />
            <Skeleton style={{ height: 16, width: 120 }} />
          </View>
        </View>

        <View className="flex-row gap-3">
          <Skeleton style={{ flex: 1, height: 64 }} />
          <Skeleton style={{ flex: 1, height: 64 }} />
        </View>
      </View>

      {/* TABS */}
      <View
        className="bg-white rounded-2xl p-3 flex-row"
        style={{ gap: 10 }}
      >
        <Skeleton style={{ width: 80, height: 44 }} />
        <Skeleton style={{ width: 80, height: 44 }} />
        <Skeleton style={{ width: 80, height: 44 }} />
        <Skeleton style={{ width: 80, height: 44 }} />
      </View>

      {/* STAT CARDS */}
      <View
        className="flex-row flex-wrap justify-between"
        style={{ gap: 12 }}
      >
        <Skeleton style={{ width: "48%", height: 140 }} />
        <Skeleton style={{ width: "48%", height: 140 }} />
        <Skeleton style={{ width: "48%", height: 140 }} />
        <Skeleton style={{ width: "48%", height: 140 }} />
      </View>

      {/* CHART */}
      <View
        className="bg-white rounded-2xl p-5"
        style={{ gap: 20 }}
      >
        <View>
          <Skeleton style={{ width: 180, height: 24, marginBottom: 10 }} />
          <Skeleton style={{ width: 250, height: 16 }} />
        </View>

        <Skeleton style={{ width: "100%", height: 250 }} />
      </View>

      {/* INSIGHTS */}
      <View style={{ gap: 12 }}>
        <Skeleton style={{ width: "100%", height: 150 }} />
        <Skeleton style={{ width: "100%", height: 150 }} />
        <Skeleton style={{ width: "100%", height: 150 }} />
        <Skeleton style={{ width: "100%", height: 150 }} />
      </View>
    </ScrollView>
  );
}