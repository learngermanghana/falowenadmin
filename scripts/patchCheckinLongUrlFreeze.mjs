import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkinPath = path.join(root, "src/pages/CheckinPage.jsx");
const attendancePath = path.join(root, "src/pages/CanonicalAttendancePageV3.jsx");

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`Check-in long URL patch anchor missing: ${label}`);
  return source.replace(before, after);
}

function patchCheckinPage() {
  let source = fs.readFileSync(checkinPath, "utf8");

  source = replaceOnce(
    source,
    `function parseExpectedNames(raw) {
  return String(raw || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 15);
}`,
    `function parseExpectedNames(raw) {
  return String(raw || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 15);
}

export function buildLightweightCheckinShareUrl(rawHref = "") {
  const href = String(rawHref || "").trim();
  if (!href) return "";
  try {
    const url = new URL(href, window.location.origin);
    // Student names are presentation-only metadata. Keeping the roster in every
    // QR payload makes the code unnecessarily large and expensive to regenerate.
    url.searchParams.delete("expectedStudents");
    return url.toString();
  } catch {
    return href;
  }
}`,
    "lightweight share URL helper",
  );

  source = replaceOnce(
    source,
    `  const selfCheckinUrl = useMemo(() => window.location.href, []);`,
    `  const selfCheckinUrl = useMemo(
    () => buildLightweightCheckinShareUrl(window.location.href),
    [],
  );
  const selfCheckinQr = useMemo(
    () => <QRCodeCanvas value={selfCheckinUrl} size={130} includeMargin />,
    [selfCheckinUrl],
  );`,
    "stable QR memo",
  );

  source = replaceOnce(
    source,
    `            <QRCodeCanvas value={selfCheckinUrl} size={130} includeMargin />`,
    `            {selfCheckinQr}`,
    "stable QR render",
  );

  fs.writeFileSync(checkinPath, source, "utf8");
}

function patchAttendancePage() {
  let source = fs.readFileSync(attendancePath, "utf8");

  source = replaceOnce(
    source,
    `  const expectedNames = useMemo(() => rows
    .map((row) => String(row.name || "").trim())
    .filter(Boolean)
    .slice(0, 15), [rows]);

`,
    ``,
    "remove roster names from share payload preparation",
  );

  source = replaceOnce(
    source,
    `    expectedStudents: expectedNames.join(", "),
    expectedCount: String(rows.length),
  }).toString(), [assignmentId, endTime, expectedNames, klass?.id, rows.length, selected?.id, selectedDate, sessionLabel, startTime]);`,
    `    expectedCount: String(rows.length),
  }).toString(), [assignmentId, endTime, klass?.id, rows.length, selected?.id, selectedDate, sessionLabel, startTime]);`,
    "remove roster names from generated check-in URLs",
  );

  fs.writeFileSync(attendancePath, source, "utf8");
}

patchCheckinPage();
patchAttendancePage();
console.log("Applied lightweight stable check-in URL patch.");
