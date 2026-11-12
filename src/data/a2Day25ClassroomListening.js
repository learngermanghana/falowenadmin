const options = Object.freeze(['Richtig', 'Falsch']);
const items = [
  ["Der Arbeitstag beginnt ab sofort um acht Uhr dreißig.", 0, "Ab sofort beginnt der Arbeitstag bereits um acht Uhr dreißig mit einem kurzen Team-Meeting im Konferenzraum."],
  ["Das Team trifft sich morgens im Büro von Person B.", 1, "Ab sofort beginnt der Arbeitstag bereits um acht Uhr dreißig mit einem kurzen Team-Meeting im Konferenzraum."],
  ["Die Mittagspause dauert von zwölf Uhr bis eins.", 0, "Die Mittagspause ist jetzt einheitlich von zwölf Uhr bis eins."],
  ["Während der Mittagspause ist die Küche komplett geschlossen.", 1, "In dieser Stunde bleibt die Küche für alle geöffnet."],
  ["Die reguläre Arbeitszeit endet am Nachmittag um sechzehn Uhr dreißig.", 0, "Danach endet die reguläre Arbeitszeit, und alle können nach Hause gehen."],
];

export const A2_DAY25_CLASSROOM_LISTENING = Object.freeze({
  level: 'A2',
  day: 25,
  title: 'Tagesablauf · Neue Arbeitszeiten',
  audioKey: 'a2/day-25/tagesablauf.mp3',
  suggestedMinutes: 7,
  playbackNote: 'Lest die Aussagen. Hört die Aufnahme und entscheidet: richtig oder falsch.',
  previewWords: ['ab sofort', 'der Konferenzraum', 'die Mittagspause', 'die Arbeitszeit'],
  questions: Object.freeze(items.map(([prompt, correctIndex, evidence]) => Object.freeze({
    prompt, options, correctIndex, answer: options[correctIndex], evidence,
    explanation: evidence, hint: 'Achte auf die genaue Zeit oder den genannten Ort.',
  }))),
});
