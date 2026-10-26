// Reusable YouTube music lesson. The song is a teacher-led teaching aid,
// not the separately graded workbook Hören assignment.
export const B1_DAY24_MUSIC = Object.freeze({
  level: "B1",
  day: 24,
  mediaType: "music",
  youtubeId: "-46siG9FrfE",
  title: "Weniger ist mehr · Konsum und Nachhaltigkeit",
  suggestedMinutes: 8,
  introQuestion: "Was bedeutet „Weniger ist mehr“?",
  playbackNote: "Seht euch das Musikvideo an. Achtet darauf, wie der Sänger Konsum und Verantwortung miteinander verbindet.",
  previewWords: ["bewusst einkaufen", "der Konsum", "die Nachhaltigkeit", "Ressourcen verschwenden"],
  // Excerpts reproduce the words used in the published lyrics video.
  readingSections: [
    {
      label: "Werbung und Kaufentscheidungen",
      lines: [
        "Bevor ich etwas kaufe, denk ich zweimal nach,",
        "weil ich nicht für jeden Trend mein Geld ausgebe.",
        "Obwohl es billig ist, muss es nicht immer sein.",
      ],
    },
    {
      label: "Kleidung und Reparatur",
      lines: [
        "Meine alte Jacke ist noch richtig gut,",
        "statt sie wegzuwerfen, trag ich sie mit Mut.",
        "Ist mein Fahrrad kaputt, reparier ich es.",
      ],
    },
    {
      label: "Nachhaltigkeit im Alltag",
      lines: [
        "Ich nehme meine Tasche mit in den Laden,",
        "damit wir weniger Plastik haben.",
        "Obst aus der Region, das kauf ich gern.",
      ],
    },
    {
      label: "Verantwortung für morgen",
      lines: [
        "Wir müssen nicht perfekt sein,",
        "doch jeder Schritt zählt, auch ein kleiner.",
        "Die Erde gehört uns nicht allein.",
      ],
    },
  ],
  // Each cue is grounded in the corrected lyrics of this exact song.
  // Cue times refer to the start of the relevant sung evidence.
  questions: [
    {
      prompt: "Was kritisiert der Sänger am Einfluss der Werbung?",
      options: [
        "Dass Werbung häufig Wünsche auslöst, die man nicht automatisch erfüllen muss.",
        "Dass die Werbung grundsätzlich falsche Informationen enthält.",
        "Dass die Menschen wegen der Werbung nur noch online einkaufen.",
      ],
      correctIndex: 0,
      answer: "Dass Werbung häufig Wünsche auslöst, die man nicht automatisch erfüllen muss.",
      timestamp: 32,
      evidence: "Bevor ich etwas kaufe, denk ich zweimal nach, weil ich nicht für jeden Trend mein Geld ausgebe.",
      hint: "Es geht um den Unterschied zwischen einem Wunsch und einem wirklichen Bedarf.",
      explanation: "Der Sänger lehnt Werbung nicht vollständig ab. Er will sich nicht von jedem Trend zum Kaufen verleiten lassen.",
    },
    {
      prompt: "Warum passen die Beispiele mit der Jacke und dem Fahrrad zusammen?",
      options: [
        "Beide Dinge sollen möglichst teuer verkauft werden.",
        "Beide zeigen, dass man brauchbare Gegenstände länger nutzen kann.",
        "Beide zeigen, dass gebrauchte Dinge immer besser sind als neue.",
      ],
      correctIndex: 1,
      answer: "Beide zeigen, dass man brauchbare Gegenstände länger nutzen kann.",
      timestamp: 81,
      evidence: "Statt sie wegzuwerfen, trag ich sie mit Mut. Ist mein Fahrrad kaputt, reparier ich es.",
      hint: "Welche Alternative zu einem Neukauf wird in beiden Fällen gewählt?",
      explanation: "Weitertragen und Reparieren können Ressourcen schonen. Das Lied behauptet nicht, dass ein Neukauf grundsätzlich falsch ist.",
    },
    {
      prompt: "Welche Idee verbindet die Stofftasche mit regionalem Obst?",
      options: [
        "Nachhaltige Entscheidungen sind nur für wohlhabende Menschen möglich.",
        "Wer regional einkauft, produziert überhaupt keinen Müll mehr.",
        "Auch gewöhnliche Kaufentscheidungen können bewusster getroffen werden.",
      ],
      correctIndex: 2,
      answer: "Auch gewöhnliche Kaufentscheidungen können bewusster getroffen werden.",
      timestamp: 91,
      evidence: "Ich nehme meine Tasche mit in den Laden, damit wir weniger Plastik haben. Obst aus der Region, das kauf ich gern.",
      hint: "Beide Beispiele beziehen sich auf kleine Handlungen beim Einkauf.",
      explanation: "Der Text verbindet weniger Verpackung und bewusst gewählte Produkte mit alltäglichem Konsum.",
    },
    {
      prompt: "Wie ist der Satz „Obwohl es billig ist, muss es nicht immer sein“ zu verstehen?",
      options: [
        "Ein niedriger Preis ist allein noch kein guter Kaufgrund.",
        "Günstige Produkte haben immer eine schlechte Qualität.",
        "Man sollte grundsätzlich nur teure Waren kaufen.",
      ],
      correctIndex: 0,
      answer: "Ein niedriger Preis ist allein noch kein guter Kaufgrund.",
      timestamp: 37,
      evidence: "Obwohl es billig ist, muss es nicht immer sein.",
      hint: "Was stellt der Sänger mit „obwohl“ gegenüber?",
      explanation: "Der Preis kann attraktiv sein, aber entscheidend ist auch, ob man das Produkt wirklich braucht.",
    },
    {
      prompt: "Warum betont das Lied, dass wir nicht perfekt sein müssen?",
      options: [
        "Weil einzelne Menschen überhaupt nichts verändern können.",
        "Weil selbst kleine, realistische Veränderungen einen Wert haben.",
        "Weil Umweltschutz nur die Aufgabe der Politik ist.",
      ],
      correctIndex: 1,
      answer: "Weil selbst kleine, realistische Veränderungen einen Wert haben.",
      timestamp: 216,
      evidence: "Wir müssen nicht perfekt sein, doch jeder Schritt zählt, auch ein kleiner.",
      hint: "Der Gegensatz liegt zwischen Perfektion und kleinen Schritten.",
      explanation: "Das Lied ermutigt zu machbaren Veränderungen statt zu unrealistischen Perfektionsansprüchen.",
    },
  ],
});

export function musicTimestamp(seconds = 0) {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export function musicMomentUrl(youtubeId, seconds = 0) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(String(youtubeId || ""))) return "";
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  return `https://www.youtube.com/watch?v=${youtubeId}&t=${value}s`;
}
