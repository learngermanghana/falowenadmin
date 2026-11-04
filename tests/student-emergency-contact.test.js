import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  getStudentEmergencyContact, resolveEmergencyContactPhone,
  resolveEmergencyContactName, callEmergencyContactUrl,
  emergencyContactEditorValues, emergencyContactEditedFields,
} from "../src/utils/studentEmergencyContact.js";
import { matchesStudentDirectorySearch } from "../src/utils/studentDirectorySearch.js";

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

test("formatted emergency phones match digits-only staff searches", () => {
  const student = {
    name: "Akua Student",
    email: "akua@example.com",
    "Emergency Contact Phone Number": "+233 24 123 4567",
    "Emergency Contact Name": "Mary Sample",
    className: "A2 Berlin",
  };
  assert.equal(matchesStudentDirectorySearch(student, "233241234567", "055 777 8888"), true);
  assert.equal(matchesStudentDirectorySearch(student, "+233 (24) 123-4567", "055 777 8888"), true);
  assert.equal(matchesStudentDirectorySearch(student, "241234567", "055 777 8888"), true);
  assert.equal(matchesStudentDirectorySearch(student, "0557778888", "055 777 8888"), true);
  assert.equal(matchesStudentDirectorySearch(student, "Mary Sample", "055 777 8888"), true);
  assert.equal(matchesStudentDirectorySearch(student, "A2 Berlin", "055 777 8888"), true);
  assert.equal(matchesStudentDirectorySearch(student, "different person", "055 777 8888"), false);
  assert.equal(matchesStudentDirectorySearch(student, "123400000", "055 777 8888"), false);
});

test("phone normalization does not turn names or tiny numeric terms into broad matches", () => {
  const student = { name: "Pat Student", emergencyContactPhone: "+233 24 123 4567" };
  assert.equal(matchesStudentDirectorySearch(student, "3", "055 777 8888"), false);
  assert.equal(matchesStudentDirectorySearch(student, "233 abc", "055 777 8888"), false);
  assert.equal(matchesStudentDirectorySearch(student, "", "055 777 8888"), true);
});

test("staff-only Student Profile renders emergency contacts without another data fetch", () => {
  const page = fs.readFileSync("src/pages/StudentDirectoryPage.jsx", "utf8");
  const card = fs.readFileSync("src/components/StudentEmergencyContact.jsx", "utf8");
  const css = fs.readFileSync("src/pages/StudentDirectoryPage.css", "utf8");
  const patch = fs.readFileSync("scripts/patchStudentProfileUpdateApi.mjs", "utf8");
  assert.match(page, /STUDENT_EMERGENCY_CONTACT_FIELD/);
  assert.match(page, /\{tab\.id === "profile" && <StudentEmergencyContact student=\{selectedStudent\} \/>\}/);
  assert.match(page, /matchesStudentDirectorySearch\(student, query, resolveStudentPhone\(student\)\)/);
  assert.match(card, /Emergency contact/);
  assert.match(card, /href=\{callHref\}/);
  assert.match(card, /source === "guardian" \|\| source === "nextOfKin"/);
  assert.match(css, /\.student-emergency-contact-details/);
  assert.match(patch, /if \(!directorySource\.includes\(emergencyMarker\)\)/);
  assert.doesNotMatch(card, /fetch\(|getDocs\(|setDoc\(|updateDoc\(/);
});

test("nested legacy emergency contacts are prefilled and replacement edits control summary and Call", () => {
  for (const key of ["emergencyContact", "emergency_contact"]) {
    const old = { [key]: { name: "Old Person", phone: "0241111111", relationship: "Parent" } };
    assert.deepEqual(emergencyContactEditorValues(old), {
      emergencyContactName: "Old Person",
      emergencyContactPhoneNumber: "0241111111",
      emergencyContactRelationship: "Parent",
    });
    const updated = { ...emergencyContactEditorValues(old), emergencyContactName: "New Person", emergencyContactPhoneNumber: "0552223333", emergencyContactRelationship: "Sister" };
    const patch = emergencyContactEditedFields(old, updated);
    assert.deepEqual(patch, updated, "saving any contact edit writes the complete contact");
    const saved = { ...old, ...patch };
    assert.deepEqual(getStudentEmergencyContact(saved), {
      name: "New Person", phone: "0552223333", relationship: "Sister", source: "emergency",
    });
    assert.equal(resolveEmergencyContactName(saved), "New Person");
    assert.equal(callEmergencyContactUrl(resolveEmergencyContactPhone(saved)), "tel:0552223333");
    assert.equal(emergencyContactEditedFields(saved, emergencyContactEditorValues(saved)).emergencyContactPhoneNumber, undefined);
  }
});

test("clearing a saved emergency number never revives stale nested numbers or guardian fallback", () => {
  const old = {
    emergencyContact: { name: "Old Contact", phone: "0241234567", relationship: "Brother" },
    guardianName: "Legacy Guardian", guardianPhone: "0278889999",
  };
  const clearedPhone = { ...emergencyContactEditorValues(old), emergencyContactPhoneNumber: "" };
  const patch = emergencyContactEditedFields(old, clearedPhone);
  const updated = { ...old, ...patch };
  assert.deepEqual(getStudentEmergencyContact(updated), {
    name: "Old Contact", phone: "", relationship: "Brother", source: "emergency",
  });
  assert.equal(callEmergencyContactUrl(resolveEmergencyContactPhone(updated)), "");
  const clearedAll = {
    emergencyContactName: "", emergencyContactPhoneNumber: "", emergencyContactRelationship: "",
  };
  assert.deepEqual(getStudentEmergencyContact({ ...old, ...clearedAll }), {
    name: "", phone: "", relationship: "", source: "missing",
  });
});

test("canonical top-level records stay coherent without mixing stale nested contact details", () => {
  const mixed = {
    emergency_contact: { name: "Old Person", phone: "0241111111", relationship: "Mother" },
    emergencyContactName: "New Person",
  };
  assert.deepEqual(getStudentEmergencyContact(mixed), {
    name: "New Person", phone: "", relationship: "", source: "emergency",
  });
  assert.equal(resolveEmergencyContactPhone(mixed), "");
  assert.deepEqual(emergencyContactEditorValues({ guardianName: "Guardian", guardianPhone: "0551112222" }), {
    emergencyContactName: "", emergencyContactPhoneNumber: "", emergencyContactRelationship: "",
  });
});

test("the Admin editor normalizes legacy values before save and activation dirty checks", () => {
  const directory = fs.readFileSync("src/pages/StudentDirectoryPage.jsx", "utf8");
  const activation = fs.readFileSync("src/components/StudentAccountActivationPanel.jsx", "utf8");
  assert.match(directory, /emergencyContactEditorValues\(student\)/);
  assert.match(directory, /Object.assign\(payload, emergencyContactEditedFields\(student, draft\)\)/);
  assert.match(activation, /emergencyContactEditedFields\(student, draft\)/);
});
