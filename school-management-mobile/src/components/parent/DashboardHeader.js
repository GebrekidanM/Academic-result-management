import React from "react";
import {View, Text, Image} from "react-native";
import { COLORS } from "../../utils/theme";

export default function DashboardHeader({student, ranks, overallAvg}) {
  if (!student) return null;

  const isKindergarten = (gradeLevel) => {
    if (!gradeLevel)
      return false;
    return /^(kg|nursery|pre)/i
      .test(gradeLevel);
  };

  return (
    <View
      className="bg-white rounded-sm p-5"
      style={{
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >

      {/* TOP SECTION */}

      <View className="items-center">
        <Image
          source={{uri: student.imageUrl}}
          className="w-28 h-28 rounded-3xl"
          resizeMode="cover"
        />

        <Text
          className="text-2xl font-bold mt-4"
          style={{
            color:
              COLORS.textPrimary,
          }}
        >
          {student.fullName}
        </Text>

        <Text
          className="mt-1 text-sm"
          style={{
            color:
              COLORS.textSecondary,
          }}
        >
          Grade {student.gradeLevel}
          {" • "}
          ID: {student.studentId}
        </Text>

      </View>

      {/* METRICS */}

      <View className="flex-row mt-6 gap-3">
        {/* RANK */}
        {!isKindergarten(
          student.gradeLevel
        ) && (
          <View
            className="flex-1 rounded-2xl p-4 items-center"
            style={{backgroundColor: "#eef2ff"}}
          >
            <Text
              className="text-xs font-bold uppercase"
              style={{color: "#4f46e5"}}
            >
              Rank
            </Text>

            <Text
              className="text-2xl font-bold mt-2"
              style={{color: "#4338ca"}}
            >
              {ranks?.overall ?? "-"}
            </Text>
          </View>
        )}

        {/* AVERAGE */}

        <View
          className="flex-1 rounded-2xl p-4 items-center"
          style={{backgroundColor:"#ecfdf5",}}
        >
          <Text
            className="text-xs font-bold uppercase"
            style={{color: "#059669"}}
          >
            Average
          </Text>

          <Text
            className="text-2xl font-bold mt-2"
            style={{color: "#047857",}}
          >
            {overallAvg
              ? `${overallAvg.toFixed(1)}%`
              : "-"}
          </Text>
        </View>
      </View>
    </View>
  );
}