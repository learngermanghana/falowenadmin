// A1 Day 3 visual sequence: articles, simple descriptions and W-questions.
export const A1_DAY3_ASSIGNMENT = 'A1-1.1-PRACTICE';
export const A1_DAY3_CLASSROOM_STAGES = Object.freeze([
  ['intro','Einführung','Wörter, Bilder und Fragen',3],
  ['articles','Artikel','der · die · das',5],
  ['picture-sort','Bildkarten','Welcher Artikel passt?',5],
  ['adjective-frame','Satzbau','Nomen + ist + Adjektiv',4],
  ['picture-sentences','Beschreiben','Was siehst du?',5],
  ['w-question-rule','W-Fragen','W-Wort + Verb + Person',5],
  ['answer-clues','Antworten lesen','Was fragen wir?',5],
  ['w-question-practice','Übung','Welches W-Wort passt?',5],
  ['speaking','Sprechen','Fragen und antworten',5],
  ['music','Falowen Music','Hören · Liedtext · Was kommt als Nächstes?',8],
  ['recap','Abschluss','Was hast du heute gelernt?',3],
].map(([step,kicker,title,minutes]) => Object.freeze({
  id:'a1-day3-'+step, type:'a1-day3', step, kicker, title, suggestedMinutes:minutes,
  teacherPurpose:{student:'Sieh dir die Bilder an, höre zu und antworte mit kurzen A1-Sätzen.',teacher:'Erst das Bild zeigen und antworten lassen. Muster erst danach besprechen.'},
})));
export const A1_DAY3_PICTURE_CARDS = Object.freeze([
  {emoji:'🪑',de:'der Tisch',gender:'maskulin',adjective:'groß'},
  {emoji:'👩',de:'die Frau',gender:'feminin',adjective:'freundlich'},
  {emoji:'📘',de:'das Buch',gender:'neutrum',adjective:'neu'},
  {emoji:'🏫',de:'die Schule',gender:'feminin',adjective:'groß'},
  {emoji:'🚗',de:'das Auto',gender:'neutrum',adjective:'klein'},
]);
export const A1_DAY3_W_QUESTIONS = Object.freeze([
  {answer:'Ich heiße Ama.',word:'Wie',question:'Wie heißt du?',meaning:'Name'},
  {answer:'Ich wohne in Accra.',word:'Wo',question:'Wo wohnst du?',meaning:'Wohnort'},
  {answer:'Ich komme aus Ghana.',word:'Woher',question:'Woher kommst du?',meaning:'Herkunft'},
  {answer:'Ama ist meine Freundin.',word:'Wer',question:'Wer ist Ama?',meaning:'Person'},
  {answer:'Das ist ein Buch.',word:'Was',question:'Was ist das?',meaning:'Sache'},
]);
