import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
ScrollView, TouchableWithoutFeedback, Keyboard} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import authService from "../src/services/authService";
import studentAuthService from "../src/services/studentAuthService";

export default function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {checkAuth();}, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      const currentStudent = await studentAuthService.getCurrentStudent();

      if (currentUser) {
        router.replace("/staff");
        return;
      }

      if (currentStudent) {
        router.replace("/parent");
        return;
      }
    } catch (err) {
      console.log(err);
    }
  };
  
  // HANDLE LOGIN
  const handleSubmit = async () => {
    if (!formData.role) {
      setError("Please select your role");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // STAFF LOGIN
      if (formData.role === "staff") {
        const response = await authService.login({
          username: formData.username,
          password: formData.password,
        });

        if (response.data.token) {
          await AsyncStorage.setItem(
            "user",
            JSON.stringify(response.data)
          );
          router.replace("/staff")
        }
      }

      // PARENT LOGIN
      else if (formData.role === "parent") {
        const response = await studentAuthService.login(
            formData.username,
            formData.password
          );

        if (response.data.token) {
          await AsyncStorage.setItem(
            "student-user",
            JSON.stringify(response.data)
          );
          router.replace("/parent")
        }
      }
    } catch (err) {
      console.log(err);
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
  <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView contentContainerStyle={{flexGrow: 1}} keyboardShouldPersistTaps="handled">
        <View className="flex-1 bg-gray-100 px-6 py-10">
          {/* CARD */}
          <View className="flex-1 justify-center">
            <View className="bg-white rounded-3xl p-6 shadow">
                <Text className="text-3xl font-bold text-center text-slate-800">
                Welcome
                </Text>
                <Text className="text-center text-gray-400 mt-2 mb-8">
                Please login to continue
                </Text>

                {/* USERNAME */}
                <Text className="mb-2 text-gray-700 font-semibold"> Username</Text>
                <TextInput
                placeholder="Enter username"
                className="bg-gray-100 rounded-xl p-4 mb-4"
                value={formData.username}
                onChangeText={(text) =>
                    setFormData({
                    ...formData,
                    username: text,
                    })
                }
                />

                {/* PASSWORD */}
                <Text className="mb-2 text-gray-700 font-semibold">Password</Text>
                <TextInput
                placeholder="Enter password"
                secureTextEntry
                className="bg-gray-100 rounded-xl p-4 mb-4"
                value={formData.password}
                onChangeText={(text) =>
                    setFormData({
                    ...formData,
                    password: text,
                    })
                }
                />

                {/* ROLE */}
                <Text className="mb-2 text-gray-700 font-semibold">Select Role</Text>
                <View className="flex-row gap-3 mb-6">
                <TouchableOpacity
                    className={`flex-1 p-4 rounded-xl items-center ${
                    formData.role === "staff"
                        ? "bg-pink-600"
                        : "bg-gray-200"
                    }`}
                    onPress={() => setFormData({
                        ...formData,
                        role: "staff",
                    })
                    }
                >
                    <Text 
                    className={`font-semibold ${
                        formData.role === "staff"
                        ? "text-white"
                        : "text-black"
                    }`}
                    >
                    Staff
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className={`flex-1 p-4 rounded-xl items-center ${
                    formData.role === "parent"
                        ? "bg-pink-600"
                        : "bg-gray-200"
                    }`}
                    onPress={() =>
                    setFormData({
                        ...formData,
                        role: "parent",
                    })
                    }
                >
                    <Text
                    className={`font-semibold ${
                        formData.role === "parent"
                        ? "text-white"
                        : "text-black"
                    }`}
                    >
                    Parent
                    </Text>
                </TouchableOpacity>
                </View>

                {/* ERROR */}

                {error ? (
                <View className="bg-red-100 p-3 rounded-xl mb-4">
                    <Text className="text-red-600 text-center">
                    {error}
                    </Text>
                </View>
                ) : null}

                {/* LOGIN BUTTON */}
                <TouchableOpacity
                className="bg-pink-600 p-4 rounded-xl items-center"
                onPress={handleSubmit}
                disabled={loading}
                >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white font-bold text-lg"> Login </Text>
                )}
                </TouchableOpacity>
            </View>
          </View>
        </View> 
      </ScrollView>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
);
}