import { getAdvancedReadingPhraseTranslations } from "./advancedReadingGlossary.js";
import { getA1ReadingPhraseTranslations } from "./a1ReadingGlossary.js";
// Curated words for A2/B1 STUDENT-WORKBOOK Lesen passages only.
// The teaching presenter has different text: use presenterReadingPhraseTranslations.js
// with the exact assignment ID instead of reusing this day-based vocabulary.
// No translation API or answer-key lookup is used.
const BY_DAY = {
  A2: {
    1: [["Mittagspause", "lunch break"], ["Kantine", "canteen / cafeteria"], ["Feierabend", "end of the working day"], ["eingeladen", "invited"], ["kennenlernen", "to get to know"]],
    2: [["mittelgroß", "of medium height"], ["zuverlässig", "reliable"], ["in ihrer Freizeit", "in her free time"], ["Krankenpfleger", "male nurse"], ["lockige Haare", "curly hair"]],
    3: [["höchstens", "at most"], ["im Monat", "per month"], ["zu Fuß", "on foot"], ["entfernt", "away / located at a distance"], ["Unterricht", "lessons / classes"]],
    4: [["Stadtpark", "city park"], ["regnen", "to rain"], ["neben der", "next to the"], ["reserviere", "reserve / book"], ["am Nachmittag", "in the afternoon"]],
    5: [["Teilnahme", "participation / admission"], ["Anmeldung", "registration"], ["Treffpunkt", "meeting point"], ["ausgeliehen", "borrowed / rented"], ["geeignet", "suitable"]],
    6: [["WG", "shared flat"], ["Schreibtisch", "desk"], ["Schrank", "wardrobe / cupboard"], ["Regal", "shelf"], ["Keller", "basement"]],
    7: [["möbliert", "furnished"], ["ruhige Lage", "quiet location"], ["gemeinsam", "shared / together"], ["Haustiere erlaubt", "pets allowed"], ["warm", "including heating (rent)"]],
    8: [["Speisekarte", "menu"], ["empfehlen", "to recommend"], ["gebratenes", "fried / pan-fried"], ["ohne Kohlensäure", "still / without carbonation"], ["hervorragend", "excellent"]],
    9: [["Buchung", "booking"], ["Einzelzimmer", "single room"], ["pro Nacht", "per night"], ["im Preis enthalten", "included in the price"], ["anreisen", "to arrive (when travelling)"]],
    10: [["Touristeninformation", "tourist information office"], ["Gästekarte", "visitor pass"], ["Rabatte", "discounts"], ["Hafenrundfahrt", "harbour boat tour"], ["einstündige", "lasting one hour"]],
    11: [["Verkehrsmittel", "means of transport"], ["Gepäck", "luggage"], ["Parkplatz", "parking space"], ["lange Strecken", "long distances"], ["bequem", "comfortable / convenient"]],
    12: [["Teilzeit", "part-time"], ["Vollzeit", "full-time"], ["erforderlich", "required"], ["Aushilfe", "temporary assistant"], ["Deutschkenntnisse", "German-language skills"]],
    13: [["Bewerbung", "job application"], ["Vorstellungsgespräch", "job interview"], ["Lebenslauf", "CV / résumé"], ["Zeugnisse", "certificates / references"], ["wahrnehmen", "to attend (an appointment)"]],
    14: [["beantragt", "requested / applied for"], ["Teamleitung", "team leader"], ["ärztliche Bescheinigung", "medical certificate"], ["Weiterbildung", "further training"], ["Personalabteilung", "human resources department"]],
    15: [["Voraussetzung", "requirement / prerequisite"], ["Anmeldung erforderlich", "registration required"], ["ausgeliehen werden", "can be borrowed"], ["Fortgeschrittene", "advanced participants"], ["Teilnahme kostenlos", "participation is free"]],
    16: [["Rückenkurs", "back-care class"], ["Ernährungsberatung", "nutrition counselling"], ["Atemübungen", "breathing exercises"], ["Entspannung", "relaxation"], ["Individuelle Termine", "individual appointments"]],
    17: [["Sonnenschutzmittel", "sun protection products"], ["ausgeschlossen", "excluded"], ["Blutdruck", "blood pressure"], ["Lieferservice", "delivery service"], ["vorbeikommen", "to come by"]],
    18: [["Kontoeröffnung", "opening a bank account"], ["Filiale", "branch office"], ["Meldebescheinigung", "certificate of residence"], ["Einkommensnachweis", "proof of income"], ["verhindert", "unable to attend"]],
    19: [["Wochenmarkt", "weekly market"], ["aus der Region", "locally sourced"], ["Kartenzahlung", "card payment"], ["Backwaren", "baked goods"], ["gut erhaltene", "in good condition"]],
    20: [["Wasserkocher", "electric kettle"], ["schaltet es sich nicht mehr ein", "it no longer switches on"], ["Steckdose", "power socket"], ["Kassenbon", "receipt"], ["Geld zurück", "money back / refund"]],
    21: [["spazieren", "to go for a walk"], ["falls", "in case / if"], ["stattdessen", "instead"], ["reserviert", "reserved / booked"], ["Geschenke", "gifts"]],
    22: [["Hafenrundfahrt", "harbour boat tour"], ["Gästekarte", "visitor pass"], ["Rabatt", "discount"], ["Landungsbrücken", "harbour landing stages"], ["hinteren Plätzen", "seats at the back"]],
    23: [["Innenstadt", "city centre"], ["zu Fuß", "on foot"], ["pünktlich", "on time"], ["im Stau", "in a traffic jam"], ["Monatskarte", "monthly travel pass"]],
    24: [["Betreuung", "childcare / supervision"], ["Städtereise", "city break"], ["Unterkunft", "accommodation"], ["wandern", "to hike"], ["günstige", "affordable / inexpensive"]],
    25: [["Touristeninformation", "tourist information office"], ["Gästekarte", "visitor pass"], ["einstündige Hafenrundfahrt", "one-hour harbour tour"], ["zweistündigen", "lasting two hours"], ["Anschließend", "afterwards"]],
    26: [["schlägt", "suggests"], ["begeistert", "enthusiastic"], ["gelassen", "calm / unbothered"], ["Interesse", "interest"], ["empfiehlt", "recommends"]],
    27: [["unbegrenzt", "unlimited"], ["aktivieren", "to activate"], ["Bestätigung", "confirmation"], ["letzten Reihe", "last row"], ["Hinweis", "notice / important note"]],
    28: [["angekommen", "arrived"], ["ausreichen", "to be enough"], ["Gästekarte", "visitor pass"], ["Rabatt", "discount"], ["spazieren gehen", "to go for a walk"]],
  },
  B1: {
    1: [["Traumdeutung","dream interpretation"],["entschlüsseln","to decipher / interpret"],["Jahrtausenden","for thousands of years"],["Gedächtnisverarbeitung","processing memories"],["Schicksal","fate / destiny"]],
    2: [["Freundschaft","friendship"],["Vertrauen","trust"],["Geheimnisse","secrets"],["Unterstützung","support"],["verlassen","to rely on"]],
    3: [["Helden","heroes"],["im Stillen","quietly / without recognition"],["Hingabe","dedication"],["Mitgefühl","compassion"],["alleinerziehenden","single parent / raising children alone"]],
    4: [["Wohnraum","housing / living space"],["Mieten","rents"],["Interessenten","prospective tenants / applicants"],["Mietpreisbremse","rent-control regulation"],["Neubauprogrammen","new housing development programmes"]],
    5: [["bezahlbaren", "affordable"], ["Besichtigungstermin", "apartment viewing appointment"], ["Interessenten", "interested applicants"], ["Vermieter", "landlord"], ["entspricht", "meets / matches"]],
    6: [["Infrastruktur","infrastructure"],["Verkehrsnetz","transport network"],["Stadtrand","outskirts of a city"],["Gemeinden","municipalities / communities"],["Landleben","life in the countryside"]],
    7: [["Süßigkeiten","sweets / candy"],["Zuckerkonsum","sugar consumption"],["Übergewicht","being overweight"],["verursachen","to cause"],["in Maßen","in moderation"]],
    8: [["Chirurg","surgeon"],["Pflegepersonal","nursing staff"],["Lebensretter","lifesaver"],["übersehen","overlooked"],["belastend","stressful / demanding"]],
    9: [["Auswirkungen", "effects / consequences"], ["bewältigt", "managed / coped with"], ["Zeitdruck", "time pressure"], ["Leistungsdruck", "pressure to perform"], ["ausgewogene Ernährung", "balanced diet"]],
    10: [["Experiment", "experiment"], ["verpassen", "to miss out on"], ["automatisch", "automatically"], ["soziale Medien", "social media"], ["ungelesen", "unread"]],
    11: [["Spielgewohnheiten","playing habits"],["sozialen Interaktion","social interaction"],["strategisches Denken","strategic thinking"],["Brettspiele","board games"],["Verstecken","hide-and-seek"]],
    12: [["Nervenkitzel", "thrill / excitement"], ["Alltagstrott", "daily routine / rut"], ["das Bedürfnis", "the need"], ["weit verbreitet", "widespread"], ["unvergessliche", "unforgettable"]],
    13: [["in seinen Bann gezogen", "captivated / drawn in"], ["Handlung", "plot"], ["geheimnisvollen", "mysterious"], ["Ermittler", "investigator"], ["Hauptfigur", "main character"]],
    14: [["lebenslanges Lernen", "lifelong learning"], ["Anforderungen", "requirements / demands"], ["Weiterbildungsmöglichkeiten", "continuing-education opportunities"], ["Fähigkeiten", "skills"], ["erwerben", "to acquire"]],
    15: [["Vernetzung", "interconnection"], ["drastisch verändert", "changed drastically"], ["zugänglicher", "more accessible"], ["Wissensschatz", "wealth of knowledge"], ["Schattenseiten", "downsides"]],
    16: [["Bildungssystem", "education system"], ["Kurzzeitgedächtnis", "short-term memory"], ["Leistungsstandards", "performance standards"], ["Auseinandersetzung", "in-depth engagement"], ["gewährleisten", "to ensure"]],
    17: [["Lernstoff", "learning material"], ["den Überblick", "an overview"], ["Zusammenfassungen", "summaries"], ["Gedächtnis", "memory"], ["herausgefunden", "found out / discovered"]],
    18: [["Berufswahl", "career choice"], ["Leidenschaft", "passion"], ["Vernunft", "reason / good judgement"], ["äußeren Einflüssen", "external influences"], ["gering", "low / limited"]],
    19: [["Werdegang","career path / professional background"],["Personalleiterin","head of human resources (female)"],["Abteilungsleiter","department head"],["knappen Fristen","tight deadlines"],["Bescheid geben","to let someone know"]],
    20: [["Arbeitsalltag","day-to-day working life"],["anspruchsvoll","demanding / challenging"],["Berufsausbildung","vocational training"],["Sprachkenntnisse","language skills"],["Schulungen","training courses"]],
    21: [["Lebensformen", "ways of living"], ["Wohngemeinschaft", "shared flat"], ["Mietpreise", "rental prices"], ["Kompromisse", "compromises"], ["Auszubildenden", "trainees / apprentices"]],
    22: [["Kontaktanzeigen","personal ads"],["Umfrage","survey"],["schüchterne","shy"],["Online-Dating","online dating"],["warnen davor","warn against"]],
    23: [["ungezwungen", "relaxed / informal"], ["ungestört", "without interruption"], ["Partneragentur", "matchmaking agency"], ["Abendveranstaltung", "evening event"], ["anschließender", "following / afterwards"]],
    24: [["hinterfragen", "to question critically"], ["Nachhaltigkeit", "sustainability"], ["Ressourcen zu schonen", "to conserve resources"], ["Weiterverwendung", "reuse / continued use"], ["Wohlstand", "prosperity"]],
    25: [["Widerrufsrecht", "right to cancel a purchase"], ["Verbraucherrecht", "consumer law"], ["ohne Angabe von Gründen", "without giving a reason"], ["zurückzusenden", "to send back"], ["beschädigt", "damaged"]],
    26: [["geführte", "guided"], ["mehrtägige", "lasting several days"], ["Gepäck", "luggage"], ["Unterkunft", "accommodation"], ["intensiven", "intensive"]],
    27: [["Unverpackt-Läden", "zero-waste / package-free shops"], ["Stoffbeutel", "cloth shopping bags"], ["gewöhnungsbedürftig", "takes getting used to"], ["Vorratsgläser", "storage jars"], ["selbstverständlich", "natural / taken for granted"]],
    28: [["Unverpackt-Läden", "zero-waste / package-free shops"], ["Stoffbeutel", "cloth shopping bags"], ["gewöhnungsbedürftig", "takes getting used to"], ["Vorratsgläser", "storage jars"], ["Mobilität", "transport choices / mobility"]],
  },
};

const COMMON = {
  A2: [["vergleichen", "to compare"], ["trotzdem", "nevertheless"], ["obwohl", "although"], ["deshalb", "therefore"], ["vereinbaren", "to arrange"], ["kostenlos", "free of charge"], ["möglich", "possible"], ["mindestens", "at least"], ["ungefähr", "approximately"]],
  B1: [["allerdings", "however"], ["dennoch", "nevertheless"], ["hingegen", "by contrast"], ["außerdem", "in addition"], ["deshalb", "therefore"], ["während", "while / whereas"], ["trotzdem", "nevertheless"], ["aufgrund", "because of / due to"], ["vermeiden", "to avoid"], ["Entwicklung", "development"], ["Maßnahmen", "measures / actions"], ["nachhaltig", "sustainable"], ["entscheidend", "crucial"]],
};

/** Saved meanings, intentionally separate from the source question/answer data. */
export function getReadingPhraseTranslations(level, day) {
  const key = String(level || "").trim().toUpperCase();
  if (key === "A1") return getA1ReadingPhraseTranslations();
  if (["B2", "C1", "C2"].includes(key)) return getAdvancedReadingPhraseTranslations(key);
  if (!["A2", "B1"].includes(key)) return [];
  const entries = [...(BY_DAY[key]?.[Number(day)] || []), ...COMMON[key]];
  const seen = new Set();
  return entries.filter(([de, en]) => {
    const identifier = de.toLocaleLowerCase("de");
    if (!de || !en || seen.has(identifier)) return false;
    seen.add(identifier);
    return true;
  }).map(([de, en]) => ({ de, en }));
}

/**
 * Prioritise lesson-specific phrases; avoid substring matches inside longer words.
 * Never infer a translation when the source text does not contain the exact phrase.
 */
export function segmentReadingPhrases(text, entries, maxMatches = 9) {
  const source = String(text || "");
  const lower = source.toLocaleLowerCase("de");
  const wordChar = /[A-Za-zÀ-ÖØ-öø-ÿ]/;
  const matches = [];
  for (const entry of entries || []) {
    const term = String(entry?.de || "").toLocaleLowerCase("de");
    if (!term) continue;
    let offset = 0;
    while (offset < lower.length) {
      const start = lower.indexOf(term, offset);
      if (start === -1) break;
      const end = start + term.length;
      offset = end;
      if ((start && wordChar.test(source[start - 1])) || (end < source.length && wordChar.test(source[end]))) continue;
      if (matches.some((match) => start < match.end && end > match.start)) continue;
      matches.push({ start, end, de: source.slice(start, end), en: entry.en });
      break; // Don't underline repeated occurrences of the same phrase.
    }
    if (matches.length >= maxMatches) break;
  }
  matches.sort((a, b) => a.start - b.start);
  if (!matches.length) return [{ text: source }];
  const segments = [];
  let position = 0;
  for (const match of matches) {
    if (match.start > position) segments.push({ text: source.slice(position, match.start) });
    segments.push({ ...match, text: source.slice(match.start, match.end) });
    position = match.end;
  }
  if (position < source.length) segments.push({ text: source.slice(position) });
  return segments;
}
