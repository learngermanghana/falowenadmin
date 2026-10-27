import fs from "node:fs";

const filePath = new URL("../src/components/LiveClassStudentsPanel.jsx", import.meta.url);
let source = fs.readFileSync(filePath, "utf8");
let changed = false;

if (!source.includes("const EMPTY_LIVE_CLASS_SESSIONS")) {
  const importAnchor = 'import { loadClassAttendanceAnalytics } from "../services/attendanceAnalyticsService.js";\n';
  if (!source.includes(importAnchor)) {
    throw new Error("Could not find LiveClassStudentsPanel import anchor");
  }
  source = source.replace(
    importAnchor,
    `${importAnchor}\nconst EMPTY_LIVE_CLASS_SESSIONS = Object.freeze([]);\n`,
  );
  changed = true;
}

if (source.includes("  sessions = [],")) {
  source = source.replace(
    "  sessions = [],",
    "  sessions = EMPTY_LIVE_CLASS_SESSIONS,",
  );
  changed = true;
}

if (!source.includes("sessions = EMPTY_LIVE_CLASS_SESSIONS")) {
  throw new Error("LiveClassStudentsPanel stable sessions fallback was not installed");
}

if (changed) {
  fs.writeFileSync(filePath, source);
  console.log("Live Classes student loading loop fixed.");
} else {
  console.log("Live Classes student loading loop already fixed.");
}
