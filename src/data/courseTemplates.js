import { getCourseSessionGroups } from "./courseSessionGroups.js";

// Use the same current A1 day groups as Live Classes and Attendance.
const a1Days = getCourseSessionGroups("A1").filter((group) => group.day > 0);
export const RAW_SCHEDULE_A1 = [1, 3, 3, 3, 3, 3, 3, 3, 1].map((count, index, sizes) => {
  const offset = sizes.slice(0, index).reduce((sum, size) => sum + size, 0);
  const weeks = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  return [`Week ${weeks[index]}`, a1Days.slice(offset, offset + count).map((group) => group.topic)];
});

export const RAW_SCHEDULE_A2 = [
  ["Woche 1", ["1.1. Small Talk (Exercise)", "1.2. Personen Beschreiben (Exercise)", "1.3. Dinge und Personen vergleichen"]],
  ["Woche 2", ["2.4. Wo möchten wir uns treffen?", "2.5. Was machst du in deiner Freizeit?"]],
  ["Woche 3", ["3.6. Möbel und Räume kennenlernen", "3.7. Eine Wohnung suchen (Übung)", "3.8. Im Restaurant – bestellen und reagieren (Exercise)"]],
  ["Woche 4", ["4.9. Urlaub", "4.10. Eine Stadt entdecken und etwas erleben", "4.11. Unterwegs: Verkehrsmittel vergleichen"]],
  ["Woche 5", ["5.12. Mein Traumberuf (Exercise)", "5.13. Ein Vorstellungsgesprach (Exercise)", "5.14. Beruf und Karriere (Exercise)"]],
  ["Woche 6", ["6.15. Mein Lieblingssport", "6.16. Wohlbefinden und Entspannung", "6.17. In die Apotheke gehen"]],
  ["Woche 7", ["7.18. Die Bank Anrufen", "7.19. Einkaufen – Wo und wie? (Exercise)", "7.20. Typische Reklamationssituationen üben"]],
  ["Woche 8", ["8.21. Ein Wochenende planen", "8.22. Die Woche Plannung"]],
  ["Woche 9", ["9.23. Wie kommst du zur Schule / zur Arbeit?", "9.24. Einen Urlaub planen", "9.25. Tagesablauf (Exercise)"]],
  ["Woche 10", ["10.26. Gefühle in verschiedenen Situationen beschr", "10.27. Digitale Kommunikation", "10.28. Über die Zukunft sprechen"]],
];

export const RAW_SCHEDULE_B1 = [
  ["Woche 1", ["1.1. Traumwelten (Übung)", "1.2. Freundes für Leben (Übung)", "1.3. Erfolgsgeschichten (Übung)"]],
  ["Woche 2", ["2.4. Wohnung suchen (Übung)", "2.5. Der Besichtigungsg termin (Übung)", "2.6. Leben in der Stadt oder auf dem Land?"]],
  ["Woche 3", ["3.7. Fast Food vs. Hausmannskost", "3.8. Alles für die Gesundheit", "3.9. Work-Life-Balance im modernen Arbeitsumfeld"]],
  ["Woche 4", ["4.10. Digitale Auszeit und Selbstfürsorge", "4.11. Teamspiele und Kooperative Aktivitäten", "4.12. Abenteuer in der Natur", "4.13. Eigene Filmkritik schreiben"]],
  ["Woche 5", ["5.14. Traditionelles vs. digitales Lernen", "5.15. Medien und Arbeiten im Homeoffice", "5.16. Prüfungsangst und Stressbewältigung", "5.17. Wie lernt man am besten?"]],
  ["Woche 6", ["6.18. Wege zum Wunschberuf", "6.19. Das Vorstellungsgespräch", "6.20. Wie wird man …? (Ausbildung und Qu)"]],
  ["Woche 7", ["7.21. Lebensformen heute – Familie, Wohnge", "7.22. Was ist dir in einer Beziehung wichtig?", "7.23. Erstes Date – Typische Situationen"]],
  ["Woche 8", ["8.24. Konsum und Nachhaltigkeit", "8.25. Online einkaufen – Rechte und Risiken"]],
  ["Woche 9", ["9.26. Reiseprobleme und Lösungen"]],
  ["Woche 10", ["10.27. Umweltfreundlich im Alltag", "10.28. Klimafreundlich leben"]],
];

export const courseLevels = {
  A1: RAW_SCHEDULE_A1,
  A2: RAW_SCHEDULE_A2,
  B1: RAW_SCHEDULE_B1,
};

export const WEEKDAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
