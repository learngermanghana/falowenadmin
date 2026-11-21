import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isGoogleReviewLink, mergePublishedReview, normalizeSubmission } from "../api/public-student-reviews.js";
import { normalizePublicReviewRecords } from "../src/utils/publicReviewRecords.js";
import { buildReviewCaption, parseReviewCsv } from "../src/utils/socialReviewSharing.js";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const valid = {
  studentName: "Akua Anaaku",
  source: "Google Review",
  sourceUrl: "https://www.google.com/maps/contrib/100786623976614248091/reviews?hl=en-GB",
  status: "Approved",
  review: "A thoughtful public review of German lessons and the Falowen app.",
  rating: null,
  date: "2026-11-20",
};
const seed = { reviews: [
  { name: "google/older-id", reviewer: { displayName: "Older reviewer" }, comment: "Older review", starRating: "FIVE" },
] };

test("public Google review publisher validates original review, optional rating and approval", () => {
  const submission = normalizeSubmission(valid);
  assert.equal(submission.rating, null);
  assert.equal(submission.studentName, "Akua Anaaku");
  assert.equal(isGoogleReviewLink(valid.sourceUrl), true);
  assert.equal(isGoogleReviewLink("https://evil.example/maps/"), false);
  assert.throws(() => normalizeSubmission({ ...valid, source: "Student feedback" }), /Only verified public Google reviews/);
  assert.throws(() => normalizeSubmission({ ...valid, status: "Draft" }), /Approve the review/);
  assert.throws(() => normalizeSubmission({ ...valid, sourceUrl: "https://example.com/reviews" }), /Google Maps/);
  assert.throws(() => normalizeSubmission({ ...valid, rating: 6 }), /Choose a rating/);
});

test("upsert preserves earlier Google ratings and never invents a rating for the new review", () => {
  const inserted = mergePublishedReview(seed, normalizeSubmission(valid));
  assert.equal(inserted.reviews.length, 2);
  assert.deepEqual(inserted.reviews[1], seed.reviews[0]);
  assert.equal(inserted.reviews[0].starRating, undefined);
  assert.equal(inserted.reviews[0].ratingStatus, "not_verified");
  assert.equal(inserted.reviews[0].reviewer.displayName, "Akua Anaaku");
  assert.match(inserted.reviews[0].importId, /^admin-google-/);
  assert.throws(() => mergePublishedReview(inserted, normalizeSubmission(valid)), /already in the Falowen website/);
  const updated = normalizeSubmission({ ...valid, publicId: inserted.reviews[0].importId, rating: 5 });
  const changed = mergePublishedReview(inserted, updated);
  assert.equal(changed.reviews.length, 2);
  assert.equal(changed.reviews[0].starRating, "FIVE");
});

test("Social Studio maps public JSON to editable review records, retaining source and unknown stars", () => {
  const converted = normalizePublicReviewRecords(mergePublishedReview(seed, normalizeSubmission(valid)).reviews);
  assert.equal(converted.length, 2);
  assert.equal(converted[0].studentName, "Akua Anaaku");
  assert.equal(converted[0].rating, null);
  assert.equal(converted[0].sourceUrl, valid.sourceUrl);
  assert.equal(converted[0].status, "Published");
  assert.equal(converted[1].rating, 5);
});

test("poster caption and CSV imports don't convert missing ratings to five stars", () => {
  const unknown = { studentName: "Akua Anaaku", review: valid.review, course: "German A1", source: "Google Review", rating: null };
  const caption = buildReviewCaption(unknown);
  assert.ok(caption.includes(valid.review));
  assert.ok(!caption.includes("⭐⭐⭐⭐⭐"));
  const parsed = parseReviewCsv("student_name,rating,review_text\nAkua Anaaku,,My feedback");
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].rating, null);
  const renderer = read("src/utils/socialStudentReviewRender.js");
  assert.ok(renderer.includes("RATING NOT VERIFIED"));
});

test("Admin Social Media uses no frontend GitHub credential and exposes explicit owner-only action", () => {
  const component = read("src/components/SocialStudentReviews.jsx");
  const api = read("api/public-student-reviews.js");
  const router = read("api/router.js");
  assert.ok(component.includes('fetch("/api/public-student-reviews"'));
  assert.ok(component.includes("auth.currentUser.getIdToken()"));
  assert.ok(component.includes("Submit to Falowen website JSON"));
  assert.ok(!component.includes("FALOWEN_REVIEWS_GITHUB_TOKEN"));
  assert.ok(api.includes('process.env.FALOWEN_REVIEWS_GITHUB_TOKEN'));
  assert.ok(api.includes('claims.email_verified !== true'));
  assert.ok(api.includes('reviewer:'));
  assert.ok(router.includes('path === "public-student-reviews"'));
});
