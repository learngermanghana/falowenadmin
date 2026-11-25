const test = require("node:test");
const assert = require("node:assert/strict");
const { needsBuild, changedFiles } = require("../scripts/vercelIgnoreBuild.cjs");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const deployed = "a".repeat(40);
const latest = "b".repeat(40);
function gitFixture(changed, { unavailable = false, divergent = false } = {}) {
  const calls = [];
  const runGit = (args) => {
    calls.push(args);
    if (unavailable || (divergent && args[0] === "merge-base")) throw new Error("Unavailable history");
    if (args[0] === "rev-parse") return latest + "\n";
    if (args[0] === "diff") return changed.map(file => file + "\0").join("");
    return "";
  };
  return { runGit, calls };
}

test("skip only when the complete undeployed range is documentation or tests", () => {
  const git = gitFixture(["docs/cost-audit.md", "tests/feature.test.js"]);
  const files = changedFiles({ previousSha: deployed, currentSha: latest, runGit: git.runGit });
  assert.equal(needsBuild(files), false);
  assert.deepEqual(git.calls[2], ["diff", "--name-only", "-z", deployed, latest]);
});

test("application change followed by docs-only commit must still build", () => {
  // This is the cumulative diff since the last *deployed* SHA, not HEAD^.
  const files = changedFiles({
    previousSha: deployed, currentSha: latest,
    runGit: gitFixture(["api/index.js", "docs/notes.md"]).runGit,
  });
  assert.equal(needsBuild(files), true);
});

test("failed app deployment followed by docs must still build", () => {
  const files = changedFiles({
    previousSha: deployed, currentSha: latest,
    runGit: gitFixture(["web/src/App.js", "README.md"]).runGit,
  });
  assert.equal(needsBuild(files), true);
});

test("missing baseline or inaccessible shallow history must build, never skip", () => {
  const scenarios = [
    { previousSha: undefined, runGit: gitFixture([]).runGit },
    { previousSha: "HEAD^", runGit: gitFixture([]).runGit },
    { previousSha: deployed, runGit: gitFixture([], { unavailable: true }).runGit },
    { previousSha: deployed, runGit: gitFixture([], { divergent: true }).runGit },
    { previousSha: deployed, currentSha: "c".repeat(40), runGit: gitFixture([]).runGit },
  ];
  for (const scenario of scenarios) assert.equal(needsBuild(changedFiles(scenario)), true);
});

test("skip only documentation/test/CI paths and reject malformed names", () => {
  assert.equal(needsBuild(["docs/help.md", "tests/test.cjs", ".github/workflows/build.yml"]), false);
  assert.equal(needsBuild(["README.md"]), false);
  for (const path of ["src/App.jsx", "api/index.js", "vercel.json", "package.json",
    "scripts/build.mjs", "functions/main.js", "web/public/music/catalog.json",
    "docs/note.md\n../src/App.jsx", "../docs/note.md"]) {
    assert.equal(needsBuild([path]), true, path);
  }
  assert.equal(needsBuild([]), true);
  assert.equal(needsBuild(null), true);
});

test("actual git two-commit range includes an undeployed application change", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "falowen-git-"));
  const git = (args) => execFileSync("git", args, { cwd, encoding: "utf8" });
  const commit = (message) => {
    git(["add", "-A"]);
    git(["-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", message]);
    return git(["rev-parse", "HEAD"]).trim();
  };
  try {
    git(["init", "-q"]);
    fs.writeFileSync(path.join(cwd, "README.md"), "start");
    const deployed = commit("deployed");
    fs.mkdirSync(path.join(cwd, "src"));
    fs.writeFileSync(path.join(cwd, "src", "App.jsx"), "export const live = true;");
    commit("app not yet deployed");
    fs.mkdirSync(path.join(cwd, "docs"));
    fs.writeFileSync(path.join(cwd, "docs", "notes.md"), "docs");
    const head = commit("docs only");
    const files = changedFiles({ previousSha: deployed, currentSha: head, runGit: git });
    assert.deepEqual(files.sort(), ["docs/notes.md", "src/App.jsx"]);
    assert.equal(needsBuild(files), true);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});

test("colocated tests alone do not need a Vercel build", () => {
  assert.equal(needsBuild(["src/utils/example.test.js", "functions/__tests__/worker.test.cjs"]), false);
  assert.equal(needsBuild(["src/utils/example.test.js", "src/utils/example.js"]), true);
});
