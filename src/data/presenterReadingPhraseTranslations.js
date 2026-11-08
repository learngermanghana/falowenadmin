import { getAdvancedReadingPhraseTranslations } from "./advancedReadingGlossary.js";
// Curated phrase translations from src/data/presenterReadingLessons.js, keyed by
// the *actual* teaching-slide assignment ID, not the student's workbook day.
// Every phrase is verified against the corresponding presenter passage in tests.
// No translation API, grading hints, or answers are used.
export const PRESENTER_READING_PHRASES = Object.freeze({
  "A2-1.1": [
    [
      "noch kaum",
      "hardly know (each other) yet"
    ],
    [
      "Weg zur Arbeit",
      "journey to work / commute"
    ],
    [
      "Gehalt",
      "salary"
    ],
    [
      "wechselt das Thema",
      "changes the subject"
    ],
    [
      "verabreden sie sich",
      "they arrange to meet"
    ]
  ],
  "A2-1.2": [
    [
      "neue Kollegin",
      "new female colleague"
    ],
    [
      "kurze dunkle Haare",
      "short dark hair"
    ],
    [
      "Rucksack",
      "backpack"
    ],
    [
      "Computerproblemen",
      "computer problems"
    ],
    [
      "Bäckerei",
      "bakery"
    ]
  ],
  "A2-1.3": [
    [
      "täglichen Weg",
      "daily journey"
    ],
    [
      "kostet weniger",
      "costs less"
    ],
    [
      "bequemeren Sattel",
      "more comfortable saddle"
    ],
    [
      "in den dritten Stock",
      "up to the third floor"
    ],
    [
      "obwohl",
      "although"
    ]
  ],
  "A2-2.4": [
    [
      "siebzehn Uhr",
      "5 p.m."
    ],
    [
      "Vorstellung",
      "film screening"
    ],
    [
      "halb sieben",
      "half past six"
    ],
    [
      "vorher",
      "beforehand"
    ],
    [
      "direkt am Kino",
      "right at the cinema"
    ]
  ],
  "A2-2.5": [
    [
      "geschlossen",
      "closed"
    ],
    [
      "lieber",
      "preferably / rather"
    ],
    [
      "Spaziergang am See",
      "walk by the lake"
    ],
    [
      "etwas Passendes",
      "something suitable"
    ],
    [
      "diesmal",
      "this time"
    ]
  ],
  "A2-3.6": [
    [
      "neben der Tür",
      "next to the door"
    ],
    [
      "dunkel",
      "dark"
    ],
    [
      "bleibt dort",
      "stays there"
    ],
    [
      "auf das Regal",
      "onto the shelf"
    ],
    [
      "umzustellen",
      "to rearrange / move"
    ]
  ],
  "A2-3.7": [
    [
      "Zweizimmerwohnung",
      "two-room apartment"
    ],
    [
      "Kaltmiete",
      "rent excluding utilities"
    ],
    [
      "Mieter",
      "tenant"
    ],
    [
      "nach Absprache",
      "by arrangement"
    ],
    [
      "einziehen",
      "to move in"
    ]
  ],
  "A2-3.8": [
    [
      "Vorspeise",
      "starter / appetizer"
    ],
    [
      "gehören",
      "are included with"
    ],
    [
      "nicht verträgt",
      "cannot tolerate"
    ],
    [
      "Tomatensoße",
      "tomato sauce"
    ],
    [
      "Dessert",
      "dessert"
    ]
  ],
  "A2-4.9": [
    [
      "Letzten Sommer",
      "last summer"
    ],
    [
      "stark geregnet",
      "rained heavily"
    ],
    [
      "geplant",
      "planned"
    ],
    [
      "ausgefallen",
      "cancelled"
    ],
    [
      "Trotz der Änderungen",
      "despite the changes"
    ]
  ],
  "A2-4.10": [
    [
      "Altstadt",
      "old town"
    ],
    [
      "früher",
      "previously / formerly"
    ],
    [
      "ausgebucht",
      "fully booked"
    ],
    [
      "stattdessen",
      "instead"
    ],
    [
      "fand",
      "found"
    ]
  ],
  "A2-4.11": [
    [
      "Stadtrand",
      "outskirts of the city"
    ],
    [
      "halbe Stunde",
      "half an hour"
    ],
    [
      "Gebäude",
      "building"
    ],
    [
      "Taxifahrt",
      "taxi ride"
    ],
    [
      "rechtzeitig",
      "on time"
    ]
  ],
  "A2-5.12": [
    [
      "Pflegekraft",
      "care worker"
    ],
    [
      "körperlich anstrengend",
      "physically demanding"
    ],
    [
      "zweiwöchiges Praktikum",
      "two-week internship"
    ],
    [
      "frühe Aufstehen",
      "getting up early"
    ],
    [
      "Berufsberaterin",
      "female career counsellor"
    ]
  ],
  "A2-5.13": [
    [
      "bewirbt sich",
      "applies (for a job)"
    ],
    [
      "unzufriedenen Kunden",
      "dissatisfied customer"
    ],
    [
      "zugehört",
      "listened"
    ],
    [
      "besonders",
      "especially"
    ],
    [
      "Rückmeldung",
      "response / feedback"
    ]
  ],
  "A2-5.14": [
    [
      "im Verkauf",
      "in retail / sales"
    ],
    [
      "Tabellen am Computer",
      "computer spreadsheets"
    ],
    [
      "Fähigkeit",
      "skill / ability"
    ],
    [
      "Dienstplan",
      "work schedule"
    ],
    [
      "intern bewerben",
      "apply internally"
    ]
  ],
  "A2-6.15": [
    [
      "Wettkämpfe",
      "competitions"
    ],
    [
      "ohne Zeitmessung",
      "without timing"
    ],
    [
      "zwischendurch",
      "from time to time / in between"
    ],
    [
      "probiert",
      "tries"
    ],
    [
      "Mitglied",
      "member"
    ]
  ],
  "A2-6.16": [
    [
      "müde",
      "tired"
    ],
    [
      "Abendessen",
      "evening meal"
    ],
    [
      "Nachbarin",
      "female neighbour"
    ],
    [
      "wegen des Regens",
      "because of the rain"
    ],
    [
      "Bildschirm",
      "screen"
    ]
  ],
  "A2-6.17": [
    [
      "Husten",
      "cough"
    ],
    [
      "Beschwerden",
      "symptoms / complaints"
    ],
    [
      "bereits",
      "already"
    ],
    [
      "Angaben auf der Packung",
      "information on the package"
    ],
    [
      "noch nichts",
      "nothing yet"
    ]
  ],
  "A2-7.18": [
    [
      "Bankkarte",
      "bank card"
    ],
    [
      "Ersatzkarte",
      "replacement card"
    ],
    [
      "alte Karte",
      "old card"
    ],
    [
      "gesperrt bleibt",
      "remains blocked"
    ],
    [
      "Geld abheben",
      "withdraw cash"
    ]
  ],
  "A2-7.19": [
    [
      "Wasserkocher",
      "electric kettle"
    ],
    [
      "dasselbe Modell",
      "the same model"
    ],
    [
      "Versandkosten",
      "shipping costs"
    ],
    [
      "sofort mitnehmen",
      "take it away immediately"
    ],
    [
      "in seiner Straße",
      "on his street"
    ]
  ],
  "A2-7.20": [
    [
      "Größe vierzig",
      "size forty"
    ],
    [
      "Geliefert wird",
      "what is delivered is"
    ],
    [
      "Bestellnummer",
      "order number"
    ],
    [
      "Etiketts",
      "label / tag"
    ],
    [
      "richtige Größe",
      "correct size"
    ],
    [
      "prüft",
      "checks / reviews"
    ]
  ],
  "A2-8.21": [
    [
      "picknicken",
      "have a picnic"
    ],
    [
      "trocken bleibt",
      "stays dry"
    ],
    [
      "stattdessen",
      "instead"
    ],
    [
      "endgültigen Plan",
      "final plan"
    ],
    [
      "Eintrittskarten",
      "admission tickets"
    ]
  ],
  "A2-8.22": [
    [
      "Heimweg",
      "journey home"
    ],
    [
      "Dienstagabend",
      "Tuesday evening"
    ],
    [
      "bewusst",
      "deliberately / intentionally"
    ],
    [
      "Erholung",
      "rest / recovery"
    ],
    [
      "montags und mittwochs",
      "on Mondays and Wednesdays"
    ],
    [
      "liegen geblieben sind",
      "were left undone"
    ]
  ],
  "A2-9.23": [
    [
      "außerhalb der Innenstadt",
      "outside the city centre"
    ],
    [
      "Bisher",
      "until now"
    ],
    [
      "jede halbe Stunde",
      "every half hour"
    ],
    [
      "Umzug",
      "move / relocation"
    ],
    [
      "früheren Zug",
      "earlier train"
    ]
  ],
  "A2-9.24": [
    [
      "ans Meer fahren",
      "travel to the seaside"
    ],
    [
      "bestätigt",
      "confirmed"
    ],
    [
      "kostenlos stornieren",
      "cancel free of charge"
    ],
    [
      "ohne Stornierung",
      "without a cancellation option"
    ],
    [
      "Zugtickets",
      "train tickets"
    ]
  ],
  "A2-9.25": [
    [
      "ohne Frühstück",
      "without breakfast"
    ],
    [
      "Schicht",
      "work shift"
    ],
    [
      "verlässt",
      "leaves"
    ],
    [
      "weiterhin",
      "still / continuing to"
    ],
    [
      "direkt heim",
      "straight home"
    ]
  ],
  "A2-10.26": [
    [
      "ersten Kurstag",
      "first day of the course"
    ],
    [
      "Teilnehmer",
      "participants"
    ],
    [
      "beruhigt",
      "reassures / calms"
    ],
    [
      "traut sie sich",
      "she dares / feels confident enough"
    ],
    [
      "erleichtert",
      "relieved"
    ]
  ],
  "A2-10.27": [
    [
      "Telefonnummer",
      "telephone number"
    ],
    [
      "Aus Versehen",
      "by mistake"
    ],
    [
      "löscht",
      "deletes"
    ],
    [
      "bereits gesehen",
      "already seen"
    ],
    [
      "Empfänger",
      "recipient"
    ]
  ],
  "A2-10.28": [
    [
      "Ausbildung",
      "vocational training / apprenticeship"
    ],
    [
      "Bewerbungsunterlagen",
      "application documents"
    ],
    [
      "Lerngruppe",
      "study group"
    ],
    [
      "übersetzen lassen",
      "have translated"
    ],
    [
      "Ausbildungsplatz",
      "apprenticeship position"
    ]
  ],
  "B1-1.1": [
    [
      "mit Freiheit verband",
      "associated with freedom"
    ],
    [
      "Schulpraktikums",
      "school work-placement / internship"
    ],
    [
      "Mechatroniker",
      "mechatronics technician"
    ],
    [
      "beruflich unterwegs",
      "travelling for work"
    ],
    [
      "gescheiterten Plan",
      "failed plan"
    ]
  ],
  "B1-1.2": [
    [
      "verspricht",
      "promises"
    ],
    [
      "unerwarteten Arbeitsschicht",
      "unexpected work shift"
    ],
    [
      "Umzugskartons",
      "moving boxes"
    ],
    [
      "zuverlässig",
      "dependable"
    ],
    [
      "Verantwortung für Zusagen",
      "responsibility for commitments"
    ]
  ],
  "B1-1.3": [
    [
      "verzögerte",
      "delayed"
    ],
    [
      "Rückmeldungen",
      "feedback / responses"
    ],
    [
      "Bestellungen bearbeitete",
      "processed orders"
    ],
    [
      "Stammkunden",
      "regular customers"
    ],
    [
      "Verzögerung",
      "delay"
    ]
  ],
  "B1-2.4": [
    [
      "zusätzliches Arbeitszimmer",
      "additional home office / study"
    ],
    [
      "innerhalb ihres Budgets",
      "within their budget"
    ],
    [
      "Fahrtkosten",
      "transport costs"
    ],
    [
      "verzichtbar",
      "not essential / dispensable"
    ],
    [
      "als Ausgleich",
      "as compensation / an alternative"
    ]
  ],
  "B1-2.5": [
    [
      "Wohnungsbesichtigung",
      "apartment viewing"
    ],
    [
      "Nebenkosten",
      "additional housing costs / utilities"
    ],
    [
      "Heizkosten",
      "heating costs"
    ],
    [
      "aktuelle Aufstellung",
      "up-to-date breakdown"
    ],
    [
      "Gesamtkosten",
      "total costs"
    ]
  ],
  "B1-2.6": [
    [
      "Nach der Geburt",
      "after the birth"
    ],
    [
      "vermissen",
      "miss / long for"
    ],
    [
      "von zu Hause arbeitet",
      "works from home"
    ],
    [
      "selten",
      "infrequently"
    ],
    [
      "Lebenssituation",
      "life situation"
    ]
  ],
  "B1-3.7": [
    [
      "Kantine",
      "canteen / cafeteria"
    ],
    [
      "Auflauf",
      "casserole / baked dish"
    ],
    [
      "Portionsgröße",
      "portion size"
    ],
    [
      "mit Gemüse kombiniert",
      "combines with vegetables"
    ],
    [
      "Essgewohnheiten",
      "eating habits"
    ]
  ],
  "B1-3.8": [
    [
      "Bewegungspausen",
      "movement / activity breaks"
    ],
    [
      "freiwillig",
      "voluntary"
    ],
    [
      "mitmachen",
      "take part"
    ],
    [
      "individuelle Beratung",
      "individual advice"
    ],
    [
      "klären",
      "clarify"
    ]
  ],
  "B1-3.9": [
    [
      "flexibel gestalten",
      "organize flexibly"
    ],
    [
      "Benachrichtigungen",
      "notifications"
    ],
    [
      "gewöhnliche Anfragen",
      "routine enquiries"
    ],
    [
      "gesonderter Kontaktweg",
      "separate contact channel"
    ],
    [
      "Feierabendgrenze",
      "boundary around time off work"
    ]
  ],
  "B1-4.10": [
    [
      "eine neue Regel",
      "a new rule"
    ],
    [
      "pflegebedürftigen",
      "in need of care"
    ],
    [
      "subjektiv",
      "subjectively / in her perception"
    ],
    [
      "Veranstaltung",
      "event"
    ],
    [
      "beibehalten",
      "keep / maintain"
    ]
  ],
  "B1-4.11": [
    [
      "fertigstellen",
      "complete / finish"
    ],
    [
      "recherchiert",
      "researches"
    ],
    [
      "Quelle",
      "source"
    ],
    [
      "Bei der Probe",
      "during the rehearsal"
    ],
    [
      "als Hilfe",
      "as help"
    ]
  ],
  "B1-4.12": [
    [
      "Wettervorhersage",
      "weather forecast"
    ],
    [
      "deutlich stärker",
      "noticeably heavier"
    ],
    [
      "über den Weg floss",
      "flowed across the path"
    ],
    [
      "Schutzhütte",
      "emergency shelter / hut"
    ],
    [
      "vorsichtige Entscheidung",
      "cautious decision"
    ]
  ],
  "B1-4.13": [
    [
      "Heimatdorf",
      "home village"
    ],
    [
      "Landschaftsszenen",
      "landscape scenes"
    ],
    [
      "überzeugend",
      "convincingly"
    ],
    [
      "Rückblende",
      "flashback"
    ],
    [
      "spannenden Thriller",
      "exciting thriller"
    ]
  ],
  "B1-5.14": [
    [
      "verlegt",
      "moves / shifts"
    ],
    [
      "mehrmals abspielen",
      "play repeatedly"
    ],
    [
      "Nachfragen",
      "asking follow-up questions"
    ],
    [
      "offene Fragen",
      "unanswered questions"
    ],
    [
      "Unterstützung",
      "support"
    ]
  ],
  "B1-5.15": [
    [
      "Fahrtzeit",
      "commuting time"
    ],
    [
      "unterschiedliche Zeiten",
      "different working times"
    ],
    [
      "Kernzeit",
      "shared core working hours"
    ],
    [
      "vierwöchigen Versuch",
      "four-week trial"
    ],
    [
      "Flexibilität",
      "flexibility"
    ]
  ],
  "B1-5.16": [
    [
      "mündlichen Prüfungen",
      "oral examinations"
    ],
    [
      "Durchfallen",
      "failing an exam"
    ],
    [
      "Bewertungskriterien",
      "grading criteria"
    ],
    [
      "weitersprechen",
      "continue speaking"
    ],
    [
      "mit der Nervosität umgehen",
      "handle nervousness"
    ]
  ],
  "B1-5.17": [
    [
      "Vokabelliste",
      "vocabulary list"
    ],
    [
      "nicht ein",
      "cannot think of (words)"
    ],
    [
      "aus dem Gedächtnis abzurufen",
      "retrieve from memory"
    ],
    [
      "vereinbaren",
      "arrange / agree"
    ],
    [
      "passende Wörter",
      "suitable words"
    ]
  ],
  "B1-6.18": [
    [
      "leiten",
      "lead / manage"
    ],
    [
      "Stellenausschreibungen",
      "job advertisements"
    ],
    [
      "gezielt zu schließen",
      "to close specifically (a skills gap)"
    ],
    [
      "Dienstplanung",
      "staff scheduling"
    ],
    [
      "Beförderung",
      "promotion"
    ]
  ],
  "B1-6.19": [
    [
      "Vorstellungsgespräch",
      "job interview"
    ],
    [
      "Praktikanten betreut",
      "supervised interns"
    ],
    [
      "eingeführt",
      "introduced / implemented"
    ],
    [
      "Personalchefin",
      "head of HR (female)"
    ],
    [
      "nachvollziehbar",
      "understandable and credible"
    ]
  ],
  "B1-6.20": [
    [
      "Kundenservice",
      "customer service"
    ],
    [
      "vorausgesetzt",
      "required / assumed"
    ],
    [
      "erwünscht",
      "desirable / preferred"
    ],
    [
      "erfüllt",
      "meets / fulfils"
    ],
    [
      "anhand",
      "using / on the basis of"
    ],
    [
      "steht noch nicht fest",
      "has not yet been decided"
    ]
  ],
  "B1-7.21": [
    [
      "Wohngemeinschaft",
      "shared flat"
    ],
    [
      "dadurch monatlich",
      "per month as a result"
    ],
    [
      "Reinigung",
      "cleaning"
    ],
    [
      "privaten Bereich",
      "private space"
    ],
    [
      "vermisst",
      "misses"
    ]
  ],
  "B1-7.22": [
    [
      "Dating-App",
      "dating app"
    ],
    [
      "während",
      "whereas / while"
    ],
    [
      "kurzfristig absagt",
      "cancels at short notice"
    ],
    [
      "Erwartungen",
      "expectations"
    ],
    [
      "vertraut und respektiert",
      "trusts and respects"
    ]
  ],
  "B1-7.23": [
    [
      "verabreden sich",
      "arrange to meet"
    ],
    [
      "danach",
      "afterwards"
    ],
    [
      "privaten Antworten",
      "private answers"
    ],
    [
      "verabschieden",
      "say goodbye"
    ],
    [
      "weiteres Treffen",
      "another meeting"
    ]
  ],
  "B1-8.24": [
    [
      "sparsameres Modell",
      "more energy-efficient model"
    ],
    [
      "ersetzt",
      "replaced"
    ],
    [
      "Stromverbrauch",
      "electricity consumption"
    ],
    [
      "bezahlbar",
      "affordable"
    ],
    [
      "nachhaltiger",
      "more sustainable"
    ]
  ],
  "B1-8.25": [
    [
      "Bestellbestätigung",
      "order confirmation"
    ],
    [
      "Sendungsverfolgung",
      "parcel tracking"
    ],
    [
      "Nachbarn",
      "neighbours"
    ],
    [
      "sachlichen Beschreibung",
      "factual description"
    ],
    [
      "Rückzahlung",
      "refund"
    ]
  ],
  "B1-9.26": [
    [
      "Zugverspätung",
      "train delay"
    ],
    [
      "übersteigt",
      "exceeds"
    ],
    [
      "Bahnverbindung",
      "train connection"
    ],
    [
      "Umbuchung",
      "rebooking"
    ],
    [
      "nachvollziehen",
      "reconstruct / understand afterwards"
    ]
  ],
  "B1-10.27": [
    [
      "statt des Autos",
      "instead of the car"
    ],
    [
      "Fahrradständer",
      "bicycle racks"
    ],
    [
      "Besorgungen",
      "errands"
    ],
    [
      "schrittweisen Veränderung",
      "gradual change"
    ],
    [
      "Radweg",
      "cycle path"
    ]
  ],
  "B1-10.28": [
    [
      "Umstieg",
      "switch / changeover"
    ],
    [
      "Spätschicht",
      "late shift"
    ],
    [
      "bezahlbare Tickets",
      "affordable tickets"
    ],
    [
      "probeweise",
      "on a trial basis"
    ],
    [
      "dauerhaft ausgeweitet",
      "permanently expanded"
    ]
  ]
});

export function getPresenterReadingPhraseTranslations(assignmentId = "") {
  const key = String(assignmentId || "").trim().toUpperCase();
  if (!PRESENTER_READING_PHRASES[key]) {
    const level = key.match(/^(B2|C1|C2)(?=[\\s-]|$)/)?.[1];
    return level ? getAdvancedReadingPhraseTranslations(level) : [];
  }
  const phrases = PRESENTER_READING_PHRASES[key];
  return phrases.map(([de, en]) => ({ de, en }));
}
