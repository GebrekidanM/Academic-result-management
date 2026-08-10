// src/pages/MasterSchedulePage.jsx
import React, { useState, useEffect } from 'react';
import scheduleService from '@shared/services/scheduleService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const getEthiopianYear = () => {
    const today = new Date();
    const gregYear = today.getFullYear();
    const gregMonth = today.getMonth() + 1;
    return gregMonth >= 9 ? gregYear - 7 : gregYear - 8;
};

const MasterSchedulePage = () => {
    const [academicYear, setAcademicYear] = useState(String(getEthiopianYear()));
    const [masterData, setMasterData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchMaster = async () => {
            setLoading(true);
            try {
                const res = await scheduleService.getMasterSchedule(academicYear);
                setMasterData(res.data?.data || res.data || {});
            } catch (err) {
                console.error("Error fetching master schedule:", err);
                setMasterData({});
            } finally {
                setLoading(false);
            }
        };
        fetchMaster();
    }, [academicYear]);

    // Sort Grade Level Names naturally ("Kg 1A", "Grade 1A", "Grade 2B"...)
    const sortedGrades = Object.keys(masterData).sort((a, b) => 
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 no-print gap-4 bg-white p-4 rounded-xl shadow-sm border">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">🏫 Master School Schedule</h1>
                    <p className="text-xs text-gray-500">Overview of all class schedules for {academicYear} E.C.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Academic Year:</label>
                        <select 
                            value={academicYear} 
                            onChange={(e) => setAcademicYear(e.target.value)}
                            className="border p-2 rounded-lg bg-gray-50 font-bold text-sm text-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        >
                            {[getEthiopianYear(), getEthiopianYear() - 1, getEthiopianYear() - 2].map(yr => (
                                <option key={yr} value={String(yr)}>{yr} E.C.</option>
                            ))}
                        </select>
                    </div>

                    <button 
                        onClick={() => window.print()} 
                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-bold shadow transition-colors"
                    >
                        🖨️ Print All
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-gray-500 italic">Loading master schedule...</div>
            ) : sortedGrades.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-xl border border-dashed text-gray-400">
                    No schedule slots created for {academicYear} E.C. yet. Use Schedule Manager to auto-generate or assign slots.
                </div>
            ) : (
                <div className="space-y-12 print:space-y-6">
                    {sortedGrades.map(gradeName => (
                        <div key={gradeName} className="bg-white p-6 rounded-xl shadow print:shadow-none print:p-0 print:break-inside-avoid">
                            
                            <div className="flex justify-between items-center mb-4 border-b-2 border-slate-900 pb-2">
                                <h2 className="text-xl font-black text-blue-900 uppercase">
                                    {gradeName}
                                </h2>
                                <span className="text-xs text-gray-500 font-mono">{academicYear} E.C.</span>
                            </div>

                            <table className="w-full border-collapse border border-gray-800 text-xs">
                                <thead>
                                    <tr className="bg-slate-900 text-white print:bg-slate-900 print:text-white">
                                        <th className="border border-gray-600 p-2 w-24">Day</th>
                                        {PERIODS.map(p => (
                                            <th key={p} className="border border-gray-600 p-2 text-center">
                                                Period {p}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {DAYS.map(day => (
                                        <tr key={day} className="hover:bg-gray-50">
                                            <td className="border border-gray-400 p-2 font-bold bg-gray-100 print:bg-gray-200">
                                                {day}
                                            </td>
                                            {PERIODS.map(period => {
                                                // Find slot for this specific class name, day, and period
                                                const slot = masterData[gradeName].find(s => s.dayOfWeek === day && s.period === period);
                                                return (
                                                    <td key={period} className="border border-gray-400 p-1 text-center h-14 vertical-middle">
                                                        {slot ? (
                                                            <div className="flex flex-col justify-center h-full">
                                                                <div className="font-bold text-slate-800">{slot.subject?.name}</div>
                                                                <div className="text-[9px] text-gray-500 mt-0.5">{slot.teacher?.fullName}</div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-200 text-xs">-</span>
                                                        )}
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