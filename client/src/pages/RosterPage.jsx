import React, { useState, useEffect } from 'react';
import rosterService from '../services/rosterService';
import authService from '../services/authService';

const RosterPage = () => {
    const [currentUser] = useState(authService.getCurrentUser());
    const [gradeLevel, setGradeLevel] = useState(currentUser.homeroomGrade || ''); 
    const [academicYear, setAcademicYear] = useState('2017 E.C');
    const [rosterData, setRosterData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [homeroomTeacher, setHomeroomTeacher] = useState('');

     useEffect(() => {
        if (currentUser.role === 'teacher' && currentUser.homeroomGrade) {
            handleGenerateRoster();
        }
    }, [currentUser]);

    // --- Event Handlers (Perfect, no changes) ---
    const handleGenerateRoster = async (e) => {
        if (e) {
            e.preventDefault();
        }
        if (!gradeLevel) {
            setError("Please specify a Grade Level.");
            return;
        }
        setLoading(true); setError(null); setRosterData(null);
        try {
            const response = await rosterService.getRoster({ gradeLevel, academicYear });
            setRosterData(response.data);
            setHomeroomTeacher(response.data.homeroomTeacherName);
        } catch (err) { setError(err.response?.data?.message || 'Failed to generate roster.'); } 
        finally { setLoading(false); }
    };

    const handlePrint = () => {
        const tableToPrint = document.getElementById('rosterTable');
        if (!tableToPrint) return;

        const printWindow = window.open('', '', 'height=800,width=1200');
        printWindow.document.write('<html><head><title>Print Roster</title>');
        printWindow.document.write('<style>@page { size: A4 landscape; margin: 1cm; } body { font-family: Arial, sans-serif; } table { width: 100%; border-collapse: collapse; font-size: 7pt; } th, td { border: 1px solid black; padding: 4px; text-align: center; } th { vertical-align: middle; } td.student-name { text-align: left; }</style>');
        printWindow.document.write(`
        <link rel="stylesheet" href="/src/index.css"> <!-- Or the path to your main CSS file -->
        <style>
            @page { 
                size: A4 landscape; 
                margin: 1cm; 
            }
            body { 
                padding:10px;
                font-family: Arial, sans-serif;
                /* These two lines are the magic for printing colors */
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            table { 
                margin-top:10px;
                width: 100%; 
                border-collapse: collapse; 
                font-size: 7pt; 
            }
            th, td { 
                border: 1px solid black; 
                padding: 4px; 
                text-align: center; 
            }
            th { 
                vertical-align: middle; 
            }
            .student-name { 
                text-align: left; 
            }
            .titleOfAll {
                text-align:cener;
            }
        </style>
    `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<h3 className="titleOfAll text-xl font-bold text-gray-800">
                                        Freedom Kg and Primary School Roster for ${gradeLevel} - ${academicYear} | 
                                        <span className="font-normal text-gray-600"> Homeroom Teacher: ${homeroomTeacher}</span>
                                    </h3>`);
        printWindow.document.write(tableToPrint.outerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 1000);
    };

    const textInput = "shadow-sm border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
    const submitButton = `bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`;
    const thStyle = "p-2 border border-black text-center align-middle";
    const tdStyle = "p-2 border border-black text-center";
    const semesterCellStyle = `${tdStyle} font-bold text-left`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Yearly Mark List</h2>
            
            <div className="p-4 bg-gray-50 rounded-lg border mb-6">
                <form onSubmit={handleGenerateRoster} className="flex flex-wrap items-center gap-4">
                    <div>
                        <label htmlFor="gradeLevel" className="font-bold text-gray-700 mr-2">Enter Grade Level:</label>
                        <input id="gradeLevel" type="text" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="shadow-sm border rounded-lg py-2 px-3"/>
                    </div>
                    <div>
                        <label htmlFor="academicYear" className="font-bold text-gray-700 mr-2">Academic Year:</label>
                        <input id="academicYear" type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className={textInput} />
                    </div>
                    <button type="submit" className={submitButton} disabled={loading}>
                        {loading ? 'Generating...' : 'Generate Roster'}
                    </button>
                    {rosterData && (
                        <button type="button" onClick={handlePrint} className="ml-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">
                            Print Roster
                        </button>
                    )}
                </form>
            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}
            
            {rosterData && (
                <div  className="overflow-x-auto">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                        Roster for {gradeLevel} - {academicYear} | 
                        <span className="font-normal text-gray-600"> Homeroom Teacher: {homeroomTeacher}</span>
                    </h3>
                    <table id="rosterTable" className="min-w-full text-sm">
                        <thead>
                            <tr className='bg-rose-600 text-cyan-100'>
                                <th className={thStyle}>Student ID</th>
                                <th className={thStyle}>Full Name</th>
                                <th className={thStyle}>Sex</th>
                                <th className={thStyle}>Age</th>
                                <th className={thStyle}>Semester</th>
                                {rosterData.subjects.map(subjectName => (<th key={subjectName} className={thStyle}>{subjectName}</th>))}
                                <th className={`${thStyle}`}>Total</th>
                                <th className={`${thStyle}`}>Average</th>
                                <th className={`${thStyle}`}>Rank</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rosterData.roster.map(student => ([
                                <tr key={`${student.studentId}-1`}>
                                    <td rowSpan="3" className={`${tdStyle} bg-rose-600 text-cyan-100`}>{student.studentId}</td>
                                    <td rowSpan="3" className={`${tdStyle} text-left student-name`}>{student.fullName}</td>
                                    <td rowSpan="3" className={tdStyle}>{student.gender.charAt(0)}</td>
                                    <td rowSpan="3" className={tdStyle}>{student.age}</td>
                                    <td className={semesterCellStyle}>1st Sem</td>
                                    {rosterData.subjects.map(subject => <td key={`${subject}-1`} className={tdStyle}>{student.firstSemester.scores[subject]}</td>)}
                                    <td className={`${tdStyle} bg-gray-200 font-bold`}>{student.firstSemester.total.toFixed(2)}</td>
                                    <td className={`${tdStyle} bg-gray-200 font-bold`}>{student.firstSemester.average.toFixed(2)}</td>
                                    <td className={`${tdStyle} bg-gray-300 font-bold`}>{student.rank1st}</td>
                                </tr>,
                                <tr key={`${student.studentId}-2`}>
                                    <td className={semesterCellStyle}>2nd Sem</td>
                                    {rosterData.subjects.map(subject => <td key={`${subject}-2`} className={tdStyle}>{student.secondSemester.scores[subject]}</td>)}
                                    <td className={`${tdStyle} bg-gray-200 font-bold`}>{student.secondSemester.total.toFixed(2)}</td>
                                    <td className={`${tdStyle} bg-gray-200 font-bold`}>{student.secondSemester.average.toFixed(2)}</td>
                                    <td className={`${tdStyle} bg-gray-300 font-bold`}>{student.rank2nd}</td>
                                </tr>,
                                <tr key={`${student.studentId}-avg`} className="bg-gray-100">
                                    <td className={semesterCellStyle}>Subject Average</td>
                                    {rosterData.subjects.map(subject => (
                                        <td key={`${subject}-avg`} className={`${tdStyle} font-bold`}>
                                            {typeof student.subjectAverages[subject] === 'number' ? student.subjectAverages[subject].toFixed(2) : '-'}
                                        </td>
                                    ))}
                                    <td className={`${tdStyle} bg-gray-300 font-bold`}>{(student.overallTotal || 0).toFixed(2)}</td>
                                    <td className={`${tdStyle} bg-gray-300 font-bold`}>{(student.overallAverage || 0).toFixed(2)}</td>
                                    <td className={`${tdStyle} bg-gray-300 font-bold`}>{student.overallRank}</td>
                                </tr>
                            ]))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default RosterPage;