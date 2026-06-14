import React, { useEffect} from "react";
import { router } from "expo-router";

import authService from "../src/services/authService";
import studentAuthService from "../src/services/studentAuthService";

export default function Login() {

  useEffect(() => {checkAuth();}, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      const currentStudent = await studentAuthService.getCurrentStudent();

      if (currentUser) {
        router.replace("/staff");
        return;
      }

      else if (currentStudent) {
        router.replace("/parent");
        return;
      }
      else {
        router.replace('/login')
      }
    } catch (err) {
      console.log(err);
    }
  };
}