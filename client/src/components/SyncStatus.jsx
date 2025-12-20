import React, { useState, useEffect } from 'react';
import offlineGradeService from '../services/offlineGradeService';
import offlineAssessmentService from '../services/offlineAssessmentService';
import gradeService from '../services/gradeService';
import assessmentTypeService from '../services/assessmentTypeService';

const SyncStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [syncing, setSyncing] = useState(false);
    
    // --- NEW STATES FOR MODAL ---
    const [showList, setShowList] = useState(false);
    const [pendingAssessments, setPendingAssessments] = useState([]);
    const [pendingGrades, setPendingGrades] = useState([]);

    // Check queue size every 2 seconds
    useEffect(() => {
        const checkQueue = () => {
            const gQueue = offlineGradeService.getQueue();
            const aList = offlineAssessmentService.getLocalAssessments();
            
            setPendingCount(gQueue.length + aList.length);
            setPendingGrades(gQueue);
            setPendingAssessments(aList);
            setIsOnline(navigator.onLine);
        };

        const interval = setInterval(checkQueue, 2000);
        
        // Run once immediately
        checkQueue();

        return () => clearInterval(interval);
    }, []);

    const handleSync = async () => {
        if (!isOnline) return;

        setSyncing(true);
        const idMap = {}; 
        let successCount = 0;
        let failCount = 0;

        // 1. Sync Assessments
        for (const assess of pendingAssessments) {
            try {
                const { _id, isOffline, ...payload } = assess; 
                const res = await assessmentTypeService.create(payload);
                const realId = res.data.data._id;
                idMap[assess._id] = realId; 
                offlineAssessmentService.removeLocalAssessment(assess._id);
                successCount++;
            } catch (err) {
                console.error("Failed to sync assessment:", assess.name, err);
                failCount++;
            }
        }

        // 2. Sync Grades
        // Note: Re-fetch queue to ensure we have latest state if needed, 
        // but using state 'pendingGrades' is usually fine if we update it after.
        const currentGradeQueue = offlineGradeService.getQueue();

        for (const item of currentGradeQueue) {
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
            } catch (error) {
                failCount++;
            }
        }

        setSyncing(false);
        // Refresh Lists after sync
        setPendingAssessments(offlineAssessmentService.getLocalAssessments());
        setPendingGrades(offlineGradeService.getQueue());
        setShowList(false); // Close modal on completion

        if (failCount === 0 && successCount > 0) {
            alert(`✅ Successfully synced ${successCount} items!`);
        } else if (failCount > 0) {
            alert(`⚠️ Synced ${successCount} items, but ${failCount} failed.`);
        }
    };

    if (pendingCount === 0) return null;

    return (
        <>
            {/* --- FLOATING BUTTON --- */}
            <div className="fixed bottom-16 right-4 z-40 animate-bounce-small print:hidden">
                <button 
                    onClick={() => setShowList(true)} // Open Modal
                    className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-xl font-bold text-white transition-all
                        ${isOnline ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-500'}
                    `}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isOnline ? `Sync ${pendingCount} Items` : `Waiting for Internet (${pendingCount})`}
                </button>
            </div>

            {/* --- MODAL LIST --- */}
            {showList && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 print:hidden">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                        
                        {/* Header */}
                        <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">Pending Sync Items ({pendingCount})</h3>
                            <button onClick={() => setShowList(false)} className="text-gray-500 hover:text-gray-700 font-bold text-xl">&times;</button>
                        </div>

                        {/* List Content */}
                        <div className="p-4 overflow-y-auto flex-1">
                            
                            {/* 1. Assessments List */}
                            {pendingAssessments.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-bold text-blue-600 uppercase mb-2">New Assessments Created</h4>
                                    <ul className="space-y-2">
                                        {pendingAssessments.map((a, idx) => (
                                            <li key={idx} className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                                                <div className="font-bold text-gray-800">{a.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {a.gradeLevel} | {a.month} | {a.totalMarks} Marks
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* 2. Grades List */}
                            {pendingGrades.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-green-600 uppercase mb-2">Grade Sheets Entered</h4>
                                    <ul className="space-y-2">
                                        {pendingGrades.map((g, idx) => (
                                            <li key={idx} className="p-3 bg-green-50 border border-green-100 rounded-md">
                                                <div className="font-bold text-gray-800">
                                                    Grades for: {g.payload.academicYear} ({g.payload.semester})
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {g.payload.scores.length} Students Graded
                                                    {/* Show visual tag if it belongs to a TEMP assessment */}
                                                    {g.payload.assessmentTypeId.startsWith('TEMP_') && (
                                                        <span className="ml-2 text-orange-600 font-bold">(New Assessment)</span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-gray-400 mt-1">
                                                    Saved at: {new Date(g.timestamp).toLocaleString()}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Footer / Actions */}
                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button 
                                onClick={() => setShowList(false)}
                                className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded"
                            >
                                Close
                            </button>
                            <button 
                                onClick={handleSync}
                                disabled={syncing || !isOnline}
                                className={`px-6 py-2 rounded font-bold text-white flex items-center gap-2
                                    ${isOnline ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}
                                `}
                            >
                                {syncing ? 'Syncing...' : 'Sync All Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SyncStatus;