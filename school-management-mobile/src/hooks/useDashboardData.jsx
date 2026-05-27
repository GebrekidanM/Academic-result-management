import { useEffect, useState } from "react";

import studentAuthService from "../services/studentAuthService";
import studentService from "../services/studentService";
import gradeService from "../services/gradeService";
import rankService from "../services/rankService";

const useDashboardData = () => {
  const [student, setStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [ranks, setRanks] = useState({});
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

       const currentStudent = await studentAuthService.getCurrentStudent();
        if (!currentStudent) throw new Error("No authenticated student");

        // 1. Student
        const studentRes = await studentService.getStudentById(currentStudent._id);
        const studentData = studentRes.data.data;
        setStudent(studentData);

        // 2. Grades
        const gradesRes = await gradeService.getGradesByStudent(currentStudent._id);
        const gradeData = gradesRes.data.data || [];
        setGrades(gradeData);

        // 3. Academic Year
        const academicYear =
          gradeData.length > 0 ? gradeData[0].academicYear : "2018";

        // 4. Ranks
        const rankRes = await rankService.getRankByStudent(
          studentData._id,
          studentData.gradeLevel,
          academicYear
        );
        setRanks(rankRes);

        // 5. Basic Analytics (LEVEL 1 only)
        let totalScore = 0;
        let totalMax = 0;

        gradeData.forEach((g) => {
          g.assessments.forEach((a) => {
            totalScore += a.score || 0;
            totalMax += a.assessmentType?.totalMarks || 0;
          });
        });

        const avg = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;

        setAnalytics({
          overall: {
            stats: {
              avg
            }
          }
        });

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return {
    student,
    grades,
    ranks,
    analytics,
    loading,
    error
  };
};

export default useDashboardData;