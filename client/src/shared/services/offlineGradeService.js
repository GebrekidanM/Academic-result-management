const STORAGE_KEY = 'offline_grade_queue';

const getQueue = () => {
    const queue = localStorage.getItem(STORAGE_KEY);
    return queue ? JSON.parse(queue) : [];
};

const addToQueue = (data) => {
    try {
        const queue = getQueue();
        const item = {
            id: Date.now(), 
            payload: data,
            timestamp: new Date().toISOString()
        };
        queue.push(item);
        
        // --- SAFE WRITE WITH ERROR HANDLING ---
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        return queue.length;

    } catch (e) {
        // Handle Firefox & Chrome Quota Errors
        if (
            e.name === 'QuotaExceededError' || 
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED' // <--- Specific to Firefox
        ) {
            alert("⚠️ STORAGE FULL! \n\nFirefox cannot save more offline data. Please connect to the internet and click 'Sync' to clear space.");
            console.error("Local Storage Quota Exceeded");
            return -1; // Indicate failure
        } else {
            throw e; // Throw other unknown errors
        }
    }
};

const removeFromQueue = (id) => {
    try {
        let queue = getQueue();
        queue = queue.filter(item => item.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        return queue.length;
    } catch (e) {
        console.error("Error updating queue:", e);
        return 0;
    }
};

const clearQueue = () => {
    localStorage.removeItem(STORAGE_KEY);
};

const getCount = () => {
    return getQueue().length;
};

export default {
    getQueue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    getCount
};