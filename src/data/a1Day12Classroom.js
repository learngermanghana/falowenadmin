// Approved Day 12 projector sequence; keep graded A1-8 workbook exactly as published.
export const A1_DAY12_STAGES = Object.freeze([
  ['intro','A1 · Tag 12','Die 24-Stunden-Uhr und das Datum'],
  ['compare','Uhrzeit','12 Stunden und 24 Stunden'],
  ['all-hours','Übersicht','Die 24-Stunden-Uhr'],
  ['convert','Übung','Wie spät ist es?'],
  ['minutes','Grammatik','Genaue Minuten lesen'],
  ['minute-practice','Sprechen','Lies die Uhrzeit!'],
  ['months','Wortschatz','Die zwölf Monate'],
  ['months-practice','Übung','Welcher Monat kommt danach?'],
  ['ordinals','Datum','Die Ordinalzahlen'],
  ['calendar','Datum','Welches Datum ist heute?'],
  ['timetable','Lesen','Wann fährt der Zug?'],
  ['music','Falowen Music','Samstag um zehn · Hören, Liedtext und Fragen'],
  ['workbook','Abschluss','Lesen und wiederholen'],
].map(([step,kicker,title])=>Object.freeze({
  id:'a1-day12-'+step,type:'a1-day12',step,kicker,title,items:[{label:title,detail:'Teacher-led classroom activity'}],
})));
export const DAY12_CONVERSIONS = Object.freeze([['7 PM','19:00'],['3 PM','15:00'],['9 PM','21:00'],['6 AM','06:00']]);
export const DAY12_MINUTES = Object.freeze([
  ['13:43','dreizehn Uhr dreiundvierzig'],
  ['02:21','zwei Uhr einundzwanzig'],
  ['14:21','vierzehn Uhr einundzwanzig'],
  ['07:05','sieben Uhr fünf'],
  ['16:35','sechzehn Uhr fünfunddreißig'],
  ['08:12','acht Uhr zwölf'],
  ['21:45','einundzwanzig Uhr fünfundvierzig'],
  ['12:08','zwölf Uhr acht'],
]);
export const DAY12_MONTHS = Object.freeze(['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']);
export const DAY12_ORDINALS = Object.freeze([['1.','der erste'],['2.','der zweite'],['3.','der dritte'],['4.','der vierte'],['7.','der siebte'],['8.','der achte'],['20.','der zwanzigste'],['23.','der dreiundzwanzigste']]);
