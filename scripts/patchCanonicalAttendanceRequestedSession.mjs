import { readFile, writeFile } from "node:fs/promises";

const target = new URL("../src/pages/CanonicalAttendancePageV3.jsx", import.meta.url);
let source = await readFile(target, "utf8");

const before = `function chooseSession(sessions, timezone, requestedId) {\n  const today = localDate(new Date(), timezone);\n  const requested = sessions.find((session) => session.id === requestedId);\n  if (requested && localDate(requested.startsAt, timezone) === today) return requested;\n  return sessions.find((session) => String(session.status || \"\").toLowerCase() !== \"cancelled\" && localDate(session.startsAt, timezone) === today)\n    || sessions.find((session) => String(session.status || \"\").toLowerCase() !== \"cancelled\" && (asDate(session.startsAt)?.getTime() || 0) >= Date.now())\n    || requested\n    || [...sessions].reverse().find((session) => String(session.status || \"\").toLowerCase() !== \"cancelled\")\n    || sessions[0]\n    || null;\n}`;

const after = `function chooseSession(sessions, timezone, requestedId) {\n  // A direct Live Classes -> Attendance link names the exact session the\n  // administrator wants to inspect. Keep that ID authoritative even when the\n  // repaired lesson is not today; otherwise the page silently switches to the\n  // current/next lesson and makes a successful timetable repair look stale.\n  const requested = sessions.find((session) => session.id === requestedId);\n  if (requested) return requested;\n\n  const today = localDate(new Date(), timezone);\n  return sessions.find((session) => String(session.status || \"\").toLowerCase() !== \"cancelled\" && localDate(session.startsAt, timezone) === today)\n    || sessions.find((session) => String(session.status || \"\").toLowerCase() !== \"cancelled\" && (asDate(session.startsAt)?.getTime() || 0) >= Date.now())\n    || [...sessions].reverse().find((session) => String(session.status || \"\").toLowerCase() !== \"cancelled\")\n    || sessions[0]\n    || null;\n}`;

if (!source.includes(after)) {
  if (!source.includes(before)) {
    throw new Error("Canonical Attendance requested-session selector changed; update patchCanonicalAttendanceRequestedSession.mjs");
  }
  source = source.replace(before, after);
  await writeFile(target, source);
  console.log("Canonical Attendance now keeps the explicitly requested session selected.");
}
