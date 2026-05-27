import { useEffect, useState } from "react";

import studentAuthService from "../services/studentAuthService";
import studentService from "../services/studentService";
import gradeService from "../services/gradeService";
import quizService from "../services/quizService";
import rankService from "../services/rankService";
import behavioralReportService from "../services/behavioralReportService";

const useParentDashboard = () => {

  const [student, setStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [reports, setReports] = useState([]);
  const [ranks, setRanks] = useState(null);
  const [quizzes, setQuizzes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {

    const load = async () => {
      setLoading(true);
      try {
       const currentStudent = await studentAuthService.getCurrentStudent();
        if (!current) {
          throw new Error("Not authenticated");
        }
        const [ studentRes, gradesRes, reportsRes] = await Promise.all([
          studentService.getStudentById( current._id),
          gradeService.getGradesByStudent(current._id),
          behavioralReportService.getReportsByStudent(current._id)
        ]);
console.log('gradesRes',gradesRes)

        const studentData = studentRes.data.data;
        const gradesData = gradesRes.data.data;
        const reportsData = reportsRes.data.data;

        setStudent(studentData);
        setGrades(gradesData);
        setReports(reportsData);

        // RANKS
        try {

          const rankRes =
            await rankService.getRankByStudent(
              studentData._id,
              studentData.gradeLevel,
              gradesData?.[0]?.academicYear
            );

          setRanks(rankRes);

        } catch (err) {
          console.warn("Rank error", err);
        }

        // QUIZZES
        try {
          const quizRes = await quizService.getAvailableQuizzes(
              studentData.gradeLevel,
              gradesData?.[0]?.academicYear
            );

          setQuizzes(
            quizRes.data.data || []
          );

        } catch (err) {
          console.warn("Quiz error", err);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }

    };

    load();

  }, []);

  return { student, grades, reports, ranks, quizzes, loading, error
  };
};

export default useParentDashboard;