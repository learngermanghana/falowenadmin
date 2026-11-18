// Owner-supplied A2 Day 26 classroom Hören questions and answer key (18 Nov 2026).
// This is a teacher presentation activity, NOT the scored student workbook Hören.
// Evidence quotes are from the uploaded key; the actual MP3 transcript was not supplied.
export const A2_DAY26_CLASSROOM_AUDIO_KEY = 'a2/day-26/gefuhle-beschreiben.mp3';
export const A2_DAY26_CLASSROOM_LISTENING = Object.freeze({
  level: 'A2', day: 26, title: 'Gefühle beschreiben · Lisa und Tom',
  audioKey: A2_DAY26_CLASSROOM_AUDIO_KEY, suggestedMinutes: 7,
  playbackNote: 'Lies die fünf Fragen. Höre das Gespräch und wähle jeweils eine Antwort. Lösungen erst danach besprechen.',
  previewWords: ['nachdenklich', 'die Matheprüfung', 'unsicher', 'gestresst', 'beruhigen'],
  questions: Object.freeze([["Wie sieht Lisa heute aus?",["sehr fröhlich","nachdenklich","müde"],1,"du siehst heute so nachdenklich aus"],["Was hat Lisa am nächsten Tag?",["Eine wichtige Matheprüfung","Einen Arzttermin","Ein Vorstellungsgespräch"],0,"Ich habe morgen eine wichtige Prüfung in Mathe"],["Wie fühlt sich Lisa wegen der Prüfung?",["Entspannt und ruhig","Total unsicher und gestresst","Sehr glücklich"],1,"Ich fühle mich einfach total unsicher und gestresst"],["Was schlägt Tom nach der Prüfung vor?",["Sie wollen zusammen lernen","Sie feiern zusammen","Sie gehen ins Kino"],1,"Danach feiern wir zusammen"],["Wie reagiert Lisa am Ende auf Toms Worte?",["Sie beruhigen sie ein bisschen","Sie machen sie wütend","Sie interessieren sie nicht"],0,"Deine Worte beruhigen mich ein bisschen"]].map(([prompt, options, correctIndex, evidence]) => Object.freeze({
    prompt, options: Object.freeze(options), correctIndex, answer: options[correctIndex], evidence,
    explanation: evidence, hint: 'Höre genau auf Lisas Gefühle und Toms Vorschlag.',
  }))),
});
