import React from "react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: {
      display: false
    }
  },

  scales: {
    y: {
      beginAtZero: true,
      max: 100,

      ticks: {
        callback: (value) => `${value}%`
      }
    }
  }
};

const PerformanceChart = ({ chartData }) => {
  return (
    <div className="bg-white hover:bg-gray-200 border border-slate-100 rounded-2xl shadow-sm p-6 transition-all duration-200">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">

        <div>
          <h2 className="text-xl font-black text-slate-800">
            Performance Trend
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Monthly academic progress overview
          </p>
        </div>

        <button className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200">
          Export
        </button>

      </div>

      {/* CHART */}
      <div className="h-80">
        <Line
          data={chartData}
          options={chartOptions}
        />
      </div>

    </div>
  );
};

export default PerformanceChart;