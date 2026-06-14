import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import userService from '../../src/services/userService';
import dashboardService from '../../src/services/dashboardService';

// Target Component View Layout Imports
import IsAdmin from '../../src/components/staff/IsAdmin';
import IsStaff from '../../src/components/staff/IsStaff';

// --- Premium Level Badge ---
const LevelBadge = ({ level }) => {
  const { t } = useTranslation();
  if (!level) return null;

  let colorClasses = "bg-slate-100 border-slate-200";
  let textClass = "text-slate-700";
  let label = level;
  
  if (level.toLowerCase().includes('kg')) {
    colorClasses = "bg-purple-50 border-purple-200";
    textClass = "text-purple-700";
    label = t('level_kg');
  } else if (level.toLowerCase() === 'primary') {
    colorClasses = "bg-blue-50 border-blue-200";
    textClass = "text-blue-700";
    label = t('level_primary');
  } else if (level.toLowerCase().includes('high')) {
    colorClasses = "bg-indigo-50 border-indigo-200";
    textClass = "text-indigo-700";
    label = t('level_high_school');
  } else if (level.toLowerCase() === 'all') {
    colorClasses = "bg-emerald-50 border-emerald-200";
    textClass = "text-emerald-700";
    label = t('level_all');
  }

  return (
    <View className={`flex-row items-center px-3 py-1 rounded-full border shadow-sm self-start ${colorClasses}`}>
      <Text className={`text-xs font-semibold uppercase tracking-wider ${textClass}`}>
        <Text className="opacity-75 font-medium lowercase tracking-normal">{t('current_access')}: </Text>
        {label}
      </Text>
    </View>
  );
};

const HomePage = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const params = useLocalSearchParams();
  const currentUser = params.currentUser;

  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Dynamic Layout Navigation Router Side-Effects ---
  useEffect(() => {
    if (loading) return; // Wait until initial profile query checks execute

    if (!currentUser) {
      router.replace('/');
      return;
    }

    if (currentUser.role === 'parent' || currentUser.studentId) {
      router.replace('/parent');
      return;
    }
  }, [currentUser, loading]);

  // --- Data Fetching Execution Engine ---
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      if (currentUser.role === 'parent' || currentUser.studentId) {
        setLoading(false);
        return;
      }

      try {
        const profileRes = await userService.getProfile();
        const userProfile = profileRes.data;
        setProfileData(userProfile);

        if (['admin', 'staff'].includes(userProfile.role)) {
          try {
            const statsRes = await dashboardService.getStats();
            setStats(statsRes.data);
          } catch (statErr) {
            console.error("Could not load stats", statErr);
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard profile", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser]);

  // --- Native Elegant Loading Overlay Spinner ---
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 gap-3">
        <ActivityIndicator size="large" color="#db2777" />
        <Text className="text-sm font-medium text-slate-500">
          {t('loading')}
        </Text>
      </View>
    );
  }
  
  // Guard safety checklist clause fallback while router effect moves unauthenticated visitors
  if (!currentUser || currentUser.role === 'parent' || currentUser.studentId || !profileData) {
    return null;
  }

  const { role, schoolLevel } = profileData;

  // --- Admin View ---
  if (role === 'admin') {
    return (
      <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6 gap-6">
          <View className="gap-2 border-b border-slate-200 pb-5">
            <Text className="text-3xl font-black tracking-tight text-slate-900">
              {t('Admin dashboard')}
            </Text>
            <Text className="text-sm text-slate-500">
              {t('manage institution overview')}
            </Text>
            <View className="mt-2">
              <LevelBadge level={schoolLevel} />
            </View>
          </View>
          
          <IsAdmin stats={stats} profileData={profileData} currentUser={currentUser} />
        </View>
      </ScrollView>
    );
  }

  // --- Teacher View ---
  if (role === 'teacher') {
    return (
      <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6">
          <IsStaff profileData={profileData} />
        </View>
      </ScrollView>
    );
  }

  // --- Mixed Staff View ---
  if (role === 'staff') {
    const hasAssignments = profileData.subjectsTaught?.length > 0 || profileData.homeroomGrade;

    return (
      <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-6 gap-8">
          
          {/* Main Top Header Details */}
          <View className="gap-2 border-b border-slate-200 pb-5">
            <Text className="text-3xl font-black tracking-tight text-slate-900">
              {t('staff_dashboard')}
            </Text>
            <Text className="text-sm text-slate-500">
              {t('overview_and_management')}
            </Text>
            <View className="mt-2">
              <LevelBadge level={schoolLevel} />
            </View>
          </View>

          {/* Admin Tools Subsection Card */}
          <View>
            <IsAdmin stats={stats} profileData={profileData} currentUser={currentUser} />
          </View>

          {/* Teaching Module Assignment Card Details */}
          {hasAssignments && (
            <View className="pt-6 border-t border-slate-200 gap-4">
              <View className="flex-row items-center gap-3">
                <View className="w-2 h-6 bg-pink-600 rounded-full" />
                <Text className="text-xl font-black tracking-tight text-slate-900">
                  {t('my_teaching_assignments')}
                </Text>
              </View>
              
              <IsStaff profileData={profileData} />
            </View>
          )}
          
        </View>
      </ScrollView>
    );
  }

  return null;
};

export default HomePage;