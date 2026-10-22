import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  CHALLENGE_LEVELS, CHALLENGE_TYPES, SOCIAL_GERMAN_CHALLENGES,
  challengeCopy, filterGermanChallenges, nextUnusedGermanChallenge,
} from "../src/data/socialGermanChallenges.js";
import {
  CHALLENGE_VIDEO_SECONDS, challengeFileStem, challengeVideoMime, sceneAtTime,
  CHALLENGE_EXPORT_SIZES, CHALLENGE_ARTBOARD_WIDTH,
  challengeFrameLayout, challengeTextFits, renderChallengeFrame,
} from "../src/utils/socialGermanChallengeRender.js";

test("120 editorial challenges have the promised unique category counts and valid levels", () => {
  assert.equal(SOCIAL_GERMAN_CHALLENGES.length, 120);
  assert.equal(new Set(SOCIAL_GERMAN_CHALLENGES.map(row => row.id)).size, 120);
  assert.deepEqual(CHALLENGE_TYPES.map(type => SOCIAL_GERMAN_CHALLENGES.filter(row => row.type === type.id).length), [40, 30, 30, 20]);
  for (const entry of SOCIAL_GERMAN_CHALLENGES) {
    assert.ok(CHALLENGE_LEVELS.includes(entry.level), entry.id);
    assert.ok(entry.topic && entry.explanation?.length >= 20, entry.id);
    if (["quiz", "exam"].includes(entry.type)) {
      assert.ok(entry.prompt, entry.id);
      assert.ok(entry.options?.length >= 2, entry.id);
      assert.ok(Number.isInteger(entry.answerIndex) && entry.answerIndex >= 0 && entry.answerIndex < entry.options.length, entry.id);
      assert.equal(new Set(entry.options).size, entry.options.length, entry.id);
      if (entry.type === "exam") assert.ok(entry.stimulus?.length >= 35, entry.id);
    } else if (entry.type === "mistake") {
      assert.ok(entry.incorrect && entry.correct && entry.incorrect !== entry.correct, entry.id);
    } else {
      assert.ok(entry.first && entry.second && entry.translation, entry.id);
    }
    const copy = challengeCopy(entry);
    assert.ok(copy.hook && copy.challenge && copy.reveal && copy.explanation && copy.caption, entry.id);
    assert.ok(copy.caption.includes("https://falowen.app"), entry.id);
  }
});

test("the 4 formats are genuinely distributed across all A1-B2 levels", () => {
  for (const level of CHALLENGE_LEVELS) {
    for (const type of CHALLENGE_TYPES) {
      assert.ok(SOCIAL_GERMAN_CHALLENGES.some((item) => item.level === level && item.type === type.id), level + " " + type.id);
    }
  }
});

test("challenge search filters by type, level and text, and finds the next not-published item", () => {
  const filtered = filterGermanChallenges({ level: "A2", type: "mistake", search: "dative" });
  assert.ok(filtered.length >= 1);
  assert.ok(filtered.every(item => item.type === "mistake" && item.level === "A2"));
  const statuses = Object.fromEntries(filtered.slice(0, 1).map(item => [item.id, "Published"]));
  assert.equal(nextUnusedGermanChallenge(filtered, statuses)?.id, filtered[1]?.id ?? null);
  assert.equal(nextUnusedGermanChallenge(filtered, Object.fromEntries(filtered.map(item => [item.id, "Published"]))), null);
});

test("exam-style tasks are labeled original, without claiming official past Goethe content", () => {
  const exams = SOCIAL_GERMAN_CHALLENGES.filter(item => item.type === "exam");
  assert.equal(exams.length, 20);
  for (const entry of exams) {
    const copy = challengeCopy(entry);
    assert.match(copy.hook, /Exam-style/);
    assert.match(copy.caption, /GoethePreparation/);
  }
});

test("scene times and video MIME fallback produce safe, portable exports", () => {
  assert.equal(CHALLENGE_VIDEO_SECONDS, 12);
  assert.equal(sceneAtTime(0), 0);
  assert.equal(sceneAtTime(2), 1);
  assert.equal(sceneAtTime(6.9), 1);
  assert.equal(sceneAtTime(7), 2);
  assert.equal(sceneAtTime(10), 3);
  assert.equal(challengeVideoMime(type => type === "video/webm;codecs=vp8"), "video/webm;codecs=vp8");
  assert.equal(challengeVideoMime(() => false), "");
  assert.equal(challengeFileStem({ id: "GC-Q-001" }), "falowen-german-challenge-gc-q-001");
  assert.deepEqual(Object.values(CHALLENGE_EXPORT_SIZES).map(size => [size.width, size.height]), [[1080, 1350], [1080, 1080], [1080, 1920]]);
});

test("social-media page adds challenges without removing vocabulary and advert editors", () => {
  const page = readFileSync(new URL("../src/pages/SocialMediaPage.jsx", import.meta.url), "utf8");
  const component = readFileSync(new URL("../src/components/SocialGermanChallenges.jsx", import.meta.url), "utf8");
  assert.match(page, /<SocialGermanChallenges \/>/);
  assert.match(page, /German Challenges/);
  assert.match(page, /<SocialVocabularyCreator \/>/);
  assert.match(page, /<SocialAdsDictionary \/>/);
  assert.match(component, /localStorage\.setItem\(STORAGE_KEY/);
  assert.match(component, /status(?:es)?\[selected\.id\]/);
  assert.match(component, /Export question PNG/);
  assert.match(component, /Export answer PNG/);
  assert.match(component, /12-second vertical video/);
  assert.match(component, /Copy caption \+ hashtags/);
  assert.match(component, /MediaRecorder/);
  assert.doesNotMatch(component, /fetch\(/);
});


function fakeChallengeCanvas(width, height) {
  const labels = [];
  const transforms = [];
  const ctx = {
    font: "700 24px Arial",
    textAlign: "left",
    setTransform(...args) { transforms.push(args); },
    clearRect() {},
    createLinearGradient() { return { addColorStop() {} }; },
    fillRect() {},
    beginPath() {},
    arc() {},
    fill() {},
    stroke() {},
    roundRect() {},
    rect() {},
    measureText(value) {
      const fontSize = Number(this.font.match(/(\d+(?:\.\d+)?)px/)?.[1]) || 24;
      return { width: Array.from(String(value)).length * fontSize * 0.54 };
    },
    fillText(value, x, y) {
      labels.push({ text: String(value), x, y, font: this.font, align: this.textAlign });
    },
  };
  return { width, height, getContext: () => ctx, ctx, labels, transforms };
}

test("challenge preview and story export share one scaled layout with isolated header and footer", () => {
  assert.equal(CHALLENGE_ARTBOARD_WIDTH, 1080);
  const entry = SOCIAL_GERMAN_CHALLENGES.find((row) => row.type === "mistake");
  const copy = challengeCopy(entry);
  const preview = fakeChallengeCanvas(540, 960);
  const exportSize = fakeChallengeCanvas(1080, 1920);
  assert.equal(renderChallengeFrame(preview, entry, copy, 2, 8), true);
  assert.equal(renderChallengeFrame(exportSize, entry, copy, 2, 8), true);
  assert.deepEqual(
    preview.labels.map(({ text, x, y }) => ({ text, x, y })),
    exportSize.labels.map(({ text, x, y }) => ({ text, x, y })),
    "preview must match the exported pixels, except for the canvas scale",
  );
  assert.ok(preview.transforms.some((arr) => arr[0] === 0.5 && arr[3] === 0.5));
  assert.ok(exportSize.transforms.some((arr) => arr[0] === 1 && arr[3] === 1));
  const brand = preview.labels.find(({ text }) => text === "FALOWEN");
  const badge = preview.labels.find(({ text }) => text.includes("MISTAKE"));
  assert.ok(brand && badge && brand.y < 160 && badge.y < 160);
  const logoEnd = brand.x + preview.ctx.measureText(brand.text).width;
  const badgeStart = badge.x - 385 / 2;
  assert.ok(logoEnd < badgeStart, "wordmark and category badge must not collide");
  const layout = challengeFrameLayout(540, 960);
  const saved = preview.labels.find(({ text }) => text === "SAVE THIS FOR REVISION");
  const subfooter = preview.labels.find(({ text }) => text.includes("Learn German") && text.includes("A1–B2"));
  assert.ok(saved.y > layout.cardBottom && subfooter.y > saved.y);
  assert.ok(subfooter.y < layout.h - 20);
  const allDrawnText = preview.labels.map(({ text }) => text).join(" ");
  assert.ok(allDrawnText.includes(copy.reveal), "render must include the correct answer");
  assert.ok(allDrawnText.includes(copy.explanation), "render must include the explanation");
});

test("square and portrait challenges reserve space for category, content and CTA", () => {
  for (const dimensions of Object.values(CHALLENGE_EXPORT_SIZES)) {
    const l = challengeFrameLayout(dimensions.width, dimensions.height);
    assert.ok(l.topicY < l.cardTop, dimensions.label);
    assert.ok(l.cardTop < l.cardBottom, dimensions.label);
    assert.ok(l.cardBottom + 36 < l.footerTop, dimensions.label);
    assert.ok(l.footerBottom < l.bottomLineY, dimensions.label);
    assert.ok(l.bottomLineY < l.h, dimensions.label);
  }
});

test("overlong edited answers cannot be exported with clipped invisible text", () => {
  const entry = SOCIAL_GERMAN_CHALLENGES.find((row) => row.type === "mistake");
  const copy = { ...challengeCopy(entry), reveal: "Wiederhole diese sehr lange Antwort ".repeat(150) };
  const canvas = fakeChallengeCanvas(1080, 1080);
  assert.equal(challengeTextFits(canvas.ctx, entry, copy, canvas.width, canvas.height, 2), false);
  assert.equal(renderChallengeFrame(canvas, entry, copy, 2), false);
  assert.ok(canvas.labels.some(({ text }) => /Text zu lang/i.test(text)));
});
