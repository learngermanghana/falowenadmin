import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const servicePath = path.join(root, "src/services/liveClassServiceBase.js");
const pagePath = path.join(root, "src/pages/LiveClassesPageV2.jsx");

function patchService() {
  let source = fs.readFileSync(servicePath, "utf8");
  if (source.includes("export async function undoSessionCompletion")) return;

  const replacement = `export async function markSessionCompleted(sessionId, adminId = "admin", classId = "") {
  const sessionRef = doc(db, "classSessions", sessionId);
  await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    if (!sessionSnap.exists()) throw new Error("Session not found");
    const session = { ...sessionSnap.data(), id: sessionSnap.id };
    const canonicalClassId = String(classId || session.classRecordId || session.classId || "").trim();
    if (!canonicalClassId) throw new Error("This session is not linked to a class");
    const klass = await loadClassRecord(canonicalClassId, transaction);
    const previousStatus = String(session.status || "scheduled").trim().toLowerCase() || "scheduled";
    const patch = {
      classId: canonicalClassId,
      classRecordId: canonicalClassId,
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
    transaction.set(attendanceSessionRef(canonicalClassId, sessionId), attendanceMetadata(klass, session, patch), { merge: true });
    transaction.set(doc(collection(db, "auditLogs")), {
      type: "classSession.completed",
      classId: canonicalClassId,
      sessionId,
      previousStatus,
      completionSource: "manual",
      actorId: adminId,
      createdAt: serverTimestamp(),
    });
  });
}

export async function undoSessionCompletion(sessionId, { adminId = "admin", reason = "", classId = "" } = {}) {
  const sessionRef = doc(db, "classSessions", sessionId);
  await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    if (!sessionSnap.exists()) throw new Error("Session not found");
    const session = { ...sessionSnap.data(), id: sessionSnap.id };
    if (String(session.status || "").trim().toLowerCase() !== "completed") {
      throw new Error("Only a completed session can be undone");
    }
    const canonicalClassId = String(classId || session.classRecordId || session.classId || "").trim();
    if (!canonicalClassId) throw new Error("This session is not linked to a class");
    const klass = await loadClassRecord(canonicalClassId, transaction);
    const patch = {
      classId: canonicalClassId,
      classRecordId: canonicalClassId,
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
    transaction.set(attendanceSessionRef(canonicalClassId, sessionId), attendanceMetadata(klass, session, patch), { merge: true });
    transaction.set(doc(collection(db, "auditLogs")), {
      type: "classSession.completionUndone",
      classId: canonicalClassId,
      sessionId,
      previousCompletionSource: String(session.completionSource || ""),
      reason: patch.completionUndoReason,
      actorId: adminId,
      createdAt: serverTimestamp(),
    });
  });
}

export async function allowAutomaticSessionCompletion(sessionId, adminId = "admin", classId = "") {
  const sessionRef = doc(db, "classSessions", sessionId);
  await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    if (!sessionSnap.exists()) throw new Error("Session not found");
    const session = { ...sessionSnap.data(), id: sessionSnap.id };
    if (!["scheduled", "live", "rescheduled"].includes(String(session.status || "scheduled").trim().toLowerCase())) {
      throw new Error("Automatic completion can only be enabled for an active session");
    }
    const canonicalClassId = String(classId || session.classRecordId || session.classId || "").trim();
    if (!canonicalClassId) throw new Error("This session is not linked to a class");
    const klass = await loadClassRecord(canonicalClassId, transaction);
    const patch = {
      classId: canonicalClassId,
      classRecordId: canonicalClassId,
      autoCompletionSuppressed: false,
      completionHoldReleasedAt: serverTimestamp(),
      completionHoldReleasedBy: adminId,
      updatedAt: serverTimestamp(),
    };
    transaction.update(sessionRef, patch);
    transaction.set(attendanceSessionRef(canonicalClassId, sessionId), attendanceMetadata(klass, session, patch), { merge: true });
    transaction.set(doc(collection(db, "auditLogs")), {
      type: "classSession.autoCompletionEnabled",
      classId: canonicalClassId,
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
      const canonicalClassId = dashboard?.klass?.id || selectedClassId || session.classRecordId || session.classId || "";
      let successMessage = "Session updated.";
      if (action === "topic") {
        const topic = window.prompt("Session topic", session.topic || "");
        if (topic === null) return;
        await updateSession(session.id, { topic: topic.trim() });
        successMessage = "Session topic updated.";
      }
      if (action === "complete") {
        if (!window.confirm("Mark this session completed now? Automatic completion normally happens 30 minutes after the class ends.")) return;
        await markSessionCompleted(session.id, adminId, canonicalClassId);
        successMessage = "Session marked completed.";
      }
      if (action === "undo-completion") {
        const reason = window.prompt("Why are you undoing this completion?", "The session was marked completed by mistake.");
        if (reason === null) return;
        await undoSessionCompletion(session.id, { adminId, reason, classId: canonicalClassId });
        successMessage = "Completion undone. Automatic completion is paused for this session until you allow it again.";
      }
      if (action === "allow-auto-completion") {
        if (!window.confirm("Allow the automatic worker to complete this session after its end time?")) return;
        await allowAutomaticSessionCompletion(session.id, adminId, canonicalClassId);
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

  if (!source.includes("LIVE_CLASS_DASHBOARD_REFRESH_MS")) {
    source = source.replace(
      "function normalize(value) {",
      "const LIVE_CLASS_DASHBOARD_REFRESH_MS = 60_000;\n\nfunction normalize(value) {",
    );

    const dashboardEffectPattern = /  useEffect\(\(\) => \{\n    let active = true;\n    if \(!selectedClassId\) \{\n      setDashboard\(null\);\n      return \(\) => \{ active = false; \};\n    \}\n    setLoading\(true\);\n    getCompatibleClassDashboard\(selectedClassId\)[\s\S]*?\n  \}, \[selectedClassId\]\);/;
    const dashboardEffect = `  useEffect(() => {
    let active = true;
    let refreshInFlight = false;

    if (!selectedClassId) {
      setDashboard(null);
      return () => { active = false; };
    }

    const loadDashboard = async ({ initial = false } = {}) => {
      if (!active || refreshInFlight) return;
      refreshInFlight = true;
      if (initial) setLoading(true);
      try {
        const next = await getCompatibleClassDashboard(selectedClassId);
        if (!active) return;
        setDashboard(next);
        setMessage(next.curriculumSync?.error || "");
      } catch (error) {
        if (!active) return;
        if (initial) {
          setDashboard(null);
          setMessage(error?.message || "Could not load this live class");
        } else {
          console.warn("Could not refresh this live class dashboard", error);
        }
      } finally {
        refreshInFlight = false;
        if (active && initial) setLoading(false);
      }
    };

    void loadDashboard({ initial: true });
    const timer = window.setInterval(() => {
      if (!document.hidden) void loadDashboard();
    }, LIVE_CLASS_DASHBOARD_REFRESH_MS);
    const refreshWhenVisible = () => {
      if (!document.hidden) void loadDashboard();
    };
    window.addEventListener("focus", refreshWhenVisible);
    window.addEventListener("pageshow", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshWhenVisible);
      window.removeEventListener("pageshow", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [selectedClassId]);`;

    if (!dashboardEffectPattern.test(source)) {
      throw new Error("Could not locate the Live Classes dashboard loading effect");
    }
    source = source.replace(dashboardEffectPattern, dashboardEffect);
  } else {
    source = source.replace(
      "        if (next.curriculumSync?.error) setMessage(next.curriculumSync.error);",
      "        setMessage(next.curriculumSync?.error || \"\");",
    );
  }

  fs.writeFileSync(pagePath, source, "utf8");
}

patchService();
patchPage();
console.log("Applied automatic completion, Undo controls and live dashboard refresh to Live Classes.");