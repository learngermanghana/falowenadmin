import { ADVANCED_READING_SOURCES } from "./advancedPresenterReadingSources.js";

// Teacher-only Lesen; uses existing Falowen reading passages where authored.
// For non-reading-cycle B2/C2 days, classroom excerpts draw on that day's
// canonical lesson examples, collocations and opposing C2 perspectives.
// No AI generation, answer API, network request or assessed student state.
function firstSentence(text = "") {
  return String(text || "").trim().split(/(?<=[.!?])\\s+/u)[0] || "";
}

function c1Checks(paragraphs) {
  return [
    {
      question: "Mit welcher zentralen Beobachtung beginnt der Text?",
      answer: firstSentence(paragraphs[0]),
      evidence: "Absatz 1 · erster Satz",
    },
    {
      question: "Welche weitere Überlegung führt der zweite Absatz ein?",
      answer: firstSentence(paragraphs[1]),
      evidence: "Absatz 2 · erster Satz",
    },
    {
      question: "Welchen Gedanken hält der Schluss fest?",
      answer: String(paragraphs.at(-1) || "").trim().split(/(?<=[.!?])\\s+/u).at(-1),
      evidence: "Letzter Absatz · letzter Satz",
    },
  ];
}

function b2ClassroomExcerpt(slide) {
  const models = (slide.teacherSupport?.modelExamplesDe || []).filter(Boolean);
  const phrases = (slide.keyPhrasesDe || []).slice(0, 4);
  if (models.length < 3 || phrases.length < 4) {
    throw new Error("Incomplete B2 model examples for Lesen: " + slide.assignmentId);
  }
  const topic = String(slide.title || "").split(" · ").slice(1).join(" · ") || slide.topic;
  const text = [
    models[0],
    models[1],
    `Bei ${topic} stehen mehrere Ansätze zur Diskussion: ${phrases[0]}, ${phrases[1]} und ${phrases[2]}.`,
    models[2],
    `Allerdings hängt die Wirksamkeit von ${phrases[3]} in der Praxis von den verfügbaren Ressourcen und den jeweiligen Rahmenbedingungen ab.`,
    "Deshalb sollten die Beteiligten kurzfristige Vorteile und langfristige Auswirkungen sorgfältig gegeneinander abwägen.",
  ];
  return {
    title: `Positionen prüfen · ${topic}`,
    paragraphs: [text.slice(0, 3).join(" "), text.slice(3).join(" ")],
    checks: [
      { question: "Welche Möglichkeit beschreibt der Text zu Beginn?", answer: models[0], evidence: "Satz 1" },
      { question: "Welche zweite Möglichkeit wird erläutert?", answer: models[1], evidence: "Satz 2" },
      { question: "Unter welchen Bedingungen kann der vierte Ansatz funktionieren?", answer: "Die Wirksamkeit hängt von Ressourcen und Rahmenbedingungen ab.", evidence: "Satz 5" },
    ],
  };
}

function c2ClassroomExcerpt(slide) {
  const perspectives = (slide.runtimePerspectivesDe || []).filter(Boolean);
  const examples = (slide.keyPhrasesDe || []).slice(0, 3).map((entry) => String(entry).split(" — ").slice(1).join(" — ")).filter(Boolean);
  if (perspectives.length < 3 || examples.length < 3) {
    throw new Error("Incomplete C2 topic perspectives for Lesen: " + slide.assignmentId);
  }
  const topic = String(slide.title || "").split(" · ").slice(1).join(" · ") || slide.topic;
  const paragraphs = [
    `Zum Thema „${topic}“ werden unterschiedliche Positionen vertreten. Eine erste Position lautet: „${perspectives[0]}“ Dazu wird folgendes Beispiel angeführt: ${examples[0]}`,
    `Demgegenüber steht eine andere Position: „${perspectives[1]}“ Hierzu lässt sich anführen: ${examples[1]}`,
    `Eine dritte Perspektive lautet: „${perspectives[2]}“ Dazu passt die Überlegung: ${examples[2]} Entscheidend ist, die Voraussetzungen und die Reichweite der verschiedenen Aussagen zu prüfen, statt sie pauschal zu übernehmen.`,
  ];
  return {
    title: `Perspektiven und Einwände · ${topic}`,
    paragraphs,
    checks: [
      { question: "Welche These vertritt die erste Position?", answer: perspectives[0], evidence: "Absatz 1" },
      { question: "Welche Gegenposition erscheint im zweiten Absatz?", answer: perspectives[1], evidence: "Absatz 2" },
      { question: "Welche dritte Perspektive muss in die Abwägung einbezogen werden?", answer: perspectives[2], evidence: "Absatz 3" },
    ],
  };
}

export function getAdvancedPresenterReadingLesson(slide = {}) {
  const level = String(slide.course || "").trim().toUpperCase();
  const day = Number(slide.dayNumber || 0);
  if (!["B2", "C1", "C2"].includes(level) || !Number.isInteger(day) || day < 1 || day > 28) return null;

  const original = ADVANCED_READING_SOURCES[level]?.[day];
  const source = original
    ? {
      ...original,
      checks: original.checks || c1Checks(original.paragraphs),
    }
    : (level === "B2" ? b2ClassroomExcerpt(slide) : c2ClassroomExcerpt(slide));
  const checks = source.checks;
  if (!source.paragraphs?.length || !checks?.length || checks.some((item) => !item.answer || !item.evidence)) {
    throw new Error("Incomplete advanced Lesen source: " + slide.assignmentId);
  }
  return {
    title: source.title || `Lesen · ${String(slide.title || "").split(" · ").slice(1).join(" · ")}`,
    textDe: source.paragraphs.join("\n\n"),
    readingPurpose: "Lesen Sie aufmerksam. Unterscheiden Sie Position, Begründung und Einschränkung; belegen Sie Ihre Antworten anhand des Textes.",
    checks: checks.map((item) => item.question),
    answers: checks.map((item) => item.answer + " · Textbeleg: " + item.evidence),
    evidence: checks.map((item) => item.evidence),
    sourceType: original ? "existing-workbook-passage" : "canonical-lesson-excerpt",
  };
}
