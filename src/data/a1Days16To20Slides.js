import { A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT } from "./a1PublishedWorkbookRoutes.js";

// The Course Book URLs are taken from the published A1 assignment registry.
// Answer-key-backed/AI-writing tasks can be scored without being tutor-marked;
// do not claim tutor marking unless a verified lesson explicitly establishes it.
// Preserve A1-5.9: that day runs its OWN Goethe exam-readiness experience.
const plans = Object.freeze({
  "A1-9": {
    subtitle: "A1 Day 16 · food and negation Course Book assignment; existing answer-key marking applies.",
    parts: [{ label: "Food and negation exercises", detailEn: "Choose kein, keine, keinen or nicht in familiar food/drink sentences. The answer key is for the published task, not new slide marks." }],
    notes: [
      "This is one of two separate Day 16 lessons; the second is A1-10 on daily routines.",
      "Teach kein/keine/keinen for noun negation and nicht for verb/adjective negation.",
      "The published objective assignment uses an answer key. Do not represent it as a tutor-marked submission without further evidence.",
    ],
    questions: [
      "Ergänze: „Ich habe ___ Milch.“",
      "Was passt zu Käse: keinen oder nicht?",
      "Ergänze: „Die Suppe ist ___ warm.“",
      "Was ist der Unterschied zwischen kein und nicht?",
    ],
    flow: [
      ["Wortschatz erkennen", "7 min: identify food nouns, their articles and the adjective warm."],
      ["Kein oder nicht?", "9 min: sort whether an example negates a noun, a verb or an adjective."],
      ["Endungen prüfen", "9 min: choose kein/keine/keinen in short nominative/accusative food examples."],
      ["Fehler korrigieren", "10 min: correct two authentic-looking wrong kein/nicht sentences and reveal the lesson rule."],
      ["Course Book übertragen", "10 min: preview the exact published A1-9 food-negation assignment without inventing additional sections."],
    ],
    exit: "Ergänze: „Ich habe ___ Milch, ich esse ___ Käse und die Suppe ist ___ warm.“",
  },
  "A1-10": {
    subtitle: "A1 Day 16 · food and daily routine Course Book assignment; existing answer-key marking applies.",
    parts: [{ label: "Essen und Alltag", detailEn: "Understand basic meal/routine sentences, time expressions, gern and position-two conjugated verbs." }],
    notes: [
      "This is the distinct second Day 16 block. Do not merge its requirements with A1-9 food-negation exercises.",
      "Check morning/midday/evening phrases, the conjugated verb in position two and separable aufstehen.",
      "The published A1-10 objective task has answer-key marking; no separate tutor-marked requirement has been verified.",
    ],
    questions: [
      "Was ist richtig: Morgens esse ich oder Morgens ich esse?",
      "Ergänze: „Um sieben Uhr ___ ich auf.“",
      "Was bedeutet gern in „Ich koche gern“?",
      "Welche Zeit kommt zuerst, morgens oder abends?",
    ],
    flow: [
      ["Tagesablauf ordnen", "8 min: recognise morgens, mittags and abends, and place routine actions in order."],
      ["Verb auf Position 2", "10 min: correct simple time-first food and routine statements."],
      ["Trennbares Verb prüfen", "8 min: complete Um sieben Uhr stehe ich auf and identify the prefix."],
      ["Gern erkennen", "8 min: distinguish a liked action from a food item in a short sentence."],
      ["Course Book übertragen", "10 min: open the published A1-10 assignment; verify the page's actual instructions rather than adding a role-play."],
    ],
    exit: "Korrigiere die Wortstellung: „Morgens ich esse Brot. Um sieben Uhr ich stehe auf.“",
  },
  "A1-11": {
    subtitle: "A1 Day 17 · published directions assignment with reference answers for Teil 1 Lesen and Teil 2 Hören.",
    parts: [
      { label: "Teil 1 · Lesen", detailEn: "Use route and direction vocabulary in the published reading-comprehension task." },
      { label: "Teil 2 · Hören", detailEn: "Listen for route and location information in the published Hören task. Do not treat the reading text as the audio." },
    ],
    notes: [
      "The A1-11 answer-key manifest confirms Teil 1 Lesen and Teil 2 Hören, not a graded classroom role-play.",
      "Teach the polite Sie-imperative as verb + Sie: Gehen Sie, Überqueren Sie, Biegen Sie ... ab.",
      "Preserve direct-place questions with zum Bahnhof and zur Apotheke; check understanding before giving a short model route.",
    ],
    questions: [
      "Was bedeutet geradeaus?",
      "Bilde den höflichen Imperativ: „links abbiegen“.",
      "Ergänze: „Wie komme ich ___ Bahnhof?“",
      "Was passiert mit ab in „Biegen Sie rechts ab“?",
    ],
    flow: [
      ["Richtungswörter prüfen", "8 min: distinguish links, rechts, geradeaus, Kreuzung and Straße."],
      ["Sie-Imperativ verstehen", "9 min: recognise verb-first Gehen Sie / Überqueren Sie and why abbiegen separates."],
      ["Frage nach dem Weg", "8 min: complete zum Bahnhof and zur Apotheke without a long partner dialogue."],
      ["Mini-Route ordnen", "10 min: reorder three provided direction sentences and check the destination words."],
      ["Lesen/Hören transfer", "10 min: preview the real published Lesen and Hören sections; no invented conversation marking."],
    ],
    exit: "Ergänze: „___ Sie geradeaus; ___ Sie links ___; ___ Sie die Straße.“",
  },
  "A1-12.1": {
    subtitle: "A1 Day 18 · Wechselpräpositionen: Dativ (Wo?) versus Akkusativ (Wohin?), verb pairs, case articles and error correction.",
    parts: [
      { label: "Teil 1 · Fälle erkennen", detailEn: "Identify the case in paired sentences: liegen/legen, stehen/stellen, sitzen/setzen, hängen/hängen." },
      { label: "Teil 2 · Artikel einsetzen", detailEn: "Select masculine, feminine, neuter and plural articles in Wo?/Wohin? pairs; explain dem/den and der/die." },
      { label: "Teil 3 · Fehler korrigieren", detailEn: "Correct sentences such as Ich gehe in der Schule and explain the destination versus location meaning." },
    ],
    notes: [
      "Teach the article grid: masculine der → Akkusativ den / Dativ dem; feminine die → Akkusativ die / Dativ der; neuter das → Akkusativ das / Dativ dem; plural die → Akkusativ die / Dativ den (+n where required).",
      "With two-way prepositions, Wohin? (destination/change of location) takes accusative and Wo? (existing position/location) takes dative. Motion within a location can still be dative: Ich laufe im Park.",
      "Contrast verb pairs: legen → liegen (lay/lie), stellen → stehen (place upright/stand), setzen → sitzen (seat/sit). Hängen can describe both hanging something and something hanging.",
      "Dative-only mit, bei and zu are a short separate note, not Wechselpräpositionen: mit dem Bus, bei der Arbeit, zum Arzt.",
    ],
    questions: [
      "Was ist Dativ, was ist Akkusativ? „Ich lege das Buch auf den Tisch.“ / „Das Buch liegt auf dem Tisch.“",
      "Legen oder liegen? Ergänze: „Ich ___ das Handy auf den Tisch. Das Handy ___ auf dem Tisch.“",
      "Stellen oder stehen? Ergänze: „Ich ___ den Stuhl neben die Tür. Der Stuhl ___ neben der Tür.“",
      "Welcher Artikel ist maskulin im Dativ: der, den oder dem? Und im Akkusativ?",
      "Korrigiere und begründe: „Ich gehe in der Schule.“ (Ziel: Schule).",
      "Ergänze: „Ich hänge das Bild an ___ Wand; das Bild hängt an ___ Wand.“",
      "Welcher Fall steht in „zwischen den Tischen“? Warum kommt bei Tischen ein -n?",
      "Warum ist „Ich fahre mit dem Bus“ Dativ, obwohl ich mich bewege?",
    ],
    flow: [
      ["Fälle und Artikel", "8 min: students complete der → den/dem; die → die/der; das → das/dem; plural die → die/den."],
      ["Verbpaare zuordnen", "8 min: compare legen/liegen, stellen/stehen, setzen/sitzen with destination and location sentences."],
      ["Wo? oder Wohin?", "9 min: choose cases and articles for in die/der Schule, auf den/dem Tisch, an die/der Wand."],
      ["Fehler finden", "10 min: correct Ich gehe in der Schule → Ich gehe in die Schule and Ich bin in die Schule → Ich bin in der Schule."],
      ["Dativ allein + Transfer", "10 min: review mit, bei, zu as dative-only, then solve the published workbook activities."],
    ],
    exit: "Bestimme Fall und Artikel: „Ich lege das Buch auf ___ Tisch; es liegt auf ___ Tisch.“ Korrigiere „Ich gehe in der Schule.“ Erkläre legen/liegen und den/dem.",
  },
  "A1-12.2": {
    subtitle: "A1 Day 18 · Berufe und Präpositionen Course Book assignment. Existing answer key has three parts.",
    parts: [
      { label: "Teil 1", detailEn: "Follow the first published set of professions/preposition questions." },
      { label: "Teil 2", detailEn: "Use the next actual task; distinguish professional role from employer." },
      { label: "Teil 3", detailEn: "Complete the published final part on work context and destination language." },
    ],
    notes: [
      "Legacy 12.2 teaching material: teach this grammar within the combined A1-12.1 lesson. Do not assign a separate 12.2 exercise.",
      "Teach als + profession, bei + employer, in + workplace, zur Arbeit + direction with short recognisable sentences.",
      "All three learner parts are answer-key-backed but there is no proof of manual tutor marking in the source.",
    ],
    questions: [
      "Welches Wort passt zu „Ich arbeite ___ Lehrer“?",
      "Wie ergänzt man „Sie arbeitet ___ einer Bank“?",
      "Ist „in einem Krankenhaus“ ein Beruf oder Arbeitsplatz?",
      "Ergänze: „Ich fahre ___ Arbeit.“",
    ],
    flow: [
      ["Rolle erkennen", "7 min: identify Beruf versus Arbeitsort using Lehrer and Krankenhaus."],
      ["Als oder bei?", "9 min: match profession with als and employer with bei."],
      ["In oder zur?", "9 min: distinguish where a person works from travelling to work."],
      ["Satzfehler beheben", "10 min: correct two mixed-up prepositions without a job interview."],
      ["Workbook übertragen", "10 min: open the combined 12.1 grammar notes, then retain the current 12.1 exercise. No separate 12.2 submission."],
    ],
    exit: "Ergänze die vier Wörter: „___ Lehrer, ___ einer Bank, ___ einem Krankenhaus, ___ Arbeit“.",
  },
  "A1-12.3": {
    subtitle: "A1 Day 20 · writing assignment with Teil 1 informal and Teil 2 formal messages; existing writing review applies.",
    parts: [
      { label: "Teil 1 · Informeller Brief", detailEn: "Birthday message: congratulate, ask about the party, ask whether family may come. Use informal greeting and closing." },
      { label: "Teil 2 · Formeller Brief", detailEn: "Language-school enquiry: ask course start, course price and whether online payment is possible. Use formal greeting and closing." },
    ],
    notes: [
      "The published writing task has two AI-written-response-reviewed parts, not a role-play or a claim of manual tutor marking.",
      "Both tasks demand exactly three content points; greeting, closing and name are letter form, not extra content points.",
      "Do not mix du and Sie. Ask students to tick all three published bullets before writing the closing.",
    ],
    questions: [
      "Wie viele Inhaltspunkte brauchst du in jeder A1-Nachricht?",
      "Zählen Anrede, Grußformel und Name als Inhaltspunkte?",
      "Was sind die drei Punkte im Geburtstagsbrief?",
      "Welche drei Fragen stellt man der Sprachschule?",
    ],
    flow: [
      ["Briefart erkennen", "7 min: classify Liebe Anna versus Sehr geehrte Damen und Herren."],
      ["Briefform prüfen", "8 min: sort greeting/closing/name from the three required content bullets."],
      ["Drei Inhaltspunkte", "10 min: identify the three birthday prompts and three language-school questions separately."],
      ["Kontrolliertes Schreiben", "10 min: rebuild two short task sentences and check du/Sie register."],
      ["Schreibaufgabe übertragen", "10 min: open the published informal/formal parts; use the existing writing review workflow, not a new progress tracker."],
    ],
    exit: "Ordne Anrede, genau drei Inhaltspunkte, Grußformel und Name. Welche Frage fragt nach Online-Bezahlung?",
  },
});

export const A1_DAYS16_TO20_SLIDE_ASSIGNMENTS = Object.freeze(Object.keys(plans));

export function enhanceA1Days16To20Slide(slide = {}) {
  const id = String(slide.assignmentId || "").trim().toUpperCase();
  const plan = plans[id];
  if (!plan) return slide; // especially preserve A1-5.9 Goethe mock exactly
  const workbookUrl = A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT[id];
  if (!workbookUrl) throw new Error(id + ": no verified published learner destination");
  return {
    ...slide,
    ...(id === "A1-12.1" ? { title: "A1 Day 18 · Two-Way and Dative Prepositions", topic: "12.1 Two-Way and Dative Prepositions" } : {}),
    ...(id === "A1-12.1" ? {
      teacherSupport: {
        ...(slide.teacherSupport || {}),
        grammarFocusEn: ["Two-way prepositions: Wo? + dative, destination Wohin? + accusative.", "Dative-only mit, bei and zu: mit dem Bus, beim Arzt, zum Arzt, zur Arbeit. Movement alone is not the rule."],
        modelExamplesDe: ["Das Buch liegt auf dem Tisch.", "Ich lege das Buch auf den Tisch.", "Ich fahre mit dem Bus.", "Ich bin beim Arzt.", "Ich gehe zum Arzt.", "Wir fahren zur Arbeit."],
      },
    } : {}),
    studentQuestionsDe: plan.questions,
    teacherNotesEn: plan.notes,
    interactionFlow: plan.flow.map(([phase, detailEn]) => ({ phase, detailEn })),
    wrapUpTaskDe: plan.exit,
    workbookConnection: {
      ...(slide.workbookConnection || {}),
      workbookUrl,
      subtitle: plan.subtitle,
      parts: plan.parts,
    },
  };
}
