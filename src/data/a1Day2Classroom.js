// Dedicated A1 Day 2 projector sequence. The combined course lesson deliberately
// teaches only singular subject pronouns; later days introduce plural/formal forms.
export const A1_DAY2_LESSON_ID = 'a1-0-2-1-1';
export const A1_DAY2_PRONOUNS = Object.freeze([
  {de:'ich',en:'I',heißen:'heiße',wohnen:'wohne',kommen:'komme'},
  {de:'du',en:'you (informal)',heißen:'heißt',wohnen:'wohnst',kommen:'kommst'},
  {de:'er',en:'he',heißen:'heißt',wohnen:'wohnt',kommen:'kommt'},
  {de:'sie',en:'she',heißen:'heißt',wohnen:'wohnt',kommen:'kommt'},
  {de:'es',en:'it',heißen:'heißt',wohnen:'wohnt',kommen:'kommt'},
]);
export const A1_DAY2_QUIZ = Object.freeze([
  {prompt:'Ich ___ Anna.',options:['heißt','heiße','heißen'],answer:1},
  {prompt:'Du ___ in Hamburg.',options:['wohnt','wohne','wohnst'],answer:2},
  {prompt:'Er ___ aus Ghana.',options:['kommt','kommen','komme'],answer:0},
  {prompt:'Sie ___ Maria.',options:['heiße','heißt','heißen'],answer:1},
  {prompt:'Es ___ aus Berlin.',options:['kommen','kommt','kommst'],answer:1},
]);
const lesson = [
  ['welcome','Einführung','Das Alphabet und die Personalpronomen',3],
  ['alphabet','Alphabet','Das deutsche Alphabet',5],
  ['special','Buchstaben','Ä, Ö, Ü und ß',3],
  ['spell','Sprechen','Wie buchstabierst du deinen Namen?',4],
  ['pronouns','Grammatik','Die Personalpronomen',5],
  ['verbs','Grammatik','Die Verbkonjugation',7],
  ['sentences','Satzbau','Bilde ganze Sätze!',4],
  ['practice','Übung','Welches Verb ist richtig?',5],
  ['partners','Sprechen','Frag deinen Partner!',5],
  ['music','Musik hören','Hören · Liedtext · Drei Fragen',10],
  ['recap','Abschluss','Was hast du heute gelernt?',3],
];
export const A1_DAY2_CLASSROOM_STAGES = Object.freeze(lesson.map(([id,kicker,title,minutes])=>Object.freeze({
  id:'a1-day2-'+id,type:'a1-day2',variant:'a1-day2',kicker,title,step:id,
  suggestedMinutes:minutes,
  teacherPurpose:{student:'Hören, wiederholen und vollständige einfache Sätze bilden.',teacher:'Erst erklären und vorsprechen, dann Schüler antworten lassen. Lösungen erst danach aufdecken.'},
})));
