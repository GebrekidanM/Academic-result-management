import { View, Text, ScrollView, TouchableOpacity} from "react-native";
import { useState,useEffect } from "react";
import { COLORS } from "../../src/utils/theme";
import { StatusBar } from "expo-status-bar";

import { useTranslation } from "react-i18next";
import useDashboardData from '../../src/hooks/useDashboardData'
import SemesterDetails from "../../src/components/parent/SemesterDetails";
import FadeContainer from "../../src/components/parent/FadeContainer";  
import useAnalytics from '../../src/hooks/useAnalytics'
import {student} from '../../src/hooks/useDashboardData'
import DashboardHeader from "../../src/components/parent/DashboardHeader";
import SemesterCard from "../../src/components/parent/SemesterCard";
import SemesterDetailsContainer from "../../src/components/parent/SemesterDetailsContainer";

import PerformanceChart from "../../src/components/parent/PerformanceChart";
import AcademicInsights from "../../src/components/parent/AcadamicInsights";
import QuizCenter from "../../src/components/parent/QuizCenter";
import quizService from "../../src/services/quizService";
import DashboardSkeleton from "../../src/components/parent/DashboardSkeleton";

export default function ParentDashboard() {
  const {t} = useTranslation();
  const { student, grades, reports, ranks, loading, error } = useDashboardData();
  const analytics = useAnalytics(grades);

  const [activeTab, setActiveTab] = useState("semesters");
  const [selectedSemester, setSelectedSemester] =useState('');
  const [activeSem,setActiveSem] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [quizStatuses, setQuizStatuses] = useState({});

  const bg_primary = COLORS.primary;
  const bg_secondary = COLORS.secondary;
  const bg_background = COLORS.background;
  const bg_card = COLORS.card;
  const bg_textPrimary = COLORS.textPrimary;

    useEffect(() => {
      const loadQuizzes = async () => {
        if (!student) return;
        try {
          const academicYear = grades?.[0]?.academicYear;
          const response = await quizService.getAvailableQuizzes(student.gradeLevel, academicYear);
          const quizzes = response.data.data ||[];
          setAvailableQuizzes(quizzes);
          
          try {
            const statusPromises = quizzes.map(async (quiz) => {
              try {
                const response = await quizService.getQuizStatus(quiz._id);
                return { quizId: quiz._id, status: response.data };
              } catch (err) {
                console.error(`Failed loading status for ${quiz._id}`, err);
                return { quizId: quiz._id, status: null };
              }
            });
            const statuses = await Promise.all(statusPromises);
            const formattedStatuses = {};
            statuses.forEach((item) => { formattedStatuses[item.quizId] = item.status; });
            setQuizStatuses(formattedStatuses);
          } catch (err) {
            console.error("Quiz status batch failed", err);
          }
        } catch (err) {
          console.error(err);
        }
      };
      loadQuizzes();
    }, [student, grades]);

    
    const firstSemester = analytics?.semesterDetails?.["First Semester"] || [];
    const secondSemester = analytics?.semesterDetails?.["Second Semester"] ||[];

    const renderAnalytics = (semesterType) => {
      let semesterData = [];
      let semesterInsights = null;

      if (semesterType === "sem1") {
        semesterData = firstSemester;
        semesterInsights = analytics?.semesterInsights?.["First Semester"];
      } 
      else if (semesterType === "sem2") {
        semesterData =  secondSemester;
        semesterInsights = analytics?.semesterInsights?.["Second Semester"];
      }

      return (
        <FadeContainer>
          <View className="gap-5">
            <PerformanceChart chartData={ analytics.chartData}/>
            <AcademicInsights insights={ semesterInsights }/>
          </View>
        </FadeContainer>
      );
    };


    const calculateAverage = (subjects = []) => {
      if (subjects.length === 0) {return 0;}
      const total = subjects.reduce((sum, subject) => sum + (subject.percentage || 0), 0 );
      return total / subjects.length;
    };


  if(loading) return (<DashboardSkeleton/>)

 return (
    <View className="flex-1 bg-slate-100">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10, paddingBottom: 40 }}>
        <DashboardHeader student={student} ranks={ranks} overallAvg={analytics?.overallAverage} />

        {/* TABS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ width: "90%", marginLeft: "5%" }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {["semester", "analytics", "quizzes"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab === "semester" ? "semesters" : tab)}
              className={`p-3 rounded-sm ${
                (activeTab === "semesters" && tab === "semester") || activeTab === tab 
                  ? "bg-pink-600" 
                  : "bg-white"
              }`}
            >
              <Text
                className={`font-semibold ${
                  (activeTab === "semesters" && tab === "semester") || activeTab === tab 
                    ? "text-white" 
                    : "text-slate-700"
                }`}
              >
                {t(tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* CONTENT */}
        <View className="p-4">
          {activeTab === "analytics" && 
            <View className="mt-5 flex flex-1 gap-3">
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setSelectedSemester("sem1")}
                  className={`px-5 py-3 rounded-sm ${selectedSemester === "sem1" ? "bg-green-600" : "bg-white"}`}
                >
                  <Text className={`font-bold ${selectedSemester === "sem1" ? "text-white" : "text-black"}`}>
                    {t('sem_1')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSelectedSemester("sem2")}
                  className={`px-5 py-3 rounded-sm ${selectedSemester === "sem2" ? "bg-green-600" : "bg-white"}`}
                >
                  <Text className={`font-bold ${selectedSemester === "sem2" ? "text-white" : "text-black"}`}>
                    {t('sem_2')}
                  </Text>
                </TouchableOpacity>
              </View>
              {renderAnalytics(selectedSemester)}
            </View>
          }
          
          {activeTab === "semesters" && (
            <View className="mt-5 flex flex-1 gap-3">
                <View className="bg-white rounded-sm p-5 flex flex-1 gap-3">
                  
                  {/* FIRST SEMESTER CARD */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedSemester("sem1");
                      setActiveSem("sem1"); 
                    }}
                  >
                    <SemesterCard
                      title={t('sem_1')}
                      semesterKey="sem1"
                      average={calculateAverage(firstSemester)}
                      rank={ranks?.sem1}
                      gradeLevel={student?.gradeLevel}
                      isActive={activeSem === "sem1"}
                    />
                  </TouchableOpacity>

                  {/* SECOND SEMESTER CARD */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedSemester("sem2");
                      setActiveSem("sem2");
                    }}
                  >
                    <SemesterCard
                      title={t('sem_2')}
                      semesterKey="sem2"
                      average={calculateAverage(secondSemester)}
                      rank={ranks?.sem2}
                      gradeLevel={student?.gradeLevel}
                      isActive={activeSem === "sem2"}
                    />
                  </TouchableOpacity>
                </View>

                {/* RENDER DETAILS SECTION */}
                {selectedSemester && <SemesterDetailsContainer semester={selectedSemester === "sem1" ? 'First Semester' : 'Second Semester'} />}
              </View>
          )}

          {activeTab === "quizzes" && (
            <FadeContainer>
              <QuizCenter quizzes={availableQuizzes} quizStatuses={quizStatuses} />
            </FadeContainer>
          )}
        </View>
      </ScrollView>
    </View>
  );
}