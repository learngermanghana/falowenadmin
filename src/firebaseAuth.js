import { getAuth } from "firebase/auth";
import { app, hasFirebaseConfig } from "./firebaseApp.js";

export const auth = hasFirebaseConfig ? getAuth(app) : null;
