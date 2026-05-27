import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const url = process.env.EXPO_PUBLIC_URL;

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

const smallApi = axios.create({
  baseURL: url,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to every request
api.interceptors.request.use(
  async (config) => {

    const user = await AsyncStorage.getItem("user");
    const studentUser = await AsyncStorage.getItem("student-user");

    const parsedUser = user ? JSON.parse(user) : null;
    const parsedStudent = studentUser
      ? JSON.parse(studentUser)
      : null;

    const token =
      parsedUser?.token || parsedStudent?.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
export { smallApi };