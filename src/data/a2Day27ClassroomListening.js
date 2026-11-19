const transcript = [
  ["A", "Hallo, hier ist Anna. Hast du kurz Zeit?"],
  ["B", "Hallo! Ja, ich höre. Worum geht es?"],
  ["A", "Ich habe ein Problem mit meinem neuen Smartphone und der Messenger-App."],
  ["B", "Was genau funktioniert denn nicht bei der digitalen Kommunikation?"],
  ["A", "Ich kann keine Sprachnachrichten senden. Die App zeigt immer eine Fehlermeldung."],
  ["B", "Ah, das hatte ich letzte Woche auch. Hast du die App schon aktualisiert?"],
  ["A", "Nein, das habe ich vergessen. Wo kann ich das machen?"],
  ["B", "Geh einfach in den App Store, suche nach dem Messenger und klicke auf Update."],
  ["A", "Moment, ich schaue nach... Ja, hier steht 'Aktualisieren'. Ich drücke jetzt darauf."],
  ["B", "Sehr gut. Lade die neue Version herunter und starte das Handy danach am besten neu."],
  ["A", "Okay, das Update ist jetzt fertig. Ich starte das Telefon neu."],
  ["B", "Perfekt. Probiere danach eine Sprachnachricht zu senden. Es klappt bestimmt wieder!"],
  ["A", "Danke für deine schnelle Hilfe, Lukas!"],
  ["B", "Gerne, Anna. Viel Erfolg! Tschüss!"],
];

const questions = [
  {
    prompt: "Was kann Anna mit ihrer Messenger-App nicht machen?",
    options: ["Fotos öffnen.", "Sprachnachrichten senden.", "Kontakte speichern."],
    correctIndex: 1,
    evidence: transcript[4][1],
  },
  {
    prompt: "Wann hatte Lukas das gleiche Problem?",
    options: ["Letzte Woche.", "Heute Morgen.", "Vor einem Monat."],
    correctIndex: 0,
    evidence: transcript[5][1],
  },
  {
    prompt: "Wo soll Anna nach dem Update suchen?",
    options: ["In ihren E-Mails.", "Auf der Webseite der Schule.", "Im App Store."],
    correctIndex: 2,
    evidence: transcript[7][1],
  },
  {
    prompt: "Auf welche Schaltfläche drückt Anna?",
    options: ["„Löschen“.", "„Aktualisieren“.", "„Teilen“."],
    correctIndex: 1,
    evidence: transcript[8][1],
  },
  {
    prompt: "Was macht Anna direkt nach dem Update?",
    options: ["Sie startet das Telefon neu.", "Sie ruft den Kundenservice an.", "Sie kauft ein neues Handy."],
    correctIndex: 0,
    evidence: transcript[10][1],
  },
];
export const A2_DAY27_CLASSROOM_LISTENING = {
  level: 'A2', day: 27, title: 'Digitale Kommunikation · Anna und Lukas',
  audioKey: 'a2/day-27/digitale-kommunikation.mp3', suggestedMinutes: 7,
  playbackNote: 'Lies zuerst die Fragen. Höre das Gespräch und wähle die richtige Antwort.',
  previewWords: ['die Sprachnachricht', 'die Fehlermeldung', 'aktualisieren', 'neu starten'],
  transcript,
  questions: questions.map(question => ({
    ...question,
    answer: question.options[question.correctIndex],
    explanation: question.evidence,
  })),
};
