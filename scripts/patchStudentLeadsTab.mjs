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

if (!source.includes('setActiveTab("leads")')) {
  replaceOnce(
    `          <button\n            type="button"\n            onClick={() => setActiveTab("add")}\n            style={{\n              border: activeTab === "add" ? "1px solid #2563eb" : "1px solid #d1d5db",\n              background: activeTab === "add" ? "#eff6ff" : "#fff",\n              color: "#1a2233",\n            }}\n          >\n            Add Student\n          </button>`,
    `          <button\n            type="button"\n            onClick={() => setActiveTab("add")}\n            style={{\n              border: activeTab === "add" ? "1px solid #2563eb" : "1px solid #d1d5db",\n              background: activeTab === "add" ? "#eff6ff" : "#fff",\n              color: "#1a2233",\n            }}\n          >\n            Add Student\n          </button>\n          <button\n            type="button"\n            onClick={() => setActiveTab("leads")}\n            style={{\n              border: activeTab === "leads" ? "1px solid #2563eb" : "1px solid #d1d5db",\n              background: activeTab === "leads" ? "#eff6ff" : "#fff",\n              color: "#1a2233",\n            }}\n          >\n            Student Leads\n          </button>`,
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
