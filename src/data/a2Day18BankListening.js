// A2 Day 18 – Teacher-facing listening companion for the verified uploaded
// recording and its original five Richtig/Falsch questions.
// The student's separately scored workbook Hören task is not modified.
export const A2_DAY18_BANK_AUDIO_KEY = "a2/day-18/bank-telefonat.mp3";

export const A2_DAY18_BANK_TRANSCRIPT = Object.freeze([
  ["A", "Guten Tag. Volksbank Müller am Apparat. Was kann ich für Sie tun?"],
  ["B", "Guten Tag. Mein Name ist Anna Weber. Ich rufe an, weil ich eine Frage zu meinem Konto habe."],
  ["A", "Guten Tag, Frau Weber. Gerne. Worum geht es genau?"],
  ["B", "Meine EC-Karte funktioniert seit gestern leider nicht mehr im Geschäft."],
  ["A", "Das tut mir leid. Ist die Karte beschädigt oder haben Sie den PIN-Code dreimal falsch eingegeben?"],
  ["B", "Nein, beschädigt ist sie nicht. Aber ich glaube, ich habe den PIN-Code gestern Abend leider vergessen."],
  ["A", "Ah, verstehe. Wenn man den PIN dreimal falsch eingibt, wird die Karte automatisch gesperrt."],
  ["B", "Kann ich einen neuen PIN-Code bekommen?"],
  ["A", "Ja, wir können Ihnen einen neuen PIN per Post schicken. Das dauert etwa drei Tage."],
  ["B", "Vielen Dank für die Hilfe."],
]);

const TRUTH_VALUES = Object.freeze(["Richtig", "Falsch"]);
const questions = [
  {
    prompt: "Frau Weber ruft bei der Bank an, weil sie eine Frage zu ihrem Konto hat.",
    answer: "Richtig",
    evidence: "Ich rufe an, weil ich eine Frage zu meinem Konto habe.",
  },
  {
    prompt: "Die EC-Karte von Frau Weber funktioniert im Geschäft nicht mehr.",
    answer: "Richtig",
    evidence: "Meine EC-Karte funktioniert seit gestern leider nicht mehr im Geschäft.",
  },
  {
    prompt: "Frau Weber hat ihre Karte im Geschäft verloren.",
    answer: "Falsch",
    evidence: "Nein, beschädigt ist sie nicht.",
    explanation: "Der Text handelt von einer nicht funktionierenden Karte und einem vergessenen PIN. Ein Kartenverlust wird nicht berichtet.",
  },
  {
    prompt: "Die Bank kann Frau Weber einen neuen PIN-Code per Post schicken.",
    answer: "Richtig",
    evidence: "wir können Ihnen einen neuen PIN per Post schicken.",
  },
  {
    prompt: "Der neue PIN-Code kommt sofort per E-Mail.",
    answer: "Falsch",
    evidence: "Das dauert etwa drei Tage.",
    explanation: "Die Bank versendet den neuen PIN per Post, nicht sofort per E-Mail.",
  },
];

export const A2_DAY18_BANK_QUESTIONS = Object.freeze(questions.map(item => Object.freeze({
  prompt: item.prompt,
  options: TRUTH_VALUES,
  correctIndex: TRUTH_VALUES.indexOf(item.answer),
  answer: item.answer,
  evidence: item.evidence,
  hint: `Hörbeleg: „${item.evidence}“`,
  explanation: item.explanation || item.evidence,
})));

export const A2_DAY18_BANK_LISTENING = Object.freeze({
  level: "A2",
  day: 18,
  title: "Die Bank anrufen · Hördetektiv",
  audioKey: A2_DAY18_BANK_AUDIO_KEY,
  transcript: A2_DAY18_BANK_TRANSCRIPT,
  questions: A2_DAY18_BANK_QUESTIONS,
  suggestedMinutes: 7,
  playbackNote: "Die Aufnahme enthält zwei vollständige Durchgänge (1:48 Minuten insgesamt).",
  previewWords: ["die EC-Karte", "der PIN-Code", "gesperrt"],
});
