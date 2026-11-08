// Original A1 beginner classroom Lesen passages keyed to the ACTIVE curriculum IDs.
// Each uses short accessible sentences and text-evidence questions; mock exam
// submissions, workbook marking and legacy archived lessons are unchanged.
const A1_READING_LESSONS = Object.freeze({
  "A1-0.1": {
    "title": "Begrüßungen und Wohlbefinden",
    "sentences": [
      "Am Morgen sagt Mia zu Tom: Guten Morgen.",
      "Tom fragt Mia: Wie geht es dir?",
      "Mia antwortet: Mir geht es gut, danke.",
      "Am Nachmittag sagt Tom zu seiner Lehrerin: Guten Tag.",
      "Am Abend sagt Mia: Auf Wiedersehen."
    ],
    "checks": [
      [
        "Was sagt Mia am Morgen?",
        "Guten Morgen.",
        "Satz 1"
      ],
      [
        "Wie geht es Mia?",
        "Ihr geht es gut.",
        "Satz 3"
      ],
      [
        "Wen begrüßt Tom am Nachmittag?",
        "Seine Lehrerin.",
        "Satz 4"
      ]
    ]
  },
  "A1-0.2_1.1": {
    "title": "Alphabet und erste Verben",
    "sentences": [
      "Lina lernt heute das deutsche Alphabet.",
      "Sie schreibt ihren Namen in ihr Buch.",
      "Der Lehrer sagt die Buchstaben langsam.",
      "Lina buchstabiert ihren Namen und sagt: Ich heiße Lina.",
      "Ihr Freund Ben lernt auch Deutsch."
    ],
    "checks": [
      [
        "Was lernt Lina?",
        "Das deutsche Alphabet.",
        "Satz 1"
      ],
      [
        "Was schreibt Lina in ihr Buch?",
        "Ihren Namen.",
        "Satz 2"
      ],
      [
        "Wer lernt auch Deutsch?",
        "Ihr Freund Ben.",
        "Satz 5"
      ]
    ]
  },
  "A1-1.2": {
    "title": "Verben und W-Fragen",
    "sentences": [
      "Ali wohnt in Berlin und lernt Deutsch.",
      "Seine Freundin Anna wohnt in Köln.",
      "Ali fragt: Wo wohnst du?",
      "Anna sagt: Ich wohne in Köln.",
      "Am Abend lernen beide neue Verben."
    ],
    "checks": [
      [
        "Wo wohnt Ali?",
        "In Berlin.",
        "Satz 1"
      ],
      [
        "Wo wohnt Anna?",
        "In Köln.",
        "Satz 2"
      ],
      [
        "Was lernen beide am Abend?",
        "Neue Verben.",
        "Satz 5"
      ]
    ]
  },
  "A1-2": {
    "title": "Zahlen und Adresse",
    "sentences": [
      "Ben wohnt in der Gartenstraße 12.",
      "Seine Telefonnummer ist 030 555 16.",
      "Heute schreibt er seine Adresse auf ein Blatt.",
      "Seine Freundin Sara hat eine neue Nummer.",
      "Ben fragt Sara nach ihrer Telefonnummer."
    ],
    "checks": [
      [
        "In welcher Straße wohnt Ben?",
        "In der Gartenstraße.",
        "Satz 1"
      ],
      [
        "Welche Hausnummer hat Ben?",
        "12.",
        "Satz 1"
      ],
      [
        "Was fragt Ben Sara?",
        "Nach ihrer Telefonnummer.",
        "Satz 5"
      ]
    ]
  },
  "A1-1.3": {
    "title": "Sich vorstellen",
    "sentences": [
      "Hallo, ich heiße Lara und ich bin 20 Jahre alt.",
      "Ich komme aus Ghana und wohne in Hamburg.",
      "Ich lerne Deutsch in einem Kurs.",
      "Meine Lehrerin ist sehr freundlich.",
      "In meiner Freizeit höre ich gern Musik."
    ],
    "checks": [
      [
        "Wie alt ist Lara?",
        "20 Jahre.",
        "Satz 1"
      ],
      [
        "Woher kommt Lara?",
        "Aus Ghana.",
        "Satz 2"
      ],
      [
        "Was macht Lara in ihrer Freizeit?",
        "Sie hört gern Musik.",
        "Satz 5"
      ]
    ]
  },
  "A1-2.3": {
    "title": "Familie und Hobbys",
    "sentences": [
      "Das ist meine Familie.",
      "Meine Mutter heißt Eva und mein Vater heißt Paul.",
      "Mein Bruder spielt gern Fußball.",
      "Meine Schwester liest am Wochenende Bücher.",
      "Wir hören am Sonntag zusammen Musik."
    ],
    "checks": [
      [
        "Wie heißt die Mutter?",
        "Eva.",
        "Satz 2"
      ],
      [
        "Was macht der Bruder gern?",
        "Er spielt Fußball.",
        "Satz 3"
      ],
      [
        "Wann hört die Familie zusammen Musik?",
        "Am Sonntag.",
        "Satz 5"
      ]
    ]
  },
  "A1-3": {
    "title": "Preise und Vorlieben",
    "sentences": [
      "Mila geht heute in ein Geschäft.",
      "Ein rotes T-Shirt kostet zehn Euro.",
      "Eine blaue Tasche kostet zwanzig Euro.",
      "Mila kauft das T-Shirt, denn sie mag Rot.",
      "Die Tasche ist für Mila zu teuer."
    ],
    "checks": [
      [
        "Wie viel kostet das T-Shirt?",
        "Zehn Euro.",
        "Satz 2"
      ],
      [
        "Was kauft Mila?",
        "Das rote T-Shirt.",
        "Satz 4"
      ],
      [
        "Warum kauft Mila die Tasche nicht?",
        "Sie ist zu teuer.",
        "Satz 5"
      ]
    ]
  },
  "A1-4": {
    "title": "Länder und Sprachen",
    "sentences": [
      "Amir kommt aus Ghana und wohnt jetzt in Berlin.",
      "Er spricht Englisch und lernt Deutsch.",
      "Seine Freundin Lea kommt aus Deutschland.",
      "Lea spricht Deutsch und ein bisschen Französisch.",
      "Zusammen üben Amir und Lea die Sprachen."
    ],
    "checks": [
      [
        "Woher kommt Amir?",
        "Aus Ghana.",
        "Satz 1"
      ],
      [
        "Welche Sprache lernt Amir?",
        "Deutsch.",
        "Satz 2"
      ],
      [
        "Welche zwei Sprachen spricht Lea?",
        "Deutsch und ein bisschen Französisch.",
        "Satz 4"
      ]
    ]
  },
  "A1-5": {
    "title": "Nominativ und Akkusativ",
    "sentences": [
      "Auf dem Tisch steht ein Glas Wasser.",
      "Anna hat einen roten Apfel.",
      "Der Junge sieht den Apfel und fragt nach dem Preis.",
      "Anna gibt dem Jungen das Glas Wasser.",
      "Den Apfel isst Anna später."
    ],
    "checks": [
      [
        "Was steht auf dem Tisch?",
        "Ein Glas Wasser.",
        "Satz 1"
      ],
      [
        "Was hat Anna?",
        "Einen roten Apfel.",
        "Satz 2"
      ],
      [
        "Wann isst Anna den Apfel?",
        "Später.",
        "Satz 5"
      ]
    ]
  },
  "A1-6": {
    "title": "Gegenstände und Farben",
    "sentences": [
      "Mein Zimmer ist klein, aber schön.",
      "Mein Tisch ist weiß und mein Stuhl ist blau.",
      "Auf dem Tisch liegen mein Buch und mein Handy.",
      "Meine Tasche ist rot und steht neben der Tür.",
      "Das Fenster ist groß und offen."
    ],
    "checks": [
      [
        "Welche Farbe hat der Tisch?",
        "Weiß.",
        "Satz 2"
      ],
      [
        "Was liegt auf dem Tisch?",
        "Ein Buch und ein Handy.",
        "Satz 3"
      ],
      [
        "Wo steht die Tasche?",
        "Neben der Tür.",
        "Satz 4"
      ]
    ]
  },
  "A1-7": {
    "title": "Uhrzeit und Tagesablauf",
    "sentences": [
      "Anna steht jeden Morgen um sieben Uhr auf.",
      "Um acht Uhr frühstückt sie mit ihrer Familie.",
      "Um neun Uhr geht sie zur Schule.",
      "Am Nachmittag macht sie die Hausaufgaben.",
      "Am Abend geht sie um zehn Uhr schlafen."
    ],
    "checks": [
      [
        "Wann steht Anna auf?",
        "Um sieben Uhr.",
        "Satz 1"
      ],
      [
        "Wann geht sie zur Schule?",
        "Um neun Uhr.",
        "Satz 3"
      ],
      [
        "Was macht sie am Nachmittag?",
        "Die Hausaufgaben.",
        "Satz 4"
      ]
    ]
  },
  "A1-8": {
    "title": "Datum und Termine",
    "sentences": [
      "Heute ist Montag, der dritte Juni.",
      "Meine Freundin Mia hat am Freitag Geburtstag.",
      "Die Feier beginnt um 18 Uhr.",
      "Am Samstag besucht Mia ihre Großeltern.",
      "Am Sonntag hat sie wieder Zeit für Deutsch."
    ],
    "checks": [
      [
        "Welcher Wochentag ist heute?",
        "Montag.",
        "Satz 1"
      ],
      [
        "Wann hat Mia Geburtstag?",
        "Am Freitag.",
        "Satz 2"
      ],
      [
        "Um wie viel Uhr beginnt die Feier?",
        "Um 18 Uhr.",
        "Satz 3"
      ]
    ]
  },
  "A1-3.5": {
    "title": "Zahlen, Zeit und Preise",
    "sentences": [
      "Ein Bus fährt um acht Uhr ab.",
      "Das Ticket kostet drei Euro.",
      "Mira kauft zwei Tickets für ihre Familie.",
      "Um halb neun kommt der Bus am Bahnhof an.",
      "Mira hat noch zehn Euro in ihrer Tasche."
    ],
    "checks": [
      [
        "Wann fährt der Bus ab?",
        "Um acht Uhr.",
        "Satz 1"
      ],
      [
        "Wie viel kostet ein Ticket?",
        "Drei Euro.",
        "Satz 2"
      ],
      [
        "Wann kommt der Bus an?",
        "Um halb neun.",
        "Satz 4"
      ]
    ]
  },
  "A1-3.6": {
    "title": "Modalverben",
    "sentences": [
      "Jonas kann heute nicht zur Schule kommen.",
      "Er muss zu Hause bleiben und lernen.",
      "Seine Schwester will im Park Fußball spielen.",
      "Jonas möchte lieber ein Buch lesen.",
      "Am Abend darf er kurz Musik hören."
    ],
    "checks": [
      [
        "Warum kommt Jonas nicht zur Schule?",
        "Er muss zu Hause bleiben und lernen.",
        "Sätze 1–2"
      ],
      [
        "Was will seine Schwester machen?",
        "Im Park Fußball spielen.",
        "Satz 3"
      ],
      [
        "Was darf Jonas am Abend?",
        "Kurz Musik hören.",
        "Satz 5"
      ]
    ]
  },
  "A1-4.7": {
    "title": "Sprechprüfung verstehen",
    "sentences": [
      "Lena bereitet sich auf ihre A1-Sprechprüfung vor.",
      "Zuerst sagt sie ihren Namen und ihren Wohnort.",
      "Dann stellt sie ihrer Partnerin eine Frage zum Hobby.",
      "Ihre Partnerin antwortet und stellt auch eine Frage.",
      "Zum Schluss bittet Lena höflich um einen Stift."
    ],
    "checks": [
      [
        "Was sagt Lena zuerst?",
        "Ihren Namen und Wohnort.",
        "Satz 2"
      ],
      [
        "Wozu stellt Lena eine Frage?",
        "Zum Hobby.",
        "Satz 3"
      ],
      [
        "Worum bittet Lena am Schluss?",
        "Um einen Stift.",
        "Satz 5"
      ]
    ]
  },
  "A1-9": {
    "title": "Essen und Verneinung",
    "sentences": [
      "Im Supermarkt kauft Fatima Brot und Käse.",
      "Sie trinkt gern Wasser, aber keinen Kaffee.",
      "Ihr Bruder mag kein Fleisch.",
      "Heute essen beide Obst und Gemüse.",
      "Am Abend brauchen sie keine Milch."
    ],
    "checks": [
      [
        "Was kauft Fatima?",
        "Brot und Käse.",
        "Satz 1"
      ],
      [
        "Was trinkt Fatima nicht?",
        "Keinen Kaffee.",
        "Satz 2"
      ],
      [
        "Was mag ihr Bruder nicht?",
        "Fleisch.",
        "Satz 3"
      ]
    ]
  },
  "A1-10": {
    "title": "Essen im Alltag",
    "sentences": [
      "Am Morgen trinkt Karim einen Tee.",
      "Zum Frühstück isst er Brot mit Käse.",
      "Am Mittag kocht seine Mutter Gemüse und Reis.",
      "Am Nachmittag kauft Karim zwei Bananen.",
      "Zum Abendessen isst die Familie zusammen."
    ],
    "checks": [
      [
        "Was trinkt Karim am Morgen?",
        "Einen Tee.",
        "Satz 1"
      ],
      [
        "Was gibt es zum Mittagessen?",
        "Gemüse und Reis.",
        "Satz 3"
      ],
      [
        "Was kauft Karim am Nachmittag?",
        "Zwei Bananen.",
        "Satz 4"
      ]
    ]
  },
  "A1-11": {
    "title": "Nach dem Weg fragen",
    "sentences": [
      "Eine Frau fragt: Entschuldigung, wo ist der Bahnhof?",
      "Der Mann antwortet: Gehen Sie geradeaus.",
      "An der Kreuzung biegen Sie links ab.",
      "Die Apotheke ist rechts neben dem Bahnhof.",
      "Die Frau sagt vielen Dank und geht weiter."
    ],
    "checks": [
      [
        "Wohin möchte die Frau?",
        "Zum Bahnhof.",
        "Satz 1"
      ],
      [
        "Wohin soll die Frau an der Kreuzung gehen?",
        "Links.",
        "Satz 3"
      ],
      [
        "Wo ist die Apotheke?",
        "Rechts neben dem Bahnhof.",
        "Satz 4"
      ]
    ]
  },
  "A1-12.1": {
    "title": "Präpositionen im Alltag",
    "sentences": [
      "Der Schlüssel liegt auf dem Tisch.",
      "Das Buch liegt in der Tasche.",
      "Sara stellt die Tasche neben die Tür.",
      "Das Bild hängt an der Wand.",
      "Am Abend sucht Sara den Schlüssel."
    ],
    "checks": [
      [
        "Wo liegt der Schlüssel?",
        "Auf dem Tisch.",
        "Satz 1"
      ],
      [
        "Wo liegt das Buch?",
        "In der Tasche.",
        "Satz 2"
      ],
      [
        "Wohin stellt Sara die Tasche?",
        "Neben die Tür.",
        "Satz 3"
      ]
    ]
  },
  "A1-5.9": {
    "title": "A1 Sprechen üben",
    "sentences": [
      "Am Dienstag üben vier Freunde Deutsch.",
      "Lina sagt ihren Namen, ihr Alter und ihren Wohnort.",
      "Ben stellt eine Frage zum Wochenende.",
      "Mia bittet höflich um ein Glas Wasser.",
      "Alle sprechen langsam und helfen einander."
    ],
    "checks": [
      [
        "Wann üben die Freunde Deutsch?",
        "Am Dienstag.",
        "Satz 1"
      ],
      [
        "Was sagt Lina?",
        "Ihren Namen, ihr Alter und ihren Wohnort.",
        "Satz 2"
      ],
      [
        "Worum bittet Mia?",
        "Um ein Glas Wasser.",
        "Satz 4"
      ]
    ]
  },
  "A1-12.3": {
    "title": "Einen Brief schreiben",
    "sentences": [
      "Liebe Anna, ich habe am Samstag Geburtstag.",
      "Ich lade dich um drei Uhr zu mir nach Hause ein.",
      "Wir essen Kuchen und hören Musik.",
      "Bitte bring deine Schwester auch mit.",
      "Viele Grüße, Lina."
    ],
    "checks": [
      [
        "Wann hat Lina Geburtstag?",
        "Am Samstag.",
        "Satz 1"
      ],
      [
        "Um wie viel Uhr beginnt die Einladung?",
        "Um drei Uhr.",
        "Satz 2"
      ],
      [
        "Wen soll Anna mitbringen?",
        "Ihre Schwester.",
        "Satz 4"
      ]
    ]
  },
  "A1-13": {
    "title": "Das Wetter",
    "sentences": [
      "Heute ist das Wetter in Berlin kalt und windig.",
      "Am Morgen regnet es viel.",
      "Mia nimmt eine warme Jacke und einen Regenschirm mit.",
      "Morgen scheint die Sonne und es wird warm.",
      "Dann möchte Mia mit ihren Freunden spazieren gehen."
    ],
    "checks": [
      [
        "Wie ist das Wetter heute?",
        "Kalt und windig.",
        "Satz 1"
      ],
      [
        "Was nimmt Mia mit?",
        "Eine warme Jacke und einen Regenschirm.",
        "Satz 3"
      ],
      [
        "Was möchte Mia morgen machen?",
        "Mit ihren Freunden spazieren gehen.",
        "Satz 5"
      ]
    ]
  },
  "A1-14.1": {
    "title": "Beim Arzt",
    "sentences": [
      "Am Montag hat Ben Kopfschmerzen und Fieber.",
      "Er ruft beim Arzt an und fragt nach einem Termin.",
      "Die Ärztin hat am Dienstag um neun Uhr Zeit.",
      "Ben trinkt Wasser und bleibt zu Hause.",
      "Am Dienstag geht er zur Praxis."
    ],
    "checks": [
      [
        "Welche Beschwerden hat Ben?",
        "Kopfschmerzen und Fieber.",
        "Satz 1"
      ],
      [
        "Wann hat die Ärztin Zeit?",
        "Am Dienstag um neun Uhr.",
        "Satz 3"
      ],
      [
        "Was macht Ben am Montag zu Hause?",
        "Er trinkt Wasser und bleibt zu Hause.",
        "Satz 4"
      ]
    ]
  },
  "A1-5.10": {
    "title": "Eine Nachricht mit weil",
    "sentences": [
      "Hallo Tom, heute kann ich leider nicht kommen.",
      "Ich bin krank und muss zu Hause bleiben.",
      "Kannst du morgen am Nachmittag zu mir kommen?",
      "Wir können zusammen Deutsch lernen und einen Tee trinken.",
      "Liebe Grüße, Anna."
    ],
    "checks": [
      [
        "Warum kann Anna heute nicht kommen?",
        "Sie ist krank und muss zu Hause bleiben.",
        "Satz 2"
      ],
      [
        "Wann soll Tom kommen?",
        "Morgen am Nachmittag.",
        "Satz 3"
      ],
      [
        "Was möchten Anna und Tom zusammen machen?",
        "Deutsch lernen und Tee trinken.",
        "Satz 4"
      ]
    ]
  }
});
export function getA1PresenterReadingLesson(assignmentId = "") {
  const key = String(assignmentId || "").trim().toUpperCase();
  const source = A1_READING_LESSONS[key];
  if (!source) return null;
  return {
    title: source.title,
    textDe: source.sentences.join(" "),
    readingPurpose: "Lies den kurzen Text. Antworte in einfachen deutschen Sätzen und zeige die passende Textstelle.",
    checks: source.checks.map(([question]) => question),
    answers: source.checks.map(([, answer, evidence]) => answer + " · Beleg: " + evidence),
    evidence: source.checks.map(([, , evidence]) => evidence),
  };
}
export const A1_ACTIVE_READING_IDS = Object.freeze(Object.keys(A1_READING_LESSONS));
