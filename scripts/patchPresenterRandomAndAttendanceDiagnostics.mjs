import fs from "node:fs";

const pickerPath = new URL("../src/components/PresenterStudentPicker.jsx", import.meta.url);
let pickerSource = fs.readFileSync(pickerPath, "utf8");

const leastTurnsBlock = [
  "    const minimumTurns = Math.min(...availableStudents.map((entry) => Number(stats[entry.key]?.turns || 0)));",
  "    const fairCandidates = availableStudents.filter((entry) => Number(stats[entry.key]?.turns || 0) === minimumTurns);",
  "    const picked = randomItem(fairCandidates);",
].join("\n");
const randomBlock = "    const picked = randomItem(availableStudents);";

if (pickerSource.includes(leastTurnsBlock)) {
  pickerSource = pickerSource.replace(leastTurnsBlock, randomBlock);
}
if (!pickerSource.includes(randomBlock)) {
  throw new Error("Presenter random-pick anchor missing.");
}

pickerSource = pickerSource.replace(
  "Fair pick on · least turns first",
  "Random pick · no repeats until everyone has been picked",
);

fs.writeFileSync(pickerPath, pickerSource, "utf8");

const panelPath = new URL("../src/components/AttendanceConfirmationAutomationPanel.jsx", import.meta.url);
let panelSource = fs.readFileSync(panelPath, "utf8");

const oldDiagnostics = `      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div><small>Last job check</small><div><strong>{formatDateTime(settings.lastRunAt)}</strong></div></div>
        <div><small>Last successful send</small><div><strong>{formatDateTime(settings.lastSentAt)}</strong></div></div>
        <div><small>Last recipient count</small><div><strong>{settings.lastSentCount || 0}</strong></div></div>
        <div><small>Last status</small><div><strong>{settings.lastStatus || "Not yet"}</strong></div></div>
      </div>`;

const newDiagnostics = `      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <div><small>Last job check</small><div><strong>{formatDateTime(settings.lastRunAt)}</strong></div></div>
        <div><small>Last successful send</small><div><strong>{formatDateTime(settings.lastSentAt)}</strong></div></div>
        <div><small>Last send count</small><div><strong>{settings.lastSentCount || 0}</strong></div></div>
        <div><small>Eligible recipients</small><div><strong>{settings.lastRecipientCount || 0}</strong></div></div>
        <div><small>Sessions found</small><div><strong>{settings.lastSessionCount || 0}</strong></div></div>
        <div><small>Due groups</small><div><strong>{settings.lastDueGroupCount || 0}</strong></div></div>
        <div><small>Last status</small><div><strong>{settings.lastStatus || "Not yet"}</strong></div></div>
      </div>

      {settings.lastStatus === "already_sent_or_not_due" ? (
        <div style={{ padding: 10, border: "1px solid #fde68a", background: "#fffbeb", color: "#92400e", borderRadius: 10 }}>
          The worker ran but sent 0 emails. This can mean the weekly summary is not due yet, the QR/check-in window is still open, or this period was already delivered. “Eligible recipients” above is the real roster count.
        </div>
      ) : null}`;

if (panelSource.includes(oldDiagnostics)) {
  panelSource = panelSource.replace(oldDiagnostics, newDiagnostics);
} else if (!panelSource.includes("Eligible recipients")) {
  throw new Error("Attendance automation diagnostics anchor missing.");
}

fs.writeFileSync(panelPath, panelSource, "utf8");

console.log("Presenter picking is truly random per round and attendance diagnostics show real recipient/session counts.");

await import("./patchA1Day2ContactChallenge.mjs");
