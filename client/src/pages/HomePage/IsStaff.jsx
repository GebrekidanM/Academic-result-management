import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pie } from 'react-chartjs-2'; // ⚠️ የፓይ ቻርት ማስመጫ [2]
import {
  Chart as ChartJS,
  ArcElement, // ⚠️ ለፓይ ቻርት የሚያስፈልግ ፕለጊን
  Tooltip,
  Legend
} from 'chart.js';
import studentService from '@shared/services/studentService'; // ⚠️ የተማሪዎችን መረጃ ለመጥራት
import ActionCard from './ActionCard';
import ScheduleForTeacher from '../ScheduleForTeacher';

ChartJS.register(ArcElement, Tooltip, Legend);

function IsStaff({ profileData }) {
  const { t } = useTranslation();

  // ⚠️ 1. የተማሪዎች ፆታ ቆጠራ ስቴቶች (States)
  const [homeroomStats, setHomeroomStats] = useState({ male: 0, female: 0 });
  const [statsLoading, setStatsLoading] = useState(false);

  // ⚠️ 2. መምህሩ የክፍል ኃላፊ ከሆነ የተማሪዎችን መረጃ ከዳታቤዝ በራስ-ሰር ፈልጎ መቁጠር [2]
  useEffect(() => {
    const fetchHomeroomStats = async () => {
        if (!profileData?.homeroomGrade) return;
        setStatsLoading(true);
        try {
            // መደበኛውን የተማሪዎች መፈለጊያ ኤፒአይ በክፍል ደረጃ መገደብ [2]
            const res = await studentService.getAllStudents({ gradeLevel: profileData.homeroomGrade });
            const studentList = res.data?.data || [];
            
            let male = 0, female = 0;
            studentList.forEach(s => {
                if (s.gender === 'Male') male++;
                else if (s.gender === 'Female') female++;
            });
            setHomeroomStats({ male, female });
        } catch (err) {
            console.error("Error fetching homeroom stats:", err);
        } finally {
            setStatsLoading(false);
        }
    };
    fetchHomeroomStats();
  }, [profileData?.homeroomGrade]);

  // ⚠️ 3. የፓይ ገበታ ዳታዎች ማዋቀር (የሲስተሙን የፆታ ቀለሞች ወጥነት ለመጠበቅ) [2]
  const pieData = useMemo(() => {
    return {
        labels: [t('Male') || 'Male', t('Female') || 'Female'],
        datasets: [
            {
                data: [homeroomStats.male, homeroomStats.female],
                backgroundColor: ['#4f46e5', '#db2777'], // ሰማያዊ እና ሮዝ የፆታ ቀለማት
                borderWidth: 1,
            }
        ]
    };
  }, [homeroomStats, t]);

  const pieOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
          legend: {
              position: 'bottom',
              labels: {
                  boxWidth: 12,
                  font: { size: 10, weight: 'bold' }
              }
          }
      }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{t('teacher_dashboard')}</h2>
        <p className="text-sm text-slate-500 mt-1">
          {t('welcome') || 'Welcome'}, <span className="font-bold text-pink-600">{profileData.fullName}</span>!
        </p>
        <Link to="/profile" state={{ profileData }} className="text-xs text-slate-400 font-bold hover:text-pink-600 transition-colors inline-block mt-1">
          ⚙️ {t('change_credentials')}
        </Link>
      </div>

      {/* ⚠️ 4. የክፍለ-ጊዜ ሰሌዳ እና የፆታ ንፅፅር ግራፍ ጎን ለጎን የተቀመጡበት ባለሁለት አምድ እይታ [2] */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Schedule Table (2/3 Width) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm overflow-x-auto">
            <ScheduleForTeacher/>
        </div>

        {/* Right: Homeroom Gender Pie Chart (1/3 Width - የክፍል ኃላፊ ከሆነ ብቻ ይወጣል) [2] */}
        {profileData?.homeroomGrade && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">📊 {t('homeroom_demographics') || 'Homeroom Demographics'}</h3>
                    <p className="text-xs text-slate-500 mt-1">Gender distribution of {profileData.homeroomGrade}</p>
                </div>
                
                {statsLoading ? (
                    <div className="h-40 flex items-center justify-center text-xs text-slate-400 italic">Calculating...</div>
                ) : (
                    <div className="h-40 my-3">
                        <Pie data={pieData} options={pieOptions} />
                    </div>
                )}
                
                <div className="text-center text-[10px] text-slate-400 font-bold border-t pt-2">
                    Total Enrolled: {homeroomStats.male + homeroomStats.female} Students
                </div>
            </div>
        )}
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        
        {/* HOMEROOM ATTENDANCE CARD */}
        {profileData.homeroomGrade && (
          <ActionCard 
            to="/teacher/attendance" 
            title={`📅 ${t('take_attendance') || 'Take Attendance'}`} 
            description={`${t('take_attendance_desc') || 'Record daily student attendance for'} ${profileData.homeroomGrade}`} 
          />
        )}

        {/* Homeroom Card */}
        {profileData.homeroomGrade && (
          <ActionCard 
            to="/roster" 
            title={`👥 ${t('my_homeroom')}: ${profileData.homeroomGrade}`} 
            description={t('homeroom_desc')} 
          />
        )}

        <ActionCard 
          to="/teacher/quizzes" 
          title={'📝 My Quizzes'} 
          description={'Create, edit and view quiz results'} 
        />
          
        {/* Subject Cards */}
        {profileData.subjectsTaught?.map(assignment => (
          assignment.subject && (
            <ActionCard 
              key={assignment.subject._id}
              to="/subject-roster"
              title={`📚 ${assignment.subject.name}`}
              description={`${t('view_marklist')} ${assignment.subject.gradeLevel}.`}
              state={{ subjectId: assignment.subject._id }}
            />
          )
        ))}
      </div>

      {/* Empty State */}
      {profileData.subjectsTaught?.length === 0 && !profileData.homeroomGrade && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
            <p className="text-yellow-700">{t('no_duties_assigned')}</p>
        </div>
      )}
    </div>
  );
}

export default IsStaff;