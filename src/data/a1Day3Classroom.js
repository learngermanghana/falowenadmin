// A1 Day 3 follows the merged Day 2 foundations and teaches all present-tense endings.
export const A1_DAY3_ASSIGNMENT = 'A1-1.2';
// The Day 3 live-class lobby uses the approved Day 3 recording and its aligned lyrics.
export const A1_DAY3_MUSIC_ASSIGNMENT = 'A1-1.1';
export const A1_DAY3_CLASSROOM_STAGES = Object.freeze([
  ['intro','Einführung','Verbendungen im Präsens',3],
  ['pronouns','Pronomen','Eine Person oder mehrere?',4],
  ['endings','Grammatik','Das Muster der Verbendungen',6],
  ['lernen','Beispiel','lernen mit allen Pronomen',6],
  ['sie-sie','Genau hinsehen','sie oder Sie?',4],
  ['corrections','Fehler finden','Falsch → richtig',5],
  ['arbeiten','Besondere Form','arbeiten: das zusätzliche e',4],
  ['heissen','Besondere Form','heißen: ß bleibt',4],
  ['practice','Übung','Wähle die passende Verbform',6],
  ['recap','Abschluss','Pronomen → Endung → Verb',3],
].map(([step,kicker,title,minutes]) => Object.freeze({
  id:'a1-day3-'+step, type:'a1-day3', step, kicker, title, suggestedMinutes:minutes,
  teacherPurpose:{student:'Sieh auf das Pronomen. Wähle die passende Endung und sage den ganzen Satz.',teacher:'Die Schülerinnen und Schüler sollen die Endung direkt aus dem Pronomen ableiten. Erst selbst antworten lassen, dann die Form zeigen.'},
})));
export const A1_DAY3_PRONOUN_ROWS = Object.freeze([
  {pronouns:['ich'],person:'one',ending:'-e',example:'ich lerne',color:'blue'},
  {pronouns:['du'],person:'one',ending:'-st',example:'du lernst',color:'teal'},
  {pronouns:['er','sie','es'],person:'one',ending:'-t',example:'er / sie / es lernt',color:'violet'},
  {pronouns:['wir'],person:'group',ending:'-en',example:'wir lernen',color:'blue'},
  {pronouns:['ihr'],person:'group',ending:'-t',example:'ihr lernt',color:'teal'},
  {pronouns:['sie','Sie'],person:'group',ending:'-en',example:'sie / Sie lernen',color:'violet'},
]);
export const A1_DAY3_QUIZ = Object.freeze([
  {prompt:'Ich ___ Deutsch.',options:['lernen','lerne','lernt'],answer:1,explain:'ich → -e: ich lerne'},
  {prompt:'Du ___ in Accra.',options:['wohnst','wohnt','wohne'],answer:0,explain:'du → -st: du wohnst'},
  {prompt:'Wir ___ zusammen.',options:['lernt','lernen','lernst'],answer:1,explain:'wir → -en: wir lernen'},
  {prompt:'Ihr ___ heute Deutsch.',options:['lernen','lernt','lernst'],answer:1,explain:'ihr → -t: ihr lernt'},
  {prompt:'Du ___ im Büro.',options:['arbeitst','arbeitest','arbeiten'],answer:1,explain:'arbeiten adds an e: du arbeitest'},
  {prompt:'Meine Schwester ___ Maria.',options:['heißt','heißen','heißest'],answer:0,explain:'er / sie / es → -t: sie heißt'},
]);
