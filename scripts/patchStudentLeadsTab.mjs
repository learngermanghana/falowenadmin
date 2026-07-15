import fs from "node:fs";

const filePath = new URL("../src/pages/StudentDirectoryPage.jsx", import.meta.url);
let source = fs.readFileSync(filePath, "utf8");
let changed = false;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) {
    if (source.includes(replacement)) return;
    throw new Error(`Could not patch StudentDirectoryPage: ${label}`);
  }
  source = source.replace(search, replacement);
  changed = true;
}

if (!source.includes('StudentLeadsPanel from "../components/StudentLeadsPanel.jsx"')) {
  replaceOnce(
    'import StudentSupportTools from "../components/StudentSupportTools";\n',
    'import StudentSupportTools from "../components/StudentSupportTools";\nimport StudentLeadsPanel from "../components/StudentLeadsPanel.jsx";\n',
    "StudentLeadsPanel import",
  );
}

if (!source.includes('new URLSearchParams(window.location.search).get("tab") === "leads"')) {
  replaceOnce(
    '  const [activeTab, setActiveTab] = useState("directory");',
    '  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(window.location.search).get("tab") === "leads" ? "leads" : "directory");',
    "Student Leads query tab",
  );
}

if (!source.includes('setActiveTab("leads")')) {
  replaceOnce(
    `          <button
            type="button"
            onClick={() => setActiveTab("add")}
            style={{
              border: activeTab === "add" ? "1px solid #2563eb" : "1px solid #d1d5db",
              background: activeTab === "add" ? "#eff6ff" : "#fff",
              color: "#1a2233",
            }}
          >
            Add Student
          </button>`,
    `          <button
            type="button"
            onClick={() => setActiveTab("add")}
            style={{
              border: activeTab === "add" ? "1px solid #2563eb" : "1px solid #d1d5db",
              background: activeTab === "add" ? "#eff6ff" : "#fff",
              color: "#1a2233",
            }}
          >
            Add Student
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("leads")}
            style={{
              border: activeTab === "leads" ? "1px solid #2563eb" : "1px solid #d1d5db",
              background: activeTab === "leads" ? "#eff6ff" : "#fff",
              color: "#1a2233",
            }}
          >
            Student Leads
          </button>`,
    "Student Leads tab button",
  );
}

if (!source.includes('activeTab === "leads" && <StudentLeadsPanel />')) {
  replaceOnce(
    '        {activeTab === "add" && (',
    '        {activeTab === "leads" && <StudentLeadsPanel />}\n\n        {activeTab === "add" && (',
    "Student Leads panel render",
  );
}

if (changed) {
  fs.writeFileSync(filePath, source);
  console.log("Student Leads tab patched into Student Directory.");
} else {
  console.log("Student Leads tab already installed.");
}
