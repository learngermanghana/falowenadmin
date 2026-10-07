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


test("mobile startup keeps Firestore and Storage out of the auth bootstrap", () => {
  const app = fs.readFileSync("src/App.jsx", "utf8");
  const authContext = fs.readFileSync("src/context/AuthContext.jsx", "utf8");
  const loginPage = fs.readFileSync("src/pages/LoginPage.jsx", "utf8");
  const firebaseAuth = fs.readFileSync("src/firebaseAuth.js", "utf8");

  assert.match(app, /const LoginPage = lazy\(\(\) => import\("\.\/pages\/LoginPage"\)\)/);
  assert.doesNotMatch(app, /import LoginPage from/);
  assert.match(authContext, /from "\.\.\/firebaseAuth"/);
  assert.doesNotMatch(authContext, /from "\.\.\/firebase"/);
  assert.match(loginPage, /from "\.\.\/firebaseAuth"/);
  assert.doesNotMatch(firebaseAuth, /firebase\/firestore|firebase\/storage/);
});

test("dashboard lead consumers share one short-lived lead request", () => {
  const source = fs.readFileSync("src/services/studentLeadService.js", "utf8");
  assert.match(source, /studentLeadRequestCache = new Map\(\)/);
  assert.match(source, /if \(cached\?\.promise\) return cached\.promise/);
  assert.match(source, /STUDENT_LEADS_CACHE_MS = 30_000/);
});
