import fs from "node:fs";

const studentHubPath = new URL("../src/pages/StudentHubPage.jsx", import.meta.url);
const leadsPagePath = new URL("../src/pages/LeadsPage.jsx", import.meta.url);

const studentHub = fs.readFileSync(studentHubPath, "utf8");
const leadsPage = fs.readFileSync(leadsPagePath, "utf8");

if (studentHub.includes("StudentLeadsPanel") || studentHub.includes("StudentActivityPage")) {
  throw new Error("Students hub must not restore Leads or Student Activity tabs.");
}

if (!leadsPage.includes("StudentLeadsPanel")) {
  throw new Error("Dedicated Leads page must render StudentLeadsPanel.");
}

console.log("Students/Leads navigation already uses the dedicated Leads page.");
