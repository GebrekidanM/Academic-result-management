import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import scheduleService from '../../services/scheduleService'; // Adjust to your service path mapping alias

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const ScheduleForTeacher = () => {
  const { t } = useTranslation();
  const [scheduleData, setScheduleData] = useState([]);

  useEffect(() => {
    const getSchedule = async () => {
      try {
        const res = await scheduleService.getForAteacher();
        setScheduleData(res.data || []);
      } catch (error) {
        console.log("Error loading teacher schedule:", error);
      }
    };
    getSchedule();
  }, []);

  // Helper to find a subject for a specific day and period
  const getSubject = (day, period) => {
    return scheduleData?.find(s => s.dayOfWeek === day && s.period === period);
  };

  return (
    <View className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* 
        Horizontal ScrollView simulates web's 'overflow-x-auto'.
        We enforce a minimum width so columns don't compress onto tiny screens.
      */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View className="min-w-[640px]">
          
          {/* --- Table Header (tr replacement) --- */}
          <View className="flex-row bg-slate-50 border-b border-slate-100">
            {/* Period Column Title Header */}
            <View className="w-16 p-4 items-center justify-center">
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {t('Period') || 'Period'}
              </Text>
            </View>
            
            {/* Day Columns Title Header Mapping */}
            {DAYS.map(day => (
              <View key={day} className="flex-1 p-4 items-center justify-center">
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {t(day)}
                </Text>
              </View>
            ))}
          </View>

          {/* --- Table Body Data Matrix Rows --- */}
          <View className="divide-y divide-slate-100">
            {PERIODS.map(period => (
              <View key={period} className="flex-row items-center min-h-[56px]">
                
                {/* Left Side Static Period Indicator Index Cell */}
                <View className="w-16 p-4 items-center justify-center">
                  <Text className="font-black text-slate-600 text-sm">
                    {period}
                  </Text>
                </View>

                {/* Day Matrix Cells Loops */}
                {DAYS.map(day => {
                  const item = getSubject(day, period);
                  return (
                    <View 
                      key={day} 
                      className="flex-1 p-2 border-l border-slate-100 items-center justify-center"
                    >
                      {item ? (
                        <View className="items-center justify-center gap-0.5">
                          <Text className="text-[11px] font-bold text-cyan-800 text-center leading-tight">
                            {item.subject?.name}
                          </Text>
                          <Text className="text-[10px] font-medium text-cyan-500 text-center">
                            {item.gradeLevel}
                          </Text>
                        </View>
                      ) : (
                        <Text className="text-slate-200 text-xs font-semibold">-</Text>
                      )}
                    </View>
                  );
                })}

              </View>
            ))}
          </View>

        </View>
      </ScrollView>
    </View>
  );
};

export default ScheduleForTeacher;