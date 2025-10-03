import { openDB } from 'idb';

export const dbPromise = openDB('freedom-sms', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('offline-grades')) {
      db.createObjectStore('offline-grades', { keyPath: 'id', autoIncrement: true });
    }
  },
});

export async function saveOfflineGrade(grade) {
  const db = await dbPromise;
  await db.add('offline-grades', grade);
}

export async function getOfflineGrades() {
  const db = await dbPromise;
  return db.getAll('offline-grades');
}

export async function deleteOfflineGrade(id) {
  const db = await dbPromise;
  await db.delete('offline-grades', id);
}
