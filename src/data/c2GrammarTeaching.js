// Matching teaching content is maintained in Falowen Admin and the student app.
export const C2_GRAMMAR_TEACHING = {
  "1": {
    "definitionDe": "Eine nuancierte Bewertung nennt Bedingungen statt alles gut oder schlecht zu nennen.",
    "supportEn": "Qualify a judgement by stating its limits.",
    "structureDe": "Bewertung + Einschränkung mit allerdings / sofern.",
    "workedExample": "Recycling ist sinnvoll, sofern Produkte nicht repariert werden können.",
    "explanationDe": "sofern macht den Nutzen von einer Bedingung abhängig.",
    "check": {
      "question": "Welche Aussage nennt eine Bedingung?",
      "options": [
        "Recycling ist immer die beste Lösung.",
        "Recycling ist sinnvoll, sofern Reparatur nicht möglich ist."
      ],
      "answerIndex": 1,
      "explanation": "sofern macht den Nutzen von einer Bedingung abhängig."
    },
    "independentTask": "Bewerte Reparatur und Recycling. Nenne mit sofern eine Bedingung, unter der deine Bewertung gilt."
  },
  "2": {
    "definitionDe": "Thema ist die bekannte Information; Rhema ist die neue Information. Das Vorfeld steht vor dem finiten Verb.",
    "supportEn": "Start with familiar information, then add the new point.",
    "structureDe": "Ein Satzglied im Vorfeld + finites Verb + Subjekt; das Verb bleibt an Position 2.",
    "workedExample": "Zusätzliche Förderung verbessert die Chancen. → Die Chancen verbessert zusätzliche Förderung.",
    "explanationDe": "Das Objekt steht nun zuerst; verbessert bleibt das zweite Satzglied.",
    "check": {
      "question": "Welche Umstellung hält die Verbzweitstellung ein?",
      "options": [
        "Die Chancen verbessert zusätzliche Förderung.",
        "Die Chancen zusätzliche Förderung verbessert."
      ],
      "answerIndex": 0,
      "explanation": "Das Objekt steht nun zuerst; verbessert bleibt das zweite Satzglied."
    },
    "independentTask": "Schreibe einen Satz über Förderung und Bildungschancen. Stelle dann die bekannte Information ins Vorfeld; kontrolliere die Verbposition."
  },
  "3": {
    "definitionDe": "Verbalstil beschreibt Handlungen mit Verben; Nominalstil macht daraus Nomen und wirkt oft formeller.",
    "supportEn": "Turn an action into a noun without losing who does what.",
    "structureDe": "weil + Subjekt + Verb → wegen + Genitivgruppe.",
    "workedExample": "Weil die Hochschule die Ergebnisse veröffentlicht, entsteht Transparenz. → Wegen der Veröffentlichung der Ergebnisse durch die Hochschule entsteht Transparenz.",
    "explanationDe": "Veröffentlichung ersetzt veröffentlicht; durch benennt weiterhin den Akteur.",
    "check": {
      "question": "Welche Form folgt auf wegen im formellen Standard?",
      "options": [
        "wegen die Veröffentlichung",
        "wegen der Veröffentlichung"
      ],
      "answerIndex": 1,
      "explanation": "Veröffentlichung ersetzt veröffentlicht; durch benennt weiterhin den Akteur."
    },
    "independentTask": "Beschreibe eine Handlung einer Hochschule im Verbalstil. Formuliere denselben Inhalt als Nominalgruppe mit wegen; behalte den Akteur bei."
  },
  "4": {
    "definitionDe": "Indirekte Rede gibt fremde Aussagen wieder, ohne sie als eigene Tatsache zu bestätigen.",
    "supportEn": "Report another person’s claim with grammatical distance.",
    "structureDe": "Quelle + erklärt, + Subjekt + Konjunktiv I; bei gleicher Form Konjunktiv II als Ersatz.",
    "workedExample": "Die Sprecherin sagt: „Die Quelle ist zuverlässig.“ → Die Sprecherin erklärt, die Quelle sei zuverlässig.",
    "explanationDe": "sei ist Konjunktiv I von sein; der Wahrheitsgehalt wird nicht bestätigt.",
    "check": {
      "question": "Welche Form markiert die Aussage als indirekte Rede?",
      "options": [
        "Die Quelle sei zuverlässig.",
        "Die Quelle ist zuverlässig."
      ],
      "answerIndex": 0,
      "explanation": "sei ist Konjunktiv I von sein; der Wahrheitsgehalt wird nicht bestätigt."
    },
    "independentTask": "Gib eine Aussage einer Nachrichtensprecherin im Konjunktiv I wieder. Erkläre, warum du die Aussage damit nicht als Tatsache bestätigst."
  },
  "5": {
    "definitionDe": "Subjektive Modalität zeigt deine Einschätzung oder die Quelle einer Aussage, nicht eine Pflicht oder einen Wunsch.",
    "supportEn": "Modal verbs can express inference, probability, reported claims or self-claims.",
    "structureDe": "Subjekt + Modalverb + Ergänzungen + Infinitiv. Vergangenheit: Partizip II + haben/sein am Ende.",
    "workedExample": "Die Maßnahme dürfte Vertrauen stärken. / Die Entscheidung soll intern umstritten gewesen sein. / Der Politiker will nichts gewusst haben.",
    "explanationDe": "dürfte = wahrscheinlich; soll = andere berichten es; will = die Person behauptet es selbst. muss = starke Schlussfolgerung, könnte = Möglichkeit. „Die Maßnahme muss Vertrauen stärken“ ist ohne Kontext auch als Forderung lesbar.",
    "check": {
      "question": "Du hältst eine Wirkung für wahrscheinlich, hast aber keinen sicheren Beweis. Welche Form passt?",
      "options": [
        "Die Maßnahme muss Vertrauen stärken.",
        "Die Maßnahme dürfte Vertrauen stärken.",
        "Die Maßnahme soll Vertrauen stärken."
      ],
      "answerIndex": 1,
      "explanation": "dürfte = wahrscheinlich; soll = andere berichten es; will = die Person behauptet es selbst. muss = starke Schlussfolgerung, könnte = Möglichkeit. „Die Maßnahme muss Vertrauen stärken“ ist ohne Kontext auch als Forderung lesbar."
    },
    "independentTask": "Formuliere drei politische Aussagen: eine Vermutung mit dürfte, einen Fremdbericht mit soll und eine Selbstaussage mit will. Nutze für eine vergangene Aussage Partizip II + haben/sein."
  },
  "6": {
    "definitionDe": "Kausale Verknüpfungen erklären einen Grund; eine Folge ist das Ergebnis, keine zusätzliche Ursache.",
    "supportEn": "Distinguish the reason from its consequence.",
    "structureDe": "weil/da + Nebensatz mit Verb am Ende; deshalb + Hauptsatz mit Verb an Position 2.",
    "workedExample": "Weil Förderung fehlt, bleiben Chancen ungleich. → Förderung fehlt; deshalb bleiben Chancen ungleich.",
    "explanationDe": "weil führt den Grund ein; deshalb leitet die Folge ein.",
    "check": {
      "question": "Welche Form hat korrekte Nebensatzstellung?",
      "options": [
        "weil Förderung fehlt",
        "weil fehlt Förderung"
      ],
      "answerIndex": 0,
      "explanation": "weil führt den Grund ein; deshalb leitet die Folge ein."
    },
    "independentTask": "Erkläre eine Ursache ungleicher Chancen mit weil. Drücke dieselbe Beziehung danach mit deshalb aus."
  },
  "7": {
    "definitionDe": "Ein Funktionsverbgefüge verbindet ein Nomen mit einem festen Verb, das gemeinsam eine Handlung ausdrückt.",
    "supportEn": "Learn the noun and its conventional verb together.",
    "structureDe": "Artikel + Nomen + festes Verb; nicht frei ein ähnliches Verb einsetzen.",
    "workedExample": "Das Unternehmen handelt. → Das Unternehmen ergreift Maßnahmen zur Entlastung.",
    "explanationDe": "Maßnahmen ergreifen ist eine feste Verbindung und benennt konkrete Schritte.",
    "check": {
      "question": "Welche Verbindung ist idiomatisch?",
      "options": [
        "Maßnahmen ergreifen",
        "Maßnahmen machen"
      ],
      "answerIndex": 0,
      "explanation": "Maßnahmen ergreifen ist eine feste Verbindung und benennt konkrete Schritte."
    },
    "independentTask": "Formuliere zwei Maßnahmen gegen Leistungsdruck mit Maßnahmen ergreifen und Verantwortung übernehmen."
  },
  "8": {
    "definitionDe": "Ein Partizipialattribut beschreibt ein Nomen kompakt und ersetzt oft einen Relativsatz.",
    "supportEn": "A participle before a noun can compress a relative clause.",
    "structureDe": "Artikel + Ergänzungen + dekliniertes Partizip + Nomen. Partizip I: aktiv/andauernd; Partizip II: häufig passiv/abgeschlossen.",
    "workedExample": "Systeme, die automatisch entscheiden → automatisch entscheidende Systeme.",
    "explanationDe": "entscheidend ist aktiv; die Systeme treffen Entscheidungen.",
    "check": {
      "question": "Welche Form bezeichnet Systeme, die selbst entscheiden?",
      "options": [
        "automatisch entschiedene Systeme",
        "automatisch entscheidende Systeme"
      ],
      "answerIndex": 1,
      "explanation": "entscheidend ist aktiv; die Systeme treffen Entscheidungen."
    },
    "independentTask": "Beschreibe ein KI-System zuerst mit einem Relativsatz. Verkürze ihn zu einem aktiven Partizipialattribut."
  },
  "9": {
    "definitionDe": "Passiv-Ersatzformen stellen Möglichkeit oder Notwendigkeit in den Vordergrund, ohne werden-Passiv.",
    "supportEn": "Express what can or must be done while keeping responsibility clear.",
    "structureDe": "sich lassen + Infinitiv = kann gemacht werden; sein + zu + Infinitiv = je nach Kontext muss/kann gemacht werden.",
    "workedExample": "Die Daten können geschützt werden. → Die Daten lassen sich schützen.",
    "explanationDe": "lassen sich bezeichnet Möglichkeit, nicht automatisch eine Verpflichtung.",
    "check": {
      "question": "Welche Form drückt hier Möglichkeit aus?",
      "options": [
        "Die Daten lassen sich schützen.",
        "Die Daten müssen geschützt werden."
      ],
      "answerIndex": 0,
      "explanation": "lassen sich bezeichnet Möglichkeit, nicht automatisch eine Verpflichtung."
    },
    "independentTask": "Beschreibe eine Möglichkeit zum Datenschutz mit sich lassen. Erkläre danach, wer die Handlung ausführen soll."
  },
  "10": {
    "definitionDe": "Evidenz sind Belege. Die sprachliche Sicherheit einer Schlussfolgerung soll zur Stärke dieser Belege passen.",
    "supportEn": "Choose certainty based on the quality of evidence.",
    "structureDe": "Subjekt + dürfte/könnte + Infinitiv; starke Schlussfolgerung mit muss nur bei überzeugenden Belegen.",
    "workedExample": "Die kleine Studie beweist die Wirkung. → Die kleine Studie deutet auf eine mögliche Wirkung hin.",
    "explanationDe": "Eine kleine Studie allein erlaubt keine uneingeschränkte Gewissheit.",
    "check": {
      "question": "Welche Aussage passt zu vorläufigen Daten?",
      "options": [
        "Die Therapie dürfte helfen; weitere Studien sind nötig.",
        "Die Therapie hilft nachweislich immer."
      ],
      "answerIndex": 0,
      "explanation": "Eine kleine Studie allein erlaubt keine uneingeschränkte Gewissheit."
    },
    "independentTask": "Formuliere eine vorsichtige Aussage zu einer kleinen medizinischen Studie. Benenne mit dürfte oder könnte den angemessenen Sicherheitsgrad."
  },
  "11": {
    "definitionDe": "Konzessiv bedeutet: Eine Aussage gilt trotz eines Hindernisses. Adversativ stellt zwei Seiten gegenüber.",
    "supportEn": "Use concession for an unexpected result and contrast to compare.",
    "structureDe": "obwohl/wenngleich + Verb am Ende; trotzdem + Verb an Position 2; wohingegen + Verb am Ende.",
    "workedExample": "Obwohl Energie teurer wird, steigt der Verbrauch.",
    "explanationDe": "Der höhere Preis wäre ein Grund für weniger Verbrauch; das Ergebnis widerspricht dieser Erwartung.",
    "check": {
      "question": "Welcher Konnektor markiert diesen unerwarteten Gegensatz?",
      "options": [
        "weil",
        "obwohl"
      ],
      "answerIndex": 1,
      "explanation": "Der höhere Preis wäre ein Grund für weniger Verbrauch; das Ergebnis widerspricht dieser Erwartung."
    },
    "independentTask": "Formuliere einen unerwarteten Gegensatz zum Energieverbrauch mit obwohl. Formuliere anschließend denselben Gegensatz mit trotzdem."
  },
  "12": {
    "definitionDe": "Rektion bedeutet, dass ein Wort eine bestimmte Präposition und einen bestimmten Kasus verlangt.",
    "supportEn": "Learn the governing word, preposition and case as a unit.",
    "structureDe": "teilnehmen an + Dativ; sich einsetzen für + Akkusativ.",
    "workedExample": "Menschen nehmen an einem Sprachkurs teil und setzen sich für gleiche Chancen ein.",
    "explanationDe": "an einem ist Dativ; für gleiche Chancen ist Akkusativ.",
    "check": {
      "question": "Welche Ergänzung passt zu teilnehmen?",
      "options": [
        "an einen Sprachkurs",
        "an einem Sprachkurs"
      ],
      "answerIndex": 1,
      "explanation": "an einem ist Dativ; für gleiche Chancen ist Akkusativ."
    },
    "independentTask": "Beschreibe Integration mit teilnehmen an + Dativ und sich einsetzen für + Akkusativ. Markiere die Ergänzungen."
  },
  "13": {
    "definitionDe": "Wortbildung schafft verwandte Wörter; Präfixe und Suffixe verändern Wortart oder Bedeutung.",
    "supportEn": "Identify what a word part adds instead of guessing from the root alone.",
    "structureDe": "Verb fördern → Nomen die Förderung; Adjektiv möglich → unmöglich durch Negation.",
    "workedExample": "Die Förderung kultureller Projekte ermöglicht neue Angebote.",
    "explanationDe": "Förderung benennt die Handlung als Nomen; ermöglicht bezeichnet das Schaffen einer Möglichkeit.",
    "check": {
      "question": "Was bedeutet das Präfix un- in unmöglich?",
      "options": [
        "Negation von möglich",
        "Steigerung von möglich"
      ],
      "answerIndex": 0,
      "explanation": "Förderung benennt die Handlung als Nomen; ermöglicht bezeichnet das Schaffen einer Möglichkeit."
    },
    "independentTask": "Bilde aus fördern das Nomen Förderung und verwende beide Formen in Sätzen über kulturelle Angebote."
  },
  "14": {
    "definitionDe": "Eine Metapher überträgt eine Bedeutung aus einem anderen Bereich; sie ist nicht wörtlich zu verstehen.",
    "supportEn": "Explain the intended meaning of a figurative expression.",
    "structureDe": "Übertragenes Bild + Kontext → sachliche Paraphrase.",
    "workedExample": "Das Archiv ist das Gedächtnis der Stadt. → Das Archiv bewahrt Informationen über die Stadtgeschichte.",
    "explanationDe": "Gedächtnis meint hier die gespeicherte Geschichte, kein menschliches Organ.",
    "check": {
      "question": "Welche Lesart ist gemeint?",
      "options": [
        "Das Archiv bewahrt die Stadtgeschichte.",
        "Das Archiv hat ein biologisches Gedächtnis."
      ],
      "answerIndex": 0,
      "explanation": "Gedächtnis meint hier die gespeicherte Geschichte, kein menschliches Organ."
    },
    "independentTask": "Wähle ein sprachliches Bild zur Erinnerungskultur. Erkläre danach dieselbe Aussage sachlich ohne Metapher."
  },
  "15": {
    "definitionDe": "Gradpartikeln verändern die Stärke einer Bewertung; Vergleiche benennen einen Maßstab.",
    "supportEn": "Words such as deutlich or etwas change the degree, not the comparison itself.",
    "structureDe": "Komparativ + als; genauso + Adjektiv + wie; deutlich/etwas vor dem Komparativ.",
    "workedExample": "Die Lage ist deutlich angespannter als im Vorjahr.",
    "explanationDe": "deutlich verstärkt den Unterschied; als verbindet die Vergleichsgrößen.",
    "check": {
      "question": "Welche Verbindung ist korrekt?",
      "options": [
        "angespannter wie im Vorjahr",
        "angespannter als im Vorjahr"
      ],
      "answerIndex": 1,
      "explanation": "deutlich verstärkt den Unterschied; als verbindet die Vergleichsgrößen."
    },
    "independentTask": "Vergleiche Wohnbedingungen heute und im Vorjahr mit deutlich + Komparativ + als. Formuliere danach einen kleineren Unterschied mit etwas."
  },
  "16": {
    "definitionDe": "Informationskompression kürzt eine Aussage durch Nominalisierung, ohne ihre Beziehungen zu verlieren.",
    "supportEn": "Compress a clause into a noun phrase while retaining meaning.",
    "structureDe": "dass + Subjekt + Verb → Artikel + nominalisierte Handlung + Ergänzung.",
    "workedExample": "Dass Werbung personalisiert wird, beeinflusst Käufe. → Die Personalisierung von Werbung beeinflusst Käufe.",
    "explanationDe": "Personalisierung enthält dieselbe Handlung; von Werbung nennt ihren Gegenstand.",
    "check": {
      "question": "Welche Nominalisierung erhält die Aussage?",
      "options": [
        "Die Personalisierung von Werbung beeinflusst Käufe.",
        "Die Werbung verhindert Personalisierung."
      ],
      "answerIndex": 0,
      "explanation": "Personalisierung enthält dieselbe Handlung; von Werbung nennt ihren Gegenstand."
    },
    "independentTask": "Formuliere einen dass-Satz über personalisierte Werbung als Nominalgruppe. Kontrolliere, ob die Aussage gleich bleibt."
  },
  "17": {
    "definitionDe": "Eine Bedingung sagt, wann eine Aussage gilt; sie ist noch keine erfüllte Tatsache.",
    "supportEn": "State the requirement on which the result depends.",
    "structureDe": "sofern/falls + Nebensatz, Verb am Ende; danach Hauptsatz mit finitem Verb zuerst.",
    "workedExample": "Sofern genügend Fachkräfte verfügbar sind, kann die Betreuung ausgebaut werden.",
    "explanationDe": "Der Ausbau wird an die Verfügbarkeit von Fachkräften gebunden.",
    "check": {
      "question": "Welche Aussage nennt eine Voraussetzung?",
      "options": [
        "Der Ausbau ist bereits gesichert.",
        "Der Ausbau ist möglich, sofern Fachkräfte verfügbar sind."
      ],
      "answerIndex": 1,
      "explanation": "Der Ausbau wird an die Verfügbarkeit von Fachkräften gebunden."
    },
    "independentTask": "Nenne mit sofern eine Voraussetzung für bessere Kinderbetreuung. Erkläre, was ohne diese Voraussetzung offenbleibt."
  },
  "18": {
    "definitionDe": "Konjunktiv II der Vergangenheit beschreibt eine Alternative, die nicht eingetreten ist.",
    "supportEn": "Describe an unreal past condition and its unreal result.",
    "structureDe": "hätte/wäre + Partizip II; im wenn-Satz steht hätte/wäre am Ende.",
    "workedExample": "Wenn das Unternehmen früher investiert hätte, wären die Lücken kleiner ausgefallen.",
    "explanationDe": "Die Investition erfolgte nicht früher; die Folge bleibt eine rückblickende Alternative.",
    "check": {
      "question": "Welche Form beschreibt eine irreale Vergangenheit?",
      "options": [
        "Wenn es investiert hätte, wären die Lücken kleiner gewesen.",
        "Wenn es investiert, werden die Lücken kleiner."
      ],
      "answerIndex": 0,
      "explanation": "Die Investition erfolgte nicht früher; die Folge bleibt eine rückblickende Alternative."
    },
    "independentTask": "Beschreibe eine verpasste Weiterbildung mit wenn + hätte und einer irrealen Folge mit wäre oder hätte."
  },
  "19": {
    "definitionDe": "Komplexe Konnektoren unterscheiden Begründung, Bedingung, Einschränkung und Gegensatz.",
    "supportEn": "Choose a connector by its logical function.",
    "structureDe": "insofern ..., als ... erklärt eine eingeschränkte Geltung; zumal begründet; wenngleich räumt ein.",
    "workedExample": "Globalisierung ist insofern vorteilhaft, als sie Spezialisierung ermöglicht.",
    "explanationDe": "als erläutert genau den Gesichtspunkt, unter dem der Vorteil gilt.",
    "check": {
      "question": "Welcher Anschluss gehört zu insofern?",
      "options": [
        "als",
        "obwohl"
      ],
      "answerIndex": 0,
      "explanation": "als erläutert genau den Gesichtspunkt, unter dem der Vorteil gilt."
    },
    "independentTask": "Bewerte Globalisierung mit insofern ..., als ... . Ergänze mit wenngleich eine Einschränkung."
  },
  "20": {
    "definitionDe": "Abtönung verändert die Haltung zu einer Aussage; Partikeln hängen von Kontext und Register ab.",
    "supportEn": "A small word can signal agreement, reservation or emphasis.",
    "structureDe": "durchaus vor einer Bewertung = ausdrückliche, oft eingeschränkte Zustimmung; allerdings führt einen Vorbehalt ein.",
    "workedExample": "Die Position ist durchaus nachvollziehbar, allerdings fehlen Belege.",
    "explanationDe": "Die erste Hälfte stimmt teilweise zu; die zweite begrenzt die Zustimmung.",
    "check": {
      "question": "Welche Form stimmt zu und nennt einen Vorbehalt?",
      "options": [
        "Die Position ist durchaus nachvollziehbar, allerdings fehlen Belege.",
        "Die Position ist vollkommen bewiesen."
      ],
      "answerIndex": 0,
      "explanation": "Die erste Hälfte stimmt teilweise zu; die zweite begrenzt die Zustimmung."
    },
    "independentTask": "Reagiere auf eine Position zu sozialen Medien mit durchaus und allerdings. Erkläre Zustimmung und Vorbehalt."
  },
  "21": {
    "definitionDe": "Institutioneller Stil nutzt sachliche, feste Wortverbindungen, um Verfahren und Zuständigkeiten zu benennen.",
    "supportEn": "Use established administrative collocations clearly.",
    "structureDe": "einen Antrag stellen; Auskunft erteilen; Verantwortung für + Akkusativ übernehmen.",
    "workedExample": "Die Behörde erteilt Auskunft über das Verfahren.",
    "explanationDe": "erteilen passt zu Auskunft; es bedeutet Informationen offiziell geben.",
    "check": {
      "question": "Welche Verbindung passt?",
      "options": [
        "Auskunft machen",
        "Auskunft erteilen"
      ],
      "answerIndex": 1,
      "explanation": "erteilen passt zu Auskunft; es bedeutet Informationen offiziell geben."
    },
    "independentTask": "Formuliere zwei Verwaltungssätze mit einen Antrag stellen und Auskunft erteilen."
  },
  "22": {
    "definitionDe": "Temporale Konnektoren ordnen Ereignisse zeitlich: vorher, gleichzeitig oder nachher.",
    "supportEn": "Mark sequence without confusing it with cause.",
    "structureDe": "bevor/während/nachdem + Nebensatz mit Verb am Ende; bei vergangener Vorzeitigkeit oft Plusquamperfekt.",
    "workedExample": "Nachdem die Region Grenzen festgelegt hatte, weitete sie das Angebot aus.",
    "explanationDe": "festgelegt hatte liegt vor weitete aus.",
    "check": {
      "question": "Welcher Konnektor zeigt, dass die Festlegung zuerst geschah?",
      "options": [
        "nachdem",
        "bevor"
      ],
      "answerIndex": 0,
      "explanation": "festgelegt hatte liegt vor weitete aus."
    },
    "independentTask": "Beschreibe zwei Schritte nachhaltiger Tourismusplanung mit nachdem. Zeige, welcher Schritt zuerst abgeschlossen war."
  },
  "23": {
    "definitionDe": "Hedging begrenzt eine Aussage. Diplomatische Kritik nennt den Vorbehalt sachlich und respektvoll.",
    "supportEn": "Soften the force of criticism without hiding the actual concern.",
    "structureDe": "Dieser Einschätzung lässt sich nur bedingt zustimmen, weil + Nebensatz.",
    "workedExample": "Der Vorschlag ist falsch. → Dem Vorschlag lässt sich nur bedingt zustimmen, weil die Finanzierung ungeklärt ist.",
    "explanationDe": "nur bedingt begrenzt Zustimmung; weil nennt einen prüfbaren Grund.",
    "check": {
      "question": "Welche Form kritisiert diplomatisch und konkret?",
      "options": [
        "Der Vorschlag ist Unsinn.",
        "Dem Vorschlag lässt sich nur bedingt zustimmen, weil die Finanzierung fehlt."
      ],
      "answerIndex": 1,
      "explanation": "nur bedingt begrenzt Zustimmung; weil nennt einen prüfbaren Grund."
    },
    "independentTask": "Formuliere einen konkreten diplomatischen Einwand mit nur bedingt zustimmen und einer Begründung."
  },
  "24": {
    "definitionDe": "Eine These ist eine Position; eine Begründung erklärt sie, ein Beleg stützt sie, ein Einwand prüft ihre Grenzen.",
    "supportEn": "Keep claims, reasons, evidence and objections distinct.",
    "structureDe": "These → weil + Grund → Beispiel/Beleg → allerdings + Einwand → Reaktion.",
    "workedExample": "Debatten brauchen Quellen, weil Aussagen überprüfbar sein sollen. Allerdings lösen Quellen allein keine Wertkonflikte.",
    "explanationDe": "weil begründet die Forderung; allerdings nennt eine Grenze statt dieselbe These zu wiederholen.",
    "check": {
      "question": "Was ist ein Beleg?",
      "options": [
        "Eine überprüfbare Quelle oder Beobachtung.",
        "Die Wiederholung der eigenen Meinung."
      ],
      "answerIndex": 0,
      "explanation": "weil begründet die Forderung; allerdings nennt eine Grenze statt dieselbe These zu wiederholen."
    },
    "independentTask": "Schreibe eine These, eine Begründung, einen überprüfbaren Beleg und einen Einwand zu einer gesellschaftlichen Debatte."
  },
  "25": {
    "definitionDe": "Evidentialität markiert, worauf Wissen beruht. Ein Zusammenhang beweist noch keine Ursache.",
    "supportEn": "Use reporting verbs to show how much the data support.",
    "structureDe": "Daten legen + Akkusativ + nahe; Daten deuten auf + Akkusativ + hin.",
    "workedExample": "Die Daten legen einen Zusammenhang nahe, belegen aber keine Ursache.",
    "explanationDe": "nahelegen ist vorsichtiger als beweisen; Ursache und Zusammenhang bleiben getrennt.",
    "check": {
      "question": "Was folgt allein aus einer Korrelation?",
      "options": [
        "Eine Ursache ist bewiesen.",
        "Ein Zusammenhang ist beobachtet; die Ursache bleibt offen."
      ],
      "answerIndex": 1,
      "explanation": "nahelegen ist vorsichtiger als beweisen; Ursache und Zusammenhang bleiben getrennt."
    },
    "independentTask": "Beschreibe einen statistischen Zusammenhang mit nahelegen oder hindeuten auf. Erkläre, warum daraus noch keine Ursache folgt."
  },
  "26": {
    "definitionDe": "Eine Satzperiode verbindet Hauptaussage und abhängige Teilaussagen in einer klaren Hierarchie.",
    "supportEn": "Find the main clause first, then attach subordinate clauses.",
    "structureDe": "Hauptsatz: Verb an Position 2; eingebetteter Nebensatz: Verb am Ende; Einschübe mit Kommas abgrenzen.",
    "workedExample": "Die Frage, ob der Fortschritt vertretbar ist, bleibt offen, solange seine Folgen unbekannt sind.",
    "explanationDe": "bleibt gehört zur Hauptaussage; ist und sind schließen die Nebensätze.",
    "check": {
      "question": "Welches Verb gehört zum Hauptsatz?",
      "options": [
        "bleibt",
        "sind"
      ],
      "answerIndex": 0,
      "explanation": "bleibt gehört zur Hauptaussage; ist und sind schließen die Nebensätze."
    },
    "independentTask": "Baue eine Hauptaussage über technischen Fortschritt mit einem ob-Satz und einer Bedingung. Markiere die drei finiten Verben."
  },
  "27": {
    "definitionDe": "Kohäsion verbindet Sätze durch eindeutige Bezüge. Präzision und Kürze helfen mehr als Wiederholungen.",
    "supportEn": "Edit vague references and redundant wording.",
    "structureDe": "Nenne den Bezug ausdrücklich, wenn dieses/sie/es mehrdeutig ist; ersetze schwache Verb-Nomen-Kombinationen bei Bedarf.",
    "workedExample": "Die Studie untersucht eine Reform. Diese ist umstritten. → Die Studie untersucht eine umstrittene Reform.",
    "explanationDe": "Die Überarbeitung macht klar, dass die Reform umstritten ist, nicht die Studie.",
    "check": {
      "question": "Welche Form ist eindeutig?",
      "options": [
        "Diese ist umstritten.",
        "Die untersuchte Reform ist umstritten."
      ],
      "answerIndex": 1,
      "explanation": "Die Überarbeitung macht klar, dass die Reform umstritten ist, nicht die Studie."
    },
    "independentTask": "Schreibe zwei Sätze über eine Studie und eine Reform. Überarbeite einen mehrdeutigen Pronomenbezug so, dass klar ist, was gemeint ist."
  },
  "28": {
    "definitionDe": "Reformulierung ändert die Form, erhält aber Bedeutung, Sicherheit und Register.",
    "supportEn": "Combine the learned tools without making a claim stronger.",
    "structureDe": "Zuerst Aussage und Evidenz markieren; dann umformen; zuletzt Bedeutung, Kasus und Verbposition vergleichen.",
    "workedExample": "Die Daten deuten auf einen Vorteil hin. → Die Daten lassen einen Vorteil vermuten.",
    "explanationDe": "Beide Formulierungen bleiben vorsichtig; beweisen würde die Aussage unzulässig verstärken.",
    "check": {
      "question": "Welche Umformung erhält den Evidenzgrad?",
      "options": [
        "Die Daten beweisen einen Vorteil.",
        "Die Daten lassen einen Vorteil vermuten."
      ],
      "answerIndex": 1,
      "explanation": "Beide Formulierungen bleiben vorsichtig; beweisen würde die Aussage unzulässig verstärken."
    },
    "independentTask": "Formuliere eine vorsichtige Aussage um. Vergleiche danach Bedeutung, Evidenzgrad und Register beider Versionen."
  }
};
export const getC2GrammarTeaching = day => C2_GRAMMAR_TEACHING[Number(day)] || null;
