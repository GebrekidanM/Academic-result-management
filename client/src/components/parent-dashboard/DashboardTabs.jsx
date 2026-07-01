import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  BarChart3,
  GraduationCap,
  ClipboardList,
  ChevronDown,
  CalendarDays, // ⚠️ አዲስ የሰሌዳ አይኮን
  Clock // ⚠️ አዲስ የመገኘት አይኮን
} from "lucide-react";

const DashboardTabs = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslation();
  const [openMenu, setOpenMenu] = useState(null);
  
  const toggleMenu = (menu) => {
    setOpenMenu((prev) => prev === menu ? null : menu);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-2 px-4 flex flex-wrap md:flex-row items-center justify-between gap-2 relative">
      
      {/* 1. Overview */}
      <button
        onClick={() => { setActiveTab("overview"); setOpenMenu(null); }}
        className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 py-3 rounded-xl text-xs md:text-sm font-bold transition-all
          ${activeTab === "overview" ? "bg-pink-600 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
      >
        <LayoutDashboard size={18} />
        <span className="hidden md:block">{t('overview') || 'Overview'}</span>
      </button>

      {/* 2. Analytics */}
      <div className="relative">
        <button
          onClick={() => toggleMenu("analytics")}
          className={`w-full flex flex-row items-center justify-center gap-1 md:gap-2 px-2 py-3 rounded-xl text-xs md:text-sm font-bold transition-all
            ${activeTab.includes("analytics") ? "bg-pink-600 text-white shadow"  : "text-slate-600 hover:bg-slate-50"}`}>
          <BarChart3 size={18} />
          <span className="hidden md:block">{t('analytics') || 'Analytics'}</span>
          <ChevronDown size={16} />
        </button>

        {openMenu === "analytics" && (
          <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-lg z-50 overflow-hidden">
            <button
              onClick={() => { setActiveTab("analytics-overall"); setOpenMenu(null); }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100">
              Overall Analytics
            </button>
            <button
              onClick={() => { setActiveTab("analytics-sem1"); setOpenMenu(null); }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100">
              First Semester
            </button>
            <button
              onClick={() => { setActiveTab("analytics-sem2"); setOpenMenu(null); }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100">
              Second Semester
            </button>
          </div>
        )}
      </div>

      {/* 3. Semesters */}
      <div className="relative">
        <button
          onClick={() => toggleMenu("semesters")}
          className={`w-full flex flex-row items-center justify-center gap-1 md:gap-2 px-2 py-3 rounded-xl text-xs md:text-sm font-bold transition-all
            ${activeTab.includes("semester") ? "bg-pink-600 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
        >
          <GraduationCap size={18} />
          <span className="hidden md:block">{t('semesters') || 'Semesters'}</span>
          <ChevronDown size={16} />
        </button>

        {openMenu === "semesters" && (
          <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-lg z-50 overflow-hidden">
            <button
              onClick={() => { setActiveTab("semester-1"); setOpenMenu(null); }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100"
            >
              First Semester
            </button>
            <button
              onClick={() => { setActiveTab("semester-2"); setOpenMenu(null); }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100"
            >
              Second Semester
            </button>
          </div>
        )}
      </div>

      {/* ⚠️ 4. አዲሱ የመገኘት መከታተያ ታብ (Attendance Tab) */}
      <button
        onClick={() => { setActiveTab("attendance"); setOpenMenu(null); }}
        className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 py-3 rounded-xl text-xs md:text-sm font-bold transition-all
          ${activeTab === "attendance" ? "bg-pink-600 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
      >
        <Clock size={18} />
        <span className="hidden md:block">{t('attendance') || 'Attendance'}</span>
      </button>

      {/* ⚠️ 5. አዲሱ የክፍለ-ጊዜ ሰሌዳ ታብ (Schedule Tab) */}
      <button
        onClick={() => { setActiveTab("schedule"); setOpenMenu(null); }}
        className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 py-3 rounded-xl text-xs md:text-sm font-bold transition-all
          ${activeTab === "schedule" ? "bg-pink-600 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
      >
        <CalendarDays size={18} />
        <span className="hidden md:block">{t('schedule') || 'Schedule'}</span>
      </button>

      {/* 6. Quizzes */}
      <button
        onClick={() => { setActiveTab("quizzes"); setOpenMenu(null); }}
        className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 py-3 rounded-xl text-xs md:text-sm font-bold transition-all
          ${activeTab === "quizzes" ? "bg-pink-600 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}
      >
        <ClipboardList size={18} />
        <span className="hidden md:block">{t('quizzes') || 'Quizzes'}</span>
      </button>

    </div>
  );
};

export default DashboardTabs;