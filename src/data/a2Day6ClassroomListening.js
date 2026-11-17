// Teacher-supplied A2 Day 6 Hören MCQ key. Recording is stored in private
// falowen-course-audio R2; never embed a dashboard URL or public object URL.
// This is ungraded classroom listening, distinct from the workbook Teil 4
// apartment-ad comparison; no recording transcript was supplied.
export const A2_DAY6_CLASSROOM_AUDIO_KEY = 'a2/day-06/mobel-und-raume-kennenlernen.mp3';

const KEY = [
  {
    prompt: 'Wo wohnt Ben jetzt?',
    evidence: 'neue Wohnung in Berlin',
    options: ['In Berlin','In München','In Hamburg'],
    correctIndex: 0,
  },
  {
    prompt: 'Welches Zimmer ist noch sehr leer?',
    evidence: 'das Wohnzimmer ist noch sehr leer',
    options: ['Die Küche','Das Wohnzimmer','Das Arbeitszimmer'],
    correctIndex: 1,
  },
  {
    prompt: 'Was sucht Ben für das Wohnzimmer?',
    evidence: 'Ich brauche ein großes Sofa für das Wohnzimmer',
    options: ['Einen Schreibtisch','Einen Esstisch','Ein großes Sofa'],
    correctIndex: 2,
  },
  {
    prompt: 'Wie sieht das Sofa aus?',
    evidence: 'ein sehr bequem graues Sofa',
    options: ['Grau und bequem','Schwarz und modern','Klein und rot'],
    correctIndex: 0,
  },
  {
    prompt: 'Wo steht der Esstisch aktuell?',
    evidence: 'Der Esstisch steht jetzt in der Küche',
    options: ['Im Wohnzimmer','In der Küche','Im Arbeitszimmer'],
    correctIndex: 1,
  },
];
export const A2_DAY6_CLASSROOM_QUESTIONS = Object.freeze(KEY.map(q=>Object.freeze({
  ...q,
  answer:q.options[q.correctIndex],
  hint:'Höre genau hin und achte auf den genannten Raum oder das Möbelstück.',
  explanation:'Beleg aus der von der Lehrkraft bereitgestellten Antwortdatei: „'+q.evidence+'“',
})));
export const A2_DAY6_CLASSROOM_LISTENING = Object.freeze({
  level:'A2',
  day:6,
  title:'Möbel und Räume kennenlernen · Ben in Berlin',
  audioKey:A2_DAY6_CLASSROOM_AUDIO_KEY,
  questions:A2_DAY6_CLASSROOM_QUESTIONS,
  suggestedMinutes:7,
  previewWords:['das Wohnzimmer','das Sofa','bequem','der Esstisch'],
  playbackNote:'Lest die fünf Fragen. Hört die Aufnahme zweimal und besprecht danach die Lösungen.',
});
