import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import studentService from '../services/studentService';
import gradeService from '../services/gradeService';
import behavioralReportService from '../services/behavioralReportService';
import rankService from '../services/rankService';
import './ReportCard.css';

const ReportCardPage = () => {
    const { id } = useParams();
    
    // --- STATE & DATA LOADING (Same as before) ---
    const [student, setStudent] = useState(null);
    const [allGrades, setAllGrades] = useState([]);
    const [allReports, setAllReports] = useState([]);
    const [rank1stSem, setRank1stSem] = useState('-');
    const [rank2ndSem, setRank2ndSem] = useState('-');
    const [overallRank, setOverallRank] = useState('-');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
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

                if (studentData) {
                    const firstReport = reportsData.find(r => r.semester === 'First Semester');
                    const secondReport = reportsData.find(r => r.semester === 'Second Semester');
                    const academicYear = firstReport?.academicYear || '2018';
                    const gradeLevel = studentData.gradeLevel;

                    const rankPromises = [];
                    rankPromises.push(rankService.getRank({ studentId: id, academicYear, semester: 'First Semester', gradeLevel }));
                    if (secondReport) rankPromises.push(rankService.getRank({ studentId: id, academicYear, semester: 'Second Semester', gradeLevel }));
                    else rankPromises.push(Promise.resolve(null));
                    rankPromises.push(rankService.getOverallRank({ studentId: id, academicYear, gradeLevel }));

                    const [rank1Res, rank2Res, overallRankRes] = await Promise.allSettled(rankPromises);
                    if (rank1Res.status === 'fulfilled') setRank1stSem(rank1Res.value.data.rank);
                    if (rank2Res.status === 'fulfilled' && rank2Res.value) setRank2ndSem(rank2Res.value.data.rank);
                    if (overallRankRes.status === 'fulfilled') setOverallRank(overallRankRes.value.data.rank);
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchAllData();
    }, [id]);

    const processedResults = useMemo(() => {
        if (!allGrades || allGrades.length === 0) return [];
        const subjectMap = new Map();
        allGrades.forEach(grade => {
            const subjectId = grade.subject._id;
            const subjectName = grade.subject.name;
            if (!subjectMap.has(subjectId)) subjectMap.set(subjectId, { subjectName, firstSemester: null, secondSemester: null });
            const subjectEntry = subjectMap.get(subjectId);
            if (grade.semester === 'First Semester') subjectEntry.firstSemester = grade.finalScore;
            else if (grade.semester === 'Second Semester') subjectEntry.secondSemester = grade.finalScore;
        });
        subjectMap.forEach(subject => {
            const scores = [subject.firstSemester, subject.secondSemester].filter(s => s !== null);
            subject.average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
        });
        return Array.from(subjectMap.values());
    }, [allGrades]);

    const finalSummary = useMemo(() => {
        if (processedResults.length === 0) return null;
        const summary = {
            total1st: processedResults.reduce((sum, sub) => sum + (sub.firstSemester || 0), 0),
            total2nd: processedResults.reduce((sum, sub) => sum + (sub.secondSemester || 0), 0),
        };
        const numSubjects = processedResults.length;
        summary.average1st = numSubjects > 0 ? summary.total1st / numSubjects : 0;
        summary.average2nd = numSubjects > 0 ? summary.total2nd / numSubjects : 0;
        summary.overallTotal = (summary.total1st + summary.total2nd) / 2;
        summary.overallAverage = (summary.average1st + summary.average2nd) / 2;
        return summary;
    }, [processedResults]);

    const firstSemesterReport = allReports.find(r => r.semester === 'First Semester');
    const secondSemesterReport = allReports.find(r => r.semester === 'Second Semester');
    const EVALUATION_AREAS = ["Punctuality", "Attendance", "Responsibility", "Respect", "Cooperation", "Initiative", "Completes Work"];
    const calculateAge = (dob) => { if(!dob) return '-'; const d = new Date(dob); return new Date().getFullYear() - d.getFullYear(); };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="report-card-container">
            <div className="no-print" style={{width:'210mm', display:'flex', justifyContent:'space-between', marginBottom:15}}>
                <Link to={`/students/${id}`} style={{fontWeight:'bold'}}>Back to Student</Link>
                <button onClick={() => window.print()} style={{background:'#1a365d', color:'white', padding:'8px 15px', borderRadius:4, cursor:'pointer'}}>Print Report</button>
            </div>

            {/* ===== PAGE 1: ACADEMICS ===== */}
            <div className="sheet">
                {/* Header */}
                <div className="header-section">
                    <h1>Freedom KG & Primary School</h1>
                    <p>Address: Addis Ababa, Ethiopia | OFFICIAL REPORT CARD</p>
                </div>

                {/* Profile */}
                <div className="student-card">
                    {student?.imageUrl ? <img src={student.imageUrl} className="student-photo" alt="" /> : <div className="student-photo"></div>}
                    <div className="student-info">
                        <div className="info-row"><label>Student Name:</label> <span>{student?.fullName}</span></div>
                        <div className="info-row"><label>ID Number:</label> <span>{student?.studentId}</span></div>
                        <div className="info-row"><label>Grade:</label> <span>{student?.gradeLevel}</span></div>
                        <div className="info-row"><label>Academic Year:</label> <span>{firstSemesterReport?.academicYear}</span></div>
                        <div className="info-row"><label>Gender:</label> <span>{student?.gender}</span></div>
                        <div className="info-row"><label>Age:</label> <span>{calculateAge(student?.dateOfBirth)}</span></div>
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
                        <tr className="rank-row">
                            <td>CLASS RANK</td>
                            <td>{rank1stSem}</td>
                            <td>{rank2ndSem}</td>
                            <td>{overallRank}</td>
                        </tr>
                    </tfoot>
                </table>

                <div style={{marginTop:'auto', borderTop:'2px solid #ccc', paddingTop:10, fontSize:12, display:'flex', justifyContent:'space-between'}}>
                    <div>Promoted To: _________________________</div>
                    <div>Date: _________________________</div>
                </div>
            </div>

            {/* ===== PAGE 2: BEHAVIOR & COMMENTS ===== */}
            <div className="sheet">
                <div style={{textAlign:'center', borderBottom:'1px solid #ccc', marginBottom:20, paddingBottom:10}}>
                    <h2 style={{margin:0, color:'#555', fontSize:16}}>{student?.fullName} - {student?.studentId}</h2>
                </div>

                <div style={{display:'flex', gap:30}}>
                    {/* Left Col */}
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
                                <tr style={{background:'#eee', fontWeight:'bold'}}>
                                    <td>Conduct Grade</td>
                                    <td>{firstSemesterReport?.conduct ?? '-'}</td>
                                    <td>{secondSemesterReport?.conduct ?? '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div style={{fontSize:10, background:'#eee', padding:5}}>
                            <strong>Key:</strong> E=Excellent, VG=Very Good, G=Good, NI=Needs Improvement
                        </div>
                    </div>

                    {/* Right Col */}
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