const STORAGE_KEY = 'offline_grade_queue';

// 1. Get the current queue
const getQueue = () => {
    const queue = localStorage.getItem(STORAGE_KEY);
    return queue ? JSON.parse(queue) : [];
};

// 2. Add an item to the queue
const addToQueue = (data) => {
    const queue = getQueue();
    // Add a unique ID and timestamp
    const item = {
        id: Date.now(), 
        payload: data,
        timestamp: new Date().toISOString()
    };
    queue.push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return queue.length;
};

// 3. Remove an item (after successful sync)
const removeFromQueue = (id) => {
    let queue = getQueue();
    queue = queue.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return queue.length;
};

// 4. Clear entire queue
const clearQueue = () => {
    localStorage.removeItem(STORAGE_KEY);
};

// 5. Check queue size
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