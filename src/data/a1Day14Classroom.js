import { getA1Days11To15UnderstandingChecks } from "./a1Days11To15Understanding.js";

// A1 Day 14 · Chapter 3.6: a dedicated 12-page train/hotel modal-verbs lesson.
// Pages 1–10 are taught here; page 11 uses the existing published song;
// page 12 is the independent speaking and workbook transfer.
export const A1_DAY14_ASSIGNMENT = "A1-3.6";

const pages = [
  ["review", "01 · Wiederholung", "Aussagesätze bilden", 4],
  ["separable", "02 · Wiederholung", "Trennbare Verben", 4],
  ["train", "03 · Wortschatz", "Am Bahnhof", 5],
  ["hotel", "04 · Wortschatz", "Im Hotel", 5],
  ["meanings", "05 · Modalverben", "Können, möchten, wollen, müssen", 5],
  ["conjugation", "06 · Grammatik", "Vier Modalverben konjugieren", 5],
  ["sentence-frame", "07 · Satzbau", "Modalverb + trennbares Verb", 6],
  ["train-build", "08 · Satzwerkstatt", "Mit dem Zug fahren", 8],
  ["reservation", "09 · Sprechen", "Ein Hotelzimmer reservieren", 7],
  ["questions", "10 · Fragen", "Fragen und Antworten bilden", 6],
];

export const A1_DAY14_CLASSROOM_STAGES = Object.freeze(pages.map(([step, kicker, title, suggestedMinutes]) =>
  Object.freeze({
    id: step === "train-build" ? "grammar-check" : "a1-day14-" + step,
    type: "a1-day14",
    step, kicker, title, suggestedMinutes,
    items: step === "train-build"
      ? getA1Days11To15UnderstandingChecks(A1_DAY14_ASSIGNMENT)
      : [{ label: title, detail: "Guided A1 speaking and sentence building" }],
    teacherPurpose: {
      student: "Lies die Situation. Sage zuerst einen eigenen vollständigen Satz; dann erst die Lösung ansehen.",
      teacher: "Vor der Lösung jede Person sprechen lassen. Prüfe Bedeutung, Verbposition 2 und den Infinitiv am Ende. Keine automatische Benotung.",
    },
  }),
));

export const A1_DAY14_EXIT_STAGE = Object.freeze({
  id: "a1-day14-exit", type: "a1-day14", step: "exit",
  kicker: "12 · Abschluss", title: "Deine Reise nach Deutschland",
  suggestedMinutes: 8, items: [{ label: "Fünf Sätze und eine Hotelreservierung" }],
  teacherPurpose: {
    student: "Sage fünf eigene Sätze und spiele eine kurze Hotelreservierung ohne Vorlage.",
    teacher: "Erst selbstständig sprechen lassen. Prüfe vier Modalverben, trennbares Verb, Hotelwortschatz und eine passende Frage.",
  },
});

export const A1_DAY14_TRAIN_WORDS = Object.freeze([
  { icon: "🚆", word: "einsteigen", en: "board", model: "Ich steige in den Zug ein." },
  { icon: "🚉", word: "aussteigen", en: "get off", model: "Ich steige in Berlin aus." },
  { icon: "🔁", word: "umsteigen", en: "change trains", model: "Ich steige in Hamburg um." },
  { icon: "🚂", word: "der Zug", en: "train", model: "Der Zug fährt um acht Uhr." },
  { icon: "🏛️", word: "der Bahnhof", en: "station", model: "Ich bin am Bahnhof." },
  { icon: "🔢", word: "das Gleis", en: "platform / track", model: "Der Zug fährt von Gleis drei ab." },
  { icon: "🎫", word: "die Fahrkarte", en: "ticket", model: "Ich kaufe eine Fahrkarte." },
]);

export const A1_DAY14_HOTEL_WORDS = Object.freeze([
  { icon: "🛏️", word: "übernachten", en: "stay overnight", model: "Ich übernachte im Hotel." },
  { icon: "📞", word: "reservieren", en: "reserve", model: "Ich reserviere ein Zimmer." },
  { icon: "🗓️", word: "buchen", en: "book", model: "Wir buchen zwei Nächte." },
  { icon: "🔑", word: "das Zimmer", en: "room", model: "Haben Sie ein Zimmer frei?" },
  { icon: "🛌", word: "das Einzelzimmer", en: "single room", model: "Ich möchte ein Einzelzimmer buchen." },
  { icon: "🛏️🛏️", word: "das Doppelzimmer", en: "double room", model: "Wir möchten ein Doppelzimmer." },
  { icon: "🌙", word: "die Nacht", en: "night", model: "Ich möchte zwei Nächte bleiben." },
]);

export const A1_DAY14_MODALS = Object.freeze([
  { word: "können", form: "kann", meaning: "can / ability", icon: "💬", situation: "Du sprichst Deutsch.", example: "Ich kann Deutsch sprechen." },
  { word: "möchten", form: "möchte", meaning: "would like / polite wish", icon: "☕", situation: "Du möchtest Wasser.", example: "Ich möchte Wasser trinken." },
  { word: "wollen", form: "will", meaning: "want / intention", icon: "🧳", situation: "Du planst eine Reise.", example: "Ich will nach Berlin fahren." },
  { word: "müssen", form: "muss", meaning: "must / necessity", icon: "🔁", situation: "Du wechselst den Zug.", example: "Ich muss in Hamburg umsteigen." },
]);

export const A1_DAY14_CONJUGATIONS = Object.freeze([
  ["ich", "kann", "möchte", "will", "muss"],
  ["du", "kannst", "möchtest", "willst", "musst"],
  ["er / sie", "kann", "möchte", "will", "muss"],
  ["wir", "können", "möchten", "wollen", "müssen"],
  ["Sie", "können", "möchten", "wollen", "müssen"],
]);

// Each click-to-build challenge has ONE complete model order.
// The teacher's "Lösung zeigen" remains separate from checking the learner's attempt.
export const A1_DAY14_BUILD = Object.freeze({
  review: [
    { words: ["morgen", "nach Berlin", "Ich", "fahre"], answer: ["Ich", "fahre", "morgen", "nach Berlin"], model: "Ich fahre morgen nach Berlin." },
    { words: ["fahre", "ich", "Morgen", "nach Berlin"], answer: ["Morgen", "fahre", "ich", "nach Berlin"], model: "Morgen fahre ich nach Berlin." },
  ],
  separable: [
    { words: ["ein", "in den Zug", "steige", "Ich"], answer: ["Ich", "steige", "in den Zug", "ein"], model: "Ich steige in den Zug ein." },
    { words: ["um", "in Hamburg", "steige", "Ich"], answer: ["Ich", "steige", "in Hamburg", "um"], model: "Ich steige in Hamburg um." },
  ],
  "train-build": [
    { words: ["umsteigen", "in Hamburg", "muss", "Ich"], answer: ["Ich", "muss", "in Hamburg", "umsteigen"], model: "Ich muss in Hamburg umsteigen." },
    { words: ["in Berlin", "Wir", "aussteigen", "möchten"], answer: ["Wir", "möchten", "in Berlin", "aussteigen"], model: "Wir möchten in Berlin aussteigen." },
    { words: ["in den Zug", "einsteigen", "kann", "Er"], answer: ["Er", "kann", "in den Zug", "einsteigen"], model: "Er kann in den Zug einsteigen." },
    { words: ["nach Berlin", "fahren", "Heute", "will", "ich"], answer: ["Heute", "will", "ich", "nach Berlin", "fahren"], model: "Heute will ich nach Berlin fahren." },
  ],
});

export const A1_DAY14_CORRECTIONS = Object.freeze([
  ["Ich kann steige ein.", "Ich kann einsteigen.", "After a modal, einsteigen stays together in infinitive form."],
  ["Heute ich muss arbeiten.", "Heute muss ich arbeiten.", "The modal verb is in position two, even after Heute."],
  ["Ich möchte trinken Wasser.", "Ich möchte Wasser trinken.", "The action infinitive goes at the end."],
  ["Er müssen in Hamburg umsteigen.", "Er muss in Hamburg umsteigen.", "Use er muss, not er müssen."],
]);

export const A1_DAY14_QUESTIONS = Object.freeze([
  ["Du kannst morgen fahren.", "Kannst du morgen fahren?"],
  ["Ich möchte ein Zimmer buchen.", "Was möchtest du buchen?"],
  ["Du musst in Hamburg umsteigen.", "Musst du in Hamburg umsteigen?"],
  ["Sie möchte im Hotel übernachten.", "Wo möchte sie übernachten?"],
]);

export const A1_DAY14_HOTEL_DIALOGUE = Object.freeze([
  ["Gast", "Guten Tag. Ich ___ ein Einzelzimmer buchen.", "möchte"],
  ["Rezeption", "Für wie viele Nächte?", "Für zwei Nächte."],
  ["Gast", "___ ich hier zwei Nächte übernachten?", "Kann"],
  ["Rezeption", "Ja, wir haben ein Zimmer frei.", "Ja, das ist möglich."],
  ["Gast", "Vielen Dank!", "Gern geschehen."],
]);
