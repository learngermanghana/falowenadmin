// Projector-friendly A1 Day 13: statements, verb-second and everyday questions.
export const A1_DAY13_STAGES = Object.freeze([
  ["intro","A1 · Tag 13","Aussagesätze und Fragen bilden"],
  ["model","Satzbau","Wer macht was?"],
  ["verb","Grammatik","Das Verb steht auf Position 2"],
  ["build","Übung","Bau einen ganzen Satz"],
  ["time","Satzbau","Beginne mit einer Zeitangabe"],
  ["yesno","Fragen","Ja-/Nein-Fragen"],
  ["wquestions","Fragen","W-Fragen bilden"],
  ["ask","Übung","Stelle eine passende Frage"],
  ["correct","Übung","Finde den Fehler"],
  ["dialogue","Sprechen","Frage deinen Partner"],
  ["music","Falowen Music","Zwei Tees, vier Euro"],
  ["exit","Abschluss","Drei Sätze, zwei Fragen"],
].map(([step,kicker,title])=>Object.freeze({
  id:"a1-day13-"+step,type:"a1-day13",step,kicker,title,
  items:[{label:title,detail:"Teacher-led sentence and question practice"}],
})));
export const DAY13_SENTENCES = Object.freeze([
  ["ich / Deutsch / lerne","Ich lerne Deutsch."],
  ["sie / heute / arbeitet","Sie arbeitet heute."],
  ["wir / um 18 Uhr / lernen","Wir lernen um 18 Uhr."],
  ["der Kaffee / vier Euro / kostet","Der Kaffee kostet vier Euro."],
]);
export const DAY13_TIME_FIRST = Object.freeze([
  ["ich / am Montag / Deutsch / lerne","Am Montag lerne ich Deutsch."],
  ["wir / heute / einen Kurs / haben","Heute haben wir einen Kurs."],
  ["der Bus / um acht Uhr / fährt","Um acht Uhr fährt der Bus."],
]);
export const DAY13_QUESTIONS = Object.freeze([
  ["Du lernst Deutsch.","Lernst du Deutsch?"],
  ["Er arbeitet heute.","Arbeitet er heute?"],
  ["Ihr trinkt Kaffee.","Trinkt ihr Kaffee?"],
]);
export const DAY13_W_QUESTIONS = Object.freeze([
  ["Ich wohne in Accra.","Wo wohnst du?"],
  ["Der Kurs beginnt um 18 Uhr.","Wann beginnt der Kurs?"],
  ["Der Tee kostet vier Euro.","Wie viel kostet der Tee?"],
  ["Sie heißt Amina.","Wie heißt sie?"],
]);
export const DAY13_CORRECTIONS = Object.freeze([
  ["Heute ich lerne Deutsch.","Heute lerne ich Deutsch."],
  ["Du lernst Deutsch? (Ja/Nein-Frage)","Lernst du Deutsch?"],
  ["Wo du wohnst?","Wo wohnst du?"],
  ["Ich Deutsch lerne.","Ich lerne Deutsch."],
]);
