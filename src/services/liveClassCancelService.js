import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { syncClassEndDateFromSessions } from "./liveClassEndDateService.js";
import * as base from "./liveClassServiceBase.js";

export async function cancelSession(sessionId, payload) {
  const result = await base.cancelSession(sessionId, payload);
  const sessionSnap = await getDoc(doc(db, "classSessions", String(sessionId)));
  if (sessionSnap.exists()) {
    await syncClassEndDateFromSessions(sessionSnap.data().classId).catch(() => {});
  }
  return result;
}
