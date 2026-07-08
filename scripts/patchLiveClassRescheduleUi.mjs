import fs from "node:fs";

const filePath = new URL("../src/pages/LiveClassesPageV2.jsx", import.meta.url);
let source = fs.readFileSync(filePath, "utf8");
let changed = false;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) {
    if (!source.includes(replacement)) {
      throw new Error(`Could not patch LiveClassesPageV2: ${label}`);
    }
    return;
  }
  source = source.replace(search, replacement);
  changed = true;
}

if (!source.includes('label: "Wrong date"')) {
  replaceOnce(
    'const SESSION_CHANGE_REASONS = [\n  { label: "Raining / light out", value: "Class cannot hold because it is raining and the lights are out." },',
    'const SESSION_CHANGE_REASONS = [\n  { label: "Wrong date", value: "This class had the wrong date in the timetable, so the class date has been corrected." },\n  { label: "Raining / light out", value: "Class cannot hold because it is raining and the lights are out." },',
    "wrong-date template",
  );
}

if (!source.includes("classId: session.classId || dashboard?.klass?.id || selectedClassId,")) {
  replaceOnce(
    '      sessionId: session.id,\n      action: "reschedule",',
    '      sessionId: session.id,\n      classId: session.classId || dashboard?.klass?.id || selectedClassId,\n      className: dashboard?.klass?.name || session.className || "",\n      action: "reschedule",',
    "selected class fallback",
  );
}

if (!source.includes("const rescheduleResult = await rescheduleSession")) {
  replaceOnce(
    `        await rescheduleSession(sessionChange.sessionId, {\n          startsAt: new Date(sessionChange.startsAt).toISOString(),\n          endsAt: new Date(endsAt).toISOString(),\n          reason: sessionChange.reason,\n          adminId,\n        });\n        setMessage("Session rescheduled and the attendance session was updated automatically.");`,
    `        const rescheduleResult = await rescheduleSession(sessionChange.sessionId, {\n          startsAt: new Date(sessionChange.startsAt).toISOString(),\n          endsAt: new Date(endsAt).toISOString(),\n          reason: sessionChange.reason,\n          adminId,\n          classId: sessionChange.classId || dashboard?.klass?.id || selectedClassId,\n          className: sessionChange.className || dashboard?.klass?.name || "",\n          timezone: dashboard?.klass?.timezone || "Africa/Accra",\n          durationMinutes: sessionChange.durationMinutes,\n        });\n        const emailNote = rescheduleResult?.emailSubmitted === false ? \` Communication email could not be confirmed: \${rescheduleResult.emailMessage || "check Communication"}\` : "";\n        setMessage(\`Session rescheduled successfully to \${formatDateTime(rescheduleResult?.startsAt || sessionChange.startsAt)}. Attendance was updated automatically.\${emailNote}\`);`,
    "reschedule payload and success message",
  );
}

if (!source.includes('background: message.toLowerCase().includes("success") ? "#f0fdf4" : "#eff6ff"')) {
  replaceOnce(
    '{message ? <div style={{ marginBottom: 14, padding: 12, borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe" }}>{message}</div> : null}',
    '{message ? <div style={{ marginBottom: 14, padding: 12, borderRadius: 8, background: message.toLowerCase().includes("success") ? "#f0fdf4" : "#eff6ff", border: message.toLowerCase().includes("success") ? "1px solid #bbf7d0" : "1px solid #bfdbfe" }}>{message}</div> : null}',
    "success message style",
  );
}

if (changed) {
  fs.writeFileSync(filePath, source);
  console.log("Live Classes V2 reschedule UI patched.");
} else {
  console.log("Live Classes V2 reschedule UI already patched.");
}
