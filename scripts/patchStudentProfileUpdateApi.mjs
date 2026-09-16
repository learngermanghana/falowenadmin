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

const directoryPath = new URL("../src/pages/StudentDirectoryPage.jsx", import.meta.url);
let directorySource = fs.readFileSync(directoryPath, "utf8");
const emergencyMarker = "STUDENT_EMERGENCY_CONTACT_FIELD";

if (!directorySource.includes(emergencyMarker)) {
  const helperAnchor = `function resolveStudentPhone(student, draft = {}) {\n  return displayValue(draft.phone, student?.phone, student?.whatsapp, student?.phoneNumber, student?.guardianPhone);\n}\n`;
  if (!directorySource.includes(helperAnchor)) {
    throw new Error("Student directory phone helper anchor changed");
  }

  const emergencyHelpers = `\n// STUDENT_EMERGENCY_CONTACT_FIELD: student records from different import eras use\n// several field names for the same emergency contact value. Keep the admin view\n// tolerant so the contact is visible without requiring a data migration first.\nfunction resolveEmergencyContactPhone(student = {}) {\n  return displayValue(\n    student?.emergencyContactPhoneNumber,\n    student?.emergencyContactPhone,\n    student?.emergencyPhone,\n    student?.emergency_contact_phone_number,\n    student?.[\"emergency contact phone number\"],\n    student?.[\"Emergency contact phone number\"],\n    student?.[\"Emergency Contact Phone Number\"],\n    student?.guardianPhone,\n    student?.nextOfKinPhone,\n  );\n}\n\nfunction resolveEmergencyContactName(student = {}) {\n  return displayValue(\n    student?.emergencyContactName,\n    student?.emergency_contact_name,\n    student?.[\"emergency contact name\"],\n    student?.[\"Emergency Contact Name\"],\n    student?.guardianName,\n    student?.nextOfKinName,\n  );\n}\n\nfunction resolveEmergencyContactRelationship(student = {}) {\n  return displayValue(\n    student?.emergencyContactRelationship,\n    student?.emergency_contact_relationship,\n    student?.[\"emergency contact relationship\"],\n    student?.[\"Emergency Contact Relationship\"],\n    student?.guardianRelationship,\n    student?.nextOfKinRelationship,\n  );\n}\n`;
  directorySource = directorySource.replace(helperAnchor, `${helperAnchor}${emergencyHelpers}`);

  const searchAnchor = `        resolveStudentPhone(student),\n        student.level,`;
  if (!directorySource.includes(searchAnchor)) {
    throw new Error("Student directory search anchor changed");
  }
  directorySource = directorySource.replace(
    searchAnchor,
    `        resolveStudentPhone(student),\n        resolveEmergencyContactPhone(student),\n        resolveEmergencyContactName(student),\n        student.level,`,
  );

  const gridCloseAnchor = `                          })}\n                        </div>\n\n                        <div style={{ marginTop: 14 }}>`;
  if (!directorySource.includes(gridCloseAnchor)) {
    throw new Error("Student profile field-grid anchor changed");
  }

  const emergencyField = `                          })}\n\n                          {(() => {\n                            const emergencyPhone = resolveEmergencyContactPhone(selectedStudent);\n                            const emergencyName = resolveEmergencyContactName(selectedStudent);\n                            const emergencyRelationship = resolveEmergencyContactRelationship(selectedStudent);\n                            const emergencyCallUrl = callUrl(emergencyPhone);\n                            const emergencyMeta = [emergencyName, emergencyRelationship].filter(Boolean).join(\" · \");\n\n                            return (\n                              <div style={{ display: \"grid\", gap: 6 }}>\n                                <span style={{ fontSize: 13, fontWeight: 600 }}>Emergency contact</span>\n                                <div style={{ display: \"flex\", gap: 8, alignItems: \"stretch\" }}>\n                                  <input\n                                    type=\"text\"\n                                    value={emergencyPhone}\n                                    readOnly\n                                    placeholder=\"Not provided\"\n                                    aria-label=\"Emergency contact phone number\"\n                                    style={{\n                                      width: \"100%\",\n                                      minWidth: 0,\n                                      padding: \"8px 9px\",\n                                      borderRadius: 6,\n                                      border: \"1px solid #ccd4e2\",\n                                      background: \"#f8fafc\",\n                                    }}\n                                  />\n                                  {emergencyCallUrl && (\n                                    <a\n                                      href={emergencyCallUrl}\n                                      aria-label={\`Call emergency contact at \${emergencyPhone}\`}\n                                      title={\`Call \${emergencyPhone}\`}\n                                      style={{\n                                        display: \"inline-flex\",\n                                        alignItems: \"center\",\n                                        justifyContent: \"center\",\n                                        padding: \"8px 12px\",\n                                        border: \"1px solid #15803d\",\n                                        borderRadius: 6,\n                                        background: \"#16a34a\",\n                                        color: \"#fff\",\n                                        fontWeight: 700,\n                                        textDecoration: \"none\",\n                                        whiteSpace: \"nowrap\",\n                                      }}\n                                    >\n                                      Call\n                                    </a>\n                                  )}\n                                </div>\n                                {emergencyMeta && <small style={{ color: \"#64748b\" }}>{emergencyMeta}</small>}\n                              </div>\n                            );\n                          })()}\n                        </div>\n\n                        <div style={{ marginTop: 14 }}>`;

  directorySource = directorySource.replace(gridCloseAnchor, emergencyField);
  fs.writeFileSync(directoryPath, directorySource);
}

const finalDirectory = fs.readFileSync(directoryPath, "utf8");
if (!finalDirectory.includes(emergencyMarker)) {
  throw new Error("Student emergency contact field patch did not apply");
}
if (!finalDirectory.includes("Emergency contact") || !finalDirectory.includes("resolveEmergencyContactPhone")) {
  throw new Error("Student emergency contact display is incomplete");
}

console.log("Authenticated staff-only student profile update API is registered; emergency contact is visible on student profiles.");
