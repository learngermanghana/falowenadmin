// Falowen C1 academic extension. Existing course identity remains unchanged.
// Themes adapted from the supplied C1 master syllabus; exam format checked against
// https://www.goethe.de/ins/de/de/prf/gzc1.cfm and the Goethe C1 modular model set.
// Daily tasks are practice guidance, not complete exam items or official scoring.
export const C1_EXAM_FORMAT = Object.freeze({
  Lesen: Object.freeze({ minutes: 65, parts: 4, items: 30 }),
  Hören: Object.freeze({ minutes: 40, parts: 4, items: 30 }),
  Schreiben: Object.freeze({ minutes: 75, parts: 2, words: Object.freeze([230, 120]), suggestedMinutes: Object.freeze([50, 25]) }),
  Sprechen: Object.freeze({ minutes: 20, parts: 2, preparationMinutes: 20, pair: true }),
  passPerModule: 60,
});
const rows = [
  [
    "Wissenschaftliches Lernen und Lernstrategien",
    "Lesen",
    1,
    "Nomen-Verb-Verbindungen",
    "Eine Zwischenbilanz ziehen",
    "Die Lernenden ziehen regelmäßig eine Zwischenbilanz, um ihren Fortschritt zu beurteilen.",
    "Erkläre anhand eines Fachartikels, welche Wortverbindungen die Bedeutung einer Lücke bestimmen.",
    "die Lernwirksamkeit|eine Zwischenbilanz ziehen|die Erkenntnis|die Selbstreflexion"
  ],
  [
    "Kulturelle Identität und Globalisierung",
    "Hören",
    1,
    "Erweiterte Partizipialattribute",
    "durch Migration geprägte Identitäten",
    "Die durch Migration geprägten Identitäten lassen sich nicht auf eine Herkunft reduzieren.",
    "Ordne Aussagen aus einem Podcast über kulturelle Zugehörigkeit den jeweiligen Beiträgen zu.",
    "die Zugehörigkeit|die kulturelle Prägung|das Selbstverständnis|der Identitätswandel"
  ],
  [
    "Fake News, Algorithmen und Medienkritik",
    "Sprechen",
    1,
    "Konjunktiv I",
    "eine Behauptung distanziert wiedergeben",
    "Die Redaktion erklärt, der Beitrag sei nicht ausreichend überprüft worden.",
    "Halte einen Vortrag über die Verantwortung von Plattformen; beantworte anschließend kritische Nachfragen.",
    "die Quellenkritik|eine Behauptung überprüfen|die Desinformation|die Reichweite"
  ],
  [
    "Konfliktmanagement und moderne Arbeitskultur",
    "Schreiben",
    2,
    "Erweiterte Partizipialattribute",
    "die von Mitarbeitenden geäußerten Bedenken",
    "Die von Mitarbeitenden geäußerten Bedenken sollten ernst genommen werden.",
    "Schreibe an die Teamleitung: Verständnis zeigen, Konflikt schildern, Bedingungen nennen und Kompromiss vorschlagen.",
    "die Konfliktbewältigung|einen Kompromiss aushandeln|die Zuständigkeit|Bedenken äußern"
  ],
  [
    "Fachkräftemangel und Weiterbildung",
    "Lesen",
    2,
    "Konditionale Strukturen",
    "vorausgesetzt, dass",
    "Weiterbildung kann Engpässe verringern, vorausgesetzt, dass Beschäftigte Zugang dazu haben.",
    "Unterscheide in einem Fachartikel über Fachkräftemangel Hauptthesen, Belege und Einschränkungen.",
    "der Fachkräftebedarf|die Qualifizierung|Engpässe beheben|der Weiterbildungsbedarf"
  ],
  [
    "Gesundheitspolitik und Prävention",
    "Hören",
    2,
    "Passiversatzformen",
    "sich lassen + Infinitiv",
    "Gesundheitsrisiken lassen sich durch gezielte Prävention teilweise verringern.",
    "Erfasse in einem Experteninterview Aussagen zu Prävention und sozialer Ungleichheit; unterscheide Ursache und Folge.",
    "die Gesundheitsversorgung|die Vorsorge|die Risikominderung|die Versorgungslücke"
  ],
  [
    "Nachhaltiger Tourismus und Overtourism",
    "Sprechen",
    2,
    "Konzessive Konnektoren",
    "wenngleich",
    "Wenngleich der Tourismus Arbeitsplätze schafft, sind seine ökologischen Folgen zu berücksichtigen.",
    "Diskutiere zu zweit, ob Besucherzahlen in stark belasteten Regionen begrenzt werden sollten.",
    "der Massentourismus|die Tragfähigkeit|die Umweltbelastung|Interessen abwägen"
  ],
  [
    "Smart Cities und Wohnraumpolitik",
    "Schreiben",
    1,
    "Nominalstil und Verbalstil",
    "angesichts + Genitiv",
    "Angesichts steigender Mieten sind sozial ausgewogene Maßnahmen erforderlich.",
    "Verfasse einen Forumsbeitrag: Ursachen erläutern, eine Maßnahme begründen, Nachteile nennen und Alternative entwickeln.",
    "die Wohnraumknappheit|die Stadtentwicklung|die Verdichtung|Maßnahmen ergreifen"
  ],
  [
    "Verbraucherschutz und Obsoleszenz",
    "Lesen",
    3,
    "Adversative Konnektoren",
    "wohingegen",
    "Langlebige Geräte schonen Ressourcen, wohingegen kurzlebige Produkte Abfall verursachen.",
    "Rekonstruiere einen Kommentar anhand fehlender Sätze; achte auf Pronomen, Kontraste und logische Übergänge.",
    "die Obsoleszenz|die Reparierbarkeit|der Verbraucherschutz|die Nutzungsdauer"
  ],
  [
    "Migration und Chancengleichheit",
    "Hören",
    3,
    "Passiversatzformen",
    "sein + zu + Infinitiv",
    "Ausländische Berufsabschlüsse sind nach transparenten Kriterien zu beurteilen.",
    "Unterscheide in einer Diskussion drei Positionen zur Anerkennung von Qualifikationen.",
    "die Anerkennung|die Zugangsbarriere|die Chancengleichheit|Benachteiligung abbauen"
  ],
  [
    "Zivilcourage und gesellschaftliche Verantwortung",
    "Sprechen",
    1,
    "Nomen-Verb-Verbindungen",
    "Verantwortung übernehmen",
    "Wer in Konfliktsituationen Verantwortung übernimmt, kann zur Stärkung des Zusammenhalts beitragen.",
    "Halte einen Vortrag zur gesellschaftlichen Verantwortung und beantworte eine kritische Nachfrage.",
    "die Zivilcourage|Verantwortung übernehmen|die Solidarität|Stellung beziehen"
  ],
  [
    "Kunstmarkt und staatliche Kulturförderung",
    "Schreiben",
    2,
    "Konzessive Strukturen",
    "ungeachtet + Genitiv",
    "Ungeachtet finanzieller Engpässe sollte kulturelle Teilhabe ermöglicht werden.",
    "Schreibe an eine Kulturinstitution: Verständnis zeigen, Zugangsproblem erläutern, Wunsch nennen und Lösung vorschlagen.",
    "die Kulturförderung|die Subvention|die kulturelle Teilhabe|Mittel bereitstellen"
  ],
  [
    "Sprachwandel, Anglizismen und Bilingualismus",
    "Lesen",
    4,
    "Nominalstil",
    "die Förderung der Mehrsprachigkeit",
    "Die Förderung der Mehrsprachigkeit setzt geeignete Bildungsangebote voraus.",
    "Ordne Aussagen zur Rolle von Anglizismen und Mehrsprachigkeit verschiedenen Autorenpositionen zu.",
    "der Sprachwandel|die Sprachkompetenz|die Mehrsprachigkeit|der Sprachgebrauch"
  ],
  [
    "Start-ups und Technologiefolgen",
    "Hören",
    4,
    "Subjektive Modalverben",
    "dürfte + Infinitiv",
    "Die Innovation dürfte langfristig neue Geschäftsmodelle ermöglichen.",
    "Notiere aus einem Vortrag über Start-ups Chancen, Risiken, Beispiele und den Grad der Gewissheit.",
    "das Wagniskapital|die Technologiefolgen|die Markteinführung|Risiken abschätzen"
  ],
  [
    "Bildungsungleichheit und Inklusion",
    "Sprechen",
    2,
    "Konditionale Konnektoren",
    "unter der Voraussetzung, dass",
    "Digitale Bildung kann Chancen verbessern, unter der Voraussetzung, dass der Zugang gesichert ist.",
    "Diskutiere, wie Schulen Chancengleichheit fördern können, und reagiere auf Einwände.",
    "die Bildungsungleichheit|die Inklusion|der Bildungszugang|Hürden abbauen"
  ],
  [
    "Künstliche Intelligenz und Urheberrecht",
    "Schreiben",
    1,
    "Passiversatzformen",
    "-bar",
    "Die Herkunft KI-generierter Inhalte ist nicht immer nachvollziehbar.",
    "Verfasse einen Forumsbeitrag zu KI und Urheberrecht mit vier Inhaltspunkten und begründeter Position.",
    "das Urheberrecht|die Schutzrechte|die Nachvollziehbarkeit|Ansprüche geltend machen"
  ],
  [
    "Klimawandel und Biodiversität",
    "Lesen",
    3,
    "Nominalstil",
    "in Anbetracht + Genitiv",
    "In Anbetracht des Artenverlusts sind langfristige Schutzmaßnahmen erforderlich.",
    "Rekonstruiere einen Kommentar über Biodiversität anhand fehlender Sätze; prüfe Konnektoren und Rückbezüge.",
    "die Artenvielfalt|der Artenschutz|der Lebensraumverlust|Schutzmaßnahmen ergreifen"
  ],
  [
    "Armut, Reichtum und soziale Gerechtigkeit",
    "Hören",
    1,
    "Adversative Strukturen",
    "einerseits ... andererseits",
    "Einerseits können Transfers Armut lindern, andererseits ist ihre Finanzierung zu berücksichtigen.",
    "Ordne Podcastaussagen zu sozialer Ungleichheit den passenden Abschnitten zu.",
    "die Vermögensverteilung|die Armutsgefährdung|die Umverteilung|soziale Ungleichheit"
  ],
  [
    "Digitalisierung der Arbeitswelt 4.0",
    "Sprechen",
    1,
    "Subjektive Modalverben",
    "könnte / dürfte",
    "Die Automatisierung dürfte einige Tätigkeiten verändern, ohne alle Berufe zu ersetzen.",
    "Halte einen Vortrag über Automatisierung mit einem konkreten Beispiel und beantworte Nachfragen.",
    "die Automatisierung|der Strukturwandel|die Beschäftigungssicherheit|Kompetenzen erwerben"
  ],
  [
    "KI im Gesundheitswesen und Telemedizin",
    "Schreiben",
    2,
    "Passiversatzformen",
    "sich lassen + Infinitiv",
    "Nicht alle medizinischen Beschwerden lassen sich aus der Ferne beurteilen.",
    "Schreibe an eine Praxisleitung: Verständnis zeigen, Datenschutzbedenken erläutern, Bedingungen nennen und Alternative vorschlagen.",
    "die Telemedizin|die Datensicherheit|die Ferndiagnose|Verantwortung klären"
  ],
  [
    "Globale Migration und Arbeitsmarkt",
    "Lesen",
    2,
    "Kausale Strukturen",
    "aufgrund + Genitiv",
    "Aufgrund fehlender Anerkennung bleiben vorhandene Qualifikationen teilweise ungenutzt.",
    "Unterscheide in einem Fachtext zu Migration und Arbeitsmarkt Befunde, Vermutungen und Bewertungen.",
    "die Arbeitsmigration|die Berufsanerkennung|die Erwerbstätigkeit|den Zugang erleichtern"
  ],
  [
    "Zukunft des Journalismus und Meinungsfreiheit",
    "Hören",
    2,
    "Konjunktiv I",
    "indirekte Rede",
    "Die Journalistin betont, unabhängige Medien seien für die öffentliche Debatte unverzichtbar.",
    "Erfasse in einem Interview Aussagen zur journalistischen Unabhängigkeit und erkenne Einschränkungen.",
    "die Meinungsfreiheit|die Pressefreiheit|die redaktionelle Unabhängigkeit|Quellen offenlegen"
  ],
  [
    "Bedingungsloses Grundeinkommen und Arbeitszeit",
    "Sprechen",
    2,
    "Konditionale und konzessive Strukturen",
    "es sei denn",
    "Ein Grundeinkommen könnte Sicherheit schaffen, es sei denn, seine Finanzierung führt zu erheblichen Belastungen.",
    "Diskutiere die Auswirkungen eines Grundeinkommens auf Arbeitszeit, Finanzierung und soziale Sicherheit.",
    "das Grundeinkommen|die Existenzsicherung|der Arbeitsanreiz|die Finanzierbarkeit"
  ],
  [
    "Urbane Mobilität und Energiewende",
    "Schreiben",
    1,
    "Nominalstil und Konnektoren",
    "folglich",
    "Der Ausbau des Nahverkehrs kann Emissionen senken; folglich sind Investitionen abzuwägen.",
    "Verfasse einen Forumsbeitrag zu nachhaltiger Mobilität; erkläre Kriterien, Beispiel, Einwände und Alternative.",
    "die Verkehrswende|die Infrastruktur|der Energiebedarf|Emissionen senken"
  ],
  [
    "Gentechnik und Wissenschaftsethik",
    "Lesen",
    4,
    "Erweiterte Partizipialattribute",
    "die von Forschenden entwickelten Verfahren",
    "Die von Forschenden entwickelten Verfahren werfen neue ethische Fragen auf.",
    "Ordne Aussagen zur Gentechnik verschiedenen Fachpositionen zu; unterscheide Belege und ethische Bewertungen.",
    "die Forschungsethik|die Tragweite|die Gentechnik|etwas infrage stellen"
  ],
  [
    "Kreislaufwirtschaft und Rohstoffmangel",
    "Hören",
    4,
    "Nomen-Verb-Verbindungen",
    "einen Beitrag leisten",
    "Reparierbare Produkte können einen Beitrag zur Ressourcenschonung leisten.",
    "Erfasse in einem Vortrag über Rohstoffmangel zentrale Aussagen, Beispiele und Detailinformationen.",
    "die Kreislaufwirtschaft|die Rohstoffknappheit|die Lieferkette|Ressourcen schonen"
  ],
  [
    "Digitalisierung, Datenschutz und Regulierung",
    "Sprechen",
    1,
    "Passiversatzformen",
    "sein + zu + Infinitiv",
    "Bei digitalen Verwaltungsdiensten sind Datenschutz und Barrierefreiheit zu gewährleisten.",
    "Halte einen Vortrag zu digitalen Verwaltungsdiensten und beantworte Fragen zu Zugang und Regulierung.",
    "die Regulierung|die Barrierefreiheit|die Datensparsamkeit|Rechte gewährleisten"
  ],
  [
    "Rentensysteme und Generationengerechtigkeit",
    "Schreiben",
    1,
    "Nominalstil und Schlussfolgerung",
    "demzufolge",
    "Die Zahl der Beitragszahlenden sinkt; demzufolge ist die Finanzierung langfristig zu prüfen.",
    "Verfasse einen Forumsbeitrag über Rentensysteme: Kriterien erläutern, Reform begründen, Risiken nennen und Alternative vorschlagen.",
    "die Rentenfinanzierung|die Generationengerechtigkeit|die Beitragslast|die demografische Entwicklung"
  ]
];
export const C1_ACADEMIC_DAYS = Object.freeze(rows.map(([topic, skill, part, grammar, structure, example, task, terms], index) => Object.freeze({
  day: index + 1, topic, skill, part, grammar, structure, example, task,
  vocabulary: Object.freeze(terms.split("|")),
})));
export const getC1AcademicDay = (day) => {
  const n = Number(day);
  return Number.isInteger(n) && n >= 1 && n <= 28 ? C1_ACADEMIC_DAYS[n - 1] : null;
};
// Revision and mock are a separate exam-preparation sequence, not new assignment IDs.
export const C1_EXAM_PREPARATION = Object.freeze([
  Object.freeze({ day: 29, title: "Intensive Prüfungsvorbereitung", task: "Bearbeite gezielt Schwächen in allen vier Modulen; wiederhole Zeitmanagement, Aufgabenformate und Fehleranalyse." }),
  Object.freeze({ day: 30, title: "C1 Prüfungssimulation", task: "Bearbeite eine vollständige Simulation in vier Modulen; bewerte jedes Modul separat." }),
]);
