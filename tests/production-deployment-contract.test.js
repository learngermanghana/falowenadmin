import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("admin production release gates and stamps SHA while Vercel build stays mutation-free", () => {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const workflow = fs.readFileSync(".github/workflows/production-release.yml", "utf8");

  assert.equal(pkg.scripts.build, "vite build");
  assert.match(pkg.scripts["generate:build-identity"], /writeBuildIdentity\.mjs/);
  assert.match(workflow, /npm run sync:build/);
  assert.match(workflow, /npm run gate:production/);
  assert.match(workflow, /npm run generate:build-identity/);
  assert.match(workflow, /npx vite build/);
});

test("admin build identity is uncached and main is the only automatic Git deployment", () => {
  const config = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
  const identity = config.headers.find((entry) => entry.source === "/__falowen-admin-build.json");
  assert.ok(identity);
  assert.ok(identity.headers.some((header) => header.key === "Cache-Control" && /no-store/.test(header.value)));
  assert.equal(config.git.deploymentEnabled.main, true);
  assert.equal(config.git.deploymentEnabled["*"], false);
});

test("admin production health workflow checks the live commit SHA", () => {
  const workflow = fs.readFileSync(".github/workflows/production-release.yml", "utf8");
  assert.match(workflow, /branches: \[main\]/);
  assert.match(workflow, /npm run gate:production/);
  assert.match(workflow, /vercel@latest deploy --prebuilt --prod/);
  assert.match(workflow, /api\/deployment-status/);
});
