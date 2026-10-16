import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const component = readFileSync(new URL("../src/components/SocialCourseContentCreator.jsx", import.meta.url), "utf8");

function expectReviewReset(fragment, label) {
  assert.ok(component.includes(fragment), `${label} must reset publication status before changing content`);
}

test("editing the question or German teaching text invalidates any previous publication", () => {
  expectReviewReset(
    "onChange={(e) => { clearPostState(); setEdits((current) => ({ ...current, primary: e.target.value })); setCaptionEdit(null); }}",
    "Question edit",
  );
});

test("editing an answer or choosing a lesson example invalidates any previous publication", () => {
  expectReviewReset(
    "onChange={(e) => { clearPostState(); setEdits((current) => ({ ...current, answer: e.target.value })); }}",
    "Answer edit",
  );
  expectReviewReset(
    "onClick={() => { clearPostState(); setEdits((current) => ({ ...current, answer: suggestion })); }}",
    "Suggested example",
  );
  expectReviewReset(
    "if (e.target.value) { clearPostState(); setEdits((current) => ({ ...current, answer: e.target.value })); }",
    "Existing lesson example",
  );
});

test("editing a caption invalidates any previous publication", () => {
  expectReviewReset(
    "onChange={(e) => { clearPostState(); setCaptionEdit(e.target.value); }}",
    "Caption edit",
  );
});

test("published state resets to Draft, clears published URL, and requires explicit URL before republishing", () => {
  assert.match(component, /function clearPostState\(\)\s*\{\s*setStatus\("Draft"\);\s*setPublishedUrl\(""\);\s*\}/);
  assert.ok(component.includes('if (status === "Published" && !safeUrl(publishedUrl))'));
  expectReviewReset(
    'if (e.target.value !== "Published") setPublishedUrl(""); setStatus(e.target.value);',
    "Status change away from Published",
  );
});
