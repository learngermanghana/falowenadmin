import test from "node:test";
import assert from "node:assert/strict";
import {
  classNameCanBeReused,
  classNameSuggestions,
  isClassNameBlocked,
} from "../src/utils/liveClassNameSuggestions.js";

test("class name suggestions skip names already used by active, upcoming, and graduated classes", () => {
  const classes = [
    { name: "A1 Berlin Klasse", status: "active", startDate: "2026-09-01", endDate: "2026-11-01" },
    { name: "A1 Dortmund Klasse", status: "upcoming", startDate: "2026-10-01", endDate: "2026-12-01" },
    { name: "A1 Hamburg Klasse", status: "graduated", startDate: "2026-01-01", endDate: "2026-03-01" },
  ];

  assert.deepEqual(classNameSuggestions("A1", classes, 3), [
    "A1 Leipzig Klasse",
    "A1 Stuttgart Klasse",
    "A1 Freiburg Klasse",
  ]);
  assert.equal(isClassNameBlocked("  a1 berlin   klasse ", classes), true);
});

test("archived and draft class names remain reusable because class creation can restore them", () => {
  const archived = { name: "A2 Berlin Klasse", status: "archived", startDate: "2026-01-01", endDate: "2026-03-01" };
  const draft = { name: "A2 Dortmund Klasse", status: "draft", startDate: "2026-04-01", endDate: "2026-06-01" };

  assert.equal(classNameCanBeReused(archived), true);
  assert.equal(classNameCanBeReused(draft), true);
  assert.deepEqual(classNameSuggestions("A2", [archived, draft], 2), [
    "A2 Berlin Klasse",
    "A2 Dortmund Klasse",
  ]);
});

test("records missing dates remain reusable to match createClassCohort restore rules", () => {
  const incomplete = { name: "B1 Berlin Klasse", status: "active", startDate: "", endDate: "" };
  assert.equal(classNameCanBeReused(incomplete), true);
  assert.equal(classNameSuggestions("B1", [incomplete], 1)[0], "B1 Berlin Klasse");
});


test("availability uses the same slug identity as createClassCohort", () => {
  const classes = [
    {
      name: "A1 Berlin-Klasse",
      slug: "a1-berlin-klasse",
      status: "active",
      startDate: "2026-09-01",
      endDate: "2026-11-01",
    },
  ];

  assert.equal(isClassNameBlocked("A1 Berlin Klasse", classes), true);
  assert.equal(classNameSuggestions("A1", classes, 1)[0], "A1 Dortmund Klasse");
});

test("stored backend slug wins over display-text similarity", () => {
  const classes = [
    {
      name: "A1 Berlin Klasse",
      slug: "legacy-custom-berlin",
      status: "active",
      startDate: "2026-09-01",
      endDate: "2026-11-01",
    },
  ];

  assert.equal(isClassNameBlocked("A1 Berlin Klasse", classes), false);
  assert.equal(classNameSuggestions("A1", classes, 1)[0], "A1 Berlin Klasse");
});

test("legacy records without a stored slug fall back to backend slugification", () => {
  const classes = [
    {
      name: "A1 Berlin-Klasse",
      status: "active",
      startDate: "2026-09-01",
      endDate: "2026-11-01",
    },
  ];

  assert.equal(isClassNameBlocked("A1 Berlin Klasse", classes), true);
});
