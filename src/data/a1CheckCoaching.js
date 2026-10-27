// Beginner-facing scaffolding and teacher-only feedback for the existing A1
// grammar-diagnostic Presenter. No generated model answers, automatic marking,
// new classroom stages, or change to exam-readiness scoring.
const text = (value) => String(value || "").trim();

const OPEN_REFERENCE = /^(?:Accept (?:a |another |any |the )|For example,? accept |The teacher (?:judges|checks|should|accepts))/i;

function taskKind(question = "") {
  const q = text(question);
  if (/\b(?:korrigiere|correct(?: the)?|verbessere)\b/i.test(q)) return "correct";
  if (/\b(?:ordne|arrange|sortiere|put the words)\b/i.test(q)) return "order";
  if (/\b(?:ergänze|fill|complete|setze .+ ein)\b/i.test(q)) return "complete";
  if (/\b(?:buchstabiere|spell|buchstabierst)\b/i.test(q)) return "spell";
  if (/\b(?:frage|stelle eine frage|ask(?: a)? question|fragen bilden)\b/i.test(q)) return "ask";
  if (/\b(?:wie viele|how many)\b/i.test(q)) return "count";
  if (/\b(?:wann|uhrzeit|what time|which time)\b/i.test(q)) return "time";
  if (/\b(?:woher|where are you from|herkunft)\b/i.test(q)) return "origin";
  if (/\b(?:wohin|where to)\b/i.test(q)) return "direction";
  if (/\b(?:warum|why|begründe)\b/i.test(q)) return "reason";
  if (/\b(?:welch(?:e|er|es|en|em)?|which)\b/i.test(q)) return "choice";
  return "answer";
}

const SUPPORT = Object.freeze({
  correct: {
    hintDe: "Lies den Satz. Suche nur die Stelle, die nicht zur Regel passt.",
    checkDe: "Ist die falsche Stelle korrigiert, ohne die Bedeutung zu ändern?",
    retryDe: "Sag den ganzen korrigierten Satz noch einmal.",
  },
  order: {
    hintDe: "Finde zuerst das Verb. Baue dann einen vollständigen Satz.",
    checkDe: "Stehen die Wörter in einer verständlichen deutschen Satzfolge?",
    retryDe: "Baue den Satz noch einmal und lies ihn vollständig vor.",
  },
  complete: {
    hintDe: "Lies den Satz vor und setze die passende Form in die Lücke.",
    checkDe: "Passt die eingesetzte Form grammatisch und inhaltlich in den Satz?",
    retryDe: "Lies den vollständigen Satz noch einmal mit deiner Ergänzung.",
  },
  spell: {
    hintDe: "Sage die Buchstaben langsam und einzeln.",
    checkDe: "Wurden die gefragten Buchstaben in der richtigen Reihenfolge genannt?",
    retryDe: "Buchstabiere das Wort noch einmal langsam.",
  },
  ask: {
    hintDe: "Beginne mit einem Fragewort oder einem Verb und stelle eine kurze Frage.",
    checkDe: "Wurde wirklich eine passende Frage gestellt?",
    retryDe: "Stelle deine Frage noch einmal klar und vollständig.",
  },
  count: {
    hintDe: "Nenne die passende Zahl und sage, was du zählst.",
    checkDe: "Stimmt die genannte Zahl mit der konkreten Aufgabe überein?",
    retryDe: "Antworte erneut mit Zahl und Nomen.",
  },
  time: {
    hintDe: "Nenne einen konkreten Tag oder eine Uhrzeit, wenn die Frage danach fragt.",
    checkDe: "Ist die gefragte Zeitangabe eindeutig?",
    retryDe: "Antworte noch einmal mit einer klaren Zeitangabe.",
  },
  origin: {
    hintDe: "Benutze die kurze Struktur: Ich komme aus …",
    checkDe: "Beantwortet die Aussage die Frage nach der Herkunft?",
    retryDe: "Antworte noch einmal: Ich komme aus …",
  },
  direction: {
    hintDe: "Beschreibe das Ziel oder eine kurze Richtung.",
    checkDe: "Wurde die Richtung oder das Ziel klar genannt?",
    retryDe: "Beschreibe die Richtung noch einmal mit einem einfachen Satz.",
  },
  reason: {
    hintDe: "Antworte mit einer einfachen Begründung. Ein kurzer Satz genügt.",
    checkDe: "Hat die Antwort einen passenden Grund genannt?",
    retryDe: "Nenne einen konkreten Grund in einem kurzen Satz.",
  },
  choice: {
    hintDe: "Wähle die passende Form oder Möglichkeit aus der Frage.",
    checkDe: "Ist die gewählte Form oder Möglichkeit für diese Aufgabe richtig?",
    retryDe: "Nenne deine Wahl noch einmal und überprüfe sie an der Frage.",
  },
  answer: {
    hintDe: "Höre auf das Fragewort. Ein kurzer, klarer A1-Satz genügt.",
    checkDe: "Passt die Antwort genau zu dieser Frage und zum heutigen Lernziel?",
    retryDe: "Antworte erneut in einem kurzen vollständigen Satz.",
  },
});

export function buildA1CheckCoaching(check = {}, slide = {}) {
  // Some A1 lessons have no second check. Never dereference a null check.
  if (!check || typeof check !== "object" || !slide || typeof slide !== "object") return null;
  const questionDe = text(check.questionDe);
  if (!questionDe || String(slide.course || "").toUpperCase() !== "A1") return null;
  const kind = taskKind(questionDe);
  const rule = SUPPORT[kind];
  const answerDe = text(check.answerDe);
  const noteEn = text(check.noteEn);
  const openAnswer = !answerDe || OPEN_REFERENCE.test(answerDe);
  const authoredGrammar = Array.isArray(slide.teacherSupport?.grammarFocusEn)
    ? slide.teacherSupport.grammarFocusEn.map(text).filter(Boolean)
    : [];
  const authoredMistakes = Array.isArray(slide.teacherSupport?.commonMistakesEn)
    ? slide.teacherSupport.commonMistakesEn.map(text).filter(Boolean)
    : [];

  return {
    questionDe,
    kind,
    hintDe: rule.hintDe,
    checkDe: rule.checkDe,
    retryDe: rule.retryDe,
    // Feedback is a teacher checklist, not a finding about the learner.
    feedbackQuestionDe: "Hat die Antwort die Aufgabe „" + questionDe + "“ erfüllt?",
    flexibleAnswer: openAnswer,
    // Notes and pitfalls are from the selected lesson only, never other days.
    sourceNoteEn: noteEn,
    lessonGrammarEn: authoredGrammar[0] || "",
    lessonPitfallEn: authoredMistakes[0] || "",
  };
}
