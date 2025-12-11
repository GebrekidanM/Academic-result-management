import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import studentService from '../services/studentService';
import gradeService from '../services/gradeService';
import behavioralReportService from '../services/behavioralReportService';
import rankService from '../services/rankService';

const ReportCardPage = () => {
    const { id } = useParams();
    const [student, setStudent] = useState(null);
    const [allGrades, setAllGrades] = useState([]);
    const [allReports, setAllReports] = useState([]);
    const [rank1stSem, setRank1stSem] = useState('-');
    const [rank2ndSem, setRank2ndSem] = useState('-');
    const [overallRank, setOverallRank] = useState('-');
    const [loading, setLoading] = useState(true);

    // ... (Keep your existing useEffect, useMemo, calculateAge logic here) ...
    // ... I will skip repeating the logic to focus on the Tailwind UI ...
    
    // --- MOCK DATA FETCHING (Paste your logic back here) ---
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [studentRes, gradesRes, reportsRes] = await Promise.all([
                    studentService.getStudentById(id),
                    gradeService.getGradesByStudent(id),
                    behavioralReportService.getReportsByStudent(id)
                ]);
                setStudent(studentRes.data.data);
                setAllGrades(gradesRes.data.data);
                setAllReports(reportsRes.data.data);
                // ... fetch ranks ...
                setLoading(false);
            } catch (err) { setLoading(false); }
        };
        fetchAllData();
    }, [id]);
    // -----------------------------------------------------

    // Dummy logic variables for UI demo (Replace with your actual memoized variables)
    const processedResults = []; // Replace with actual
    const finalSummary = { total1st: 0, total2nd: 0, overallTotal: 0, average1st: 0, average2nd: 0, overallAverage: 0 };
    const firstSemesterReport = allReports.find(r => r.semester === 'First Semester');
    const secondSemesterReport = allReports.find(r => r.semester === 'Second Semester');
    const EVALUATION_AREAS = ["Punctuality", "Attendance", "Responsibility", "Respect", "Cooperation", "Initiative", "Completes Work"];
    const calculateAge = () => 10; // Replace with your function

    if (loading) return <div className="text-center p-10">Loading...</div>;

    return (
        <div className="min-h-screen flex flex-col items-center py-8 print:bg-white print:p-0 print:block">
            
            {/* --- INJECT PRINT SETTINGS (PORTRAIT) --- */}
            <style>{`
                @media print {
                    @page { size: A4 portrait; margin: 5mm; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>

            {/* Controls (Hidden on Print) */}
            <div className="w-[210mm] flex justify-between mb-4 print:hidden">
                <Link to={`/students/${id}`} className="text-white font-bold hover:underline">&larr; Back</Link>
                <button onClick={() => window.print()} className="bg-blue-900 text-white px-4 py-2 rounded font-bold hover:bg-blue-800">
                    🖨️ Print Report
                </button>
            </div>

            {/* ===== PAGE 1: ACADEMICS ===== */}
            <div className="bg-white w-[210mm] min-h-[297mm] p-[10mm] shadow-2xl mb-8 print:shadow-none print:mb-0 print:w-full print:h-full print:break-after-page">
                
                {/* Header */}
                <div className="text-center border-b-4 border-double border-blue-900 pb-4 mb-6">
                    <h1 className="text-2xl font-serif font-bold text-blue-900 uppercase tracking-wide">Freedom KG & Primary School</h1>
                    <p className="text-xs text-gray-600 mt-1">Address: Addis Ababa, Ethiopia | OFFICIAL REPORT CARD</p>
                </div>

                {/* Student Profile */}
                <div className="flex gap-4 bg-gray-50 border border-gray-300 p-4 rounded-lg mb-6">
                    <div className="w-[90px] h-[110px] bg-gray-200 border-2 border-white shadow-sm overflow-hidden shrink-0">
                        {student?.imageUrl ? <img src={student.imageUrl} className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 w-full text-[11px]">
                        <div className="flex justify-between border-b border-dotted border-gray-400">
                            <span className="font-bold text-blue-900">Name / ስም:</span> 
                            <span className="font-mono font-bold text-black">{student?.fullName}</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted border-gray-400">
                            <span className="font-bold text-blue-900">ID / መለያ:</span> 
                            <span className="font-mono font-bold text-black">{student?.studentId}</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted border-gray-400">
                            <span className="font-bold text-blue-900">Grade / ክፍል:</span> 
                            <span className="font-mono font-bold text-black">{student?.gradeLevel}</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted border-gray-400">
                            <span className="font-bold text-blue-900">Year / ዘመን:</span> 
                            <span className="font-mono font-bold text-black">2018</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted border-gray-400">
                            <span className="font-bold text-blue-900">Age / ዕድሜ:</span> 
                            <span className="font-mono font-bold text-black">{calculateAge()}</span>
                        </div>
                        <div className="flex justify-between border-b border-dotted border-gray-400">
                            <span className="font-bold text-blue-900">Sex / ጾታ:</span> 
                            <span className="font-mono font-bold text-black">{student?.gender}</span>
                        </div>
                    </div>
                </div>

                {/* Academic Table */}
                <h3 className="text-lg font-serif font-bold text-blue-900 border-b-2 border-gray-200 mb-2">Academic Achievement</h3>
                <table className="w-full border-collapse border border-gray-400 text-[11px] mb-6">
                    <thead>
                        <tr className="bg-blue-900 text-white uppercase">
                            <th className="border border-black p-2 text-left w-1/3">Subject</th>
                            <th className="border border-black p-2">1st Sem</th>
                            <th className="border border-black p-2">2nd Sem</th>
                            <th className="border border-black p-2">Average</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Map your data here */}
                        <tr className="text-center">
                            <td className="border border-gray-400 p-1 text-left font-bold pl-2">Amharic</td>
                            <td className="border border-gray-400 p-1">85</td>
                            <td className="border border-gray-400 p-1">90</td>
                            <td className="border border-gray-400 p-1 font-bold">87.5</td>
                        </tr>
                        {/* ... more rows ... */}
                    </tbody>
                    <tfoot>
                        <tr className="font-bold bg-gray-100 text-center">
                            <td className="border border-gray-400 p-2 text-left pl-2 text-blue-900">TOTAL</td>
                            <td className="border border-gray-400 p-2">{finalSummary.total1st}</td>
                            <td className="border border-gray-400 p-2">{finalSummary.total2nd}</td>
                            <td className="border border-gray-400 p-2">{finalSummary.overallTotal}</td>
                        </tr>
                        <tr className="font-bold bg-gray-100 text-center">
                            <td className="border border-gray-400 p-2 text-left pl-2 text-blue-900">AVERAGE</td>
                            <td className="border border-gray-400 p-2">{finalSummary.average1st}</td>
                            <td className="border border-gray-400 p-2">{finalSummary.average2nd}</td>
                            <td className="border border-gray-400 p-2">{finalSummary.overallAverage}</td>
                        </tr>
                        {/* Rank Row Highlighted */}
                        <tr className="bg-yellow-600 text-white font-bold text-center print:bg-yellow-600 print:text-white">
                            <td className="border border-black p-2 text-left pl-2">CLASS RANK</td>
                            <td className="border border-black p-2">{rank1stSem}</td>
                            <td className="border border-black p-2">{rank2ndSem}</td>
                            <td className="border border-black p-2">{overallRank}</td>
                        </tr>
                    </tfoot>
                </table>

                {/* Footer */}
                <div className="mt-auto border-t-2 border-gray-300 pt-4 flex justify-between text-xs font-bold text-gray-700">
                    <div>Promoted To: _______________________</div>
                    <div>Date: _______________________</div>
                </div>
            </div>

            {/* ===== PAGE 2: BEHAVIOR ===== */}
            <div className="bg-white w-[210mm] min-h-[297mm] p-[10mm] shadow-2xl print:shadow-none print:w-full print:h-full print:m-0">
                <div className="text-center border-b border-gray-300 mb-6 pb-2">
                    <h2 className="text-lg font-bold text-gray-700">{student?.fullName} - {student?.studentId}</h2>
                </div>

                <div className="flex gap-8">
                    {/* Left Column */}
                    <div className="flex-1">
                        <h3 className="font-serif font-bold text-blue-900 border-b border-gray-300 mb-2 text-sm uppercase">Behavioral Traits</h3>
                        <table className="w-full border-collapse border border-gray-400 text-[10px]">
                            <thead>
                                <tr className="bg-blue-900 text-white">
                                    <th className="border border-black p-1 text-left pl-2">Trait</th>
                                    <th className="border border-black p-1">Sem 1</th>
                                    <th className="border border-black p-1">Sem 2</th>
                                </tr>
                            </thead>
                            <tbody>
                                {EVALUATION_AREAS.map(trait => (
                                    <tr key={trait} className="text-center">
                                        <td className="border border-gray-400 p-1 text-left pl-2">{trait}</td>
                                        <td className="border border-gray-400 p-1">-</td>
                                        <td className="border border-gray-400 p-1">-</td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-100 font-bold">
                                    <td className="border border-gray-400 p-1 text-left pl-2">Conduct Grade</td>
                                    <td className="border border-gray-400 p-1">-</td>
                                    <td className="border border-gray-400 p-1">-</td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="mt-2 p-2 bg-gray-100 text-[9px] border border-gray-300">
                            <strong>Key:</strong> E=Excellent, VG=Very Good, G=Good, NI=Needs Improvement
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="border border-gray-300 p-2 rounded">
                            <h4 className="text-[10px] font-bold text-blue-900 uppercase border-b border-dotted border-gray-400 mb-1">Teacher's Comment (Sem 1)</h4>
                            <div className="h-6 border-b border-dotted border-gray-400 mb-1 font-mono text-xs">{firstSemesterReport?.teacherComment}</div>
                            <div className="h-6 border-b border-dotted border-gray-400"></div>
                        </div>
                        <div className="border border-gray-300 p-2 rounded">
                            <h4 className="text-[10px] font-bold text-blue-900 uppercase border-b border-dotted border-gray-400 mb-1">Teacher's Comment (Sem 2)</h4>
                            <div className="h-6 border-b border-dotted border-gray-400 mb-1 font-mono text-xs">{secondSemesterReport?.teacherComment}</div>
                            <div className="h-6 border-b border-dotted border-gray-400"></div>
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <div className="mt-8 flex justify-between px-4">
                    {['Homeroom Teacher', 'Director', 'Parent'].map(title => (
                        <div key={title} className="text-center w-1/3">
                            <div className="border-b border-black h-8 mb-1"></div>
                            <span className="text-[10px] font-bold">{title}</span>
                        </div>
                    ))}
                </div>

                {/* Message */}
                <div className="mt-auto bg-orange-50 border-l-4 border-yellow-600 p-3 text-[10px] text-justify rounded">
                    <h5 className="font-bold text-yellow-700 mb-1">Message to Parents / ለወላጆች መልእክት</h5>
                    <p className="mb-2">The above report card primarily focuses on your child's behavioral development. Please review this carefully and support your child at home.</p>
                    <p className="font-serif">በሰርተፍኬት ላይ የሰፈረው ውጤት የልጅዎ የጠባይ እድገት እና ለውጥ በተለየ ምልከታ እና ምዘና መሰረት የተገለፀ ነው። ውጤቱን በአፅኖት ተመለክተው በቤት ውስጥ ክትትል እንዲያደርጉ እንጠይቃለን።</p>
                </div>
            </div>
        </div>
    );
};

export default ReportCardPage;