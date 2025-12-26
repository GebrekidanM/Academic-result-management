import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // <--- IMPORT HOOK
import offlineGradeService from '../services/offlineGradeService';
import offlineAssessmentService from '../services/offlineAssessmentService';
import gradeService from '../services/gradeService';
import assessmentTypeService from '../services/assessmentTypeService';

const SyncStatus = () => {
    const { t } = useTranslation(); // <--- INITIALIZE
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [syncingAll, setSyncingAll] = useState(false);
    const [syncingId, setSyncingId] = useState(null);
    
    // Modal State
    const [showList, setShowList] = useState(false);
    const [pendingAssessments, setPendingAssessments] = useState([]);
    const [pendingGrades, setPendingGrades] = useState([]);

    const refreshData = () => {
        const gQueue = offlineGradeService.getQueue();
        const aList = offlineAssessmentService.getLocalAssessments();
        setPendingCount(gQueue.length + aList.length);
        setPendingGrades(gQueue);
        setPendingAssessments(aList);
        setIsOnline(navigator.onLine);
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 2000);
        return () => clearInterval(interval);
    }, []);

    // --- SYNC SINGLE ASSESSMENT ---
    const syncSingleAssessment = async (assess) => {
        setSyncingId(assess._id);
        try {
            const { _id, isOffline, ...payload } = assess;
            const res = await assessmentTypeService.create(payload);
            const realId = res.data.data._id;
            
            offlineAssessmentService.removeLocalAssessment(assess._id);
            
            // Auto-fix dependent grades
            const gradeQueue = offlineGradeService.getQueue();
            let updatedCount = 0;
            const updatedQueue = gradeQueue.map(item => {
                if (item.payload.assessmentTypeId === assess._id) {
                    item.payload.assessmentTypeId = realId;
                    updatedCount++;
                }
                return item;
            });
            if (updatedCount > 0) {
                localStorage.setItem('offline_grade_queue', JSON.stringify(updatedQueue));
            }
            refreshData();
        } catch (err) {
            alert(t('error'));
        } finally {
            setSyncingId(null);
        }
    };

    // --- SYNC SINGLE GRADE ---
    const syncSingleGrade = async (item) => {
        setSyncingId(item.id);
        try {
            let payload = item.payload;
            if (payload.assessmentTypeId.toString().startsWith('TEMP_')) {
                alert("⚠️ Please sync the 'New Assessment' first.");
                setSyncingId(null);
                return;
            }
            await gradeService.saveGradeSheet(payload);
            offlineGradeService.removeFromQueue(item.id);
            refreshData();
        } catch (err) {
            alert(t('error'));
        } finally {
            setSyncingId(null);
        }
    };

    const deleteItem = (type, id) => {
        if(!window.confirm(t('confirm_delete_offline'))) return;
        if (type === 'assessment') offlineAssessmentService.removeLocalAssessment(id);
        else offlineGradeService.removeFromQueue(id);
        refreshData();
    };

    const handleSyncAll = async () => {
        if (!isOnline) return;
        setSyncingAll(true);
        const idMap = {}; 
        let successCount = 0;
        let failCount = 0;

        const currentAssessments = offlineAssessmentService.getLocalAssessments();
        for (const assess of currentAssessments) {
            try {
                const { _id, isOffline, ...payload } = assess; 
                const res = await assessmentTypeService.create(payload);
                const realId = res.data.data._id;
                idMap[assess._id] = realId; 
                offlineAssessmentService.removeLocalAssessment(assess._id);
                successCount++;
            } catch (err) { failCount++; }
        }

        const currentGrades = offlineGradeService.getQueue();
        for (const item of currentGrades) {
            let payload = item.payload;
            let currentAssessId = payload.assessmentTypeId.toString();

            if (currentAssessId.startsWith('TEMP_')) {
                if (idMap[currentAssessId]) {
                    payload.assessmentTypeId = idMap[currentAssessId];
                } else {
                    failCount++; 
                    continue; 
                }
            }

            try {
                await gradeService.saveGradeSheet(payload);
                offlineGradeService.removeFromQueue(item.id);
                successCount++;
            } catch (error) { failCount++; }
        }

        setSyncingAll(false);
        refreshData();
        
        if (successCount > 0 && failCount === 0) {
            alert(t('success_sync'));
            setShowList(false);
        } else if (failCount > 0) {
            alert(t('failed_sync'));
        }
    };

    if (pendingCount === 0) return null;

    return (
        <>
            {/* FLOATING BUTTON */}
            <div className="fixed bottom-16 right-4 z-40 animate-bounce-small print:hidden">
                <button 
                    onClick={() => setShowList(true)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-xl font-bold text-white transition-all ${isOnline ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-500'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isOnline ? `${t('review_items')} (${pendingCount})` : `${t('waiting_internet')} (${pendingCount})`}
                </button>
            </div>

            {/* MODAL */}
            {showList && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 print:hidden">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
                        
                        <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">{t('offline_manager')}</h3>
                            <button onClick={() => setShowList(false)} className="text-gray-500 hover:text-gray-700 font-bold text-2xl">&times;</button>
                        </div>

                        <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
                            
                            {/* ASSESSMENTS LIST */}
                            {pendingAssessments.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="text-xs font-bold text-blue-600 uppercase mb-2 tracking-wider">{t('new_assessments')}</h4>
                                    <ul className="space-y-2">
                                        {pendingAssessments.map((a) => (
                                            <li key={a._id} className="p-3 bg-white border border-blue-200 rounded-lg shadow-sm flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold text-gray-800">{a.name}</div>
                                                    <div className="text-xs text-gray-500">{a.gradeLevel} | {a.totalMarks} {t('marks')}</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => syncSingleAssessment(a)}
                                                        disabled={!isOnline || syncingId === a._id}
                                                        className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded hover:bg-blue-200 disabled:opacity-50"
                                                    >
                                                        {syncingId === a._id ? '...' : t('sync')}
                                                    </button>
                                                    <button onClick={() => deleteItem('assessment', a._id)} className="text-gray-400 hover:text-red-500">
                                                        🗑️
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* GRADES LIST */}
                            {pendingGrades.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-green-600 uppercase mb-2 tracking-wider">{t('grade_sheets')}</h4>
                                    <ul className="space-y-2">
                                        {pendingGrades.map((g) => (
                                            <li key={g.id} className="p-3 bg-white border border-green-200 rounded-lg shadow-sm flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold text-gray-800 text-sm">
                                                        {g.payload.academicYear} ({g.payload.semester})
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {g.payload.scores.length} {t('students_graded')}
                                                        {g.payload.assessmentTypeId.startsWith('TEMP_') && <span className="text-orange-500 ml-1">({t('linked_to_new')})</span>}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 mt-1">
                                                        {t('saved_at')}: {new Date(g.timestamp).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => syncSingleGrade(g)}
                                                        disabled={!isOnline || syncingId === g.id}
                                                        className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded hover:bg-green-200 disabled:opacity-50"
                                                    >
                                                        {syncingId === g.id ? '...' : t('sync')}
                                                    </button>
                                                    <button onClick={() => deleteItem('grade', g.id)} className="text-gray-400 hover:text-red-500">
                                                        🗑️
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t bg-white flex justify-between items-center">
                            <span className="text-xs text-gray-400">
                                {isOnline ? `🟢 ${t('online')}` : `🔴 ${t('offline')}`}
                            </span>
                            <div className="flex gap-3">
                                <button onClick={() => setShowList(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded">{t('close')}</button>
                                <button 
                                    onClick={handleSyncAll}
                                    disabled={syncingAll || !isOnline}
                                    className="px-6 py-2 rounded font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 shadow-md"
                                >
                                    {syncingAll ? t('syncing') : t('sync_all')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SyncStatus;