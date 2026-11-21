const test = require("node:test");
const assert = require("node:assert/strict");
const { needsBuild } = require("../scripts/vercelIgnoreBuild.cjs");

test("skip deployments for docs-only, tests-only, and CI-only commits", () => {
  assert.equal(needsBuild(["docs/cost-audit.md", "tests/feature.test.js", ".github/workflows/tests.yml"]), false);
  assert.equal(needsBuild(["README.md"]), false);
});

test("build for any live application, package, or config change", () => {
  for (const file of ["src/App.jsx", "web/src/App.js", "api/index.js", "vercel.json", "package.json",
    "scripts/patchCourses.mjs", "functions/main.js", "web/public/music/catalog.json",
    "docs/note.md\n../src/App.jsx"]) {
    assert.equal(needsBuild([file]), true, file);
  }
  assert.equal(needsBuild(["docs/notes.md", "api/index.js"]), true);
});

test("fail open on missing commit comparison", () => {
  assert.equal(needsBuild([]), true);
  assert.equal(needsBuild(null), true);
});
