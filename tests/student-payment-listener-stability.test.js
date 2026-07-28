import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "src/components/StudentPaymentTools.jsx"), "utf8");

test("selected-student listener does not restart when the parent callback identity changes", () => {
  assert.match(source, /import \{ useEffect, useMemo, useRef, useState \} from "react";/);
  assert.match(source, /const onStudentUpdatedRef = useRef\(onStudentUpdated\);/);
  assert.match(source, /onStudentUpdatedRef\.current = onStudentUpdated;/);
  assert.match(source, /const notifyStudentUpdated = onStudentUpdatedRef\.current;/);
  assert.match(source, /if \(typeof notifyStudentUpdated === "function"\) notifyStudentUpdated\(studentId, nextStudent\);/);

  const listenerEffect = source.match(/useEffect\(\(\) => \{\n    if \(!studentId\)[\s\S]*?return unsubscribe;\n  \}, \[studentId\]\);/);
  assert.ok(listenerEffect, "the Firestore listener effect must depend only on studentId");
  assert.doesNotMatch(source, /\}, \[studentId, onStudentUpdated\]\);/);
});

test("selected-student listener has an explicit error callback", () => {
  assert.match(source, /Could not refresh the selected student in real time\./);
});
