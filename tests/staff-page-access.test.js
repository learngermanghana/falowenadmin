import test from "node:test";
import assert from "node:assert/strict";
import { normalizeStaffAccess, staffCan, staffLandingRoute, staffRouteCapability, workspaceLanguage } from "../src/utils/staffAccess.js";

test("legacy teachers keep teaching pages but never inherit attendance, studio or publishing", () => {
  const access = normalizeStaffAccess(undefined, ["swahili"], "teacher");
  assert.equal(access.swahili.marking, true);
  assert.equal(access.swahili.slides, true);
  assert.equal(access.swahili.attendance, false);
  assert.equal(access.swahili.music, false);
  assert.equal(access.swahili.publishMusic, false);
  assert.equal(access.german.marking, false);
});
test("explicit per-language access is least-privilege and publishing depends on its editor", () => {
  const access = normalizeStaffAccess({
    swahili: { marking: true, attendance: true, music: true, social: true, publishMusic: false },
    german: { marking: true, social: true, publishSocial: true },
  }, ["swahili"]);
  assert.equal(access.swahili.attendance, true);
  assert.equal(access.swahili.social, true);
  assert.equal(access.swahili.publishSocial, false);
  assert.equal(access.german.marking, false);
  assert.equal(access.german.publishSocial, false);
  assert.equal(staffCan(access, ["swahili"], "german", "music"), false);
  assert.equal(staffLandingRoute(access, ["swahili"], "swahili"), "/marking?language=swahili");
});
test("deep links and language switch select the actual lesson language", () => {
  assert.equal(workspaceLanguage("/teaching-slides/course/SWAHILI/swahili-day-6", ""), "swahili");
  assert.equal(workspaceLanguage("/teaching-slides/course/A2/x", "?language=swahili"), "german");
  assert.equal(workspaceLanguage("/attendance", "?language=swahili"), "swahili");
  assert.equal(staffRouteCapability("/attendance/session/test"), "attendance");
  assert.equal(staffRouteCapability("/students"), null);
  assert.equal(staffLandingRoute({}, [], "german"), "/no-staff-access");
});
