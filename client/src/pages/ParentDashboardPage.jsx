import React, { useState, useEffect } from 'react';
import studentAuthService from '../services/studentAuthService';
import studentService from '../services/studentService';
import gradeService from '../services/gradeService';
import behavioralReportService from '../services/behavioralReportService';
import rankService from '../services/rankService';

const ParentDashboardPage = () => {
    // --- State Management ---
    const [student, setStudent] = useState(null);
    const [grades, setGrades] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rankBySemester, setRankBySemester] = useState({});

    // --- Data Fetching (remains the same) ---
    useEffect(() => {
        const currentStudent = studentAuthService.getCurrentStudent();
        if (currentStudent) {
            const studentId = currentStudent._id;
            const fetchData = async () => {
                try {
                    const results = await Promise.allSettled([
                        studentService.getStudentById(studentId),
                        gradeService.getGradesByStudent(studentId),
                        behavioralReportService.getReportsByStudent(studentId)
                    ]);
                    if (results[0].status === 'fulfilled') setStudent(results[0].value.data.data); else throw new Error('Could not fetch student profile.');
                    if (results[1].status === 'fulfilled') setGrades(results[1].value.data.data);
                    if (results[2].status === 'fulfilled') setReports(results[2].value.data.data);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        } else {
            setLoading(false);
            setError("Could not find logged in student information.");
        }
    }, []);

    const fetchSemesterRank = async (sem) => {
        if (!student) return;

        const academicYear = student.studentId.split('-')[1];

        const res = await rankService.getRank({
            studentId: student._id,
            academicYear,
            semester: sem,
            gradeLevel: student.gradeLevel
        });

        setRankBySemester(prev => ({
            ...prev,
            [sem]: res.data.rank
        }));
    };


    // --- Style Strings ---
    const card = "bg-white p-6 rounded-lg shadow-md mb-6";
    const sectionTitle = "text-xl font-bold text-gray-700 mb-3";
    const tableHeader = "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
    const tableCell = "px-4 py-2 whitespace-nowrap text-sm";


    if (loading) return <p className="text-center text-lg mt-8">Loading your child's information...</p>;
    if (error) return <p className="text-center text-red-500 mt-8">{error}</p>;

    return (
        <div>
            {/* --- Main Info Card --- */}
            <div className="bg-white w-full md:w-1/3 p-6 rounded-xl shadow-md mb-4">
                {/* Name */}
                <h2 className="text-2xl font-bold text-center mb-4">
                    {student.fullName}
                </h2>

                <div className="flex flex-col items-center gap-6">

                    {/* Profile Image */}
                    <img
                        src={student.imageUrl}
                        alt={student.fullName}
                        className="w-32 h-32 rounded-xl object-cover shadow"
                    />

                    {/* Info Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">

                        <div className="space-y-2 text-gray-700">
                            <p><span className="font-medium">Student ID:</span> {student.studentId}</p>
                            <p><span className="font-medium">Grade Level:</span> {student.gradeLevel}</p>
                            <p><span className="font-medium">Gender:</span> {student.gender}</p>
                            <p><span className="font-medium">Date of Birth:</span> {student.dateOfBirth || "N/A"}</p>
                            <p><span className="font-medium">Promotion Status:</span> {student.promotionStatus}</p>
                        </div>

                        <div className="space-y-2 text-gray-700">
                            <p><span className="font-medium">Mother Name:</span> {student.motherName}</p>
                            <p><span className="font-medium">Mother Contact:</span> {student.motherContact || "N/A"}</p>
                            <p><span className="font-medium">Father Contact:</span> {student.fatherContact || "N/A"}</p>
                            <p><span className="font-medium">Health Status:</span> {student.healthStatus}</p>
                            <p><span className="font-medium">Overall Average:</span> {student.overallAverage.toFixed(2)}</p>
                        </div>

                    </div>
                </div>
            </div>

            {/* --- NEW: Academic Grades Summary --- */}
            <div className={card}>
                <h3 className={sectionTitle}>Academic Performance by Semester</h3>
                {grades.length > 0 ? (
                    <div className="space-y-10">

                        {/* Group by Semester */}
                        {Object.entries(
                            grades.reduce((acc, g) => {
                                acc[g.semester] = acc[g.semester] || [];
                                acc[g.semester].push(g);
                                return acc;
                            }, {})
                        ).map(([semester, semesterGrades]) => {

                            // Fetch rank once
                            if (!rankBySemester[semester]) {
                                fetchSemesterRank(semester);
                            }

                            const total = semesterGrades.reduce(
                                (sum, g) => sum + g.finalScore, 0
                            );

                            const totalMarksPossible = semesterGrades.reduce(
                                (sum, g) => sum + g.assessments.reduce((s, a) => s + a.assessmentType?.totalMarks, 0), 0
                            );

                            const avg = ((total / totalMarksPossible) * 100).toFixed(2);


                            return (
                                <div key={semester} className="rounded-xl shadow bg-white p-4">
                                    <h4 className="text-xl font-bold mb-3 text-gray-700">
                                        Semester {semester}
                                    </h4>

                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className={tableHeader}>Subject</th>
                                                    <th className={tableHeader}>Month</th>
                                                    <th className={tableHeader}>Assessment</th>
                                                    <th className={tableHeader}>Result</th>
                                                    <th className={tableHeader}>Total</th>
                                                </tr>
                                            </thead>

                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {semesterGrades.map((grade) => {
                                                    
                                                    // Group assessments by month
                                                    const assessmentsByMonth = grade.assessments.reduce((acc, assess) => {
                                                        const month = assess.assessmentType?.month;
                                                        acc[month] = acc[month] || [];
                                                        acc[month].push(assess);
                                                        return acc;
                                                    }, {});
                                                    
                                                    const sumOutOf = grade.assessments.reduce((sum,asses)=>{
                                                        return sum + asses.assessmentType?.totalMarks
                                                    },0)
                                                                                                       

                                                    return (
                                                        Object.entries(assessmentsByMonth).map(([month, monthAssessments], monthIndex) => (
                                                            monthAssessments.map((assess, index) => (
                                                                <tr key={`${grade._id}-${month}-${index}`}>

                                                                    {/* Show subject once for all months */}
                                                                    {monthIndex === 0 && index === 0 && (
                                                                        <td
                                                                            className={`${tableCell} font-medium text-gray-900`}
                                                                            rowSpan={grade.assessments.length}
                                                                        >
                                                                            {grade.subject.name}
                                                                        </td>
                                                                    )}

                                                                    {/* Show Month once per month group */}
                                                                    {month && (
                                                                        <>
                                                                            {index === 0 && (
                                                                            <td
                                                                                className={`${tableCell} text-gray-500`}
                                                                                rowSpan={monthAssessments.length}
                                                                            >
                                                                                {month}
                                                                            </td>
                                                                            )}

                                                                            {/* Assessment name */}
                                                                            <td className={tableCell}>{assess.assessmentType?.name}</td>

                                                                            {/* Student Score */}
                                                                            <td className={tableCell}>
                                                                            {assess.score}/{assess.assessmentType?.totalMarks}
                                                                            </td>
                                                                        </>
                                                                    )}

                                                                    {monthIndex === 0 && index === 0 && (
                                                                        <td
                                                                            className={`${tableCell} font-bold`}
                                                                            rowSpan={grade.assessments.length}
                                                                        >
                                                                            {grade.finalScore}/{sumOutOf}
                                                                        </td>
                                                                    )}

                                                                </tr>
                                                            ))
                                                        ))
                                                    );
                                                })}
                                            </tbody>

                                            <tfoot className="bg-gray-100">
                                                <tr>
                                                    <td className={`${tableCell} font-bold`} colSpan={4}>Total</td>
                                                    <td className={`${tableCell} font-bold`}>{total}/{totalMarksPossible}</td>
                                                </tr>

                                                <tr>
                                                    <td className={`${tableCell} font-bold`} colSpan={4}>Average</td>
                                                    <td className={`${tableCell} font-bold`}>{avg}</td>
                                                </tr>

                                                <tr>
                                                    <td className={`${tableCell} font-bold`} colSpan={4}>Rank</td>
                                                    <td className={`${tableCell} font-bold`}>
                                                        {rankBySemester[semester] || "Loading..."}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                ) : (
                    <p className="text-gray-500">No academic grades have been recorded yet.</p>
                )}
            </div>


            {/* --- NEW: Behavioral Reports Summary --- */}
            <div className={card}>
                <h3 className={sectionTitle}>Recent Behavioral Reports</h3>
                {reports.length > 0 ? (
                    <div className="space-y-4">
                        {reports.map(report => (
                            <div key={report._id} className="p-4 border rounded-lg bg-gray-50">
                                <h4 className="font-bold text-gray-800">{report.semester} ({report.academicYear})</h4>
                                <p className="text-sm text-gray-600 mt-2"><strong>Comment:</strong> {report.teacherComment || 'N/A'}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No behavioral reports have been recorded yet.</p>
                )}
            </div>
        </div>
    );
};

export default ParentDashboardPage;