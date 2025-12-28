import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <--- Import Hook
import ActionCard from './ActionCard';

function IsStaff({ profileData }) {
  const { t } = useTranslation(); // <--- Initialize

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">{t('teacher_dashboard')}</h2>
        <p className="text-lg text-gray-600 m-0">
          {t('welcome')}, {profileData.fullName}!
        </p>
        <Link to="/profile" state={{ profileData }} className="text-gray-400 italic font-bold hover:text-gray-600 transition-colors">
          {t('change_credentials')}
        </Link>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        
        {/* Homeroom Card */}
        {profileData.homeroomGrade && (
          <ActionCard 
            to="/roster" 
            title={`${t('my_homeroom')}: ${profileData.homeroomGrade}`} 
            description={t('homeroom_desc')} 
          />
        )}

        {/* Subject Cards */}
        {profileData.subjectsTaught?.map(assignment => (
          assignment.subject && (
            <ActionCard 
              key={assignment.subject._id}
              to="/subject-roster"
              title={assignment.subject.name}
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