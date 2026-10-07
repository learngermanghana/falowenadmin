import { getAuth } from "firebase/auth";
import { app, hasFirebaseConfig } from "./firebaseApp";

export const auth = hasFirebaseConfig ? getAuth(app) : null;
