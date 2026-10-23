// Curated reusable 10-minute classroom warm-ups. The A2 Day 17 Hören is
// the only verified recording; never invent audio or override scored workbook work.
import { A2_DAY17_AUDIO_KEY, A2_DAY17_WARMUP, A2_DAY17_LISTENING, A2_DAY17_TRANSCRIPT } from "./a2Day17Opening.js";

const ENTRIES = {
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
  return Boolean(lesson && (stageId === "warmup" || (stageId === "knowledge" && lesson.listening)));
}
