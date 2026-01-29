import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import scheduleService from '../services/scheduleService';
import studentService from '../services/studentService';
import subjectService from '../services/subjectService'; 
import userService from '../services/userService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const ScheduleManager = () => {
    const { t } = useTranslation();

    // --- STATE ---
    const [gradeLevel, setGradeLevel] = useState('');
    const [availableGrades, setAvailableGrades] = useState([]);
    const [scheduleData, setScheduleData] = useState([]); // Array from DB
    const [academicYear, setAcademicYear] = useState('2018'); // Dynamic logic recommended here
    
    // Resources for Dropdowns
    const [allSubjects, setAllSubjects] = useState([]);
    const [allTeachers, setAllTeachers] = useState([]);

    // Selection Modal
    const [selectedSlot, setSelectedSlot] = useState(null); // { day, period }
    const [formSubject, setFormSubject] = useState('');
    const [formTeacher, setFormTeacher] = useState('');

    // --- LOAD INITIAL DATA ---
    useEffect(() => {
        const loadResources = async () => {
            try {
                const [gradesRes, subRes, teachRes] = await Promise.all([
                    studentService.getAllStudents(), // To get unique grade levels
                    subjectService.getAllSubjects(),
                    userService.getAll() // Filter for role='teacher' in backend or here
                ]);

                // Extract Unique Grades
                const uniqueGrades = [...new Set(gradesRes.data.data.map(s => s.gradeLevel))].sort();
                setAvailableGrades(uniqueGrades);
                setAllSubjects(subRes.data.data);

                // Assuming getAllUsers returns all, filter for teachers
                setAllTeachers(teachRes.data.filter(u => u.role === 'teacher'));

            } catch (err) { console.error(err); }
        };
        loadResources();
    }, []);

    // --- FETCH SCHEDULE ---
    const fetchSchedule = async () => {
        if (!gradeLevel) return;
        try {
            const res = await scheduleService.getClassSchedule(gradeLevel, academicYear);
            setScheduleData(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, [gradeLevel]);

    // --- HELPERS ---
    const getSlotData = (day, period) => {
        return scheduleData.find(s => s.dayOfWeek === day && s.period === period);
    };

    const handleCellClick = (day, period) => {
        const existing = getSlotData(day, period);
        setSelectedSlot({ day, period });
        setFormSubject(existing?.subject?._id || '');
        setFormTeacher(existing?.teacher?._id || '');
    };
     
    const handleAutoGenerate = async (category) => {
        const confirmMsg = `⚠️ WARNING: This will DELETE the existing ${category} schedule for ${academicYear}.\n\nAre you sure?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            await scheduleService.generate({ academicYear, category });
            alert(`${category} Schedule Generated Successfully!`);
            fetchSchedule(); 
        } catch (err) {
            console.log(err)

            alert(err.response?.data?.message || "Generation Failed");
        }
    };

    const handleSaveSlot = async () => {
        if (!formSubject || !formTeacher) return;
        try {
            await scheduleService.assignSlot({
                gradeLevel,
                academicYear,
                dayOfWeek: selectedSlot.day,
                period: selectedSlot.period,
                subjectId: formSubject,
                teacherId: formTeacher
            });
            setSelectedSlot(null);
            fetchSchedule(); // Refresh grid
        } catch (err) {
            alert(err.response?.data?.message || "Error assigning slot");
        }
    };

    const handleClearSlot = async () => {
        if (!window.confirm("Clear this slot?")) return;
        try {
            await scheduleService.deleteSlot({
                gradeLevel,
                dayOfWeek: selectedSlot.day,
                period: selectedSlot.period,
                academicYear
            });
            setSelectedSlot(null);
            fetchSchedule();
        } catch (err) { alert("Error clearing slot"); }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            
            {/* --- CONTROLS --- */}
            <div className="bg-white p-4 rounded-xl shadow mb-6 flex flex-col md:flex-row justify-between items-center no-print">
                <div className="flex gap-4 items-center">
                    <h2 className="text-xl font-bold text-gray-800">📅 Class Schedule</h2>
                    <select 
                        className="border p-2 rounded" 
                        value={gradeLevel} 
                        onChange={e => setGradeLevel(e.target.value)}
                    >
                        <option value="">-- Select Grade --</option>
                        {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded font-bold hover:bg-slate-800">
                    🖨️ Print Timetable
                </button>
            </div>
            <div>
                <div className="flex gap-2">
                    {/* Split Button for KG and Grade */}
                    <div className="flex bg-purple-600 rounded overflow-hidden">
                        <button 
                            onClick={() => handleAutoGenerate('Kg')} 
                            className="px-3 py-2 text-white font-bold hover:bg-purple-700 border-r border-purple-500 text-sm"
                        >
                            ⚡ Gen KG
                        </button>
                        <button 
                            onClick={() => handleAutoGenerate('Primary')} 
                            className="px-3 py-2 text-white font-bold hover:bg-purple-700 text-sm"
                        >
                            ⚡ Gen Grade
                        </button>
                    </div>

                    <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded font-bold hover:bg-slate-800">
                        🖨️ Print
                    </button>
                </div>
            </div>

            {/* --- THE GRID --- */}
            {gradeLevel ? (
                <div className="bg-white p-8 rounded-xl shadow-lg print:shadow-none print:p-0">
                    
                    {/* Print Header */}
                    <div className="hidden print:block text-center mb-6 border-b-4 border-slate-900 pb-2">
                        <h1 className="text-3xl font-black uppercase">Freedom KG & Primary School</h1>
                        <h2 className="text-xl font-bold mt-1">Class Schedule: <span className="text-blue-700">{gradeLevel}</span></h2>
                        <p className="text-sm text-gray-500">{academicYear}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-800">
                            <thead>
                                <tr className="bg-slate-900 text-white print:bg-slate-900 print:text-white">
                                    <th className="p-3 border border-gray-600 w-24">Time / Day</th>
                                    {PERIODS.map(p => (
                                        <th key={p} className="p-3 border border-gray-600 text-center w-32">
                                            Period {p}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {DAYS.map(day => (
                                    <tr key={day} className="hover:bg-gray-50">
                                        {/* Day Column */}
                                        <td className="p-3 border border-gray-400 font-bold bg-gray-100 print:bg-gray-200">
                                            {day}
                                        </td>

                                        {/* Period Cells */}
                                        {PERIODS.map(period => {
                                            const data = getSlotData(day, period);
                                            return (
                                                <td 
                                                    key={`${day}-${period}`} 
                                                    onClick={() => handleCellClick(day, period)}
                                                    className={`p-2 border border-gray-400 text-center cursor-pointer transition-colors h-24
                                                        ${data ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-yellow-50'}
                                                    `}
                                                >
                                                    {data ? (
                                                        <div className="flex flex-col justify-center h-full">
                                                            <span className="font-bold text-slate-800 text-sm">{data.subject?.name}</span>
                                                            <span className="text-xs text-gray-500 mt-1">{data.teacher?.fullName}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-200 text-xs no-print">+ Add</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Break Times / Lunch (Optional Footer Info) */}
                    <div className="mt-4 text-xs text-gray-500 text-center print:block hidden">
                        * Period 4 is followed by Lunch Break (12:30 - 1:30)
                    </div>

                </div>
            ) : (
                <div className="text-center p-20 text-gray-400">Please select a Grade Level to view/edit the schedule.</div>
            )}

            {/* --- EDIT MODAL --- */}
            {selectedSlot && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                        <h3 className="text-lg font-bold mb-4">Edit Slot: {selectedSlot.day} - Period {selectedSlot.period}</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Subject</label>
                                <select 
                                    className="w-full border p-2 rounded"
                                    value={formSubject}
                                    onChange={e => setFormSubject(e.target.value)}
                                >
                                    <option value="">Select Subject</option>
                                    {allSubjects?.filter(s => s.gradeLevel === gradeLevel).map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold mb-1">Teacher</label>
                                <select 
                                    className="w-full border p-2 rounded"
                                    value={formTeacher}
                                    onChange={e => setFormTeacher(e.target.value)}
                                >
                                    <option value="">Select Teacher</option>
                                    {allTeachers.map(t => (
                                        <option key={t._id} value={t._id}>{t.fullName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button onClick={handleSaveSlot} className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Save</button>
                                <button onClick={handleClearSlot} className="bg-red-50 text-red-600 px-4 py-2 rounded hover:bg-red-100">Clear</button>
                                <button onClick={() => setSelectedSlot(null)} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ScheduleManager;