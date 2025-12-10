import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import studentService from '../services/studentService';
import gradeService from '../services/gradeService';
import behavioralReportService from '../services/behavioralReportService';
import rankService from '../services/rankService';

const ReportCardPage = () => {
    const { id } = useParams();
    
    // --- STATE ---
    const [student, setStudent] = useState(null);
    const [allGrades, setAllGrades] = useState([]);
    const [allReports, setAllReports] = useState([]);
    const [rank1stSem, setRank1stSem] = useState('-');
    const [rank2ndSem, setRank2ndSem] = useState('-');
    const [overallRank, setOverallRank] = useState('-');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- DATA LOADING ---
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // 1. Fetch Basic Data
                const [studentRes, gradesRes, reportsRes] = await Promise.all([
                    studentService.getStudentById(id),
                    gradeService.getGradesByStudent(id),
                    behavioralReportService.getReportsByStudent(id)
                ]);

                const studentData = studentRes.data.data;
                const reportsData = reportsRes.data.data;
                
                setStudent(studentData);
                setAllGrades(gradesRes.data.data);
                setAllReports(reportsData);

                // 2. Fetch Ranks if Student Exists
                if (studentData) {
                    const firstReport = reportsData.find(r => r.semester === 'First Semester');
                    const secondReport = reportsData.find(r => r.semester === 'Second Semester');
                    const academicYear = firstReport?.academicYear || '2018'; 
                    const gradeLevel = studentData.gradeLevel;

                    const rankPromises = [];
                    
                    // Sem 1 Rank
                    rankPromises.push(rankService.getRank({ studentId: id, academicYear, semester: 'First Semester', gradeLevel }));
                    
                    // Sem 2 Rank (only if exists)
                    if (secondReport) {
                        rankPromises.push(rankService.getRank({ studentId: id, academicYear, semester: 'Second Semester', gradeLevel }));
                    } else {
                        rankPromises.push(Promise.resolve(null));
                    }
                    
                    // Overall Rank
                    rankPromises.push(rankService.getOverallRank({ studentId: id, academicYear, gradeLevel }));

                    // Resolve all ranks
                    const [rank1Res, rank2Res, overallRankRes] = await Promise.allSettled(rankPromises);

                    if (rank1Res.status === 'fulfilled') setRank1stSem(rank1Res.value.data.rank);
                    if (rank2Res.status === 'fulfilled' && rank2Res.value) setRank2ndSem(rank2Res.value.data.rank);
                    if (overallRankRes.status === 'fulfilled') setOverallRank(overallRankRes.value.data.rank);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load report card data.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [id]);

    // --- CALCULATIONS: Process Grades ---
    const processedResults = useMemo(() => {
        if (!allGrades || allGrades.length === 0) return [];
        const subjectMap = new Map();
        
        allGrades.forEach(grade => {
            // Ensure subject exists before accessing properties
            if (!grade.subject) return; 

            const subjectId = grade.subject._id;
            const subjectName = grade.subject.name;
            
            if (!subjectMap.has(subjectId)) {
                subjectMap.set(subjectId, { subjectName, firstSemester: null, secondSemester: null });
            }
            
            const subjectEntry = subjectMap.get(subjectId);
            if (grade.semester === 'First Semester') subjectEntry.firstSemester = grade.finalScore;
            else if (grade.semester === 'Second Semester') subjectEntry.secondSemester = grade.finalScore;
        });

        // Calculate Subject Averages
        subjectMap.forEach(subject => {
            const scores = [subject.firstSemester, subject.secondSemester].filter(s => s !== null && s !== undefined);
            subject.average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
        });

        return Array.from(subjectMap.values());
    }, [allGrades]);

    // --- CALCULATIONS: Final Summary ---
    const finalSummary = useMemo(() => {
        if (processedResults.length === 0) return null;
        const summary = {
            total1st: processedResults.reduce((sum, sub) => sum + (sub.firstSemester || 0), 0),
            total2nd: processedResults.reduce((sum, sub) => sum + (sub.secondSemester || 0), 0),
        };
        
        const numSubjects = processedResults.length;
        summary.average1st = numSubjects > 0 ? summary.total1st / numSubjects : 0;
        summary.average2nd = numSubjects > 0 ? summary.total2nd / numSubjects : 0;
        
        // Overall Average
        summary.overallTotal = (summary.total1st + summary.total2nd); 
        summary.overallAverage = (summary.average1st + summary.average2nd) / 2;
        
        return summary;
    }, [processedResults]);

    // --- HELPERS ---
    const firstSemesterReport = allReports.find(r => r.semester === 'First Semester');
    const secondSemesterReport = allReports.find(r => r.semester === 'Second Semester');
    const EVALUATION_AREAS = ["Punctuality", "Attendance", "Responsibility", "Respect", "Cooperation", "Initiative", "Completes Work"];
    
    const calculateAge = (dob) => { 
        if(!dob) return '-'; 
        const d = new Date(dob); 
        return new Date().getFullYear() - d.getFullYear(); 
    };

    if (loading) return <div className="p-10 text-center">Loading Report...</div>;
    if (error) return <div className="p-10 text-center text-red-600">{error}</div>;

    return (
        <div className="report-card-container print-layout-portrait">
            
            {/* Top Controls (Hidden on Print) */}
            <div className="no-print" style={{width:'210mm', display:'flex', justifyContent:'space-between', marginBottom:15}}>
                <Link to={`/students/${id}`} style={{fontWeight:'bold', color: '#1a365d', textDecoration:'none'}}>
                    &larr; Back to Student
                </Link>
                <button onClick={() => window.print()} style={{background:'#1a365d', color:'white', padding:'8px 16px', borderRadius:4, cursor:'pointer', border:'none', fontWeight:'bold'}}>
                    🖨️ Print Report
                </button>
            </div>

            {/* ======================= */}
            {/* PAGE 1: FRONT (Academic) */}
            {/* ======================= */}
            <div className="sheet">
                
                {/* Header */}
                <div className="header-section">
                    <h1>Freedom KG & Primary School</h1>
                    <p>Address: Addis Ababa, Ethiopia | OFFICIAL REPORT CARD</p>
                </div>

                {/* Student Profile Card */}
                <div className="student-card">
                    {student?.imageUrl ? (
                        <img src={student.imageUrl} className="student-photo" alt="Student" />
                    ) : (
                        <div className="student-photo"></div>
                    )}
                    
                    <div className="student-info">
                        <div className="info-row">
                            <label>Name / ስም:</label> <span>{student?.fullName}</span>
                        </div>
                        <div className="info-row">
                            <label>ID No / መለያ ቁጥር:</label> <span>{student?.studentId}</span>
                        </div>
                        <div className="info-row">
                            <label>Grade / ክፍል:</label> <span>{student?.gradeLevel}</span>
                        </div>
                        <div className="info-row">
                            <label>Academic Year / ዘመን:</label> <span>{firstSemesterReport?.academicYear || '2018'}</span>
                        </div>
                        <div className="info-row">
                            <label>Gender / ጾታ:</label> <span>{student?.gender}</span>
                        </div>
                        <div className="info-row">
                            <label>Age / ዕድሜ:</label> <span>{calculateAge(student?.dateOfBirth)}</span>
                        </div>
                    </div>
                </div>

                {/* Academic Table */}
                <h3 className="section-title">Academic Achievement</h3>
                <table className="academic-table">
                    <thead>
                        <tr>
                            <th style={{width:'40%'}}>Subject</th>
                            <th>1st Sem</th>
                            <th>2nd Sem</th>
                            <th>Average</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedResults.map((r, i) => (
                            <tr key={i}>
                                <td>{r.subjectName}</td>
                                <td>{r.firstSemester ?? '-'}</td>
                                <td>{r.secondSemester ?? '-'}</td>
                                <td>{r.average?.toFixed(1) ?? '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td><strong>TOTAL SCORE</strong></td>
                            <td><strong>{finalSummary?.total1st.toFixed(0)}</strong></td>
                            <td><strong>{finalSummary?.total2nd.toFixed(0)}</strong></td>
                            <td><strong>{finalSummary?.overallTotal.toFixed(0)}</strong></td>
                        </tr>
                        <tr>
                            <td><strong>AVERAGE</strong></td>
                            <td><strong>{finalSummary?.average1st.toFixed(1)}</strong></td>
                            <td><strong>{finalSummary?.average2nd.toFixed(1)}</strong></td>
                            <td><strong>{finalSummary?.overallAverage.toFixed(1)}</strong></td>
                        </tr>
                        
                        {/* RANK ROW - Uses special CSS class for styling */}
                        <tr className="rank-row">
                            <td>CLASS RANK</td>
                            <td>{rank1stSem}</td>
                            <td>{rank2ndSem}</td>
                            <td>{overallRank}</td>
                        </tr>
                    </tfoot>
                </table>

                {/* Footer (Bilingual) */}
                <div className="footer-info">
                    <div><strong>Promoted To / ወደ ... ተዛውሯል:</strong> _______________________</div>
                    <div><strong>Date / ቀን:</strong> _______________________</div>
                </div>
            </div>

            {/* ======================= */}
            {/* PAGE 2: BACK (Behavior) */}
            {/* ======================= */}
            <div className="sheet">
                
                {/* Header for Page 2 */}
                <div style={{textAlign:'center', borderBottom:'1px solid #ccc', marginBottom:20, paddingBottom:10}}>
                    <h2 style={{margin:0, color:'#555', fontSize:16}}>{student?.fullName} - {student?.studentId}</h2>
                </div>

                <div style={{display:'flex', gap:30}}>
                    {/* Left Col: Traits */}
                    <div style={{flex:1}}>
                        <h3 className="section-title">Behavioral Traits</h3>
                        <table className="behavior-table">
                            <thead>
                                <tr><th>Trait</th><th>Sem 1</th><th>Sem 2</th></tr>
                            </thead>
                            <tbody>
                                {EVALUATION_AREAS.map(area => (
                                    <tr key={area}>
                                        <td>{area}</td>
                                        <td>{firstSemesterReport?.evaluations.find(e => e.area === area)?.result ?? '-'}</td>
                                        <td>{secondSemesterReport?.evaluations.find(e => e.area === area)?.result ?? '-'}</td>
                                    </tr>
                                ))}
                                <tr style={{background:'#f0f0f0', fontWeight:'bold'}}>
                                    <td>Conduct Grade</td>
                                    <td>{firstSemesterReport?.conduct ?? '-'}</td>
                                    <td>{secondSemesterReport?.conduct ?? '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div style={{fontSize:10, background:'#eee', padding:5, border:'1px solid #ccc'}}>
                            <strong>Key:</strong> E=Excellent, VG=Very Good, G=Good, NI=Needs Improvement
                        </div>
                    </div>

                    {/* Right Col: Comments */}
                    <div style={{flex:1}}>
                        <div className="comments-container">
                            <div className="comment-box">
                                <h4>Teacher's Comment (Sem 1)</h4>
                                <div className="lines">{firstSemesterReport?.teacherComment}</div>
                            </div>
                            <div className="comment-box">
                                <h4>Teacher's Comment (Sem 2)</h4>
                                <div className="lines">{secondSemesterReport?.teacherComment}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <div className="signatures-section">
                    <div className="sig-box">
                        <div className="sig-line"></div>
                        <span>Homeroom Teacher</span>
                    </div>
                    <div className="sig-box">
                        <div className="sig-line"></div>
                        <span>Director</span>
                    </div>
                    <div className="sig-box">
                        <div className="sig-line"></div>
                        <span>Parent</span>
                    </div>
                </div>

                {/* Message to Parents (Bilingual) */}
                <div className="message-box">
                    <h5>Message to parents / ለወላጆች መልእክት</h5>
                    <p>The above report card primarily focuses on your child's behavioral development in various aspects, but it cannot encompass everything about your child. These are keys to your child's academic success. We would like you to pay attention to this progress report card and assess your child at home.</p>
                    <hr style={{margin:'10px 0', border:0, borderTop:'1px dashed #ccc'}}/>
                    <p style={{fontFamily: 'Noto Sans Ethiopic'}}>በሰርተፍኬት ላይ የሰፈረው ውጤት የልጅዎ የጠባይ እድገት እና ለውጥ በተለየ ምልከታ እና ምዘና መሰረት የተገለፀ ነው ነገር ግን ሁሉንም ነገር አይገልፅም ፡፡ውጤቱን በአፅኖት ተመለክተው በቤት ውስጥ እርዳታ እና ክትትል እንድታደርጉ በአክብሮት እንጠይቃለን፡፡ ይህ ለልጆ የእውቀት መጨመር ቁልፍ ነገር ነው፡፡</p>
                </div>
            </div>
        </div>
    );
};

export default ReportCardPage;