import test from "node:test";
import assert from "node:assert/strict";
import { classProgramLanguage } from "../src/utils/classProgramLanguage.js";

test("explicit language metadata overrides class name guesses", () => {
  assert.equal(classProgramLanguage({ name: "German for Swahili speakers", program: "german" }), "german");
  assert.equal(classProgramLanguage({ name: "A1 Evening", language: "swahili" }), "swahili");
  assert.equal(classProgramLanguage({ courseLanguage: "Kiswahili" }), "swahili");
});
test("older Swahili named cohorts can still be assigned", () => {
  assert.equal(classProgramLanguage({ name: "Swahili A1 live class" }), "swahili");
  assert.equal(classProgramLanguage({ className: "Kiswahili A1" }), "swahili");
  assert.equal(classProgramLanguage({ name: "A1 Bremen Klasse" }), "german");
});
