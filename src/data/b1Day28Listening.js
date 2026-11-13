// Source: teacher-uploaded
// falowen-b1-hoeren-klimafreundlich-leben-questions-key(2).json
// The five statements, exact answers and evidence quotes are copied from
// that source. This is classroom Hören in Admin, not a change to the scored
// learner workbook Teil 4/answer contract.
export const B1_DAY28_AUDIO_KEY = 'b1/day-28/klimafreundlich-leben.mp3';
const OPTIONS = Object.freeze(['Richtig', 'Falsch']);
const source = [
  {
    statement:'Lisa hat den Entschluss gefasst, ab sofort nie wieder Fleisch zu essen.',
    answer:'Falsch',
    evidence:'Aber beim Fleischkonsum fällt es mir schwer, komplett darauf zu verzichten.',
  },
  {
    statement:'Lisa kauft Gemüse neuerdings gerne auf dem Wochenmarkt.',
    answer:'Richtig',
    evidence:'Ich kaufe jetzt mehr saisonales Gemüse auf dem Wochenmarkt und nutze öfter das Fahrrad.',
  },
  {
    statement:'Jonas schlägt vor, dass man sofort perfekt leben muss.',
    answer:'Falsch',
    evidence:'Aber man muss ja nicht sofort perfekt sein.',
  },
  {
    statement:'Lisa möchte in Zukunft zweimal in der Woche vegetarisch kochen.',
    answer:'Richtig',
    evidence:'Mein Ziel ist es jetzt, zweimal pro Woche vegetarisch zu kochen.',
  },
  {
    statement:'Lisa vergisst laut eigener Aussage oft, die Heizung beim Lüften auszuschalten.',
    answer:'Falsch',
    evidence:'Ich schalte jetzt immer die Heizung aus, wenn ich lüfte, und benutze LED-Lampen.',
  },
];
export const B1_DAY28_LISTENING = Object.freeze({
  level:'B1',
  day:28,
  title:'Klimafreundlich leben · Lisa und Jonas',
  audioKey:B1_DAY28_AUDIO_KEY,
  suggestedMinutes:8,
  playbackNote:'Lies zuerst die fünf Aussagen. Höre die Aufnahme und entscheide: richtig oder falsch. Begründe anschließend deine Antwort.',
  previewWords:Object.freeze(['saisonal', 'der Wochenmarkt', 'vegetarisch', 'verzichten', 'die Heizung', 'lüften']),
  questions:Object.freeze(source.map(item=>Object.freeze({
    prompt:item.statement,
    options:OPTIONS,
    correctIndex:OPTIONS.indexOf(item.answer),
    answer:item.answer,
    evidence:item.evidence,
    explanation:`Hörbeleg: „${item.evidence}“`,
    hint:'Achte auf den genauen Wortlaut. Kleine Unterschiede ändern richtig oder falsch.',
  }))),
});
