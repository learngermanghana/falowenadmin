import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

test("student deletion patch produces valid Firebase code and fixes the nested path", () => {
  const root = mkdtempSync(join(tmpdir(), "falowen-student-delete-"));
  mkdirSync(join(root, "functions"), { recursive: true });
  mkdirSync(join(root, "scripts"), { recursive: true });
  cpSync("functions/index.js", join(root, "functions/index.js"));
  cpSync("scripts/patchStudentDeletionRuntime.mjs", join(root, "scripts/patchStudentDeletionRuntime.mjs"));

  const patch = spawnSync(process.execPath, ["scripts/patchStudentDeletionRuntime.mjs"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(patch.status, 0, patch.stderr || patch.stdout);

  const generated = readFileSync(join(root, "functions/index.js"), "utf8");
  assert.match(generated, /student_delete_runtime_v2/);
  assert.match(generated, /db\.collection\("submissions"\)\.doc\(level\)\.collection\(code\)/);
  assert.doesNotMatch(generated, /db\.doc\(`submissions\/\$\{level\}\/\$\{code\}`\)/);
  assert.doesNotMatch(generated, /studentDeleteAppsScriptUrlSecret/);
  assert.doesNotMatch(generated, /studentDeleteSyncSecret/);
  assert.match(generated, /Student account deletion completed successfully/);

  const syntax = spawnSync(process.execPath, ["--check", "functions/index.js"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(syntax.status, 0, syntax.stderr || syntax.stdout);
});
