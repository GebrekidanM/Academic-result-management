import { View, Text, ScrollView, TouchableOpacity} from "react-native";
import { useState } from "react";
import { COLORS } from "../../src/utils/theme";

import useDashboardData from '../../src/hooks/useDashboardData'
import SemesterDetails from "../../src/components/parent/SemesterDetails";
import FadeContainer from "../../src/components/parent/FadeContainer";  
import useAnalytics from '../../src/hooks/useAnalytics'
import {student} from '../../src/hooks/useDashboardData'
import DashboardHeader from "../../src/components/parent/DashboardHeader";
import SemesterCard from "../../src/components/parent/SemesterCard";

export default function ParentDashboard() {
  const { student, grades, reports, ranks, loading, error } = useDashboardData();
  const analytics = useAnalytics(grades);

  const [activeTab, setActiveTab] = useState("semesters");

    const bg_primary = COLORS.primary;
    const bg_secondary = COLORS.secondary;
    const bg_background = COLORS.background;
    const bg_card = COLORS.card;
    const bg_textPrimary = COLORS.textPrimary;

    const renderSemester = ( semesterName, subjects, semesterRank, gradeLevel) => (
      <FadeContainer>
        <SemesterDetails
          semesterName={semesterName}
          subjects={subjects}
          semesterRank={semesterRank}
          gradeLevel={gradeLevel}
          reports={reports}
          onGenerateAI={(force) => fetchSemesterAI(semesterName,subjects,force)}
          aiInsight={aiInsights[semesterName]}
          aiLoading={aiLoading && activeAiSemester === semesterName}
        />
      </FadeContainer>
    );

    const firstSemester = analytics?.semesterDetails?.["First Semester"] || [];
    const secondSemester = analytics?.semesterDetails?.["Second Semester"] ||[];

    const calculateAverage = (subjects = []) => {
      if (subjects.length === 0) {return 0;}
      const total = subjects.reduce((sum, subject) => sum + (subject.percentage || 0), 0 );
      return total / subjects.length;
    };

  return (
    <View className="flex-1 bg-slate-100">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={{backgroundColor: bg_primary}} className={`px-6 pt-16 pb-8`}>
          <Text className="text-white text-3xl font-bold"> Parent Dashboard </Text>
          <Text className="text-blue-100 mt-2"> Welcome back </Text>
        </View>

        <DashboardHeader
            className="mt-6"
            student={student}
            ranks={ranks}
            overallAvg={analytics?.overall?.stats?.avg}
          />

        {/* TABS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-6 px-2"
        >
          {["semesters", "overview", "analytics", "quizzes"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`p-3 rounded-sm mr-3 ${ activeTab === tab ? "bg-pink-600" : "bg-white"}`}
            >
              <Text className={`font-semibold capitalize ${ activeTab === tab ? "text-white" : "text-slate-700"}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* CONTENT */}

        <View className="p-4">
          {activeTab === "overview" && (
            <View className="bg-white rounded-3xl p-5">
              <Text className="text-xl font-bold">
                Overview
              </Text>
            </View>
          )}

          {activeTab === "analytics" && (
            <View className="bg-white rounded-3xl p-5">
              <Text className="text-xl font-bold">
                Analytics
              </Text>
            </View>
          )}

          {activeTab === "semesters" && (
            <View className="bg-white rounded-sm p-5 flex flex-1 gap-3">
                <SemesterCard title="First Semester"
                  average={ calculateAverage(firstSemester)}
                  rank={ranks?.sem1}
                  gradeLevel={student?.gradeLevel}
                />

                <SemesterCard
                  title="Second Semester"
                  average={ calculateAverage(secondSemester)}
                  rank={ranks?.sem2}
                  gradeLevel={student?.gradeLevel}
                />
            </View>
          )}

          {activeTab === "quizzes" && (
            <View className="bg-white rounded-3xl p-5">
              <Text className="text-xl font-bold">
                Quizzes
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}