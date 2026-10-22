// This browser-only IndexedDB cache protects successful voice scenes from
// being lost after a refresh, quota failure or temporary network problem.
// No audio or transcript is uploaded to a cache server.
const DB_NAME = "falowen-hoeren-voice-cache";
const STORE = "scenes-v1";
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "key" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getSavedVoice(key) {
  try {
    const db = await openDatabase();
    if (!db) return null;
    return await new Promise(resolve => {
      const transaction = db.transaction(STORE, "readonly");
      const request = transaction.objectStore(STORE).get(key);
      request.onsuccess = () => {
        const entry = request.result;
        resolve(entry && Date.now() - entry.savedAt < MAX_AGE_MS ? new Uint8Array(entry.audio) : null);
      };
      request.onerror = () => resolve(null);
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => db.close();
    });
  } catch { return null; }
}

export async function saveVoice(key, audio) {
  try {
    const db = await openDatabase();
    if (!db) return false;
    return await new Promise(resolve => {
      const transaction = db.transaction(STORE, "readwrite");
      transaction.objectStore(STORE).put({ key, savedAt: Date.now(), audio: audio.slice() });
      transaction.oncomplete = () => { db.close(); resolve(true); };
      transaction.onerror = () => { db.close(); resolve(false); };
      transaction.onabort = () => { db.close(); resolve(false); };
    });
  } catch { return false; }
}
