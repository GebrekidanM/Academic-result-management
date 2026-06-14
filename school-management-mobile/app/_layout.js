import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useSegments, useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import MobileSidebar from "../src/components/MobileSidebar";
import authService from '../src/services/authService';
import studentAuthService from "../src/services/studentAuthService";

import "../global.css";
import "../i18n";

export default function Layout() {
  const segments = useSegments();
  const router = useRouter();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAuthScreen = segments[0] === 'auth';

  // --- RESOLVE ASYNC AUTH PROMISES ---
  useEffect(() => {
    async function resolveUserSession() {
      try {
        let user = await authService.getCurrentUser();
        
        if (!user) {
          user = await studentAuthService.getCurrentStudent();
        }
        
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to resolve user session profile:", error);
      } finally {
        setLoading(false);
      }
    }

    resolveUserSession();
  }, [segments]);

  const userRole = currentUser?.role || (currentUser?.studentId ? 'student' : null);
  
  const handleLogoPress = () => {
    if (userRole === 'parent' || userRole === 'student') {
      router.replace('/parent');
    } else if (['admin', 'staff', 'teacher'].includes(userRole)) {
      router.replace('/staff');
    } else {
      router.replace('/');
    }
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 bg-slate-50 items-center justify-center">
          <ActivityIndicator size="large" color="#db2777" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-slate-50">
        <StatusBar style="light" backgroundColor="#000000" />

        {!isAuthScreen && (
          <View>
            <View style={{ height: 36, backgroundColor: "#000" }} />

            <View className="bg-white px-6 py-6 flex-row items-center justify-between border-b border-slate-100">
              <TouchableOpacity onPress={handleLogoPress} activeOpacity={0.7}>
                <Text className="text-2xl font-bold text-pink-600">
                  Freedom
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setSidebarOpen(true)} activeOpacity={0.7}>
                <Text className="font-bold text-3xl text-pink-600">
                  ☰
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Context Parameter Provision: 
          We use screenOptions.initialParams to pass the currentUser object down to all active child routes.
        */}
        <View className="flex-1">
          <Stack 
            screenOptions={{ 
              headerShown: false,
              initialParams: { currentUser } // <--- Injects the user metadata securely downward
            }} 
          />
        </View>

        {!isAuthScreen && (
          <MobileSidebar
            open={sidebarOpen}
            setOpen={setSidebarOpen}
            user={userRole}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}