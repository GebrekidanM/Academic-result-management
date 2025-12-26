import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next'; // <--- Import Hook
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const StudentStats = ({ students, sectionName }) => {
    const { t } = useTranslation(); // <--- Initialize Translation

    // --- 1. Calculate Gender Counts ---
    const genderCounts = useMemo(() => {
        let male = 0;
        let female = 0;
        students.forEach(s => {
            const g = s.gender.toLowerCase();
            if (g === 'male' || g === 'm') male++;
            else female++;
        });
        return { male, female, total: students.length };
    }, [students]);

    // --- 2. Gender Chart Data ---
    const genderData = useMemo(() => ({
        labels: [t('male'), t('female')], // <--- Translated Labels
        datasets: [
            {
                data: [genderCounts.male, genderCounts.female],
                backgroundColor: ['#3b82f6', '#ec4899'], 
                borderColor: ['#2563eb', '#db2777'],
                borderWidth: 1,
            },
        ],
    }), [genderCounts, t]); // Re-render when language changes

    // --- 3. Grade Population Data ---
    const gradeData = useMemo(() => {
        const counts = {};
        students.forEach(s => {
            const g = s.gradeLevel;
            counts[g] = (counts[g] || 0) + 1;
        });

        const sortedLabels = Object.keys(counts).sort((a, b) => 
            a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
        );

        return {
            labels: sortedLabels,
            datasets: [
                {
                    label: t('total_students'), // <--- Translated Label
                    data: sortedLabels.map(label => counts[label]),
                    backgroundColor: 'rgba(99, 102, 241, 0.6)', 
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                },
            ],
        };
    }, [students, t]);

    // Hide if no students
    if (students.length === 0) return null;

    return (
        <div className="mb-8 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-700 mb-4 border-l-4 border-indigo-500 pl-3 flex justify-between items-center">
                <span>
                    {sectionName ? `${sectionName} ${t('overview')}` : t('school_overview')}
                </span>
                <span className="text-sm bg-gray-100 text-gray-600 py-1 px-3 rounded-full">
                    {t('total')}: {genderCounts.total}
                </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* --- CARD 1: GENDER RATIO --- */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col items-center">
                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">
                        {t('gender_distribution')}
                    </h4>
                    
                    <div className="w-56 h-56 relative">
                        <Doughnut 
                            data={genderData} 
                            options={{ 
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } } 
                            }} 
                        />
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                             <span className="text-3xl font-black text-gray-800">{genderCounts.total}</span>
                             <span className="text-[10px] uppercase text-gray-400 font-bold">{t('students')}</span>
                        </div>
                    </div>

                    {/* Custom Legend */}
                    <div className="flex justify-around w-full mt-6 pt-4 border-t border-gray-100">
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-blue-600">{genderCounts.male}</span>
                            <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> {t('male')}
                            </div>
                        </div>
                        <div className="h-10 border-r border-gray-200"></div>
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-pink-600">{genderCounts.female}</span>
                            <div className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase">
                                <span className="w-2 h-2 rounded-full bg-pink-500"></span> {t('female')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- CARD 2: CLASS POPULATION --- */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col">
                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wider">
                        {t('students_per_class')}
                    </h4>
                    <div className="flex-1 min-h-[250px]">
                        <Bar 
                            data={gradeData} 
                            options={{
                                maintainAspectRatio: false,
                                responsive: true,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: { 
                                        beginAtZero: true, 
                                        ticks: { precision: 0 },
                                        grid: { borderDash: [2, 4] } 
                                    },
                                    x: {
                                        grid: { display: false }
                                    }
                                }
                            }} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentStats;