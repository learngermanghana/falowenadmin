import { A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT } from "./a1PublishedWorkbookRoutes.js";

// These are the final four class days. Keep the learner workbook contract
// separate from marking: an answer-key or AI-written-response grading mode
// does NOT prove a human tutor must mark the work.
const LESSONS = Object.freeze({
  "A1-13": {
    subtitle: "Day 21 · Weather and a short message. The published task has Anzeigen, Nachricht, Schreiben and Hören; follow the actual learner instructions.",
    parts: [
      { label: "Teil 1 · Anzeigen", detailEn: "Use the real published weather/adverts reading answers, rather than creating another advert." },
      { label: "Teil 2 · Nachricht", detailEn: "Read the published message and answer what is actually stated." },
      { label: "Teil 3 · Schreiben", detailEn: "Write a short informal cancellation with three content points: cannot attend, concrete weather reason and new meeting." },
      { label: "Teil 4 · Hören", detailEn: "Listen to the actual published weather audio/question content; do not infer it from the reading." },
    ],
    notes: [
      "Day 21 continues the Day 20 writing sequence: a clear cancellation, concrete weather reason and new meeting; greeting and closing are separate letter form.",
      "The answer manifest confirms four sections: three answer-key sections and a writing section with AI-written-response review.",
      "No published marking source verifies manual tutor marking. The classroom forecast and reading are extra practice, not graded workbook sections. Teach simple weil + verb-final without requiring weil for a complete message.",
    ],
    flow: [
      ["Wetter und Jahreszeiten", "17 min: visual warm-up, nine weather words, Es ist vs Es regnet, seasons and temperatures."],
      ["Wetterbericht", "5 min: fictional five-day forecast with five interactive comprehension questions."],
      ["Absage und Grund", "10 min: practise weil with concrete weather reasons and three-point cancellation structure."],
      ["Neuer Termin", "4 min: choose im, am and um and make a new meeting proposal."],
      ["Lesen", "5 min: read an additional weekend weather text with five true/false questions."],
      ["Falowen Music", "5 min: use the existing published Bina, tut mir leid recording and next-lyric practice."],
      ["Einzelcheck", "5 min: one question per selected learner through the native picker."],
      ["Schreiben und Workbook", "9 min: independent cancellation message, self-check and unchanged four-part workbook."],
    ],
  },
  "A1-14.1": {
    subtitle: "Day 22 · Health and body parts. Published workbook: two Lesen parts and one Hören part; follow the learner page.",
    parts: [
      { label: "Teil 1 · Lesen", detailEn: "Read the first published health task, recognising body parts, symptoms and treatment information." },
      { label: "Teil 2 · Lesen: Ihr Termin", detailEn: "Read appointment information and identify the correct person, time or purpose." },
      { label: "Teil 3 · Hören", detailEn: "Listen for the actual symptoms or appointment information; do not invent a fourth graded writing section." },
    ],
    notes: [
      "Day 22 connects bin + adjective and habe + symptom, plus singular tut versus plural tun weh, to a short health-related message.",
      "The answer manifest confirms exactly three objective parts: two Lesen and one Hören. The classroom's letter application is not an extra published graded part.",
      "Check the existing A1 letter sequence: cannot attend, health reason and new meeting. Do not confuse AI/objective scores with a tutor-marked requirement.",
    ],
    flow: [
      ["Körpersymptome erkennen", "7 min: distinguish bin krank, habe Fieber, mein Kopf tut weh and meine Beine tun weh."],
      ["Verbformen prüfen", "8 min: choose bin/habe, tut/tun and kann + infinitive in short A1 sentences."],
      ["Fragen und Zeit", "8 min: complete Wann hast du Zeit, am Samstag and um 15 Uhr."],
      ["Nachricht verstehen", "10 min: identify cancellation, symptom/reason and a proposed alternative meeting; Anrede and Gruß remain letter form."],
      ["Lesen/Hören Transfer", "12 min: preview both real Lesen tasks and the Hören task; never present a separately invented scored letter."],
    ],
  },
  "A1-14.2": {
    subtitle: "Day 23 · Accusative and dative verb practice. No verified published Course Book URL or assignment submission requirement for this chapter.",
    parts: [
      { label: "Akkusativ erkennen", detailEn: "Identify wen? objects with sehen and masculine den Mann." },
      { label: "Dativ erkennen", detailEn: "Identify wem? objects with helfen and danken: dem Mann, der Frau." },
      { label: "Kurze Sätze korrigieren", detailEn: "Correct den/dem/der in actual teacher-guided examples before the unaided exit check." },
    ],
    notes: [
      "Day 23 focuses only on the three taught verb patterns: sehen + accusative; helfen and danken + dative.",
      "The published route manifest does not contain A1-14.2. Do not invent an activity URL, score, submission or section.",
      "Have students identify which verb controls the case, choose Wen? or Wem?, then reveal the matching den/dem/der answer.",
    ],
    flow: [
      ["Verb und Fall erkennen", "8 min: match sehen to Akkusativ and helfen/danken to Dativ with one clear example per verb."],
      ["Wen oder Wem?", "9 min: select the matching object question before attempting the article."],
      ["Artikel vergleichen", "9 min: compare den Mann, dem Mann, die Frau and der Frau."],
      ["Sätze korrigieren", "10 min: repair Ich helfe den Mann and Ich sehe dem Mann by checking the verb."],
      ["Verständnis prüfen", "9 min: finish with three independent sehen/helfen/danken examples and correct teacher feedback."],
    ],
  },
  "A1-5.10": {
    subtitle: "Day 24 · Interactive conjunctions lesson: weil and practical A1 messages, with Learn–Choose–Build–Match–Repair–Apply stages. Do not link to the separate A1 final mock.",
    notes: [
      "The correct interactive grammar page is /campus/course/conjunctions-5-10; A1-5.10's fallback registry entry is the separate final mock, NOT its workbook.",
      "Keep the existing nine-step interactive sequence, with weil + verb-last, modal-last, informal/formal register, two exact repairs and one practical message.",
      "und/aber/oder/denn remain recognition-only; deshalb is deferred. No new grading requirement or mock-exam flow is introduced.",
    ],
  },
});

export const A1_DAYS21_TO24_SLIDE_IDS = Object.freeze(Object.keys(LESSONS));
export function enhanceA1Days21To24Slide(slide = {}) {
  const id = String(slide.assignmentId || "").trim().toUpperCase();
  const spec = LESSONS[id];
  if (!spec) return slide;
  const existing = slide.workbookConnection || {};
  if (id === "A1-5.10") {
    // Keep the one real interactive course page, the original nine learning
    // parts, and no final-mock misdirection in workbookUrl.
    return {
      ...slide,
      teacherNotesEn: [...(slide.teacherNotesEn || []), ...spec.notes],
      workbookConnection: { ...existing, grammarUrl: "/campus/course/conjunctions-5-10",
        workbookUrl: "", subtitle: spec.subtitle },
    };
  }
  const knownRoute = A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT[id] || "";
  if (["A1-13", "A1-14.1"].includes(id) && !knownRoute) {
    throw new Error(id + ": published Course Book route missing");
  }
  return {
    ...slide,
    ...(id === "A1-13" ? { estimatedDuration: "60 minutes", objective: "Describe weather and temperatures, understand a short forecast, write a three-point cancellation with a concrete weather reason, and propose a new meeting using am and um." } : {}),
    teacherNotesEn: [...(slide.teacherNotesEn || []), ...spec.notes],
    interactionFlow: spec.flow.map(([phase, detailEn]) => ({ phase, detailEn })),
    workbookConnection: {
      ...existing,
      workbookUrl: knownRoute,
      subtitle: spec.subtitle,
      parts: spec.parts,
    },
  };
}
