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
    <View className="bg-white rounded-sm p-5 mb-4" style={{borderWidth: 1,borderColor: 'white', width:'90%', marginLeft:'5%'}}>

      {/* TOP SECTION */}
      <View className="items-center mt-4">
        <View className="flex-row items-center justify-between gap-3 mb-3 px-3">
            <Image
              source={{uri: student.imageUrl}}
              className="w-20 h-20 rounded-full"
              resizeMode="cover"
            />
            <View>
              <Text className="text-xl text-center font-bold text-cyan-950">
                {student.fullName}
              </Text>
              <Text className="mt-1 text-sm" style={{color: COLORS.textSecondary}}>
                Grade {student.gradeLevel}{" • "} ID: {student.studentId}
              </Text>
            </View>
            
        </View>
        

        

      </View>

      {/* METRICS */}
      <View className="flex-row mt-6 gap-3">
        {/* RANK */}
        {!isKindergarten(student.gradeLevel) && (
          <View className="flex-1 rounded-2xl p-4 items-center" style={{backgroundColor: "#eef2ff"}}>
            <Text className="text-xs font-bold uppercase" style={{color: "#4f46e5"}}> Rank </Text>
            <Text className="text-2xl font-bold mt-2" style={{color: "#4338ca"}}>
              {ranks?.overall ?? "-"}
            </Text>
          </View>
        )}

        {/* AVERAGE */}
        <View className="flex-1 rounded-2xl p-4 items-center" style={{backgroundColor:"#ecfdf5",}}>
          <Text className="text-xs font-bold uppercase" style={{color: "#059669"}}>
            Average
          </Text>

          <Text className="text-2xl font-bold mt-2" style={{color: "#047857",}}>
            {overallAvg ? `${overallAvg.toFixed(1)}%` : "-"}
          </Text>
        </View>
      </View>
    </View>
  );
}