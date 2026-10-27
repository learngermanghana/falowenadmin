import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const patchScript = path.join(repoRoot, "scripts/patchAutomaticSessionCompletionUi.mjs");

const oldService = `export async function markSessionCompleted(sessionId, adminId = "admin") {
  const sessionRef = doc(db, "classSessions", sessionId);
  await runTransaction(db, async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    const session = { id: sessionSnap.id, ...sessionSnap.data() };
    const klass = await loadClassRecord(session.classId, transaction);
  });
}

export async function undoSessionCompletion(sessionId, { adminId = "admin", reason = "" } = {}) {
  return { sessionId, adminId, reason };
}

export async function allowAutomaticSessionCompletion(sessionId, adminId = "admin") {
  return { sessionId, adminId };
}

export function resolveSessionChapters(levelId, session) {
  return [];
}
`;

const oldPage = `import {
  allowAutomaticSessionCompletion,
  undoSessionCompletion,
} from "../services/liveClassService.js";

const LIVE_CLASS_DASHBOARD_REFRESH_MS = 60_000;

export default function LiveClassesPageV2() {
  useEffect(() => {
    let active = true;
    let refreshInFlight = false;

    const loadDashboard = async ({ initial = false } = {}) => {
      if (!active || refreshInFlight) return;
      refreshInFlight = true;
      try {
        const next = await getCompatibleClassDashboard(selectedClassId);
        if (!active) return;
        setDashboard(next);
        setMessage(next.curriculumSync?.error || "");
      } finally {
        refreshInFlight = false;
      }
    };

    void loadDashboard({ initial: true });
    return () => { active = false; };
  }, [selectedClassId]);

  async function handleSessionAction(session, action) {
    setBusy(true);
    setMessage("");
    try {
      const adminId = user?.uid || user?.email || "admin";
      if (action === "complete") {
        await markSessionCompleted(session.id, adminId);
      }
      if (action === "undo-completion") {
        await undoSessionCompletion(session.id, { adminId });
      }
      await refreshDashboard(selectedClassId);
    } finally {
      setBusy(false);
    }
  }

  function renderSessionChangeForm(session) {
    return session;
  }

  // Automatic completion paused
  // handleSessionAction(session, "undo-completion")
  return null;
}
`;

test("updated patch migrates an older generated completion handler", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "falowen-completion-patch-"));
  try {
    await mkdir(path.join(root, "scripts"), { recursive: true });
    await mkdir(path.join(root, "src/services"), { recursive: true });
    await mkdir(path.join(root, "src/pages"), { recursive: true });
    await writeFile(path.join(root, "scripts/patchAutomaticSessionCompletionUi.mjs"), await readFile(patchScript, "utf8"));
    await writeFile(path.join(root, "src/services/liveClassServiceBase.js"), oldService);
    await writeFile(path.join(root, "src/pages/LiveClassesPageV2.jsx"), oldPage);

    const result = spawnSync(process.execPath, [path.join(root, "scripts/patchAutomaticSessionCompletionUi.mjs")], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const service = await readFile(path.join(root, "src/services/liveClassServiceBase.js"), "utf8");
    const page = await readFile(path.join(root, "src/pages/LiveClassesPageV2.jsx"), "utf8");

    assert.match(service, /markSessionCompleted\(sessionId, adminId = "admin", classId = ""\)/);
    assert.match(service, /classId \|\| session\.classRecordId \|\| session\.classId/);
    assert.doesNotMatch(service, /loadClassRecord\(session\.classId, transaction\)/);
    assert.match(page, /markSessionCompleted\(session\.id, adminId, canonicalClassId\)/);
    assert.match(page, /let lastCurriculumSyncError = "";/);
    assert.match(page, /current === recoveredCurriculumSyncError \? "" : current/);
    assert.doesNotMatch(page, /setMessage\(next\.curriculumSync\?\.error \|\| ""\)/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
