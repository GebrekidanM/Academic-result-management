import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../../utils/theme'; 

import ActionCard from './ActionCard';
import StatCard from './StatCard';

function IsAdmin({ currentUser, profileData, stats }) {
  const { t } = useTranslation();
  const router = useRouter();

  // Extract initials for the avatar placeholder
  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <View className="gap-8 mb-6">
      
      {/* 1. Refined Welcome Profile Banner Card */}
      <View 
        className="flex-col md:flex-row md:items-center justify-between bg-white p-5 rounded-2xl border"
        style={{ borderColor: COLORS?.border || '#e2e8f0' }}
      >
        <View className="flex-row items-center gap-4">
          {/* Avatar Circle */}
          <View className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Text className="text-xl font-black text-pink-600">
              {getInitials(currentUser?.fullName)}
            </Text>
          </View>
          
          <View>
            <Text className="text-lg font-bold text-slate-900 tracking-tight">
              {currentUser?.fullName}
            </Text>
            <Text className="text-xs text-slate-400 font-medium mt-0.5">
              System Administrator
            </Text>
          </View>
        </View>
        
        {/* Modern Pressable Link Action Button Wrapper */}
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => router.push({
            pathname: '/profile',
            params: { profileData: JSON.stringify(profileData) } // Complex objects are passed via dynamic JSON strings on mobile
          })}
          className="mt-4 md:mt-0 flex-row items-center justify-center px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm"
        >
          <Svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="#64748b" strokeWidth={2}>
            <Path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <Path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </Svg>
          <Text className="text-sm font-semibold text-slate-700">
            {t('change_credentials')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. Statistics Grid Layout Row */}
      <View className="flex-row flex-wrap gap-4">
        <View className="flex-1 min-w-[280px]">
          <StatCard 
            title={t('active_students')} 
            link="/students" 
            value={stats?.students ?? '...'} 
            icon={
              <Svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#db2777" strokeWidth={1.5}>
                <Path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </Svg>
            } 
          />
        </View>
        <View className="flex-1 min-w-[280px]">
          <StatCard 
            title={t('teachers')} 
            link="/teachers" 
            value={stats?.teachers ?? '...'} 
            icon={
              <Svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#db2777" strokeWidth={1.5}>
                <Path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </Svg>
            } 
          />
        </View>
        <View className="flex-1 min-w-[280px]">
          <StatCard 
            title={t('subjects')} 
            link="/subjects" 
            value={stats?.subjects ?? '...'} 
            icon={
              <Svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#db2777" strokeWidth={1.5}>
                <Path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </Svg>
            } 
          />
        </View>
      </View>

      {/* 3. Quick Actions Cards Grid Panel */}
      <View className="gap-4">
        <Text className="text-lg font-bold tracking-tight text-slate-900">
          {t('quick_actions')}
        </Text>
        
        <View className="flex-row flex-wrap gap-4">
          <View className="w-full md:w-[48%] lg:w-[23%] min-w-[240px] flex-grow">
            <ActionCard 
              to="/admin/users" 
              title={t('manage_staff')} 
              description={t('user_mgmt_desc')} 
              icon={
                <Svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#db2777" strokeWidth={1.75}>
                  <Path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </Svg>
              }
            />
          </View>
          <View className="w-full md:w-[48%] lg:w-[23%] min-w-[240px] flex-grow">
            <ActionCard 
              to="/subjects" 
              title={t('manage_subjects')} 
              description={t('subject_mgmt_desc')} 
              icon={
                <Svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#db2777" strokeWidth={1.75}>
                  <Path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </Svg>
              }
            />
          </View>
          <View className="w-full md:w-[48%] lg:w-[23%] min-w-[240px] flex-grow">
            <ActionCard 
              to="/manage-assessments" 
              title={t('manage_assessments')} 
              description={t('assessment_mgmt_desc')} 
              icon={
                <Svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#db2777" strokeWidth={1.75}>
                  <Path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </Svg>
              }
            />
          </View>
          <View className="w-full md:w-[48%] lg:w-[23%] min-w-[240px] flex-grow">
            <ActionCard 
              to="/students/import" 
              title={t('import_excel')} 
              description={t('bulk_import_desc')} 
              icon={
                <Svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#db2777" strokeWidth={1.75}>
                  <Path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </Svg>
              }
            />
          </View>
        </View>
      </View>

    </View>
  );
}

export default IsAdmin;