import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { app, hasFirebaseConfig } from "./firebaseApp";
import { auth } from "./firebaseAuth";

export const db = getFirestore(app);
export { auth };
export const storage = hasFirebaseConfig ? getStorage(app) : null;
