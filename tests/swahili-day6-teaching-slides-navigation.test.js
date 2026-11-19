import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { swahiliSlidePacks } from "../src/data/swahiliSlidePacks.js";

test("Swahili packs list the published lessons in day order", () => {
  assert.deepEqual(swahiliSlidePacks.A1.map(lesson => lesson.dayNumber), [1, 5, 6, 10]);
  assert.deepEqual(swahiliSlidePacks.B1.map(lesson => lesson.dayNumber), [28]);
});

test("Sokoni and Mazingira use the approved AI videos without replacing Falowen Radio or music", () => {
  const lessons = [
    { lesson: swahiliSlidePacks.A1.at(-1), videoId: "xLN5QX669JA", radioId: "4_ygEiW5QjI" },
    { lesson: swahiliSlidePacks.B1[0], videoId: "kcqRGi5KLMs", radioId: "aeXVw4Q4olE" },
  ];

  for (const { lesson, videoId, radioId } of lessons) {
    const stages = lesson.stages || lesson.classroomStages;
    assert.equal(lesson.teacherLectureVideoId, videoId);
    assert.equal(stages[0].id, "intro");
    assert.equal(stages[1].id, "ai-video");
    assert.equal(stages[1].type, "teacher-lecture");
    assert.equal(stages[1].videoId, videoId);
    assert.match(stages[2].id, /^grammar/);
    assert.equal(stages.at(-1).id, "presentation");
    const radio = stages.find(stage => "radioVideoId" in stage);
    assert.equal(radio.radioVideoId, radioId);
    assert.ok(radio.content || radio.items.length);
    assert.ok(stages.find(stage => stage.id === "music").audio.audioUrl);
  }
});

test("Swahili AI video stages reuse the existing YouTube player in the presentation", () => {
  const stageComponent = readFileSync(new URL("../src/components/SwahiliA2LessonStage.jsx", import.meta.url), "utf8");
  const presenter = readFileSync(new URL("../src/components/SwahiliTeachingSlides.jsx", import.meta.url), "utf8");
  assert.match(stageComponent, /stage\.type==="teacher-lecture"/);
  assert.match(stageComponent, /MusicVideoEmbed videoId=\{stage\.videoId\}/);
  assert.match(presenter, /<SwahiliA2LessonStage stage=\{stage\}/);
});

test("Sokoni song questions match the approved six-item A1 listening and speaking exercise", () => {
  const lesson = swahiliSlidePacks.A1.at(-1);
  const music = lesson.stages.find(stage => stage.id === "music");
  const questions = music.questions;
  assert.equal(music.audio.id, "swahili-a1-day-10");
  assert.equal(questions.length, 6);
  assert.deepEqual(questions.map(item => item.section.split(" · ")[0]), [
    "A. Majibu mafupi", "A. Majibu mafupi", "A. Majibu mafupi", "A. Majibu mafupi",
    "B. Kuzungumza", "C. Kazi ya jozi",
  ]);
  assert.equal(questions[0].answer, "Watu wanaenda sokoni.");
  assert.match(questions[1].answer, /Muuzaji anauza na mnunuzi ananunua/);
  for (const product of ["embe", "machungwa", "mayai", "mapapai"]) {
    assert.ok(questions[2].answer.includes(product), product);
  }
  assert.deepEqual(questions[3].instructions, [
    "Kulipa", "Kusalimiana", "Kuuliza jumla", "Kuomba bidhaa", "Kujadiliana kuhusu bei", "Kuaga",
  ]);
  assert.match(questions[3].answer, /^Kusalimiana → Kuomba bidhaa → Kuuliza jumla → Kujadiliana kuhusu bei → Kulipa → Kuaga\.$/);
  assert.match(questions[4].answer, /Karibu, mteja wangu\. Nikusaidie nini/);
  assert.deepEqual(questions[5].instructions, [
    "Salamu", "Kuomba bidhaa", "Kuuliza bei", "Kujadiliana kuhusu bei", "Kulipa na kuaga",
  ]);
  assert.match(questions[5].answer, /Muuzaji: Habari yako/);
  assert.match(questions[5].answer, /Mnunuzi: Asante sana\./);
  assert.ok(questions[5].answer.includes("\n"), "The model dialogue must display each speaker on a new line");
  assert.ok(questions.every(q => q.prompt && q.english && q.answer));
  assert.equal("prompt" in music, false, "Obsolete music question must not remain in the presenter");
});

test("The shared song player uses authored questions with click-to-reveal model answers", () => {
  const player = readFileSync(new URL("../src/components/SwahiliSlideMusic.jsx", import.meta.url), "utf8");
  const presenter = readFileSync(new URL("../src/components/SwahiliTeachingSlides.jsx", import.meta.url), "utf8");
  assert.match(presenter, /<SwahiliSlideMusic track=\{stage\.audio\} questions=\{stage\.questions\}/);
  assert.match(player, /Array\.isArray\(lessonQuestions\)/);
  assert.match(player, /showAnswer &&/);
  assert.match(player, /question\.english/);
  assert.match(player, /question\.instructions/);
  assert.match(player, /whiteSpace: "pre-line"/);
});
