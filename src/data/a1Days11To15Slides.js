import { A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT } from "./a1PublishedWorkbookRoutes.js";
import { A1_TEIL3_OBJECT_CARDS } from "./a1Teil3ObjectCards.js";

// Five authoritative A1 class days already mapped in courseSessionGroups.
// Never invent workbook sections or call a page tutor-marked without a known
// marking reference. Day 15 is exam-format orientation, distinct from A1-5.9.
const CONTENT = Object.freeze({
  "A1-7": {
    assignmentKind: "tutor-marked",
    subtitle: "A1 Day 11: five short grammar topics. The existing assignment stays exactly two parts: Lesen and Hören.",
    parts: [
      { label: "Teil 1 · Lesen", detailEn: "Five questions on notices and opening times; practise reading ab, bis, von … bis and nachmittags in context." },
      { label: "Teil 2 · Hören", detailEn: "Five questions using the existing Day 11 audio about class times, daily routines, shopping and picking someone up." },
    ],
    teacherNotesEn: [
      "Follow the approved five-section grammar order: clock → time words → parts of the day → separable verbs → Anna's routine.",
      "Contrast um (at), ab (starting at), von … bis (from … to), bis (until), vor (before) and nach (after) with real opening times.",
      "Keep halb clear once: halb acht = 7:30. Distinguish Viertel vor acht (exactly 7:45) from vor 8 Uhr (any time before eight).",
      "Teach morgens, vormittags, mittags, nachmittags, abends, nachts as approximate parts of the day. Note morgen = tomorrow.",
      "Show a separable verb in a real routine sentence: Am Montag stehe ich um 6 Uhr auf. Do not confuse ab 10 Uhr with abholen.",
      "The A1-7 workbook and its existing two-part scoring, questions and audio are unchanged. Do not describe these grammar checks as a third assignment section.",
    ],
    studentQuestionsDe: [
      "Was bedeutet „halb acht“? Nenne die digitale Uhrzeit.",
      "Was ist der Unterschied zwischen „um 8 Uhr“ und „ab 8 Uhr“?",
      "Die Bibliothek ist von 9 bis 17 Uhr geöffnet. Ist sie um 18 Uhr geöffnet?",
      "Welches Wort passt: Ich lerne um 10 Uhr Deutsch — morgens, vormittags oder abends?",
      "Korrigiere: „Ich aufstehe um 6 Uhr.“",
      "Welches Wort bedeutet „until“: bis oder ab?",
    ],
    grammarTeachingSections: [
      {
        title: "1. Die Uhrzeit — Telling the Time",
        items: [
          "Wie spät ist es? → Es ist sechs Uhr. (06:00)",
          "Viertel nach sechs = 06:15 · halb sieben = 06:30 · Viertel vor sieben = 06:45",
          "halb names the NEXT hour: halb acht = 07:30, not 08:30.",
          "Wann beginnt der Kurs? → Der Kurs beginnt um sieben Uhr. Say ein Uhr for 01:00.",
        ],
      },
      {
        title: "2. Zeitangaben — Important Time Expressions",
        items: [
          "um 8 Uhr = at 8 · ab 8 Uhr = starting at 8",
          "von 8 bis 10 Uhr = from 8 to 10 · bis 10 Uhr = until 10",
          "vor 8 Uhr = before 8 · nach 8 Uhr = after 8",
          "Viertel vor acht is exactly 07:45; vor 8 Uhr can be any earlier time.",
          "am Montag = on Monday · ab Montag = starting Monday · von Montag bis Freitag = Monday to Friday",
        ],
      },
      {
        title: "3. Tageszeiten — Parts of the Day",
        items: [
          "morgens = in the morning · vormittags = before noon · mittags = at midday",
          "nachmittags = in the afternoon · abends = in the evening · nachts = at night",
          "10:00 → vormittags · 12:30 → mittags · 16:00 → nachmittags (approximate, not fixed boundaries)",
          "Ich lerne vormittags Deutsch. · Am Nachmittag habe ich einen Termin.",
          "morgen = tomorrow, but morgens = in the mornings.",
        ],
      },
      {
        title: "4. Trennbare Verben — Daily Routines",
        items: [
          "aufstehen → Ich stehe um 6 Uhr auf. · anfangen → Der Kurs fängt um 9 Uhr an.",
          "einkaufen → Ich kaufe nachmittags ein. · fernsehen → Ich sehe abends fern.",
          "abholen → Ich hole Anna um 16 Uhr ab. · anrufen → Ich rufe meine Mutter an.",
          "Pattern: subject + conjugated verb + details + prefix. Am Montag stehe ich um 6 Uhr auf.",
          "ab 10 Uhr is a time expression; ab- in abholen is a verb prefix.",
        ],
      },
      {
        title: "5. Mein Tagesablauf — Anna's Routine",
        items: [
          "Morgens stehe ich um halb sieben auf.",
          "Von 8 bis 10 Uhr habe ich Deutschunterricht. Der Unterricht fängt um 8 Uhr an.",
          "Nach dem Unterricht gehe ich nach Hause. Mittags esse ich mit meiner Familie.",
          "Nachmittags kaufe ich ein. Abends sehe ich fern. Um 22 Uhr gehe ich schlafen.",
          "Transfer to the unchanged A1-7 Lesen and Hören workbook; use its real signs and audio.",
        ],
      },
    ],
    flow: [
      { phase: "Uhrzeiten", detailEn: "7 min: decode 06:15, 06:30 and 06:45 with Viertel, halb, vor and nach." },
      { phase: "Zeitwörter", detailEn: "10 min: contrast um, ab, von … bis, bis, vor and nach using opening-hours notices." },
      { phase: "Tageszeiten", detailEn: "7 min: match morning, midday, afternoon, evening and night with everyday actions." },
      { phase: "Trennbare Verben", detailEn: "8 min: form short daily-routine sentences with the prefix at the end." },
      { phase: "Anna + workbook", detailEn: "10 min: read Anna's routine, then transfer the vocabulary into the two published Lesen/Hören parts." },
      { phase: "Exit check", detailEn: "5 min: one mixed question on ab/von … bis, a part of the day, and a separable verb." },
    ],
    wrapUpTaskDe: "Erkläre um, ab und von … bis an einem Beispiel. Sage danach einen Satz mit nachmittags und einen Satz mit aufstehen.",
  },
  "A1-8": {
    assignmentKind: "tutor-marked",
    subtitle: "A1 Day 12 tutor-marked workbook: two Lesen parts. The separate six-question grammar knowledge check is unscored practice.",
    parts: [
      { label: "Teil 1 · Lesen (Richtig/Falsch)", detailEn: "Read three messages and answer five Richtig/Falsch questions." },
      { label: "Teil 2 · Lesen (A/B/C)", detailEn: "Read three signs and timetables; select answers for three multiple-choice questions." },
    ],
    teacherNotesEn: [
      "Keep the presentation in the same order as the new grammar note: AM/PM and 24-hour clock → exact minutes → 12 months → date ordinals.",
      "The actual A1-8 workbook has two scored Lesen parts: five Richtig/Falsch and three A/B/C questions. Do not call the second part Hören.",
      "Do not introduce years, am/um, or other time-preposition revisions here; they belong in the following chapter.",
      "Use the six-question grammar knowledge test for quick independent practice without changing submission or marking.",
    ],
    grammarTeachingSections: [
      {
        title: "1. AM / PM und die 24-Stunden-Uhr",
        items: [
          "6 AM = 06:00 = sechs Uhr morgens; 6 PM = 18:00 = sechs Uhr abends.",
          "9 AM = neun Uhr morgens; 9 PM = 21:00 = neun Uhr abends.",
          "For 1 PM to 11 PM, add 12 to the hour. 3 PM = 15:00.",
        ],
      },
      {
        title: "2. Genaue Minuten sagen",
        items: [
          "Pattern: hour + Uhr + minutes. 13:43 = dreizehn Uhr dreiundvierzig.",
          "02:21 = zwei Uhr einundzwanzig; 14:21 = vierzehn Uhr einundzwanzig.",
          "07:05 = sieben Uhr fünf; 23:58 = dreiundzwanzig Uhr achtundfünfzig.",
        ],
      },
      {
        title: "3. Die zwölf Monate",
        items: [
          "Januar · Februar · März · April · Mai · Juni",
          "Juli · August · September · Oktober · November · Dezember",
          "German months start with a capital letter.",
        ],
      },
      {
        title: "4. Das Datum: Tag + Monat",
        items: [
          "Write: 03.05. / 12.08. / 23.10. No years in this chapter.",
          "Say: der dritte Mai · der zwölfte August · der dreiundzwanzigste Oktober.",
          "Most ordinals 4–19 end in -te, 20–31 in -ste; remember erste, dritte, siebte, achte.",
          "Heute ist der dritte Mai. (Today is 3 May.)",
        ],
      },
    ],
    studentQuestionsDe: [
      "Was ist 7 PM im 24-Stunden-System?",
      "Wie sagt man 13:43 Uhr?",
      "Wie sagt man 02:21 Uhr?",
      "Welcher Monat kommt nach März?",
      "Wie sagt man das Datum 23. Oktober?",
    ],
    flow: [
      { phase: "12/24-Stunden", detailEn: "8 min: connect AM/PM with morgens and abends; convert 6 PM and 7 PM." },
      { phase: "Minuten", detailEn: "10 min: read 13:43, 02:21, 14:21 and 07:05 exactly." },
      { phase: "Monate", detailEn: "8 min: recognise and order all twelve German months." },
      { phase: "Datum", detailEn: "10 min: form ordinal day + month, without years or time prepositions." },
      { phase: "Sechs Fragen", detailEn: "8 min: complete the grammar-page six-question multiple-choice check; then open the unchanged two-part Lesen workbook." },
    ],
    wrapUpTaskDe: "Lies 14:21 Uhr, nenne den Monat nach März und sage den 23. Oktober als Datum.",
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
    subtitle: "Goethe A1 exam-format introduction. This page teaches the three speaking parts, then practises Teil 3 with concrete object cards; the full A1-5.9 mock comes later.",
    parts: [
      { label: "Teil 1 · Sich vorstellen", detailEn: "Recognise the brief personal introduction expected in the A1 exam." },
      { label: "Teil 2 · Fragen und Antworten", detailEn: "Ask one simple topic question and give a relevant short answer." },
      { label: "Teil 3 · Bitten und reagieren", detailEn: "See an everyday object, choose a useful verb, say a complete polite request and react to a partner's request." },
    ],
    teacherNotesEn: [
      "Day 15 introduces all three Goethe A1 speaking parts; the practical classroom focus is Teil 3 object cards.",
      "Show the object without the sample sentence. Invite the student to choose a verb (öffnen, schließen, geben, bringen, zeigen, leihen, anmachen, ausmachen, holen or unterschreiben), make a polite request, then react naturally.",
      "Accept different suitable short polite requests, not only the model. Mark Correct only after hearing a complete request and an appropriate reaction.",
      "Keep the existing published music activity. The later A1-5.9 lesson remains the full speaking-readiness mock, and this introduction does not create new graded submissions.",
    ],
    studentQuestionsDe: A1_TEIL3_OBJECT_CARDS.slice(0, 10).map((card) => `Bildkarte: ${card.objectDe}. Formuliere eine höfliche Bitte und reagiere passend.`),
    flow: [
      { phase: "Prüfungsteile erkennen", detailEn: "6 min: briefly distinguish Teil 1, Teil 2 and Teil 3. Do not make this a memorisation quiz." },
      { phase: "Bitte bauen", detailEn: "6 min: demonstrate Können Sie (mir) bitte + object + infinitive and one formal Sie imperative. Choose verbs that match real object cards." },
      { phase: "Bildkarten ohne Lösung", detailEn: "12 min: select one student at a time. Project only the object. Learner chooses an action and makes a full polite request before the teacher reveals the model." },
      { phase: "Bitten und reagieren", detailEn: "8 min: ask partners to reply Ja, gern / Natürlich / Tut mir leid, das geht leider nicht. Check both sides of the exchange." },
      { phase: "Musik und Abschluss", detailEn: "Keep the existing published Day 15 music stage. Finish with a fresh object-card request and reaction; the full A1-5.9 mock is separate." },
    ],
    wrapUpTaskDe: "Bildkarte ohne Hilfe: Bilde eine höfliche Bitte zu einem Gegenstand und reagiere passend auf die Bitte deines Partners.",
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
    grammarTeachingSections: spec.grammarTeachingSections || slide.grammarTeachingSections,
    wrapUpTaskDe: spec.wrapUpTaskDe,
    workbookConnection: {
      grammarUrl: id === "A1-7" ? "/campus/course/the-12-hour-clock-system-in-german-chapter-7" : id === "A1-8" ? "/campus/course/a1-day-12-the-24-hour-clock-and-dates" : null,
      workbookUrl: route,
      subtitle: spec.subtitle,
      parts: spec.parts,
    },
  };
}
