import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import attendanceService from '@shared/services/attendanceService';

const ParentAttendanceTracker = ({ studentId }) => {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentAttendance = async () => {
            try {
                // የተማሪውን መገኘት መረጃዎች መጫን
                const res = await attendanceService.getStudentAttendance(studentId);
                setStats(res.data.stats);
                setHistory(res.data.history);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (studentId) fetchStudentAttendance();
    }, [studentId]);

    if (loading) return <p className="text-center py-6 text-sm text-slate-400">{t('loading')}</p>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-bold text-slate-800">📅 {t('attendance_tracker') || 'Attendance Tracker'}</h3>
                <p className="text-xs text-slate-500">Live attendance percentage and absence logs</p>
            </div>

            {/* Quick Stats Grid */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center">
                        <span className="text-xs text-green-600 font-bold uppercase">{t('attendance_rate') || 'Attendance Rate'}</span>
                        <h4 className="text-2xl font-black text-green-700 mt-1">{stats.rate}%</h4>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
                        <span className="text-xs text-blue-600 font-bold uppercase">{t('present') || 'Present'}</span>
                        <h4 className="text-2xl font-black text-blue-700 mt-1">{stats.present} {t('days')}</h4>
                    </div>
                    <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-center">
                        <span className="text-xs text-red-600 font-bold uppercase">{t('absent') || 'Absent'}</span>
                        <h4 className="text-2xl font-black text-red-700 mt-1">{stats.absent} {t('days')}</h4>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl text-center">
                        <span className="text-xs text-yellow-600 font-bold uppercase">{t('late') || 'Late'}</span>
                        <h4 className="text-2xl font-black text-yellow-700 mt-1">{stats.late} {t('days')}</h4>
                    </div>
                </div>
            )}

            {/* Attendance History List */}
            <div className="bg-white border rounded-xl p-4">
                <h4 className="font-bold text-slate-700 mb-3 border-b pb-2 text-sm">{t('absence_logs') || 'Absence & Lateness Logs'}</h4>
                {history.length > 0 ? (
                    <div className="space-y-3">
                        {history.map((log, index) => (
                            <div key={index} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg text-xs font-semibold">
                                <span className="text-slate-600">{new Date(log.date).toLocaleDateString()}</span>
                                <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                                    log.status === 'Absent' ? 'bg-red-100 text-red-700' :
                                    log.status === 'Late' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                    {t(log.status.toLowerCase()) || log.status}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-xs text-slate-400 py-6 italic">{t('no_absences') || 'No absence or lateness recorded. Great job!'}</p>
                )}
            </div>
        </div>
    );
};

export default ParentAttendanceTracker;