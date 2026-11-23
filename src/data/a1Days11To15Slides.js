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
    subtitle: "Day 13 teaches simple statements, verb-second word order, yes/no questions and W-questions. Follow the published workbook instructions for submissions.",
    parts: [
      { label: "Aussagesätze", detailEn: "Build complete A1 statements with a conjugated verb in second position." },
      { label: "Ja-/Nein-Fragen", detailEn: "Place the conjugated verb first to ask yes/no questions." },
      { label: "W-Fragen", detailEn: "Use Wo, Wann, Wie and Was with the verb directly after the question word." },
      { label: "Partnerübung", detailEn: "Ask and answer personal questions in complete short sentences." },
    ],
    teacherNotesEn: [
      "The learner chapter was updated to focus on forming statements; do not teach this day as the old numbers/time/prices revision.",
      "Explain verb-second as second sentence constituent, not necessarily second individual word.",
      "Model yes/no question verb-first and W-question question-word plus verb plus subject.",
      "Use image prompts and reveal answers after students have produced their own sentences.",
      "Keep the existing workbook route and published music; verify the actual workbook submission requirements before describing graded work.",
    ],
    studentQuestionsDe: [
      "Bilde einen Satz: ich / Deutsch / lerne.",
      "Beginne mit Heute: Ich lerne Deutsch.",
      "Bilde eine Ja-/Nein-Frage: Du trinkst Tee.",
      "Bilde eine W-Frage zur Antwort: Ich wohne in Accra.",
      "Korrigiere: Wo du wohnst?",
    ],
    flow: [
      { phase: "Satzbau erkennen", detailEn: "8 min: identify subject, finite verb and remaining information." },
      { phase: "Aussagen bauen", detailEn: "10 min: order word cards; contrast subject-first and time-first clauses." },
      { phase: "Fragen bilden", detailEn: "12 min: convert statements into yes/no and W-questions." },
      { phase: "Partnerfragen", detailEn: "10 min: ask and answer personal questions from pictures." },
      { phase: "Korrektur und Abschluss", detailEn: "10 min: repair word order, then make three statements and two questions without help." },
    ],
    wrapUpTaskDe: "Bilde drei eigene Aussagesätze, eine Ja-/Nein-Frage und eine W-Frage.",
  },
  "A1-3.6": {
    assignmentKind: "unverified",
    subtitle: "Published A1 Day 14 modal-verbs learning activity. Classroom sentence building is unscored; check the student page for any submission requirements.",
    parts: [
      { label: "Bedeutung", detailEn: "Choose können (ability), möchten (polite wish), wollen (intention) or müssen (necessity) in real A1 situations." },
      { label: "Satzbau", detailEn: "Build complete statements: subject + conjugated modal + details + infinitive at the end; also practise a time-first statement." },
      { label: "Sprechen und Schreiben", detailEn: "Reorder words, correct common mistakes, ask short questions and produce four personal statements without copying a model." },
    ],
    teacherNotesEn: [
      "Reuse the familiar Day 4 A1 presenter flow: short visual/context cues, one clear rule, supported examples, guided word-order tasks, independent production and feedback.",
      "The main goal is constructing sentences, not reciting a list of modal meanings. Require an audible or written complete sentence on every practice round.",
      "Prioritise möchten and können; add wollen for a direct intention and müssen for everyday necessity. Do not expand into the full six-modal-verb system.",
      "Keep the sentence frame visible: Ich | möchte | heute Deutsch lernen. The finite modal occupies position two; the action verb stays in infinitive at the end without zu.",
      "Show the difference between polite möchten (Ich möchte Wasser trinken) and stronger wollen (Ich will Wasser trinken), without claiming one is always wrong.",
      "Teach only common present-tense forms: ich kann/möchte/will/muss; du kannst/möchtest/willst/musst; er/sie kann/möchte/will/muss; wir können/möchten/wollen/müssen.",
      "Students first rebuild sentences, then choose the suitable modal from a situation, then create their own sentences and one question without hints.",
      "Keep the existing Day 14 published music and workbook references. Do not invent a scored Hören, writing submission, or tutor-marked section.",
    ],
    grammarTeachingSections: [
      {
        title: "1 · Was möchtest du? Was kannst du?",
        items: [
          "Bildidee: eine Tasse Wasser → Ich möchte Wasser trinken. (polite wish)",
          "Bildidee: Deutschbuch → Ich kann Deutsch lesen. (ability)",
          "Bildidee: Bahnhof → Ich will nach Berlin fahren. (intention)",
          "Bildidee: Hausaufgaben → Ich muss heute lernen. (necessity)",
        ],
      },
      {
        title: "2 · Die Satzklammer: Modalverb + Infinitiv",
        items: [
          "SUBJEKT | MODALVERB (Position 2) | ERGÄNZUNG | INFINITIV (am Ende)",
          "Ich | möchte | heute Deutsch | lernen.",
          "Sie | kann | gut | schwimmen. · Wir | müssen | jetzt | gehen.",
          "Heute | will | ich Deutsch | lernen. (Auch mit Heute bleibt das Modalverb auf Position 2.)",
          "Der zweite Verbteil bleibt ein Infinitiv ohne zu: sprechen, lernen, gehen, trinken.",
        ],
      },
      {
        title: "3 · Die vier Modalverben: Formen für A1",
        items: [
          "können: ich kann · du kannst · er/sie kann · wir können",
          "möchten: ich möchte · du möchtest · er/sie möchte · wir möchten",
          "wollen: ich will · du willst · er/sie will · wir wollen",
          "müssen: ich muss · du musst · er/sie muss · wir müssen",
          "Du/Sie-Frage: Kannst du morgen kommen? · Möchten Sie Wasser trinken?",
        ],
      },
      {
        title: "4 · Können und möchten: Sätze bauen",
        items: [
          "Wortkarten: kann / Deutsch / sprechen / Ich → Ich kann Deutsch sprechen.",
          "Wortkarten: ein Buch / lesen / möchte / Anna → Anna möchte ein Buch lesen.",
          "Wähle selbst: Du hast Durst. → Ich möchte Wasser trinken.",
          "Wähle selbst: Du sprichst zwei Sprachen. → Ich kann Deutsch und Englisch sprechen.",
        ],
      },
      {
        title: "5 · Wollen und müssen: Sätze bauen",
        items: [
          "Wortkarten: heute / ich / arbeiten / muss → Ich muss heute arbeiten.",
          "Wortkarten: will / am Samstag / spielen / Er / Fußball → Er will am Samstag Fußball spielen.",
          "Was ist der Unterschied? Ich möchte ein Eis essen. (polite wish) / Ich will ein Eis essen. (direct intention)",
          "Situation: Morgen ist ein Test. → Ich muss heute lernen.",
        ],
      },
      {
        title: "6 · Fehler finden und Fragen bilden",
        items: [
          "✗ Ich kann spreche Deutsch. ✓ Ich kann Deutsch sprechen.",
          "✗ Ich möchte trinken Wasser. ✓ Ich möchte Wasser trinken.",
          "✗ Heute ich muss arbeiten. ✓ Heute muss ich arbeiten.",
          "Aussage: Du kannst schwimmen. → Frage: Kannst du schwimmen?",
          "W-Frage: Was möchtest du essen? → Ich möchte Reis essen.",
        ],
      },
      {
        title: "7 · Du bist dran: vier eigene Sätze",
        items: [
          "Ich kann ... (eine Fähigkeit) · Ich möchte ... (einen höflichen Wunsch)",
          "Ich will ... (einen Plan) · Ich muss ... (eine Pflicht)",
          "Jetzt ohne Vorlage: Sage oder schreibe vier vollständige Sätze aus deinem eigenen Alltag.",
          "Stelle deinem Partner eine Frage mit kannst oder möchtest und antworte in einem vollständigen Satz.",
          "Checke selbst: Ist das Modalverb richtig konjugiert? Steht der Infinitiv ganz am Ende?",
        ],
      },
    ],
    studentQuestionsDe: [
      "Bilde einen vollständigen Satz mit können und sprechen.",
      "Du bist durstig. Sage einen höflichen Wunsch mit möchten und trinken.",
      "Bilde einen Satz mit wollen und am Wochenende.",
      "Bilde einen Satz mit müssen und Hausaufgaben.",
      "Ordne: heute / Deutsch / ich / lernen / möchte.",
      "Korrigiere: Heute ich muss arbeiten.",
      "Bilde eine Frage mit können und schwimmen.",
    ],
    flow: [
      { phase: "Vier Alltagssituationen", detailEn: "6 min: use familiar picture/context prompts; students match ability, polite wish, plan and necessity to the correct modal." },
      { phase: "Satzklammer verstehen", detailEn: "7 min: identify subject, conjugated modal in position two and final infinitive in color-coded example sentences." },
      { phase: "Formen automatisieren", detailEn: "5 min: say ich/du/er/wir forms of the four target verbs; avoid extended grammar tables." },
      { phase: "Wortkarten: zwei Stufen", detailEn: "12 min: first reorder supplied word cards, then select the correct modal from a real-life situation." },
      { phase: "Fehler korrigieren und fragen", detailEn: "9 min: correct word order or conjugation; turn one statement into a yes/no question and answer it." },
      { phase: "Persönlicher Transfer", detailEn: "10 min: each student says or writes four original sentences (one per modal) and asks a partner a question." },
      { phase: "Exit ohne Hilfe", detailEn: "6 min: use a fresh prompt; check modal meaning, correct form, position two and final infinitive." },
    ],
    wrapUpTaskDe: "Bilde vier eigene Aussagesätze mit können, möchten, wollen und müssen. Stelle danach eine Frage mit können oder möchten. Benutze in jedem Satz einen Infinitiv am Ende.",
  },
  "A1-4.7": {
    assignmentKind: "unverified",
    subtitle: "Imperativ und höfliche Bitten: a short introduction to Teil 1 and 2, then focused Goethe A1 Sprechen Teil 3 picture-card practice. The full mock stays at A1-5.9.",
    parts: [
      { label: "Teil 1 · Sich vorstellen", detailEn: "Briefly recognise the self-introduction format; not assessed in depth today." },
      { label: "Teil 2 · Fragen und Antworten", detailEn: "Briefly recognise simple topic questions and answers; not assessed in depth today." },
      { label: "Teil 3 · Bitten und reagieren", detailEn: "Use the Sie imperative and Können Sie / Könnten Sie for polite requests, then react to a partner." },
    ],
    teacherNotesEn: [
      "Day 15 teaches the imperative first and applies it to Goethe A1 Sprechen Teil 3. Teil 1 and Teil 2 each receive only a brief orientation on page 1.",
      "Contrast a statement with a polite Sie imperative: Sie öffnen die Tür → Öffnen Sie bitte die Tür. Show du and ihr briefly; use Sie for main practice.",
      "For separable verbs, teach Machen Sie das Radio aus. Then transform to Können Sie bitte das Radio ausmachen? The infinitive stays together at the end after können.",
      "Present Könnten Sie as a memorisable polite request formula, not a full Konjunktiv II lesson. Distinguish it from past-tense konnten.",
      "On page 9, the existing student picker must show only an object card until the learner says a full request and a matching reaction. Accept both imperative and können/könnten requests, not just the model.",
      "Page 11 retains the published song Ich bin bereit zu sprechen; page 12 uses the eleventh unseen Fenster card as an independent Teil 3 check and links to the existing unscored workbook. The full A1-5.9 mock stays separate.",
    ],
    studentQuestionsDe: A1_TEIL3_OBJECT_CARDS.slice(0, 10).map((card) => `Bildkarte: ${card.objectDe}. Formuliere eine höfliche Bitte und reagiere passend.`),
    flow: [
      { phase: "Prüfung kurz vorstellen", detailEn: "3 min: name Teil 1/2 and centre Teil 3." },
      { phase: "Imperativ lernen", detailEn: "15 min: polite Sie imperative, a short du/ihr comparison and separable commands." },
      { phase: "Höfliche Fragen", detailEn: "11 min: turn commands into Können Sie and Könnten Sie requests; make sentences independently." },
      { phase: "Bildkarten", detailEn: "15 min: object/verb associations; one hidden-answer request and reaction per selected student." },
      { phase: "Reaktionen und Fehler", detailEn: "6 min: positive and negative responses; fix word order and separable-verb mistakes." },
      { phase: "Musik und Abschluss", detailEn: "10 min: approved song, then fresh picture-card request and partner reaction with no model first." },
    ],
    wrapUpTaskDe: "Teil 3: Bilde zu einer neuen Bildkarte eine höfliche Bitte im Imperativ oder mit Können Sie / Könnten Sie. Reagiere anschließend passend auf eine andere Bitte.",
  }
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
