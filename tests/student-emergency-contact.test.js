import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  getStudentEmergencyContact, resolveEmergencyContactPhone,
  resolveEmergencyContactName, callEmergencyContactUrl,
} from "../src/utils/studentEmergencyContact.js";

test("reads emergency phone, name and relationship from mixed Firestore/import field names", () => {
  const row = {
    "Emergency Contact Phone Number": "+233 24 123 4567",
    "Emergency Contact Name": "Akua Sample",
    "Emergency Contact Relationship": "Sister",
    phone: "+233 55 987 6543",
  };
  assert.deepEqual(getStudentEmergencyContact(row), {
    phone: "+233 24 123 4567", name: "Akua Sample", relationship: "Sister", source: "emergency",
  });
  assert.equal(resolveEmergencyContactPhone(row), "+233 24 123 4567");
  assert.equal(resolveEmergencyContactName(row), "Akua Sample");
  assert.equal(callEmergencyContactUrl(resolveEmergencyContactPhone(row)), "tel:+233241234567");
});

test("reads camelCase, snake_case, and nested emergency contact fields", () => {
  const variants = [
    { emergencyContactPhoneNumber: "0241111111", emergencyContactName: "Ama" },
    { emergency_contact_phone_number: "0241111111", emergency_contact_name: "Ama" },
    { emergencyContact: { name: "Ama", phoneNumber: "0241111111", relationship: "Mother" } },
    { emergency_contact: { name: "Ama", phone: "0241111111" } },
  ];
  for (const entry of variants) {
    const contact = getStudentEmergencyContact(entry);
    assert.equal(contact.phone, "0241111111");
    assert.equal(contact.name, "Ama");
    assert.equal(contact.source, "emergency");
  }
  assert.equal(getStudentEmergencyContact(variants[2]).relationship, "Mother");
});

test("only a clearly designated emergency contact is labelled emergency", () => {
  assert.deepEqual(getStudentEmergencyContact({ guardianName: "Mary", guardianPhone: "0249999999" }), {
    phone: "0249999999", name: "Mary", relationship: "", source: "guardian",
  });
  assert.deepEqual(getStudentEmergencyContact({ nextOfKinName: "Yaw", nextOfKinPhone: "0248888888" }), {
    phone: "0248888888", name: "Yaw", relationship: "", source: "nextOfKin",
  });
  const distinctContacts = getStudentEmergencyContact({
    guardianName: "Mary",
    nextOfKinName: "Yaw",
    nextOfKinPhone: "0248888888",
  });
  assert.deepEqual(distinctContacts, {
    phone: "0248888888", name: "Yaw", relationship: "", source: "nextOfKin",
  });
});

test("never relabels the student's own phone number as an emergency contact", () => {
  assert.deepEqual(getStudentEmergencyContact({ name: "Student", phone: "0247777777" }), {
    phone: "", name: "", relationship: "", source: "missing",
  });
  assert.equal(getStudentEmergencyContact({ emergencyContactPhone: "Not provided" }).source, "missing");
  assert.equal(callEmergencyContactUrl("Not provided"), "");
  assert.equal(callEmergencyContactUrl("12"), "");
  assert.equal(callEmergencyContactUrl("0302-000-000"), "tel:0302000000");
});

test("staff-only Student Profile renders emergency contacts without another data fetch", () => {
  const page = fs.readFileSync("src/pages/StudentDirectoryPage.jsx", "utf8");
  const card = fs.readFileSync("src/components/StudentEmergencyContact.jsx", "utf8");
  const css = fs.readFileSync("src/pages/StudentDirectoryPage.css", "utf8");
  const patch = fs.readFileSync("scripts/patchStudentProfileUpdateApi.mjs", "utf8");
  assert.match(page, /STUDENT_EMERGENCY_CONTACT_FIELD/);
  assert.match(page, /\{tab\.id === "profile" && <StudentEmergencyContact student=\{selectedStudent\} \/>\}/);
  assert.match(page, /resolveEmergencyContactPhone\(student\)/);
  assert.match(page, /resolveEmergencyContactName\(student\)/);
  assert.match(card, /Emergency contact/);
  assert.match(card, /href=\{callHref\}/);
  assert.match(card, /source === "guardian" \|\| source === "nextOfKin"/);
  assert.match(css, /\.student-emergency-contact-details/);
  assert.match(patch, /if \(!directorySource\.includes\(emergencyMarker\)\)/);
  assert.doesNotMatch(card, /fetch\(|getDocs\(|setDoc\(|updateDoc\(/);
});
