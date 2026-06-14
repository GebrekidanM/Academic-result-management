import React, { useState } from "react";
import { View,Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import studentAuthService from "../../src/services/studentAuthService";

export default function ForceChangePasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (newPassword.length < 6) {
      return setError(t("err_pass_len"));
    }

    if (newPassword !== confirmPassword) {
      return setError(t("err_pass_match"));
    }

    setError("");
    setLoading(true);

    try {
      await studentAuthService.changePassword(newPassword);

      Alert.alert(
        t("success"),
        t("success_pass_change")
      );

      const user = await studentAuthService.getCurrentStudent();

      if (user) {
        user.isInitialPassword = false;

        await AsyncStorage.setItem(
          "student-user",
          JSON.stringify(user)
        );
      }

      router.replace("/parent");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          t("fail_pass_change")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }} className="bg-gray-100 px-5">
        <View className="bg-white rounded-2xl p-6 shadow">
            <Text className="text-3xl font-bold text-center text-gray-800"> {t("change_password_title")} </Text>
            <Text className="text-center text-gray-500 mt-2 mb-6"> {t("change_password_sub")}</Text>

            <View className="mb-4">
                <Text className="text-gray-700 font-semibold mb-2">{t("new_password")}</Text>
                <View className="flex-row items-center border border-gray-300 rounded-xl px-3">
                    <TextInput
                        className="flex-1 py-3"
                        secureTextEntry={!showNewPassword}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder={t("ph_min_chars")}
                    />

                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                        <Text className="text-pink-500 font-semibold"> {showNewPassword ? "Hide" : "Show"} </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="mb-4">
                <Text className="text-gray-700 font-semibold mb-2"> {t("confirm_password")} </Text>

                <View className="flex-row items-center border border-gray-300 rounded-xl px-3">
                    <TextInput
                        className="flex-1 py-3"
                        secureTextEntry={!showConfirmPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder={t("ph_confirm_pass")}
                    />

                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} >
                        <Text className="text-pink-500 font-semibold"> {showConfirmPassword ? "Hide" : "Show"} </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity
            disabled={loading}
            onPress={handleSubmit}
            className={`rounded-xl py-4 ${loading ? "bg-pink-300" : "bg-pink-500"}`}
            >
            {loading ? (<ActivityIndicator color="#fff" />) : (<Text className="text-white text-center font-bold"> {t("set_password_btn")}</Text>)}
            </TouchableOpacity>

            {error ? ( <Text className="text-red-500 text-center mt-4"> {error} </Text> ) : null}
        </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}