import React, { useMemo } from 'react';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import ActionCard from './ActionCard';
import StatCard from './StatCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function IsAccountant({ currentUser, profileData, stats }) {
  const { t } = useTranslation();

  // የፆታ ስርጭት ግራፍ ዳታ ማዘጋጀት [2]
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

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } }
  };

  console.log(stats)

  return (
    <div className="space-y-8 mb-6">
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">✅</div>
              <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('attendance')}</p>
                  <h4 className="text-xl font-black text-green-600">{stats?.attendanceRate !== undefined ? `${stats.attendanceRate}%` : '100%'}</h4>
              </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-sm p-4 shadow-sm flex items-center gap-5">
              <div className="w-10 h-10 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center text-md font-bold">💰</div>
              <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('payments') || 'Payments System'}</p>
                  <h3 className="text-xl font-black text-slate-800">Operational</h3>
              </div>
          </div>
      </div>

      {/* --- 2. MAIN 2-COLUMN GRID (ገበታው እና የፈጣን ተግባራት ዝርዝር ጎን ለጎን) [2] --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Student Demographics Chart (2/3 Width) [2] */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="mb-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">📊 {t('student_demographics') || 'Student Demographics'}</h3>
                <p className="text-xs text-slate-500">Gender distribution by school level [2]</p>
            </div>
            <div className="h-64">
                <Bar data={genderChartData} options={barOptions} />
            </div>
        </div>

        {/* Right Column: Accountant Quick Actions List (1/3 Width) [2] */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm h-fit">
            <h3 className="text-lg font-semibold tracking-tight text-slate-900 mb-5">⚡ {t('accountant_actions') || 'Finance & Student Actions'}</h3>
            <div className="space-y-4">
                <Link to="/students" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-pink-50 border border-slate-200 rounded-xl transition-all font-bold text-sm text-slate-700">
                    <span>👥 {t('students_list') || 'Student List (Create & Manage)'}</span>
                    <span className="text-pink-600">&rarr;</span>
                </Link>
                <Link to="/students/import" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-pink-50 border border-slate-200 rounded-xl transition-all font-bold text-sm text-slate-700">
                    <span>📂 {t('import_excel')}</span>
                    <span className="text-pink-600">&rarr;</span>
                </Link>
                {/* አዲሱ የክፍያ መግቢያ [2] */}
                <Link to="/admin/payments" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-pink-50 border border-slate-200 rounded-xl transition-all font-bold text-sm text-slate-700">
                    <span>💰 {t('payment_registry') || 'Record & Audit Payments'}</span>
                    <span className="text-pink-600">&rarr;</span>
                </Link>
                {/* የአናሊቲክስ መግቢያ [2] */}
                <Link to="/analytics" className="flex items-center justify-between p-4 bg-slate-50 hover:bg-pink-50 border border-slate-200 rounded-xl transition-all font-bold text-sm text-slate-700">
                    <span>📈 {t('detailed_analytics') || 'View Student Result Analytics'}</span>
                    <span className="text-pink-600">&rarr;</span>
                </Link>
            </div>
        </div>

      </div>

    </div>
  );
}

export default IsAccountant;