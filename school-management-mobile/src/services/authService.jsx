import AsyncStorage from "@react-native-async-storage/async-storage";

import api from "./api";

// Helper to get admin/staff token
const getAuthConfig = async () => {

  const user = await AsyncStorage.getItem("user");

  const parsedUser = user
    ? JSON.parse(user)
    : null;

  if (parsedUser && parsedUser.token) {

    return {
      headers: {
        Authorization: `Bearer ${parsedUser.token}`,
      },
    };
  }

  return {};
};

// PUBLIC LOGIN
const login = (userData) => {
  return api.post("/auth/login", userData);
};

// ADMIN REGISTER
const adminRegister = async (userData) => {

  const config = await getAuthConfig();

  return api.post(
    "/auth/register",
    userData,
    config
  );
};

// LOGOUT
const logout = async () => {
  await AsyncStorage.removeItem("user");
};

// GET CURRENT USER
const getCurrentUser = async () => {

  const user =
    await AsyncStorage.getItem("user");

  return user ? JSON.parse(user) : null;
};

export default {
  login,
  adminRegister,
  logout,
  getCurrentUser,
};