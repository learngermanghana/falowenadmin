import { A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT } from "./a1PublishedWorkbookRoutes.js";

// The Course Book URLs are taken from the published A1 assignment registry.
// Answer-key-backed/AI-writing tasks can be scored without being tutor-marked;
// do not claim tutor marking unless a verified lesson explicitly establishes it.
// Preserve A1-5.9: that day runs its OWN Goethe exam-readiness experience.
const plans = Object.freeze({
  "A1-9": {
    subtitle: "A1 Day 16 · Essen und Verneinung (kein/nicht). The existing published Course Book exercises and answer-key marking remain unchanged.",
    parts: [{ label: "Food and negation exercises", detailEn: "Choose kein, keine, keinen or nicht in familiar food/drink sentences. This is the existing answer-key assignment, not a new slide mark." }],
    notes: [
      "The new projector lesson has exactly twelve pages: eight visual grammar/vocabulary pages, one live student check, error correction, a combined Falowen Music and Lesen page, and the original Course Book bridge.",
      "A1-9 (negation) is the first of two Day 16 blocks. A1-10 (daily routines) stays separate, with its own learner route and score rules.",
      "Start with positive/negative food sentences. Compare kein/keine/keinen for nouns to nicht for actions, adjectives and definite noun phrases.",
      "Use Nominativ and Akkusativ with clear food examples; pay particular attention to der Käse / keinen Käse, die Milch / keine Milch and das Brot / kein Brot.",
      "Use the existing ten student questions with teacher-controlled answer reveals and the independent final check; never reveal the answer before the response.",
      "The original published Day 16 song is reused via its approved recording configuration, not a newly invented audio source. The verified Lesen passage is accessible independently on the same page.",
      "The published A1-9 assessment remains answer-key-backed. Do not create tutor marks, a second workbook, or new score submissions.",
    ],
    questions: [
      "Ergänze: „Ich habe ___ Milch.“",
      "Was passt zu Käse: keinen oder nicht?",
      "Ergänze: „Die Suppe ist ___ warm.“",
      "Was ist der Unterschied zwischen kein und nicht?",
    ],
    flow: [
      ["Essen und Artikel", "8 min: recognise positive/negative food sentences and the articles der, die, das."],
      ["Kein oder nicht", "9 min: compare noun negation with action and adjective negation."],
      ["Kein-Endungen", "10 min: compare nominative and accusative kein, keine and keinen using food objects."],
      ["Satzbau", "9 min: choose the correct form in controlled, interactive A1 sentences."],
      ["Individuell prüfen", "10 min: existing student picker, one distinct negation question per learner."],
      ["Fehler, Musik und Lesen", "12 min: correct real-looking mistakes and switch between the existing published song and verified reading activity."],
      ["Abschluss", "3 min: independent negation exit check, then open the existing Course Book assignment."],
    ],
    exit: "Ergänze ohne Hilfe: „Ich habe ___ Milch, ich esse ___ Käse und die Suppe ist ___ warm.“",
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
    subtitle: "A1 Day 17 · instructions, directions, prohibitions and permission. New classroom exam practice is ungraded; the published A1-11 workbook stays unchanged.",
    parts: [
      { label: "Teil 1 · Sprechen", detailEn: "Draw one picture card and record one polite Goethe A1 Teil 3 request using the existing speaking checkpoint." },
      { label: "Teil 2 · Hören", detailEn: "Listen to the actual published Hören recording and answer its questions." },
      { label: "Teil 3 · Lesen: Wegbeschreibung", detailEn: "Complete the existing Richtig/Falsch route exercise. Do not create a new score or answer key." },
    ],
    notes: [
      "The dedicated 12-page classroom lesson teaches formal Sie only; begin with visuals, then practise routes and the separable verb abbiegen.",
      "Teach Rauchen ist verboten, Parken ist erlaubt, Man darf hier nicht rauchen and Darf ich hier parken? as functional A1 phrases.",
      "Use signs for reading and speaking Teil 3: Bitte rauchen Sie hier nicht! – Entschuldigung. Accept meaningful alternative polite requests and appropriate reactions.",
      "The Hören dialogue is teacher-read; the existing published Day 17 song remains available on the same page. No new paid audio or marking service.",
      "The class mini-exam is ungraded classroom practice. Preserve the current published workbook, versioned answer key and existing grading rules.",
    ],
    questions: [
      "Wie komme ich zum Bahnhof?",
      "Bilden Sie den Imperativ: links abbiegen.",
      "Was bedeutet Rauchen verboten?",
      "Formulieren Sie eine Bitte: hier nicht fotografieren.",
      "Fragen Sie nach Erlaubnis: hier parken.",
    ],
    flow: [
      ["Einstieg und Richtungen", "8 min: signs and direction vocabulary."],
      ["Sie-Imperativ und Übung", "10 min: verb first, Sie second, ab at the end."],
      ["Nach dem Weg fragen und Stadtplan", "10 min: ask and give directions using the town map."],
      ["Verboten, erlaubt und dürfen", "11 min: understand signs, express prohibition and ask permission."],
      ["Lesen und Sprechen Teil 3", "12 min: true/false public notices and picture-card requests."],
      ["Hören und Mini-Prüfung", "9 min: teacher-read dialogue, exit check and unchanged workbook."],
    ],
    exit: "Fragen Sie nach dem Bahnhof. Geben Sie Anweisungen. Formulieren Sie eine höfliche Bitte zum Rauchverbot und fragen Sie nach Erlaubnis zum Parken.",
  },
  "A1-12.1": {
    subtitle: "A1 Day 18 · Wechselpräpositionen: nine two-way prepositions, Wo? / Wohin?, article changes and sentence transformations.",
    parts: [
      { label: "Teil 1 · Fälle erkennen", detailEn: "Identify the case in paired sentences: liegen/legen, stehen/stellen, sitzen/setzen, hängen/hängen." },
      { label: "Teil 2 · Artikel einsetzen", detailEn: "Select masculine, feminine, neuter and plural articles in Wo?/Wohin? pairs; explain dem/den and der/die." },
      { label: "Teil 3 · Fehler korrigieren", detailEn: "Correct sentences such as Ich gehe in der Schule and explain the destination versus location meaning." },
    ],
    notes: [
      "Teach the article grid: masculine der → Akkusativ den / Dativ dem; feminine die → Akkusativ die / Dativ der; neuter das → Akkusativ das / Dativ dem; plural die → Akkusativ die / Dativ den (+n where required).",
      "With two-way prepositions, Wohin? (destination/change of location) takes accusative and Wo? (existing position/location) takes dative. Motion within a location can still be dative: Ich laufe im Park.",
      "Contrast verb pairs: legen → liegen (lay/lie), stellen → stehen (place upright/stand), setzen → sitzen (seat/sit). Hängen can describe both hanging something and something hanging.",
      "Keep mit, bei and zu outside the core classroom practice; they are not Wechselpräpositionen.",
    ],
    questions: [
      "Was ist Dativ, was ist Akkusativ? „Ich lege das Buch auf den Tisch.“ / „Das Buch liegt auf dem Tisch.“",
      "Legen oder liegen? Ergänze: „Ich ___ das Handy auf den Tisch. Das Handy ___ auf dem Tisch.“",
      "Stellen oder stehen? Ergänze: „Ich ___ den Stuhl neben die Tür. Der Stuhl ___ neben der Tür.“",
      "Welcher Artikel ist maskulin im Dativ: der, den oder dem? Und im Akkusativ?",
      "Korrigiere und begründe: „Ich gehe in der Schule.“ (Ziel: Schule).",
      "Ergänze: „Ich hänge das Bild an ___ Wand; das Bild hängt an ___ Wand.“",
      "Welcher Fall steht in „zwischen den Tischen“? Warum kommt bei Tischen ein -n?",
      "Warum ist „Ich laufe im Park“ Dativ, obwohl ich mich bewege?",
    ],
    flow: [
      ["Einstieg und neun Präpositionen", "9 min: compare location and destination with local diagrams."],
      ["Regel und Artikel", "10 min: contrast Wo? and Wohin?, including movement within a place, then practise all four article groups."],
      ["Verbpaare und Satztraining", "14 min: contrast four verb pairs and transform sentences in both directions."],
      ["Vergleich und Quick Practice", "9 min: compare all nine prepositions and choose eight articles."],
      ["Zimmer und Fehlerkorrektur", "10 min: describe and rearrange furniture, then correct five sentences."],
      ["Einzelcheck und Mini-Prüfung", "8 min: use the existing student picker and independent six-question exit check; open the published workbook."],
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
    subtitle: "A1 Day 20 · two short messages of approximately 30 words: informal invitation and formal summer-course enquiry. Existing writing review applies.",
    parts: [
      { label: "Teil 1 · Informeller Brief", detailEn: "Invite Julia to a weekend party; give day, clock time and place; ask her to bring food or drinks." },
      { label: "Teil 2 · Formeller Brief", detailEn: "Write to Sprachakademie München: say you want to register for a summer German course, ask for course times and costs, and say when you would like to begin." },
    ],
    notes: [
      "The published A1-12.3-INVITATION-COURSE-V2 writing contract has two AI-written-response-reviewed messages. Do not change marking or give students a ready-made workbook answer.",
      "Each message has three content points. One point can contain several required details; greeting, closing and name are letter form, not additional content points.",
      "Keep du/Sie consistent. Simple suitable A1 sentences suffice; connectors are useful, not an extra required point.",
    ],
    questions: [
      "Wie viele Inhaltspunkte brauchst du in jeder A1-Nachricht?",
      "Zählen Anrede, Grußformel und Name als Inhaltspunkte?",
      "Welche Angaben gehören zu Tag, Uhrzeit und Ort einer Einladung?",
      "Wie fragst du nach Kurszeiten und Kosten?",
      "Wie sagst du, wann du mit einem Kurs beginnen möchtest?",
    ],
    flow: [
      ["Briefart, Aufbau und Redemittel", "12 min: classify formal/informal, distinguish letter form and three points, compare useful expressions."],
      ["Aufgaben verstehen und Sätze bilden", "12 min: identify all details in three points and transform instructions into short sentences."],
      ["Zwei Modellbriefe", "10 min: students write before revealing parallel invitation and course examples."],
      ["Konnektoren und Fehlerkorrektur", "9 min: compare und, aber, denn, weil and repair five typical mistakes."],
      ["Einzelcheck", "4 min: one original sentence per selected learner through the existing picker."],
      ["Mini-Prüfung", "10 min: write approximately 30 words independently; reveal only after the round."],
      ["Checkliste und Workbook", "3 min: check register, all details, letter form and open the unchanged workbook."],
    ],
    exit: "Prüfe Anrede, alle drei Inhaltspunkte mit allen verlangten Details, du/Sie, Verbposition, Grußformel und Name.",
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
    ...(id === "A1-12.1" ? { title: "A1 Day 18 · Wechselpräpositionen – Wo? oder Wohin?", topic: "12.1 Wechselpräpositionen – Wo? oder Wohin?" } : {}),
    ...(id === "A1-12.1" ? {
      objective: "Students transform location statements into destination statements and back, choosing the correct verb and case article with all nine Wechselpräpositionen.",
      keyPhrasesDe: ["Das Buch liegt auf dem Tisch.", "Ich lege das Buch auf den Tisch.", "Das Bild hängt an der Wand.", "Ich hänge das Bild an die Wand.", "Ich laufe im Park.", "Ich gehe in den Park."],
      estimatedDuration: "60 minutes",
      teacherSupport: {
        ...(slide.teacherSupport || {}),
        grammarFocusEn: ["Nine two-way prepositions: Wo? + dative, destination Wohin? + accusative.", "Transform the verb, subject/object and article; movement within a location can still be dative."],
        modelExamplesDe: ["Das Buch liegt auf dem Tisch.", "Ich lege das Buch auf den Tisch.", "Die Flasche steht auf dem Tisch.", "Ich stelle die Flasche auf den Tisch.", "Ich laufe im Park.", "Ich gehe in den Park."],
      },
    } : {}),
    ...(id === "A1-12.3" ? { title: "A1 Day 20 · Einführung ins Briefeschreiben", topic: "12.3 Formelle und informelle Nachrichten", estimatedDuration: "60 minutes", objective: "Students turn three examination bullet points into short complete A1 sentences, cover every requested detail and use consistent formal or informal register.", keyPhrasesDe: ["Liebe Anna,", "Ich lade dich zum Essen ein.", "Wir essen am Freitag um 19 Uhr bei mir.", "Sehr geehrte Damen und Herren,", "Wann findet der Kurs statt und wie viel kostet er?", "Ich möchte im August beginnen.", "Mit freundlichen Grüßen"] } : {}),
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
