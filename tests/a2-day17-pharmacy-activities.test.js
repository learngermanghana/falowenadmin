import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { A2_DAY17_AUDIO_KEY, A2_DAY17_TRANSCRIPT, A2_DAY17_WARMUP, A2_DAY17_LISTENING } from "../src/data/a2Day17Opening.js";
import { INTERACTIVE_LESSON_OPENINGS, getInteractiveLessonOpening, isInteractiveOpeningStage } from "../src/data/interactiveLessonOpenings.js";
import { B1_DAY25_AUDIO_KEY, B1_DAY25_LISTENING, B1_DAY25_LISTENING_QUESTIONS, B1_DAY25_TRANSCRIPT } from "../src/data/b1Day25Listening.js";
import { A2_DAY18_BANK_AUDIO_KEY, A2_DAY18_BANK_LISTENING, A2_DAY18_BANK_QUESTIONS, A2_DAY18_BANK_TRANSCRIPT } from "../src/data/a2Day18BankListening.js";
import { A2_DAY20_AUDIO_KEY, A2_DAY20_LISTENING, A2_DAY20_LISTENING_QUESTIONS, A2_DAY20_TRANSCRIPT } from "../src/data/a2Day20Listening.js";

test("A2 Day 17 replaces only its opening stages with a 10-minute warm-up and listening", () => {
  const slide = getSlidesByCourse("A2").find((item) => item.assignmentId === "A2-6.17");
  assert.ok(slide);
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const warm = stages.find((stage) => stage.id === "warmup");
  const listening = stages.find((stage) => stage.id === "knowledge");
  assert.equal(warm.type, "list");
  assert.equal(warm.variant, "interactive-warmup");
  assert.equal(warm.suggestedMinutes, 10);
  assert.equal(warm.challengeItems.length, 4);
  assert.equal(warm.challengeItems.reduce((total, row) => total + row.minutes, 0), 10);
  assert.equal(listening.type, "knowledge");
  assert.equal(listening.variant, "interactive-listening");
  assert.equal(listening.suggestedMinutes, 6);
  assert.equal(listening.audioKey, A2_DAY17_AUDIO_KEY);
  assert.equal(listening.transcript.length, A2_DAY17_TRANSCRIPT.length);
  assert.equal(listening.listeningItems.length, A2_DAY17_LISTENING.length);
  assert.ok(stages.some((stage) => stage.id === "phrases"));
  assert.ok(stages.some((stage) => stage.id === "grammar-check" || stage.type === "grammar-check"));
  assert.equal(stages.length, buildTeachingPresenterStages({ ...slide, assignmentId: "A2-6.16" }, slide.topic).length);
});

test("other A2/B1 lessons still have the old warm-up and short reading", () => {
  for (const level of ["A2","B1"]) {
    for (const slide of getSlidesByCourse(level)) {
      if (slide.assignmentId === "A2-6.17") continue;
      const stages = buildTeachingPresenterStages(slide, slide.topic);
      assert.equal(stages.find((stage)=>stage.id === "warmup").type, "list");
      assert.equal(stages.find((stage)=>stage.id === "knowledge").type, "knowledge");
    }
  }
});

test("pharmacy questions are key-backed and transcript contains uploaded facts", () => {
  assert.equal(A2_DAY17_WARMUP.length, 4);
  assert.equal(A2_DAY17_AUDIO_KEY,"a2/day-17/apotheken-detektiv.mp3");
  const transcript = A2_DAY17_TRANSCRIPT.map(([speaker,text])=>speaker + ": " + text).join("\n");
  assert.match(transcript,/zwölf Euro fünfzig/);
  assert.match(transcript,/Dosierungsangaben auf der Packung/);
  for (const item of A2_DAY17_LISTENING) {
    assert.ok(item.prompt && item.hint && item.answer);
    assert.ok(Number.isInteger(item.correctIndex));
    assert.ok(item.options[item.correctIndex]);
  }
});


test("chosen chapters reuse four authored 10-minute warm-up steps without invented recordings", () => {
  const chosen = ["A2-3.8","A2-6.17","A2-7.18","A2-7.20","B1-2.5","B1-7.22","B1-8.25"];
  // Listening-only music chapters may also use the shared registry, without
  // replacing their existing warm-up. Check the authored warm-up set only.
  assert.deepEqual(
    Object.keys(INTERACTIVE_LESSON_OPENINGS).filter((id) => INTERACTIVE_LESSON_OPENINGS[id].warmup?.length > 0),
    chosen,
  );
  for (const id of chosen) {
    const entry = getInteractiveLessonOpening(id);
    const slide = getSlidesByCourse(id.startsWith("A2") ? "A2" : "B1").find(x => x.assignmentId === id);
    assert.ok(slide, id);
    assert.equal(entry.warmup.length, 4, id);
    assert.equal(entry.warmup.reduce((t,item) => t + item.minutes,0),10,id);
    for (const item of entry.warmup) {
      assert.ok(item.prompt && item.answer && item.teacherHint,id);
      assert.ok((item.options?.length || 0) + (item.lines?.length || 0) > 0,id);
    }
    const stages = buildTeachingPresenterStages(slide,slide.topic);
    // Days B1-25 and A2-18 keep their authored four warm-ups as source material,
    // but their visual warm-up slot is the unscored YouTube song.
    if (id === "B1-8.25" || id === "A2-7.18") {
      assert.equal(stages.find(s => s.id === "warmup").variant, "interactive-music-video", id);
      assert.equal(stages.find(s => s.id === "warmup").musicVideo.youtubeId,
        id === "A2-7.18" ? "pXAxzMMXHoE" : "ArWT0uVqUxo");
    } else {
      assert.equal(stages.find(s => s.id === "warmup").variant, "interactive-warmup", id);
    }
    assert.equal(stages.find(s=>s.id==="warmup").type,"list",id);
    assert.equal(stages.find(s=>s.id==="knowledge").type,"knowledge",id);
    assert.equal(Boolean(entry.listening),["A2-6.17","A2-7.18","A2-7.20","B1-8.25"].includes(id),id);
    assert.equal(stages.find(s=>s.id==="knowledge").variant==="interactive-listening",["A2-6.17","A2-7.18","A2-7.20","B1-8.25"].includes(id),id);
    assert.equal(isInteractiveOpeningStage(id,"warmup"),!["B1-8.25","A2-7.18"].includes(id),id);
    assert.equal(isInteractiveOpeningStage(id,"knowledge"),["A2-6.17","A2-7.18","A2-7.20","B1-8.25"].includes(id),id);
    assert.equal(isInteractiveOpeningStage(id,"phrases"),false,id);
  }
});

test("only the chosen chapters change: other A2/B1 days keep classic opening and knowledge", () => {
  for (const level of ["A2","B1"]) for(const slide of getSlidesByCourse(level)) {
    if(getInteractiveLessonOpening(slide.assignmentId)) continue;
    const stages=buildTeachingPresenterStages(slide,slide.topic);
    assert.notEqual(stages.find(s=>s.id==="warmup").variant,"interactive-warmup",slide.assignmentId);
    assert.notEqual(stages.find(s=>s.id==="knowledge").variant,"interactive-listening",slide.assignmentId);
  }
});

test("shared fullscreen renderer includes audio overview and optional post-audio review", () => {
  const presenter = readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");
  const activity = readFileSync(new URL("../src/components/InteractiveLessonOpening.jsx", import.meta.url), "utf8");
  assert.match(presenter, /const interactiveOpening = isInteractiveOpeningStage/);
  assert.match(presenter, /interactiveOpening \? \(/);
  assert.match(presenter, /<InteractiveLessonOpening key=/);
  assert.match(presenter, /presenter-content-interactive/);
  assert.match(css, /presenter-stage\.is-focus-mode > \.presenter-content\.presenter-content-interactive/);
  assert.match(css, /overflow-y:\s*auto/);
  assert.match(activity, /lesson\.listening\.transcript/);
  assert.match(activity, /lesson\.listening\.audioKey/);
  assert.match(activity, /<audio key=\{audioUrl\}/);
  assert.match(activity, /pharm-question-overview/);
  assert.match(activity, /if \(autoReview\)/);
  assert.match(activity, /setReviewMode\(false\)/);
});


test("B1 Day 25 classroom Hören uses the current five Richtig/Falsch answers and signed R2 audio", () => {
  const lesson = getInteractiveLessonOpening("B1-8.25");
  assert.equal(lesson.listening.audioKey, "b1/day-25/day-25.mp3");
  assert.equal(B1_DAY25_AUDIO_KEY, lesson.listening.audioKey);
  assert.equal(lesson.listening.questions.length, 5);
  assert.equal(B1_DAY25_LISTENING_QUESTIONS.length, 5);
  assert.deepEqual(lesson.listening.questions.map(q=>q.answer[0]), ["A","B","A","B","A"]);
  assert.equal(B1_DAY25_TRANSCRIPT.length, 0);
  for (const q of lesson.listening.questions) {
    assert.equal(q.options.length, 2);
    assert.deepEqual(q.options.map(x => x[0]), ["A", "B"]);
    assert.equal(q.answer, q.options[q.correctIndex]);
    assert.ok(q.hint && q.explanation);
  }
  const slide = getSlidesByCourse("B1").find(x=>x.assignmentId==="B1-8.25");
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const knowledge = stages.find(stage=>stage.id==="knowledge");
  assert.equal(knowledge.type,"knowledge");
  assert.equal(knowledge.variant,"interactive-listening");
  assert.equal(knowledge.listeningItems.length,5);
});

test("A2 Day 18 Hören maps uploaded Bank Richtig/Falsch items without changing other lessons", () => {
  const lesson = getInteractiveLessonOpening("A2-7.18");
  const listening = lesson.listening;
  assert.equal(listening.audioKey, "a2/day-18/bank-telefonat.mp3");
  assert.equal(A2_DAY18_BANK_AUDIO_KEY, listening.audioKey);
  assert.equal(listening.level, "A2");
  assert.equal(listening.day, 18);
  assert.equal(listening.suggestedMinutes, 7);
  assert.equal(listening.questions.length, 5);
  assert.equal(A2_DAY18_BANK_QUESTIONS.length, 5);
  assert.equal(A2_DAY18_BANK_LISTENING, listening);
  assert.deepEqual(listening.questions.map(q => q.answer), [
    "Richtig", "Richtig", "Falsch", "Richtig", "Falsch",
  ]);
  assert.deepEqual(listening.questions.map(q => q.prompt), [
    "Frau Weber ruft bei der Bank an, weil sie eine Frage zu ihrem Konto hat.",
    "Die EC-Karte von Frau Weber funktioniert im Geschäft nicht mehr.",
    "Frau Weber hat ihre Karte im Geschäft verloren.",
    "Die Bank kann Frau Weber einen neuen PIN-Code per Post schicken.",
    "Der neue PIN-Code kommt sofort per E-Mail.",
  ]);
  const transcript = A2_DAY18_BANK_TRANSCRIPT.map(([, line]) => line).join(" ");
  for (const q of listening.questions) {
    assert.deepEqual(q.options, ["Richtig", "Falsch"]);
    assert.equal(q.options[q.correctIndex], q.answer);
    assert.ok(q.hint.includes(q.evidence));
    assert.ok(transcript.includes(q.evidence), `Missing listening evidence: ${q.evidence}`);
  }
  const slide = getSlidesByCourse("A2").find(s => s.assignmentId === "A2-7.18");
  assert.ok(slide);
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  assert.equal(stages.find(s => s.id === "warmup").variant, "interactive-music-video");
  const knowledge = stages.find(s => s.id === "knowledge");
  assert.equal(knowledge.type, "knowledge");
  assert.equal(knowledge.variant, "interactive-listening");
  assert.equal(knowledge.suggestedMinutes, 7);
  assert.equal(knowledge.audioKey, A2_DAY18_BANK_AUDIO_KEY);
  assert.equal(knowledge.listeningItems.length, 5);
  assert.equal(isInteractiveOpeningStage("A2-7.18", "knowledge"), true);
  assert.ok(stages.find(s => s.id === "phrases"), "Vocabulary page remains intact");
  assert.equal(stages.length, buildTeachingPresenterStages({
    ...slide, assignmentId: "A2-7.19",
  }, slide.topic).length, "Keep the stage count unchanged");
});


test("A2 Day 20 Reklamation preserves the uploaded Richtig/Falsch answers and workbook stages", () => {
  const lesson = getInteractiveLessonOpening("A2-7.20");
  assert.equal(lesson.listening.audioKey,"a2/day-20/reklamation-falsches-hemd.mp3");
  assert.equal(A2_DAY20_AUDIO_KEY,lesson.listening.audioKey);
  assert.equal(lesson.listening,A2_DAY20_LISTENING);
  assert.equal(lesson.listening.day,20);
  assert.equal(lesson.listening.level,"A2");
  assert.equal(lesson.listening.suggestedMinutes,6);
  assert.equal(A2_DAY20_LISTENING_QUESTIONS.length,5);
  assert.deepEqual(lesson.listening.questions.map(q=>q.answer), [
    "Richtig","Falsch","Richtig","Richtig","Falsch",
  ]);
  assert.deepEqual(lesson.listening.questions.map(q=>q.prompt),[
    "Herr Klein hat das Hemd im Online-Shop bestellt.",
    "Das Paket ist erst nächste Woche angekommen.",
    "Herr Klein hat ein grünes Hemd erhalten, obwohl er Blau bestellt hat.",
    "Im Lager ist ein Fehler bei der Farbe passiert.",
    "Herr Klein muss das Rücksendeetikett per Post bezahlen.",
  ]);
  const script=A2_DAY20_TRANSCRIPT.map(([,line])=>line).join(" ");
  for(const question of lesson.listening.questions){
    assert.deepEqual(question.options,["Richtig","Falsch"]);
    assert.equal(question.options[question.correctIndex],question.answer);
    assert.ok(question.hint.includes(question.evidence));
    assert.ok(script.includes(question.evidence),`Missing original audio evidence: ${question.evidence}`);
  }
  const slide = getSlidesByCourse("A2").find(s=>s.assignmentId==="A2-7.20");
  assert.ok(slide);
  const stages=buildTeachingPresenterStages(slide,slide.topic);
  assert.equal(stages.find(s=>s.id==="warmup").variant,"interactive-warmup");
  const knowledge=stages.find(s=>s.id==="knowledge");
  assert.equal(knowledge.variant,"interactive-listening");
  assert.equal(knowledge.type,"knowledge");
  assert.equal(knowledge.audioKey,A2_DAY20_AUDIO_KEY);
  assert.equal(knowledge.suggestedMinutes,6);
  assert.equal(knowledge.listeningItems.length,5);
  assert.ok(stages.find(s=>s.id==="phrases"),"Keep original Wortschatz");
  assert.equal(stages.length,buildTeachingPresenterStages({...slide,assignmentId:"A2-7.19"},slide.topic).length);
  assert.equal(isInteractiveOpeningStage("A2-7.20","knowledge"),true);
});


test("interactive Hören requests signed audio from deployed Cloud Run API instead of rate-limited website API", () => {
  const component = readFileSync(new URL("../src/components/InteractiveLessonOpening.jsx", import.meta.url), "utf8");
  assert.match(component, /api-awc2au65xa-ew\.a\.run\.app/);
  assert.match(component, /VITE_FALOWEN_COURSE_MEDIA_API_URL/);
  assert.doesNotMatch(component, /VITE_FALOWEN_COURSE_API_URL/);
  assert.doesNotMatch(component, /https:\/\/www\.falowen\.app\/api/);
  assert.match(component, /Authorization: `Bearer \$\{await user\.getIdToken\(\)\}`/);
  assert.match(component, /lesson\.listening\.audioKey/);
  assert.match(component, /\/course-media\/\$\{lesson\.listening\.level\.toLowerCase\(\)\}\/audio-url/);
});

test("interactive fullscreen reserves top toolbar space and avoids redundant timer caption", () => {
  const component = readFileSync(new URL("../src/components/InteractiveLessonOpening.jsx", import.meta.url), "utf8");
  const presenter = readFileSync(new URL("../src/components/TeachingSlidePresenter.jsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/components/TeachingSlidePresenter.css", import.meta.url), "utf8");
  assert.doesNotMatch(component, /className="pharm-duration"/);
  assert.match(presenter, /presenter-has-interactive-opening/);
  assert.match(presenter, /contentRef\.current\.scrollTop = 0/);
  assert.match(css, /presenter-has-interactive-opening > \.presenter-content\.presenter-content-interactive/);
  assert.match(css, /padding-top: clamp\(8\.5rem, 17vh, 10rem\)/);
  assert.match(css, /presenter-student-current span \{\s*display: none/);
  assert.match(css, /presenter-has-interactive-opening \.presenter-student-toolbar/);
  assert.match(component, /pharm-challenge-kicker/);
});
