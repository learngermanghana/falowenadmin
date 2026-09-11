import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { operationalClassAliases } from "../src/services/sessionHealthExceptionsService.js";

const serviceSource = fs.readFileSync(
  new URL("../src/services/sessionHealthExceptionsService.js", import.meta.url),
  "utf8",
);
const patchSource = fs.readFileSync(
  new URL("../scripts/patchSessionHealthAutomationConfig.mjs", import.meta.url),
  "utf8",
);

test("session health loads attendance from canonical and legacy class aliases", () => {
  const aliases = operationalClassAliases({
    classId: "Y4xjoaF5wK0RmDyIEvkY",
    klass: {
      id: "Y4xjoaF5wK0RmDyIEvkY",
      classId: "A2 Munich Klasse",
      name: "A2 Munich Klasse",
      className: "A2 Munich Klasse",
      slug: "a2-munich-klasse",
    },
  });

  assert.deepEqual(aliases, [
    "Y4xjoaF5wK0RmDyIEvkY",
    "A2 Munich Klasse",
    "a2-munich-klasse",
  ]);
});

test("legacy attendance paths preserve canonical session identity for check-ins", () => {
  assert.match(serviceSource, /attendancePathToCanonicalId/);
  assert.match(serviceSource, /record\.classSessionId \|\| record\.sessionId \|\| documentId/);
  assert.match(serviceSource, /canonicalSessionId = attendancePathToCanonicalId\.get/);
  assert.match(serviceSource, /sessionId: canonicalSessionId/);
});

test("health reads the effective global auto-open setting from the API runtime config", () => {
  assert.match(serviceSource, /attendanceAutomationConfig/);
  assert.match(serviceSource, /autoOpenRuntime/);
  assert.match(patchSource, /attendance\.auto_open_enabled !== false/);
  assert.match(patchSource, /autoOpenLeadMinutes/);
  assert.match(patchSource, /autoOpenWindowMinutes/);
});
