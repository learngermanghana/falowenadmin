import fs from "node:fs";

const dictionaryPath = new URL("../src/data/courseDictionary.js", import.meta.url);
const teacherSupportPath = new URL("../src/data/teacherSlideSupport.js", import.meta.url);

const topics = [
  "Umweltschutz im Alltag – Müll vermeiden",
  "Mülltrennung, Recycling und Kreislaufwirtschaft",
  "Lebensmittelverschwendung und nachhaltiger Konsum",
  "Plastik, Verpackungen und bewusster Einkauf",
  "Nachhaltige Mobilität und öffentlicher Verkehr",
  "Energie sparen und erneuerbare Energien",
  "Klimafreundliches Wohnen und grüne Städte",
  "Bildungsgerechtigkeit und Zugang zu Bildung",
  "Schulpflicht, Leistung und Verantwortung der Schule",
  "Kindergarten und frühkindliche Bildung",
  "Digitale Bildung – Unterricht mit und ohne Technologie",
  "Studium, Studiengebühren und lebenslanges Lernen",
  "Wissenschaft und Forschung im Alltag",
  "Wissenschaft, Desinformation und verlässliche Quellen",
  "Wohnraummangel, hohe Mieten und soziale Gerechtigkeit",
  "Stadt oder Land – Lebensqualität und Infrastruktur",
  "Familie, Kinderbetreuung und Vereinbarkeit mit dem Beruf",
  "Arbeitswelt, Fachkräftemangel und Weiterbildung",
  "Homeoffice, ständige Erreichbarkeit und Work-Life-Balance",
  "Soziale Medien, Privatsphäre und öffentliche Identität",
  "Künstliche Intelligenz in Schule und Universität",
  "Künstliche Intelligenz, Automatisierung und Arbeitsplätze",
  "Datenschutz, Algorithmen und personalisierte Werbung",
  "Digitale Gesundheit, Telemedizin und medizinische Technologie",
  "Reisen, Massentourismus und nachhaltiger Tourismus",
  "Migration, Integration und Sprache",
  "Gleichstellung, Diskriminierung und gesellschaftlicher Zusammenhalt",
  "Gesellschaft im Wandel – B2 Prüfungstraining",
];

const entries = topics.map((topic, index) => {
  const day = index + 1;
  const assignmentId = `B2-${Math.ceil(day / 4)}.${day}`;
  const chapter = assignmentId.split("-")[1];
  return `    ${JSON.stringify(assignmentId)}: { assignment_id: ${JSON.stringify(assignmentId)}, chapter: ${JSON.stringify(chapter)}, de: ${JSON.stringify(topic)}, en: ${JSON.stringify(topic)} },`;
}).join("\n");

let dictionary = fs.readFileSync(dictionaryPath, "utf8");
const blockPattern = /  B2: \{[\s\S]*?\n  \},\n  C1: \{/;
if (!blockPattern.test(dictionary)) throw new Error("B2 course dictionary block not found");
dictionary = dictionary.replace(blockPattern, `  B2: {\n${entries}\n  },\n  C1: {`);
fs.writeFileSync(dictionaryPath, dictionary);

let support = fs.readFileSync(teacherSupportPath, "utf8");
support = support.replace('const preferCurated = assignmentId === "B2-1.1";', "const preferCurated = false;");
fs.writeFileSync(teacherSupportPath, support);

console.log("B2 course dictionary synced to the new 28-day exam-domain curriculum.");
