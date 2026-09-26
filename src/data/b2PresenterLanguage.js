const B2_TOPIC_COLLOCATIONS = Object.freeze({
  1: ["Abfall vermeiden", "Mehrwegsysteme nutzen", "Verpackungsmüll reduzieren", "Ressourcen schonen"],
  2: ["Wertstoffe trennen", "Rohstoffe wiederverwenden", "Materialien recyceln", "im Kreislauf halten"],
  3: ["Lebensmittel verschwenden", "Einkäufe planen", "Portionsgrößen anpassen", "essbare Produkte weitergeben"],
  4: ["unnötige Verpackungen vermeiden", "Mehrweg bevorzugen", "Nachfüllsysteme nutzen", "bewusst einkaufen"],
  5: ["öffentlichen Verkehr ausbauen", "Emissionen reduzieren", "Verkehr entlasten", "Mobilität ermöglichen"],
  6: ["Energieverbrauch senken", "erneuerbare Energien ausbauen", "fossile Brennstoffe ersetzen", "Gebäude effizient sanieren"],
  7: ["Grünflächen schaffen", "Gebäude energetisch sanieren", "Lebensqualität erhöhen", "Flächen sinnvoll nutzen"],
  8: ["Bildungschancen verbessern", "gezielte Förderung anbieten", "Zugang zu Bildung ermöglichen", "Chancengleichheit stärken"],
  9: ["Leistung bewerten", "Lernende individuell fördern", "Standards einhalten", "Verantwortung übernehmen"],
  10: ["Betreuungsplätze ausbauen", "frühe Förderung ermöglichen", "pädagogische Qualität sichern", "Familie und Beruf vereinbaren"],
  11: ["digitale Medien einsetzen", "Unterricht ergänzen", "Medienkompetenz fördern", "Lernprozesse individualisieren"],
  12: ["Weiterbildung finanzieren", "Zugang zur Hochschule sichern", "lebenslanges Lernen fördern", "Qualifikationen aktualisieren"],
  13: ["Forschungsergebnisse auswerten", "wissenschaftliche Erkenntnisse gewinnen", "Daten untersuchen", "Ergebnisse einordnen"],
  14: ["Quellen überprüfen", "Behauptungen belegen", "Desinformation erkennen", "Informationen kritisch einordnen"],
  15: ["bezahlbaren Wohnraum schaffen", "Mieten begrenzen", "Wohnraum fördern", "soziale Härten vermeiden"],
  16: ["Infrastruktur ausbauen", "Lebensqualität verbessern", "Regionen anbinden", "öffentliche Angebote sichern"],
  17: ["flexible Arbeitszeiten anbieten", "Kinderbetreuung organisieren", "Familien entlasten", "Verantwortung aufteilen"],
  18: ["Fachkräfte gewinnen", "Beschäftigte weiterqualifizieren", "Abschlüsse anerkennen", "Arbeitsbedingungen verbessern"],
  19: ["Erreichbarkeit begrenzen", "klare Arbeitszeiten vereinbaren", "Erholungszeiten schützen", "Work-Life-Balance sichern"],
  20: ["Privatsphäre schützen", "persönliche Daten teilen", "öffentliche Identität gestalten", "digitale Spuren hinterlassen"],
  21: ["KI sinnvoll einsetzen", "Quellen kritisch prüfen", "Eigenleistung kennzeichnen", "Nutzungsregeln festlegen"],
  22: ["Routineaufgaben automatisieren", "Arbeitsplätze verändern", "digitale Kompetenzen aufbauen", "Beschäftigte qualifizieren"],
  23: ["Nutzerdaten auswerten", "personalisierte Werbung anzeigen", "Datenschutz gewährleisten", "Algorithmen transparent machen"],
  24: ["Gesundheitsdaten schützen", "Versorgung verbessern", "Telemedizin einsetzen", "medizinische Abläufe digitalisieren"],
  25: ["Tourismus nachhaltig gestalten", "lokale Wirtschaft unterstützen", "Besucherströme steuern", "Umweltbelastung begrenzen"],
  26: ["Sprachförderung anbieten", "Qualifikationen anerkennen", "Integration erleichtern", "gesellschaftliche Teilhabe ermöglichen"],
  27: ["Diskriminierung abbauen", "faire Chancen schaffen", "Beschwerdewege einrichten", "gesellschaftlichen Zusammenhalt stärken"],
  28: ["Argumente strukturieren", "Gegenargumente berücksichtigen", "Beispiele gezielt einsetzen", "sprachliche Mittel kontrollieren"],
});

export function getB2TopicCollocations(day = 0) {
  return [...(B2_TOPIC_COLLOCATIONS[Number(day)] || [])];
}

export const B2_TOPIC_COLLOCATION_DAYS = Object.freeze(
  Object.keys(B2_TOPIC_COLLOCATIONS).map(Number),
);
