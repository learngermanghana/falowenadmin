const C1_TOPIC_COLLOCATIONS = Object.freeze({
  1: ["ein Lernziel definieren", "Fortschritt messbar machen", "Prioritäten setzen", "Feedback gezielt auswerten"],
  2: ["kulturelle Identität prägen", "mehrfache Zugehörigkeit erleben", "starre Zuschreibungen vermeiden", "Perspektiven erweitern"],
  3: ["eine Quelle überprüfen", "eine Behauptung belegen", "Informationen einordnen", "mediale Reichweite gewinnen"],
  4: ["Verantwortung übernehmen", "Erwartungen klären", "konstruktives Feedback geben", "einen Konflikt austragen"],
  5: ["berufliche Kompetenzen erweitern", "Weiterbildung ermöglichen", "Zugang zu Fortbildung schaffen", "Eigeninitiative zeigen"],
  6: ["gesundheitsfördernde Bedingungen schaffen", "Stress langfristig reduzieren", "präventive Maßnahmen ergreifen", "Eigenverantwortung stärken"],
  7: ["Umweltwirkungen berücksichtigen", "Mobilität ermöglichen", "Emissionen reduzieren", "lokale Wertschöpfung fördern"],
  8: ["bezahlbaren Wohnraum schaffen", "städtischen Raum verdichten", "Lebensqualität sichern", "Interessen gegeneinander abwägen"],
  9: ["Kaufentscheidungen beeinflussen", "personalisierte Werbung ausspielen", "Verbraucherautonomie schützen", "Transparenz gewährleisten"],
  10: ["gesellschaftliche Teilhabe ermöglichen", "Qualifikationen anerkennen", "Zugangsbarrieren abbauen", "Eigeninitiative voraussetzen"],
  11: ["gesellschaftliche Verantwortung übernehmen", "ehrenamtliches Engagement fördern", "Ressourcen bereitstellen", "langfristige Wirkung erzielen"],
  12: ["kulturelle Angebote wahrnehmen", "Zugang zu Kultur ermöglichen", "Freizeit sinnvoll gestalten", "kulturelle Teilhabe stärken"],
  13: ["mehrsprachige Ressourcen nutzen", "sprachliche Identität entwickeln", "Sprachkompetenzen anerkennen", "zwischen Sprachen vermitteln"],
  14: ["technologische Entwicklung gestalten", "Innovationen vorantreiben", "Risiken frühzeitig erkennen", "Zukunftsszenarien entwerfen"],
  15: ["lebenslanges Lernen fördern", "Bildungschancen erweitern", "Lernangebote flexibel gestalten", "Qualifikationen aktualisieren"],
  16: ["digitale Anwendungen nutzen", "Daten verarbeiten", "Alltagsprozesse automatisieren", "digitale Abhängigkeiten begrenzen"],
  17: ["Umweltverantwortung übernehmen", "Ressourcen schonen", "Folgekosten berücksichtigen", "wirksame Maßnahmen umsetzen"],
  18: ["gesellschaftlichen Zusammenhalt stärken", "soziale Spannungen abbauen", "gegenseitiges Vertrauen fördern", "Interessen ausgleichen"],
  19: ["Arbeitsprozesse automatisieren", "Tätigkeitsprofile verändern", "neue Kompetenzen aufbauen", "Beschäftigung sichern"],
  20: ["digitale Belastung reduzieren", "Erreichbarkeit begrenzen", "gesunde Routinen etablieren", "Nutzungsverhalten reflektieren"],
  21: ["gesellschaftliche Teilhabe stärken", "Integrationshürden abbauen", "Zugehörigkeit fördern", "Institutionen zugänglich machen"],
  22: ["politische Mitbestimmung ermöglichen", "demokratische Prozesse stärken", "Interessen vertreten", "Vertrauen in Institutionen sichern"],
  23: ["berufliche und private Anforderungen vereinbaren", "Grenzen setzen", "Arbeitsbelastung reduzieren", "Erholungszeiten schützen"],
  24: ["Infrastruktur ausbauen", "Verkehrsströme steuern", "Mobilität gewährleisten", "öffentliche Räume entlasten"],
  25: ["wissenschaftliche Evidenz bewerten", "Forschungsfreiheit schützen", "ethische Grenzen setzen", "Risiken transparent machen"],
  26: ["nachhaltige Kaufentscheidungen treffen", "Produkte länger nutzen", "Lieferketten transparent machen", "Produzentenverantwortung stärken"],
  27: ["Verwaltungsprozesse digitalisieren", "Bearbeitungszeiten verkürzen", "Barrierefreiheit gewährleisten", "Datenschutz sicherstellen"],
  28: ["demografischen Wandel gestalten", "soziale Sicherung finanzieren", "Fachkräftebedarf decken", "Generationen fair belasten"],
});

export function getC1TopicCollocations(day = 0) {
  return [...(C1_TOPIC_COLLOCATIONS[Number(day)] || [])];
}

export const C1_TOPIC_COLLOCATION_DAYS = Object.freeze(
  Object.keys(C1_TOPIC_COLLOCATIONS).map(Number),
);
