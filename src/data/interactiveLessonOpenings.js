import { B1_DAY27_LISTENING } from './b1Day27Listening.js';
import { A2_DAY23_CLASSROOM_LISTENING } from './a2Day23ClassroomListening.js';
import { A2_DAY24_CLASSROOM_LISTENING } from './a2Day24ClassroomListening.js';
import { A2_DAY1_LISTENING } from './a2Day1Listening.js';
import { A2_DAY2_LISTENING } from './a2Day2Listening.js';
import { A2_DAY3_LISTENING } from './a2Day3Listening.js';
import { A2_DAY19_LISTENING } from './a2Day19Listening.js';
// Curated reusable 10-minute classroom warm-ups. The A2 Day 17 Hören is
// the only verified recording; never invent audio or override scored workbook work.
import { A2_DAY17_AUDIO_KEY, A2_DAY17_WARMUP, A2_DAY17_LISTENING, A2_DAY17_TRANSCRIPT } from "./a2Day17Opening.js";
import { B1_DAY26_LISTENING } from "./b1Day26Listening.js";
import { B1_DAY25_LISTENING } from "./b1Day25Listening.js";
import { B1_DAY24_RECORDED_MUSIC } from "./b1Day24RecordedMusic.js";
import { A2_DAY18_BANK_LISTENING } from "./a2Day18BankListening.js";
import { A2_DAY18_BANK_MUSIC } from "./a2Day18BankMusic.js";
import { A2_DAY20_LISTENING } from "./a2Day20Listening.js";
import { A2_DAY21_CLASSROOM_LISTENING } from "./a2Day21ClassroomListening.js";

const ENTRIES = {
  'A2-1.2': {
    assignmentId: 'A2-1.2', title: 'Personen beschreiben', warmup: [],
    musicIntro: {
      mediaType: 'music', level: 'A2', day: 2,
      title: 'Personen beschreiben · Lernlied',
      introQuestion: 'Wie beschreibt das Lied eine Person? Nenne zwei Adjektive.',
      musicLibraryUrl: 'https://music.falowen.app/?level=A2&day=2',
      studentPurpose: 'Höre das bereits veröffentlichte Lied für A2 Tag 2 und nenne zwei passende Beschreibungen.',
      teacherPurpose: 'Das veröffentlichte Day-2-Lied aus der bestehenden Musikbibliothek abspielen, keine neue Aufnahme anlegen. Anschließend das separate Gespräch über Tom und Sarah hören.',
      nextStep: 'Danach: Hören · Tom und Sarah · fünf Fragen zu Aussehen, Kleidung und Charakter.',
    },
    listening: A2_DAY2_LISTENING,
  },
  'A2-1.3': {
    assignmentId: 'A2-1.3', title: 'Dinge und Personen vergleichen',
    // The published song opens the lesson. The smartphone Hören is separate.
    musicIntro: {
      mediaType: 'music', level: 'A2', day: 3,
      title: 'Zwei Städte',
      introQuestion: 'Welche zwei Städte werden im Lied verglichen? Was ist in einer Stadt besser?',
      musicLibraryUrl: 'https://music.falowen.app/?level=A2&day=3',
      studentPurpose: 'Höre das Lied „Zwei Städte“ und formuliere einen Vergleich mit als oder wie.',
      teacherPurpose: 'Spiele die veröffentlichte Musikaufnahme „Zwei Städte“ und besprich einen Vergleich. Danach folgt das eigenständige Hören über Jonas und zwei Smartphones.',
      nextStep: 'Danach: Hören · Jonas vergleicht zwei Smartphones · fünf Fragen.',
    },
    warmup: [
      {
        label: 'Gleich oder anders?', minutes: 2,
        context: 'Zwei Handys kosten jeweils 300 Euro.',
        prompt: 'Wie vergleichst du den Preis?',
        options: ['Das erste Handy ist teurer als das zweite.', 'Beide Handys sind genauso teuer.', 'Das erste ist am teuersten.'],
        correctIndex: 1, answer: 'Beide Handys sind genauso teuer.',
        teacherHint: 'Die Lernenden erklären den Unterschied zwischen wie und als.',
      },
      {
        label: 'Komparativ finden', minutes: 2,
        context: 'Das Galaxy kostet 500 Euro. Das Nexus kostet 350 Euro.',
        prompt: 'Bilde einen passenden Vergleich mit billiger als.',
        lines: ['Nexus · Galaxy · billiger als'],
        answer: 'Das Nexus ist billiger als das Galaxy.',
        teacherHint: 'Komparativ + als; beide Vergleichsobjekte nennen.',
      },
      {
        label: 'Höchster Grad', minutes: 2,
        context: 'Du vergleichst drei Mobiltelefone.',
        prompt: 'Bilde einen Satz mit am besten oder am günstigsten.',
        lines: ['gut → besser → am besten', 'günstig → günstiger → am günstigsten'],
        answer: 'Von diesen drei Handys ist das Nexus am günstigsten.',
        teacherHint: 'Bei drei Alternativen den Superlativ verwenden.',
      },
      {
        label: 'Entscheidung begründen', minutes: 4,
        context: 'Ein Handy macht bessere Fotos, ein anderes kostet weniger.',
        prompt: 'Welches Handy würdest du kaufen? Begründe mit weil.',
        lines: ['Mir sind ... wichtiger.', 'Ich kaufe ..., weil ...'],
        answer: 'Ich würde das Handy mit der besseren Kamera kaufen, weil mir gute Fotos wichtiger sind.',
        teacherHint: 'Zuerst Partneraustausch, dann zwei begründete Entscheidungen hören.',
      },
    ],
    listening: A2_DAY3_LISTENING,
  },
  'A2-1.1': {
    assignmentId:'A2-1.1', title:'Small Talk', warmup:[],
    musicIntro:{
      mediaType:'music', level:'A2', day:1, title:'Ein nettes Gespräch',
      introQuestion:'Wie beginnst du ein Gespräch mit einem neuen Kollegen?',
      musicLibraryUrl:'https://music.falowen.app/?level=A2&day=1',
      studentPurpose:'Höre das veröffentlichte Lied und nenne eine passende Small-Talk-Frage.',
      teacherPurpose:'Spiele das vorhandene A2-Tag-1-Lied ab. Danach folgt die separate Hörübung über den neuen Kollegen Thomas.',
      nextStep:'Danach: Small Talk über Thomas · fünf Fragen zur separaten Gesprächsaufnahme.',
    },
    listening:A2_DAY1_LISTENING,
  },
  "A2-3.8":   {
    "assignmentId": "A2-3.8",
    "title": "Restaurant · Bestellen und reagieren",
    "warmup": [
      {
        "label": "Höflich bestellen",
        "minutes": 2,
        "context": "Du bist zu Gast im Restaurant.",
        "prompt": "Wie bittest du um eine Speisekarte?",
        "options": [
          "Bringen Sie sofort Essen!",
          "Könnte ich bitte die Speisekarte bekommen?",
          "Gib mir alles."
        ],
        "correctIndex": 1,
        "answer": "Könnte ich bitte die Speisekarte bekommen?",
        "teacherHint": "Zuerst alle begründen lassen. Dann einen Schüler eine andere höfliche Bitte formulieren lassen.",
        "explanation": "Begründe die Entscheidung und bilde anschließend einen eigenen Satz."
      },
      {
        "label": "Redemittel kombinieren",
        "minutes": 2,
        "context": "Ein Gast bestellt ein Getränk.",
        "prompt": "Verbinde die Satzanfänge mit passenden Enden.",
        "lines": [
          "Ich hätte gern …",
          "Haben Sie auch …?",
          "Was empfehlen Sie heute?"
        ],
        "answer": "1. Ich hätte gern ein Mineralwasser. 2. Haben Sie auch etwas Vegetarisches? 3. Was empfehlen Sie heute?",
        "teacherHint": "Drei Schüler: je ein Satz. Nachfragen, warum Sie im Restaurant passend ist.",
        "explanation": ""
      },
      {
        "label": "Fehlerdetektiv",
        "minutes": 2,
        "context": "Ein Gast ist unzufrieden.",
        "prompt": "Verbessere die unhöflichen Sätze.",
        "lines": [
          "1. Bring mir Wasser!",
          "2. Du hast das falsche Essen gebracht!"
        ],
        "answer": "1. Könnte ich bitte ein Wasser ohne Kohlensäure bekommen? 2. Entschuldigung, ich hatte eine Suppe bestellt.",
        "teacherHint": "Lass zwei Schüler die Sätze freundlich und natürlich formulieren.",
        "explanation": ""
      },
      {
        "label": "Mini-Mission",
        "minutes": 4,
        "context": "Der Kellner bringt Sprudelwasser statt stillem Wasser.",
        "prompt": "Erklärt das Problem, bittet um eine Lösung und fragt nach der Rechnung.",
        "lines": [
          "Gast: Problem höflich erklären",
          "Service: Sich entschuldigen und Lösung anbieten",
          "Gast: Nach der Rechnung fragen"
        ],
        "answer": "A: Entschuldigung, ich habe stilles Wasser bestellt. B: Natürlich, ich bringe sofort das richtige Wasser. A: Vielen Dank. Könnten wir später bitte zahlen?",
        "teacherHint": "Drei Rollen verteilen, nach zwei Minuten die Rollen wechseln.",
        "explanation": ""
      }
    ]
  },
  "A2-6.17":   {
    "assignmentId": "A2-6.17",
    "title": "In der Apotheke · Was sagst du?",
    "warmup": [],
    "audio": true
  },
  "A2-7.18":   {
    "assignmentId": "A2-7.18",
    "title": "Bankanruf · Kartenproblem lösen",
    "warmup": [
      {
        "label": "Der erste Satz",
        "minutes": 2,
        "context": "Deine Karte ist plötzlich gesperrt.",
        "prompt": "Welche Eröffnung passt zu einem höflichen Bankanruf?",
        "options": [
          "Hallo, meine Karte geht nicht, mach was!",
          "Guten Tag, ich rufe an, weil meine Karte gesperrt ist.",
          "Ich möchte sofort Bargeld."
        ],
        "correctIndex": 1,
        "answer": "Guten Tag, ich rufe an, weil meine Karte gesperrt ist.",
        "teacherHint": "Achte auf den weil-Satz. Frag nach dem Grund des Anrufs.",
        "explanation": "Begründe die Entscheidung und bilde anschließend einen eigenen Satz."
      },
      {
        "label": "Könnten oder würden?",
        "minutes": 2,
        "context": "Du möchtest ein Konto eröffnen und nach Unterlagen fragen.",
        "prompt": "Formuliere zwei höfliche Bitten mit könnten / würde gern.",
        "lines": [
          "Ich will ein Konto eröffnen.",
          "Welche Dokumente brauche ich?"
        ],
        "answer": "1. Ich würde gern ein Konto eröffnen. 2. Könnten Sie mir bitte sagen, welche Unterlagen ich brauche?",
        "teacherHint": "Gegenseitig die Verbstellung kontrollieren.",
        "explanation": ""
      },
      {
        "label": "Satzbau prüfen",
        "minutes": 2,
        "context": "Am Telefon muss die Wortstellung stimmen.",
        "prompt": "Korrigiert zwei typische Fehler.",
        "lines": [
          "1. Könnten Sie mir sagen, wie lange dauert es?",
          "2. Ich rufe an, weil meine Karte ist gesperrt."
        ],
        "answer": "1. Könnten Sie mir bitte sagen, wie lange es dauert? 2. Ich rufe an, weil meine Karte gesperrt ist.",
        "teacherHint": "Eine Person erklärt die indirekte Frage, eine andere den weil-Satz.",
        "explanation": ""
      },
      {
        "label": "Telefon-Mission",
        "minutes": 4,
        "context": "Du bist im Ausland und kannst deine gesperrte Karte nicht benutzen.",
        "prompt": "Spielt den Anruf: Problem erklären, höflich nach Identitätsprüfung fragen, nächsten Schritt bestätigen.",
        "lines": [
          "Kunde: Problem erklären",
          "Bank: Zur Identitätsprüfung nachfragen, keine sensiblen Daten laut nennen lassen",
          "Kunde: Nach dem nächsten Schritt und der Dauer fragen"
        ],
        "answer": "Guten Tag, ich rufe an, weil meine Karte gesperrt ist. Könnten Sie mir bitte sagen, was ich jetzt tun kann? Welche Informationen brauchen Sie? Vielen Dank, ich habe verstanden.",
        "teacherHint": "Zwei Freiwillige spielen den Anruf. Die Klasse nennt drei höfliche Ausdrücke.",
        "explanation": ""
      }
    ]
  },
  "A2-7.20":   {
    "assignmentId": "A2-7.20",
    "title": "Reklamation · Problem und Lösung",
    "warmup": [
      {
        "label": "Welche Antwort passt?",
        "minutes": 2,
        "context": "Ein Wasserkocher ist nach dem Kauf defekt.",
        "prompt": "Wie reklamierst du höflich?",
        "options": [
          "Ich will sofort Geld, egal warum!",
          "Entschuldigung, der Wasserkocher funktioniert leider nicht.",
          "Sie sind schuld!"
        ],
        "correctIndex": 1,
        "answer": "Entschuldigung, der Wasserkocher funktioniert leider nicht.",
        "teacherHint": "Sprache für sachliche Beschwerden statt Vorwürfen sammeln.",
        "explanation": "Begründe die Entscheidung und bilde anschließend einen eigenen Satz."
      },
      {
        "label": "Problem + weil",
        "minutes": 2,
        "context": "Du möchtest einen defekten Artikel zurückgeben.",
        "prompt": "Verbinde Problem und Begründung mit weil.",
        "lines": [
          "Der Wasserkocher ist kaputt.",
          "Ich möchte ihn reklamieren.",
          "Verbinde beide Aussagen mit weil."
        ],
        "answer": "Ich möchte den Wasserkocher reklamieren, weil er nicht funktioniert.",
        "teacherHint": "Lass Schüler die Verbposition im weil-Satz erklären.",
        "explanation": ""
      },
      {
        "label": "Reklamation verbessern",
        "minutes": 2,
        "context": "Die Nachricht ist zu direkt.",
        "prompt": "Schreibe sie höflicher.",
        "lines": [
          "Das ist kaputt! Geben Sie mir ein neues!"
        ],
        "answer": "Guten Tag, leider ist das Produkt beschädigt angekommen. Könnten Sie es bitte umtauschen?",
        "teacherHint": "Mindestens einen höflichen Konjunktiv-II-Ausdruck verlangen.",
        "explanation": ""
      },
      {
        "label": "Kundendienst-Mission",
        "minutes": 4,
        "context": "Der Kunde hat einen Kassenzettel und möchte einen Ersatz.",
        "prompt": "Spielt das Gespräch in vier Schritten.",
        "lines": [
          "1. Produkt nennen",
          "2. Problem mit weil erklären",
          "3. Kaufnachweis nennen",
          "4. Umtausch oder Erstattung erbitten"
        ],
        "answer": "Guten Tag, ich möchte den Artikel reklamieren. Er funktioniert leider nicht. Hier ist der Kassenbon. Könnten Sie mir bitte Ersatz anbieten?",
        "teacherHint": "Rollentausch; beobachten, ob Problem, Begründung und Lösung genannt werden.",
        "explanation": ""
      }
    ]
  },
  "B1-2.5":   {
    "assignmentId": "B1-2.5",
    "title": "Wohnungsbesichtigung · Termin-Challenge",
    "warmup": [
      {
        "label": "Höfliche Anfrage",
        "minutes": 2,
        "context": "Du interessierst dich für eine Wohnung.",
        "prompt": "Welche Terminfrage wirkt professionell?",
        "options": [
          "Wann kann ich kommen? Sagen Sie schnell!",
          "Wäre ein Besichtigungstermin am Samstag möglich?",
          "Geben Sie mir die Wohnung!"
        ],
        "correctIndex": 1,
        "answer": "Wäre ein Besichtigungstermin am Samstag möglich?",
        "teacherHint": "Erklären lassen, warum Konjunktiv II höflich klingt.",
        "explanation": "Begründe die Entscheidung und bilde anschließend einen eigenen Satz."
      },
      {
        "label": "Indirekte Fragen",
        "minutes": 2,
        "context": "Du möchtest mehr über eine Wohnung erfahren.",
        "prompt": "Formuliere zwei indirekte Fragen mit ob und wie hoch.",
        "lines": [
          "Ist die Wohnung noch frei?",
          "Wie hoch sind die Nebenkosten?"
        ],
        "answer": "Könnten Sie mir sagen, ob die Wohnung noch frei ist? Ich würde gern wissen, wie hoch die Nebenkosten sind.",
        "teacherHint": "Auf Verb-Endstellung nach ob und in indirekten Fragen achten.",
        "explanation": ""
      },
      {
        "label": "Terminfehler entdecken",
        "minutes": 2,
        "context": "Eine höfliche E-Mail ist grammatisch falsch.",
        "prompt": "Korrigiere die zwei Sätze.",
        "lines": [
          "Ich möchte wissen, ob ist ein Termin möglich.",
          "Könnten Sie mir sagen, wann beginnt die Besichtigung?"
        ],
        "answer": "Ich möchte wissen, ob ein Termin möglich ist. Könnten Sie mir sagen, wann die Besichtigung beginnt?",
        "teacherHint": "Zwei Schüler begründen Wortstellung und Höflichkeit.",
        "explanation": ""
      },
      {
        "label": "Besichtigung verhandeln",
        "minutes": 4,
        "context": "Samstag um 14 Uhr geht nicht; Donnerstag um 16 Uhr ist frei.",
        "prompt": "Vereinbare höflich einen neuen Termin und bitte um eine Bestätigung.",
        "lines": [
          "Mieter: Samstag passt nicht, Alternative vorschlagen",
          "Vermieter: Donnerstag anbieten",
          "Mieter: Indirekte Frage und Bestätigung erbitten"
        ],
        "answer": "Wäre Donnerstag um 16 Uhr möglich? Das würde mir gut passen. Könnten Sie mir den Termin bitte per E-Mail bestätigen?",
        "teacherHint": "Zwei Schüler verhandeln, ein dritter zählt höfliche Wendungen.",
        "explanation": ""
      }
    ]
  },
  "B1-7.22":   {
    "assignmentId": "B1-7.22",
    "title": "Beziehungen · Werte und Kompromisse",
    "warmup": [
      {
        "label": "Werte-Dilemma",
        "minutes": 2,
        "context": "Zwei Menschen wollen ihre Freizeit unterschiedlich verbringen.",
        "prompt": "Welche Lösung wirkt fair?",
        "options": [
          "Nur einer darf entscheiden.",
          "Beide sprechen und suchen einen Kompromiss.",
          "Die Wünsche des anderen sind egal."
        ],
        "correctIndex": 1,
        "answer": "Beide sprechen und suchen einen Kompromiss.",
        "teacherHint": "Kein Beziehungsurteil: Respekt und Kompromiss als Sprachhandlung diskutieren.",
        "explanation": "Begründe die Entscheidung und bilde anschließend einen eigenen Satz."
      },
      {
        "label": "Dass-Satz formulieren",
        "minutes": 2,
        "context": "Du möchtest deine Meinung begründen.",
        "prompt": "Formuliere einen Satz mit „Mir ist wichtig, dass ...“.",
        "lines": [
          "Wähle einen Wert: Ehrlichkeit, Vertrauen oder Respekt.",
          "Ergänze: Mir ist wichtig, dass …"
        ],
        "answer": "Mir ist wichtig, dass beide Partner offen miteinander sprechen.",
        "teacherHint": "Andere persönliche Standpunkte sind ausdrücklich erlaubt.",
        "explanation": ""
      },
      {
        "label": "Nachricht verbessern",
        "minutes": 2,
        "context": "Eine Nachricht klingt vorwurfsvoll.",
        "prompt": "Formuliere die Nachricht respektvoll um.",
        "lines": [
          "Du hast nie Zeit! Du musst sofort alles ändern!"
        ],
        "answer": "Ich würde gern mehr Zeit mit dir verbringen. Können wir gemeinsam einen Termin finden?",
        "teacherHint": "Über Register, Ton und Wirkung diskutieren.",
        "explanation": ""
      },
      {
        "label": "Kompromiss finden",
        "minutes": 4,
        "context": "Eine Person möchte am Wochenende Freunde treffen, die andere gemeinsam etwas unternehmen.",
        "prompt": "Verhandelt einen Vorschlag und begründet ihn mit mindestens einem dass-Satz.",
        "lines": [
          "Partner A: Gemeinsame Zeit vorschlagen",
          "Partner B: Eigene Wünsche erklären",
          "Zusammen: konkreten Kompromiss vereinbaren"
        ],
        "answer": "Ich finde, dass beide Wünsche wichtig sind. Vielleicht verbringen wir Samstag zusammen und treffen unsere Freunde am Sonntag.",
        "teacherHint": "Zwei unterschiedliche Lösungsvorschläge erarbeiten lassen, anschließend kurz vergleichen.",
        "explanation": ""
      }
    ]
  },
  "B1-8.25":   {
    "assignmentId": "B1-8.25",
    "title": "Onlinekauf · Verbraucherfall",
    "warmup": [
      {
        "label": "Fake-Shop prüfen",
        "minutes": 2,
        "context": "Ein Online-Shop bietet ein teures Handy zu einem ungewöhnlich niedrigen Preis an.",
        "prompt": "Was sollte man vor dem Kauf zuerst prüfen?",
        "options": [
          "Sofort zahlen, bevor der Preis steigt.",
          "Anbieterangaben und Zahlungsbedingungen prüfen.",
          "Nur das Produktfoto ansehen."
        ],
        "correctIndex": 1,
        "answer": "Anbieterangaben und Zahlungsbedingungen prüfen.",
        "teacherHint": "Schüler nennen noch zwei weitere Prüfmerkmale.",
        "explanation": "Begründe die Entscheidung und bilde anschließend einen eigenen Satz."
      },
      {
        "label": "Problem erklären",
        "minutes": 2,
        "context": "Eine Ware ist beschädigt angekommen.",
        "prompt": "Erkläre das Problem mit dass und deshalb.",
        "lines": [
          "Das Produkt ist beschädigt.",
          "Ich bitte um Ersatz.",
          "Verbinde beide Aussagen mit dass und deshalb."
        ],
        "answer": "Das Problem ist, dass das Produkt beschädigt angekommen ist. Deshalb bitte ich um einen Ersatz.",
        "teacherHint": "Auf Verbendstellung im dass-Satz und Verbzweitstellung nach deshalb achten.",
        "explanation": ""
      },
      {
        "label": "Beschwerde höflich machen",
        "minutes": 2,
        "context": "Der Kunde ist verärgert.",
        "prompt": "Formuliere zwei höfliche Sätze für eine Reklamation.",
        "lines": [
          "Das Zeug ist kaputt! Schickt mir sofort neues Zeug!"
        ],
        "answer": "Guten Tag, leider ist der Artikel beschädigt angekommen. Könnten Sie mir bitte einen Ersatz schicken?",
        "teacherHint": "Mündlich vergleichen: verärgert, sachlich und professionell.",
        "explanation": ""
      },
      {
        "label": "Kundenservice-Entscheidung",
        "minutes": 4,
        "context": "Ein Kunde hat ein beschädigtes Gerät erhalten. Der Händler bietet Ersatz oder Rückzahlung an.",
        "prompt": "Vergleicht zwei Lösungen und formuliert eine höfliche Antwort.",
        "lines": [
          "Team A: Ersatz wählen und begründen",
          "Team B: Rückzahlung wählen und begründen",
          "Beide Teams: höfliche Nachricht verfassen"
        ],
        "answer": "Ich würde einen Ersatz bevorzugen, weil ich das Gerät noch brauche. Vielen Dank für Ihr Angebot. Könnten Sie mir bitte die Lieferzeit mitteilen?",
        "teacherHint": "Zwei Gruppen vertreten unterschiedliche Entscheidungen, ohne rechtliche Ansprüche zu erfinden.",
        "explanation": ""
      }
    ]
  },
};

ENTRIES["A2-6.17"].warmup = A2_DAY17_WARMUP;
ENTRIES["A2-6.17"].listening = {
  level: "A2",
  day: 17,
  title: "Apotheken-Detektiv",
  audioKey: A2_DAY17_AUDIO_KEY,
  transcript: A2_DAY17_TRANSCRIPT,
  questions: A2_DAY17_LISTENING,
  previewWords: ["die Lutschtabletten", "die Dosierungsangaben", "der Kassenbon"],
};

// A2 Day 18 keeps its authenticated R2 Hören on slide 3, with a teacher-led
// YouTube and optional lyric questions together on slide 2.
ENTRIES["A2-7.18"].musicIntro = A2_DAY18_BANK_MUSIC;
ENTRIES["A2-7.18"].listening = A2_DAY18_BANK_LISTENING;
// A2 Days 19 and 20 already have published music discovered by the public
// music library; these songs are not yet pinned to the static approved catalog.
// Link to the exact level/day filter rather than inventing an R2 key,
// a player URL or mismatched lyrics/timestamps. Replaces warm-up only.
ENTRIES["A2-7.19"] = {
  assignmentId: 'A2-7.19', title: 'Einkaufen – wo und wie?',
  warmup: [],
  musicIntro: {
    mediaType: 'music', level: 'A2', day: 19,
    title: 'Lieber online oder im Laden?',
    introQuestion: 'Kaufst du lieber online oder im Geschäft? Warum?',
    musicLibraryUrl: 'https://music.falowen.app/?level=A2&day=19',
    nextStep: 'Danach folgt das separate Hören-Gespräch über den Wochenmarkt und den Online-Einkauf.',
  },
  listening: A2_DAY19_LISTENING,
};
ENTRIES["A2-7.20"].listening = A2_DAY20_LISTENING;
// Day 21 matches the modern Day 19 classroom pattern: the already-uploaded
// published music is discovered by level/day; separate authenticated R2
// Hören uses Lisa and Tom, not the student's graded Claudia–Thomas recording.
ENTRIES["A2-9.23"] = {
  assignmentId: "A2-9.23", title: "Mein Schul- und Arbeitsweg", warmup: [],
  musicIntro: {
    mediaType: "music", level: "A2", day: 23, title: "Fahrrad zur Schule",
    introQuestion: "Wie kommt die Person zur Schule? Was machst du bei Regen?",
    musicLibraryUrl: "https://music.falowen.app/?level=A2&day=23",
    studentPurpose: "Höre das veröffentlichte Lied. Nenne ein Verkehrsmittel und vergleiche deinen eigenen Weg.",
    teacherPurpose: "Spiele die veröffentlichte Aufnahme Fahrrad zur Schule. Nutze nur Liedtext und Zeitmarken für genau diese Aufnahme. Danach folgt das separate Gespräch.",
    nextStep: "Danach: Hören zum Schul- und Arbeitsweg · offene Fragen zur Gesprächsaufnahme.",
  },
  listening: A2_DAY23_CLASSROOM_LISTENING,
};

// The existing A2 Day 24 published music remains slide 2. This separate
// owner-uploaded Anna/Lukas dialogue is the ungraded classroom Hören slide 3.
ENTRIES["A2-9.24"] = {
  assignmentId: "A2-9.24",
  title: "Einen Urlaub planen",
  warmup: [],
  listening: A2_DAY24_CLASSROOM_LISTENING,
};

ENTRIES["A2-8.21"] = {
  assignmentId: "A2-8.21",
  title: "Ein Wochenende planen",
  warmup: [],
  musicIntro: {
    mediaType: "music", level: "A2", day: 21,
    title: "Endlich Wochenende!",
    introQuestion: "Was machst du am Wochenende, wenn das Wetter gut ist?",
    musicLibraryUrl: "https://music.falowen.app/?level=A2&day=21",
    nextStep: "Danach folgt ein separates Hören-Gespräch: Lisa und Tom planen einen Ausflug an den See.",
    studentPurpose: "Höre das veröffentlichte Lied für A2 Tag 21 und nenne eine Wochenendaktivität.",
    teacherPurpose: "Das vorhandene Lied aus der Musikbibliothek abspielen, eine kurze Frage besprechen und anschließend zur separaten Hörübung mit Lisa und Tom wechseln.",
  },
  listening: A2_DAY21_CLASSROOM_LISTENING,
};
ENTRIES["A2-7.20"].musicIntro = {
  mediaType: 'music', level: 'A2', day: 20,
  title: 'Die Jacke ist zu klein',
  introQuestion: 'Was machst du, wenn ein gekaufter Artikel nicht passt?',
  musicLibraryUrl: 'https://music.falowen.app/?level=A2&day=20',
  nextStep: 'Danach folgt das separate Hören-Gespräch über die Reklamation eines falschen Hemds.',
};
// Day 24 follows the existing A2 pattern: slide 2 keeps its published
// independent lesson music, while slide 3 is a real conversation Hören.
// The supplied Verbraucherservice recording is labelled B1 D25, so share its
// verified classroom key and answer bank rather than inventing an R2 object.
ENTRIES["B1-8.24"] = {
  assignmentId: "B1-8.24",
  title: "Konsum und Nachhaltigkeit",
  warmup: [],
  musicIntro: B1_DAY24_RECORDED_MUSIC,
  listening: B1_DAY25_LISTENING,
};
// Published R2 music on Day 25 replaces the old YouTube intro only.
ENTRIES["B1-8.25"].musicIntro = {
  mediaType:'music',level:'B1',day:25,
  title:'Als Kunde habe ich auch Rechte',
  introQuestion:'Wie würdest du reagieren, wenn ein Paket nicht ankommt?',
  musicLibraryUrl:'https://music.falowen.app/?level=B1&day=25',
  nextStep:'Danach folgt das bestehende separate Hören-Gespräch über das Lieferproblem.',
};
ENTRIES["B1-8.25"].listening = B1_DAY25_LISTENING;
// Day 26 keeps its lesson music, followed by the teacher-supplied hotel conversation.
ENTRIES["B1-9.26"] = {
  assignmentId:'B1-9.26',title:'Reiseprobleme und Lösungen',warmup:[],
  listening: B1_DAY26_LISTENING,
  musicIntro:{
    mediaType:'music',level:'B1',day:26,
    title:'Der Zug fährt nicht',
    introQuestion:'Was kannst du tun, wenn dein Zug ausfällt?',
    musicLibraryUrl:'https://music.falowen.app/?level=B1&day=26',
    nextStep:'Danach folgt das separate Hören-Gespräch über ein überbuchtes Hotel.',
  },
};

// Day 27 uses the same published-music / separate conversation flow as Day 26.
ENTRIES["B1-10.27"] = {
  assignmentId: "B1-10.27", title: "Umweltfreundlich im Alltag", warmup: [],
  listening: B1_DAY27_LISTENING,
  musicIntro: {
    mediaType: "music", level: "B1", day: 27, title: "Vor unserer Tür",
    musicLibraryUrl: "https://music.falowen.app/?level=B1&day=27",
    introQuestion: "Welche umweltfreundliche Gewohnheit möchtest du ausprobieren?",
    studentPurpose: "Höre das veröffentlichte Lied für B1 Tag 27 und nenne eine Idee für deinen Alltag.",
    teacherPurpose: "Spiele die veröffentlichte Day-27-Musik aus der Musikbibliothek. Danach folgt die separate Gesprächsaufnahme mit sechs Hörfragen. Unbewertete Unterrichtsübung.",
    nextStep: "Danach: Lisas Tipps beim Einkaufen und Energiesparen. Das Gespräch ist zweimal aufgenommen.",
  },
};

export const INTERACTIVE_LESSON_OPENINGS = Object.freeze(
  Object.fromEntries(Object.entries(ENTRIES).map(([key, entry]) => [
    key,
    Object.freeze({ ...entry, warmup: Object.freeze(entry.warmup), ...(entry.listening ? { listening: Object.freeze(entry.listening) } : {}) })
  ]))
);
export function getInteractiveLessonOpening(assignmentId = "") {
  return INTERACTIVE_LESSON_OPENINGS[String(assignmentId).trim().toUpperCase()] || null;
}
export function isInteractiveOpeningStage(assignmentId = "", stageId = "") {
  const lesson = getInteractiveLessonOpening(assignmentId);
  if (stageId === "warmup" && (lesson?.musicIntro || /^(A2|B1)-/.test(lesson?.assignmentId || ""))) return false;
  if (lesson?.listening?.mediaType === "music") return false; // Independent YouTube Musik / Lesen stages
  return Boolean(lesson && ((stageId === "warmup" && lesson.warmup?.length > 0) || (stageId === "knowledge" && lesson.listening)));
}
