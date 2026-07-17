import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const servicePath = path.join(root, "src/services/liveClassServiceBase.js");
const pagePath = path.join(root, "src/pages/LiveClassesPageV2.jsx");

function patchService() {
  let source = fs.readFileSync(servicePath, "utf8");
  if (source.includes("export async function undoSessionCompletion")) return;

  const replacement = `export async function markSessionCompleted(sessionId, adminId = "admin") {
  const sessionRef = doc(db, "classSessions", sessionId);
  await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    if (!sessionSnap.exists()) throw new Error("Session not found");
    const session = { id: sessionSnap.id, ...sessionSnap.data() };
    const klass = await loadClassRecord(session.classId, transaction);
    const previousStatus = String(session.status || "scheduled").trim().toLowerCase() || "scheduled";
    const patch = {
      status: "completed",
      completionSource: "manual",
      completionPreviousStatus: previousStatus,
      completedBy: adminId,
      completedAt: serverTimestamp(),
      autoCompletionSuppressed: false,
      remindersSuppressed: true,
      sequence: Number(session.sequence || 0) + 1,
      updatedAt: serverTimestamp(),
    };
    transaction.update(sessionRef, patch);
    transaction.set(attendanceSessionRef(session.classId, sessionId), attendanceMetadata(klass, session, patch), { merge: true });
    transaction.set(doc(collection(db, "auditLogs")), {
      type: "classSession.completed",
      classId: session.classId,
      sessionId,
      previousStatus,
      completionSource: "manual",
      actorId: adminId,
      createdAt: serverTimestamp(),
    });
  });
}

export async function undoSessionCompletion(sessionId, { adminId = "admin", reason = "" } = {}) {
  const sessionRef = doc(db, "classSessions", sessionId);
  await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    if (!sessionSnap.exists()) throw new Error("Session not found");
    const session = { id: sessionSnap.id, ...sessionSnap.data() };
    if (String(session.status || "").trim().toLowerCase() !== "completed") {
      throw new Error("Only a completed session can be undone");
    }
    const klass = await loadClassRecord(session.classId, transaction);
    const patch = {
      status: "scheduled",
      completionSource: "completion-undone",
      completionPreviousStatus: String(session.completionPreviousStatus || "scheduled").trim() || "scheduled",
      completedAt: null,
      completedBy: "",
      autoCompletedAt: null,
      autoCompletionSuppressed: true,
      completionUndoneAt: serverTimestamp(),
      completionUndoneBy: adminId,
      completionUndoReason: String(reason || "").trim(),
      remindersSuppressed: false,
      sequence: Number(session.sequence || 0) + 1,
      updatedAt: serverTimestamp(),
    };
    transaction.update(sessionRef, patch);
    transaction.set(attendanceSessionRef(session.classId, sessionId), attendanceMetadata(klass, session, patch), { merge: true });
    transaction.set(doc(collection(db, "auditLogs")), {
      type: "classSession.completionUndone",
      classId: session.classId,
      sessionId,
      previousCompletionSource: String(session.completionSource || ""),
      reason: patch.completionUndoReason,
      actorId: adminId,
      createdAt: serverTimestamp(),
    });
  });
}

export async function allowAutomaticSessionCompletion(sessionId, adminId = "admin") {
  const sessionRef = doc(db, "classSessions", sessionId);
  await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    if (!sessionSnap.exists()) throw new Error("Session not found");
    const session = { id: sessionSnap.id, ...sessionSnap.data() };
    if (!["scheduled", "live", "rescheduled"].includes(String(session.status || "scheduled").trim().toLowerCase())) {
      throw new Error("Automatic completion can only be enabled for an active session");
    }
    const klass = await loadClassRecord(session.classId, transaction);
    const patch = {
      autoCompletionSuppressed: false,
      completionHoldReleasedAt: serverTimestamp(),
      completionHoldReleasedBy: adminId,
      updatedAt: serverTimestamp(),
    };
    transaction.update(sessionRef, patch);
    transaction.set(attendanceSessionRef(session.classId, sessionId), attendanceMetadata(klass, session, patch), { merge: true });
    transaction.set(doc(collection(db, "auditLogs")), {
      type: "classSession.autoCompletionEnabled",
      classId: session.classId,
      sessionId,
      actorId: adminId,
      createdAt: serverTimestamp(),
    });
  });
}

export function resolveSessionChapters`;

  const pattern = /export async function markSessionCompleted[\s\S]*?\n}\n\nexport function resolveSessionChapters/;
  if (!pattern.test(source)) throw new Error("Could not locate markSessionCompleted in liveClassServiceBase.js");
  source = source.replace(pattern, replacement);
  fs.writeFileSync(servicePath, source, "utf8");
}

function patchPage() {
  let source = fs.readFileSync(pagePath, "utf8");

  if (!source.includes("allowAutomaticSessionCompletion,")) {
    source = source.replace(
      "import {\n  cancelSession,",
      "import {\n  allowAutomaticSessionCompletion,\n  cancelSession,",
    );
  }
  if (!source.includes("undoSessionCompletion,")) {
    source = source.replace(
      "  updateSession,\n} from \"../services/liveClassService.js\";",
      "  undoSessionCompletion,\n  updateSession,\n} from \"../services/liveClassService.js\";",
    );
  }

  if (!source.includes('action === "undo-completion"')) {
    const handler = `  async function handleSessionAction(session, action) {
    setBusy(true);
    setMessage("");
    try {
      const adminId = user?.uid || user?.email || "admin";
      let successMessage = "Session updated.";
      if (action === "topic") {
        const topic = window.prompt("Session topic", session.topic || "");
        if (topic === null) return;
        await updateSession(session.id, { topic: topic.trim() });
        successMessage = "Session topic updated.";
      }
      if (action === "complete") {
        if (!window.confirm("Mark this session completed now? Automatic completion normally happens 30 minutes after the class ends.")) return;
        await markSessionCompleted(session.id, adminId);
        successMessage = "Session marked completed.";
      }
      if (action === "undo-completion") {
        const reason = window.prompt("Why are you undoing this completion?", "The session was marked completed by mistake.");
        if (reason === null) return;
        await undoSessionCompletion(session.id, { adminId, reason });
        successMessage = "Completion undone. Automatic completion is paused for this session until you allow it again.";
      }
      if (action === "allow-auto-completion") {
        if (!window.confirm("Allow the automatic worker to complete this session after its end time?")) return;
        await allowAutomaticSessionCompletion(session.id, adminId);
        successMessage = "Automatic completion enabled for this session.";
      }
      await refreshDashboard(selectedClassId);
      setMessage(successMessage);
      toast.success(successMessage, { durationMs: 6500 });
    } catch (error) {
      setMessage(error?.message || "Session update failed");
      toast.error(error?.message || "Session update failed", { durationMs: 6500 });
    } finally {
      setBusy(false);
    }
  }

  function renderSessionChangeForm`;
    const pattern = /  async function handleSessionAction\(session, action\) \{[\s\S]*?\n  \}\n\n  function renderSessionChangeForm/;
    if (!pattern.test(source)) throw new Error("Could not locate handleSessionAction in LiveClassesPageV2.jsx");
    source = source.replace(pattern, handler);
  }

  if (!source.includes("Automatic completion paused")) {
    source = source.replace(
      '{status === "scheduled" && session.rescheduleReason ? <small style={{ display: "block", marginTop: 6, color: "#475569" }}>Moved: {session.rescheduleReason}</small> : null}',
      '{status === "scheduled" && session.rescheduleReason ? <small style={{ display: "block", marginTop: 6, color: "#475569" }}>Moved: {session.rescheduleReason}</small> : null}\n                    {status === "completed" && session.completionSource ? <small style={{ display: "block", marginTop: 6, color: "#166534" }}>Completed: {session.completionSource === "automatic" ? "automatically" : "manually"}</small> : null}\n                    {status !== "completed" && session.autoCompletionSuppressed ? <small style={{ display: "block", marginTop: 6, color: "#9a3412" }}>Automatic completion paused</small> : null}',
    );
  }

  if (!source.includes('handleSessionAction(session, "undo-completion")')) {
    source = source.replace(
      '<button type="button" disabled={busy || contentLocked} onClick={() => handleSessionAction(session, "complete")}>Complete</button>',
      '{status === "completed" ? (\n                      <button type="button" disabled={busy} onClick={() => handleSessionAction(session, "undo-completion")}>Undo completion</button>\n                    ) : (\n                      <>\n                        <button type="button" disabled={busy || contentLocked} onClick={() => handleSessionAction(session, "complete")}>Complete now</button>\n                        {session.autoCompletionSuppressed ? <button type="button" disabled={busy} onClick={() => handleSessionAction(session, "allow-auto-completion")}>Allow auto-complete</button> : null}\n                      </>\n                    )}',
    );
  }

  fs.writeFileSync(pagePath, source, "utf8");
}

patchService();
patchPage();
console.log("Applied automatic completion and Undo controls to Live Classes.");
