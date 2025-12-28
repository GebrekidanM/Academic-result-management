import React from 'react';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next'; // <--- Import Hook
import ActionCard from './ActionCard';
import StatCard from './StatCard';

function IsAdmin({ currentUser, profileData, stats }) {
  const { t } = useTranslation(); // <--- Initialize Hook

  return (
    <div className="space-y-8 mb-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">
          {t('welcome')} {currentUser.fullName}
        </h2>
        <Link to="/profile" state={{ profileData }} className="text-gray-400 italic pb-2 font-bold hover:text-gray-600 transition-colors">
          {t('change_credentials')}
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title={t('active_students')} 
          link={'/students'} 
          value={stats?.students ?? '...'} 
          icon={'🎓'} 
        />
        <StatCard 
          title={t('teachers')} 
          link="/teachers" 
          value={stats?.teachers ?? '...'} 
          icon={'👩‍🏫'} 
        />
        <StatCard 
          title={t('subjects')} 
          link={"/subjects"} 
          value={stats?.subjects ?? '...'} 
          icon={'📚'} 
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-bold text-gray-700 mb-4">{t('quick_actions')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionCard 
            to="/admin/users" 
            title={t('manage_staff')} 
            description={t('user_mgmt_desc')} 
          />
          <ActionCard 
            to="/subjects" 
            title={t('manage_subjects')} 
            description={t('subject_mgmt_desc')} 
          />
          <ActionCard 
            to="/manage-assessments" 
            title={t('manage_assessments')} 
            description={t('assessment_mgmt_desc')} 
          />
          <ActionCard 
            to="/students/import" 
            title={t('import_excel')} 
            description={t('bulk_import_desc')} 
          />
        </div>
      </div>
    </div>
  );
}

export default IsAdmin;