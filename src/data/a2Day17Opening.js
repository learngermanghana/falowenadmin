// A2 Day 17 only. Teacher-led opening replaces the warm-up and Wissensimpuls
// presentation stages; the scored learner workbook remains unchanged.
export const A2_DAY17_AUDIO_KEY = "a2/day-17/apotheken-detektiv.mp3";

export const A2_DAY17_WARMUP = Object.freeze([
  {
    label: "Was sagst du?", minutes: 2,
    context: "Du bist in einer Apotheke. Du hast seit zwei Tagen Husten.",
    prompt: "Welche Frage ist höflich und passend?",
    options: ["Sie geben mir jetzt Medikamente!", "Können Sie mir bitte etwas empfehlen?", "Ich muss alle Medikamente kaufen."],
    correctIndex: 1,
    answer: "Können Sie mir bitte etwas empfehlen?",
    explanation: "Mit „Können Sie mir bitte ...?“ fragst du höflich.",
    teacherHint: "Lass zuerst drei Schüler ihre Wahl begründen. Frage anschließend nach einer weiteren höflichen Formulierung.",
  },
  {
    label: "Modalverben wählen", minutes: 2,
    context: "Drei Personen ergänzen jeweils einen Satz.",
    prompt: "Setze muss, können oder soll richtig ein.",
    lines: [
      "1. Ich ___ heute zum Arzt gehen. (Notwendigkeit)",
      "2. ___ Sie mir bitte helfen? (höfliche Bitte)",
      "3. ___ ich die Tabletten nach dem Essen nehmen? (Rat)",
    ],
    answer: "1. muss    2. Können    3. Soll",
    explanation: "müssen = Notwendigkeit · können = höfliche Bitte / Möglichkeit · sollen = Rat.",
    teacherHint: "Drei Schüler ergänzen die Sätze; ein vierter erklärt die Bedeutungsunterschiede.",
  },
  {
    label: "Fehlerdetektiv", minutes: 2,
    context: "Zwei Sätze, zwei Wortstellungsfehler.",
    prompt: "Korrigiere die Sätze.",
    lines: [
      "1. Soll ich nehmen die Tabletten nach dem Essen?",
      "2. Ich muss gehen heute in die Apotheke.",
    ],
    answer: "1. Soll ich die Tabletten nach dem Essen nehmen?\n2. Ich muss heute in die Apotheke gehen.",
    explanation: "Das konjugierte Modalverb steht vorne, der Infinitiv am Satzende.",
    teacherHint: "Zwei Schüler korrigieren je einen Satz. Der dritte erklärt die Position des Infinitivs.",
  },
  {
    label: "Apotheken-Mission", minutes: 4,
    context: "Eine Kundin hat Halsschmerzen und bittet höflich um Informationen.",
    prompt: "Drei Teams formulieren je eine passende Frage oder Aussage.",
    lines: [
      "Team A: Bitte höflich um eine Empfehlung mit können.",
      "Team B: Frage zur Anwendung mit sollen.",
      "Team C: Sage, was du zuerst tun musst, mit müssen.",
    ],
    answer: "A: Können Sie mir bitte etwas gegen Halsschmerzen empfehlen?\nB: Soll ich die Hinweise auf der Packung lesen?\nC: Ich muss zuerst die Angaben auf der Packung prüfen.",
    explanation: "Vergleicht die drei Modalverben. Es gibt mehrere mögliche, sprachlich richtige Antworten.",
    teacherHint: "45 Sekunden Denkzeit; Teams nacheinander sprechen lassen. Keine Dosierung erfinden.",
  },
]);

// Transcript is kept exactly aligned with the teacher-provided audio script.
export const A2_DAY17_TRANSCRIPT = Object.freeze([
  ["A", "Guten Tag! Kann ich Ihnen helfen?"],
  ["B", "Guten Tag. Ja, bitte. Ich brauche etwas gegen Halsschmerzen und Husten. Seit zwei Tagen fühle ich mich nicht besonders gut."],
  ["A", "Das tut mir leid. Haben Sie auch Fieber oder Kopfschmerzen?"],
  ["B", "Nein, zum Glück nicht. Ich habe nur Husten und Halsschmerzen. Besonders am Abend muss ich oft husten."],
  ["A", "Verstehe. Haben Sie schon etwas dagegen genommen?"],
  ["B", "Ja, ich habe gestern einen warmen Tee getrunken, aber das hat leider nicht viel geholfen."],
  ["A", "Gut. Nehmen Sie zurzeit andere Medikamente?"],
  ["B", "Nein, im Moment nehme ich keine Medikamente."],
  ["A", "Dann könnte dieses Mittel für Sie geeignet sein. Ich empfehle Ihnen diese Lutschtabletten und diesen Hustensaft."],
  ["B", "Vielen Dank. Wie oft soll ich den Hustensaft einnehmen?"],
  ["A", "Beachten Sie bitte die Dosierungsangaben auf der Packung. Wenn Sie Fragen dazu haben, erkläre ich Ihnen die Anwendung gern."],
  ["B", "Und wie lange soll ich den Hustensaft nehmen?"],
  ["A", "Wenn Ihre Beschwerden nicht besser werden oder schlimmer werden, sollten Sie zum Arzt gehen."],
  ["B", "Alles klar. Kann ich die Lutschtabletten auch unterwegs nehmen?"],
  ["A", "Ja, aber beachten Sie bitte auch hier die Hinweise auf der Packung."],
  ["B", "Gut, vielen Dank für Ihre Hilfe. Kann ich mit Karte bezahlen?"],
  ["A", "Ja, natürlich. Das macht zusammen zwölf Euro fünfzig."],
  ["B", "Hier ist meine Karte."],
  ["A", "Vielen Dank. Hier ist Ihr Kassenbon. Gute Besserung!"],
  ["B", "Danke schön. Auf Wiedersehen!"],
  ["A", "Auf Wiedersehen!"],
]);

export const A2_DAY17_LISTENING = Object.freeze([
  { prompt: "Seit wann hat der Kunde Beschwerden?", options: ["Seit zwei Tagen.", "Seit einer Woche.", "Erst seit heute."], correctIndex: 0, answer: "Seit zwei Tagen.", hint: "Höre auf „Seit zwei Tagen fühle ich mich ...“." },
  { prompt: "Hat der Kunde auch Fieber?", options: ["Ja, und Kopfschmerzen.", "Nein, zum Glück nicht.", "Das sagt er nicht."], correctIndex: 1, answer: "Nein, zum Glück nicht.", hint: "Die Apothekerin fragt auch nach Kopfschmerzen." },
  { prompt: "Was hat der Kunde gestern versucht?", options: ["Einen Arztbesuch.", "Warme Milch.", "Einen warmen Tee."], correctIndex: 2, answer: "Einen warmen Tee.", hint: "Achte auf „gestern“." },
  { prompt: "Welche zwei Produkte empfiehlt die Apothekerin?", options: ["Lutschtabletten und Hustensaft.", "Nasenspray und Pflaster.", "Vitamine und Creme."], correctIndex: 0, answer: "Lutschtabletten und Hustensaft.", hint: "Zwei Produkte werden direkt genannt." },
  { prompt: "Was sagt die Apothekerin zur Dosierung?", options: ["Sie nennt drei Löffel täglich.", "Der Kunde soll die Packungsangaben beachten.", "Er soll alle Tabletten sofort nehmen."], correctIndex: 1, answer: "Er soll die Dosierungsangaben auf der Packung beachten.", hint: "Im Gespräch wird keine konkrete Dosierung genannt." },
  { prompt: "Wie viel bezahlt der Kunde?", options: ["12,15 €", "20,50 €", "12,50 €"], correctIndex: 2, answer: "Zwölf Euro fünfzig, mit Karte.", hint: "Achte auf den Preis am Ende des Gesprächs." },
]);
