import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkin = fs.readFileSync(path.join(root, "src/pages/CheckinPage.jsx"), "utf8");
const attendance = fs.readFileSync(path.join(root, "src/pages/CanonicalAttendancePageV3.jsx"), "utf8");

const requireText = (source, text, label) => {
  if (!source.includes(text)) throw new Error(`Missing ${label}`);
};
const rejectText = (source, text, label) => {
  if (source.includes(text)) throw new Error(`Unexpected ${label}`);
};

requireText(checkin, 'url.searchParams.delete("expectedStudents")', "legacy roster stripping");
requireText(checkin, "const selfCheckinQr = useMemo(", "memoized QR element");
requireText(checkin, "{selfCheckinQr}", "stable QR render");
rejectText(checkin, '<QRCodeCanvas value={selfCheckinUrl} size={130} includeMargin />\n          </div>', "live QR regeneration");
requireText(attendance, "expectedCount: String(rows.length)", "expected count in generated URL");
rejectText(attendance, "expectedStudents: expectedNames.join", "student-name roster in generated URL");

console.log("Check-in URL fix contract passed.");
