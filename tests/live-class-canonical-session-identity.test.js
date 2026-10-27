import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pagePath = new URL("../src/pages/LiveClassesPageV2.jsx", import.meta.url);
const manualPath = new URL("../src/services/liveClassManualRescheduleService.js", import.meta.url);
const directPath = new URL("../src/services/liveClassSessionDirectService.js", import.meta.url);

test("Live Classes prefers the canonical class record when a legacy session classId contains the class name", async () => {
  const [page, manual, direct] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(manualPath, "utf8"),
    readFile(directPath, "utf8"),
  ]);

  assert.match(page, /classId: dashboard\?\.klass\?\.id \|\| dashboard\?\.klass\?\.classRecordId \|\| selectedClassId \|\| session\.classRecordId \|\| session\.classId/);
  assert.match(page, /const classId = dashboard\?\.klass\?\.id \|\| dashboard\?\.klass\?\.classRecordId \|\| selectedClassId \|\| sessionChange\.classId/);
  assert.doesNotMatch(page, /classId: session\.classId \|\| session\.classRecordId \|\| dashboard/);

  assert.match(manual, /payload\.classId \|\| session\.classRecordId \|\| session\.classId/);
  assert.doesNotMatch(manual, /payload\.classId \|\| session\.classId \|\| session\.classRecordId/);
  assert.match(direct, /payload\.classId \|\| session\.classRecordId \|\| session\.classId/);
  assert.doesNotMatch(direct, /payload\.classId \|\| session\.classId \|\| session\.classRecordId/);
});

test("opening a move uses the selected database class instead of a legacy session name", async () => {
  const page = await readFile(pagePath, "utf8");
  const functionSource = page.slice(page.indexOf("  function openSessionChange(session)"), page.indexOf("  async function handleSessionChangeSubmit"));
  let change;
  const open = new Function("dashboard", "selectedClassId", "setMessage", "setSessionChange", "toDateTimeLocal", "sessionDurationMinutes", "SESSION_CHANGE_REASONS", `${functionSource}; return openSessionChange;`)(
    { klass: { id: "berlin-document-id", name: "A1 Berlin Klasse" } },
    "berlin-document-id", () => {}, (value) => { change = value; },
    (value) => value, () => 120, [{ value: "Date changed" }],
  );
  open({ id: "session-document-id", classId: "A1 Berlin Klasse", classRecordId: "stale-record", startsAt: "2026-10-07T11:00:00Z" });
  assert.equal(change.classId, "berlin-document-id");
  assert.equal(change.sessionId, "session-document-id");
});

test("class list preserves the Firestore document ID when stored data has a stale id", async () => {
  const source = await readFile(new URL("../src/services/liveClassServiceBase.js", import.meta.url), "utf8");
  const functionSource = source.slice(source.indexOf("export async function listClassCohorts()"), source.indexOf("export async function resolveClassCohort")).replace("export ", "");
  const list = new Function("getDocs", "query", "collection", "orderBy", "db", "buildClassUrl", `${functionSource}; return listClassCohorts;`)(
    async () => ({ docs: [{ id: "berlin-document-id", data: () => ({ id: "stale-id", name: "A1 Berlin Klasse" }) }] }),
    () => {}, () => {}, () => {}, {}, (klass) => `/class/${klass.id}`,
  );
  const [klass] = await list();
  assert.equal(klass.id, "berlin-document-id");
  assert.equal(klass.classUrl, "/class/berlin-document-id");
});
