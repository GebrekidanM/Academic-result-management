import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const StatCard = ({ title, value, icon, link }) => {
  const router = useRouter();

  const handlePress = () => {
    if (link) {
      router.push(link);
    }
  };

  // The base interior card content layout
  const CardContent = () => (
    <View className="flex-row items-center gap-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      
      {/* Vibrant Solid Icon Box */}
      <View 
        className="w-14 h-14 rounded-xl bg-pink-600 items-center justify-center text-white"
        style={{
          // Native soft pop shadow specifically tuned for the icon box elevation
          shadowColor: '#db2777',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 3,
        }}
      >
        {icon}
      </View>
      
      {/* Text Content Block */}
      <View className="flex-1">
        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
          {title}
        </Text>
        <Text className="text-2xl font-black text-slate-900 tracking-tight">
          {value}
        </Text>
      </View>
      
    </View>
  );

  // Render clickable touch track wrapper if link destination is assigned
  if (link) {
    return (
      <TouchableOpacity 
        activeOpacity={0.75} 
        onPress={handlePress}
        className="w-full"
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  // Pure static info wrapper fallback variant layout
  return (
    <View className="w-full">
      <CardContent />
    </View>
  );
};

export default StatCard;