// Teacher-supplied private recording. No transcript or fixed answer key was
// supplied: use open listening prompts, never invented dialogue/MCQ answers.
export const A2_DAY23_CLASSROOM_AUDIO_KEY = 'a2/day-23/wie-kommst-du-zur-schule-oder-zur-arbeit.mp3';
const prompts = [
  ['Welche Verkehrsmittel hörst du im Gespräch?', 'Notiere nur Verkehrsmittel, die du tatsächlich hörst.', 'Achte auf mit dem Bus, mit der Bahn, mit dem Fahrrad und zu Fuß.'],
  ['Wohin fahren oder gehen die Personen?', 'Nenne die Ziele aus der Aufnahme. Verwende zur, zum oder nach, wenn es passt.', 'Höre auf die Wörter direkt nach dem Verkehrsmittel.'],
  ['Wird eine Dauer oder Uhrzeit genannt? Was hörst du?', 'Notiere die genannte Zeit. Falls keine Zeit genannt wird, sage: Es wird keine Zeit genannt.', 'Unterscheide um … Uhr und … Minuten.'],
  ['Welche Gründe oder Probleme hörst du?', 'Nenne einen Grund oder ein Problem aus der Aufnahme. Erfinde keine zusätzlichen Informationen.', 'Achte auf weil, aber und Wörter zum Wetter oder Verkehr.'],
  ['Wie unterscheidet sich dein Schul- oder Arbeitsweg vom Gespräch?', 'Beschreibe deinen eigenen Weg in zwei Sätzen. Beziehe dich auf eine Information, die du gehört hast.', 'Zum Beispiel: Ich fahre mit … zur … . Mein Weg dauert … Minuten.'],
];
export const A2_DAY23_CLASSROOM_LISTENING = Object.freeze({
  level: 'A2', day: 23, title: 'Wie kommst du zur Schule oder zur Arbeit?',
  audioKey: A2_DAY23_CLASSROOM_AUDIO_KEY, suggestedMinutes: 6,
  playbackNote: 'Offene Hörfragen: Notiert Stichwörter und prüft eure Antworten gemeinsam mit der Aufnahme.',
  previewWords: ['das Verkehrsmittel', 'die Haltestelle', 'umsteigen', 'zu Fuß'],
  questions: Object.freeze(prompts.map(([prompt, answer, hint]) => Object.freeze({prompt,answer,hint,openResponse:true}))),
});
