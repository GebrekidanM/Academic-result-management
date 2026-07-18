import React, { useMemo } from 'react';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Filler, Legend} from 'chart.js';
import ActionCard from './ActionCard';
import StatCard from './StatCard';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Filler, Legend);

function IsAdmin({ currentUser, profileData, stats }) {
  const { t } = useTranslation();

  const attendanceChartData = useMemo(() => {
    const trend = stats?.attendanceTrend || [100, 100, 100, 100, 100, 100, 100, 100, 100, 100];
    
    return {
      labels: ['September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'],
      datasets: [
        {
          label: t('attendance_rate') || 'Attendance Rate',
          data: trend,
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.05)',
          fill: true,
          tension: 0.4,
        }
      ]
    };
  }, [stats, t]);

  const genderChartData = useMemo(() => {
    const dist = stats?.genderDistribution || {
      kg: { male: 0, female: 0 },
      primary: { male: 0, female: 0 },
      highSchool: { male: 0, female: 0 }
    };

    return {
      labels: [t('level_kg') || 'Kindergarten', t('level_primary') || 'Primary', t('level_high_school') || 'High School'],
      datasets: [
        {
          label: t('Male') || 'Male',
          data: [dist.kg.male, dist.primary.male, dist.highSchool.male],
          backgroundColor: '#4f46e5',
          borderRadius: 6,
        },
        {
          label: t('Female') || 'Female',
          data: [dist.kg.female, dist.primary.female, dist.highSchool.female],
          backgroundColor: '#db2777',
          borderRadius: 6,
        }
      ]
    };
  }, [stats, t]);


  // ====================================================
  // NEW: HISTORICAL ENROLLMENT CHART DATA (CHART.JS)
  // ====================================================
  const genderHistoryChartData = useMemo(() => {
    const history = stats?.genderHistory || [];

    const labels = history.map(item => item.year);
    const maleData = history.map(item => item.male);
    const femaleData = history.map(item => item.female);

    return {
      labels,
      datasets: [
        {
          label: t('Male') || 'Male',
          data: maleData,
          backgroundColor: '#3b82f6', // Academic Blue
          borderRadius: 6,
        },
        {
          label: t('Female') || 'Female',
          data: femaleData,
          backgroundColor: '#ec4899', // Academic Pink
          borderRadius: 6,
        }
      ]
    };
  }, [stats, t]);
  // ====================================================


  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { min: 80, max: 100, ticks: { callback: (value) => `${value}%` } } }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } }
  };

  return (
    <div className="space-y-8 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard 
                    title={t('active_students')} 
                    link='/students' 
                    value={stats?.students ?? '...'} 
                    icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55a5.981 5.981 0 006.75 15.75v-1.5" />
                        </svg>
                    } 
                />
                <StatCard 
                    title={t('teachers')} 
                    link="/teachers" 
                    value={stats?.teachers ?? '...'} 
                    icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                    } 
                />
                <StatCard 
                    title={t('subjects')} 
                    link="/subjects" 
                    value={stats?.subjects ?? '...'} 
                    icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                    } 
                />
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">✅</div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('attendance')}</p>
                        <h4 className="text-xl font-black text-green-600">{stats?.attendanceRate !== undefined ? `${stats.attendanceRate}%` : '100%'}</h4>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">📈 {t('attendance_trend') || 'Attendance Trend'}</h3>
                        <p className="text-xs text-slate-500">Monthly student attendance overview</p>
                    </div>
                    <div className="h-64">
                        <Line data={attendanceChartData} options={lineOptions} />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">📊 {t('student_demographics') || 'Student Demographics'}</h3>
                        <p className="text-xs text-slate-500">Gender distribution by school level [2]</p>
                    </div>
                    <div className="h-64">
                        <Bar data={genderChartData} options={barOptions} />
                    </div>
                </div>
            </div>

            {/* ==================================================== */}
            {/* NEW: HISTORICAL ENROLLMENT CHART (FULL WIDTH) */}
            {/* ==================================================== */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="mb-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                        📈 {t('gender_history_title') || 'Historical Enrollment by Gender'}
                    </h3>
                    <p className="text-xs text-slate-500">
                        {t('gender_history_subtitle') || 'Comparison of male and female students across academic years'}
                    </p>
                </div>
                <div className="h-64">
                    <Bar data={genderHistoryChartData} options={barOptions} />
                </div>
            </div>
            {/* ==================================================== */}

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold tracking-tight text-slate-900 mb-5">⚡ {t('quick_actions')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link to="/admin/users" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-pink-50 border border-slate-200 rounded-xl transition-all font-bold text-sm text-slate-700">
                        <span>👥 {t('manage_staff')}</span>
                        <span className="text-pink-600">&rarr;</span>
                    </Link>
                    <Link to="/subjects" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-pink-50 border border-slate-200 rounded-xl transition-all font-bold text-sm text-slate-700">
                        <span>📚 {t('manage_subjects')}</span>
                        <span className="text-pink-600">&rarr;</span>
                    </Link>
                    <Link to="/manage-assessments" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-pink-50 border border-slate-200 rounded-xl transition-all font-bold text-sm text-slate-700">
                        <span>⚙️ {t('manage_assessments')}</span>
                        <span className="text-pink-600">&rarr;</span>
                    </Link>
                    <Link to="/students/import" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-pink-50 border border-slate-200 rounded-xl transition-all font-bold text-sm text-slate-700">
                        <span>📂 {t('import_excel')}</span>
                        <span className="text-pink-600">&rarr;</span>
                    </Link>
                    <Link to="/admin/attendance" className="col-span-1 sm:col-span-2 flex items-center justify-between p-4 bg-slate-50 hover:bg-pink-50 border border-slate-200 rounded-xl transition-all font-bold text-sm text-slate-700">
                        <span>📊 {t('detailed_attendance') || 'View Detailed Attendance Logs'}</span>
                        <span className="text-pink-600">&rarr;</span>
                    </Link>
                </div>
            </div>

        </div>

        <div className="bg-white border border-slate-200 rounded-sm p-6 shadow-sm h-fit">
            <h3 className="text-lg font-semibold text-slate-800 border-b pb-3 mb-4 flex items-center gap-2">
                🔔 {t('recent_activities') || 'Live Activity Feed'}
            </h3>
            
            {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                <div className="space-y-4">
                    {stats.recentLogs.map((log) => (
                        <div key={log._id} className="text-xs border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-pink-600 uppercase tracking-wider">{log.action}</span>
                                <span className="text-[10px] text-slate-400">
                                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-slate-600 font-medium leading-relaxed mb-1">{log.details}</p>
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                                By {log.user?.fullName} ({log.user?.role})
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-slate-400 italic text-center py-6">No recent activities found.</p>
            )}
        </div>
      </div>
    </div>
  );
}

export default IsAdmin;