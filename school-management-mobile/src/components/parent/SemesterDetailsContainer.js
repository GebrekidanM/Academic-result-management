import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SemesterDetails from "./SemesterDetails";
import { COLORS } from "../../utils/theme";
import useDashboardData from "../../hooks/useDashboardData";
import aiService from "../../services/aiService";
import FadeContainer from "./FadeContainer";

export default function SemesterDetailsScreen({semester}) {
  const { grades, reports, ranks, student, loading } = useDashboardData();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  
  useEffect(() => {
    const loadSavedInsight = async () => {
        try {
            const response = await aiService.getSavedSemesterInsight({
                    studentId: student?._id,
                    semester,
                    academicYear: grades?.[0]?.academicYear,
                    language:"en",
                });

            if (response.data.insight) {
                setAiInsight( response.data.insight);
            }
        } catch (err) {
            console.log(err);
        }
    };

  if (student && grades.length > 0) {
    loadSavedInsight();
  }
}, [student, grades]);
  
  
  // LOADING
  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: COLORS.background}}
      >
        <Text style={{ color: COLORS.textPrimary }}> Loading... </Text>
      </SafeAreaView>
    );
  }

  // SEMESTER DATA
  const semesterSubjects = grades.filter( (item) => item.semester === semester);
  // RANK
  const semesterRank = semester === "First Semester" ? ranks?.sem1 : ranks?.sem2;

  const formattedSubjects = semesterSubjects.map((item) => {
    const totalMarks = item.assessments.reduce((sum, assessment) => sum + (assessment?.assessmentType?.totalMarks || 0), 0);
    const score = item.assessments.reduce( (sum, assessment) => sum + (assessment.score || 0), 0 );
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;

    // GROUP BY MONTH
    const groupedByMonth = {};
    item.assessments.forEach(
      (assessment) => {
        const month = assessment?.assessmentType?.month || "Unknown";
        if (!groupedByMonth[month]) {
          groupedByMonth[month] = [];
        }

        groupedByMonth[month].push({
          id: assessment._id,
          name: assessment ?.assessmentType ?.name,
          score: assessment.score,
          totalMarks: assessment ?.assessmentType ?.totalMarks,
        });
      }
    );

    return {
      id: item._id,
      subjectName: item.subject?.name,
      score,
      totalMarks,
      percentage,
      groupedByMonth,
    };
  });

  const fetchSemesterAI = async (force = false) => {
        try {
            if (aiInsight && !force) {
                return;
            }
            setAiLoading(true);

            const response = await aiService.generateSemesterInsight({
                studentId: student?._id,
                semester,
                academicYear: grades?.[0] ?.academicYear,
                analytics: formattedSubjects,
                language: "en",
                forceRegenerate: force,
            });

            setAiInsight(response.data.insight);
        } catch (err) {
            console.log(err);
        } finally {
            setAiLoading(false);
        }
    };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: COLORS.background }}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40}}>
        {/* HEADER */}
        <View className="mb-5">
          <Text
            className="text-3xl font-bold"
            style={{ color: COLORS.textPrimary}}
          >
            {semester}
          </Text>

          <Text
            className="mt-1"
            style={{ color: COLORS.textSecondary }}
          >
            Academic performance details
          </Text>
        </View>
        
        <FadeContainer>
         <SemesterDetails
            semesterName={semester}
            subjects={formattedSubjects}
            semesterRank={semesterRank}
            reports={reports}
            gradeLevel={ student?.gradeLevel}
            aiInsight={aiInsight}
            aiLoading={aiLoading}
            onGenerateAI={fetchSemesterAI}
         />
        </FadeContainer>
      </ScrollView>
    </SafeAreaView>
  );
}