// A2 Day 20 · teacher-led Reklamation Hören, based on the uploaded recording
// and falowen-a2-hoeren-reklamationssituationen-questions-key.json.
// Student workbook tasks, marking and results remain untouched.
export const A2_DAY20_AUDIO_KEY = "a2/day-20/reklamation-falsches-hemd.mp3";

// The recording repeats the full conversation; the written transcript shows
// one complete dialogue, not two redundant copies.
export const A2_DAY20_TRANSCRIPT = Object.freeze([
  ["A", "Kundenservice Müller. Mein Name ist Claudia Weber. Was kann ich für Sie tun?"],
  ["B", "Guten Tag. Mein Name ist Thomas Klein. Ich habe gestern ein Hemd bei Ihnen im Online-Shop bestellt."],
  ["A", "Guten Tag, Herr Klein. Eine Bestellung von gestern. Worum geht es genau?"],
  ["B", "Das Paket ist heute angekommen, aber die Farbe ist leider falsch. Ich habe Blau bestellt, aber das Hemd ist grün."],
  ["A", "Das tut mir sehr leid. Da ist im Lager ein Fehler passiert. Sie möchten das Hemd sicher umtauschen."],
  ["B", "Ja, genau. Ich möchte das blaue Hemd haben."],
  ["A", "Kein Problem. Ich schicke Ihnen heute noch das richtige Hemd zu. Sie bekommen auch ein Rücksendeetikett per E-Mail."],
  ["B", "Prima. Vielen Dank für die schnelle Hilfe."],
  ["A", "Gern geschehen. Auf Wiederhören, Herr Klein."],
]);

const TRUTH_VALUES = Object.freeze(["Richtig", "Falsch"]);
const ITEMS = [
  {
    prompt: "Herr Klein hat das Hemd im Online-Shop bestellt.",
    answer: "Richtig",
    evidence: "Ich habe gestern ein Hemd bei Ihnen im Online-Shop bestellt.",
  },
  {
    prompt: "Das Paket ist erst nächste Woche angekommen.",
    answer: "Falsch",
    evidence: "Das Paket ist heute angekommen, aber die Farbe ist leider falsch.",
  },
  {
    prompt: "Herr Klein hat ein grünes Hemd erhalten, obwohl er Blau bestellt hat.",
    answer: "Richtig",
    evidence: "Ich habe Blau bestellt, aber das Hemd ist grün.",
  },
  {
    prompt: "Im Lager ist ein Fehler bei der Farbe passiert.",
    answer: "Richtig",
    evidence: "Da ist im Lager ein Fehler passiert.",
  },
  {
    prompt: "Herr Klein muss das Rücksendeetikett per Post bezahlen.",
    answer: "Falsch",
    evidence: "Sie bekommen auch ein Rücksendeetikett per E-Mail.",
    explanation: "Das Rücksendeetikett kommt per E-Mail. Die Aufnahme nennt keine Zahlung für das Etikett.",
  },
];

export const A2_DAY20_LISTENING_QUESTIONS = Object.freeze(ITEMS.map(item => Object.freeze({
  prompt: item.prompt,
  options: TRUTH_VALUES,
  correctIndex: TRUTH_VALUES.indexOf(item.answer),
  answer: item.answer,
  evidence: item.evidence,
  hint: `Hörbeleg: „${item.evidence}“`,
  explanation: item.explanation || item.evidence,
})));

export const A2_DAY20_LISTENING = Object.freeze({
  level: "A2",
  day: 20,
  title: "Reklamation · Das falsche Hemd",
  audioKey: A2_DAY20_AUDIO_KEY,
  transcript: A2_DAY20_TRANSCRIPT,
  questions: A2_DAY20_LISTENING_QUESTIONS,
  suggestedMinutes: 6,
  playbackNote: "Die Aufnahme enthält zwei vollständige Durchgänge (1:41 Minuten insgesamt).",
  previewWords: ["die Reklamation", "umtauschen", "das Rücksendeetikett"],
});
