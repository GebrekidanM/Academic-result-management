const KEY = 'offline_assessments';

const getLocalAssessments = () => {
    const data = localStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
};

const addLocalAssessment = (assessmentData) => {
    try {
        const list = getLocalAssessments();
        
        // Generate a temporary ID (Prefix with TEMP_ so we know it's not from MongoDB)
        const tempId = `TEMP_${Date.now()}`;
        
        const newAssessment = {
            ...assessmentData,
            _id: tempId, // Fake ID
            isOffline: true, // Flag to identify it later
            createdAt: new Date().toISOString()
        };

        list.push(newAssessment);
        
        // --- SAFE WRITE ---
        localStorage.setItem(KEY, JSON.stringify(list));
        return newAssessment;

    } catch (e) {
        // Handle Storage Full Error
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            alert("⚠️ STORAGE FULL! \n\nCannot save new Assessment offline. Please connect to the internet and Sync to free up space.");
            console.error("Local Storage Quota Exceeded");
            return null; // Return null to indicate failure
        } else {
            console.error("Error saving assessment:", e);
            throw e;
        }
    }
};

const removeLocalAssessment = (tempId) => {
    try {
        let list = getLocalAssessments();
        list = list.filter(a => a._id !== tempId);
        localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {
        console.error("Error removing local assessment:", e);
    }
};

const clearAll = () => localStorage.removeItem(KEY);

export default {
    getLocalAssessments,
    addLocalAssessment,
    removeLocalAssessment,
    clearAll
};