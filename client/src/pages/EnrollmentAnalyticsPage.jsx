import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import studentService from '@shared/services/studentService'
import analyticsService from '@/shared/services/analyticsService'

function getCurrentAcademicYear() {
    const today = new Date();
    const gregYear = today.getFullYear();
    const gregMonth = today.getMonth() + 1;
    return gregMonth >= 9 ? gregYear - 7 : gregYear - 8;
}

const EnrollmentAnalyticsPage = () => {
    const { t } = useTranslation();
    
    // --- STATE ---
    const [selectedYear, setSelectedYear] = useState(getCurrentAcademicYear().toString());
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const availableYears = useMemo(() => {
        const current = getCurrentAcademicYear();
        return [String(current + 1), String(current), String(current - 1), String(current - 2), String(current - 3)];
    }, []);

    // --- 1. DATA FETCHING ---
    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await analyticsService.getYearlyEnrollmentAnalytics(selectedYear);
            setAnalytics(res.data.stats);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to load enrollment analytics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [selectedYear]);

    const ratioStats = useMemo(() => {
        if (!analytics || analytics.totalEnrolled === 0) return { newPct: 0, returningPct: 0 };
        const newPct = (analytics.newStudents / analytics.totalEnrolled) * 100;
        const returningPct = (analytics.returningStudents / analytics.totalEnrolled) * 100;
        return {
            newPct: newPct.toFixed(1),
            returningPct: returningPct.toFixed(1)
        };
    }, [analytics]);

    const attritionStats = useMemo(() => {
        if (!analytics) return { stayedPct: 0, droppedPct: 0 };
        const total = analytics.retainedFromPrevYear + analytics.droppedOutFromPrevYear;
        if (total === 0) return { stayedPct: 100, droppedPct: 0 };
        
        const stayedPct = (analytics.retainedFromPrevYear / total) * 100;
        const droppedPct = (analytics.droppedOutFromPrevYear / total) * 100;
        return {
            stayedPct: stayedPct.toFixed(1),
            droppedPct: droppedPct.toFixed(1)
        };
    }, [analytics]);

    console.log(analytics)

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center border-b pb-4 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">📈 {t('enrollment_analytics') || 'Enrollment & Retention'}</h2>
                    <p className="text-sm text-slate-500 mt-1">Student registration, continuity, and attrition reports</p>
                </div>
                <div className="flex items-center gap-3">
                    <select 
                        value={selectedYear} 
                        onChange={e => setSelectedYear(e.target.value)}
                        className="border-2 p-2.5 rounded-xl font-bold text-slate-700 outline-none bg-white focus:border-pink-500"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year} E.C.</option>
                        ))}
                    </select>
                    <Link to="/" className="text-pink-600 hover:underline font-bold text-sm">
                        &larr; {t('back')}
                    </Link>
                </div>
            </div>

            {loading ? (
                <p className="text-center p-10 font-bold">{t('loading')}</p>
            ) : error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-bold text-center">⚠️ {error}</div>
            ) : (
                analytics && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-5">
                                <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl shadow-sm">👥</div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('total_enrolled') || 'Total Enrolled'}</p>
                                    <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{analytics.totalEnrolled}</h3>
                                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">{analytics.returningStudents} Returning • {analytics.newStudents} New</p>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-5">
                                <div className="w-14 h-14 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-2xl shadow-sm">📈</div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('retention_rate') || 'Retention Rate'}</p>
                                    <h3 className="text-3xl font-extrabold text-green-600 tracking-tight">{analytics.retentionRate}%</h3>
                                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Student continuity from previous year [2]</p>
                                </div>
                            </div>

                            {/* New Students */}
                            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-5">
                                <div className="w-14 h-14 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl shadow-sm">🆕</div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('new_admissions') || 'New Admissions'}</p>
                                    <h3 className="text-3xl font-extrabold text-purple-600 tracking-tight">{analytics.newStudents}</h3>
                                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Registered as new this year</p>
                                </div>
                            </div>

                            {/* Dropped Out */}
                            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-5">
                                <div className="w-14 h-14 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-2xl shadow-sm">⚠️</div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('dropped_out') || 'Dropped Out'}</p>
                                    <h3 className="text-3xl font-extrabold text-red-600 tracking-tight">{analytics.droppedOutFromPrevYear}</h3>
                                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Withdrawn / changed school last year [2]</p>
                                </div>
                            </div>

                        </div>

                        {/* 2. Visual Comparison Bars */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            
                            {/* Comparison 1: New vs Returning */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-md">{t('enrollment_ratio') || 'New vs. Returning Students'}</h4>
                                    <p className="text-xs text-slate-400 mt-1">Breakdown of this year's total registered students</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-bold text-slate-600">
                                        <span>Returning Students ({analytics.returningStudents})</span>
                                        <span>{ratioStats.returningPct}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${ratioStats.returningPct}%` }}></div>
                                    </div>

                                    <div className="flex justify-between text-xs font-bold text-slate-600 pt-2">
                                        <span>New Students ({analytics.newStudents})</span>
                                        <span>{ratioStats.newPct}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${ratioStats.newPct}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Comparison 2: Continuity vs Attrition */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                                <div>
                                    <h4 className="font-bold text-slate-800 text-md">{t('continuity_ratio') || 'Retained vs. Dropped Out'}</h4>
                                    <p className="text-xs text-slate-400 mt-1">Continuity rate of students from the previous academic year [2]</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-bold text-slate-600">
                                        <span>Retained / Continued ({analytics.retainedFromPrevYear})</span>
                                        <span>{attritionStats.stayedPct}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div className="bg-green-600 h-full rounded-full transition-all duration-500" style={{ width: `${attritionStats.stayedPct}%` }}></div>
                                    </div>

                                    <div className="flex justify-between text-xs font-bold text-slate-600 pt-2">
                                        <span>Dropped Out / Left ({analytics.droppedOutFromPrevYear})</span>
                                        <span>{attritionStats.droppedPct}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${attritionStats.droppedPct}%` }}></div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )
            )}
        </div>
    );
};

export default EnrollmentAnalyticsPage;