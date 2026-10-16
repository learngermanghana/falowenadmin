// Short, fully authored A1 speaking activities. Each normal teaching block has
// five useful words, one controlled mini-mission and one spoken response task.
// A1-5.9 is intentionally excluded: it has its own Goethe exam-readiness flow.
// These activities are classroom practice, never a scored workbook submission.
export const A1_EVERYDAY_SPEAKING = Object.freeze({
  "A1-0.1": {
    "words": [
      "Guten Morgen",
      "Guten Tag",
      "Guten Abend",
      "Wie geht es Ihnen?",
      "Auf Wiedersehen"
    ],
    "mission": {
      "title": "Begrüße deine Lehrerin",
      "situation": "Du triffst deine Lehrerin morgens vor dem Kurs.",
      "prompt": "Es ist 8 Uhr. Begrüße sie und frage höflich, wie es ihr geht.",
      "model": "Guten Morgen! Wie geht es Ihnen?",
      "hint": "Du sprichst mit einer Lehrerin: benutze Ihnen.",
      "secondRound": "Verabschiede dich höflich: Auf Wiedersehen!"
    },
    "reaction": {
      "title": "Eine Antwort am Morgen",
      "situation": "Deine Lehrerin kommt in den Raum.",
      "prompt": "Die Lehrkraft sagt: „Guten Morgen! Wie geht es Ihnen?“ Antworte.",
      "model": "Mir geht es gut, danke. Und Ihnen?",
      "note": "Akzeptiere auch „Gut, danke“; prüfe die höfliche Anrede.",
      "second": {
        "situation": "Ein Lehrer kommt am Abend.",
        "prompt": "Die Lehrkraft sagt: „Guten Abend!“ Antworte höflich.",
        "model": "Guten Abend!",
        "note": "Auch „Guten Abend! Wie geht es Ihnen?“ ist möglich."
      }
    }
  },
  "A1-0.2": {
    "words": [
      "der Name",
      "die Stadt",
      "Berlin",
      "Wasser",
      "die Schule"
    ],
    "mission": {
      "title": "Buchstabiere die Stadt",
      "situation": "Dein Partner notiert einen deutschen Städtenamen.",
      "prompt": "Buchstabiere „Berlin“ laut, Buchstabe für Buchstabe.",
      "model": "B – E – R – L – I – N.",
      "hint": "Sprich die deutschen Buchstabennamen, nicht die englischen.",
      "secondRound": "Jetzt buchstabiere „Wasser“."
    },
    "reaction": {
      "title": "Hör die Buchstaben",
      "situation": "Dein Partner kann das Wort nicht lesen.",
      "prompt": "Die Lehrkraft sagt: „Wie buchstabiert man Schule?“ Buchstabiere es.",
      "model": "S – C – H – U – L – E.",
      "note": "Es geht um Buchstabennamen, nicht um das Vorlesen des ganzen Wortes.",
      "second": {
        "situation": "Du buchstabierst ein Wort für deinen Partner.",
        "prompt": "Die Lehrkraft fragt: „Wie buchstabiert man Wasser?“",
        "model": "W – A – S – S – E – R.",
        "note": "Alle Buchstaben einzeln auf Deutsch sprechen."
      }
    }
  },
  "A1-1.1": {
    "words": [
      "ich",
      "du",
      "wir",
      "lernen",
      "wohnen"
    ],
    "mission": {
      "title": "Wer lernt Deutsch?",
      "situation": "Die Lehrkraft zeigt zwei Pronomen und ein Verb.",
      "prompt": "Sage einen ganzen Satz: „wir + lernen + Deutsch“.",
      "model": "Wir lernen Deutsch.",
      "hint": "Bei wir endet ein regelmäßiges Verb auf -en.",
      "secondRound": "Zweite Runde: „du + wohnen + in Accra“ → Du wohnst in Accra."
    },
    "reaction": {
      "title": "Du und ich",
      "situation": "Du sprichst mit einem anderen Lernenden.",
      "prompt": "Die Lehrkraft fragt: „Lernst du Deutsch?“ Antworte mit einem ganzen Satz.",
      "model": "Ja, ich lerne Deutsch.",
      "note": "Für „ich“: lerne, nicht lernen.",
      "second": {
        "situation": "Ein Mitschüler fragt nach deinem Wohnort.",
        "prompt": "Die Lehrkraft fragt: „Wohnst du in Accra?“ Antworte.",
        "model": "Ja, ich wohne in Accra.",
        "note": "ich wohne, nicht ich wohnen."
      }
    }
  },
  "A1-1.1-PRACTICE": {
    "words": [
      "der Tisch",
      "die Frau",
      "das Buch",
      "wie",
      "wo"
    ],
    "mission": {
      "title": "Ein Wort, ein Satz",
      "situation": "Ihr zeigt auf Gegenstände im Klassenzimmer.",
      "prompt": "Sage mit den Wörtern „das Buch“ und „groß“ einen korrekten Satz.",
      "model": "Das Buch ist groß.",
      "hint": "Das Buch ist das Subjekt; nach ist steht groß ohne Endung.",
      "secondRound": "Jetzt frage deinen Partner: „Wo ist das Buch?“"
    },
    "reaction": {
      "title": "Eine passende W-Frage",
      "situation": "Dein Partner nennt eine Antwort.",
      "prompt": "Die Lehrkraft sagt: „Ich wohne in Accra.“ Stelle die passende Frage.",
      "model": "Wo wohnst du?",
      "note": "Wo fragt nach dem Ort; die Frage beginnt mit Wo + wohnst.",
      "second": {
        "situation": "Du triffst eine neue Person.",
        "prompt": "Die Lehrkraft fragt: „Wie heißt du?“ Antworte.",
        "model": "Ich heiße Ama.",
        "note": "Ein eigener Name ist richtig; Wie fragt nach dem Namen."
      }
    }
  },
  "A1-1.2": {
    "words": [
      "ich",
      "er",
      "ihr",
      "spielen",
      "arbeiten"
    ],
    "mission": {
      "title": "Die richtige Verbform",
      "situation": "Du beschreibst einen Freund.",
      "prompt": "Sage den Satz richtig: „er + arbeiten + im Büro“.",
      "model": "Er arbeitet im Büro.",
      "hint": "arbeiten braucht bei er ein -et: arbeitet.",
      "secondRound": "Zweite Runde: „ihr + spielen + Fußball“ → Ihr spielt Fußball."
    },
    "reaction": {
      "title": "Wer spielt?",
      "situation": "Dein Partner fragt nach mehreren Personen.",
      "prompt": "Die Lehrkraft fragt: „Spielt ihr Fußball?“ Antworte mit „wir“.",
      "model": "Ja, wir spielen Fußball.",
      "note": "Bei wir steht die Endung -en.",
      "second": {
        "situation": "Du sprichst über einen Kollegen.",
        "prompt": "Die Lehrkraft fragt: „Arbeitet er im Büro?“ Antworte.",
        "model": "Ja, er arbeitet im Büro.",
        "note": "Bei arbeiten mit er ist -et erforderlich."
      }
    }
  },
  "A1-2": {
    "words": [
      "zehn",
      "zwanzig",
      "dreißig",
      "vierzig",
      "fünfzig"
    ],
    "mission": {
      "title": "Eine Telefonnummer",
      "situation": "Du gibst deiner Partnerin eine kurze Zahl durch.",
      "prompt": "Sage die Ziffern 20 – 30 – 40 deutlich auf Deutsch.",
      "model": "zwanzig – dreißig – vierzig.",
      "hint": "Zahlen einzeln und langsam sagen; keine englische Aussprache.",
      "secondRound": "Zweite Runde: 15 – 50 → fünfzehn – fünfzig."
    },
    "reaction": {
      "title": "Wie viel?",
      "situation": "Du hörst eine Zahl im Geschäft.",
      "prompt": "Die Lehrkraft fragt: „Wie sagt man 21 auf Deutsch?“ Antworte laut.",
      "model": "einundzwanzig.",
      "note": "Erst ein, dann undzwanzig; nicht zwanzigeins.",
      "second": {
        "situation": "Du hörst eine weitere Zahl.",
        "prompt": "Die Lehrkraft fragt: „Wie sagt man 50 auf Deutsch?“",
        "model": "fünfzig.",
        "note": "Achte auf fünfzig, nicht fünzig."
      }
    }
  },
  "A1-1.3": {
    "words": [
      "heißen",
      "kommen",
      "wohnen",
      "das Land",
      "die Stadt"
    ],
    "mission": {
      "title": "Ich stelle mich vor",
      "situation": "Du lernst eine neue Person im Deutschkurs kennen.",
      "prompt": "Sage deinen Namen, dein Land und deine Stadt in drei kurzen Sätzen.",
      "model": "Ich heiße Ama. Ich komme aus Ghana. Ich wohne in Accra.",
      "hint": "Beachte: Ich heiße / ich komme / ich wohne.",
      "secondRound": "Frage danach: „Woher kommst du?“"
    },
    "reaction": {
      "title": "Neue Bekanntschaft",
      "situation": "Dein Partner beginnt ein Gespräch.",
      "prompt": "Die Lehrkraft fragt: „Woher kommst du?“ Antworte in einem Satz.",
      "model": "Ich komme aus Ghana.",
      "note": "Eine andere wahre Herkunftsangabe ist ebenfalls richtig.",
      "second": {
        "situation": "Du stellst dich einem Partner vor.",
        "prompt": "Die Lehrkraft fragt: „Wo wohnst du?“ Antworte.",
        "model": "Ich wohne in Accra.",
        "note": "Der eigene Wohnort ist richtig; wohne passt zu ich."
      }
    }
  },
  "A1-2.3": {
    "words": [
      "die Mutter",
      "der Vater",
      "der Bruder",
      "die Schwester",
      "gern"
    ],
    "mission": {
      "title": "Das ist meine Familie",
      "situation": "Du zeigst einem Freund ein Familienfoto.",
      "prompt": "Sage zwei Sätze über deine Familie mit „Mutter“ und „Bruder“.",
      "model": "Das ist meine Mutter. Ich habe einen Bruder.",
      "hint": "Achte auf meine Mutter und einen Bruder.",
      "secondRound": "Frage danach: „Hast du Geschwister?“"
    },
    "reaction": {
      "title": "Ein kurzer Familien-Dialog",
      "situation": "Ein Freund stellt dir eine Frage.",
      "prompt": "Die Lehrkraft fragt: „Hast du einen Bruder?“ Antworte in einem ganzen Satz.",
      "model": "Ja, ich habe einen Bruder.",
      "note": "„Nein, ich habe keinen Bruder“ ist ebenfalls richtig, wenn es zur Person passt.",
      "second": {
        "situation": "Du lernst eine neue Person kennen.",
        "prompt": "Die Lehrkraft fragt: „Welche Sprachen sprichst du?“",
        "model": "Ich spreche Englisch und ein bisschen Deutsch.",
        "note": "Eine eigene wahre Sprachantwort zählt."
      }
    }
  },
  "A1-3": {
    "words": [
      "kosten",
      "der Euro",
      "das Buch",
      "der Apfel",
      "teuer"
    ],
    "mission": {
      "title": "Im kleinen Laden",
      "situation": "Du verkaufst ein Buch für acht Euro.",
      "prompt": "Dein Partner fragt: „Wie viel kostet das Buch?“ Antworte.",
      "model": "Das Buch kostet acht Euro.",
      "hint": "Singular das Buch → kostet.",
      "secondRound": "Zweite Runde: „Zwei Äpfel kosten drei Euro.“"
    },
    "reaction": {
      "title": "Du hörst einen Preis",
      "situation": "Ein Kunde fragt dich nach einem Produkt.",
      "prompt": "Die Lehrkraft sagt: „Die Äpfel kosten vier Euro.“ Sage den Preis der Äpfel.",
      "model": "Die Äpfel kosten vier Euro.",
      "note": "Bei Äpfel steht kosten, nicht kostet.",
      "second": {
        "situation": "Ein Kunde fragt nach dem Buch.",
        "prompt": "Die Lehrkraft fragt: „Wie viel kostet das Buch?“ Antworte: acht Euro.",
        "model": "Das Buch kostet acht Euro.",
        "note": "Singular Buch nimmt kostet."
      }
    }
  },
  "A1-4": {
    "words": [
      "Ghana",
      "Deutschland",
      "Deutsch",
      "Englisch",
      "kommen"
    ],
    "mission": {
      "title": "Im Sprachkurs",
      "situation": "Du stellst dich einem neuen Mitschüler vor.",
      "prompt": "Sage, aus welchem Land du kommst und welche Sprache du sprichst.",
      "model": "Ich komme aus Ghana. Ich spreche Englisch.",
      "hint": "aus + Land; ich spreche + Sprache.",
      "secondRound": "Frage danach: „Welche Sprache sprichst du?“"
    },
    "reaction": {
      "title": "Ein neuer Mitschüler",
      "situation": "Du lernst jemanden im Unterricht kennen.",
      "prompt": "Die Lehrkraft fragt: „Sprichst du Deutsch?“ Antworte.",
      "model": "Ja, ich spreche ein bisschen Deutsch.",
      "note": "Auch „Nein, ich spreche noch kein Deutsch“ passt.",
      "second": {
        "situation": "Eine Mitschülerin fragt nach deiner Heimat.",
        "prompt": "Die Lehrkraft fragt: „Woher kommst du?“",
        "model": "Ich komme aus Ghana.",
        "note": "Ein anderes richtiges Herkunftsland ist möglich."
      }
    }
  },
  "A1-5": {
    "words": [
      "der Hund",
      "der Apfel",
      "das Buch",
      "sehen",
      "kaufen"
    ],
    "mission": {
      "title": "Was kaufst du?",
      "situation": "Du bist in einem kleinen Geschäft.",
      "prompt": "Dein Partner fragt: „Was kaufst du?“ Antworte mit „ein Apfel“.",
      "model": "Ich kaufe einen Apfel.",
      "hint": "Maskulin Akkusativ: ein → einen.",
      "secondRound": "Zweite Runde: „Was siehst du?“ → Ich sehe den Hund."
    },
    "reaction": {
      "title": "Ein Hund im Park",
      "situation": "Du schaust aus dem Fenster.",
      "prompt": "Die Lehrkraft fragt: „Siehst du den Hund?“ Antworte mit dem ganzen Satz.",
      "model": "Ja, ich sehe den Hund.",
      "note": "Bei sehen: der Hund → den Hund.",
      "second": {
        "situation": "Du kaufst Obst am Markt.",
        "prompt": "Die Lehrkraft fragt: „Was kaufst du?“ Antworte mit Apfel.",
        "model": "Ich kaufe einen Apfel.",
        "note": "Maskuliner Akkusativ einen Apfel."
      }
    }
  },
  "A1-6": {
    "words": [
      "mein",
      "meine",
      "der Tisch",
      "die Lampe",
      "rot"
    ],
    "mission": {
      "title": "Mein Zimmer",
      "situation": "Du zeigst deinem Partner zwei Gegenstände.",
      "prompt": "Beschreibe eine Lampe, die dir gehört, und sage ihre Farbe.",
      "model": "Das ist meine Lampe. Sie ist rot.",
      "hint": "die Lampe → meine Lampe.",
      "secondRound": "Zweite Runde: der Tisch → mein Tisch."
    },
    "reaction": {
      "title": "Wem gehört der Tisch?",
      "situation": "Ein Freund fragt nach einem Möbelstück.",
      "prompt": "Die Lehrkraft fragt: „Ist das dein Tisch?“ Antworte mit „mein“.",
      "model": "Ja, das ist mein Tisch.",
      "note": "der Tisch → mein Tisch; nicht meine Tisch.",
      "second": {
        "situation": "Du zeigst dein Zimmer.",
        "prompt": "Die Lehrkraft fragt: „Welche Farbe hat deine Lampe?“ Antworte.",
        "model": "Meine Lampe ist rot.",
        "note": "Nach sein steht die Farbe ohne zusätzliche Adjektivendung."
      }
    }
  },
  "A1-7": {
    "words": [
      "die Uhr",
      "halb",
      "Viertel",
      "vor",
      "nach"
    ],
    "mission": {
      "title": "Wann beginnt der Kurs?",
      "situation": "Dein Deutschkurs beginnt um 7:30 Uhr.",
      "prompt": "Sage die Uhrzeit auf Deutsch mit „halb“.",
      "model": "Der Kurs beginnt um halb acht.",
      "hint": "halb acht bedeutet 7:30, nicht 8:30.",
      "secondRound": "Zweite Runde: 7:15 → Viertel nach sieben."
    },
    "reaction": {
      "title": "Ein Blick auf die Uhr",
      "situation": "Dein Partner hat keine Uhr.",
      "prompt": "Die Lehrkraft fragt: „Wie spät ist es? Es ist 8:30 Uhr.“ Antworte mit „halb“.",
      "model": "Es ist halb neun.",
      "note": "Bei halb nennt man die nächste Stunde.",
      "second": {
        "situation": "Ein Freund hat die Uhrzeit nicht verstanden.",
        "prompt": "Die Lehrkraft sagt: „Es ist 7:15 Uhr.“ Sage die Uhrzeit mit Viertel.",
        "model": "Es ist Viertel nach sieben.",
        "note": "Viertel nach sieben entspricht 7:15."
      }
    }
  },
  "A1-8": {
    "words": [
      "Montag",
      "Dienstag",
      "Oktober",
      "Uhr",
      "am"
    ],
    "mission": {
      "title": "Ein Termin",
      "situation": "Dein Termin ist am Dienstag um 18:30 Uhr.",
      "prompt": "Sage Wochentag und Uhrzeit in einem vollständigen Satz.",
      "model": "Mein Termin ist am Dienstag um achtzehn Uhr dreißig.",
      "hint": "am Dienstag, um achtzehn Uhr dreißig.",
      "secondRound": "Zweite Runde: am Montag um 14 Uhr."
    },
    "reaction": {
      "title": "Der Termin am Telefon",
      "situation": "Jemand nennt dir eine Uhrzeit.",
      "prompt": "Die Lehrkraft sagt: „Der Kurs beginnt um 16:00 Uhr.“ Wiederhole den Termin.",
      "model": "Der Kurs beginnt um sechzehn Uhr.",
      "note": "Beim 24-Stunden-System: sechzehn Uhr, nicht sechs Uhr.",
      "second": {
        "situation": "Du hörst eine neue Kurszeit.",
        "prompt": "Die Lehrkraft sagt: „Der Unterricht beginnt um 18:00 Uhr.“ Wiederhole die Zeit.",
        "model": "Der Unterricht beginnt um achtzehn Uhr.",
        "note": "Eine offizielle 24-Stunden-Angabe."
      }
    }
  },
  "A1-3.5": {
    "words": [
      "halb",
      "die Uhr",
      "kosten",
      "der Euro",
      "zwanzig"
    ],
    "mission": {
      "title": "Zeit und Preis",
      "situation": "Ein Film beginnt um 7:30 Uhr; das Ticket kostet 20 Euro.",
      "prompt": "Sage die Anfangszeit und den Preis in zwei Sätzen.",
      "model": "Der Film beginnt um halb acht. Das Ticket kostet zwanzig Euro.",
      "hint": "halb acht = 7:30; das Ticket kostet (Singular).",
      "secondRound": "Frage deinen Partner: „Wie viel kostet das Ticket?“"
    },
    "reaction": {
      "title": "Die schnelle Rückfrage",
      "situation": "Du hast den Preis nicht verstanden.",
      "prompt": "Die Lehrkraft sagt: „Das Ticket kostet zwölf Euro.“ Frage höflich nach dem Preis.",
      "model": "Wie viel kostet das Ticket?",
      "note": "Als kurze Rückfrage passt auch: „Zwölf Euro?“",
      "second": {
        "situation": "Du stehst vor dem Kino.",
        "prompt": "Die Lehrkraft fragt: „Wie spät ist es? 8:30 Uhr.“ Antworte mit halb.",
        "model": "Es ist halb neun.",
        "note": "halb neun bedeutet 8:30."
      }
    }
  },
  "A1-3.6": {
    "words": [
      "können",
      "müssen",
      "dürfen",
      "möchten",
      "lernen"
    ],
    "mission": {
      "title": "Was kannst du heute?",
      "situation": "Dein Partner fragt, was du nach der Schule machst.",
      "prompt": "Sage mit „müssen“ und „lernen“, was du heute tun musst.",
      "model": "Ich muss heute Deutsch lernen.",
      "hint": "Modalverb muss an Position 2, lernen ans Satzende.",
      "secondRound": "Zweite Runde: „Ich möchte Wasser trinken.“"
    },
    "reaction": {
      "title": "Heute Abend",
      "situation": "Du hast noch Hausaufgaben.",
      "prompt": "Die Lehrkraft fragt: „Kannst du heute ins Kino gehen?“ Antworte mit „müssen“.",
      "model": "Nein, ich muss Deutsch lernen.",
      "note": "Das Vollverb lernen steht am Ende.",
      "second": {
        "situation": "Deine Freundin fragt nach deinen Hausaufgaben.",
        "prompt": "Die Lehrkraft fragt: „Musst du heute Deutsch lernen?“ Antworte.",
        "model": "Ja, ich muss heute Deutsch lernen.",
        "note": "Das Vollverb lernen steht am Ende."
      }
    }
  },
  "A1-4.7": {
    "words": [
      "der Name",
      "das Alter",
      "der Wohnort",
      "das Hobby",
      "buchstabieren"
    ],
    "mission": {
      "title": "Prüfungsteil 1 · Kurz vorstellen",
      "situation": "Du übst nur eine kurze Vorstellung, noch keine ganze Prüfung.",
      "prompt": "Sage deinen Namen, dein Alter und deinen Wohnort in drei Sätzen.",
      "model": "Ich heiße Ama. Ich bin 22 Jahre alt. Ich wohne in Accra.",
      "hint": "Eine andere eigene Angabe ist genauso richtig.",
      "secondRound": "Buchstabiere danach deinen Vornamen."
    },
    "reaction": {
      "title": "Die Prüferfrage",
      "situation": "Deine Lehrkraft spielt kurz den Prüfer.",
      "prompt": "Die Lehrkraft fragt: „Wie heißen Sie?“ Antworte mit einem ganzen Satz.",
      "model": "Ich heiße Ama.",
      "note": "Nutze die höfliche Prüfungsfrage mit Sie; eigener Name ist richtig.",
      "second": {
        "situation": "Eine kurze Frage in der Prüfung.",
        "prompt": "Die Lehrkraft fragt höflich: „Wo wohnen Sie?“ Antworte.",
        "model": "Ich wohne in Accra.",
        "note": "Eigener Ort erlaubt; antworten mit ich wohne."
      }
    }
  },
  "A1-9": {
    "words": [
      "der Kaffee",
      "die Milch",
      "die Suppe",
      "trinken",
      "warm"
    ],
    "mission": {
      "title": "Nein, danke!",
      "situation": "Du bist im Café und möchtest keinen Kaffee.",
      "prompt": "Dein Partner fragt: „Trinkst du Kaffee?“ Antworte höflich.",
      "model": "Nein, danke. Ich trinke keinen Kaffee.",
      "hint": "der Kaffee → keinen Kaffee.",
      "secondRound": "Zweite Runde: Die Suppe ist nicht warm."
    },
    "reaction": {
      "title": "Eine Frage im Café",
      "situation": "Du bestellst ein Getränk.",
      "prompt": "Die Lehrkraft fragt: „Möchtest du einen Kaffee?“ Du möchtest keinen Kaffee. Antworte.",
      "model": "Nein, danke. Ich möchte keinen Kaffee.",
      "note": "keinen gehört zum maskulinen Akkusativ Kaffee.",
      "second": {
        "situation": "Dein Freund fragt nach Milch.",
        "prompt": "Die Lehrkraft fragt: „Hast du Milch?“ Du hast keine. Antworte.",
        "model": "Nein, ich habe keine Milch.",
        "note": "Milch ist feminin: keine Milch."
      }
    }
  },
  "A1-10": {
    "words": [
      "morgens",
      "abends",
      "frühstücken",
      "essen",
      "aufstehen"
    ],
    "mission": {
      "title": "Mein Morgen",
      "situation": "Du erzählst deinem Partner von deinem Morgen.",
      "prompt": "Sage mit „morgens“, was du isst.",
      "model": "Morgens esse ich Brot.",
      "hint": "Nach Morgens steht das Verb auf Position 2: esse ich.",
      "secondRound": "Zweite Runde: Um sieben Uhr stehe ich auf."
    },
    "reaction": {
      "title": "Nach dem Aufstehen",
      "situation": "Ein Freund fragt nach deinem Tagesablauf.",
      "prompt": "Die Lehrkraft fragt: „Wann frühstückst du?“ Antworte mit einer Uhrzeit.",
      "model": "Ich frühstücke um sieben Uhr.",
      "note": "Die eigene echte Uhrzeit ist auch richtig.",
      "second": {
        "situation": "Ihr unterhaltet euch über den Abend.",
        "prompt": "Die Lehrkraft fragt: „Was machst du abends?“ Antworte mit kochen.",
        "model": "Abends koche ich.",
        "note": "Verb koche auf Position 2 nach Abends."
      }
    }
  },
  "A1-11": {
    "words": [
      "geradeaus",
      "links",
      "rechts",
      "gehen",
      "der Bahnhof"
    ],
    "mission": {
      "title": "Wo ist der Bahnhof?",
      "situation": "Ein Besucher sucht den Bahnhof.",
      "prompt": "Gib zwei höfliche Weganweisungen: geradeaus und dann links.",
      "model": "Gehen Sie geradeaus. Biegen Sie dann links ab.",
      "hint": "Höflicher Imperativ: Gehen Sie / Biegen Sie.",
      "secondRound": "Zweite Runde: „Biegen Sie rechts ab.“"
    },
    "reaction": {
      "title": "Ein Tourist fragt",
      "situation": "Du stehst vor dem Bahnhof.",
      "prompt": "Die Lehrkraft fragt: „Entschuldigung, wie komme ich zum Bahnhof?“ Gib eine einfache Weganweisung.",
      "model": "Gehen Sie bitte geradeaus.",
      "note": "Eine andere klare Richtung ist richtig, wenn die Situation sie erlaubt.",
      "second": {
        "situation": "Ein Tourist braucht Hilfe.",
        "prompt": "Die Lehrkraft fragt: „Wie komme ich zur Post?“ Sage: rechts abbiegen.",
        "model": "Biegen Sie rechts ab.",
        "note": "Imperativ mit Sie: Biegen Sie."
      }
    }
  },
  "A1-12.1": {
    "words": [
      "das Buch",
      "der Tisch",
      "auf",
      "liegen",
      "legen"
    ],
    "mission": {
      "title": "Wo oder wohin?",
      "situation": "Ein Buch liegt auf einem Tisch.",
      "prompt": "Sage, wo das Buch liegt.",
      "model": "Das Buch liegt auf dem Tisch.",
      "hint": "Wo? → auf dem Tisch (Dativ).",
      "secondRound": "Zweite Runde: Ich lege das Buch auf den Tisch (Wohin?)."
    },
    "reaction": {
      "title": "Du bewegst das Buch",
      "situation": "Du legst ein Buch auf einen Tisch.",
      "prompt": "Die Lehrkraft fragt: „Wohin legst du das Buch?“ Antworte.",
      "model": "Ich lege das Buch auf den Tisch.",
      "note": "Wohin? → auf den Tisch (Akkusativ).",
      "second": {
        "situation": "Ein Buch befindet sich auf einem Tisch.",
        "prompt": "Die Lehrkraft fragt: „Wo liegt das Buch?“ Antworte.",
        "model": "Das Buch liegt auf dem Tisch.",
        "note": "Wo? bezeichnet den Ort; hier Dativ dem."
      }
    }
  },
  "A1-12.2": {
    "words": [
      "der Lehrer",
      "die Ärztin",
      "die Bank",
      "als",
      "bei"
    ],
    "mission": {
      "title": "Beruf und Arbeitgeber",
      "situation": "Du beschreibst eine Freundin, die Bankangestellte ist.",
      "prompt": "Sage, dass sie bei einer Bank arbeitet.",
      "model": "Sie arbeitet bei einer Bank.",
      "hint": "bei einer Bank nennt den Arbeitgeber.",
      "secondRound": "Zweite Runde: „Er arbeitet als Lehrer.“"
    },
    "reaction": {
      "title": "Was machst du beruflich?",
      "situation": "Du fragst deinen Partner nach seinem Beruf.",
      "prompt": "Die Lehrkraft fragt: „Was machst du beruflich?“ Antworte als Schüler oder Schülerin.",
      "model": "Ich bin Schüler. / Ich bin Schülerin.",
      "note": "Auch eine andere passende echte Berufsaussage ist richtig.",
      "second": {
        "situation": "Deine Freundin arbeitet bei einer Bank.",
        "prompt": "Die Lehrkraft fragt: „Wo arbeitet deine Freundin?“",
        "model": "Sie arbeitet bei einer Bank.",
        "note": "bei einer Bank nennt den Arbeitgeber."
      }
    }
  },
  "A1-12.3": {
    "words": [
      "Liebe Anna",
      "vielen Dank",
      "die Einladung",
      "der Termin",
      "Viele Grüße"
    ],
    "mission": {
      "title": "Eine Einladung beantworten",
      "situation": "Deine Freundin Anna lädt dich am Samstag ein.",
      "prompt": "Sage deiner Freundin mündlich, dass du kommen kannst, und bedanke dich.",
      "model": "Liebe Anna, vielen Dank für die Einladung. Ich komme gern.",
      "hint": "Freundin Anna → informelle Anrede; keine formelle Briefanrede.",
      "secondRound": "Zweite Runde: Sage den Abschluss „Viele Grüße!“"
    },
    "reaction": {
      "title": "Eine kurze Antwort",
      "situation": "Deine Freundin möchte eine Zusage.",
      "prompt": "Die Lehrkraft sagt: „Kommst du am Samstag zu meiner Feier?“ Antworte höflich.",
      "model": "Ja, gern! Vielen Dank für die Einladung.",
      "note": "Achte auf eine echte Antwort und eine passende Höflichkeitsformel.",
      "second": {
        "situation": "Ein Freund bedankt sich für deine Nachricht.",
        "prompt": "Die Lehrkraft sagt: „Danke für deine Nachricht!“ Reagiere freundlich.",
        "model": "Gern! Viele Grüße!",
        "note": "Im informellen Kontext ist Viele Grüße möglich."
      }
    }
  },
  "A1-13": {
    "words": [
      "die Sonne",
      "der Regen",
      "sonnig",
      "kalt",
      "regnen"
    ],
    "mission": {
      "title": "Wie ist das Wetter?",
      "situation": "Du möchtest ein Treffen draußen planen.",
      "prompt": "Sage, dass es heute regnet und kalt ist.",
      "model": "Heute regnet es. Es ist kalt.",
      "hint": "Es regnet, nicht „Es ist regnet“.",
      "secondRound": "Zweite Runde: Morgen ist es sonnig."
    },
    "reaction": {
      "title": "Das Wetter am Telefon",
      "situation": "Eine Freundin fragt nach dem Wetter.",
      "prompt": "Die Lehrkraft fragt: „Wie ist das Wetter bei dir?“ Antworte mit einem Wettersatz.",
      "model": "Es ist heute sonnig.",
      "note": "„Es regnet“ oder „Es ist kalt“ sind ebenso richtig, je nach Wetter.",
      "second": {
        "situation": "Du hörst die Wetterfrage.",
        "prompt": "Die Lehrkraft fragt: „Regnet es heute?“ Antworte mit Ja.",
        "model": "Ja, heute regnet es.",
        "note": "Es regnet, ohne zusätzliches ist."
      }
    }
  },
  "A1-14.1": {
    "words": [
      "der Kopf",
      "der Bauch",
      "der Arzt",
      "weh",
      "krank"
    ],
    "mission": {
      "title": "Beim Arzt",
      "situation": "Du hast Kopfschmerzen.",
      "prompt": "Sage dem Arzt, welcher Körperteil wehtut.",
      "model": "Mein Kopf tut weh.",
      "hint": "Singular Kopf → tut weh.",
      "secondRound": "Zweite Runde: „Ich bin krank.“"
    },
    "reaction": {
      "title": "Du bist in der Praxis",
      "situation": "Der Arzt stellt dir eine Frage.",
      "prompt": "Die Lehrkraft fragt: „Was tut Ihnen weh?“ Antworte mit „Bauch“.",
      "model": "Mein Bauch tut weh.",
      "note": "Ein Körperteil reicht, aber der ganze Satz ist das Übungsziel.",
      "second": {
        "situation": "Du bist beim Arzt.",
        "prompt": "Die Lehrkraft fragt: „Sind Sie krank?“ Antworte.",
        "model": "Ja, ich bin krank.",
        "note": "krank mit sein: ich bin krank."
      }
    }
  },
  "A1-14.2": {
    "words": [
      "helfen",
      "geben",
      "sehen",
      "der Mann",
      "das Buch"
    ],
    "mission": {
      "title": "Helfen oder sehen?",
      "situation": "Du sprichst über einen Mann im Klassenzimmer.",
      "prompt": "Sage, dass du dem Mann hilfst.",
      "model": "Ich helfe dem Mann.",
      "hint": "helfen + Dativ: dem Mann.",
      "secondRound": "Zweite Runde: „Ich sehe den Mann“ (Akkusativ)."
    },
    "reaction": {
      "title": "Bitte hilf mir",
      "situation": "Dein Freund braucht Unterstützung.",
      "prompt": "Die Lehrkraft fragt: „Hilfst du dem Mann?“ Antworte mit einem ganzen Satz.",
      "model": "Ja, ich helfe dem Mann.",
      "note": "Bei helfen bleibt der Mann im Dativ: dem Mann.",
      "second": {
        "situation": "Du stehst neben einem Mann.",
        "prompt": "Die Lehrkraft fragt: „Siehst du den Mann?“ Antworte.",
        "model": "Ja, ich sehe den Mann.",
        "note": "sehen + Akkusativ: den Mann."
      }
    }
  },
  "A1-5.10": {
    "words": [
      "weil",
      "krank",
      "lernen",
      "der Termin",
      "kommen"
    ],
    "mission": {
      "title": "Warum kannst du nicht?",
      "situation": "Du bist krank und kannst heute nicht zum Deutschkurs kommen.",
      "prompt": "Sage, dass du zu Hause bleibst, weil du krank bist.",
      "model": "Ich bleibe zu Hause, weil ich krank bin.",
      "hint": "Nach weil steht das konjugierte Verb am Ende: bin.",
      "secondRound": "Zweite Runde: „Ich komme nicht, weil ich lernen muss.“"
    },
    "reaction": {
      "title": "Ein Grund für die Absage",
      "situation": "Dein Freund lädt dich heute ein.",
      "prompt": "Die Lehrkraft fragt: „Warum kommst du heute nicht?“ Antworte mit „weil ich krank bin“.",
      "model": "Ich komme heute nicht, weil ich krank bin.",
      "note": "Der Grund folgt nach weil; bin steht am Satzende.",
      "second": {
        "situation": "Du erklärst eine Absage.",
        "prompt": "Die Lehrkraft fragt: „Warum bleibst du zu Hause?“ Antworte mit lernen.",
        "model": "Ich bleibe zu Hause, weil ich lernen muss.",
        "note": "Im weil-Satz steht das konjugierte Modalverb muss am Ende."
      }
    }
  }
});

export function getA1EverydaySpeaking(assignmentId = "") {
  const key = String(assignmentId || "").trim().toUpperCase();
  return A1_EVERYDAY_SPEAKING[key] || null;
}
