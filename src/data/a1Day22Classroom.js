// Dedicated A1 Day 22 sequence: cancelling appointments, health, weather and weil.
export const A1_DAY22_STAGES = Object.freeze([
  ["intro","A1 · Tag 22","Ich muss meinen Termin absagen"],
  ["symptoms","Gesundheit","Warum kannst du nicht kommen?"],
  ["weather","Wiederholung","Wie ist das Wetter?"],
  ["reasons","Sprechen","Zwei Gründe, ein Ziel"],
  ["reschedule","Termine","Einen anderen Termin vereinbaren"],
  ["polite","Grammatik","Könnten + Subjekt + Infinitiv"],
  ["questions","Übung","Bau eine höfliche Frage"],
  ["message","Lesen","Drei Teile einer Absage"],
  ["weil","Grammatik","Warum? – Weil …"],
  ["writing","Schreiben","Eine kurze Absage schreiben"],
  ["music","Falowen Music","Arzttermin · Hören und Liedtext"],
  ["exit","Abschluss","Absagen, begründen, neu vereinbaren"],
].map(([step,kicker,title]) => Object.freeze({
  id:"a1-day22-"+step,type:"a1-day22",step,kicker,title,
  items:[{label:title,detail:"Teacher-led A1 cancellation practice"}],
})));
export const DAY22_POLITE_QUESTIONS = Object.freeze([
  ["Könnten / wir / einen anderen Termin / vereinbaren","Könnten wir einen anderen Termin vereinbaren?"],
  ["Könnten / Sie / mir bitte / helfen","Könnten Sie mir bitte helfen?"],
  ["Könnten / Sie / mir die Uhrzeit / sagen","Könnten Sie mir die Uhrzeit sagen?"],
  ["Könntest / du / mir bitte / helfen","Könntest du mir bitte helfen?"],
]);
export const DAY22_WEIL_PRACTICE = Object.freeze([
  ["ich / krank / bin","Ich kann nicht kommen, weil ich krank bin."],
  ["ich / Fieber / habe","Ich muss absagen, weil ich Fieber habe."],
  ["es / stark / regnet","Ich kann nicht kommen, weil es stark regnet."],
  ["meine Beine / weh / tun","Ich muss absagen, weil meine Beine wehtun."],
]);
export const DAY22_WORKBOOK = "/campus/course/a1-day-22-health-and-body-parts-workbook";
