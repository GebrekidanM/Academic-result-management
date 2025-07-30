// src/pages/ReportCardPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import studentService from '../services/studentService';
import gradeService from '../services/gradeService';
import behavioralReportService from '../services/behavioralReportService';
import rankService from '../services/rankService'; // Import the new rank service
import './ReportCard.css';

const ReportCardPage = () => {
    const { id } = useParams();
    
    // States for data and page status
    const [student, setStudent] = useState(null);
    const [allGrades, setAllGrades] = useState([]);
    const [allReports, setAllReports] = useState([]);
    const [rank1stSem, setRank1stSem] = useState('-');
    const [rank2ndSem, setRank2ndSem] = useState('-');
    const [overallRank, setOverallRank] = useState('-');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                // Fetch primary data first
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

                // If primary data is successful, fetch all the rank data in parallel
                if (studentData) {
                    const firstReport = reportsData.find(r => r.semester === 'First Semester');
                    const secondReport = reportsData.find(r => r.semester === 'Second Semester');
                    const academicYear = firstReport?.academicYear;
                    const gradeLevel = studentData.gradeLevel;

                    if (academicYear) {
                        const rankPromises = [];

                        // Promise for 1st semester rank
                        rankPromises.push(rankService.getRank({ studentId: id, academicYear, semester: 'First Semester', gradeLevel }));
                        
                        // Promise for 2nd semester rank (only if the report exists)
                        if (secondReport) {
                            rankPromises.push(rankService.getRank({ studentId: id, academicYear, semester: 'Second Semester', gradeLevel }));
                        } else {
                            rankPromises.push(Promise.resolve(null)); // Add a placeholder if no 2nd sem
                        }
                        
                        // Promise for Overall Rank
                        rankPromises.push(rankService.getOverallRank({ studentId: id, academicYear, gradeLevel }));
                        

                        // Await all rank promises
                        const [rank1Res, rank2Res, overallRankRes] = await Promise.allSettled(rankPromises);

                        // Update states based on results
                        if (rank1Res.status === 'fulfilled') setRank1stSem(rank1Res.value.data.rank); else setRank1stSem('N/A');
                        if (rank2Res.status === 'fulfilled' && rank2Res.value) setRank2ndSem(rank2Res.value.data.rank); else setRank2ndSem('N/A');
                        if (overallRankRes.status === 'fulfilled') setOverallRank(overallRankRes.value.data.rank); else setOverallRank('N/A');
                    }
                }

            } catch (err) {
                setError("Failed to load all necessary report card data.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [id]);


    // --- Data Processing for Subject Scores ---
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

    // --- Data Processing for Final Summary ---
    const finalSummary = useMemo(() => {
        if (processedResults.length === 0) return null;
        const summary = {
            total1st: processedResults.reduce((sum, sub) => sum + (sub.firstSemester || 0), 0),
            total2nd: processedResults.reduce((sum, sub) => sum + (sub.secondSemester || 0), 0),
        };
        const numSubjects = processedResults.length;
        summary.average1st = numSubjects > 0 ? summary.total1st / numSubjects : 0;
        summary.average2nd = numSubjects > 0 ? summary.total2nd / numSubjects : 0;
        summary.overallAverage = (summary.average1st + summary.average2nd) / 2;
        // Add the overall total calculation
        summary.overallTotal = (summary.total1st + summary.total2nd)/2;
        summary.average1st = numSubjects > 0 ? summary.total1st / numSubjects : 0;
        summary.average2nd = numSubjects > 0 ? summary.total2nd / numSubjects : 0;
        // The overall average can also be calculated from the overall total
        summary.overallAverage = numSubjects > 0 ? summary.overallTotal / (numSubjects * 2) : 0;

        return summary;
    }, [processedResults]);

    // --- Filter Reports for Each Semester ---
    const firstSemesterReport = allReports.find(r => r.semester === 'First Semester');
    const secondSemesterReport = allReports.find(r => r.semester === 'Second Semester');

    // --- Helper Functions ---
    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return 'N/A';
        const today = new Date(); const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    const handlePrint = () => {
        const printableContent = document.getElementById('printableArea');
        if (!printableContent) return;
        const contentToPrint = printableContent.innerHTML;
        let styles = '';
        for (const sheet of document.styleSheets) {
            try { styles += Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n'); } 
            catch (e) { console.warn("Could not read styles:", e); }
        }
        const printWindow = window.open('', '', 'height=600,width=800');
        if (!printWindow) { alert("Please allow pop-ups."); return; }
        printWindow.document.write(`<html><head><title>Print Report Card</title><style>${styles}</style></head><body>${contentToPrint}</body></html>`);
        printWindow.document.close();
        setTimeout(() => { printWindow.focus(); printWindow.print(); printWindow.close(); }, 500);
    };

    // --- Render Logic ---
    if (loading) return <p>Generating Authentic Report Card...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div className="report-card-container">
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-wrap items-center justify-between gap-4 border-t-4 border-pink-500">
                <Link to={`/students/${id}`} className="text-gray-600 hover:text-black font-semibold transition-colors duration-200 flex items-center text-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>Back to Details</Link>
                <h3 className="text-lg font-bold text-gray-800 hidden md:block">Report Card Controls</h3>
                <button onClick={handlePrint} className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" /></svg>Print</button>
            </div>
            
            <div id="printableArea">
                {/* ===== FRONT PAGE ===== */}
                <div className="report-card sheet">
                    <div className="front-page-grid">
                        
                        <div className="front-right-col">
                            <div className="front-comment-box large-comment"><h4>Parent's Comment</h4><div className="comment-space"></div><p>Name: _________________________ Signature: __________</p></div>
                            <div className="front-comment-box small-comment"><h4>Homeroom Teacher's Comment (1st Sem)</h4><div className="comment-space"><p>{firstSemesterReport?.teacherComment}</p></div><p>Name: <b>{firstSemesterReport?.createdBy?.fullName || '_________________'}</b> Signature: __________</p></div>
                            <div className="front-comment-box small-comment"><h4>Homeroom Teacher's Comment (2nd Sem)</h4><div className="comment-space"><p>{secondSemesterReport?.teacherComment}</p></div><p>Name: <b>{firstSemesterReport?.createdBy?.fullName || '_________________'}</b> Signature: __________</p></div>
                            <div className="message-to-parents">
                                <h4>Message to parents</h4>
                                <p>The above report card primarily focuses on your child's behavioral development in various aspects, but it cannot encompass everything about your child. These are keys to your child's academic success. We would like you to pay attention to this progress report card and assess your child at home. Thank you.</p>
                                <hr className="bilingual-divider" />
                                <h4>ለወላጆች መልእከት</h4>
                                <p>በሰርተፍኬት ላይ የሰፈረው ውጤት የልጅዎ የጠባይ እድገት እና ለውጥ በተለየ ምልከታ እና ምዘና መሰረት የተገለፀ ነው ነገር ግን ሁሉንም ነገር አይገልፅም ፡፡ውጤቱን በአፅኖት ተመለክተው በቤት ውስጥ እርዳታ እና ክትትል እንድታደርጉ በአክብሮት እንጠይቃለን፡፡ ይህ ለልጆ የእውቀት መጨመር ቁልፍ ነገር ነው፡፡</p>
                            </div>
                        </div>
                        <div className="front-left-col">
                            <header className="card-header"><h2>FREEDOM KG & PRIMARY SCHOOL</h2></header>
                            <div className='flex w-100% justify-center mb-4'>
                                {student?.imageUrl && (
                                 
                                    <img 
                                    src={student.imageUrl} 
                                    alt={`${student.fullName}'s profile`} 
                                    className="student-profile-photo "
                                    style={{
                                        width: '150px',
                                        height: '200px',
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        border: '2px solid #ccc',
                                        marginBottom: '1rem'
                                    }}
                                />
                            )}
                            </div>
                            
                            <div className="front-info-item"><span>Student's Name:</span><p>{student?.fullName}</p></div>
                            <div className="front-info-item"><span>Academic Year:</span><p>{firstSemesterReport?.academicYear || 'N/A'}</p></div>
                            <div className="front-info-item"><span>Grade:</span><p>{student?.gradeLevel}</p></div>
                            <div className="front-info-item">
                                <span>Promoted to:</span>
                                <p>{student?.promotionStatus}</p>
                            </div>
                            <div className="front-info-item"><span>Sex:</span><p>{student?.gender}</p></div>
                            <div className="front-info-item"><span>Age:</span><p>{calculateAge(student?.dateOfBirth)}</p></div>
                            <div className="front-info-item"><span>ID No:</span><p>{student?.studentId}</p></div>
                        </div>
                    </div>
                </div>

                {/* ===== BACK PAGE ===== */}
                <div className="report-card sheet">
                    <div className="back-page-grid">
                        <div className="back-left-col">
                            <div className="academic-results">
                                <h4>ACADEMIC RESULTS</h4>
                                <table>
                                    <thead><tr><th>SUBJECT</th><th>1ST SEM</th><th>2ND SEM</th><th>AVG.</th></tr></thead>
                                    <tbody>
                                        {processedResults.map((r, i) => 
                                            (<tr key={i}>
                                                <td>{r.subjectName}</td>
                                                <td>{r.firstSemester ?? '-'}</td>
                                                <td>{r.secondSemester ?? '-'}</td>
                                                <td>{r.average?.toFixed(2) ?? '-'}</td></tr>)
                                          )
                                        }
                                    </tbody>
                                
                                    <tfoot>
                                        <tr>
                                            <td><strong>Total</strong></td>
                                            <td><strong>{finalSummary?.total1st.toFixed(2)}</strong></td>
                                            <td><strong>{finalSummary?.total2nd.toFixed(2)}</strong></td>
                                            <td><strong>{finalSummary?.overallTotal.toFixed(2)}</strong></td>
                                        </tr>
                                        <tr>
                                            <td><strong>Average</strong></td>
                                            <td><strong>{finalSummary?.average1st.toFixed(2)}</strong></td>
                                            <td><strong>{finalSummary?.average2nd.toFixed(2)}</strong></td>
                                            <td><strong>{finalSummary?.overallAverage.toFixed(2)}</strong></td>
                                        </tr>
                                        <tr>
                                            <td><strong>Rank</strong></td>
                                            <td><strong>{rank1stSem}</strong></td>
                                            <td><strong>{rank2ndSem}</strong></td>
                                            <td><strong>{overallRank}</strong></td>
                                        </tr>

                                        <tr>
                                            <td><strong>Conduct</strong></td>
                                            <td>{firstSemesterReport?.conduct ?? '-'}</td>
                                            <td>{secondSemesterReport?.conduct ?? '-'}</td>
                                            <td>-</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <div className="director-signature"><p><strong>Director's Name:</strong> _________________________</p><p><strong>Signature:</strong> __________</p></div>
                        </div>
                        <div className="back-right-col">
                            <div className="personality-skills">
                                <h4>PERSONALITY TRAITS & SKILLS</h4>
                                <table className="traits-table">
                                    <thead><tr><th>TRAITS</th><th>1ST SEM</th><th>2ND SEM</th></tr></thead>
                                    <tbody>{EVALUATION_AREAS.map(area => (<tr key={area}><td>{area}</td><td>{firstSemesterReport?.evaluations.find(e => e.area === area)?.result ?? '-'}</td><td>{secondSemesterReport?.evaluations.find(e => e.area === area)?.result ?? '-'}</td></tr>))}</tbody>
                                </table>
                                <div className="grading-key"><h4>GRADING KEY</h4><table><tbody><tr><td>E</td><td>Excellent</td></tr><tr><td>VG</td><td>Very Good</td></tr><tr><td>G</td><td>Good</td></tr><tr><td>NI</td><td>Needs Improvement</td></tr></tbody></table></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EVALUATION_AREAS = ["Punctuality", "Attendance", "Responsibility", "Respect", "Cooperation", "Initiative", "Completes Work"];

export default ReportCardPage;