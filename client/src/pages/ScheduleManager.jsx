// src/components/ScheduleManager.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import scheduleService from '@shared/services/scheduleService';
import gradeLevelService from '@shared/services/gradeLevelService';
import subjectService from '@shared/services/subjectService'; 
import userService from '@shared/services/userService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const getEthiopianYear = (gregorianDate = new Date()) => {
    const year = gregorianDate.getFullYear();
    const month = gregorianDate.getMonth();
    const day = gregorianDate.getDate();

    let ethiopianYear = year - 8;
    if (month > 8 || (month === 8 && day >= 11)) {
        ethiopianYear = year - 7;
    }
    return ethiopianYear;
};

// Safe helper to extract GradeLevel ObjectID
const getGradeId = (gl) => {
    if (!gl) return '';
    if (typeof gl === 'object' && gl._id) return gl._id.toString();
    return String(gl);
};

// Safe helper to extract GradeLevel Name
const getGradeName = (gl) => {
    if (!gl) return '';
    if (typeof gl === 'object' && gl.name) return gl.name;
    return String(gl);
};

const ScheduleManager = () => {
    const { t } = useTranslation();

    const [gradeLevel, setGradeLevel] = useState(''); // Stores GradeLevel ObjectId
    const [availableGrades, setAvailableGrades] = useState([]); // Array of GradeLevel objects { _id, name }
    const [scheduleData, setScheduleData] = useState([]); 
    const [academicYear] = useState(getEthiopianYear().toString()); 
    
    const [allSubjects, setAllSubjects] = useState([]);
    const [allTeachers, setAllTeachers] = useState([]);

    const [selectedSlot, setSelectedSlot] = useState(null);
    const [formSubject, setFormSubject] = useState('');
    const [formTeacher, setFormTeacher] = useState('');

    // Active Grade Level display name
    const activeGradeName = useMemo(() => {
        const found = availableGrades.find(g => g._id === gradeLevel || g.name === gradeLevel);
        return found ? found.name : gradeLevel;
    }, [availableGrades, gradeLevel]);

    // --- LOAD RESOURCES ---
    useEffect(() => {
        const loadResources = async () => {
            try {
                const [gradesRes, subRes, teachRes] = await Promise.all([
                    gradeLevelService.getAllGradeLevels(), 
                    subjectService.getAllSubjects(),
                    userService.getAll() 
                ]);

                const grades = gradesRes.data?.data || gradesRes.data || [];
                const subjects = subRes.data?.data || subRes.data || [];
                const users = teachRes.data?.data || teachRes.data || [];

                setAvailableGrades(grades.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));
                setAllSubjects(subjects);

                const teachersList = Array.isArray(users) ? users.filter(u => u.role === 'teacher') : [];
                setAllTeachers(teachersList);

            } catch (err) { 
                console.error("Error loading schedule resources:", err); 
            }
        };
        loadResources();
    }, []);

    // --- FETCH SCHEDULE ---
    const fetchSchedule = async () => {
        if (!gradeLevel) return;
        try {
            const res = await scheduleService.getClassSchedule(gradeLevel, academicYear);
            setScheduleData(res.data?.data || res.data || []);
        } catch (err) {
            console.error("Error fetching schedule:", err);
            setScheduleData([]);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, [gradeLevel, academicYear]);

    // --- WORKLOAD SUMMARY CALCULATION ---
    const workloadSummary = useMemo(() => {
        if (!gradeLevel) return [];

        return allSubjects
            .filter(s => Array.isArray(s.gradeLevels) && s.gradeLevels.some(gl => {
                const gId = getGradeId(gl.gradeLevel);
                const gName = getGradeName(gl.gradeLevel);
                return gId === gradeLevel || gName === gradeLevel || gId === activeGradeName;
            }))
            .map(subj => {
                const gradeConfig = subj.gradeLevels.find(gl => {
                    const gId = getGradeId(gl.gradeLevel);
                    const gName = getGradeName(gl.gradeLevel);
                    return gId === gradeLevel || gName === gradeLevel || gId === activeGradeName;
                });

                const totalNeeded = gradeConfig ? parseInt(gradeConfig.sessionsPerWeek, 10) : 0;
                
                const assignedCount = scheduleData.filter(slot => {
                    const slotSubjId = slot.subject?._id || slot.subject;
                    return String(slotSubjId) === String(subj._id);
                }).length;

                const remaining = Math.max(0, totalNeeded - assignedCount);

                // Find assigned teacher for this subject and grade level
                const assignedTeacher = allTeachers.find(teacher => 
                    Array.isArray(teacher.subjectsTaught) &&
                    teacher.subjectsTaught.some(st => {
                        const subjId = st.subject?._id || st.subject;
                        const stGradeId = getGradeId(st.gradeLevel);
                        const stGradeName = getGradeName(st.gradeLevel);

                        const subjectMatches = String(subjId) === String(subj._id);
                        const gradeMatches = stGradeId === gradeLevel || stGradeName === activeGradeName || stGradeId === activeGradeName;

                        return subjectMatches && gradeMatches;
                    })
                );

                return {
                    subject: subj,
                    teacher: assignedTeacher,
                    totalNeeded,
                    assignedCount,
                    remaining
                };
            });
    }, [allSubjects, scheduleData, allTeachers, gradeLevel, activeGradeName]);

    // --- HELPERS ---
    const getSlotData = (day, period) => {
        return scheduleData.find(s => s.dayOfWeek === day && s.period === period);
    };

    const handleCellClick = (day, period) => {
        const existing = getSlotData(day, period);
        setSelectedSlot({ day, period });
        setFormSubject(existing?.subject?._id || existing?.subject || '');
        setFormTeacher(existing?.teacher?._id || existing?.teacher || '');
    };

    const handleSubjectSelection = (subjectId) => {
        setFormSubject(subjectId);
        
        const matchedWorkload = workloadSummary.find(w => w.subject._id === subjectId);
        if (matchedWorkload && matchedWorkload.teacher) {
            setFormTeacher(matchedWorkload.teacher._id);
        } else {
            setFormTeacher('');
        }
    };
     
    const handleAutoGenerate = async (category) => {
        const confirmMsg = `⚠️ WARNING: This will DELETE the existing ${category} schedule for ${academicYear} E.C.\n\nAre you sure you want to auto-generate?`;
        if (!window.confirm(confirmMsg)) return;

        try {
            await scheduleService.generate({ academicYear, category });
            alert(`${category} Schedule Generated Successfully!`);
            fetchSchedule(); 
        } catch (err) {
            alert(err.response?.data?.message || "Generation Failed");
        }
    };

    const handleSaveSlot = async () => {
        if (!formSubject || !formTeacher) {
            alert("Please select both a Subject and a Teacher.");
            return;
        }
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
            fetchSchedule();
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
            <div className="bg-white p-4 rounded-xl shadow mb-6 flex flex-col md:flex-row justify-between items-center no-print gap-4">
                <div className="flex gap-4 items-center">
                    <h2 className="text-xl font-bold text-gray-800">📅 Class Schedule</h2>
                    <select 
                        className="border p-2 rounded bg-gray-50 font-bold text-gray-700" 
                        value={gradeLevel} 
                        onChange={e => setGradeLevel(e.target.value)}
                    >
                        <option value="">-- Select Grade Level --</option>
                        {availableGrades.map(g => (
                            <option key={g._id} value={g._id}>{g.name}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex gap-2">
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
                        🖨️ Print Timetable
                    </button>
                </div>
            </div>

            {/* --- THE GRID & SIDEBAR LAYOUT --- */}
            {gradeLevel ? (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    
                    {/* LEFT/MAIN: Timetable Grid */}
                    <div className="xl:col-span-3 bg-white p-8 rounded-xl shadow-lg print:shadow-none print:p-0">
                        {/* Print Header */}
                        <div className="hidden print:block text-center mb-6 border-b-4 border-slate-900 pb-2">
                            <h1 className="text-3xl font-black uppercase">Freedom KG & Primary School</h1>
                            <h2 className="text-xl font-bold mt-1">Class Schedule: <span className="text-blue-700">{activeGradeName}</span></h2>
                            <p className="text-sm text-gray-500">{academicYear} E.C.</p>
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
                                            <td className="p-3 border border-gray-400 font-bold bg-gray-100 print:bg-gray-200">
                                                {day}
                                            </td>

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
                                                                <span className="font-bold text-slate-800 text-sm">
                                                                    {data.subject?.name || 'Subject'}
                                                                </span>
                                                                <span className="text-xs text-gray-500 mt-1">
                                                                    {data.teacher?.fullName || 'Teacher'}
                                                                </span>
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

                        <div className="mt-4 text-xs text-gray-500 text-center print:block hidden">
                            * Period 4 is followed by Lunch Break (12:30 - 1:30)
                        </div>
                    </div>

                    {/* RIGHT: Workload / Pending Assignments Panel */}
                    <div className="xl:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit no-print">
                        <h3 className="text-md font-bold text-slate-800 mb-3 border-b pb-2 flex items-center gap-2">
                            📋 Pending Assignments
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                            Ensure all curriculum periods required for <strong className="text-slate-700">{activeGradeName}</strong> are allocated.
                        </p>

                        <div className="space-y-3">
                            {workloadSummary.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No subjects assigned to this grade level yet.</p>
                            ) : (
                                workloadSummary.map(({ subject, teacher, totalNeeded, assignedCount, remaining }) => (
                                    <div 
                                        key={subject._id} 
                                        className={`p-3 rounded-lg border text-xs transition-all ${
                                            remaining === 0 
                                                ? 'bg-green-50 border-green-200 text-green-800' 
                                                : 'bg-amber-50 border-amber-200 text-amber-800'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center font-bold mb-1">
                                            <span className="text-sm">{subject.name}</span>
                                            <span>{remaining === 0 ? '✓' : `Pending: ${remaining}`}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            Allocated: <strong className="text-slate-700">{assignedCount} of {totalNeeded}</strong> periods/wk
                                        </p>
                                        {teacher ? (
                                            <p className="text-[10px] text-gray-500 mt-0.5">
                                                Teacher: <strong className="text-slate-700">{teacher.fullName}</strong>
                                            </p>
                                        ) : (
                                            <p className="text-[10px] text-red-500 font-semibold mt-0.5">
                                                ⚠️ No teacher assigned in settings
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
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
                                    onChange={e => handleSubjectSelection(e.target.value)}
                                >
                                    <option value="">Select Subject</option>
                                    {workloadSummary.map(({ subject, remaining }) => (
                                        <option key={subject._id} value={subject._id}>
                                            {subject.name} ({remaining === 0 ? 'Fully Placed' : `${remaining} periods left`})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold mb-1">Teacher</label>
                                <select 
                                    className="w-full border p-2 rounded bg-gray-50 cursor-not-allowed"
                                    value={formTeacher}
                                    onChange={e => setFormTeacher(e.target.value)}
                                    disabled={true}
                                >
                                    <option value="">Select Teacher</option>
                                    {allTeachers.map(t => (
                                        <option key={t._id} value={t._id}>{t.fullName}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    Teacher is automatically assigned based on subject course settings.
                                </p>
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