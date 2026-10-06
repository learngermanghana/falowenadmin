import fs from "node:fs";

const filePath = new URL("../src/pages/StudentHubPage.jsx", import.meta.url);
let source = fs.readFileSync(filePath, "utf8");
let changed = false;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) {
    if (source.includes(replacement)) return;
    throw new Error(`Could not patch StudentHubPage: ${label}`);
  }
  source = source.replace(search, replacement);
  changed = true;
}

if (!source.includes('StudentLeadsPanel from "../components/StudentLeadsPanel.jsx"')) {
  replaceOnce(
    'import StudentActivityPage from "./StudentActivityPage";\n',
    'import StudentActivityPage from "./StudentActivityPage";\nimport StudentLeadsPanel from "../components/StudentLeadsPanel.jsx";\n',
    "StudentLeadsPanel import",
  );
}

if (!source.includes('if (value === "leads") return "leads";')) {
  replaceOnce(
    'function normalizeTab(value) {\n  return value === "activity" ? "activity" : "students";\n}',
    'function normalizeTab(value) {\n  if (value === "activity") return "activity";\n  if (value === "leads") return "leads";\n  return "students";\n}',
    "Leads query-tab normalization",
  );
}

if (!source.includes('onClick={() => selectTab("leads")}')) {
  const activityAnchor = `          {!isStaff && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "activity"}`;
  const leadsButton = `          {!isStaff && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "leads"}
              onClick={() => selectTab("leads")}
              style={{
                ...TAB_STYLES.base,
                ...(activeTab === "leads" ? TAB_STYLES.active : TAB_STYLES.inactive),
              }}
            >
              Leads
            </button>
          )}
`;
  if (!source.includes(activityAnchor)) {
    throw new Error("Could not patch StudentHubPage: Leads tab button");
  }
  source = source.replace(activityAnchor, `${leadsButton}${activityAnchor}`);
  changed = true;
}

if (!source.includes('activeTab === "leads" ? (')) {
  replaceOnce(
    '      {!isStaff && activeTab === "activity" ? <StudentActivityPage /> : <StudentDirectoryPage />}',
    `      {!isStaff && activeTab === "leads" ? (
        <StudentLeadsPanel />
      ) : !isStaff && activeTab === "activity" ? (
        <StudentActivityPage />
      ) : (
        <StudentDirectoryPage />
      )}`,
    "Leads panel render",
  );
}

if (changed) {
  fs.writeFileSync(filePath, source);
  console.log("Student Leads tab patched into Student Hub.");
} else {
  console.log("Student Leads tab already installed in Student Hub.");
}
