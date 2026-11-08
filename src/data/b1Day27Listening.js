// Classroom practice from the teacher-supplied 128-second recording (8 Nov 2026).
// The conversation repeats after a short pause. Separate from graded workbook Teil 4.
export const B1_DAY27_AUDIO_KEY = 'b1/day-27/umweltfreundlich-im-alltag.mp3';
const questions = [
  ['Was benutzt Lisa beim Einkaufen?', ['Wiederverwendbare Stofftaschen.', 'Jedes Mal neue Plastiktüten.', 'Nur Papiertüten.'], 0, 'Ich nutze nur noch wiederverwendbare Stofftaschen.', 'Achte auf die Tasche, die Lisa mehrmals benutzen kann.'],
  ['Wie vermeidet Lisa Plastikmüll im Supermarkt?', ['Sie kauft nur Tiefkühlprodukte.', 'Sie kauft möglichst loses Obst und Gemüse.', 'Sie lässt ihre Einkäufe nach Hause liefern.'], 1, 'Ich kaufe möglichst loses Obst und Gemüse und vermeide Produkte mit viel Plastikverpackung.', 'Wie sind Obst und Gemüse verpackt?'],
  ['Wo kauft Lisa regionale Lebensmittel?', ['Auf einem weit entfernten Großmarkt.', 'Im Internet.', 'Im Bioladen um die Ecke.'], 2, 'Ich kaufe im Bioladen um die Ecke ein, weil die Lebensmittel dort von Höfen aus der Region kommen.', 'Achte auf den genannten Laden.'],
  ['Warum sind Lebensmittel aus der Region umweltfreundlicher?', ['Sie brauchen weniger lange Transportwege.', 'Sie sind immer billiger.', 'Sie brauchen keine Kühlung.'], 0, 'Das reduziert sicher den CO₂-Ausstoß durch lange Transportwege.', 'Welchen Zusammenhang gibt es zwischen Transportwegen und CO₂?'],
  ['Was macht Lisa, wenn sie einen Raum verlässt?', ['Sie öffnet alle Fenster für den ganzen Tag.', 'Sie schaltet das Licht aus.', 'Sie dreht die Heizung höher.'], 1, 'Licht immer auszuschalten, wenn ich den Raum verlasse.', 'Höre auf die Handlung beim Verlassen des Zimmers.'],
  ['Wie lüftet Lisa zu Hause?', ['Gar nicht.', 'Den ganzen Tag mit gekipptem Fenster.', 'Kurz und intensiv.'], 2, 'Außerdem lüfte ich kurz und intensiv.', 'Achte auf die beiden Wörter, die das Lüften beschreiben.'],
].map(([prompt, options, correctIndex, evidence, hint]) => Object.freeze({
  prompt, options: Object.freeze(options), correctIndex,
  answer: `${String.fromCharCode(65 + correctIndex)}) ${options[correctIndex]}`,
  evidence, hint, explanation: `Hörbeleg: „${evidence}“`,
}));
export const B1_DAY27_LISTENING = Object.freeze({
  level: 'B1', day: 27, title: 'Umweltfreundlich im Alltag · Lisas Tipps',
  audioKey: B1_DAY27_AUDIO_KEY, questions: Object.freeze(questions),
  // No speaker-labelled full transcript has been human-reviewed.
  transcript: Object.freeze([]), suggestedMinutes: 8,
  playbackNote: 'Lies zuerst die sechs Fragen. Das Gespräch ist zweimal in der Aufnahme zu hören. Wähle jeweils A, B oder C.',
  previewWords: ['wiederverwendbar', 'lose', 'die Region', 'der Transportweg', 'lüften'],
});
