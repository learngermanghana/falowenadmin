import { A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT } from "./a1PublishedWorkbookRoutes.js";

// Five authoritative A1 class days already mapped in courseSessionGroups.
// Never invent workbook sections or call a page tutor-marked without a known
// marking reference. Day 15 is exam-format orientation, distinct from A1-5.9.
const CONTENT = Object.freeze({
  "A1-7": {
    assignmentKind: "tutor-marked",
    subtitle: "Tutor-marked A1 Day 11 workbook: Lesen and Hören, both supported by an answer key.",
    parts: [
      { label: "Teil 1 · Lesen", detailEn: "Read time expressions and answer the published reading-comprehension questions. Use halb, vor and nach accurately." },
      { label: "Teil 2 · Hören", detailEn: "Listen to the published time-related questions and respond using the listening information; don't guess from the reading." },
    ],
    teacherNotesEn: [
      "Day 11 links clock expressions to the published two-part Lesen/Hören assignment. Both sections have reference answers.",
      "Students confuse halb acht = 7:30 with 8:30: always reveal the next-hour rule after their first answer.",
      "Check vor versus nach and the preposition um using concrete times; don't add an invented speaking or role-play workbook section.",
    ],
    studentQuestionsDe: [
      "Wie spät ist es bei „halb acht“?",
      "Welche Uhrzeit ist „zehn vor acht“?",
      "Was bedeutet „zehn nach sieben“ als digitale Zeit?",
      "Ergänze: „Mein Kurs beginnt ___ halb neun.“",
      "Was ist der Unterschied zwischen Viertel nach sieben und Viertel vor acht?",
    ],
    flow: [
      { phase: "Uhrzeit erkennen", detailEn: "8 min: read three shown digital times and choose correct simple German expressions." },
      { phase: "Halb, vor und nach prüfen", detailEn: "10 min: check half-before-next-hour and before/after choices; reveal the precise answer." },
      { phase: "Satzergänzung", detailEn: "8 min: complete short sentences using um + exact time, without an interview." },
      { phase: "Lesen/Hören transfer", detailEn: "10 min: show the real two-part reading/listening task and check how to find the needed time information." },
      { phase: "Abschluss ohne Hilfe", detailEn: "8 min: select one new half-hour, before or after time and check unaided." },
    ],
    wrapUpTaskDe: "Schreibe halb acht, zehn vor acht und Viertel nach sieben als digitale Uhrzeiten und ergänze um in einem Satz.",
  },
  "A1-8": {
    assignmentKind: "tutor-marked",
    subtitle: "Tutor-marked A1 Day 12 workbook: Lesen and Hören. The 12-hour conversion is unscored practice.",
    parts: [
      { label: "Teil 1 · Lesen", detailEn: "Read the published 24-hour timetable, date and appointment text, then answer the five reading questions." },
      { label: "Teil 2 · Hören", detailEn: "Listen for the five Day 12 date/time answers. The additional 12-hour conversion is practice rather than a graded section." },
    ],
    teacherNotesEn: [
      "Day 12 publishes two scored reference-answer parts: five Lesen questions and five Hören questions.",
      "The 12-hour conversion is supplementary practice, not a third scored assignment part.",
      "Check am with weekdays/dates and um with clock times. Use ordinal date forms and do not invent a separate writing submission.",
    ],
    studentQuestionsDe: [
      "Lies 18:30 Uhr als deutsche Uhrzeit.",
      "Wie sagt man 19:00 Uhr im 12-Stunden-System?",
      "Lies den Fahrplan: RE 4 · 18:45 · Gleis 5. Wann fährt der Zug?",
      "Ergänze: „Der Kurs ist ___ Montag ___ 18 Uhr.“",
      "Wie sagst du den 5. Mai mit am?",
    ],
    flow: [
      { phase: "Fahrplan verstehen", detailEn: "8 min: identify departure time, line number and platform in a short timetable." },
      { phase: "12/24-Stunden prüfen", detailEn: "9 min: convert a few exact times as unscored understanding checks." },
      { phase: "Datum und Präposition", detailEn: "10 min: complete am + day/date and um + clock-time sentences; show ordinal answers after a response." },
      { phase: "Lesen/Hören transfer", detailEn: "10 min: explain the five reading and five listening answers in the published workbook; no invented third section." },
      { phase: "Abschluss ohne Hilfe", detailEn: "8 min: solve a fresh weekday, date and exact time combination." },
    ],
    wrapUpTaskDe: "Ergänze am oder um zu Montag, dem fünften Mai und 18:45 Uhr. Lies danach eine Zugzeit korrekt im Fahrplan.",
  },
  "A1-3.5": {
    assignmentKind: "unverified",
    subtitle: "Revision Course Book activity on numbers, times and prices. Follow the published page's submission instructions.",
    parts: [
      { label: "Zahlen wiederholen", detailEn: "Review the ones-before-tens pattern with real numbers such as 24, 32 and 67." },
      { label: "Uhrzeiten wiederholen", detailEn: "Identify halb, vor and nach correctly and connect expressions to digital times." },
      { label: "Preise wiederholen", detailEn: "Distinguish kostet versus kosten and read euro/cent amounts without reversing the digits." },
    ],
    teacherNotesEn: [
      "Day 13 consolidates previously taught numbers, times and prices. It is not an additional speaking or shop-role-play lesson.",
      "The published A1-3.5 revision route is known; its required marking/submission status is not confirmed by an answer-key manifest.",
      "Use short written recognition and correction questions; compare the answer with the original Day 4, 7, 11 and 12 rules.",
    ],
    studentQuestionsDe: [
      "Wie schreibt man 32 als deutsches Zahlwort?",
      "Welche Uhrzeit ist halb neun?",
      "Korrigiere: „vierundzwanzig = zwanzigvier“.",
      "Ergänze: „Die Bücher ___ 24 Euro.“",
      "Welcher Preis ist „zwölf Euro fünfzig“ in Ziffern?",
    ],
    flow: [
      { phase: "Zahlen erkennen", detailEn: "8 min: decode two-digit numbers with ones + und + tens." },
      { phase: "Uhrzeit verstehen", detailEn: "8 min: match halb, nach and vor to simple digital times." },
      { phase: "Preise und Verbform", detailEn: "8 min: complete short euro prices using kostet for singular and kosten for plural." },
      { phase: "Fehler erkennen", detailEn: "10 min: correct one reversed number, one half-hour and one wrong kostet/kosten example." },
      { phase: "Revision activity", detailEn: "10 min: open the published revision page and follow its instructions; do not assume a graded submission." },
    ],
    wrapUpTaskDe: "Schreibe zwei deutsche Zahlen, zwei Uhrzeiten und einen Preis; prüfe die Regeln für und, halb und kosten.",
  },
  "A1-3.6": {
    assignmentKind: "unverified",
    subtitle: "Published A1 Day 14 modal-verbs learning activity; submission requirements must be read from the student page.",
    parts: [
      { label: "Bedeutung", detailEn: "Understand können = ability, müssen = necessity and möchten = a polite wish." },
      { label: "Satzbau", detailEn: "Check modal verb in position two and the action infinitive at the end." },
      { label: "Kontrollierte Anwendung", detailEn: "Complete and correct simple sentences using the matching modal form and meaning." },
    ],
    teacherNotesEn: [
      "Day 14 covers können, müssen and möchten, not advanced modal-verb role-play.",
      "The published modal-verb page is known; do not claim tutor marking without verified submission evidence.",
      "Keep verb-second and sentence-final infinitive visible in each answer; only correct lesson-relevant mistakes.",
    ],
    studentQuestionsDe: [
      "Welches Modalverb bedeutet Fähigkeit: können oder müssen?",
      "Ergänze: „Ich ___ Deutsch sprechen.“ (können)",
      "Was bedeutet „Ich muss heute lernen“?",
      "Korrigiere: „Ich kann spreche Deutsch.“",
      "Wo steht der Infinitiv in „Ich möchte einen Tee trinken“?",
    ],
    flow: [
      { phase: "Modalbedeutung prüfen", detailEn: "8 min: match ability, necessity and polite wish to können, müssen and möchten." },
      { phase: "Verbposition erkennen", detailEn: "9 min: identify conjugated modal in position two and infinitive at the end." },
      { phase: "Lücke ergänzen", detailEn: "8 min: select kann, müssen and möchte in short teacher-verified examples." },
      { phase: "Fehler korrigieren", detailEn: "10 min: repair a wrongly conjugated infinitive or a misplaced action verb." },
      { phase: "Course Book transfer", detailEn: "10 min: connect the checks to the published modal-verbs page without inventing scored work." },
    ],
    wrapUpTaskDe: "Ergänze je einen Satz mit können, müssen und möchten. Unterstreiche das Modalverb und markiere den Infinitiv am Ende.",
  },
  "A1-4.7": {
    assignmentKind: "unverified",
    subtitle: "Goethe A1 exam-format introduction. This page is not the later A1-5.9 speaking-readiness mock; follow its own instructions.",
    parts: [
      { label: "Teil 1 · Sich vorstellen", detailEn: "Recognise the short self-introduction information expected in the Goethe A1 speaking exam." },
      { label: "Teil 2 · Fragen stellen und antworten", detailEn: "Form one short question based on a familiar topic and answer the question asked." },
      { label: "Teil 3 · Bitten und reagieren", detailEn: "Make a short polite request and give a natural reaction. Keep the example brief." },
    ],
    teacherNotesEn: [
      "Day 15 explicitly introduces the three parts of Goethe A1 speaking; unlike regular lessons, short practical question/request checks are relevant.",
      "This is an introduction to the format, not the later full A1-5.9 mock/readiness assessment.",
      "The linked exam introduction is published, but no separate graded-submission status is established. Do not invent tutor-marked work.",
    ],
    studentQuestionsDe: [
      "Was machst du in Teil 1: vorstellen, fragen oder bitten?",
      "Was machst du in Teil 2?",
      "Was machst du in Teil 3?",
      "Welche höfliche Bitte passt zu einem Stift?",
      "Wie antwortest du positiv auf „Kannst du mir bitte helfen?“",
    ],
    flow: [
      { phase: "Prüfungsteile erkennen", detailEn: "7 min: match Teil 1, Teil 2 and Teil 3 to their exact speaking tasks." },
      { phase: "Teil 1 sehen", detailEn: "8 min: show one short A1 introduction and identify its key details without requiring a speech from every learner." },
      { phase: "Teil 2 prüfen", detailEn: "8 min: make one topic question and give the corresponding short answer." },
      { phase: "Teil 3 anwenden", detailEn: "10 min: complete one höfliche Bitte + positive/refusal reaction. This is deliberate exam-format practice, not generic role-play." },
      { phase: "Format und Abschluss", detailEn: "10 min: recognise one prompt from each exam part and point to the separate later A1-5.9 mock; do not award exam-readiness scores now." },
    ],
    wrapUpTaskDe: "Ordne die drei Prüfungsteile zu und zeige eine passende kurze Frage oder Bitte mit Reaktion; die vollständige Probeprüfung folgt später.",
  },
});

export const A1_DAYS11_TO15_SLIDE_IDS = Object.freeze(Object.keys(CONTENT));

export function enhanceA1Days11To15Slide(slide = {}) {
  const id = String(slide.assignmentId || "").trim().toUpperCase();
  const spec = CONTENT[id];
  if (!spec) return slide;
  const route = A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT[id] || "";
  if (!route) throw new Error(id + ": missing published A1 Course Book route");
  return {
    ...slide,
    studentQuestionsDe: spec.studentQuestionsDe,
    teacherNotesEn: spec.teacherNotesEn,
    interactionFlow: spec.flow,
    wrapUpTaskDe: spec.wrapUpTaskDe,
    workbookConnection: {
      grammarUrl: null,
      workbookUrl: route,
      subtitle: spec.subtitle,
      parts: spec.parts,
    },
  };
}
