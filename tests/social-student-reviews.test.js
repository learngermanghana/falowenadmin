import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SOCIAL_STUDENT_REVIEWS, STUDENT_REVIEW_FORMATS } from "../src/data/socialStudentReviews.js";
import { drawStudentReviewPoster, fitReviewText, reviewImageFileName, wrapReviewText } from "../src/utils/socialStudentReviewRender.js";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function fakeCanvas() {
  const ctx = {
    font: "20px Arial",
    createLinearGradient() { return { addColorStop() {} }; },
    fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, quadraticCurveTo() {}, closePath() {},
    arc() {}, fill() {}, fillText() {}, save() {}, restore() {}, rect() {}, clip() {},
    measureText(value) {
      const size = Number(this.font.match(/(\d+)px/)?.[1] || 24);
      return { width: [...String(value)].length * size * 0.51 };
    },
  };
  return { width: 0, height: 0, getContext: () => ctx };
}

test("Benedicta's public Google review is preserved exactly and attributed to her", () => {
  const review = SOCIAL_STUDENT_REVIEWS.find((item) => item.id === "benedicta-selasi-kumah-a2");
  assert.equal(review.studentName, "Benedicta Selasi Kumah");
  assert.equal(review.course, "German A2");
  assert.equal(review.source, "Google Review");
  assert.equal(review.rating, 5);
  assert.equal(review.review,
    "I just completed A2 and my speaking is so much better, the lessons are detailed in the falowen app with lots of advanced features and the tutor is very good as well. I listen to German podcasts and can understand most of what is being said just at A2 level, all thanks to Learn Language Education Academy. Definitely continuing with B1 here!😊");
});

test("consistent, social-media-ready PNG sizes are available", () => {
  assert.deepEqual(STUDENT_REVIEW_FORMATS.map(({ width, height }) => [width, height]),
    [[1080, 1350], [1080, 1080], [1080, 1920]]);
  assert.equal(reviewImageFileName("Benedicta Selasi Kumah", "portrait"), "falowen-review-benedicta-selasi-kumah-portrait.png");
  assert.equal(reviewImageFileName("<bad/name>", "incorrect"), "falowen-review-bad-name-portrait.png");
});

test("review wrapping preserves all words without dropping the final line", () => {
  const context = fakeCanvas().getContext("2d");
  const quote = "A short but memorable student review that should wrap naturally.";
  const lines = wrapReviewText(context, quote, 200);
  assert.ok(lines.length > 1);
  assert.equal(lines.join(" "), quote);
  assert.equal(fitReviewText(context, quote, 800, 500).fits, true);
});

test("Benedicta's entire testimonial fits every export ratio", () => {
  for (const format of STUDENT_REVIEW_FORMATS) {
    const canvas = fakeCanvas();
    const result = drawStudentReviewPoster(canvas, SOCIAL_STUDENT_REVIEWS[0], format.id);
    assert.equal(canvas.width, format.width);
    assert.equal(canvas.height, format.height);
    assert.equal(result.fits, true, `testimonial clipped in ${format.id}`);
  }
});

test("social studio exposes a real Student Reviews editor and PNG export", () => {
  const page = read("src/pages/SocialMediaPage.jsx");
  const component = read("src/components/SocialStudentReviews.jsx");
  assert.match(page, /<SocialStudentReviews \/>/);
  assert.match(page, /Student Reviews/);
  assert.match(component, /Select student review/);
  assert.match(component, /Save review/);
  assert.match(component, /Export PNG/);
  assert.match(component, /canvas\.toBlob/);
  assert.match(component, /localStorage\.setItem/);
  assert.match(component, /drawStudentReviewPoster\(canvas, draft, formatId\)/);
  assert.match(component, /if \(!result\.fits\)/);
});
