// A2 Day 1–28: authored, workbook-topic-specific classroom transfer labs.
// Deliberately separate from graded workbook Hören and independent speaking tasks.
// Teacher-led, ungraded oral work; all values are fictional teaching scenarios.
const LABS = {
  "A2-1.1": {
    "day": 1,
    "title": "Small-Talk-Labor",
    "context": "Drei neue Kursteilnehmer erzählen von ihrem Tag. Erkläre Gründe und Folgen.",
    "columns": [
      "Person",
      "Situation",
      "Grund",
      "Plan"
    ],
    "rows": [
      [
        "Nina",
        "ist müde",
        "hat wenig geschlafen",
        "geht früh ins Bett"
      ],
      [
        "Ben",
        "lernt Deutsch",
        "möchte in Berlin arbeiten",
        "besucht den Sprachkurs"
      ],
      [
        "Mia",
        "ist glücklich",
        "hat die Prüfung bestanden",
        "feiert mit Freunden"
      ]
    ],
    "tasks": [
      {
        "label": "Grund erklären",
        "prompt": "Warum ist Nina müde? Verbinde Situation und Grund.",
        "hint": "weil · Verb am Satzende",
        "answer": "Nina ist müde, weil sie wenig geschlafen hat.",
        "criterion": "weil mit richtigem Verb am Ende"
      },
      {
        "label": "Mit denn begründen",
        "prompt": "Warum lernt Ben Deutsch? Verwende denn.",
        "hint": "denn · normale Wortstellung",
        "answer": "Ben lernt Deutsch, denn er möchte in Berlin arbeiten.",
        "criterion": "Hauptsatzstellung nach denn"
      },
      {
        "label": "Eine Folge nennen",
        "prompt": "Mia hat die Prüfung bestanden. Was macht sie deshalb?",
        "hint": "deshalb · Verb direkt danach",
        "answer": "Mia hat die Prüfung bestanden. Deshalb feiert sie mit Freunden.",
        "criterion": "deshalb + Verb an Position 2"
      }
    ]
  },
  "A2-1.2": {
    "day": 2,
    "title": "Personen-Labor",
    "context": "Du kennst drei Personen aus einem Sprachkurs. Beschreibe sie anhand der Informationen.",
    "columns": [
      "Person",
      "Aussehen",
      "Kleidung",
      "Charakter"
    ],
    "rows": [
      [
        "Lena",
        "lange Haare",
        "rote Jacke",
        "freundlich"
      ],
      [
        "Ben",
        "kurze Haare",
        "schwarzer Mantel",
        "ruhig"
      ],
      [
        "Mila",
        "lockige Haare",
        "grüner Pullover",
        "offen"
      ]
    ],
    "tasks": [
      {
        "label": "Kleidung beschreiben",
        "prompt": "Welche Jacke trägt Lena? Antworte mit einem unbestimmten Artikel.",
        "hint": "Akkusativ · eine rote Jacke",
        "answer": "Lena trägt eine rote Jacke.",
        "criterion": "richtige Adjektivendung bei femininem Akkusativ"
      },
      {
        "label": "Einen Mann beschreiben",
        "prompt": "Was trägt Ben? Benutze einen und das passende Adjektiv.",
        "hint": "Akkusativ · einen schwarzen Mantel",
        "answer": "Ben trägt einen schwarzen Mantel.",
        "criterion": "einen + -en im Akkusativ"
      },
      {
        "label": "Aussehen und Charakter",
        "prompt": "Beschreibe Milas Pullover und ihren Charakter in einem Satz.",
        "hint": "Nominativ · ein grüner Pullover",
        "answer": "Mila trägt einen grünen Pullover und ist offen.",
        "criterion": "einen grünen Pullover im Akkusativ"
      }
    ]
  },
  "A2-1.3": {
    "day": 3,
    "title": "Vergleichs-Labor",
    "context": "Drei Wohnungen stehen zur Auswahl. Vergleiche die Angaben und entscheide.",
    "columns": [
      "Wohnung",
      "Miete",
      "Zimmer",
      "Zum Zentrum"
    ],
    "rows": [
      [
        "A",
        "500 €",
        "2",
        "10 Min."
      ],
      [
        "B",
        "600 €",
        "3",
        "15 Min."
      ],
      [
        "C",
        "450 €",
        "2",
        "25 Min."
      ]
    ],
    "tasks": [
      {
        "label": "Was ist gleich?",
        "prompt": "Welche Wohnungen haben genauso viele Zimmer?",
        "hint": "genauso … wie",
        "answer": "Wohnung A hat genauso viele Zimmer wie Wohnung C.",
        "criterion": "Gleichheit mit genauso ... wie"
      },
      {
        "label": "Was ist anders?",
        "prompt": "Vergleiche die Miete von Wohnung B und A.",
        "hint": "Komparativ + als",
        "answer": "Wohnung B ist teurer als Wohnung A.",
        "criterion": "teurer als richtig verwenden"
      },
      {
        "label": "Triff eine Entscheidung",
        "prompt": "Du hast höchstens 470 € pro Monat. Welche Wohnung passt? Begründe.",
        "hint": "Superlativ · am …sten",
        "answer": "Ich wähle Wohnung C, weil sie am günstigsten ist.",
        "criterion": "am günstigsten und passender Grund"
      }
    ]
  },
  "A2-2.4": {
    "day": 4,
    "title": "Treffpunkt-Labor",
    "context": "Ihr plant ein Treffen. Unterscheide den Treffpunkt (Wo?) vom Ziel (Wohin?).",
    "columns": [
      "Ort",
      "Treffpunkt (Wo?)",
      "Ziel (Wohin?)",
      "Uhrzeit"
    ],
    "rows": [
      [
        "Café",
        "im Café",
        "ins Café",
        "16 Uhr"
      ],
      [
        "Park",
        "im Park",
        "in den Park",
        "17 Uhr"
      ],
      [
        "Kino",
        "vor dem Kino",
        "ins Kino",
        "18 Uhr"
      ]
    ],
    "tasks": [
      {
        "label": "Treffpunkt nennen",
        "prompt": "Wo trefft ihr euch um 16 Uhr?",
        "hint": "Wo? · Dativ",
        "answer": "Wir treffen uns um 16 Uhr im Café.",
        "criterion": "Wo? mit Dativ"
      },
      {
        "label": "Weg beschreiben",
        "prompt": "Wohin geht ihr um 17 Uhr?",
        "hint": "Wohin? · Akkusativ",
        "answer": "Um 17 Uhr gehen wir in den Park.",
        "criterion": "Wohin? mit Akkusativ"
      },
      {
        "label": "Plan bestätigen",
        "prompt": "Wo trefft ihr euch vor dem Film und wohin geht ihr danach?",
        "hint": "vor + Dativ · in + Akkusativ",
        "answer": "Wir treffen uns vor dem Kino und gehen danach ins Kino.",
        "criterion": "Ort und Richtung unterscheiden"
      }
    ]
  },
  "A2-2.5": {
    "day": 5,
    "title": "Freizeit-Labor",
    "context": "Drei Freunde planen ihren freien Abend. Verwende trennbare Verben.",
    "columns": [
      "Person",
      "Zeit",
      "Aktivität",
      "Mit wem?"
    ],
    "rows": [
      [
        "Mila",
        "Samstag · 18 Uhr",
        "anrufen",
        "ihre Freundin"
      ],
      [
        "Tarek",
        "Sonntag · 11 Uhr",
        "einkaufen",
        "allein"
      ],
      [
        "Lena",
        "Freitag · 20 Uhr",
        "ausgehen",
        "mit Freunden"
      ]
    ],
    "tasks": [
      {
        "label": "Trennbares Verb",
        "prompt": "Was macht Mila am Samstag um 18 Uhr?",
        "hint": "anrufen · ruft … an",
        "answer": "Mila ruft am Samstag um 18 Uhr ihre Freundin an.",
        "criterion": "Vorsilbe am Satzende"
      },
      {
        "label": "Mit Modalverb",
        "prompt": "Was möchte Tarek am Sonntag machen?",
        "hint": "möchte + Infinitiv",
        "answer": "Tarek möchte am Sonntag um 11 Uhr einkaufen.",
        "criterion": "ganzer Infinitiv am Ende"
      },
      {
        "label": "Zeit zuerst",
        "prompt": "Beginne mit Am Freitag: Was macht Lena?",
        "hint": "Verb an Position 2",
        "answer": "Am Freitag geht Lena um 20 Uhr mit Freunden aus.",
        "criterion": "Zeitangabe zuerst, aus am Ende"
      }
    ]
  },
  "A2-3.6": {
    "day": 6,
    "title": "Zimmer-Labor",
    "context": "Du richtest das Wohnzimmer neu ein. Sage, wo Dinge stehen und wohin du sie stellst.",
    "columns": [
      "Möbel",
      "Jetzt (Wo?)",
      "Neuer Platz (Wohin?)"
    ],
    "rows": [
      [
        "Sofa",
        "neben der Tür",
        "neben das Fenster"
      ],
      [
        "Lampe",
        "auf dem Tisch",
        "neben das Bett"
      ],
      [
        "Stuhl",
        "vor dem Fenster",
        "vor den Schreibtisch"
      ]
    ],
    "tasks": [
      {
        "label": "Position erklären",
        "prompt": "Wo steht das Sofa jetzt?",
        "hint": "Wo? · Dativ",
        "answer": "Das Sofa steht neben der Tür.",
        "criterion": "Dativ für feste Position"
      },
      {
        "label": "Bewegung erklären",
        "prompt": "Wohin stellst du das Sofa?",
        "hint": "Wohin? · Akkusativ",
        "answer": "Ich stelle das Sofa neben das Fenster.",
        "criterion": "Akkusativ für Richtung"
      },
      {
        "label": "Zwei Fälle verbinden",
        "prompt": "Wo steht der Stuhl und wohin stellst du ihn?",
        "hint": "vor dem · vor den",
        "answer": "Der Stuhl steht vor dem Fenster. Ich stelle ihn vor den Schreibtisch.",
        "criterion": "dem und den unterscheiden"
      }
    ]
  },
  "A2-3.7": {
    "day": 7,
    "title": "Wohnungssuche-Labor",
    "context": "Du suchst eine Wohnung. Die Anzeigen enthalten unterschiedliche Angebote.",
    "columns": [
      "Wohnung",
      "Miete",
      "Zimmer",
      "Besonderheit"
    ],
    "rows": [
      [
        "A",
        "520 €",
        "2",
        "Balkon"
      ],
      [
        "B",
        "650 €",
        "3",
        "Aufzug"
      ],
      [
        "C",
        "480 €",
        "1",
        "nahe am Bahnhof"
      ]
    ],
    "tasks": [
      {
        "label": "Passende Wohnung finden",
        "prompt": "Du möchtest einen Balkon. Beschreibe Wohnung A mit einem Relativsatz.",
        "hint": "die · Relativsatz im Nominativ",
        "answer": "Ich suche eine Wohnung, die einen Balkon hat.",
        "criterion": "Relativpronomen die und Verb am Ende"
      },
      {
        "label": "Relativsatz ergänzen",
        "prompt": "Welche Wohnung kostet 480 €? Benutze die.",
        "hint": "die … kostet",
        "answer": "Wohnung C ist eine Wohnung, die 480 Euro kostet.",
        "criterion": "Relativsatz mit der passenden Wohnung"
      },
      {
        "label": "Vermieter anschreiben",
        "prompt": "Du interessierst dich für Wohnung B. Frage höflich nach einem Besichtigungstermin.",
        "hint": "Könnten Sie …?",
        "answer": "Könnten Sie mir bitte einen Besichtigungstermin für Wohnung B anbieten?",
        "criterion": "konkrete höfliche Anfrage"
      }
    ]
  },
  "A2-3.8": {
    "day": 8,
    "title": "Restaurant-Labor",
    "context": "Du bestellst im Restaurant und musst bei einem Problem höflich reagieren.",
    "columns": [
      "Gericht",
      "Preis",
      "Information",
      "Bemerkung"
    ],
    "rows": [
      [
        "Suppe",
        "6 €",
        "vegetarisch",
        "wird kalt serviert"
      ],
      [
        "Pasta",
        "12 €",
        "mit Tomatensoße",
        "warm"
      ],
      [
        "Tee",
        "3 €",
        "ohne Zucker",
        "heiß"
      ]
    ],
    "tasks": [
      {
        "label": "Höflich bestellen",
        "prompt": "Bestelle eine Suppe und einen Tee.",
        "hint": "ich möchte · Akkusativ",
        "answer": "Ich möchte eine Suppe und einen Tee bestellen.",
        "criterion": "passende Artikel im Akkusativ"
      },
      {
        "label": "Höflich fragen",
        "prompt": "Du brauchst die Speisekarte. Frage den Kellner.",
        "hint": "Könnten Sie …?",
        "answer": "Könnten Sie mir bitte die Speisekarte bringen?",
        "criterion": "höfliche Bitte mit Infinitiv am Ende"
      },
      {
        "label": "Auf Problem reagieren",
        "prompt": "Die Suppe ist kalt. Wie sagst du es höflich?",
        "hint": "Entschuldigung …",
        "answer": "Entschuldigung, meine Suppe ist leider kalt. Könnten Sie sie bitte aufwärmen?",
        "criterion": "Problem und höfliche Lösung"
      }
    ]
  },
  "A2-4.9": {
    "day": 9,
    "title": "Urlaubs-Rückblick",
    "context": "Drei Personen berichten von ihrer letzten Reise. Erzähle im Perfekt.",
    "columns": [
      "Person",
      "Ziel",
      "Transport",
      "Aktivität"
    ],
    "rows": [
      [
        "Mila",
        "Berlin",
        "Zug",
        "Museum besuchen"
      ],
      [
        "Jonas",
        "Hamburg",
        "Bus",
        "Hafen fotografieren"
      ],
      [
        "Lea",
        "Köln",
        "Auto",
        "Freunde treffen"
      ]
    ],
    "tasks": [
      {
        "label": "Reise im Perfekt",
        "prompt": "Wie ist Mila nach Berlin gefahren?",
        "hint": "sein + gefahren",
        "answer": "Mila ist mit dem Zug nach Berlin gefahren.",
        "criterion": "sein als Hilfsverb der Bewegung"
      },
      {
        "label": "Aktivität im Perfekt",
        "prompt": "Was hat Jonas in Hamburg gemacht?",
        "hint": "haben + fotografiert",
        "answer": "Jonas hat den Hafen fotografiert.",
        "criterion": "haben und Partizip II"
      },
      {
        "label": "Zwei Erlebnisse",
        "prompt": "Erzähle von Leas Reise in zwei kurzen Sätzen.",
        "hint": "ist gefahren · hat getroffen",
        "answer": "Lea ist mit dem Auto nach Köln gefahren. Dort hat sie Freunde getroffen.",
        "criterion": "sein und haben passend kombinieren"
      }
    ]
  },
  "A2-4.10": {
    "day": 10,
    "title": "Stadterlebnis-Labor",
    "context": "Drei Freunde erzählen von ihrem Stadtbesuch. Verwende war, hatte und konnte.",
    "columns": [
      "Person",
      "Ort",
      "Eindruck",
      "Möglichkeit"
    ],
    "rows": [
      [
        "Mia",
        "Stadtmuseum",
        "spannend",
        "hatte viel Zeit"
      ],
      [
        "Ben",
        "Markt",
        "sehr voll",
        "hatte wenig Zeit"
      ],
      [
        "Eva",
        "Stadtpark",
        "ruhig",
        "konnte spazieren gehen"
      ]
    ],
    "tasks": [
      {
        "label": "Mit war erzählen",
        "prompt": "Wo war Mia und wie war es dort?",
        "hint": "Präteritum · war",
        "answer": "Mia war im Stadtmuseum. Es war spannend.",
        "criterion": "war passend verwenden"
      },
      {
        "label": "Mit hatte berichten",
        "prompt": "Wie viel Zeit hatte Ben auf dem Markt?",
        "hint": "Präteritum · hatte",
        "answer": "Ben war auf dem Markt und hatte wenig Zeit.",
        "criterion": "hatte im Kontext"
      },
      {
        "label": "Erlebnis verbinden",
        "prompt": "Was konnte Eva im Stadtpark machen?",
        "hint": "Präteritum · konnte",
        "answer": "Im Stadtpark war es ruhig. Eva konnte dort spazieren gehen.",
        "criterion": "konnte + Infinitiv am Satzende"
      }
    ]
  },
  "A2-4.11": {
    "day": 11,
    "title": "Verkehrs-Labor",
    "context": "Du musst einen Termin erreichen. Vergleiche drei Verkehrsmittel.",
    "columns": [
      "Verkehrsmittel",
      "Dauer",
      "Kosten",
      "Komfort"
    ],
    "rows": [
      [
        "Bus",
        "50 Min.",
        "3 €",
        "mittel"
      ],
      [
        "Zug",
        "30 Min.",
        "5 €",
        "hoch"
      ],
      [
        "Fahrrad",
        "60 Min.",
        "0 €",
        "niedrig"
      ]
    ],
    "tasks": [
      {
        "label": "Dauer vergleichen",
        "prompt": "Vergleiche den Zug mit dem Bus.",
        "hint": "schneller als",
        "answer": "Der Zug ist schneller als der Bus.",
        "criterion": "Komparativ + als"
      },
      {
        "label": "Kosten vergleichen",
        "prompt": "Welches Verkehrsmittel ist am günstigsten?",
        "hint": "Superlativ · am günstigsten",
        "answer": "Das Fahrrad ist am günstigsten.",
        "criterion": "Superlativ korrekt verwenden"
      },
      {
        "label": "Entscheidung begründen",
        "prompt": "Du musst in 35 Minuten ankommen. Was wählst du?",
        "hint": "weil · Grund",
        "answer": "Ich nehme den Zug, weil ich in 35 Minuten ankommen muss.",
        "criterion": "begründete Entscheidung anhand der Tabelle"
      }
    ]
  },
  "A2-5.12": {
    "day": 12,
    "title": "Traumberuf-Labor",
    "context": "Drei Menschen haben berufliche Ziele. Verbinde Wunsch, Fähigkeit und Grund.",
    "columns": [
      "Person",
      "Traumberuf",
      "Grund",
      "Fähigkeit"
    ],
    "rows": [
      [
        "Nina",
        "Ärztin",
        "Menschen helfen",
        "gut zuhören"
      ],
      [
        "Ben",
        "Lehrer",
        "Kinder unterrichten",
        "gut erklären"
      ],
      [
        "Eva",
        "Köchin",
        "kreativ arbeiten",
        "gut kochen"
      ]
    ],
    "tasks": [
      {
        "label": "Wunsch und Grund",
        "prompt": "Warum möchte Nina Ärztin werden?",
        "hint": "möchte · weil",
        "answer": "Nina möchte Ärztin werden, weil sie Menschen helfen möchte.",
        "criterion": "weil mit Verb am Ende"
      },
      {
        "label": "Fähigkeit nennen",
        "prompt": "Was kann Ben besonders gut?",
        "hint": "kann + Infinitiv",
        "answer": "Ben kann gut erklären.",
        "criterion": "Modalverb + Infinitiv"
      },
      {
        "label": "Meinung formulieren",
        "prompt": "Was denkst du über Evas Berufswunsch? Benutze dass.",
        "hint": "Ich glaube, dass …",
        "answer": "Ich glaube, dass Eva Köchin werden möchte, weil sie kreativ arbeiten will.",
        "criterion": "dass und weil mit Verben am Ende"
      }
    ]
  },
  "A2-5.13": {
    "day": 13,
    "title": "Bewerbungs-Labor",
    "context": "Drei Bewerber berichten über ihre letzte Stelle.",
    "columns": [
      "Person",
      "Arbeitsort",
      "Pflicht",
      "Fähigkeit",
      "Berufsziel"
    ],
    "rows": [
      [
        "Nina",
        "Hotel",
        "Gäste begrüßen",
        "telefonieren",
        "Rezeptionistin"
      ],
      [
        "Ben",
        "Supermarkt",
        "Kasse bedienen",
        "Kunden beraten",
        "Filialleiter"
      ],
      [
        "Eva",
        "Büro",
        "Termine planen",
        "Texte schreiben",
        "Teamleiterin"
      ]
    ],
    "tasks": [
      {
        "label": "Pflicht beschreiben",
        "prompt": "Was musste Nina im Hotel tun?",
        "hint": "musste + Infinitiv",
        "answer": "Im Hotel musste Nina Gäste begrüßen.",
        "criterion": "musste in der Vergangenheit"
      },
      {
        "label": "Fähigkeit beschreiben",
        "prompt": "Was konnte Ben im Supermarkt machen?",
        "hint": "konnte + Infinitiv",
        "answer": "Ben konnte im Supermarkt Kunden beraten.",
        "criterion": "konnte + Infinitiv"
      },
      {
        "label": "Früheres Ziel",
        "prompt": "Was wollte Eva in ihrem Beruf werden?",
        "hint": "wollte + Infinitiv",
        "answer": "Eva wollte Teamleiterin werden.",
        "criterion": "wollte mit Infinitiv"
      }
    ]
  },
  "A2-5.14": {
    "day": 14,
    "title": "Karriere-Labor",
    "context": "Drei Personen lernen neue Fähigkeiten für ihre Zukunft.",
    "columns": [
      "Person",
      "Maßnahme",
      "Ziel"
    ],
    "rows": [
      [
        "Nina",
        "macht einen Deutschkurs",
        "im Hotel arbeiten"
      ],
      [
        "Ben",
        "besucht ein Seminar",
        "Kunden besser beraten"
      ],
      [
        "Lea",
        "bekommt Hilfe von der Kollegin",
        "die Prüfung bestehen"
      ]
    ],
    "tasks": [
      {
        "label": "Ziel nennen",
        "prompt": "Warum macht Nina einen Deutschkurs? Benutze um … zu.",
        "hint": "um … zu + Infinitiv",
        "answer": "Nina macht einen Deutschkurs, um im Hotel zu arbeiten.",
        "criterion": "Zwecksatz mit um ... zu"
      },
      {
        "label": "Weiterbildung erklären",
        "prompt": "Verbinde Bens Maßnahme und sein Ziel.",
        "hint": "um … zu",
        "answer": "Ben besucht ein Seminar, um Kunden besser zu beraten.",
        "criterion": "um ... zu mit gleichem Subjekt"
      },
      {
        "label": "Anderes Subjekt",
        "prompt": "Leas Kollegin hilft ihr. Formuliere das Ziel mit damit.",
        "hint": "damit · Verb am Ende",
        "answer": "Die Kollegin hilft Lea, damit sie die Prüfung besteht.",
        "criterion": "damit-Satz mit eigenem Subjekt"
      }
    ]
  },
  "A2-6.15": {
    "day": 15,
    "title": "Sport-Labor",
    "context": "Drei Freunde erzählen, wie lange sie schon Sport treiben.",
    "columns": [
      "Person",
      "Sportart",
      "Dauer bis heute",
      "Beginn"
    ],
    "rows": [
      [
        "Mila",
        "Tennis",
        "seit einem Jahr",
        "vor einem Jahr"
      ],
      [
        "Ben",
        "Fußball",
        "seit drei Jahren",
        "vor drei Jahren"
      ],
      [
        "Lea",
        "Schwimmen",
        "seit sechs Monaten",
        "vor sechs Monaten"
      ]
    ],
    "tasks": [
      {
        "label": "Dauer ausdrücken",
        "prompt": "Wie lange spielt Ben schon Fußball?",
        "hint": "seit + Dativ · Präsens",
        "answer": "Ben spielt seit drei Jahren Fußball.",
        "criterion": "seit + Dativ + Präsens"
      },
      {
        "label": "Beginn nennen",
        "prompt": "Wann hat Mila mit Tennis angefangen?",
        "hint": "vor + Dativ · Perfekt",
        "answer": "Mila hat vor einem Jahr mit Tennis angefangen.",
        "criterion": "vor einem Jahr richtig verwenden"
      },
      {
        "label": "Vergleichen und berichten",
        "prompt": "Erzähle, wie lange Lea schon schwimmt.",
        "hint": "seit sechs Monaten",
        "answer": "Lea schwimmt seit sechs Monaten.",
        "criterion": "seit + Dativ und Präsens"
      }
    ]
  },
  "A2-6.16": {
    "day": 16,
    "title": "Wohlfühl-Labor",
    "context": "Was hilft diesen Menschen im Alltag? Benutze reflexive Verben.",
    "columns": [
      "Person",
      "Situation",
      "Was hilft?"
    ],
    "rows": [
      [
        "Mila",
        "ist gestresst",
        "sich mit Musik entspannen"
      ],
      [
        "Jonas",
        "ist müde",
        "sich abends ausruhen"
      ],
      [
        "Eva",
        "fühlt sich unruhig",
        "sich auf einen ruhigen Abend freuen"
      ]
    ],
    "tasks": [
      {
        "label": "Reflexiv ausdrücken",
        "prompt": "Was macht Mila gegen Stress?",
        "hint": "sich entspannen",
        "answer": "Mila entspannt sich mit Musik.",
        "criterion": "sich passend zu Mila"
      },
      {
        "label": "Trennbares Reflexivverb",
        "prompt": "Was macht Jonas am Abend?",
        "hint": "sich ausruhen · ruht … aus",
        "answer": "Jonas ruht sich abends aus.",
        "criterion": "reflexiv + trennbares Verb"
      },
      {
        "label": "Gefühl beschreiben",
        "prompt": "Wie fühlt sich Eva, und worauf freut sie sich?",
        "hint": "sich fühlen · sich freuen",
        "answer": "Eva fühlt sich unruhig. Sie freut sich auf einen ruhigen Abend.",
        "criterion": "reflexive Pronomen korrekt setzen"
      }
    ]
  },
  "A2-6.17": {
    "day": 17,
    "title": "Apotheken-Labor",
    "context": "Drei Kunden kommen mit unterschiedlichen Beschwerden. Formuliere passende Fragen.",
    "columns": [
      "Person",
      "Beschwerde",
      "Hinweis auf dem Zettel"
    ],
    "rows": [
      [
        "Nina",
        "Husten",
        "viel trinken"
      ],
      [
        "Ben",
        "Kopfschmerzen",
        "Tabletten nach dem Essen nehmen"
      ],
      [
        "Eva",
        "hohes Fieber",
        "Arzt kontaktieren"
      ]
    ],
    "tasks": [
      {
        "label": "Empfehlung wiedergeben",
        "prompt": "Was soll Nina bei Husten machen?",
        "hint": "sollen + Infinitiv",
        "answer": "Nina soll bei Husten viel trinken.",
        "criterion": "soll + Infinitiv am Ende"
      },
      {
        "label": "Dosierung erfragen",
        "prompt": "Ben möchte wissen, wie oft er die Tabletten nehmen soll. Formuliere seine Frage.",
        "hint": "Wie oft soll ich …?",
        "answer": "Wie oft soll ich die Tabletten nehmen?",
        "criterion": "Modalverb in einer W-Frage"
      },
      {
        "label": "Notwendigkeit erklären",
        "prompt": "Was muss Eva wegen des hohen Fiebers machen?",
        "hint": "müssen + Infinitiv",
        "answer": "Eva muss wegen des hohen Fiebers einen Arzt kontaktieren.",
        "criterion": "muss + Infinitiv am Ende"
      }
    ]
  },
  "A2-7.18": {
    "day": 18,
    "title": "Banktelefon-Labor",
    "context": "Drei Kunden haben ein Bankproblem. Formuliere höfliche Bitten.",
    "columns": [
      "Person",
      "Problem",
      "Wunsch"
    ],
    "rows": [
      [
        "Nina",
        "Karte ist gesperrt",
        "Karte entsperren lassen"
      ],
      [
        "Ben",
        "Überweisung fehlt",
        "Status prüfen lassen"
      ],
      [
        "Eva",
        "braucht einen Termin",
        "Rückruf bekommen"
      ]
    ],
    "tasks": [
      {
        "label": "Höflich um Hilfe bitten",
        "prompt": "Wie bittet Nina um die Entsperrung ihrer Karte?",
        "hint": "Könnten Sie …?",
        "answer": "Könnten Sie meine Karte bitte entsperren?",
        "criterion": "Konjunktiv-II-Höflichkeitsfrage"
      },
      {
        "label": "Wunsch formulieren",
        "prompt": "Was möchte Ben über die Überweisung wissen?",
        "hint": "ich würde gern …",
        "answer": "Ich würde gern wissen, wo meine Überweisung geblieben ist.",
        "criterion": "würde gern + Infinitiv"
      },
      {
        "label": "Rückruf erbitten",
        "prompt": "Wie kann Eva höflich um einen Rückruf bitten?",
        "hint": "Könnten Sie mich …?",
        "answer": "Könnten Sie mich bitte zurückrufen?",
        "criterion": "richtiges Reflexiv-/Objektpronomen und Infinitiv"
      }
    ]
  },
  "A2-7.19": {
    "day": 19,
    "title": "Einkaufs-Labor",
    "context": "Vergleiche Einkaufsmöglichkeiten. Begründe die Auswahl mit denn.",
    "columns": [
      "Produkt",
      "Option A",
      "Option B",
      "Wichtiger Grund"
    ],
    "rows": [
      [
        "Schuhe",
        "online · 50 €",
        "Geschäft · 60 €",
        "anprobieren"
      ],
      [
        "Obst",
        "Markt · 3 €",
        "Supermarkt · 4 €",
        "frisch auf dem Markt"
      ],
      [
        "Geschenk",
        "online · 12 €",
        "Geschäft · 15 €",
        "heute noch brauchen"
      ]
    ],
    "tasks": [
      {
        "label": "Alternative nennen",
        "prompt": "Wo kann man Schuhe kaufen? Formuliere mit entweder … oder.",
        "hint": "entweder … oder",
        "answer": "Man kann Schuhe entweder online oder im Geschäft kaufen.",
        "criterion": "zwei Alternativen verbinden"
      },
      {
        "label": "Entscheidung begründen",
        "prompt": "Warum kaufst du Schuhe lieber im Geschäft?",
        "hint": "denn · normale Wortstellung",
        "answer": "Ich kaufe Schuhe im Geschäft, denn ich kann sie dort anprobieren.",
        "criterion": "denn und Hauptsatzstellung"
      },
      {
        "label": "Eine Wahl treffen",
        "prompt": "Wo kaufst du das Obst und warum?",
        "hint": "denn · Begründung",
        "answer": "Ich kaufe das Obst auf dem Markt, denn es ist dort frisch.",
        "criterion": "Entscheidung mit nachvollziehbarem Grund"
      }
    ]
  },
  "A2-7.20": {
    "day": 20,
    "title": "Reklamations-Labor",
    "context": "Drei Produkte haben Probleme. Formuliere Reklamationen mit einer Lösung.",
    "columns": [
      "Produkt",
      "Problem",
      "Kaufbeleg",
      "Gewünschte Lösung"
    ],
    "rows": [
      [
        "Kopfhörer",
        "funktionieren nicht",
        "Kassenbon",
        "Ersatz"
      ],
      [
        "Jacke",
        "zu klein",
        "Rechnung",
        "Umtausch"
      ],
      [
        "Mixer",
        "Motor defekt",
        "Bestellnummer",
        "Reparatur"
      ]
    ],
    "tasks": [
      {
        "label": "Problem begründen",
        "prompt": "Warum reklamierst du die Kopfhörer? Verwende weil.",
        "hint": "weil · Verb am Ende",
        "answer": "Ich reklamiere die Kopfhörer, weil sie nicht funktionieren.",
        "criterion": "Problem und weil-Satz"
      },
      {
        "label": "Lösung höflich verlangen",
        "prompt": "Welche Bitte stellst du wegen der Jacke?",
        "hint": "Könnten Sie …?",
        "answer": "Könnten Sie die Jacke bitte umtauschen?",
        "criterion": "konkrete höfliche Bitte"
      },
      {
        "label": "Reklamation vervollständigen",
        "prompt": "Formuliere zu dem Mixer Problem und gewünschte Lösung.",
        "hint": "weil · ich hätte gern",
        "answer": "Ich reklamiere den Mixer, weil der Motor defekt ist. Ich hätte gern eine Reparatur.",
        "criterion": "Problem + Grund + gewünschte Lösung"
      }
    ]
  },
  "A2-8.21": {
    "day": 21,
    "title": "Wochenend-Planlabor",
    "context": "Das Wetter und die Zeit deiner Freunde verändern eure Pläne.",
    "columns": [
      "Tag",
      "Bedingung",
      "Aktivität"
    ],
    "rows": [
      [
        "Samstag",
        "sonnig",
        "in den Park gehen"
      ],
      [
        "Samstag",
        "regnerisch",
        "ins Museum gehen"
      ],
      [
        "Sonntag",
        "Freund hat Zeit",
        "ins Kino gehen"
      ]
    ],
    "tasks": [
      {
        "label": "Wenn-Satz",
        "prompt": "Was macht ihr am Samstag bei gutem Wetter?",
        "hint": "wenn · Verb am Ende",
        "answer": "Wenn es am Samstag sonnig ist, gehen wir in den Park.",
        "criterion": "Verb am Ende des wenn-Satzes"
      },
      {
        "label": "Falls-Satz",
        "prompt": "Wie ändert sich der Plan bei Regen?",
        "hint": "falls · Verb am Ende",
        "answer": "Falls es am Samstag regnet, gehen wir ins Museum.",
        "criterion": "richtige Bedingung mit falls"
      },
      {
        "label": "Indirekte Frage",
        "prompt": "Du weißt nicht, ob dein Freund Sonntag Zeit hat. Formuliere deine Frage.",
        "hint": "ob · Verb am Ende",
        "answer": "Ich möchte wissen, ob du am Sonntag Zeit für das Kino hast.",
        "criterion": "indirekte Ja-/Nein-Frage mit ob"
      }
    ]
  },
  "A2-8.22": {
    "day": 22,
    "title": "Wochenplan-Labor",
    "context": "Diese Woche ist gut gefüllt. Nutze Präsens mit klaren Zeitangaben.",
    "columns": [
      "Tag",
      "Termin",
      "Zeit",
      "Frei?"
    ],
    "rows": [
      [
        "Montag",
        "Arbeit",
        "8–16 Uhr",
        "danach"
      ],
      [
        "Dienstag",
        "Deutschkurs",
        "18 Uhr",
        "vorher"
      ],
      [
        "Freitag",
        "keine Termine",
        "ab 16 Uhr",
        "ja"
      ]
    ],
    "tasks": [
      {
        "label": "Zeit zuerst",
        "prompt": "Was machst du am Montag? Beginne mit Am Montag.",
        "hint": "Zeit zuerst · Verb Position 2",
        "answer": "Am Montag arbeite ich von acht bis 16 Uhr.",
        "criterion": "Präsens mit Zeitangabe zuerst"
      },
      {
        "label": "Pflicht nennen",
        "prompt": "Was musst du am Dienstag um 18 Uhr machen?",
        "hint": "müssen + Infinitiv",
        "answer": "Am Dienstag muss ich um 18 Uhr zum Deutschkurs gehen.",
        "criterion": "Modalverb und Infinitiv"
      },
      {
        "label": "Möglichkeit nennen",
        "prompt": "Wann kannst du Freunde treffen?",
        "hint": "können + Infinitiv",
        "answer": "Am Freitag kann ich nach 16 Uhr Freunde treffen.",
        "criterion": "kann + Infinitiv am Ende"
      }
    ]
  },
  "A2-9.23": {
    "day": 23,
    "title": "Arbeitsweg-Labor",
    "context": "Drei Menschen beschreiben ihren Schul- und Arbeitsweg.",
    "columns": [
      "Person",
      "Verkehrsmittel",
      "Ziel",
      "Dauer"
    ],
    "rows": [
      [
        "Nina",
        "Bus",
        "Schule",
        "25 Min."
      ],
      [
        "Ben",
        "Zug",
        "Arbeit",
        "40 Min."
      ],
      [
        "Eva",
        "Fahrrad",
        "Universität",
        "15 Min."
      ]
    ],
    "tasks": [
      {
        "label": "Weg beschreiben",
        "prompt": "Wie kommt Nina zur Schule?",
        "hint": "mit + Dativ · zur",
        "answer": "Nina fährt mit dem Bus zur Schule.",
        "criterion": "mit dem Bus und zur Schule"
      },
      {
        "label": "Dauer nennen",
        "prompt": "Wie lange braucht Ben zur Arbeit?",
        "hint": "dauert · 40 Minuten",
        "answer": "Bens Weg zur Arbeit dauert 40 Minuten.",
        "criterion": "Dauer in einem vollständigen Satz"
      },
      {
        "label": "Transport und Ziel",
        "prompt": "Beschreibe Evas Weg.",
        "hint": "mit dem · zur",
        "answer": "Eva fährt mit dem Fahrrad zur Universität.",
        "criterion": "Dativ nach mit und zu"
      }
    ]
  },
  "A2-9.24": {
    "day": 24,
    "title": "Urlaubs-Planlabor",
    "context": "Ihr plant eine Reise und müsst Gründe, Ziele und schlechtes Wetter berücksichtigen.",
    "columns": [
      "Reiseziel",
      "Transport",
      "Ziel der Reise",
      "Bei Regen"
    ],
    "rows": [
      [
        "Hamburg",
        "Zug",
        "den Hafen besuchen",
        "Museum"
      ],
      [
        "Berlin",
        "Bus",
        "Freunde treffen",
        "Kino"
      ],
      [
        "München",
        "Zug",
        "die Stadt entdecken",
        "Galerie"
      ]
    ],
    "tasks": [
      {
        "label": "Zweck nennen",
        "prompt": "Warum fährst du nach Hamburg? Verwende um … zu.",
        "hint": "um … zu",
        "answer": "Ich fahre nach Hamburg, um den Hafen zu besuchen.",
        "criterion": "Zweck mit um ... zu"
      },
      {
        "label": "Bedingung nennen",
        "prompt": "Was macht ihr in Hamburg bei Regen?",
        "hint": "falls · Verb am Ende",
        "answer": "Falls es in Hamburg regnet, besuchen wir ein Museum.",
        "criterion": "falls-Satz mit passender Folge"
      },
      {
        "label": "Grund nennen",
        "prompt": "Warum fährst du nach Berlin?",
        "hint": "weil · Verb am Ende",
        "answer": "Ich fahre nach Berlin, weil ich Freunde treffen möchte.",
        "criterion": "weil-Satz für den Grund"
      }
    ]
  },
  "A2-9.25": {
    "day": 25,
    "title": "Tagesablauf-Labor",
    "context": "Ordne Milas Tagesablauf. Erzähle mit Zeitangaben und trennbaren Verben.",
    "columns": [
      "Zeit",
      "Aktivität",
      "Hinweis"
    ],
    "rows": [
      [
        "7 Uhr",
        "aufstehen",
        "zu Hause"
      ],
      [
        "7:30 Uhr",
        "sich anziehen",
        "vor der Arbeit"
      ],
      [
        "8 Uhr",
        "mit der Arbeit anfangen",
        "im Büro"
      ]
    ],
    "tasks": [
      {
        "label": "Den Tag beginnen",
        "prompt": "Was macht Mila um sieben Uhr? Beginne mit Um sieben Uhr.",
        "hint": "aufstehen · steht … auf",
        "answer": "Um sieben Uhr steht Mila auf.",
        "criterion": "Verb an Position 2 und Vorsilbe am Ende"
      },
      {
        "label": "Reflexive Routine",
        "prompt": "Was macht Mila danach?",
        "hint": "sich anziehen · zieht sich … an",
        "answer": "Danach zieht Mila sich an.",
        "criterion": "passendes Reflexivpronomen und trennbares Verb"
      },
      {
        "label": "Arbeit beginnen",
        "prompt": "Was macht Mila um acht Uhr?",
        "hint": "anfangen · fängt … an",
        "answer": "Um acht Uhr fängt Mila im Büro mit der Arbeit an.",
        "criterion": "Zeit zuerst und trennbares Verb"
      }
    ]
  },
  "A2-10.26": {
    "day": 26,
    "title": "Gefühls-Labor",
    "context": "Wie reagieren Menschen auf verschiedene Situationen? Beschreibe Gefühl und Grund.",
    "columns": [
      "Situation",
      "Gefühl",
      "Reaktion"
    ],
    "rows": [
      [
        "Prüfung morgen",
        "nervös",
        "mehr lernen"
      ],
      [
        "gute Nachricht",
        "glücklich",
        "Freunde anrufen"
      ],
      [
        "viel Stress bei der Arbeit",
        "gestresst",
        "Musik hören"
      ]
    ],
    "tasks": [
      {
        "label": "Gefühl begründen",
        "prompt": "Warum bist du vor der Prüfung nervös?",
        "hint": "sich fühlen · weil",
        "answer": "Ich fühle mich nervös, weil ich morgen eine Prüfung habe.",
        "criterion": "Reflexivpronomen und weil-Satz"
      },
      {
        "label": "Situation mit wenn",
        "prompt": "Wie fühlst du dich bei einer guten Nachricht?",
        "hint": "wenn · Verb am Ende",
        "answer": "Wenn ich eine gute Nachricht bekomme, fühle ich mich glücklich.",
        "criterion": "wenn-Satz zuerst, Hauptsatzverb direkt danach"
      },
      {
        "label": "Reaktion beschreiben",
        "prompt": "Was machst du bei Stress auf der Arbeit?",
        "hint": "wenn · dann",
        "answer": "Wenn ich bei der Arbeit gestresst bin, höre ich Musik.",
        "criterion": "Situation und Reaktion korrekt verbinden"
      }
    ]
  },
  "A2-10.27": {
    "day": 27,
    "title": "Digital-Labor",
    "context": "Vergleiche digitale Kommunikationswege und formuliere Meinungen mit dass.",
    "columns": [
      "Medium",
      "Stärke",
      "Typische Nutzung"
    ],
    "rows": [
      [
        "WhatsApp",
        "schnell und praktisch",
        "kurze Nachrichten"
      ],
      [
        "E-Mail",
        "gut für formelle Nachrichten",
        "Arbeit"
      ],
      [
        "Videoanruf",
        "persönlicher",
        "Familie und Freunde"
      ]
    ],
    "tasks": [
      {
        "label": "Meinung äußern",
        "prompt": "Was findest du an WhatsApp praktisch?",
        "hint": "Ich finde, dass …",
        "answer": "Ich finde, dass WhatsApp für kurze Nachrichten praktisch ist.",
        "criterion": "dass + Verb am Satzende"
      },
      {
        "label": "Über E-Mail sprechen",
        "prompt": "Was denkst du über E-Mails bei der Arbeit?",
        "hint": "Ich denke, dass …",
        "answer": "Ich denke, dass E-Mails für formelle Nachrichten gut sind.",
        "criterion": "Nebensatz mit dass"
      },
      {
        "label": "Medium bewerten",
        "prompt": "Warum sind Videoanrufe für Familie und Freunde gut?",
        "hint": "Ich glaube, dass …",
        "answer": "Ich glaube, dass Videoanrufe persönlicher sind.",
        "criterion": "dass-Satz mit passendem Adjektiv"
      }
    ]
  },
  "A2-10.28": {
    "day": 28,
    "title": "Zukunfts-Labor",
    "context": "Drei Lernende planen das nächste Jahr. Verwende Futur I und klare Zeitangaben.",
    "columns": [
      "Person",
      "Plan",
      "Wann?",
      "Vorbereitung"
    ],
    "rows": [
      [
        "Nina",
        "Deutschprüfung machen",
        "nächstes Jahr",
        "fleißig lernen"
      ],
      [
        "Ben",
        "Ausbildung beginnen",
        "im Herbst",
        "Bewerbung schreiben"
      ],
      [
        "Lea",
        "nach Berlin reisen",
        "im Sommer",
        "Geld sparen"
      ]
    ],
    "tasks": [
      {
        "label": "Plan mit Futur I",
        "prompt": "Was wird Nina nächstes Jahr machen?",
        "hint": "werden + Infinitiv",
        "answer": "Nina wird nächstes Jahr die Deutschprüfung machen.",
        "criterion": "wird + Infinitiv am Ende"
      },
      {
        "label": "Berufliche Zukunft",
        "prompt": "Was wird Ben im Herbst machen?",
        "hint": "wird … beginnen",
        "answer": "Ben wird im Herbst eine Ausbildung beginnen.",
        "criterion": "richtiges Futur I"
      },
      {
        "label": "Ziel und Vorbereitung",
        "prompt": "Wie wird sich Lea auf ihre Reise vorbereiten?",
        "hint": "wird … sparen · um … zu",
        "answer": "Lea wird Geld sparen, um im Sommer nach Berlin zu reisen.",
        "criterion": "werden + Infinitiv und passender Zweck"
      }
    ]
  }
};

export const A2_APPLICATION_LABS = Object.freeze(Object.fromEntries(
  Object.entries(LABS).map(([assignmentId, lab]) => [assignmentId, Object.freeze({
    ...lab,
    assignmentId,
    columns: Object.freeze([...lab.columns]),
    rows: Object.freeze(lab.rows.map(row => Object.freeze([...row]))),
    tasks: Object.freeze(lab.tasks.map((task, index) => Object.freeze({
      ...task, id: ['recognise-rule','fix-error','build-sentence'][index],
    }))),
  })])
));

export function getA2ApplicationLab(assignmentId = '') {
  return A2_APPLICATION_LABS[String(assignmentId).trim().toUpperCase()] || null;
}
