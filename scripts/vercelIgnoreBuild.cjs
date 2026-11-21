// Vercel: skip only commits containing documentation / CI / test changes.
// Never skip an application, API, build script, dependency or configuration change.
// Exit 0 = skip; exit 1 = build. Fail open if Git comparison is unavailable.
const { execFileSync } = require("node:child_process");

function needsBuild(files) {
  if (!Array.isArray(files) || files.length === 0) return true;
  const safe = (file) => typeof file === "string"
    && !/[\r\n\0]/.test(file)
    && !file.split("/").includes("..")
    && (/^(docs\/|tests\/|\.github\/)/.test(file)
      || /^(README|CONTRIBUTING|CHANGELOG)\.md$/i.test(file));
  return files.some((file) => !safe(file));
}

function changedFiles() {
  try {
    const output = execFileSync("git", ["diff", "--name-only", "HEAD^", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    });
    return output.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  } catch {
    // Shallow checkouts and first commits still build normally.
    return null;
  }
}

if (require.main === module) {
  const files = changedFiles();
  const build = needsBuild(files);
  console.log(build
    ? "Falowen build required: app/config changed or Git comparison unavailable."
    : "Falowen build skipped: documentation, CI, or root notes only.");
  process.exitCode = build ? 1 : 0;
}

module.exports = { needsBuild, changedFiles };
