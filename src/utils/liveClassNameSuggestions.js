const CITY_NAME_DICTIONARY = [
  "Berlin",
  "Dortmund",
  "Hamburg",
  "Leipzig",
  "Stuttgart",
  "Freiburg",
  "Munich",
  "Cologne",
  "Frankfurt",
  "Bremen",
  "Dresden",
  "Hannover",
  "Bonn",
  "Nuremberg",
  "Heidelberg",
  "Mannheim",
  "Augsburg",
  "Kiel",
  "Potsdam",
  "Mainz",
  "Wiesbaden",
  "Essen",
  "Dusseldorf",
  "Bochum",
  "Bielefeld",
  "Karlsruhe",
  "Ulm",
  "Regensburg",
  "Rostock",
  "Erfurt",
  "Kassel",
  "Saarbrucken",
];

function normalize(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function classDisplayName(klass = {}) {
  return String(klass.name || klass.className || klass.classId || "").trim();
}

export function classNameCanBeReused(klass = {}) {
  const status = normalize(klass.status);
  return ["archived", "draft"].includes(status) || !klass.startDate || !klass.endDate;
}

export function blockedClassNames(classes = []) {
  return new Set(
    (Array.isArray(classes) ? classes : [])
      .filter((klass) => !classNameCanBeReused(klass))
      .map(classDisplayName)
      .map(normalize)
      .filter(Boolean),
  );
}

export function classNameSuggestions(levelId, classes = [], limit = 6) {
  const level = String(levelId || "").trim().toUpperCase();
  if (!level) return [];

  const blocked = blockedClassNames(classes);
  return CITY_NAME_DICTIONARY
    .map((city) => `${level} ${city} Klasse`)
    .filter((name) => !blocked.has(normalize(name)))
    .slice(0, Math.max(1, Number(limit) || 6));
}

export function isClassNameBlocked(name, classes = []) {
  return blockedClassNames(classes).has(normalize(name));
}

export { CITY_NAME_DICTIONARY };
