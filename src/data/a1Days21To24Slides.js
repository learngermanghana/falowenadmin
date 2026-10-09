import { A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT } from "./a1PublishedWorkbookRoutes.js";

const plans = Object.freeze({
  "A1-13": {
    subtitle: "Day 21 · Weather assignment: verified Teil 1–4; answer-key sections and a separately reviewed writing task.",
    parts: [
      { label: "Teil 1 · Anzeigen", detailEn: "Five published weather-situation reading questions; answer key applies." },
      { label: "Teil 2 · Nachricht", detailEn: "Five Richtig/Falsch checks about the weekend radio weather report; answer key applies." },
      { label: "Teil 3 · Schreiben", detailEn: "Informal wedding invitation reply to Bina: cannot attend, a concrete weather reason, suggest another meeting. Writing is reviewed separately." },
      { label: "Teil 4 · Hören", detailEn: "Six actual weather listening questions, graded with the published reference answers." },
    ],
    notes: [
      "The published weather assignment has exactly four sections: weather advertisements, radio report statements, informal writing to Bina and listening.",
      "For the Bina writing task, keep the three content points distinct from greeting, closing and name. The weather must actually explain why the student cannot attend.",
      "The answer-key and AI-written-response modes do not prove manual tutor marking. Check each section against its own source, not a fabricated dialogue.",
      "Recognise Es regnet/Es schneit and Es ist kalt, plus im + season/month, am + weekday and um + clock time.",
    ],
    questions: [
      "Was ist richtig: Es regnet oder Es ist regnet?",
      "Welche Präposition steht vor Sommer: im oder am?",
      "Welche Präposition steht vor Montag?",
      "Was ist ein konkreter Wettergrund, warum Bina nicht besucht werden kann?",
      "Welche drei Inhaltspunkte enthält die Nachricht an Bina?",
    ],
    flow: [
      ["Wetter verstehen", "8 min: distinguish weather verbs from es ist + adjective; reveal the concrete rule."],
      ["Zeitangaben prüfen", "9 min: complete im Sommer, am Montag and um 16 Uhr."],
      ["Wettergrund erkennen", "9 min: distinguish a neutral forecast from a real reason for cancelling."],
      ["Drei Briefpunkte", "10 min: identify cancellation, concrete weather reason and new meeting; keep letter form separate."],
      ["Vier echte Aufgaben", "9 min: preview published Anzeigen, Nachricht, Schreiben and Hören separately; no invented Sprechen section."],
    ],
    exit: "Korrigiere: Es ist regnet. Ergänze: im Sommer, am Montag und um 16 Uhr. Nenne einen Wettergrund für eine Absage.",
  },
  "A1-14.1": {
    subtitle: "Day 22 · Health assignment: verified Teil 1 Lesen, Teil 2 Lesen Ihr Termin and Teil 3 Hören.",
    parts: [
      { label: "Teil 1 · Lesen", detailEn: "Five published health-service advertisement questions with answer keys." },
      { label: "Teil 2 · Lesen: Ihr Termin", detailEn: "Five Richtig/Falsch checks about the appointment message with reference answers." },
      { label: "Teil 3 · Hören", detailEn: "Six doctor-practice listening questions with reference answers." },
    ],
    notes: [
      "The Day 22 learner assignment has exactly three confirmed objective sections; do not claim a fourth scored Schreiben section.",
      "The guided Felix birthday cancellation is a useful grammar/writing transfer, but it is not an extra confirmed graded part of this assignment.",
      "Use Ich bin krank versus Ich habe Fieber and the singular/plural contrast Mein Kopf tut weh / Meine Beine tun weh.",
      "The existing sections have answer-key grading; avoid claiming manual tutor marking without evidence.",
    ],
    questions: [
      "Was ist richtig: Ich bin krank oder Ich habe krank?",
      "Ergänze: Ich ___ Fieber.",
      "Was ist richtig: Mein Kopf tut weh oder tun weh?",
      "Was ist richtig: Meine Beine tut weh oder tun weh?",
      "Wie sagst du höflich: Ich kann nicht kommen, und wann können wir uns treffen?",
    ],
    flow: [
      ["Symptome erkennen", "8 min: sort krank, Fieber and Kopfschmerzen into sein/haben patterns."],
      ["Tut oder tun", "9 min: choose correct singular and plural forms for body parts."],
      ["Absage bilden", "9 min: repair one modal + infinitive sentence and give a simple health reason."],
      ["Treffen vorschlagen", "9 min: complete Wann hast du Zeit? and am Samstag um 15 Uhr."],
      ["Drei echte Aufgaben", "10 min: introduce the two distinct Lesen tasks and the Hören task from the published workbook."],
    ],
    exit: "Korrigiere: Ich habe krank. Ergänze: Meine Beine ___ weh. Bilde eine Frage mit Wann hast du Zeit?",
  },
  "A1-14.2": {
    subtitle: "Day 23 · Dativ und Akkusativ Verben. Classroom understanding review; no verified learner activity URL.",
    parts: [
      { label: "Verben und Fälle", detailEn: "Classify sehen with accusative, helfen and danken with dative." },
      { label: "Den oder dem?", detailEn: "Compare Ich sehe den Mann and Ich helfe dem Mann in matched examples." },
      { label: "Wen oder wem?", detailEn: "Use Wen? for accusative and Wem? for dative; correct wrong articles." },
    ],
    notes: [
      "This is a regular A1 understanding lesson, not a partner interview or a new compulsory assignment.",
      "No published A1-14.2 learner activity URL was verified in the source registry: leave the destination blank instead of fabricating it.",
      "Teach each verb together with the case it requires: sehen + accusative; helfen and danken + dative.",
      "Use the visible masculine contrast den/dem and the feminine dative der in short, answerable examples.",
    ],
    questions: [
      "Welchen Fall nimmt sehen?",
      "Welchen Fall nimmt helfen?",
      "Ergänze: Ich sehe ___ Mann.",
      "Ergänze: Ich helfe ___ Mann.",
      "Was ist der Unterschied zwischen Wen? und Wem?",
    ],
    flow: [
      ["Verben sortieren", "8 min: distinguish sehen from helfen/danken by required case."],
      ["Den oder dem", "9 min: compare matched masculine noun phrases with two different verbs."],
      ["Wen oder wem", "9 min: label the direct-object versus dative-person question."],
      ["Fallfehler korrigieren", "9 min: correct two erroneous article choices and reveal why."],
      ["Selbstkontrolle", "10 min: complete a short unaided exit check, then review the rules in the classroom; no invented workbook submission."],
    ],
    exit: "Ergänze: Ich sehe ___ Mann, ich helfe ___ Mann und ich danke ___ Frau.",
  },
});

export const A1_DAYS21_TO24_SLIDE_ASSIGNMENTS = Object.freeze([...Object.keys(plans), "A1-5.10"]);

export function enhanceA1Days21To24Slide(slide = {}) {
  const id = String(slide.assignmentId || "").trim().toUpperCase();
  if (id === "A1-5.10") {
    // The source-verified interactive conjunction lesson is the slide's
    // existing grammarUrl. The generic assignment registry maps A1-5.10 to
    // an A1 FINAL MOCK route instead. Never send this lesson to that mock.
    const correctLessonUrl = slide.workbookConnection?.grammarUrl || "";
    if (correctLessonUrl !== "/campus/course/conjunctions-5-10") {
      throw new Error("A1-5.10 conjunction lesson route changed; verify the learner source");
    }
    return {
      ...slide,
      teacherNotesEn: [
        ...(slide.teacherNotesEn || []),
        "Day 24's student transfer opens the existing interactive conjunctions lesson, not the older A1-5.10 assignment-registry link to the final mock exam.",
        "Keep weil as the only productive conjunction and treat und/aber/oder/denn as recognition only. The final practical message is not scored by these teaching slides.",
      ],
      workbookConnection: {
        ...slide.workbookConnection,
        workbookUrl: correctLessonUrl,
        subtitle: "Day 24 · Interactive weil lesson: Choose, Build, Match, Register, Repair, Apply and final written transfer (marking status unverified).",
      },
    };
  }
  const plan = plans[id];
  if (!plan) return slide;
  const route = A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT[id] || "";
  if (id !== "A1-14.2" && !route) throw new Error(id + ": missing published A1 workbook URL");
  return {
    ...slide,
    studentQuestionsDe: plan.questions,
    teacherNotesEn: plan.notes,
    interactionFlow: plan.flow.map(([phase, detailEn]) => ({ phase, detailEn })),
    wrapUpTaskDe: plan.exit,
    workbookConnection: {
      ...(slide.workbookConnection || {}),
      workbookUrl: id === "A1-14.2" ? "" : route,
      subtitle: plan.subtitle,
      parts: plan.parts,
    },
  };
}
