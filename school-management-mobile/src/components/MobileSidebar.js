import React from "react";
import { View,Text, TouchableOpacity, ScrollView, Modal} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { BookOpen, LogOut,X} from "lucide-react-native";
import { COLORS } from "../utils/theme";
import authService from "../services/authService";
import studentAuthService from "../services/studentAuthService";
import { BlurView } from "expo-blur";
import LanguageSwitcher from "./LanguageSwitcher";

const MobileSidebar = ({open, setOpen, user}) => {
  const router = useRouter();
  const pathname = usePathname();
  const handleClose = () => setOpen(false);
  const navigate = (path) => { router.push(path); handleClose();};
  const navItemStyle = (path) => ({backgroundColor: pathname === path ? "#dbeafe" : "transparent"});
  const navTextStyle = (path) => ({color: pathname === path ? "#1d4ed8" : "#475569",fontWeight: "600"});

  const logout = async () => {
    await authService.logout();
    await studentAuthService.logout();
    router.replace("/");
  };

  const SectionHeader = ({ title }) => (
    <Text
      style={{
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: "800",
        marginTop: 24,
        marginBottom: 10,
        marginHorizontal: 12,
        textTransform: "uppercase",
      }}
    >
      {title}
    </Text>
  );

  const NavItem = ({ label, path, icon }) => (
    <TouchableOpacity
      onPress={() => navigate(path)}
      className="flex-row items-center gap-3 px-4 py-3 mx-3 rounded-xl"
      style={navItemStyle(path)}
    >
      {icon}
      <Text style={navTextStyle(path)}>{label}</Text>
    </TouchableOpacity>
  );

 return (
  <Modal visible={open} animationType="fade" transparent>
    <View className="flex-1">

      {/* BLUR BACKDROP */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleClose}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0}}
      >
        <BlurView
          intensity={80}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          style={{ flex: 1, backgroundColor: "rgba(1,1,1,1)"}}
        />
      </TouchableOpacity>

      {/* SIDEBAR */}
      <View style={{position: "absolute", right: 0, top: 0, bottom: 0, width: "85%", backgroundColor: "white" }}>

        {/* HEADER */}
        <View className="flex-row items-center justify-between px-5 py-5 border-b" style={{ borderColor: COLORS.border }}>
          <Text className="text-xl font-bold" style={{ color: COLORS.textPrimary }}> Menu </Text>

          <TouchableOpacity onPress={handleClose}>
            <X size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 pt-3"
        >

          {user === "teacher" && (
            <>
              <SectionHeader title="Students" />
              <NavItem label="Students" path="/students" />
            </>
          )}

          {(user === "admin" || user === "staff") && (
            <>
              <SectionHeader title="Students" />
              <NavItem label="Student List" path="/students" />
              <NavItem label="Report Cards" path="/reports/batch" />
              <NavItem label="ID Cards" path="/id-cards" />
              <NavItem label="High Scorers" path="/high-scorers" />
              <NavItem label="Certificates" path="/certificates" />
              <NavItem label="Event Cards" path="/events/generator" />
            </>
          )}

          {(user === "teacher" || user === "staff" || user === "admin") && (
            <>
              <SectionHeader title="Academics" />
              <NavItem label="Enter Grades" path="/grade-sheet" />
              <NavItem label="Assessments" path="/manage-assessments" />
              <NavItem label="Supportive Subjects" path="/grade-sheet" />
              <NavItem label="Class Roster" path="/roster" />
              <NavItem label="Schedule" path="/master" />

              <SectionHeader title="Analytics" />
              <NavItem label="Overview" path="/analytics" />
              <NavItem label="Subjects" path="/subject-performance" />
              <NavItem label="At Risk" path="/at-risk" />
            </>
          )}

          {user === "admin" && (
            <>
              <SectionHeader title="Admin" />
              <NavItem label="Schedule" path="/schedule" />
              <NavItem label="Subjects" path="/subjects" />
              <NavItem label="Staff" path="/admin/users" />
              <NavItem label="Notifications" path="/send_notification" />
            </>
          )}

          {(user) && (
            <>
              <SectionHeader title="Library" />
              <NavItem label="Library" path="/library" icon={<BookOpen size={18} color="#475569" />}/>
            </>
          )}
          <View className="px-3 py-2">
             <LanguageSwitcher />
          </View>
        </ScrollView>

        {/* FOOTER */}
        <View className="p-4 border-t" style={{ borderColor: COLORS.border }}>
          {(user) ? (
            <TouchableOpacity
              onPress={() => {
                logout();
                handleClose();
              }}
              className="bg-red-600 rounded-sm py-4 flex-row items-center justify-center gap-2"
            >
              <LogOut size={18} color="white" />

              <Text className="text-white font-bold">
                Logout
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => navigate("/login")}
              className="bg-blue-600 rounded-2xl py-4"
            >
              <Text className="text-center text-white font-bold">
                Login
              </Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </View>
  </Modal>
);
};

export default MobileSidebar;