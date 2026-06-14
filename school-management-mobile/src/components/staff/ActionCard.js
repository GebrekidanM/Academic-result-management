import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';

const ActionCard = ({ to, title, description, params = {}, icon }) => {
  const { t } = useTranslation();
  const router = useRouter();

  // Handle programmatic routing path transitions
  const handlePress = () => {
    if (!to) return;
    
    // Web 'state' object is passed safely as stringified or flat route parameter values on mobile
    router.push({
      pathname: to,
      params: params
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex-col h-full justify-between"
      style={{
        // Native shadow properties for iOS/Android fallback elevation
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View className="flex-1">
        {/* Optional Icon Asset Wrapper Box */}
        {icon && (
          <View className="w-11 h-11 rounded-xl bg-pink-600 border border-slate-100 items-center justify-center mb-4 text-slate-200 font-bold">
            {icon}
          </View>
        )}

        {/* Text Content Block */}
        <Text className="font-bold text-base tracking-tight text-slate-900 mb-1.5">
          {title}
        </Text>
        
        <Text className="text-slate-400 text-xs leading-relaxed mb-5">
          {description}
        </Text>
      </View>

      {/* Sleek Action Simulated Button Badge */}
      <View className="bg-pink-600 active:bg-slate-700 flex-row items-center justify-center py-2.5 px-4 rounded-xl">
        <Text className="text-white font-bold text-sm">
          {t('Go')}
        </Text>
        <Svg 
          className="w-4 h-4 ml-1.5" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="white" 
          strokeWidth="2.5"
        >
          <Path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </Svg>
      </View>
    </TouchableOpacity>
  );
};

export default ActionCard;