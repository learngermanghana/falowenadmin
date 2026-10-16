import { getPresenterReadingLesson } from "./presenterReadingLessons.js";

const B1_KNOWLEDGE = {
  "B1-1.1": {
    ...getPresenterReadingLesson("B1-1.1"),
    activity: {
      title: "Zeitlinie statt Mini-Präsentation",
      instruction: "Ordnet die Informationen einer Person in früher, Erfahrung und heute. Formuliert danach zwei passende Sätze.",
      prompts: ["Früher: Pilot werden", "Erfahrung: Praktikum in einem Büro", "Heute: Projektmanagement interessant"],
      modelItems: ["Früher wollte er Pilot werden.", "Er hat ein Praktikum in einem Büro gemacht.", "Heute interessiert er sich für Projektmanagement."],
    },
  },
  "B1-1.2": {
    ...getPresenterReadingLesson("B1-1.2"),
    activity: {
      title: "Beobachtung oder Bewertung?",
      instruction: "Unterscheidet zwischen einer bloßen Bewertung und einem beobachtbaren Beispiel. Verbessert die schwachen Aussagen.",
      prompts: ["Er ist zuverlässig.", "Sie ist freundlich.", "Mein Freund hilft mir immer."],
      modelItems: ["Er ist zuverlässig, weil er seine Versprechen hält.", "Sie ist freundlich, denn sie hört anderen aufmerksam zu.", "Mein Freund hilft mir immer; deshalb vertraue ich ihm."],
    },
  },
  "B1-1.3": {
    ...getPresenterReadingLesson("B1-1.3"),
    activity: {
      title: "Argumentkette ordnen",
      instruction: "Ordnet die Karten zu Ausgangslage → Hindernis → Reaktion → Ergebnis und verbindet sie sprachlich.",
      prompts: ["wenig Erfahrung", "intensiv weiterlernen", "erste Stelle bekommen", "mehrere Absagen"],
      modelItems: ["Obwohl sie wenig Erfahrung hatte und mehrere Absagen bekam, lernte sie weiter.", "Dadurch konnte sie schließlich ihre erste Stelle bekommen."],
    },
  },
  "B1-2.4": {
    ...getPresenterReadingLesson("B1-2.4"),
    activity: {
      title: "Priorisieren statt aufzählen",
      instruction: "Ordnet fünf Wohnungskriterien in Muss, wichtig und optional. Begründet nur die ersten zwei Prioritäten.",
      prompts: ["Miete", "Lage", "Balkon", "Größe", "öffentliche Verkehrsmittel"],
      modelItems: ["Die Miete ist für mich unverzichtbar, weil mein Budget begrenzt ist.", "Eine gute Verkehrsanbindung ist wichtiger als ein Balkon."],
    },
  },
  "B1-2.5": {
    ...getPresenterReadingLesson("B1-2.5"),
    activity: {
      title: "Direkt → professionell",
      instruction: "Formuliert drei direkte Fragen so um, dass sie bei einer Wohnungsbesichtigung höflich und klar klingen.",
      prompts: ["Wie hoch ist die Kaution?", "Wann kann ich einziehen?", "Darf ich die Küche verändern?"],
      modelItems: ["Könnten Sie mir bitte sagen, wie hoch die Kaution ist?", "Ich würde gern wissen, wann ich einziehen kann.", "Wäre es möglich, die Küche zu verändern?"],
    },
  },
  "B1-2.6": {
    ...getPresenterReadingLesson("B1-2.6"),
    activity: {
      title: "Zwei Profile, zwei Entscheidungen",
      instruction: "Ordnet jedem Profil Stadt oder Land zu. Nutzt pro Entscheidung einen Vergleich und eine Einschränkung.",
      prompts: ["Person A: kein Auto, arbeitet im Zentrum", "Person B: zwei Kinder, arbeitet überwiegend online", "Nennt je einen Nachteil eurer Wahl."],
      modelItems: ["Für Person A ist die Stadt praktischer, weil die Wege kürzer sind.", "Für Person B kann das Land ruhiger sein, obwohl längere Wege ein Nachteil sind."],
    },
  },
  "B1-3.7": {
    ...getPresenterReadingLesson("B1-3.7"),
    activity: {
      title: "Behauptung prüfen",
      instruction: "Entscheidet, welche Aussage zu pauschal ist, und formuliert sie genauer.",
      prompts: ["Fast Food ist immer ungesund.", "Hausmannskost ist immer besser.", "Wegen des hohen Zuckergehalts sollte man manche Produkte nur selten konsumieren."],
      modelItems: ["Pauschale Aussagen brauchen Einschränkungen.", "Trotz des Namens hängt die Bewertung von Zutaten, Menge und Häufigkeit ab."],
    },
  },
  "B1-3.8": {
    ...getPresenterReadingLesson("B1-3.8"),
    activity: {
      title: "Tipp, Pflicht oder Möglichkeit?",
      instruction: "Sortiert die Situationen nach sollte, muss oder kann und begründet die sprachliche Stärke.",
      prompts: ["leichter Alltagsstress", "starke anhaltende Beschwerden", "mehr Bewegung im Alltag"],
      modelItems: ["Bei leichtem Stress kann ein Spaziergang helfen.", "Bei starken anhaltenden Beschwerden muss man ärztliche Hilfe suchen.", "Man sollte sich regelmäßig bewegen."],
    },
  },
  "B1-3.9": {
    ...getPresenterReadingLesson("B1-3.9"),
    activity: {
      title: "Mini-Fallstudie · Zu Hause, aber nie Feierabend",
      instruction: "Analysiert den Fall und nennt eine Maßnahme des Arbeitgebers sowie eine persönliche Strategie.",
      prompts: ["Ama arbeitet im Homeoffice.", "Sie beantwortet Nachrichten bis 22 Uhr.", "Sie schläft schlechter und macht kaum Pausen."],
      modelItems: ["Die Firma sollte klare Erreichbarkeitszeiten festlegen, damit Mitarbeitende abschalten können.", "Ama kann Benachrichtigungen nach Feierabend ausschalten, um sich besser zu erholen."],
    },
  },
  "B1-4.10": {
    ...getPresenterReadingLesson("B1-4.10"),
    activity: {
      title: "Regel bewerten",
      instruction: "Vergleicht drei Digital-Detox-Regeln und entscheidet, welche am realistischsten ist. Nennt ein Kriterium.",
      prompts: ["24 Stunden komplett offline", "keine sozialen Medien nach 21 Uhr", "Handy bleibt beim Essen in einem anderen Raum"],
      modelItems: ["Die zweite Regel ist realistischer als ein kompletter Offline-Tag.", "Je einfacher die Regel in den Alltag passt, desto leichter kann man sie einhalten."],
    },
  },
  "B1-4.11": {
    ...getPresenterReadingLesson("B1-4.11"),
    activity: {
      title: "Kooperationskarte",
      instruction: "Ordnet die Situationen zu miteinander, voneinander oder aufeinander. Formuliert danach einen vollständigen Team-Satz.",
      prompts: ["Informationen teilen", "aus Erfahrungen lernen", "auf Vorschläge reagieren"],
      modelItems: ["Wir sprechen miteinander.", "Wir lernen voneinander.", "Wir reagieren aufeinander und passen unseren Plan an."],
    },
  },
  "B1-4.12": {
    ...getPresenterReadingLesson("B1-4.12"),
    activity: {
      title: "Geschichte rekonstruieren",
      instruction: "Ordnet vier Ereignisse logisch und verbindet mindestens zwei davon mit nachdem, bevor oder während.",
      prompts: ["Wetter prüfen", "Wanderung beginnen", "starker Regen", "Schutzhütte finden"],
      modelItems: ["Bevor wir losgingen, prüften wir das Wetter.", "Während wir wanderten, begann es stark zu regnen.", "Nachdem der Regen begonnen hatte, suchten wir eine Schutzhütte."],
    },
  },
  "B1-4.13": {
    ...getPresenterReadingLesson("B1-4.13"),
    activity: {
      title: "Beobachtung → Bewertung → Beleg",
      instruction: "Ordnet die Aussagen und baut daraus zwei Kritik-Sätze.",
      prompts: ["Der Film dauert fast drei Stunden.", "Die Handlung entwickelt sich langsam.", "Die Hauptfigur verändert sich überzeugend."],
      modelItems: ["Der Film ist zwar sehr lang, aber die Hauptfigur entwickelt sich überzeugend.", "Die Handlung wirkt stellenweise langsam, weil einige Szenen zu ausführlich sind."],
    },
  },
  "B1-5.14": {
    ...getPresenterReadingLesson("B1-5.14"),
    activity: {
      title: "Zwei Positionen vergleichen",
      instruction: "Vergleicht die Aussagen und formuliert einen differenzierten Gegensatz mit hingegen, während oder im Gegensatz dazu.",
      prompts: ["A: Online-Lernen spart Wege und ist flexibel.", "B: Präsenzunterricht ermöglicht direkte Rückfragen.", "Nennt eine Situation, in der eine Mischung besser wäre."],
      modelItems: ["Online-Lernen ist flexibel; Präsenzunterricht hingegen ermöglicht direkteren Austausch.", "Während Theorie digital vorbereitet werden kann, eignet sich Präsenzunterricht gut für Diskussionen."],
    },
  },
  "B1-5.15": {
    ...getPresenterReadingLesson("B1-5.15"),
    activity: {
      title: "Mini-Fallstudie · Immer erreichbar",
      instruction: "Analysiert das Problem und schlagt zwei konkrete Regeln vor. Eine Regel soll das Team, eine die einzelne Person betreffen.",
      prompts: ["Kojo arbeitet drei Tage zu Hause.", "Sein Team schreibt auch spät abends.", "Er beantwortet fast jede Nachricht sofort."],
      modelItems: ["Im Team sollten Erreichbarkeitszeiten vereinbart werden.", "Kojo kann berufliche Benachrichtigungen nach Feierabend ausschalten."],
    },
  },
  "B1-5.16": {
    ...getPresenterReadingLesson("B1-5.16"),
    activity: {
      title: "Problem → Ursache → Strategie",
      instruction: "Ordnet jedem Problem eine plausible Ursache und eine konkrete Strategie zu.",
      prompts: ["schlechter Schlaf", "Panik kurz vor der Prüfung", "zu viel Stoff am letzten Abend"],
      modelItems: ["Ein früher Lernplan kann helfen, damit nicht alles am letzten Abend gelernt werden muss.", "Man kann Prüfungssituationen üben, um sich an den Ablauf zu gewöhnen."],
    },
  },
  "B1-5.17": {
    ...getPresenterReadingLesson("B1-5.17"),
    activity: {
      title: "Methode zum Lernziel",
      instruction: "Ordnet jeder Aufgabe eine passende Lernmethode zu und erklärt die Entscheidung.",
      prompts: ["20 neue Wörter behalten", "eine Grammatikregel wirklich verstehen", "eine Präsentation frei halten"],
      modelItems: ["Für Wörter eignen sich verteilte Wiederholungen und Selbsttests.", "Eine Grammatikregel kann man verstehen, indem man eigene Beispiele bildet.", "Eine Präsentation verbessert man durch aktives Üben ohne Text."],
    },
  },
  "B1-6.18": {
    ...getPresenterReadingLesson("B1-6.18"),
    activity: {
      title: "Berufsweg priorisieren",
      instruction: "Ordnet die Schritte für eine Person und begründet, welcher Schritt zuerst kommen muss.",
      prompts: ["Ziel: Pflegefachkraft", "Deutsch B1 vorhanden", "Berufserfahrung im Heimatland", "Informationen zu Anerkennung fehlen"],
      modelItems: ["Zuerst sollte die Person die Anerkennungsvoraussetzungen prüfen.", "Danach kann sie fehlende Dokumente oder Sprachkenntnisse gezielt vorbereiten."],
    },
  },
  "B1-6.19": {
    ...getPresenterReadingLesson("B1-6.19"),
    activity: {
      title: "Antwort-Upgrade",
      instruction: "Verbessert kurze Antworten so, dass sie konkret, höflich und glaubwürdig werden.",
      prompts: ["Ich bin motiviert.", "Ich kann gut im Team arbeiten.", "Wie viel Geld bekomme ich?"],
      modelItems: ["Ich bin motiviert, weil ich mich fachlich weiterentwickeln und Verantwortung übernehmen möchte.", "In meinem letzten Praktikum habe ich Aufgaben im Team geplant und abgestimmt.", "Könnten Sie mir bitte sagen, wie die Gehaltsspanne für diese Stelle aussieht?"],
    },
  },
  "B1-6.20": {
    ...getPresenterReadingLesson("B1-6.20"),
    activity: {
      title: "Muss, kann, hilfreich",
      instruction: "Sortiert die Qualifikationen in zwingend, möglich oder hilfreich. Begründet eure Einteilung.",
      prompts: ["Studium", "Praktikum", "Sprachzertifikat", "Berufserfahrung"],
      modelItems: ["Je nach Beruf muss man ein Studium oder eine Ausbildung abschließen.", "Ein Praktikum kann hilfreich sein, um Erfahrung zu sammeln."],
    },
  },
  "B1-7.21": {
    ...getPresenterReadingLesson("B1-7.21"),
    activity: {
      title: "Lebensform für drei Profile",
      instruction: "Ordnet jedem Profil eine passende Wohnform zu und nennt eine Einschränkung.",
      prompts: ["Student mit kleinem Budget", "Person mit starkem Bedürfnis nach Ruhe", "junge Familie mit gegenseitiger Unterstützung"],
      modelItems: ["Für den Studenten kann eine WG günstig sein, obwohl weniger Privatsphäre vorhanden ist.", "Für die zweite Person ist eine eigene Wohnung wahrscheinlich passender."],
    },
  },
  "B1-7.22": {
    ...getPresenterReadingLesson("B1-7.22"),
    activity: {
      title: "Werte in einer Situation",
      instruction: "Lest den Fall, identifiziert zwei wichtige Werte und formuliert eine faire Lösung.",
      prompts: ["Eine Person plant jedes Wochenende gemeinsam.", "Die andere braucht regelmäßig Zeit allein.", "Beide glauben, der andere verstehe ihre Erwartungen automatisch."],
      modelItems: ["Beide sollten offen sagen, dass gemeinsame Zeit wichtig ist, aber persönliche Freiheit ebenfalls.", "Sie brauchen eine konkrete Vereinbarung statt stiller Erwartungen."],
    },
  },
  "B1-7.23": {
    ...getPresenterReadingLesson("B1-7.23"),
    activity: {
      title: "Unangenehm oder respektvoll?",
      instruction: "Bewertet die Reaktionen und formuliert problematische Aussagen höflicher.",
      prompts: ["Gib mir deine Nummer.", "Warum bist du noch nicht verheiratet?", "Ich würde heute gern nach Hause gehen."],
      modelItems: ["Könntest du mir vielleicht deine Nummer geben?", "Zu private Fragen sollte man nicht erzwingen.", "Danke für den Abend. Ich würde jetzt gern nach Hause gehen."],
    },
  },
  "B1-8.24": {
    ...getPresenterReadingLesson("B1-8.24"),
    activity: {
      title: "Argumentkarte Nachhaltigkeit",
      instruction: "Ordnet die Argumente nach Kauf vermeiden, länger nutzen, anders kaufen oder richtig entsorgen. Wählt anschließend die wirksamste Maßnahme für den Fall.",
      prompts: ["Handy funktioniert noch", "Jacke hat einen kleinen Defekt", "Getränk ist auch in Mehrweg erhältlich"],
      modelItems: ["Das Handy weiterzunutzen vermeidet einen neuen Kauf.", "Die Jacke kann repariert werden.", "Mehrweg kann unnötigen Verpackungsabfall reduzieren."],
    },
  },
  "B1-8.25": {
    ...getPresenterReadingLesson("B1-8.25"),
    activity: {
      title: "Verbraucherfall lösen",
      instruction: "Analysiert den Fall und formuliert die drei wichtigsten Sätze einer schriftlichen Reklamation.",
      prompts: ["bestellt: schwarze Kopfhörer", "geliefert: falsches Modell, Verpackung beschädigt", "Wunsch: Rückerstattung"],
      modelItems: ["Ich habe am ... schwarze Kopfhörer bestellt.", "Leider wurde ein anderes Modell geliefert und die Verpackung war beschädigt.", "Ich möchte Sie deshalb bitten, mir den Kaufpreis zu erstatten."],
    },
  },
  "B1-9.26": {
    ...getPresenterReadingLesson("B1-9.26"),
    activity: {
      title: "Entscheidungsbaum Reiseproblem",
      instruction: "Wählt für jede Bedingung den nächsten sinnvollen Schritt und formuliert ihn mit wenn oder falls.",
      prompts: ["Flug verspätet → Anschlussflug gefährdet", "Koffer fehlt → Schalter noch geöffnet", "Zug fällt aus → Bus fährt in 20 Minuten"],
      modelItems: ["Wenn der Anschlussflug gefährdet ist, frage ich sofort nach einer Umbuchung.", "Falls mein Koffer fehlt, melde ich ihn direkt am Gepäckschalter."],
    },
  },
  "B1-10.27": {
    ...getPresenterReadingLesson("B1-10.27"),
    activity: {
      title: "Wirkungskette",
      instruction: "Verbindet Handlung → direkte Folge → mögliche Umweltwirkung. Nutzt mindestens einmal indem.",
      prompts: ["Fahrrad statt Auto", "weniger Lebensmittel wegwerfen", "Geräte ganz ausschalten"],
      modelItems: ["Indem man häufiger Fahrrad fährt, reduziert man Autofahrten und damit Emissionen.", "Wenn weniger Lebensmittel weggeworfen werden, müssen weniger Ressourcen unnötig eingesetzt werden."],
    },
  },
  "B1-10.28": {
    ...getPresenterReadingLesson("B1-10.28"),
    activity: {
      title: "Maßnahmen nach Verantwortung ordnen",
      instruction: "Ordnet die Maßnahmen zu Einzelperson, Unternehmen oder Stadt/Politik und erklärt, wo Zusammenarbeit nötig ist.",
      prompts: ["mehr Fahrrad fahren", "reparierbare Produkte anbieten", "sichere Radwege bauen", "Ökostrom wählen"],
      modelItems: ["Einzelne können häufiger Fahrrad fahren, wenn sichere Wege vorhanden sind.", "Unternehmen können Produkte langlebiger gestalten, während Politik passende Regeln setzen kann."],
    },
  },
};

export function getB1PresenterKnowledge(assignmentId = "") {
  return B1_KNOWLEDGE[String(assignmentId || "").trim().toUpperCase()] || null;
}

export function getB1FocusedPractice(assignmentId = "") {
  return getB1PresenterKnowledge(assignmentId)?.activity || null;
}

export const B1_PRESENTER_KNOWLEDGE_ASSIGNMENTS = Object.freeze(Object.keys(B1_KNOWLEDGE));
