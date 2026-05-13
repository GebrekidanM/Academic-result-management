import React from "react";
import Skeleton from "./Skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">

      <div className="max-w-6xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* LEFT */}
            <div className="flex items-center gap-4 w-full">
              <Skeleton className="w-16 h-16 rounded-xl" />
              <div className="space-y-3 flex-1">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex gap-3 w-full md:w-auto">
              <Skeleton className="h-16 w-28" />
              <Skeleton className="h-16 w-28" />
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-2 flex gap-2">
          <Skeleton className="h-12 w-28" />
          <Skeleton className="h-12 w-28" />
          <Skeleton className="h-12 w-28" />
          <Skeleton className="h-12 w-28" />
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>

        {/* CHART */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-6">

          <div className="flex items-center justify-between">

            <div className="space-y-3">

              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />

            </div>

            <Skeleton className="h-12 w-28" />

          </div>

          <Skeleton className="h-80 w-full" />

        </div>

        {/* INSIGHTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />

        </div>

      </div>

    </div>
  );
};

export default DashboardSkeleton;