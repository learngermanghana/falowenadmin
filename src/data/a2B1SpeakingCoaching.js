// Build question-specific, teacher-controlled speaking support from verified lesson material.
// Never invent a model answer or carry a phrase/grammar correction across lessons.
const STOP_WORDS = new Set([
  "aber", "alle", "auch", "aus", "beim", "bist", "dann", "dass", "dein",
  "deine", "deinen", "dem", "den", "der", "des", "die", "dies", "diese",
  "diesem", "diesen", "dieser", "dieses", "dir", "doch", "eine", "einem",
  "einen", "einer", "eines", "erst", "etwas", "für", "gern", "habe",
  "haben", "hast", "heute", "hier", "ihre", "ihren", "immer", "kann",
  "kannst", "können", "man", "mein", "meine", "mich", "nach", "nicht",
  "noch", "oder", "schon", "sein", "seine", "sich", "sind", "über",
  "auch", "und", "uns", "wenn", "wer", "wird", "wir", "wirst", "wobei",
  "wollen", "würde", "würdest", "zum", "zur", "aber", "with", "that",
  "when", "from", "using", "which", "what", "should", "this", "after",
]);

const LANGUAGE_MARKERS = [
  "weil", "denn", "deshalb", "wenn", "falls", "obwohl", "während",
  "nachdem", "bevor", "damit", "dass", "sondern", "trotzdem", "ob",
  "konjunktiv", "komparativ", "superlativ", "perfekt", "präteritum",
  "passiv", "relativ", "genitiv", "dativ", "akkusativ", "infinitiv",
  "nebensatz", "hauptsatz", "modalverb", "wortstellung", "vergleich",
];

function contentWords(text = "") {
  return new Set((String(text || "").toLocaleLowerCase("de-DE").match(/[a-zäöüß]{4,}/g) || [])
    .filter((word) => !STOP_WORDS.has(word)));
}

function overlapScore(candidate = "", question = "", answer = "") {
  const words = contentWords(candidate);
  const questionWords = contentWords(question);
  const answerWords = contentWords(answer);
  return [...words].reduce((sum, word) =>
    sum + (questionWords.has(word) ? 3 : 0) + (answerWords.has(word) ? 2 : 0), 0);
}

function relevantSourcePhrase(phrases = [], question = "", answer = "") {
  const matches = (Array.isArray(phrases) ? phrases : [])
    .map((phrase, index) => ({
      phrase: String(phrase || "").trim(),
      index,
      score: overlapScore(phrase, question, answer),
    }))
    .filter((entry) => entry.phrase && entry.score >= 2)
    .sort((a, b) => b.score - a.score || a.index - b.index);
  return matches[0]?.phrase || "";
}

function sentenceStarter(answer = "") {
  const words = String(answer || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  // A short starter supports the learner without revealing the entire model.
  const maximum = Math.min(5, Math.max(2, words.length - 2));
  return words.slice(0, maximum).join(" ").replace(/[.,;:!?]+$/, "") + " …";
}

function referenceSentence(answer = "") {
  const source = String(answer || "").trim();
  if (!source) return "";
  const boundary = source.search(/[.!?](?=\s|$)/);
  return boundary < 0 ? source : source.slice(0, boundary + 1);
}

function relevantLanguageNote(notes = [], question = "", answer = "") {
  const markers = LANGUAGE_MARKERS.filter((marker) =>
    new RegExp(`\\b${marker}\\b`, "i").test(question + " " + answer));
  if (!markers.length) return "";
  const entries = (Array.isArray(notes) ? notes : [])
    .map((note, index) => ({
      note: String(note || "").trim(),
      index,
      score: markers.reduce((sum, marker) =>
        sum + (new RegExp(`\\b${marker}\\b`, "i").test(note) ? 1 : 0), 0),
    }))
    .filter((item) => item.note && item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);
  return entries[0]?.note || "";
}

export function buildA2B1SpeakingCoaching(slide = {}, questions = []) {
  const level = String(slide.course || "").trim().toUpperCase();
  if (!["A2", "B1"].includes(level)) return [];
  const models = Array.isArray(slide.speakingModels) ? slide.speakingModels : [];
  const phrases = Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : [];
  const grammarNotes = slide.teacherSupport?.grammarFocusEn || [];
  const mistakes = slide.teacherSupport?.commonMistakesEn || [];

  return (Array.isArray(questions) ? questions : []).map((question) => {
    const questionDe = String(question || "").trim();
    const matchingModel = models.find((model) =>
      String(model?.questionDe || "").trim() === questionDe);
    const answer = String(matchingModel?.modelAnswerDe || "").trim();
    if (!questionDe || !answer) return null;

    const phrase = relevantSourcePhrase(phrases, questionDe, answer);
    const starter = sentenceStarter(answer);
    const languageFocusEn = relevantLanguageNote(grammarNotes, questionDe, answer);
    const commonErrorEn = relevantLanguageNote(mistakes, questionDe, answer);

    return {
      questionDe,
      // All examples come from this question's own model and this lesson's Redemittel.
      hintDe: phrase
        ? `Benutze als Sprachhilfe: „${phrase}“`
        : `Möglicher Satzanfang: „${starter}“`,
      referenceIdeaDe: referenceSentence(answer),
      languageFocusEn,
      commonErrorEn,
      retryDe: phrase
        ? `Antworte noch einmal in eigenen Worten. Versuche dabei: „${phrase}“`
        : `Antworte noch einmal in eigenen Worten. Nutze den Satzanfang „${starter}“`,
    };
  });
}
