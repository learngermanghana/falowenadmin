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

const registration = "registerStudentProfileUpdateRoute({ app, db, admin, requireAuth });";
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
console.log("Authenticated student profile update API is registered.");
