import supplied from './a2Day1ListeningQuestions.json' with { type: 'json' };
// Teacher-supplied classroom audio and key. Keep the graded workbook's
// existing task/answers separate; no full transcript was supplied.
export const A2_DAY1_AUDIO_KEY = 'a2/day-01/small-talk.mp3';
export const A2_DAY1_LISTENING = Object.freeze({
  level:'A2', day:1, title:'Small Talk · Der neue Kollege Thomas',
  audioKey:A2_DAY1_AUDIO_KEY, transcript:Object.freeze([]),
  questions:Object.freeze(supplied.questions.map(item=>Object.freeze({
    prompt:item.question, options:Object.freeze([...item.options]),
    correctIndex:item.correctIndex, answer:item.options[item.correctIndex],
    evidence:item.evidence, hint:'Achte auf die persönlichen Angaben und die Uhrzeit.',
    explanation:`Hörbeleg: „${item.evidence}“`,
  }))),
  suggestedMinutes:6,
  previewWords:['der Kollege','die Abteilung','seit zwei Wochen','die Kantine'],
});
