// Canonical learner-side curriculum identity used by Falowen Admin Presenter.
// Learner source snapshot: falowenexamtrainer@bafaffbb5fee47a0b9b4effa040dc69cf052f5fa
// A2/B1/B2 titles come from the learner topic/situation/alignment data.
// C1 intentionally records the current learner sequence so Admin can surface its known sequence mismatch.
// C2 mirrors the current learner C2 curriculum, which is already aligned with Admin.

const A2_TITLES = [
  "Small Talk",
  "Personen beschreiben",
  "Dinge und Personen vergleichen",
  "Wo möchten wir uns treffen?",
  "Freizeit",
  "Möbel und Räume",
  "Eine Wohnung suchen",
  "Rezepte und Essen",
  "Urlaub und Erlebnisse",
  "Tourismus und traditionelle Feste",
  "Verkehrsmittel vergleichen",
  "Mein Traumberuf",
  "Vorstellungsgespräch",
  "Beruf und Karriere",
  "Mein Lieblingssport",
  "Wohlbefinden und Entspannung",
  "In die Apotheke gehen",
  "Die Bank anrufen",
  "Einkaufen – wo und wie?",
  "Eine Reklamation machen",
  "Ein Wochenende planen",
  "Die Woche planen",
  "Schul- oder Arbeitsweg",
  "Einen Urlaub planen",
  "Tagesablauf",
  "Gefühle in verschiedenen Situationen",
  "Digitale Kommunikation",
  "Über die Zukunft sprechen"
];

const B1_TITLES = [
  "Traumwelt und Zukunftsträume",
  "Freunde fürs Leben",
  "Erfolgsgeschichten",
  "Wohnung suchen",
  "Besichtigungstermin",
  "Stadt oder Land",
  "Fast Food oder Hausmannskost",
  "Alles für die Gesundheit",
  "Work-Life-Balance",
  "Digitale Auszeit",
  "Teamspiele und Zusammenarbeit",
  "Abenteuer in der Natur",
  "Eigene Filmkritik",
  "Traditionelles und digitales Lernen",
  "Medien und Arbeiten im Homeoffice",
  "Prüfungsangst und Stressbewältigung",
  "Wie lernt man am besten?",
  "Wege zum Wunschberuf",
  "Vorstellungsgespräch",
  "Berufe kennenlernen und beschreiben",
  "Lebensformen heute",
  "Was ist in einer Beziehung wichtig?",
  "Erstes Date – Typische Situationen",
  "Konsum und Nachhaltigkeit",
  "Online einkaufen – Rechte und Risiken",
  "Reiseprobleme und Lösungen",
  "Umweltfreundlich im Alltag",
  "Klimafreundlich leben"
];

const B2_TITLES = [
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
  "Gesellschaft im Wandel – B2 Prüfungstraining"
];

const C1_TITLES = [
  "Ziele und Lernweg",
  "Kultur und Identität",
  "Medien und Informationskompetenz",
  "Beziehungen und Teamarbeit",
  "Berufliche Entwicklung",
  "Gesundheit und Lebensstil",
  "Reisen und Nachhaltigkeit",
  "Wohnen und Stadtentwicklung",
  "Konsum und Werbung",
  "Integration und Gesellschaft",
  "Engagement und Ehrenamt",
  "Freizeit und Kultur",
  "Mehrsprachigkeit",
  "Innovation und Zukunft",
  "Bildung und lebenslanges Lernen",
  "Technologie im Alltag",
  "Umweltverantwortung",
  "Gesellschaftlicher Zusammenhalt",
  "Arbeitswelt und Automatisierung",
  "Digitale Gesundheit",
  "Gesellschaftliche Teilhabe und Integration",
  "Demokratie und Mitbestimmung",
  "Work-Life-Balance",
  "Verkehr und Infrastruktur",
  "Wissenschaft und Forschungsethik",
  "Nachhaltiger Konsum",
  "Digitale Verwaltung",
  "Demografischer Wandel"
];

const C2_TITLES = [
  "Kreislaufwirtschaft und Wegwerfgesellschaft",
  "Schulpflicht und Bildungsgerechtigkeit",
  "Wissenschaft, Forschung und Hochschulen",
  "Journalismus, Nachrichten und Quellenkritik",
  "Politik, Verantwortung und öffentliches Vertrauen",
  "Soziale Ungleichheit und Chancengerechtigkeit",
  "Arbeitswelt, Leistungsdruck und Work-Life-Balance",
  "Künstliche Intelligenz und Automatisierung",
  "Datenschutz und digitale Selbstbestimmung",
  "Medizin, Gesundheit und Forschungsethik",
  "Klimaschutz, Nachhaltigkeit und Mobilität",
  "Migration, Integration und gesellschaftliche Teilhabe",
  "Sprache, Mehrsprachigkeit und kulturelle Identität",
  "Kultur, Literatur und gesellschaftliches Gedächtnis",
  "Wohnen, Mieten und Lebensqualität",
  "Konsum, Werbung und Kaufverhalten",
  "Kindergarten, Kinderbetreuung und Familienpolitik",
  "Studium, Weiterbildung und lebenslanges Lernen",
  "Globalisierung, Handel und wirtschaftliche Abhängigkeiten",
  "Soziale Medien, Debattenkultur und Meinungsbildung",
  "Verwaltung, Bürgerservice und gesellschaftliche Institutionen",
  "Reisen, Tourismus und kulturelle Begegnung",
  "Internationale Zusammenarbeit und Diplomatie",
  "Gesellschaftliche Kontroversen und öffentliche Debatten",
  "Daten, Statistik und wissenschaftliche Evidenz",
  "Philosophie, Ethik und technischer Fortschritt",
  "Akademisches Schreiben und formelle Korrespondenz",
  "C2 Prüfungssimulation: Stellungnahme, Umformung und Synthese"
];

const TITLES_BY_LEVEL = Object.freeze({
  A2: A2_TITLES,
  B1: B1_TITLES,
  B2: B2_TITLES,
  C1: C1_TITLES,
  C2: C2_TITLES,
});

export const STRICT_PARITY_LEVELS = Object.freeze(["A2", "B1", "B2", "C2"]);
export const KNOWN_PARITY_EXCEPTION_LEVELS = Object.freeze(["C1"]);
export const STUDENT_CURRICULUM_SOURCE_SHA = "bafaffbb5fee47a0b9b4effa040dc69cf052f5fa";

export const APPROVED_TITLE_ALIASES = Object.freeze({
  "A2-DAY-20": ["Typische Reklamationssituationen"],
  "A2-DAY-23": ["Wie kommst du zur Schule oder zur Arbeit?"],
});


const normalize = (value = "") =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^(?:a2|b1|b2|c1|c2)\s+(?:day|lesson)?\s*\d+\s*·?\s*/i, "")
    .replace(/^\d+(?:\.\d+)*\s*·?\s*/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const dayNumber = (slide = {}) => {
  const direct = Number(slide.dayNumber);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const match = String(slide.day || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
};

const meaningfulTokens = (value = "") =>
  normalize(value).split(/\s+/).filter((token) => token.length > 3);

const topicSimilarity = (actual, expected) => {
  const left = normalize(actual);
  const right = normalize(expected);
  if (!left || !right) return 0;
  if (left.includes(right) || right.includes(left)) return 1;
  const expectedTokens = meaningfulTokens(expected);
  if (!expectedTokens.length) return 0;
  const actualTokens = new Set(meaningfulTokens(actual));
  return expectedTokens.filter((token) => actualTokens.has(token)).length / expectedTokens.length;
};

export function getStudentLessonContract(level, day) {
  const normalizedLevel = String(level || "").trim().toUpperCase();
  const dayValue = Number(day);
  const titles = TITLES_BY_LEVEL[normalizedLevel];
  const title = Array.isArray(titles) ? titles[dayValue - 1] : "";
  if (!title || !dayValue) return null;
  return {
    canonicalId: `${normalizedLevel}-DAY-${String(dayValue).padStart(2, "0")}`,
    level: normalizedLevel,
    day: dayValue,
    title,
    courseBookLabel: `${normalizedLevel} Day ${dayValue}`,
    courseBookPath: "/campus/course",
  };
}

export function getCurriculumParityReference(slide = {}) {
  const level = String(slide.course || "").trim().toUpperCase();
  const day = dayNumber(slide);
  const contract = getStudentLessonContract(level, day);
  if (!contract) return null;

  const actualTitle = String(slide.title || slide.topic || "");
  const aliasMatch = (APPROVED_TITLE_ALIASES[contract.canonicalId] || []).some((alias) => topicSimilarity(actualTitle, alias) >= 0.8);
  const score = aliasMatch ? 1 : topicSimilarity(actualTitle, contract.title);
  const strict = STRICT_PARITY_LEVELS.includes(level);
  const aligned = score >= (strict ? 0.5 : 0.8);

  return {
    ...contract,
    adminTitle: actualTitle,
    strict,
    similarity: score,
    status: aligned ? "aligned" : strict ? "mismatch" : "known-exception",
    statusLabel: aligned
      ? "Student/Admin aligned"
      : strict
        ? "Curriculum mismatch"
        : "Known sequence difference",
    note: aligned
      ? "Teacher slides and the learner Course Book point to the same lesson topic."
      : strict
        ? "This lesson should be reviewed before class because the Admin topic does not match the learner Course Book."
        : "C1 currently uses a different Admin sequence. Use the learner reference below when bridging students back to Falowen.",
  };
}

export function buildCourseBookBridgeItems(slide = {}) {
  const reference = getCurriculumParityReference(slide);
  if (!reference) return [];
  const level = reference.level;
  const day = reference.day;
  const grammarUrl = String(slide.workbookConnection?.grammarUrl || "");
  const workbookUrl = String(slide.workbookConnection?.workbookUrl || "");

  return [
    {
      label: "1. Grammar",
      detail: `Students review the ${level} Day ${day} grammar and correct any target-structure errors from class.`,
      url: grammarUrl,
    },
    {
      label: "2. Speak",
      detail: "Students complete or repeat the speaking task in Falowen using the corrected class language.",
      url: "",
    },
    {
      label: "3. Write",
      detail: "Students complete the lesson writing task and use Falowen feedback before marking it finished.",
      url: "",
    },
    {
      label: "4. Workbook / Submit",
      detail: workbookUrl
        ? "Open the lesson workbook, complete the required sections and submit where the Course Book requires submission."
        : `Open Falowen Course Book → ${level} Day ${day}, complete the workbook sections and submit any required assignment.`,
      url: workbookUrl,
    },
  ];
}

export function auditCurriculumParity(slides = []) {
  return (Array.isArray(slides) ? slides : [])
    .map((slide) => ({ slide, reference: getCurriculumParityReference(slide) }))
    .filter(({ reference }) => reference)
    .map(({ slide, reference }) => ({
      level: reference.level,
      day: reference.day,
      canonicalId: reference.canonicalId,
      studentTitle: reference.title,
      adminTitle: String(slide.title || slide.topic || ""),
      status: reference.status,
      strict: reference.strict,
      similarity: reference.similarity,
    }));
}
