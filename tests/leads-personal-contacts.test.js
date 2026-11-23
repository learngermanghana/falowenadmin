import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STAFF_PAGES, canOpenStaffPage, staffPageIds, staffHomePath } from "../src/utils/staffPageAccess.js";

const read = (file) => readFileSync(new URL("../" + file, import.meta.url), "utf8");

test("Leads can be granted to staff without enabling other admin pages", () => {
  assert.ok(STAFF_PAGES.some((page) => page.id === "leads" && page.path === "/leads"));
  assert.deepEqual(staffPageIds(["leads"], "reviewer"), ["leads"]);
  assert.equal(canOpenStaffPage("/leads", ["leads"]), true);
  assert.equal(canOpenStaffPage("/leads", ["students"]), false);
  assert.equal(canOpenStaffPage("/students", ["leads"]), false);
  assert.equal(staffHomePath(["leads"], ["german"]), "/leads");
});

test("The Leads page keeps online intake and lazily mounts manual contacts", () => {
  const page = read("src/pages/LeadsPage.jsx");
  assert.match(page, /StudentLeadsPanel/);
  assert.match(page, /PersonalLeadsPanel/);
  assert.match(page, /Online Leads/);
  assert.match(page, /Personal Contacts/);
  assert.match(page, /tab === "online"/);
  assert.match(page, /Manage prospective students/);
});

test("Manual contacts use authenticated Firestore, not published Google Sheets or browser storage", () => {
  const panel = read("src/components/PersonalLeadsPanel.jsx");
  assert.match(panel, /falowenManualLeads/);
  assert.match(panel, /useAuth/);
  assert.match(panel, /collection\(db, CONTACTS\)/);
  assert.match(panel, /writeBatch\(db\)/);
  assert.match(panel, /"activities"/);
  assert.match(panel, /nextFollowUpAt/);
  assert.match(panel, /assignedToUid/);
  assert.match(panel, /normalizeLeadPhone/);
  assert.match(panel, /where\("language", "in", staffLanguages\)/);
  assert.doesNotMatch(panel, /localStorage|sessionStorage|STUDENT_LEADS_PUBLISHED_URL/);
});

test("Firestore rules require current permission and keep staff from creating leads or deleting history", () => {
  const rules = read("firestore.rules");
  assert.match(rules, /function canAccessManualLeads\(\)/);
  assert.match(rules, /'leads' in request\.auth\.token\.get\('staffPages', \[\]\)/);
  assert.match(rules, /falowenStaffAccess/);
  assert.match(rules, /function canAccessManualLeadLanguage\(language\)/);
  assert.match(rules, /language in request\.auth\.token\.get\(\x27staffLanguages\x27, \[\]\)/);
  assert.match(rules, /allow create: if isManualLeadsAdmin\(\)/);
  assert.match(rules, /allow delete: if isManualLeadsAdmin\(\) && resource\.data\.status in \['not_interested', 'done'\]/);
  assert.match(rules, /allow delete: if isManualLeadsAdmin\(\);/);
  assert.match(rules, /match \/activities\/\{activityId\}/);
  assert.match(rules, /recordedByUid == request\.auth\.uid/);
});

test("Existing online lead data source and admin deletion remain intact", () => {
  const online = read("src/components/StudentLeadsPanel.jsx");
  assert.match(online, /fetchStudentLeads\(\)/);
  assert.match(online, /role === "admin" && isCompletedLead/);
  assert.match(online, /Payments received/);
});

test("Closed personal contacts can be marked done, filtered out, or deleted by the owner", () => {
  const panel = read("src/components/PersonalLeadsPanel.jsx");
  const rules = read("firestore.rules");
  assert.match(panel, /\["done", "Done"\]/);
  assert.match(panel, /Active contacts/);
  assert.match(panel, /Closed contacts/);
  assert.match(panel, /markDone\(contact\)/);
  assert.match(panel, /deleteClosedContact\(contact\)/);
  assert.match(panel, /owner && DELETABLE_STATUSES\.includes\(contact\.status\)/);
  assert.match(panel, /histories\.docs\.forEach/);
  assert.match(panel, /batch\.delete\(ref\)/);
  assert.match(rules, /'not_interested', 'done'/);
});
