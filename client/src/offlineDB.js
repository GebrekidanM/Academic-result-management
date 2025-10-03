import { openDB } from 'idb';

const DB_NAME = 'FreedomSMS';
const STORE = 'offlineGrades';

export async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    }
  });
}

export async function saveOfflineGrade(grade) {
  const db = await getDB();
  await db.add(STORE, grade);
}

export async function getOfflineGrades() {
  const db = await getDB();
  return db.getAll(STORE);
}

export async function deleteOfflineGrade(id) {
  const db = await getDB();
  return db.delete(STORE, id);
}
