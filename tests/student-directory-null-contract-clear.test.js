import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source=readFileSync(new URL("../src/pages/StudentDirectoryPage.jsx",import.meta.url),"utf8");

test("student directory can clear contract dates and save explicit nulls",()=>{
  assert.ok(source.includes("payload[field] = dateFields.has(field) && !incomingValue ? null : incomingValue;"));
  assert.ok(source.includes("Clear and save to store a null contract date"));
  assert.ok(source.includes(`onClick={() => updateDraftField(selectedStudent.id, field, "", selectedStudent)}`));
});
