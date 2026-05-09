import React, { useState } from "react";

import {
  LayoutDashboard,
  BarChart3,
  GraduationCap,
  ClipboardList,
  ChevronDown
} from "lucide-react";

const DashboardTabs = ({activeTab, setActiveTab}) => {
  const [openMenu, setOpenMenu] = useState(null);
  const toggleMenu = (menu) => {setOpenMenu((prev) => prev === menu ? null : menu)};

  return (
    <div className=" bg-white border border-slate-100 rounded-2xl shadow-sm p-2 px-4 flex flex-row items-center justify-between gap-2 relative">
      <button
        onClick={() => setActiveTab("overview")}
        className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 py-3 rounded-xl text-xs md:text-sm font-bold transition-all
          ${activeTab === "overview" ? "bg-pink-600 text-white" : "text-slate-600 hover:bg-gray-200"}`}
      >
        <LayoutDashboard size={18} />
        <span className="hidden md:block">Overview</span>
      </button>

      <div className="relative">
        <button
          onClick={() => toggleMenu("analytics")}
          className={`w-full flex flex-row items-center justify-center gap-1 md:gap-2 px-2 py-3 rounded-xl text-xs md:text-sm font-bold transition-all
            ${activeTab.includes("analytics") ? "bg-pink-600 text-white"  : "text-slate-600 hover:bg-gray-200"}`}>
          <BarChart3 size={18} />
          <span className="hidden md:block">Analytics</span>
          <ChevronDown size={16} />
        </button>

        {openMenu === "analytics" && (
          <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-lg z-50 overflow-hidden">
            <button
              onClick={() => {setActiveTab("analytics-overall");
                setOpenMenu(null);
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100">
              Overall Analytics
            </button>

            <button
              onClick={() => {
                setActiveTab("analytics-sem1");
                setOpenMenu(null);
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100">
              First Semester
            </button>

            <button
              onClick={() => {
                setActiveTab(
                  "analytics-sem2"
                );
                setOpenMenu(null);
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100">
              Second Semester
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() =>toggleMenu("semesters")}
          className={`w-full flex flex-row items-center justify-center gap-1 md:gap-2 px-2 py-3 rounded-xl text-xs md:text-sm font-bold transition-all
            ${activeTab.includes("semester")
                ? "bg-pink-600 text-white"
                : "text-slate-600 hover:bg-gray-200"
            }
          `}
        >
          <GraduationCap size={18} />
          <span className="hidden md:block">Semesters</span>
          <ChevronDown size={16} />
        </button>

        {openMenu === "semesters" && (
          <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-lg z-50 overflow-hidden ">
            <button
              onClick={() => {
                setActiveTab("semester-1");
                setOpenMenu(null);
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100
              "
            >
              First Semester
            </button>

            <button
              onClick={() => {
                setActiveTab("semester-2");
                setOpenMenu(null);
              }}
              className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100"
            >
              Second Semester
            </button>
          </div>
        )}
      </div>

      {/* ======================
          QUIZZES
      ====================== */}
      <button
        onClick={() => setActiveTab("quizzes")}
        className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 py-3 rounded-xl text-xs md:text-sm font-bold transition-all
          ${activeTab === "quizzes" ? "bg-pink-600 text-white" : "text-slate-600 hover:bg-gray-200"}
        `} 
      >
        <ClipboardList size={18} />
        <span className="hidden md:block">Quizzes</span>
      </button>
    </div>
  );
};

export default DashboardTabs;