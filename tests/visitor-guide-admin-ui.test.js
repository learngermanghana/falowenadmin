import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("Falowen Admin exposes the Visitor Guide navigation and route", () => {
  const app = read("src/App.jsx");
  assert.match(app, /to="\/visitor-guide"[^>]*>Visitor Guide<\/Link>/);
  assert.match(app, /path="\/visitor-guide"/);
  assert.match(app, /path="\/visitor-guide\/public"/);
  assert.match(app, /<VisitorGuidePage publicView \/>/);
  assert.match(app, /VisitorGuidePage/);
});

test("visitor guide keeps the approved school and team credentials", () => {
  const profile = read("src/data/visitorGuideProfile.js");

  assert.match(profile, /establishedYear: 2022/);
  assert.match(profile, /High exam pass rate/);
  assert.match(profile, /German A1–C2/);

  assert.match(profile, /Felix Asadu/);
  assert.match(profile, /International Management at IUB in Germany/);
  assert.match(profile, /Goethe-Institut B2 German certificate/);
  assert.match(profile, /TEFL certificate in Teaching English as a Foreign Language/);
  assert.match(profile, /Founder & Software Developer, Falowen/);
  assert.doesNotMatch(profile, /Sedifex/);

  assert.match(profile, /Catherine Agbleze Etornam/);
  assert.match(profile, /University of Ghana/);
  assert.match(profile, /Philosophy with Political Science/);
  assert.match(profile, /Goethe A2 German certificate/);
});

test("visitor guide generates a public link instead of requiring a PDF", () => {
  const page = read("src/pages/VisitorGuidePage.jsx");
  const css = read("src/pages/VisitorGuidePage.css");

  assert.match(page, /Visitor \/ client name/);
  assert.match(page, /Academic assistant/);
  assert.match(page, /Selected class/);
  assert.match(page, /Course end/);
  assert.match(page, /How Falowen supports the student/);
  assert.match(page, /What happens during the course/);
  assert.match(page, /Learning continues after the final class/);
  assert.match(page, /Hybrid learning:/);
  assert.match(page, /Advanced teaching slides:/);
  assert.match(page, /Six months of Falowen access:/);
  assert.match(page, /buildVisitorGuideShareUrl/);
  assert.match(page, /\/visitor-guide\/public/);
  assert.match(page, /Copy visitor link/);
  assert.match(page, /Open visitor guide/);
  assert.match(page, /The visitor does not need an Admin login/);
  assert.match(page, /Visit notes stay inside Admin and are not included in the public link/);
  assert.doesNotMatch(page, /params\.set\("notes"/);
  assert.match(page, /QRCodeSVG/);

  assert.match(css, /visitor-guide-public-bar/);
  assert.match(css, /visitor-guide-page-public/);
  assert.match(css, /@media print/);
});
