import test from "node:test";
import assert from "node:assert/strict";
import {
  csvToObjects,
  dedupeStudentLeads,
  normalizeStudentLeadRows,
  publishedSheetToCsvUrl,
} from "../src/services/studentLeadService.js";

test("published sheet URL is converted to CSV endpoint", () => {
  assert.equal(
    publishedSheetToCsvUrl("https://docs.google.com/spreadsheets/d/e/abc123/pubhtml"),
    "https://docs.google.com/spreadsheets/d/e/abc123/pub?output=csv",
  );
});

test("CSV parser keeps quoted commas and maps lead headers", () => {
  const rows = csvToObjects('name,email,phone,level\n"Asadu, Felix",felix@example.com,0244000000,A1');
  assert.deepEqual(rows, [{ name: "Asadu, Felix", email: "felix@example.com", phone: "0244000000", level: "A1" }]);
});

test("student leads only expose name email number and level", () => {
  const result = normalizeStudentLeadRows([
    { name: "Ama Boat", email: "ama@example.com", phone: "0241111111", level: "a2", class_name: "Hidden class" },
  ]);

  assert.deepEqual(result.leads, [{
    id: "ama@example.com",
    name: "Ama Boat",
    email: "ama@example.com",
    number: "0241111111",
    level: "A2",
  }]);
});

test("duplicate leads are hidden by email first, then phone, then name and level", () => {
  const result = dedupeStudentLeads([
    { name: "Ama", email: "AMA@EXAMPLE.COM", number: "0241111111", level: "A1" },
    { name: "Ama Other", email: "ama@example.com", number: "0242222222", level: "A2" },
    { name: "Kojo", email: "", number: "0243333333", level: "B1" },
    { name: "Kojo Alt", email: "", number: "+233243333333", level: "B1" },
    { name: "No Contact", email: "", number: "", level: "C1" },
    { name: " no   contact ", email: "", number: "", level: "c1" },
  ]);

  assert.equal(result.duplicateCount, 3);
  assert.equal(result.leads.length, 3);
  assert.deepEqual(result.leads.map((lead) => lead.name), ["Ama", "Kojo", "No Contact"]);
});
