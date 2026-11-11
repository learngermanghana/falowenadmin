// Short, topic-specific audience questions for the existing A2 and B1
// workbook presentation stages. The slide components keep these collapsed
// until the speaker is ready for questions.
const A2_FOLLOW_UPS = Object.freeze({
  1: ["Welche Sprache möchtest du noch lernen?", "Was machst du gern am Wochenende?"],
  2: ["Was macht ihr gern zusammen?", "Wann seht ihr euch normalerweise?"],
  3: ["Welche Funktion benutzt du am häufigsten?", "Was ist dir bei einem Handy am wichtigsten?"],
  4: ["Was macht ihr zusammen?", "Wann trefft ihr euch am liebsten?"],
  5: ["Mit wem verbringst du deine Freizeit gern?", "Wie oft machst du dieses Hobby?"],
  6: ["Was gefällt dir an deinem Zimmer besonders?", "Was möchtest du in deinem Zimmer ändern?"],
  7: ["Was ist dir in einer Wohnung besonders wichtig?", "Wo möchtest du später wohnen?"],
  8: ["Was empfehlen Sie heute?", "Kann ich bitte mit Karte bezahlen?"],
  9: ["Was hat dir am besten gefallen?", "Wohin möchtest du nächstes Mal reisen?"],
  10: ["Was möchtest du dort besuchen?", "Wann möchtest du die Stadt besuchen?"],
  11: ["Wie lange dauert dein Weg?", "Warum benutzt du dieses Verkehrsmittel gern?"],
  12: ["Welche Aufgaben möchtest du in diesem Beruf machen?", "Welche Ausbildung brauchst du dafür?"],
  13: ["Warum möchtest du diese Stelle?", "Welche Erfahrung kannst du dafür mitbringen?"],
  14: ["Was gefällt dir an deinem Beruf besonders?", "Was ist bei der Arbeit manchmal schwierig?"],
  15: ["Wie oft machst du diesen Sport?", "Mit wem trainierst du gern?"],
  16: ["Was hilft dir am besten, dich zu entspannen?", "Wann hast du im Alltag Zeit dafür?"],
  17: ["Was machst du, wenn es dir schlechter geht?", "Was hilft dir, gesund zu bleiben?"],
  18: ["Wie bezahlst du im Alltag am häufigsten?", "Welche Bankgeschäfte machst du online?"],
  19: ["Was kaufst du lieber im Geschäft?", "Wie vergleichst du die Preise?"],
  20: ["Möchtest du das Produkt umtauschen oder dein Geld zurück?", "Was sagst du im Geschäft zuerst?"],
  21: ["Mit wem möchtest du etwas unternehmen?", "Was machst du, wenn das Wetter schlecht ist?"],
  22: ["Kannst du dazu ein Beispiel nennen?", "Warum ist das für dich wichtig?"],
  23: ["Wie lange dauert dein Weg zur Schule oder Arbeit?", "Was machst du, wenn es regnet?"],
  24: ["Was möchtest du an deinem Reiseziel sehen?", "Wie lange möchtest du dort bleiben?"],
  25: ["Was machst du nach der Arbeit oder Schule?", "Wann stehst du normalerweise auf?"],
  26: ["Was hilft dir, wenn du nervös bist?", "Mit wem sprichst du über deine Gefühle?"],
  27: ["Wie oft telefonierst du mit Freunden oder Familie?", "Für welche Nachrichten benutzt du E-Mail?"],
  28: ["Was möchtest du im nächsten Jahr lernen oder erreichen?", "Was ist dein erster Schritt?"],
});

const B1_FOLLOW_UPS = Object.freeze({
  1: ["Welche Fähigkeiten braucht man im Alltag in diesem Beruf?", "Was könnte auf dem Weg zu diesem Beruf schwierig sein?"],
  2: ["Kannst du ein Beispiel nennen, in dem ein Freund dich unterstützt hat?", "Wie sollte man einen Konflikt in einer Freundschaft lösen?"],
  3: ["Welche Herausforderung musstest du dabei überwinden?", "Was hast du aus dieser Erfahrung gelernt?"],
  4: ["Welche Suchmethode eignet sich besonders für Berufstätige?", "Wie kann man unseriöse Wohnungsangebote erkennen?"],
  5: ["Welche Information sollte ein Vermieter unbedingt vor dem Termin geben?", "Welche Mietbedingungen wären für dich besonders wichtig?"],
  6: ["Welche Menschen profitieren besonders vom Leben auf dem Land?", "Wie könnte man einen Nachteil deines bevorzugten Wohnorts ausgleichen?"],
  7: ["Wie kann man im Alltag gesünder essen, wenn man wenig Zeit hat?", "Welche Rolle spielen Preis und Umwelt bei deiner Entscheidung?"],
  8: ["Welche Gewohnheit würdest du zuerst verändern?", "Woran merkst du, dass eine Veränderung deiner Gesundheit hilft?"],
  9: ["Welche Verantwortung haben Arbeitgeber für eine gute Balance?", "Welche Arbeitsregel würde in deinem Beruf am meisten helfen?"],
  10: ["Welche digitale Gewohnheit würdest du konkret ändern?", "Wie kann ein Arbeitgeber Erreichbarkeit außerhalb der Arbeitszeit begrenzen?"],
  11: ["Welche Rolle übernimmst du normalerweise in einem Team?", "Wie kann eine Gruppe mit unterschiedlichen Meinungen umgehen?"],
  12: ["Welche Situation war die größte Herausforderung?", "Was würdest du bei einem ähnlichen Abenteuer anders machen?"],
  13: ["Welche Szene oder Figur ist dir besonders in Erinnerung geblieben?", "Für wen würdest du den Film empfehlen und warum?"],
  14: ["Welche Lernaufgabe lässt sich digital besonders gut erledigen?", "Wie könnte man beide Methoden sinnvoll kombinieren?"],
  15: ["Für wen ist Homeoffice besonders vorteilhaft oder schwierig?", "Welche Regeln helfen, Arbeit und Freizeit zu trennen?"],
  16: ["Welche Strategie hilft dir am zuverlässigsten?", "Wann sollte man sich bei starkem Stress Unterstützung holen?"],
  17: ["Was machst du, wenn du dich beim Lernen nicht konzentrieren kannst?", "Wie überprüfst du, ob deine Lernmethode funktioniert?"],
  18: ["Welchen konkreten Schritt kannst du in diesem Monat machen?", "Was könnte dich daran hindern, und wie gehst du damit um?"],
  19: ["Welche Frage würdest du am Ende selbst dem Arbeitgeber stellen?", "Wie würdest du auf eine schwierige Frage im Gespräch reagieren?"],
  20: ["Welche Qualifikation möchtest du noch erwerben?", "Wie kann man sich während des Berufslebens weiterbilden?"],
  21: ["Welche Herausforderung kann in deiner bevorzugten Lebensform entstehen?", "Wie können sich Bedürfnisse im Laufe des Lebens verändern?"],
  22: ["Wie zeigt man im Alltag, dass man die Grenzen des Partners respektiert?", "Wie sollte ein Paar mit unterschiedlichen Erwartungen umgehen?"],
  23: ["Können Sie ein konkretes Beispiel nennen, das Ihre Meinung unterstützt?", "Welche Gegenposition ist Ihrer Meinung nach ebenfalls nachvollziehbar?"],
  24: ["Welche Maßnahme wäre für viele Menschen leicht umzusetzen?", "Wie kann man nachhaltige Entscheidungen trotz höherer Preise fördern?"],
  25: ["Woran erkennt man einen unseriösen Online-Shop?", "Welche Information sollte man vor einer Rücksendung prüfen?"],
  26: ["Welches Problem würdest du zuerst lösen, wenn der Zeitplan nicht mehr passt?", "Wie kannst du deine Mitreisenden über eine Änderung informieren?"],
  27: ["Welche Veränderung wäre für die ganze Gruppe am einfachsten?", "Wie kannst du andere überzeugen, sich daran zu beteiligen?"],
  28: ["Welche klimafreundliche Maßnahme ist in deiner Region besonders realistisch?", "Wie kann man Klimaschutz und bezahlbare Lebenshaltung verbinden?"],
});

export function getPresentationFollowUpQuestions(level, day) {
  const normalizedLevel=String(level||"").trim().toUpperCase();
  const dayNumber=Number(day);
  const source=normalizedLevel==="A2" ? A2_FOLLOW_UPS : normalizedLevel==="B1" ? B1_FOLLOW_UPS : null;
  return source?.[dayNumber] || [];
}
