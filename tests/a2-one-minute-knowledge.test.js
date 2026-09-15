import test from "node:test";
import assert from "node:assert/strict";

import { getTeachingSlideByAssignmentId } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

const A2_CHAPTERS = [
  ["A2-1.1", /weil|denn|deshalb/i],
  ["A2-1.2", /Adjektiv|Aussehen/i],
  ["A2-1.3", /Komparativ|Superlativ/i],
  ["A2-2.4", /Treffpunkt|Wohin/i],
  ["A2-2.5", /trennbare Verben/i],
  ["A2-3.6", /Wechselpräpositionen/i],
  ["A2-3.7", /Kaltmiete|Relativsätze/i],
  ["A2-3.8", /Imperativ|Rezept/i],
  ["A2-4.9", /Perfekt/i],
  ["A2-4.10", /Präteritumformen|Feste/i],
  ["A2-4.11", /Verkehrsmitteln|Komparativ/i],
  ["A2-5.12", /Traumberuf|möchten/i],
  ["A2-5.13", /Vorstellungsgespräch/i],
  ["A2-5.14", /um .* zu|Karriere/i],
  ["A2-6.15", /seit|Sport/i],
  ["A2-6.16", /reflexiv|Wohlbefinden/i],
  ["A2-6.17", /Apotheke|Dosierung/i],
  ["A2-7.18", /Bank|Karte/i],
  ["A2-7.19", /Wochenmärkte|nachhaltig/i],
  ["A2-7.20", /Reklamation|Umtausch/i],
  ["A2-8.21", /wenn|falls|ob/i],
  ["A2-8.22", /Wochenplanung|Präsens/i],
  ["A2-9.23", /Arbeits- oder Schulweg|Dativ/i],
  ["A2-9.24", /Urlaubsplanung|Reiseziele/i],
  ["A2-9.25", /Tagesablauf|trennbare Verben/i],
  ["A2-10.26", /Gefühle|wenn-Satz/i],
  ["A2-10.27", /Digitale Kommunikation|Datenschutz/i],
  ["A2-10.28", /Futur I|Zukunft/i],
];

test("all 28 A2 chapters expose topic-adapted one-minute knowledge slides", () => {
  const seenTexts = new Set();

  for (const [assignmentId, topicPattern] of A2_CHAPTERS) {
    const slide = getTeachingSlideByAssignmentId(assignmentId);
    assert.ok(slide, `${assignmentId} slide missing`);
    assert.ok(slide.knowledgeTextDe, `${assignmentId} knowledge text missing`);

    const text = String(slide.knowledgeTextDe).trim();
    const words = text.split(/\s+/).filter(Boolean);
    assert.ok(words.length >= 70, `${assignmentId} knowledge text is too short: ${words.length} words`);
    assert.match(text, topicPattern, `${assignmentId} knowledge text is not adapted to its topic`);
    assert.ok(!seenTexts.has(text), `${assignmentId} reuses another chapter's knowledge text`);
    seenTexts.add(text);

    const stages = buildTeachingPresenterStages(slide, slide.topic);
    const stageIds = stages.map((stage) => stage.id);
    const knowledgeIndex = stageIds.indexOf("knowledge");
    const warmupIndex = stageIds.indexOf("warmup");
    const phrasesIndex = stageIds.indexOf("phrases");

    assert.ok(knowledgeIndex > warmupIndex, `${assignmentId} knowledge slide should follow warm-up`);
    assert.ok(knowledgeIndex < phrasesIndex, `${assignmentId} knowledge slide should come before key phrases`);

    const knowledge = stages[knowledgeIndex];
    assert.equal(knowledge.type, "task");
    assert.equal(knowledge.kicker, "1 Minute");
    assert.equal(knowledge.title, "1-Minute-Wissen");
    assert.equal(knowledge.suggestedMinutes, 1);
    assert.equal(knowledge.body, text);
  }

  assert.equal(seenTexts.size, 28, "all A2 chapters must have distinct knowledge texts");
});
