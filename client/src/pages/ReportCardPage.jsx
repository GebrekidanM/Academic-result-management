import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import studentService from '../services/studentService';
import gradeService from '../services/gradeService';
import behavioralReportService from '../services/behavioralReportService';
import rankService from '../services/rankService';
import './ReportCard.css';

// Placeholder Logo (Replace with your actual import)
// import schoolLogo from '../assets/logo.png'; 

const ReportCardPage = () => {
    const { id } = useParams();
    
    // ... (KEEP YOUR EXISTING STATE AND USEEFFECT LOGIC HERE) ...
    // ... Copy the exact same useEffect, useMemo logic from your previous code ...
    // ... I am skipping the logic part to focus on the DESIGN ...

    // (Paste your State, useEffect, calculateAge, handlePrint logic here)
    const [student, setStudent] = useState(null);
    const [allGrades, setAllGrades] = useState([]);
    const [allReports, setAllReports] = useState([]);
    const [rank1stSem, setRank1stSem] = useState('-');
    const [rank2ndSem, setRank2ndSem] = useState('-');
    const [overallRank, setOverallRank] = useState('-');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ... (Your UseEffect) ...
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
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
                    const academicYear = firstReport?.academicYear || '2018'; // Fallback
                    const gradeLevel = studentData.gradeLevel;

                    const rankPromises = [];
                    rankPromises.push(rankService.getRank({ studentId: id, academicYear, semester: 'First Semester', gradeLevel }));
                    if (secondReport) {
                        rankPromises.push(rankService.getRank({ studentId: id, academicYear, semester: 'Second Semester', gradeLevel }));
                    } else {
                        rankPromises.push(Promise.resolve(null));
                    }
                    rankPromises.push(rankService.getOverallRank({ studentId: id, academicYear, gradeLevel }));

                    const [rank1Res, rank2Res, overallRankRes] = await Promise.allSettled(rankPromises);

                    if (rank1Res.status === 'fulfilled') setRank1stSem(rank1Res.value.data.rank);
                    if (rank2Res.status === 'fulfilled' && rank2Res.value) setRank2ndSem(rank2Res.value.data.rank);
                    if (overallRankRes.status === 'fulfilled') setOverallRank(overallRankRes.value.data.rank);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load data.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [id]);

    const processedResults = useMemo(() => {
        if (!allGrades || allGrades.length === 0) return [];
        const subjectMap = new Map();
        allGrades.forEach(grade => {
            const subjectId = grade.subject._id;
            const subjectName = grade.subject.name;
            if (!subjectMap.has(subjectId)) {
                subjectMap.set(subjectId, { subjectName, firstSemester: null, secondSemester: null });
            }
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
        summary.overallTotal = (summary.total1st + summary.total2nd) / 2; // Logic check: Is this right? Usually total is Sum(Avg) or just Sum
        summary.overallAverage = (summary.average1st + summary.average2nd) / 2;
        return summary;
    }, [processedResults]);

    const firstSemesterReport = allReports.find(r => r.semester === 'First Semester');
    const secondSemesterReport = allReports.find(r => r.semester === 'Second Semester');

    const handlePrint = () => window.print();

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return 'N/A';
        const today = new Date(); const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    if (loading) return <div className="p-10 text-center">Generating Report Card...</div>;
    if (error) return <div className="p-10 text-center text-red-600">{error}</div>;

    return (
        <div className="report-card-container">
            {/* Controls */}
            <div className="no-print w-full max-w-4xl bg-white p-4 mb-4 shadow rounded flex justify-between items-center">
                <Link to={`/students/${id}`} className="text-blue-600 font-bold">&larr; Back to Student</Link>
                <button onClick={handlePrint} className="bg-blue-800 text-white px-6 py-2 rounded font-bold hover:bg-blue-900 shadow">
                    🖨️ Print Official Report
                </button>
            </div>

            {/* ===== PAGE 1: STUDENT PROFILE & ACADEMIC RESULTS ===== */}
            <div className="sheet">
                <div className="border-frame">
                    
                    {/* Header */}
                    <header className="school-header">
                        {/* <img src={schoolLogo} alt="Logo" className="school-logo" /> */}
                        <div className="school-logo" style={{width: 80, height: 80, background: '#eee', display:'flex', alignItems:'center', justifyContent:'center'}}>LOGO</div>
                        
                        <div className="school-info">
                            <h1>Freedom Primary School</h1>
                            <p>Address: Addis Ababa, Ethiopia | Tel: +251-911-000000</p>
                            <p><strong>STUDENT PROGRESS REPORT CARD</strong></p>
                        </div>
                        
                        {/* Invisible box to balance flex layout */}
                        <div style={{width: 80}}></div> 
                    </header>

                    {/* Student Info Grid */}
                    <div className="student-profile-section">
                        <div className="student-photo-box">
                            {student?.imageUrl ? (
                                <img src={student.imageUrl} alt="Profile" />
                            ) : (
                                <div style={{width:110, height:130, background:'#eee', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10}}>No Photo</div>
                            )}
                        </div>
                        <div className="student-details">
                            <div className="detail-row"><span className="label">Full Name:</span> <span className="value">{student?.fullName}</span></div>
                            <div className="detail-row"><span className="label">ID Number:</span> <span className="value">{student?.studentId}</span></div>
                            <div className="detail-row"><span className="label">Grade:</span> <span className="value">{student?.gradeLevel}</span></div>
                            <div className="detail-row"><span className="label">Academic Year:</span> <span className="value">{firstSemesterReport?.academicYear || '2018'}</span></div>
                            <div className="detail-row"><span className="label">Gender:</span> <span className="value">{student?.gender}</span></div>
                            <div className="detail-row"><span className="label">Age:</span> <span className="value">{calculateAge(student?.dateOfBirth)}</span></div>
                        </div>
                    </div>

                    {/* Academic Table */}
                    <h3 style={{borderBottom:'2px solid #2c3e50', paddingBottom:5, marginBottom:10}}>Academic Achievement</h3>
                    <table className="academic-table">
                        <thead>
                            <tr>
                                <th style={{width: '40%'}}>SUBJECT</th>
                                <th>1st SEM</th>
                                <th>2nd SEM</th>
                                <th>Average</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedResults.map((r, i) => (
                                <tr key={i}>
                                    <td>{r.subjectName}</td>
                                    <td>{r.firstSemester ?? '-'}</td>
                                    <td>{r.secondSemester ?? '-'}</td>
                                    <td style={{fontWeight:'bold'}}>{r.average ? r.average.toFixed(1) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="table-footer">
                            <tr>
                                <td>Total</td>
                                <td>{finalSummary?.total1st.toFixed(1)}</td>
                                <td>{finalSummary?.total2nd.toFixed(1)}</td>
                                <td>{finalSummary?.overallTotal.toFixed(1)}</td>
                            </tr>
                            <tr>
                                <td>Average</td>
                                <td>{finalSummary?.average1st.toFixed(1)}</td>
                                <td>{finalSummary?.average2nd.toFixed(1)}</td>
                                <td>{finalSummary?.overallAverage.toFixed(1)}</td>
                            </tr>
                            <tr style={{ borderTop: '3px double #2c3e50', fontSize: '14px' }}>
                                <td style={{ fontWeight: 'bold', color: '#2c3e50' }}>Rank</td>
                                
                                <td style={{ fontWeight: 'bold', color: '#000', background: '#f0f0f0' }}>
                                    {rank1stSem}
                                </td>
                                
                                <td style={{ fontWeight: 'bold', color: '#000', background: '#f0f0f0' }}>
                                    {rank2ndSem}
                                </td>
                                
                                <td style={{ fontWeight: 'bold', color: '#000', background: '#e0e0e0', border: '2px solid #2c3e50' }}>
                                    {overallRank}
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* Footer Info */}
                    <div style={{marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: 12}}>
                        <div>
                            <strong>Promoted To:</strong> _______________________
                        </div>
                        <div>
                           <strong>Date:</strong> _______________________
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== PAGE 2: BEHAVIOR & COMMENTS ===== */}
            <div className="sheet">
                <div className="border-frame">
                     {/* Simplified Header for Page 2 */}
                    <div style={{textAlign:'center', marginBottom:20, borderBottom:'1px solid #ccc'}}>
                        <h2 style={{fontSize:18, margin:0, color:'#555'}}>{student?.fullName} - {student?.studentId}</h2>
                    </div>

                    <div className="two-col-layout">
                        {/* Left Col: Traits */}
                        <div className="col-half">
                            <h4>Personality & Conduct</h4>
                            <table className="behavior-table">
                                <thead>
                                    <tr>
                                        <th>TRAIT</th>
                                        <th>Sem 1</th>
                                        <th>Sem 2</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {["Punctuality", "Attendance", "Responsibility", "Respect", "Cooperation", "Initiative", "Completes Work"].map(area => (
                                        <tr key={area}>
                                            <td style={{textAlign:'left'}}>{area}</td>
                                            <td>{firstSemesterReport?.evaluations.find(e => e.area === area)?.result ?? '-'}</td>
                                            <td>{secondSemesterReport?.evaluations.find(e => e.area === area)?.result ?? '-'}</td>
                                        </tr>
                                    ))}
                                    {/* Conduct Row */}
                                    <tr style={{background:'#f0f2f5', fontWeight:'bold'}}>
                                        <td style={{textAlign:'left'}}>General Conduct</td>
                                        <td>{firstSemesterReport?.conduct || '-'}</td>
                                        <td>{secondSemesterReport?.conduct || '-'}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="message-box">
                                <strong>Grading Key:</strong><br/>
                                E = Excellent | VG = Very Good | G = Good | NI = Needs Improvement
                            </div>
                        </div>

                        {/* Right Col: Signatures & Comments */}
                        <div className="col-half comments-section">
                            <div className="comment-box">
                                <h4>Homeroom Teacher's Comment</h4>
                                <div className="handwriting-lines">{firstSemesterReport?.teacherComment}</div>
                                <div className="handwriting-lines"></div>
                                <div style={{textAlign:'right', fontSize:11, marginTop:5}}>
                                    Signature: _________________
                                </div>
                            </div>

                            <div className="comment-box">
                                <h4>Parent's Comment</h4>
                                <div className="handwriting-lines"></div>
                                <div className="handwriting-lines"></div>
                                <div style={{textAlign:'right', fontSize:11, marginTop:5}}>
                                    Signature: _________________
                                </div>
                            </div>
                            
                            <div className="comment-box" style={{marginTop: 30}}>
                                <h4>Director's Approval</h4>
                                <div style={{marginTop:40, borderTop:'1px solid black', width:'80%'}}>
                                    Director's Signature & Stamp
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Message */}
                    <div className="message-box" style={{marginTop:'auto'}}>
                         <h4>Note to Parents:</h4>
                         <p>This report primarily focuses on your child's academic and behavioral development. Please review this carefully and support your child at home. Regular attendance and punctuality are key to success.</p>
                         <hr style={{margin:'5px 0', border:0, borderTop:'1px dashed #ccc'}}/>
                         <p style={{fontFamily: 'Noto Sans Ethiopic'}}><strong>ለወላጆች መልእክት:</strong> በሰርተፍኬት ላይ የሰፈረው ውጤት የልጅዎ የጠባይ እድገት እና ለውጥ በተለየ ምልከታ እና ምዘና መሰረት የተገለፀ ነው። ውጤቱን በአፅኖት ተመለክተው በቤት ውስጥ ክትትል እንዲያደርጉ እንጠይቃለን።</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ReportCardPage;