import admin from 'firebase-admin';
export const db = admin.firestore();
// Live-contract browser auth is deliberately absent. The worker supplies the
// protected registry entry and the exact submission's published key version.
export const auth = null;
export function doc(_db, ...segments) { return db.doc(segments.join('/')); }
export function collection(_db, ...segments) { return db.collection(segments.join('/')); }
export function setDoc(ref, data, options) { return ref.set(data, options); }
export async function getDoc(ref) { const snap = await ref.get(); return { exists: () => snap.exists, data: () => snap.data(), id: snap.id }; }
export function updateDoc(ref, data) { return ref.update(data); }
export function deleteDoc(ref) { return ref.delete(); }
export function addDoc(ref, data) { return ref.add(data); }
export function collectionGroup(_db, name) { return db.collectionGroup(name); }
export function where(...args) { return args; }
export function query(ref, ...clauses) { return clauses.reduce((q, clause) => q.where(...clause), ref); }
export function getDocs(ref) { return ref.get(); }
export function runTransaction(_db, work) { return db.runTransaction(work); }
