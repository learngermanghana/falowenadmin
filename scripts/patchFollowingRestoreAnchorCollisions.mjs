import { readFile, writeFile } from "node:fs/promises";

const target = new URL("../src/utils/liveClassFollowingScheduleRestore.js", import.meta.url);
let source = await readFile(target, "utf8");

const before = `  const collisions = countSessionTimeCollisions(proposedSessions);\n  if (collisions > 0) {\n    throw new Error("The restored timetable would overlap another active session. Review cancelled or duplicate session records first.");\n  }`;

const after = `  // Repair is intentionally anchored: earlier sessions are historical and must not block\n  // rebuilding the timetable from the administrator-selected last-correct session onward.\n  // We still reject collisions involving the anchor or any later lesson.\n  const anchorAndFollowingSessions = proposedSessions.filter((session) => {\n    const lessonNumber = resolveOfficialSessionNumber(session, groups, levelId);\n    if (lessonNumber) return lessonNumber >= anchorLessonNumber;\n    const startsAt = toDate(session.startsAt);\n    return Boolean(startsAt && startsAt.getTime() >= anchorStartsAt.getTime());\n  });\n  const collisions = countSessionTimeCollisions(anchorAndFollowingSessions);\n  if (collisions > 0) {\n    throw new Error("A session at or after the selected anchor would still overlap another active session. Choose the last correct session and Falowen will rebuild only the lessons after it.");\n  }`;

if (source.includes(after)) {
  process.exit(0);
}
if (!source.includes(before)) {
  throw new Error("Following restore collision anchor changed; update patchFollowingRestoreAnchorCollisions.mjs");
}
source = source.replace(before, after);
await writeFile(target, source);
console.log("Patched following-session restore to ignore historical pre-anchor overlaps.");
