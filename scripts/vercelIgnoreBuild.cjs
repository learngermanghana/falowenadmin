// Vercel ignored-build step: exit 0 to skip, exit 1 to build.
// Compare *all* changes since the last successful deployment of this branch.
// Vercel supplies VERCEL_GIT_PREVIOUS_SHA only for ignored-build steps.
// Never use HEAD^: a code commit followed by docs-only can otherwise be skipped.
// If the baseline is missing, shallow, invalid, divergent or inaccessible, build.
const { execFileSync } = require("node:child_process");

const SHA_PATTERN = /^[a-f0-9]{40}$/i;

function needsBuild(files) {
  if (!Array.isArray(files) || files.length === 0) return true;
  const safe = (file) => typeof file === "string"
    && !/[\r\n\0]/.test(file)
    && !file.split("/").includes("..")
    && (/^(docs\/|tests\/|\.github\/)/.test(file)
      || /^(README|CONTRIBUTING|CHANGELOG)\.md$/i.test(file)
      || /^(src|functions)\/.*\.(test|spec)\.[cm]?[jt]sx?$/.test(file)
      || /^(src|functions)\/(?:.*\/)?__tests__\/.+\.[cm]?[jt]sx?$/.test(file));
  return files.some((file) => !safe(file));
}

function changedFiles({
  previousSha = process.env.VERCEL_GIT_PREVIOUS_SHA,
  currentSha = process.env.VERCEL_GIT_COMMIT_SHA,
  runGit = (args) => execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    timeout: 5000,
  }),
} = {}) {
  if (!SHA_PATTERN.test(previousSha || "")) return null;
  try {
    const head = runGit(["rev-parse", "HEAD"]).trim();
    if (!SHA_PATTERN.test(head) || (currentSha && head !== currentSha)) return null;
    // Do not diff two unrelated branches or a stale/future baseline.
    runGit(["merge-base", "--is-ancestor", previousSha, head]);
    // NUL-separated paths support whitespace and do not mistake newlines as files.
    const output = runGit(["diff", "--name-only", "-z", previousSha, head]);
    return output.split("\0").filter(Boolean);
  } catch {
    // Vercel clones can be shallow. Never skip a needed production deployment.
    return null;
  }
}

if (require.main === module) {
  const files = changedFiles();
  const build = needsBuild(files);
  console.log(build
    ? "Falowen build required: app changes or previous successful deployment could not be verified."
    : "Falowen build skipped: only documentation, tests or CI changed since last successful deployment.");
  process.exitCode = build ? 1 : 0;
}

module.exports = { needsBuild, changedFiles };
