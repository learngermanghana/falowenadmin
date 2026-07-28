import fs from "node:fs";

const target = new URL("../functions/index.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const moduleImport = 'const { registerStudentProfileUpdateRoute } = require("./studentProfileUpdate.js");';
if (!source.includes(moduleImport)) {
  const importAnchor = 'const { isStudentOnPublishedRoster } = require("./publishedRosterMembership.js");';
  if (!source.includes(importAnchor)) {
    throw new Error("Student profile update import anchor changed");
  }
  source = source.replace(importAnchor, `${importAnchor}\n${moduleImport}`);
}

const legacyRegistration = "registerStudentProfileUpdateRoute({ app, db, admin, requireAuth });";
const registration = "registerStudentProfileUpdateRoute({ app, db, admin, requireAuth, staffEmails: teacherAllowlist });";
if (source.includes(legacyRegistration)) {
  source = source.replace(legacyRegistration, registration);
}
if (!source.includes(registration)) {
  const registrationAnchor = `  return decoded;\n}\n\nfunction sessionDocRef(classId, sessionId) {`;
  if (!source.includes(registrationAnchor)) {
    throw new Error("Student profile update registration anchor changed");
  }
  source = source.replace(
    registrationAnchor,
    `  return decoded;\n}\n\n${registration}\n\nfunction sessionDocRef(classId, sessionId) {`,
  );
}

fs.writeFileSync(target, source);
console.log("Authenticated staff-only student profile update API is registered.");
