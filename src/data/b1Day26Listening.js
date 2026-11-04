// Teacher-supplied classroom recording and five-question key, 4 November 2026.
// Storage was uploaded under a2/, but its lesson identity is B1 Day 26.
// This is separate from the graded workbook Hören. No full transcript supplied.
export const B1_DAY26_AUDIO_KEY = "a2/day-26/reiseprobleme-und-losungen.mp3";
export const B1_DAY26_LISTENING_QUESTIONS = Object.freeze([
  {
    "prompt": "Warum ruft Thomas Frau Weber an?",
    "options": [
      "Weil der Flug nach Mallorca annulliert wurde.",
      "Weil das Hotel leider überbucht hat.",
      "Weil sich das Reisebüro vergrößert hat."
    ],
    "correctIndex": 1,
    "answer": "B) Weil das Hotel leider überbucht hat.",
    "evidence": "Ihr Zimmer ist für die ersten zwei Tage nicht verfügbar.",
    "hint": "Achte auf den Grund für den Anruf.",
    "explanation": "Hörbeleg: „Ihr Zimmer ist für die ersten zwei Tage nicht verfügbar.“"
  },
  {
    "prompt": "Wann reist Frau Weber ab?",
    "options": [
      "In drei Tagen",
      "In zwei Tagen",
      "Sofort"
    ],
    "correctIndex": 0,
    "answer": "A) In drei Tagen",
    "evidence": "Wir reisen in drei Tagen ab.",
    "hint": "Wann beginnt die Reise?",
    "explanation": "Hörbeleg: „Wir reisen in drei Tagen ab.“"
  },
  {
    "prompt": "Wo übernachtet Frau Weber in den ersten zwei Nächten?",
    "options": [
      "In einem Hostel im Stadtzentrum",
      "In einer privaten Ferienwohnung",
      "In einem Vier-Sterne-Hotel direkt nebenan"
    ],
    "correctIndex": 2,
    "answer": "C) In einem Vier-Sterne-Hotel direkt nebenan",
    "evidence": "in einem sehr guten Vier-Sterne-Hotel direkt nebenan",
    "hint": "Welche Unterkunft wird für die ersten beiden Nächte angeboten?",
    "explanation": "Hörbeleg: „in einem sehr guten Vier-Sterne-Hotel direkt nebenan“"
  },
  {
    "prompt": "Was bekommt Frau Weber als Entschädigung?",
    "options": [
      "Einen Gutschein über hundert Euro",
      "Eine Rückerstattung des gesamten Reisepreises",
      "Einen kostenlosen Mietwagen"
    ],
    "correctIndex": 0,
    "answer": "A) Einen Gutschein über hundert Euro",
    "evidence": "einen Gutschein über hundert Euro für Ihren nächsten Ausflug",
    "hint": "Welche Entschädigung wird genannt?",
    "explanation": "Hörbeleg: „einen Gutschein über hundert Euro für Ihren nächsten Ausflug“"
  },
  {
    "prompt": "Wie wird der Umzug in das eigentliche Hotel geregelt?",
    "options": [
      "Frau Weber muss sich ein Taxi nehmen.",
      "Das Reisebüro organisiert den Umzug am dritten Tag.",
      "Der Hotelmanager hilft beim Koffertragen."
    ],
    "correctIndex": 1,
    "answer": "B) Das Reisebüro organisiert den Umzug am dritten Tag.",
    "evidence": "Am dritten Tag organisieren wir dann den Umzug",
    "hint": "Wer organisiert den Hotelwechsel und wann?",
    "explanation": "Hörbeleg: „Am dritten Tag organisieren wir dann den Umzug“"
  }
].map(question => Object.freeze({ ...question, options: Object.freeze(question.options) })));

export const B1_DAY26_LISTENING = Object.freeze({
  level: "B1",
  day: 26,
  title: "Reiseprobleme und Lösungen · Hotel überbucht",
  audioKey: B1_DAY26_AUDIO_KEY,
  transcript: Object.freeze([]),
  questions: B1_DAY26_LISTENING_QUESTIONS,
  suggestedMinutes: 8,
  playbackNote: "Lies zuerst die fünf Fragen. Höre dann das Gespräch und wähle jeweils A, B oder C.",
  previewWords: ["überbucht", "die Unterkunft", "die Entschädigung", "der Gutschein"],
});
