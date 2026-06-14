import { useMemo } from "react";

const useAnalytics = (grades = []) => {

  return useMemo(() => {

    if (!grades.length) {
      return {
        overallAverage: 0,
        totalSubjects: 0,
        totalAssessments: 0,
        bestSubject: null,
        subjectPerformance: [],
        insights: { critical: [], average: [], good: [], excellent: [] },
        chartData: {},
        semesterDetails: {},
        semesterInsights: {}
      };
    }

    let totalScore = 0;
    let totalMax = 0;
    let totalAssessments = 0;

    const subjectPerformance = [];
    const monthlyTotals = {};
    const semesterMap = {};

    // =====================================
    // PROCESS GRADES
    // =====================================

    grades.forEach((grade) => {

      const subjectName = grade.subject?.name || "Unknown";

      let subjectScore = 0;
      let subjectMax = 0;

      const groupedByMonth = {};

      grade.assessments?.forEach((assessment) => {

        const score = assessment.score || 0;
        const max = assessment?.assessmentType?.totalMarks || 0;
        const month = assessment?.assessmentType?.month || "Other";

        subjectScore += score;
        subjectMax += max;

        totalScore += score;
        totalMax += max;

        totalAssessments++;

        // =================================
        // MONTHLY TOTALS
        // =================================

        if (!monthlyTotals[month]) {
          monthlyTotals[month] = { obtained: 0, max: 0 };
        }

        monthlyTotals[month].obtained += score;
        monthlyTotals[month].max += max;

        // =================================
        // GROUP BY MONTH
        // =================================

        if (!groupedByMonth[month]) {
          groupedByMonth[month] = [];
        }

        groupedByMonth[month].push({
          id: assessment._id,
          name: assessment?.assessmentType?.name || "Assessment",
          score,
          totalMarks: max
        });

      });

      const percentage = subjectMax > 0 ? ((subjectScore / subjectMax) * 100) : 0;

      // =================================
      // SUBJECT PERFORMANCE
      // =================================

      subjectPerformance.push({
        subject: subjectName,
        percentage
      });

      // =================================
      // SEMESTER MAP
      // =================================

      const semester = grade.semester || "Unknown Semester";

      if (!semesterMap[semester]) {
        semesterMap[semester] = [];
      }

      semesterMap[semester].push({
        _id: grade._id,
        subjectName,
        score: subjectScore,
        totalMarks: subjectMax,
        percentage,
        groupedByMonth
      });

    });

    // =====================================
    // SORT SUBJECTS
    // =====================================

    subjectPerformance.sort((a, b) => b.percentage - a.percentage);

    // =====================================
    // OVERALL AVERAGE
    // =====================================

    const overallAverage = totalMax > 0 ? ((totalScore / totalMax) * 100) : 0;

    // =====================================
    // BEST SUBJECT
    // =====================================

    const bestSubject = subjectPerformance[0] || null;

    // =====================================
    // OVERALL INSIGHTS
    // =====================================

    const insights = { critical: [], average: [], good: [], excellent: [] };

    subjectPerformance.forEach((sub) => {

      const item = { name: sub.subject, pct: sub.percentage.toFixed(1) };

      if (sub.percentage < 60) {
        insights.critical.push(item);
      }

      else if (sub.percentage < 75) {
        insights.average.push(item);
      }

      else if (sub.percentage < 90) {
        insights.good.push(item);
      }

      else {
        insights.excellent.push(item);
      }

    });

    // =====================================
    // CHART DATA
    // =====================================

    const labels = Object.keys(monthlyTotals);

    const chartData = {
      labels,
      datasets: [{
        label: "Performance",
        data: labels.map((month) => {
          const monthData = monthlyTotals[month];
          return ((monthData.obtained / monthData.max) * 100).toFixed(1);
        }),
        borderColor: "rgb(219, 39, 119)",
        backgroundColor: "rgba(219, 39, 119, 0.15)",
        tension: 0.4,
        fill: true
      }]
    };

    // =====================================
    // SEMESTER DETAILS + INSIGHTS
    // =====================================

    const semesterDetails = {};
    const semesterInsights = {};

    Object.keys(semesterMap).forEach((semester) => {

      const subjects = semesterMap[semester];

      semesterDetails[semester] = subjects;

      const insightData = { critical: [], average: [], good: [], excellent: [] };

      subjects.forEach((sub) => {

        const item = {
          name: sub.subjectName,
          pct: sub.percentage.toFixed(1)
        };

        if (sub.percentage < 60) {
          insightData.critical.push(item);
        }

        else if (sub.percentage < 75) {
          insightData.average.push(item);
        }

        else if (sub.percentage < 90) {
          insightData.good.push(item);
        }

        else {
          insightData.excellent.push(item);
        }

      });

      semesterInsights[semester] = insightData;

    });

    // =====================================
    // RETURN
    // =====================================

    return {
      overallAverage,
      totalSubjects: grades.length,
      totalAssessments,
      bestSubject,
      subjectPerformance,
      insights,
      chartData,
      semesterDetails,
      semesterInsights
    };

  }, [grades]);

};

export default useAnalytics;