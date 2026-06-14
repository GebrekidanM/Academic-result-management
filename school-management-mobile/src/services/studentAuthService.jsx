import AsyncStorage from "@react-native-async-storage/async-storage";

import api from "./api";

// Helper to get parent/student token
const getStudentAuthConfig = async () => {
  const studentUser = await AsyncStorage.getItem("student-user");
  const parsedStudent = studentUser? JSON.parse(studentUser) : null;

  if ( parsedStudent && parsedStudent.token) {
    return {
      headers: { Authorization: `Bearer ${parsedStudent.token}` },
    };
  }

  return {};
};

// LOGIN
const login = (studentId, password) => {
  return api.post("/student-auth/login",
    {
      studentId,
      password,
    }
  );
};

// CHANGE PASSWORD
const changePassword = async (newPassword) => {
  const config = await getStudentAuthConfig();
  return api.put("/student-auth/change-password", { newPassword }, config);
};

// LOGOUT
const logout = async () => { 
  await AsyncStorage.removeItem( "student-user")};

// GET CURRENT STUDENT
const getCurrentStudent = async () => {
  const student = await AsyncStorage.getItem("student-user" );
  return student? JSON.parse(student): null;
};

export default {
  login,
  changePassword,
  logout,
  getCurrentStudent,
};