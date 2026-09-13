import { readFile, writeFile } from "node:fs/promises";

const target = new URL("../src/utils/liveClassFollowingScheduleRestore.js", import.meta.url);
let source = await readFile(target, "utf8");

const before = `  const collisions = countSessionTimeCollisions(proposedSessions);\n  if (collisions > 0) {\n    throw new Error("The restored timetable would overlap another active session. Review cancelled or duplicate session records first.");\n  }`;

const after = `  // Repair is intentionally anchored: earlier sessions are historical and must not block\n  // rebuilding the timetable from the administrator-selected last-correct session onward.\n  // We still reject collisions involving the anchor or any later lesson.\n  const anchorAndFollowingSessions = proposedSessions.filter((session) => {\n    const lessonNumber = resolveOfficialSessionNumber(session, groups, levelId);\n    if (lessonNumber) return lessonNumber >= anchorLessonNumber;\n    const startsAt = toDate(session.startsAt);\n    return Boolean(startsAt && startsAt.getTime() >= anchorStartsAt.getTime());\n  });\n  const collisions = countSessionTimeCollisions(anchorAndFollowingSessions);\n  if (collisions > 0) {\n    throw new Error("A session at or after the selected anchor would still overlap another active session. Choose the last correct session and Falowen will rebuild only the lessons after it.");\n  }`;

// New source plans stale future duplicate/orphan records for supersession before
// checking the final collision invariant. Never strip that safety logic at build time.
// Match both the original `sessions` implementation and the class-scoped variant.
const safeSupersessionMarker = "const staleFutureRecords =";
const anchoredCollisionMarker = "const anchorAndFollowingSessions = proposedSessions.filter((session) => {";

if (!source.includes(safeSupersessionMarker) && !source.includes(after) && !source.includes(anchoredCollisionMarker)) {
  if (!source.includes(before)) {
    throw new Error("Following restore collision anchor changed; update patchFollowingRestoreAnchorCollisions.mjs");
  }
  source = source.replace(before, after);
  await writeFile(target, source);
  console.log("Patched following-session restore to ignore historical pre-anchor overlaps.");
}

// A last-live-session restore is intentionally different from a full official timetable repair.
// The administrator-selected anchor must remain authoritative even when that class was held on
// a one-off day/time outside the normal weekly rules; later sessions resume on the next valid slots.
const lessonOrderTarget = new URL("../src/utils/liveClassLessonOrder.js", import.meta.url);
let lessonOrderSource = await readFile(lessonOrderTarget, "utf8");
const strictStoredAnchor = `    // A persisted anchor is only a progress marker. It must never redefine the\n    // timetable derived from the class's authoritative start date.\n    const officialSlot = startDateSlots[storedSessionNumber - 1];\n    if (officialSlot?.startsAt === storedStartsAt.toISOString()) {\n      return {\n        sessionNumber: storedSessionNumber,\n        startsAt: storedStartsAt.toISOString(),\n        source: "stored-class-anchor",\n      };\n    }`;
const restoreStoredAnchor = `    // Normal persisted anchors stay strict. An explicit admin following-restore anchor is\n    // authoritative because it represents the actual last live/correct session selected in UI.\n    const officialSlot = startDateSlots[storedSessionNumber - 1];\n    const isAdminFollowingRestore = normalize(klass.scheduleAnchorSource) === "admin-selected-following-restore";\n    if (isAdminFollowingRestore || officialSlot?.startsAt === storedStartsAt.toISOString()) {\n      return {\n        sessionNumber: storedSessionNumber,\n        startsAt: storedStartsAt.toISOString(),\n        source: isAdminFollowingRestore ? "admin-selected-following-restore" : "stored-class-anchor",\n      };\n    }`;

if (!lessonOrderSource.includes(restoreStoredAnchor)) {
  if (!lessonOrderSource.includes(strictStoredAnchor)) {
    throw new Error("Stored schedule anchor logic changed; update patchFollowingRestoreAnchorCollisions.mjs");
  }
  lessonOrderSource = lessonOrderSource.replace(strictStoredAnchor, restoreStoredAnchor);
  await writeFile(lessonOrderTarget, lessonOrderSource);
  console.log("Patched following-session restore to honor the administrator-selected last live anchor.");
}

// This script is already part of predev/prebuild/pretest, so use it to keep
// the Live Classes session table synchronized with successful repair actions.
await import("./patchLiveClassRepairRefresh.mjs");

// Keep omitted deterministic objective answers distinct from answered-but-wrong items.
await import("./patchMissingObjectiveFeedback.mjs");

// Keep the objective-review table copy/paste-safe. Some browser/clipboard paths flatten
// adjacent <th> cells into `QuestionStudentCorrectStatus`, which makes pasted review tables
// look as though the columns are wrong even though the on-screen table is correct.
const objectiveReviewTarget = new URL("../src/pages/MarkingPage.jsx", import.meta.url);
let objectiveReviewSource = await readFile(objectiveReviewTarget, "utf8");

const objectiveRowsAnchor = '  const objectiveWrongRows = useMemo(() => objectiveWrongAnswerRows(objectiveMarkingResult.details), [objectiveMarkingResult.details]);';
const objectiveRowsWithClipboard = [
  objectiveRowsAnchor,
  '  const objectiveReviewClipboardText = useMemo(() => {',
  '    const safeCell = (value) => String(value ?? "—").replace(/\\s+/g, " ").replace(/\\|/g, "\\\\|").trim() || "—";',
  '    const rows = objectiveWrongRows.map((row) => {',
  '      const submitted = safeCell(row.student || row.submitted || "—");',
  '      const expected = safeCell(row.expected || row.rawExpected || "—");',
  '      const status = String(row.student || row.submitted || "").trim() ? "Wrong" : "Not answered";',
  '      return `| ${safeCell(row.question)} | ${submitted} | ${expected} | ${status} |`;',
  '    });',
  '    return [',
  '      "| Question | Student | Correct | Status |",',
  '      "| --- | --- | --- | --- |",',
  '      ...rows,',
  '    ].join("\\n");',
  '  }, [objectiveWrongRows]);',
].join("\n");

if (!objectiveReviewSource.includes("const objectiveReviewClipboardText = useMemo")) {
  if (!objectiveReviewSource.includes(objectiveRowsAnchor)) {
    throw new Error("Objective review clipboard formatter anchor changed; update patchFollowingRestoreAnchorCollisions.mjs");
  }
  objectiveReviewSource = objectiveReviewSource.replace(objectiveRowsAnchor, objectiveRowsWithClipboard);
}

const objectiveTitle = '<div style={{ padding: 8, fontSize: 13, fontWeight: 700, color: "#7f1d1d" }}>Objective answers to review</div>';
const objectiveCopyButton = [
  objectiveTitle,
  '<div style={{ padding: "0 8px 8px", display: "flex", justifyContent: "flex-end" }}>',
  '  <button',
  '    type="button"',
  '    onClick={() => { void navigator.clipboard.writeText(objectiveReviewClipboardText); }}',
  '    style={{ fontSize: 12, padding: "4px 8px", whiteSpace: "nowrap" }}',
  '  >',
  '    Copy review',
  '  </button>',
  '</div>',
].join("\n");

if (!objectiveReviewSource.includes("Copy review")) {
  if (!objectiveReviewSource.includes(objectiveTitle)) {
    throw new Error("Objective review title anchor changed; update patchFollowingRestoreAnchorCollisions.mjs");
  }
  objectiveReviewSource = objectiveReviewSource.replace(objectiveTitle, objectiveCopyButton);
}

const objectiveReviewMarker = "Objective answers to review";
const objectiveReviewIndex = objectiveReviewSource.indexOf(objectiveReviewMarker);
if (objectiveReviewIndex < 0) {
  throw new Error("Objective review marker missing after clipboard patch");
}

const objectiveTableBefore = '<table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>';
const objectiveTableAfter = [
  '<table',
  '  style={{ width: "100%", minWidth: 720, tableLayout: "fixed", borderCollapse: "collapse", fontSize: 13 }}',
  '  onCopy={(event) => {',
  '    event.preventDefault();',
  '    event.clipboardData.setData("text/plain", objectiveReviewClipboardText);',
  '  }}',
  '>',
].join("\n");

const objectiveTableIndex = objectiveReviewSource.indexOf(objectiveTableBefore, objectiveReviewIndex);
if (objectiveTableIndex >= 0) {
  objectiveReviewSource = `${objectiveReviewSource.slice(0, objectiveTableIndex)}${objectiveTableAfter}${objectiveReviewSource.slice(objectiveTableIndex + objectiveTableBefore.length)}`;
} else {
  const objectiveReviewRegion = objectiveReviewSource.slice(objectiveReviewIndex, objectiveReviewIndex + 3500);
  if (!objectiveReviewRegion.includes('event.clipboardData.setData("text/plain", objectiveReviewClipboardText)')) {
    throw new Error("Objective review table anchor changed; update patchFollowingRestoreAnchorCollisions.mjs");
  }
}

await writeFile(objectiveReviewTarget, objectiveReviewSource);

if (!objectiveReviewSource.includes('"| Question | Student | Correct | Status |"')) {
  throw new Error("Objective review copy header regression failed");
}
if (!objectiveReviewSource.includes('event.clipboardData.setData("text/plain", objectiveReviewClipboardText)')) {
  throw new Error("Objective review direct-copy regression failed");
}

console.log("Objective review table now preserves Question, Student, Correct, and Status columns when copied.");