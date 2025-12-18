import React, { useState, useEffect } from 'react';
import offlineGradeService from '../services/offlineGradeService';
import offlineAssessmentService from '../services/offlineAssessmentService';
import gradeService from '../services/gradeService';
import assessmentTypeService from '../services/assessmentTypeService';

const SyncStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [syncing, setSyncing] = useState(false);

    // Check queue size every 2 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const gCount = offlineGradeService.getCount();
            const aCount = offlineAssessmentService.getLocalAssessments().length;
            setPendingCount(gCount + aCount);
            setIsOnline(navigator.onLine);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleSync = async () => {
        if (!isOnline) {
            alert("You are offline. Connect to internet to sync.");
            return;
        }

        setSyncing(true);
        const idMap = {}; // Maps "TEMP_ID" -> "Real_ID"
        let successCount = 0;
        let failCount = 0;

        // --- STEP 1: SYNC ASSESSMENTS FIRST ---
        // We must create the assessments on the server first to get real IDs
        const localAssessments = offlineAssessmentService.getLocalAssessments();
        
        for (const assess of localAssessments) {
            try {
                // Remove the fake _id and isOffline flag before sending
                const { _id, isOffline, ...payload } = assess; 
                
                // FIXED: Use .create() instead of .createAssessmentType()
                const res = await assessmentTypeService.create(payload);
                const realId = res.data.data._id;
                
                // Store the mapping so Grades can find it later
                idMap[assess._id] = realId; 

                // Success: Remove from local storage
                offlineAssessmentService.removeLocalAssessment(assess._id);
                successCount++;
            } catch (err) {
                console.error("Failed to sync assessment:", assess.name, err);
                
                // If it failed because it already exists (400), ideally we'd fetch the real ID.
                // For now, we count it as fail so user checks it manually.
                failCount++;
            }
        }

        // --- STEP 2: SYNC GRADE SHEETS ---
        // Now we process the grades, swapping IDs if necessary
        const gradeQueue = offlineGradeService.getQueue();
        
        for (const item of gradeQueue) {
            let payload = item.payload;
            let currentAssessId = payload.assessmentTypeId.toString();

            // CHECK: Is this a Temporary ID?
            if (currentAssessId.startsWith('TEMP_')) {
                // Do we have a Real ID mapped for it from Step 1?
                if (idMap[currentAssessId]) {
                    // YES: Swap the TEMP ID for the REAL ID
                    console.log(`Swapping ${currentAssessId} -> ${idMap[currentAssessId]}`);
                    payload.assessmentTypeId = idMap[currentAssessId];
                } else {
                    // NO: The assessment sync failed (or hasn't run), so we CANNOT send these grades yet.
                    // If we send "TEMP_...", the backend will crash with CastError.
                    console.warn(`Skipping grade sync for ${currentAssessId} - Parent Assessment not synced.`);
                    failCount++; 
                    continue; // SKIP THIS ITEM
                }
            }

            // If we get here, the ID is valid (either was already valid, or was just swapped)
            try {
                await gradeService.saveGradeSheet(payload);
                offlineGradeService.removeFromQueue(item.id);
                successCount++;
            } catch (error) {
                console.error("Sync failed for grade sheet:", error);
                failCount++;
            }
        }

        setSyncing(false);
        
        // Update the counter immediately for UI feedback
        const gCount = offlineGradeService.getCount();
        const aCount = offlineAssessmentService.getLocalAssessments().length;
        setPendingCount(gCount + aCount);

        // Feedback
        if (failCount === 0 && successCount > 0) {
            alert(`✅ Successfully synced ${successCount} items!`);
        } else if (failCount > 0) {
            alert(`⚠️ Synced ${successCount} items, but ${failCount} failed. Please ensure assessments are created correctly or try again.`);
        }
    };

    // Don't render anything if there is nothing to sync
    if (pendingCount === 0) return null;

    return (
        <div className="fixed bottom-16 right-4 z-50 animate-bounce-small print:hidden">
            <button 
                onClick={handleSync}
                disabled={syncing || !isOnline}
                className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-xl font-bold text-white transition-all
                    ${isOnline ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-500 cursor-not-allowed'}
                `}
            >
                {syncing ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Syncing...
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {isOnline ? `Sync ${pendingCount} Items` : `Waiting for Internet (${pendingCount})`}
                    </>
                )}
            </button>
        </div>
    );
};

export default SyncStatus;