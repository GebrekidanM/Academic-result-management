import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ActionCard from './ActionCard';
import ScheduleForTeacher from './ScheduleForTeacher';

function IsStaff({ profileData }) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View className="gap-6">
      {/* Header Container */}
      <View className="gap-1">
        <Text className="text-3xl font-black text-slate-800 tracking-tight">
          {t('teacher_dashboard')}
        </Text>
        <Text className="text-lg text-slate-500">
          {t('welcome')}, {profileData?.fullName}!
        </Text>
        
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push({
            pathname: '/profile',
            params: { profileData: JSON.stringify(profileData) }
          })}
          className="mt-1 self-start"
        >
          <Text className="text-sm font-bold text-slate-400 italic active:text-slate-600">
            {t('change_credentials')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Schedule Segment Wrapper */}
      <View className="w-full max-w-5xl">
        <ScheduleForTeacher />
      </View>

      {/* Action Cards Multi-Column Grid Layout */}
      <View className="flex-row flex-wrap gap-4 mt-2">
        
        {/* Homeroom Card */}
        {profileData?.homeroomGrade && (
          <View className="w-full md:w-[48%] lg:w-[23%] min-w-[240px] flex-grow">
            <ActionCard 
              to="/roster" 
              title={`${t('my_homeroom')}: ${profileData.homeroomGrade}`} 
              description={t('homeroom_desc')} 
            />
          </View>
        )}

        {/* Quizzes Management Card */}
        <View className="w-full md:w-[48%] lg:w-[23%] min-w-[240px] flex-grow">
          <ActionCard 
            to="/teacher/quizzes" 
            title={'My Quizzes'} 
            description={'Create, edit and view quiz results'} 
          />
        </View>
          
        {/* Dynamic Subject Cards Map */}
        {profileData?.subjectsTaught?.map(assignment => (
          assignment?.subject && (
            <View 
              key={assignment.subject._id} 
              className="w-full md:w-[48%] lg:w-[23%] min-w-[240px] flex-grow"
            >
              <ActionCard 
                to="/subject-roster"
                title={assignment.subject.name}
                description={`${t('view_marklist')} ${assignment.subject.gradeLevel}.`}
                // Stringifying target parameters for cross-screen communication
                params={{ subjectId: assignment.subject._id }}
              />
            </View>
          )
        ))}
      </View>

      {/* Empty Fallback State Notification Box */}
      {profileData?.subjectsTaught?.length === 0 && !profileData?.homeroomGrade && (
        <View className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl mt-4">
          <Text className="text-amber-800 font-medium text-sm">
            {t('no_duties_assigned')}
          </Text>
        </View>
      )}
    </View>
  );
}

export default IsStaff;