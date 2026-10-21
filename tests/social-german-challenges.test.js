import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  CHALLENGE_LEVELS, CHALLENGE_TYPES, SOCIAL_GERMAN_CHALLENGES,
  challengeCopy, filterGermanChallenges, nextUnusedGermanChallenge,
} from "../src/data/socialGermanChallenges.js";
import {
  CHALLENGE_VIDEO_SECONDS, challengeFileStem, challengeVideoMime, sceneAtTime,
  CHALLENGE_EXPORT_SIZES,
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
