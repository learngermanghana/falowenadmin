// Teacher-supplied B1 Day 27 classroom Hören key (Umweltfreundlich im Alltag).
// The five questions and answer indices were supplied with the recording.
// No full transcript was provided. This is separate from graded workbook Teil 4.
export const B1_DAY27_AUDIO_KEY = "b1/day-27/umweltfreundlich-im-alltag.mp3";

export const B1_DAY27_LISTENING_QUESTIONS = Object.freeze([
  {
    prompt: "Was nutzt Person B beim Einkaufen?",
    evidence: "Ich nutze nur noch wiederverwendbare Stofftaschen.",
    options: ["Wiederverwendbare Stofftaschen", "Einwegtüten aus Plastik", "Papiertüten aus dem Supermarkt"],
    correctIndex: 0,
  },
  {
    prompt: "Wie vermeidet Person B Plastikmüll im Supermarkt?",
    evidence: "Ich kaufe möglichst loses Obst und Gemüse und vermeide Produkte mit viel Plastikverpackung.",
    options: ["Durch den Kauf von verpackten Lebensmitteln", "Durch den Kauf von losem Obst und Gemüse", "Durch den Verzicht auf den Supermarkt"],
    correctIndex: 1,
  },
  {
    prompt: "Wo kauft Person B ein, um regionale Produkte zu bekommen?",
    evidence: "Ich kaufe im Bioladen um die Ecke ein, weil die Lebensmittel dort von Höfen aus der Region kommen.",
    options: ["Im Discounter im Nachbarort", "Auf dem großen Markt in der Stadt", "Im Bioladen um die Ecke"],
    correctIndex: 2,
  },
  {
    prompt: "Was macht Person B zu Hause in Bezug auf Energie?",
    evidence: "Da achte ich sehr darauf, Licht immer auszuschalten, wenn ich den Raum verlasse.",
    options: ["Licht immer ausschalten beim Verlassen des Raumes", "Die Heizung den ganzen Tag aufdrehen", "Alle elektrischen Geräte nachts laufen lassen"],
    correctIndex: 0,
  },
  {
    prompt: "Wie lüftet Person B zu Hause?",
    evidence: "Außerdem lüfte ich kurz und intensiv.",
    options: ["Lange mit gekipptem Fenster", "Kurz und intensiv", "Überhaupt nicht im Alltag"],
    correctIndex: 1,
  },
].map((question) => Object.freeze({
  ...question,
  options: Object.freeze(question.options),
  answer: `${String.fromCharCode(65 + question.correctIndex)}) ${question.options[question.correctIndex]}`,
  hint: "Höre auf das genaue Detail im Gespräch und vergleiche die drei Antworten.",
  explanation: `Hörbeleg: „${question.evidence}“`,
})));

export const B1_DAY27_LISTENING = Object.freeze({
  level: "B1",
  day: 27,
  title: "Umweltfreundlich im Alltag · Hörverstehen",
  audioKey: B1_DAY27_AUDIO_KEY,
  transcript: Object.freeze([]),
  questions: B1_DAY27_LISTENING_QUESTIONS,
  suggestedMinutes: 8,
  playbackNote: "Lies zuerst die fünf Fragen. Höre die Aufnahme und wähle jeweils A, B oder C. Besprecht danach die Belege.",
  previewWords: Object.freeze(["die Stofftasche", "lose Lebensmittel", "der Bioladen", "Energie sparen", "intensiv lüften"]),
});
