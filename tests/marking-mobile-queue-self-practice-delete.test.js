import fs from "fs";
import path from "path";

const page = fs.readFileSync(path.resolve(__dirname, "../src/pages/MarkingPage.jsx"), "utf8");
const css = fs.readFileSync(path.resolve(__dirname, "../src/pages/MarkingPage.css"), "utf8");

test("marking queue has separate responsive cards with readable student and assignment information", () => {
  expect(page).toContain('className="marking-queue-row"');
  expect(page).toContain('className="marking-queue-item"');
  expect(css).toContain(".marking-queue-row .marking-queue-item > strong");
  expect(css).toContain("white-space: normal");
  expect(css).toContain("max-height: none; overflow: visible");
});

test("only explicitly identified self-practice records can be deleted after confirmation", () => {
  expect(page).toContain("function isSelfPracticeSubmission");
  expect(page).toContain("raw.isSelfPractice === true");
  expect(page).toContain('{row.path ? (');
  expect(page).toContain('isSelfPracticeSubmission(row) ? "Delete" : "Remove"');
  expect(page).toContain("await hideSubmissionFromQueue(row.path)");
  expect(page).toContain("await fetchSubmissionByPath(submission.path)");
  expect(page).toContain("if (!isSelfPracticeSubmission(row) || !row.path || deletingSubmissionPath) return");
  expect(page).toContain("window.confirm(");
  expect(page).toContain("await deleteSubmission(row.path)");
  expect(page).toContain("setSubmissionNotifications((previous)");
});

test("queue uses exact document lookup for nested self-practice submissions", () => {
  const base = fs.readFileSync(path.resolve(__dirname, "../src/services/markingServiceBase.js"), "utf8");
  expect(base).toContain("export async function fetchSubmissionByPath(path)");
  expect(base).toContain("snapshot.exists() ? normalizeSubmissionDoc(snapshot) : null");
  expect(page).toContain("freshRows.unshift(selectedFreshRow)");
  expect(page).toContain("Boolean(selectedFreshRow)");
});
