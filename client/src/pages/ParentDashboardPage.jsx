import React, { useEffect, useState, lazy, Suspense } from "react";
// Import useTranslation to access i18n
import { useTranslation } from "react-i18next"; 

import useDashboardData from "../hooks/useDashboardData";
import useAnalytics from "../hooks/useAnalytics";

import DashboardHeader from "../components/parent-dashboard/DashboardHeader";
import DashboardTabs from "../components/parent-dashboard/DashboardTabs";
import DashboardSkeleton from "../components/parent-dashboard/DashboardSkeleton";
import FadeContainer from "../components/ui/FadeContainer";

import quizService from "../services/quizService";
import aiService from "../services/aiService";

// Lazy Loaded Components
const PerformanceChart = lazy(() => import("../components/parent-dashboard/PerformanceChart"));
const AcademicInsights = lazy(() => import("../components/parent-dashboard/AcademicInsights"));
const SemesterDetails = lazy(() => import("../components/parent-dashboard/SemesterDetails"));
const QuizCenter = lazy(() => import("../components/parent-dashboard/QuizCenter"));

const ParentDashboardPage = () => {
  const { i18n } = useTranslation(); // 1. Added translation hook
  const { student, grades, reports, ranks, loading, error } = useDashboardData();
  const analytics = useAnalytics(grades);

  const [activeTab, setActiveTab] = useState("overview");
  const[availableQuizzes, setAvailableQuizzes] = useState([]);
  const [quizStatuses, setQuizStatuses] = useState({});
  
  // 2. Fixed AI States (Removed duplicate, added missing setAiInsight)
  const[aiLoading, setAiLoading] = useState(false);
  const [activeAiSemester, setActiveAiSemester] = useState(null);
  const [aiInsights, setAiInsights] = useState({});
  const[aiInsight, setAiInsight] = useState(null); 

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

  // =========================================
  // AUTO-LOAD SAVED AI INSIGHTS
  // =========================================
  useEffect(() => {
    const checkSavedInsight = async (semesterName) => {
      // If we already loaded it into state, don't fetch again
      if (aiInsights[semesterName]) return;

      try {
        setAiLoading(true); // Optionally show loading skeleton
        const response = await aiService.getSavedSemesterInsight({
          studentId: student._id,
          semester: semesterName,
          academicYear: grades?.[0]?.academicYear,
          language: i18n.language
        });

        // If the database has it, update the state!
        if (response.data.insight) {
          setAiInsights(prev => ({
            ...prev,[semesterName]: response.data.insight
          }));
        }
      } catch (error) {
        console.error("Failed to check saved AI insights:", error);
      } finally {
        setAiLoading(false);
      }
    };

    if (activeTab === "semester-1") {
      checkSavedInsight("First Semester");
    } else if (activeTab === "semester-2") {
      checkSavedInsight("Second Semester");
    }
  },[activeTab, student, grades, i18n.language, aiInsights]);

  const fetchSemesterAI = async (semester, analytics, force = false) => {
    try {
      if (aiInsights[semester] && !force) {
        setActiveAiSemester(semester); 
        return;
      }

      setAiLoading(true);
      setActiveAiSemester(semester);

      const res = await aiService.generateSemesterInsight({
        studentId: student._id,
        semester,
        academicYear: grades?.[0]?.academicYear,
        analytics,
        language: i18n.language,
        forceRegenerate: force
      });

      setAiInsights(prev => ({ ...prev, [semester]: res.data.insight }));
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">
        {error}
      </div>
    );
  }

  const firstSemester = analytics?.semesterDetails?.["First Semester"] || [];
  const secondSemester = analytics?.semesterDetails?.["Second Semester"] ||[];

  const renderOverview = () => (
    <FadeContainer>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 transition-all hover:-translate-y-1 hover:shadow-md hover:bg-gray-200">
          <p className="text-sm text-slate-500">Overall Average</p>
          <h2 className="text-3xl font-black text-slate-800 mt-2">{analytics.overallAverage?.toFixed(1)}%</h2>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 transition-all hover:-translate-y-1 hover:shadow-md hover:bg-gray-200">
          <p className="text-sm text-slate-500">Subjects</p>
          <h2 className="text-3xl font-black text-slate-800 mt-2">{analytics.totalSubjects}</h2>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 transition-all hover:-translate-y-1 hover:shadow-md hover:bg-gray-200">
          <p className="text-sm text-slate-500">Assessments</p>
          <h2 className="text-3xl font-black text-slate-800 mt-2">{analytics.totalAssessments}</h2>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 transition-all hover:-translate-y-1 hover:shadow-md hover:bg-gray-200">
          <p className="text-sm text-slate-500">Best Subject</p>
          <h2 className="text-2xl font-black text-slate-800 mt-2">{analytics.bestSubject?.subject}</h2>
          <p className="text-pink-600 font-bold mt-2">{analytics.bestSubject?.percentage?.toFixed(1)}%</p>
        </div>
      </div>
    </FadeContainer>
  );

  const renderAnalytics = (semesterType) => {
    let semesterData =[];
    let semesterInsights = null;

    if (semesterType === "sem1") {
      semesterData = firstSemester;
      semesterInsights = analytics?.semesterInsights?.["First Semester"];
    } else if (semesterType === "sem2") {
      semesterData = secondSemester;
      semesterInsights = analytics?.semesterInsights?.["Second Semester"];
    }

    return (
      <FadeContainer>
        <section className="space-y-6">
          {semesterType === "overall" && (
            <Suspense fallback={<div className="h-40 bg-slate-100 animate-pulse rounded-xl" />}>
              <PerformanceChart chartData={analytics.chartData} />
            </Suspense>
          )}

          {/* 3. Added Suspense Boundary for Lazy AcademicInsights */}
          <Suspense fallback={<div className="h-20 bg-slate-100 animate-pulse rounded-xl" />}>
            {semesterType === "overall" ? (
              <AcademicInsights insights={analytics.insights} />
            ) : (
              <>
                <AcademicInsights insights={semesterInsights} />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {semesterData.map((subject, index) => (
                    <div key={index} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:bg-gray-200 transition-all duration-300">
                      <p className="text-sm font-bold text-slate-700">{subject.subjectName}</p>
                      <p className="text-pink-600 font-black text-xl mt-2">{subject.percentage?.toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Suspense>
        </section>
      </FadeContainer>
    );
  };

  const renderSemester = (semesterName, subjects, semesterRank) => (
    <FadeContainer>
      <Suspense fallback={<div className="h-64 bg-slate-100 animate-pulse rounded-xl" />}>
        <SemesterDetails 
           semesterName={semesterName} 
           subjects={subjects} 
           semesterRank={semesterRank} 
           reports={reports} 
           onGenerateAI={(force) => fetchSemesterAI(semesterName, subjects, force)}
           aiInsight={aiInsights[semesterName]}
           aiLoading={aiLoading && activeAiSemester === semesterName}
        />
      </Suspense>
    </FadeContainer>
  );

  // =========================================
  // MAIN UI
  // =========================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <DashboardHeader
          student={student}
          ranks={ranks}
          overallAvg={analytics.overallAverage}
        />

        <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === "overview" && renderOverview()}
        {activeTab === "analytics-overall" && renderAnalytics("overall")}
        {activeTab === "analytics-sem1" && renderAnalytics("sem1")}
        {activeTab === "analytics-sem2" && renderAnalytics("sem2")}
        {activeTab === "semester-1" && renderSemester("First Semester", firstSemester, ranks.sem1)}
        {activeTab === "semester-2" && renderSemester("Second Semester", secondSemester, ranks.sem2)}

        {activeTab === "quizzes" && (
          <FadeContainer>
            <Suspense fallback={<div className="h-40 bg-slate-100 animate-pulse rounded-xl" />}>
              <QuizCenter quizzes={availableQuizzes} quizStatuses={quizStatuses} />
            </Suspense>
          </FadeContainer>
        )}

      </div>
    </div>
  );
};

export default ParentDashboardPage;