// Teacher-led oral activity only: no student accounts, submissions or automatic grading.
export const B1_DAY18_CAREER_CHALLENGES = Object.freeze([
  {
    id: "pflegefachkraft",
    careerDe: "Pflegefachkraft",
    icon: "🩺",
    steps: [
      { actionDe: "Deutsch lernen", questionDe: "Warum lernst du Deutsch?", modelDe: "Ich lerne Deutsch, um mit Patientinnen und Patienten zu sprechen." },
      { actionDe: "Praktikum machen", questionDe: "Warum machst du ein Praktikum?", modelDe: "Ich mache ein Praktikum, um den Pflegealltag kennenzulernen." },
      { actionDe: "Bewerbung schreiben", questionDe: "Warum schreibst du eine Bewerbung?", modelDe: "Ich schreibe eine Bewerbung, um mich für eine Ausbildungsstelle zu bewerben." },
    ],
  },
  {
    id: "lehrkraft",
    careerDe: "Lehrkraft",
    icon: "📚",
    steps: [
      { actionDe: "Pädagogik studieren", questionDe: "Warum studierst du Pädagogik?", modelDe: "Ich studiere Pädagogik, um später an einer Schule zu unterrichten." },
      { actionDe: "Schulpraktikum machen", questionDe: "Warum machst du ein Schulpraktikum?", modelDe: "Ich mache ein Schulpraktikum, um Unterrichtserfahrung zu sammeln." },
      { actionDe: "Präsentationen üben", questionDe: "Warum übst du Präsentationen?", modelDe: "Ich übe Präsentationen, um klarer zu erklären." },
    ],
  },
  {
    id: "softwareentwicklung",
    careerDe: "Softwareentwickler/in",
    icon: "💻",
    steps: [
      { actionDe: "Programmieren lernen", questionDe: "Warum lernst du programmieren?", modelDe: "Ich lerne programmieren, um eigene Apps zu entwickeln." },
      { actionDe: "Projekte bauen", questionDe: "Warum arbeitest du an eigenen Projekten?", modelDe: "Ich arbeite an eigenen Projekten, um praktische Erfahrungen zu sammeln." },
      { actionDe: "Portfolio erstellen", questionDe: "Warum erstellst du ein Portfolio?", modelDe: "Ich erstelle ein Portfolio, um meine Projekte zu zeigen." },
    ],
  },
  {
    id: "koch",
    careerDe: "Koch/Köchin",
    icon: "👩‍🍳",
    steps: [
      { actionDe: "Rezepte üben", questionDe: "Warum übst du verschiedene Rezepte?", modelDe: "Ich übe verschiedene Rezepte, um neue Gerichte zuzubereiten." },
      { actionDe: "Küchenpraktikum machen", questionDe: "Warum machst du ein Küchenpraktikum?", modelDe: "Ich mache ein Küchenpraktikum, um den Arbeitsalltag kennenzulernen." },
      { actionDe: "Lebenslauf aktualisieren", questionDe: "Warum aktualisierst du deinen Lebenslauf?", modelDe: "Ich aktualisiere meinen Lebenslauf, um mich in einem Restaurant zu bewerben." },
    ],
  },
  {
    id: "elektrotechnik",
    careerDe: "Elektriker/in",
    icon: "⚡",
    steps: [
      { actionDe: "Elektrotechnik lernen", questionDe: "Warum lernst du die Grundlagen der Elektrotechnik?", modelDe: "Ich lerne die Grundlagen der Elektrotechnik, um Schaltungen zu verstehen." },
      { actionDe: "Sicherheitsregeln üben", questionDe: "Warum übst du Sicherheitsregeln?", modelDe: "Ich übe Sicherheitsregeln, um sicher zu arbeiten." },
      { actionDe: "Ausbildungsplatz suchen", questionDe: "Warum suchst du einen Ausbildungsplatz?", modelDe: "Ich suche einen Ausbildungsplatz, um eine Ausbildung zu beginnen." },
    ],
  },
  {
    id: "grafikdesign",
    careerDe: "Grafikdesigner/in",
    icon: "🎨",
    steps: [
      { actionDe: "Gestaltung üben", questionDe: "Warum übst du Grafikdesign?", modelDe: "Ich übe Grafikdesign, um bessere Entwürfe zu erstellen." },
      { actionDe: "Designprojekte sammeln", questionDe: "Warum sammelst du Designprojekte?", modelDe: "Ich sammle Designprojekte, um ein Portfolio aufzubauen." },
      { actionDe: "Portfolio zeigen", questionDe: "Warum zeigst du dein Portfolio?", modelDe: "Ich zeige mein Portfolio, um neue Auftraggeber zu gewinnen." },
    ],
  },
]);

// Pick uniformly from every career except the current one, so consecutive rounds never repeat.
export function nextB1Day18CareerIndex(currentIndex, total, randomValue = Math.random()) {
  const count = Math.max(0, Math.floor(Number(total) || 0));
  if (count <= 1) return 0;
  const current = Number.isInteger(currentIndex) && currentIndex >= 0 && currentIndex < count ? currentIndex : 0;
  const random = Number.isFinite(randomValue) ? Math.max(0, Math.min(0.999999999, randomValue)) : 0;
  return (current + 1 + Math.floor(random * (count - 1))) % count;
}
