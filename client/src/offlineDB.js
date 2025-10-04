//offlineDB.js
import { openDB } from 'idb';

const DB_NAME = 'FreedomSMS';
const VERSION = 2;

// Stores
const PENDING_STORE = 'pendingRequests'; // unsent API requests
const CACHE_STORE = 'localCache'; // cached GET data (students, teachers, etc.)

export async function getDB() {
  return openDB(DB_NAME, VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        db.createObjectStore(PENDING_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
      }
    }
  });
}

/**
 * Queue a failed API request for later retry
 * Example: await queueRequest('/api/students', 'POST', studentData)
 */
export async function queueRequest(url, method, body) {
  const db = await getDB();
  await db.add(PENDING_STORE, {
    url,
    method,
    body,
    timestamp: Date.now()
  });
  console.log('📦 Queued request:', url);
}

/**
 * Retry queued requests when back online
 */
export async function processQueue() {
  const db = await getDB();
  const allRequests = await db.getAll(PENDING_STORE);

  for (const req of allRequests) {
    try {
      const res = await fetch(req.url, {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });

      if (res.ok) {
        await db.delete(PENDING_STORE, req.id);
        console.log(`✅ Synced: ${req.url}`);
      } else {
        console.warn(`⚠️ Sync failed for ${req.url}: ${res.statusText}`);
      }
    } catch (err) {
      console.error('🚫 Offline or sync failed:', err.message);
      // Keep it for retry
    }
  }
}

/**
 * Cache API data (GET results) for offline use
 * Example: await saveToCache('students', data)
 */
export async function saveToCache(key, data) {
  const db = await getDB();
  await db.put(CACHE_STORE, { key, data, timestamp: Date.now() });
  console.log(`💾 Cached data: ${key}`);
}

/**
 * Retrieve cached data (when offline)
 */
export async function getFromCache(key) {
  const db = await getDB();
  const record = await db.get(CACHE_STORE, key);
  return record ? record.data : null;
}
