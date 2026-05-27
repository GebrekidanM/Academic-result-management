import React from "react";
import { View, Text, TouchableOpacity} from "react-native";
import { router } from "expo-router";
import { COLORS } from "../../utils/theme";

export default function SemesterCard({ title, average, rank, gradeLevel}) {
  const isKindergarten = /^(kg|nursery|pre)/i.test(gradeLevel || "");

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          pathname: "/parent/semester-details",
          params: {semester: title },
        })
      }
    >

      <View
        className="bg-white rounded-3xl p-5"
        style={{ borderWidth: 1, borderColor: COLORS.border}}
      >
        <Text
          className="text-xl font-bold"
          style={{ color: COLORS.textPrimary}}
        >
          {title}
        </Text>

        <Text
          className="mt-1"
          style={{ color: COLORS.textSecondary }}
        >
          Tap to view details
        </Text>

        {/* STATS */}
        <View className="flex-row gap-3 mt-5">
          {/* AVG */}
          <View
            className="flex-1 rounded-2xl p-4"
            style={{ backgroundColor: "#fdf2f8" }}
          >
            <Text
              className="text-xs font-bold uppercase"
              style={{ color: "#be185d" }}
            >
              Average
            </Text>

            <Text
              className="text-2xl font-bold mt-2"
              style={{
                color: "#9d174d",
              }}
            >
              {average?.toFixed(1)}%
            </Text>
          </View>

          {/* RANK */}
          {!isKindergarten && (
            <View
              className="flex-1 rounded-2xl p-4"
              style={{ backgroundColor: "#eef2ff" }}
            >
              <Text
                className="text-xs font-bold uppercase"
                style={{
                  color: "#4338ca",
                }}
              >
                Rank
              </Text>

              <Text
                className="text-2xl font-bold mt-2"
                style={{
                  color: "#4338ca",
                }}
              >
                {rank || "-"}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}