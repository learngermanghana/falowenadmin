// Original exam-style reading mini tasks. NOT official Goethe questions or past exam papers.
export const CHALLENGE_EXAMS = [
  {
    "level": "A1",
    "topic": "Train announcement",
    "stimulus": "Der Zug nach Bonn fährt heute um 10:45 Uhr von Gleis 3.",
    "prompt": "When does the train leave?",
    "options": [
      "Um 10:15 Uhr",
      "Um 10:45 Uhr"
    ],
    "answerIndex": 1,
    "explanation": "The notice says “um 10:45 Uhr”."
  },
  {
    "level": "A1",
    "topic": "Opening hours",
    "stimulus": "Bäckerei Müller: Montag bis Freitag 7–18 Uhr. Sonntag geschlossen.",
    "prompt": "Is the bakery open on Sunday?",
    "options": [
      "Nein",
      "Ja"
    ],
    "answerIndex": 0,
    "explanation": "“Sonntag geschlossen” means closed on Sunday."
  },
  {
    "level": "A1",
    "topic": "Simple email",
    "stimulus": "Hallo Lina, ich komme am Samstag um 15 Uhr. Liebe Grüße, Tom.",
    "prompt": "When will Tom arrive?",
    "options": [
      "Am Sonntag",
      "Am Samstag"
    ],
    "answerIndex": 1,
    "explanation": "Tom says “am Samstag um 15 Uhr”."
  },
  {
    "level": "A1",
    "topic": "Supermarket sign",
    "stimulus": "Heute: Bananen 1,50 € pro Kilo. Äpfel 2,00 € pro Kilo.",
    "prompt": "Which fruit is cheaper per kilo?",
    "options": [
      "Bananen",
      "Äpfel"
    ],
    "answerIndex": 0,
    "explanation": "Bananas cost 1.50 euros; apples cost 2 euros."
  },
  {
    "level": "A1",
    "topic": "Appointment",
    "stimulus": "Ihr Termin beim Arzt ist am Dienstag um 8:30 Uhr.",
    "prompt": "Where is the appointment?",
    "options": [
      "Beim Zahnarzt",
      "Beim Arzt"
    ],
    "answerIndex": 1,
    "explanation": "The notice says “beim Arzt”."
  },
  {
    "level": "A2",
    "topic": "Appointment change",
    "stimulus": "Der Termin am Mittwoch fällt aus. Bitte kommen Sie am Donnerstag um 14 Uhr.",
    "prompt": "When is the new appointment?",
    "options": [
      "Donnerstag",
      "Mittwoch"
    ],
    "answerIndex": 0,
    "explanation": "The Wednesday appointment is cancelled; Thursday is the new date."
  },
  {
    "level": "A2",
    "topic": "Class schedule",
    "stimulus": "Der Deutschkurs beginnt jeden Abend um 18 Uhr, außer freitags. Dann beginnt er um 17 Uhr.",
    "prompt": "What time does Friday's class start?",
    "options": [
      "18 Uhr",
      "17 Uhr"
    ],
    "answerIndex": 1,
    "explanation": "Friday is the exception and starts at 17:00."
  },
  {
    "level": "A2",
    "topic": "Flat advertisement",
    "stimulus": "2-Zimmer-Wohnung, 680 € warm, mit Balkon. Haustiere sind leider nicht erlaubt.",
    "prompt": "Are pets allowed?",
    "options": [
      "Nein",
      "Ja"
    ],
    "answerIndex": 0,
    "explanation": "“Haustiere sind ... nicht erlaubt” forbids pets."
  },
  {
    "level": "A2",
    "topic": "Travel message",
    "stimulus": "Liebe Sara, mein Bus hatte Verspätung. Ich komme erst um Viertel nach sieben.",
    "prompt": "When will the writer arrive?",
    "options": [
      "Um sieben Uhr",
      "Um 19:15 Uhr"
    ],
    "answerIndex": 1,
    "explanation": "“Viertel nach sieben” means 7:15."
  },
  {
    "level": "A2",
    "topic": "Job application",
    "stimulus": "Bitte schicken Sie Ihren Lebenslauf bis zum 30. November per E-Mail.",
    "prompt": "What must applicants send?",
    "options": [
      "Den Lebenslauf",
      "Den Ausweis"
    ],
    "answerIndex": 0,
    "explanation": "“Lebenslauf” is the CV."
  },
  {
    "level": "B1",
    "topic": "Community notice",
    "stimulus": "Wegen Reparaturarbeiten bleibt das Schwimmbad von Montag bis Mittwoch geschlossen. Ab Donnerstag ist es wieder geöffnet.",
    "prompt": "When does the pool reopen?",
    "options": [
      "Am Mittwoch",
      "Am Donnerstag"
    ],
    "answerIndex": 1,
    "explanation": "“Ab Donnerstag” indicates reopening on Thursday."
  },
  {
    "level": "B1",
    "topic": "Office memo",
    "stimulus": "Ab nächster Woche findet die Teamsitzung online statt. Der Termin bleibt jedoch unverändert.",
    "prompt": "What is changing?",
    "options": [
      "Der Ort der Sitzung",
      "Die Uhrzeit"
    ],
    "answerIndex": 0,
    "explanation": "The meeting moves online; the time stays unchanged."
  },
  {
    "level": "B1",
    "topic": "Customer complaint",
    "stimulus": "Meine Bestellung ist angekommen, aber ein Teil fehlt. Könnten Sie mir bitte den fehlenden Artikel nachsenden?",
    "prompt": "What does the customer want?",
    "options": [
      "Eine Rückerstattung für alles",
      "Den fehlenden Artikel"
    ],
    "answerIndex": 1,
    "explanation": "The customer asks for the missing item to be sent."
  },
  {
    "level": "B1",
    "topic": "Internship notice",
    "stimulus": "Die Stelle richtet sich an Bewerberinnen und Bewerber, die bereits erste praktische Erfahrungen gesammelt haben.",
    "prompt": "Who should apply?",
    "options": [
      "Menschen mit erster Praxiserfahrung",
      "Nur erfahrene Führungskräfte"
    ],
    "answerIndex": 0,
    "explanation": "The notice asks for some initial practical experience."
  },
  {
    "level": "B1",
    "topic": "Train update",
    "stimulus": "Die Regionalbahn wird wegen einer Störung durch Busse ersetzt. Die Fahrzeit verlängert sich um etwa 20 Minuten.",
    "prompt": "What should travellers expect?",
    "options": [
      "Eine kürzere Reise",
      "Etwa 20 Minuten mehr"
    ],
    "answerIndex": 1,
    "explanation": "Replacement buses increase travel time by about 20 minutes."
  },
  {
    "level": "B2",
    "topic": "Research summary",
    "stimulus": "Die Befragung zeigt einen Anstieg der Nutzung öffentlicher Verkehrsmittel. Über die Ursachen lässt sich daraus allein jedoch nichts Sicheres ableiten.",
    "prompt": "What can the survey establish?",
    "options": [
      "Die Nutzung ist gestiegen",
      "Die Ursache ist eindeutig"
    ],
    "answerIndex": 0,
    "explanation": "The report confirms an increase, not its cause."
  },
  {
    "level": "B2",
    "topic": "Workplace policy",
    "stimulus": "Die Regelung gilt zunächst für sechs Monate und wird anschließend auf ihre Wirksamkeit überprüft.",
    "prompt": "What happens after six months?",
    "options": [
      "Die Regelung wird automatisch dauerhaft",
      "Die Wirkung wird überprüft"
    ],
    "answerIndex": 1,
    "explanation": "After the trial period, the impact is reviewed."
  },
  {
    "level": "B2",
    "topic": "Cultural review",
    "stimulus": "Obwohl die Ausstellung gut besucht war, fiel die Resonanz der Fachpresse gemischt aus.",
    "prompt": "How did critics respond?",
    "options": [
      "Unterschiedlich",
      "Durchweg positiv"
    ],
    "answerIndex": 0,
    "explanation": "“Gemischt” means mixed reviews."
  },
  {
    "level": "B2",
    "topic": "Environmental report",
    "stimulus": "Die vorgeschlagene Maßnahme könnte Emissionen reduzieren; ihre tatsächliche Wirkung hängt jedoch von der Umsetzung ab.",
    "prompt": "What determines the actual result?",
    "options": [
      "Nur die ursprüngliche Idee",
      "Die konkrete Umsetzung"
    ],
    "answerIndex": 1,
    "explanation": "The report explicitly links the effect to implementation."
  },
  {
    "level": "B2",
    "topic": "Policy discussion",
    "stimulus": "Der Vorschlag wurde nicht grundsätzlich abgelehnt. Kritisiert wurde vielmehr, dass ein klarer Finanzierungsplan fehlte.",
    "prompt": "What was the main criticism?",
    "options": [
      "Die Finanzierung war unklar",
      "Das Ziel wurde abgelehnt"
    ],
    "answerIndex": 0,
    "explanation": "The missing funding plan was criticized, not the underlying objective."
  }
];
