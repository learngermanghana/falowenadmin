import fs from "node:fs";

const filePath = new URL("../src/pages/CanonicalAttendancePageV3.jsx", import.meta.url);
let source = fs.readFileSync(filePath, "utf8");
let changed = false;

const importAnchor = 'import { buildManualDateOverridePatch } from "../utils/attendanceSessionOverride.js";\n';
const importLine = 'import AttendanceBccEmailPanel from "../components/AttendanceBccEmailPanel.jsx";\n';

if (!source.includes(importLine)) {
  const actualImportAnchor = source.includes(importAnchor)
    ? importAnchor
    : 'import LiveClassSessionEditor from "../components/LiveClassSessionEditor.jsx";\n';
  if (!source.includes(actualImportAnchor)) throw new Error("Could not find attendance import anchor");
  source = source.replace(actualImportAnchor, `${actualImportAnchor}${importLine}`);
  changed = true;
}

const studentsCardAnchor = `        <article className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><h2 style={{ margin: 0 }}>Students</h2>`;

const panelMarkup = `        <AttendanceBccEmailPanel
          rows={rows}
          klass={klass}
          session={selected}
          selectedDate={selectedDate}
          startTime={startTime}
          endTime={endTime}
          sessionLabel={sessionLabel}
        />

`;

if (!source.includes("<AttendanceBccEmailPanel")) {
  const modernCardAnchor = '        <article className="card session-attendance__card">\n          <div className="session-attendance__header"><h2>Students</h2>';
  const modernPanelMarkup = panelMarkup
    .replace('        <AttendanceBccEmailPanel', '        {!isStaff && <AttendanceBccEmailPanel')
    .replace('        />', '        />}');
  if (source.includes(studentsCardAnchor)) {
    source = source.replace(studentsCardAnchor, `${panelMarkup}${studentsCardAnchor}`);
  } else if (source.includes(modernCardAnchor)) {
    source = source.replace(modernCardAnchor, `${modernPanelMarkup}${modernCardAnchor}`);
  } else {
    throw new Error("Could not find Students card anchor in attendance page");
  }
  changed = true;
}

if (!source.includes(importLine) || !source.includes("<AttendanceBccEmailPanel")) {
  throw new Error("Attendance BCC email templates were not installed");
}

if (changed) {
  fs.writeFileSync(filePath, source);
  console.log("Attendance BCC email backup templates installed.");
} else {
  console.log("Attendance BCC email backup templates already installed.");
}
