// Pure, projector-safe presentation helpers. Class IDs are Firestore keys,
// not names; prefer the human-readable attendance session label.
export function getCheckinDisplayClassName(sessionId = "", className = "") {
  const session = String(sessionId || "").trim();
  const match = session.match(/^(.+?)_(?:20\d{2}-\d{2}-\d{2})(?:_|$)/);
  const sessionName = String(match?.[1] || "").replace(/\s+Klasse$/i, "").trim();
  if (/\b(?:A1|A2|B1|B2|C1|C2)\b/i.test(sessionName) && sessionName.length <= 70) {
    return sessionName;
  }
  const candidate = String(className || "").trim();
  if (candidate && !/^[A-Za-z0-9_-]{18,}$/.test(candidate) && candidate.length <= 70) {
    return candidate.replace(/\s+Klasse$/i, "").trim();
  }
  return "deiner Deutschklasse";
}

// This is a non-scored pre-class prompt; never replace a workbook assessment.
const PRACTICE = Object.freeze({
  "A1-0.2": Object.freeze({
    prompt: "Ich ___ Felix.",
    question: "Welches Verb passt?",
    choices: Object.freeze(["bin", "bist", "ist"]),
    correctIndex: 0,
    explanation: "ich bin · du bist · er/sie/es ist",
  }),
});

export function getCheckinLobbyPractice(assignmentId = "") {
  return PRACTICE[String(assignmentId || "").trim()] || null;
}
