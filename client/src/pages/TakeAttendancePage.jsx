import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import studentService from '@shared/services/studentService';
import attendanceService from '@shared/services/attendanceService'; // ⚠️ የ attendance ሰርቪስህን ጥራ

const TakeAttendancePage = () => {
    const { t } = useTranslation();
    const [students, setStudents] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('Grade 7A'); // መምህሩ የሚያስተምረው ሆምሩም
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // የዛሬ ቀን
    const [records, setRecords] = useState({}); // { [studentId]: 'Present' / 'Absent' / 'Late' }
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // 1. የተማሪዎች ዝርዝር መጫን
    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const res = await studentService.getAllStudents({ gradeLevel: selectedGrade });
                const studentList = res.data.data.sort((a,b) => a.fullName.localeCompare(b.fullName));
                setStudents(studentList);

                // መዝገቦችን Present ብሎ ማስጀመር
                const initialRecords = {};
                studentList.forEach(s => { initialRecords[s._id] = 'Present'; });
                setRecords(initialRecords);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [selectedGrade]);

    const handleStatusChange = (studentId, status) => {
        setRecords(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSaveAttendance = async () => {
        setSaving(true);
        const recordsPayload = Object.entries(records).map(([studentId, status]) => ({
            student: studentId,
            status
        }));

        try {
            await attendanceService.takeAttendance({
                gradeLevel: selectedGrade,
                date,
                records: recordsPayload
            });
            alert("✅ Attendance saved successfully!");
        } catch (err) {
            console.error(err);
            alert("❌ Failed to save attendance.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p className="text-center p-10">{t('loading')}</p>;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">📅 {t('take_attendance') || 'Take Attendance'}</h2>
                    <p className="text-sm text-gray-500">{selectedGrade} • {date}</p>
                </div>
                <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    className="border p-2 rounded-lg font-bold text-slate-700" 
                />
            </div>

            <div className="space-y-4">
                {students.map((student, idx) => (
                    <div key={student._id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-gray-50 rounded-xl border border-slate-100 gap-4">
                        
                        {/* በግራ በኩል፦ የተማሪው ፎቶ፣ ስም፣ መታወቂያ እና የጤና ሁኔታ */}
                        <div className="flex items-center gap-4">
                            <span className="text-slate-400 font-mono text-xs">{idx + 1}.</span>
                            
                            {/* ⚠️ የተማሪው ፎቶ አምሳል (Avatar) */}
                            <img 
                                src={student.imageUrl} 
                                alt={student.fullName} 
                                className="w-10 h-10 rounded-full object-cover border border-slate-200" 
                            />
                            
                            <div>
                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                    {student.fullName}
                                    
                                    {/* ⚠️ የጤና ማስጠንቀቂያ ምልክት (No known conditions ካልሆነ በስተቀር ወዲያውኑ ምልክት ያሳያል) [2] */}
                                    {student.healthStatus && student.healthStatus !== 'No known conditions' && (
                                        <span 
                                            className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer"
                                            title={`Health Alert: ${student.healthStatus}`}
                                        >
                                            ⚠️ {t('health_alert') || 'Health Alert'}
                                        </span>
                                    )}
                                </h4>
                                <div className="flex gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                                    <span>ID: {student.studentId}</span>
                                    <span>•</span>
                                    <span>{t(student.gender)}</span>
                                </div>
                            </div>
                        </div>

                        {/* በቀኝ በኩል፦ የወላጅ ስልክ እና የመቅረት/መገኘት መቀያየሪያ */}
                        <div className="flex items-center gap-4 justify-between sm:justify-end">
                            
                            {/* ⚠️ በአደጋ ጊዜ በቀጥታ ወደ እናት ወይም አባት ለመደወል የሚያስችሉ ቁልፎች */}
                            <div className="flex gap-1.5 text-xs no-print">
                                {student.motherContact && (
                                    <a href={`tel:${student.motherContact}`} className="bg-slate-100 hover:bg-pink-50 hover:text-pink-600 p-2 rounded-lg font-bold transition-all" title={`Call Mother: ${student.motherContact}`}>
                                        👩📞
                                    </a>
                                )}
                                {student.fatherContact && (
                                    <a href={`tel:${student.fatherContact}`} className="bg-slate-100 hover:bg-pink-50 hover:text-pink-600 p-2 rounded-lg font-bold transition-all" title={`Call Father: ${student.fatherContact}`}>
                                        👨📞
                                    </a>
                                )}
                            </div>

                            {/* Toggle Status Buttons */}
                            <div className="flex gap-1.5">
                                {['Present', 'Absent', 'Late', 'Excused'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(student._id, status)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                                            records[student._id] === status
                                                ? status === 'Present' ? 'bg-green-600 text-white shadow' :
                                                  status === 'Absent' ? 'bg-red-600 text-white shadow' :
                                                  status === 'Late' ? 'bg-yellow-500 text-white shadow' : 'bg-blue-600 text-white shadow'
                                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button 
                onClick={handleSaveAttendance} 
                disabled={saving || students.length === 0}
                className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition-colors"
            >
                {saving ? "Saving..." : "Save Attendance"}
            </button>
        </div>
    );
};

export default TakeAttendancePage;