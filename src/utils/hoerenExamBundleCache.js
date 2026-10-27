// Local-only complete Goethe-style exam packs. These files are never uploaded
// to a new API: even large MP3s are stored and packaged on the owner's device.
const DB = "falowen-hoeren-exam-bundles";
const STORE = "parts-v1";
function open() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "key" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function transaction(mode, action) {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      let value;
      let settled = false;
      const finishError = (error) => {
        if (!settled) { settled = true; reject(error || new Error("Browser storage transaction failed")); }
      };
      tx.oncomplete = () => {
        if (!settled) { settled = true; resolve(value); }
      };
      tx.onerror = () => finishError(tx.error);
      tx.onabort = () => finishError(tx.error || new Error("Browser storage transaction aborted"));
      try {
        const request = action(tx.objectStore(STORE));
        request.onsuccess = () => { value = request.result; };
        request.onerror = () => finishError(request.error);
      } catch (error) {
        try { tx.abort(); } catch {}
        finishError(error);
      }
    });
  } finally { db.close(); }
}
export const bundleKey = (level, mock) => `${level}-mock-${String(mock).padStart(2, "0")}`;
export async function loadExamParts(key) {
  const record = await transaction("readonly", store => store.get(key));
  return record?.parts || {};
}
export async function saveExamParts(key, parts) {
  await transaction("readwrite", store => store.put({key,parts,updatedAt:Date.now()}));
}
export async function deleteExamParts(key) {
  await transaction("readwrite", store => store.delete(key));
}
