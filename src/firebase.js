import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { app, hasFirebaseConfig } from "./firebaseApp.js";
import { auth } from "./firebaseAuth.js";

export const db = getFirestore(app);
export { auth };
export const storage = hasFirebaseConfig ? getStorage(app) : null;
