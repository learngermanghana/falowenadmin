// A2 Day 21 · teacher-led weekend planning Hören (Lisa und Tom).
// The supplied recording repeats the dialogue twice; show one readable transcript.
// This ungraded classroom activity is separate from the graded workbook Hören,
// whose protected key is a2/day-21/day-21.mp3 (Claudia and Thomas).
export const A2_DAY21_CLASSROOM_AUDIO_KEY = "a2/day-21/ein-wochenende-planen.mp3";

export const A2_DAY21_CLASSROOM_TRANSCRIPT = Object.freeze([
  ["A", "Hallo Lisa. Hast du am Wochenende schon etwas vor?"],
  ["B", "Hallo Tom! Nein, eigentlich nicht. Warum fragst du?"],
  ["A", "Das Wetter soll super werden. Wollen wir einen Ausflug machen?"],
  ["B", "Das klingt gut. Wohin möchtest du denn fahren?"],
  ["A", "Wir könnten an den See fahren und dort schwimmen."],
  ["B", "Ja, sehr gerne. Und am Abend können wir grillen."],
  ["A", "Perfekt. Sollen wir noch andere Freunde einladen?"],
  ["B", "Ja, frag doch bitte Anna und Mark."],
  ["A", "Mache ich. Um wie viel Uhr treffen wir uns am Samstag?"],
  ["B", "Um zehn Uhr am Bahnhof ist eine gute Zeit."],
  ["A", "Gut. Ich bringe Getränke und einen Salat mit."],
  ["B", "Ich kaufe das Fleisch und die Würstchen für den Grill."],
  ["A", "Super. Dann haben wir alles Wichtige organisiert."],
  ["B", "Freust du dich auch schon so auf das Wochenende?"],
  ["A", "Ja, total. Das wird bestimmt ein toller Tag."],
]);

const TRUTH_VALUES = Object.freeze(["Richtig", "Falsch"]);
const QUESTION_DATA = [
  { prompt: "Lisa hat schon Pläne für das Wochenende.", evidence: "Nein, eigentlich nicht.", answer: "Falsch" },
  { prompt: "Tom schlägt vor, an den See zu fahren.", evidence: "Wir könnten an den See fahren und dort schwimmen.", answer: "Richtig" },
  { prompt: "Am Abend wollen die beiden im Restaurant essen.", evidence: "Und am Abend können wir grillen.", answer: "Falsch" },
  { prompt: "Tom soll Anna und Mark einladen.", evidence: "Ja, frag doch bitte Anna und Mark.", answer: "Richtig" },
  { prompt: "Sie treffen sich am Samstag um elf Uhr.", evidence: "Um zehn Uhr am Bahnhof ist eine gute Zeit.", answer: "Falsch" },
];

export const A2_DAY21_CLASSROOM_QUESTIONS = Object.freeze(QUESTION_DATA.map(item => Object.freeze({
  prompt: item.prompt,
  evidence: item.evidence,
  answer: item.answer,
  options: TRUTH_VALUES,
  correctIndex: TRUTH_VALUES.indexOf(item.answer),
  hint: `Hörbeleg: „${item.evidence}“`,
  explanation: item.evidence,
})));

export const A2_DAY21_CLASSROOM_LISTENING = Object.freeze({
  level: "A2",
  day: 21,
  title: "Ein Wochenende planen · Lisa und Tom",
  audioKey: A2_DAY21_CLASSROOM_AUDIO_KEY,
  transcript: A2_DAY21_CLASSROOM_TRANSCRIPT,
  questions: A2_DAY21_CLASSROOM_QUESTIONS,
  suggestedMinutes: 6,
  playbackNote: "Die Aufnahme wiederholt den vollständigen Dialog zweimal (ca. 1:46 Minuten).",
  previewWords: ["einen Ausflug machen", "an den See fahren", "grillen", "der Treffpunkt"],
});
