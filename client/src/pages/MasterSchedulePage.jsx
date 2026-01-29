import React, { useState, useEffect } from 'react';
import scheduleService from '../services/scheduleService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const MasterSchedulePage = () => {
    const [academicYear, setAcademicYear] = useState('2018');
    const [masterData, setMasterData] = useState({}); // { "Grade 4A": [...], "Grade 4B": [...] }
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchMaster = async () => {
            setLoading(true);
            try {
                const res = await scheduleService.getMasterSchedule(academicYear);
                setMasterData(res.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMaster();
    }, [academicYear]);

    // Sort grades naturally (4A, 4B, 5A...)
    const sortedGrades = Object.keys(masterData).sort();

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            
            <div className="flex justify-between items-center mb-8 no-print">
                <h1 className="text-2xl font-bold">🏫 Master School Schedule</h1>
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded font-bold">
                    🖨️ Print All
                </button>
            </div>

            {loading ? <p>Loading...</p> : (
                <div className="space-y-12 print:space-y-4">
                    {sortedGrades.map(grade => (
                        <div key={grade} className="bg-white p-6 rounded-xl shadow print:shadow-none print:break-inside-avoid">
                            
                            <h2 className="text-xl font-bold text-blue-900 mb-4 border-b-2 border-slate-200 pb-2">
                                {grade}
                            </h2>

                            <table className="w-full border-collapse border border-gray-300 text-xs">
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th className="border p-2 w-20">Day</th>
                                        {PERIODS.map(p => <th key={p} className="border p-2">P{p}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {DAYS.map(day => (
                                        <tr key={day}>
                                            <td className="border p-2 font-bold bg-gray-50">{day}</td>
                                            {PERIODS.map(period => {
                                                // Find slot for this specific grade
                                                const slot = masterData[grade].find(s => s.dayOfWeek === day && s.period === period);
                                                return (
                                                    <td key={period} className="border p-1 text-center h-12">
                                                        {slot ? (
                                                            <div>
                                                                <div className="font-bold">{slot.subject.name}</div>
                                                                <div className="text-[9px] text-gray-500">{slot.teacher.fullName}</div>
                                                            </div>
                                                        ) : <span className="text-gray-200">-</span>}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MasterSchedulePage;