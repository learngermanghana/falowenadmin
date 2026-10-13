// Advisory structure review for A1–B1 Schreiben. This is *not* a keyword
// scoring rubric: equivalent German phrases, grammar and the actual task
// points must be evaluated by the examiner/tutor, not exact template matches.
const normalize = (value = "") => String(value || "").trim();
const matches = (value, pattern) => pattern.test(normalize(value));

function letterParts(source) {
  const text = normalize(source);
  const lines = text.split(/\n+/).map(line => line.trim()).filter(Boolean);
  return { text, lines, wordCount: text.split(/\s+/).filter(Boolean).length };
}

function makeCheck(label, observed, note) {
  return { label, status: observed ? "observed" : "review", note };
}

function detectKind(task = {}) {
  const level = String(task.level || "").trim().toUpperCase();
  if (!["A1", "A2", "B1"].includes(level)) return "";
  const type = String(task.textType || "").toLowerCase();
  if (level === "A1" && task.letterWriting && String(task.register || "").toLowerCase() === "unspecified") return "mixed";
  if (level === "B1" && /opinion|essay|forum|comment|discussion/.test(type)) return "opinion";
  if (/email|letter|message|complaint|invitation/.test(type) || task.letterWriting) {
    const formal = String(task.register || "").toLowerCase() === "formal";
    return formal ? "formal" : "informal";
  }
  return "";
}

const LETTER_START = /^(?:hallo|liebe[rn]?|guten tag|sehr geehrt(?:e|er|en)?)\b/i;
const FORMAL_GREETING = /^sehr geehrt(?:e|er|en)?\b|^guten tag\b/i;
const INFORMAL_GREETING = /^(?:hallo|liebe[rn]?)\b/i;
const FORMAL_CLOSING = /\b(?:mit freundlichen gr(?:ü|u)(?:ß|ss)en|freundliche gr(?:ü|u)(?:ß|ss)e|hochachtungsvoll)\b/i;
const INFORMAL_CLOSING = /\b(?:liebe gr(?:ü|u)(?:ß|ss)e|viele gr(?:ü|u)(?:ß|ss)e|herzliche gr(?:ü|u)(?:ß|ss)e|bis bald|dein(?:e)?\s+\w+)\b/i;
const REASON = /\b(?:ich schreibe|ich melde mich|ich wende mich|vielen dank f(?:ü|u)r|ich m(?:ö|o)chte|ich wollte|der grund|wegen|hiermit|ich interessiere mich|ich habe|leider|entschuldigen sie|tut mir leid)\b/i;
const ESSAY_OPINION = /\b(?:meiner meinung nach|ich (?:bin der meinung|finde|denke|glaube)|aus meiner sicht|meines erachtens|meiner ansicht nach|ich halte|f(?:ü|u)r mich|ich pers(?:ö|o)nlich)\b/i;
const ESSAY_REASON = /\b(?:weil|denn|deshalb|daher|aus diesem grund|da |zum beispiel|beispielsweise|das liegt daran|ein grund|dazu kommt)\b/i;
const ESSAY_BALANCE = /\b(?:einerseits|andererseits|vorteil|nachteil|allerdings|jedoch|trotzdem|auf der anderen seite|dagegen|hingegen|problem|schwierigkeit|positiv|negativ|sowohl|aber)\b/i;
const ESSAY_END = /\b(?:zusammenfassend|abschlie(?:ß|ss)end|zum schluss|insgesamt|alles in allem|letztendlich|im ergebnis|mein fazit)\b/i;

export function evaluateWritingStructureReview(task = {}, source = "") {
  const kind = detectKind(task);
  if (!kind || !normalize(source)) return null;
  const level = String(task.level || "").toUpperCase();
  const {text, lines, wordCount} = letterParts(source);
  const bodies = lines.filter(line => !/^(?:teil\s*[1-4]|part\s*[1-4])\b/i.test(line));
  const paragraphs = text.split(/\n\s*\n+/).map(item => item.trim()).filter(Boolean);
  const shortA1 = level === "A1";
  const checks = [];

  if (kind === "mixed") {
    checks.push(makeCheck("Informal letter in Teil 1", null, "Assess an informal greeting, three task points and an appropriate friendly ending in the first letter."));
    checks.push(makeCheck("Formal letter in Teil 2", null, "Assess a formal greeting, all published task points and a formal ending in the second letter."));
  } else if (kind === "opinion") {
    checks.push(
      makeCheck("Introduction and topic", null, "Read the opening and confirm it introduces the assigned topic, not merely a generic statement."),
      makeCheck("Own opinion", matches(text, ESSAY_OPINION), "A clear personal position is required; equivalent phrasing is valid."),
      makeCheck("Arguments, reasons and examples", matches(text, ESSAY_REASON), "Look for reasons and a relevant example supporting the stated position."),
      makeCheck("Advantages, disadvantages or counterview", matches(text, ESSAY_BALANCE), "Check the comparison or counterview *if the task asks for it*. It need not use Einerseits/Andererseits."),
      makeCheck("Conclusion", matches(text, ESSAY_END), "Look for a final conclusion in the student's own words; no mandatory closing phrase."),
    );
  } else {
    const formal = kind === "formal";
    checks.push(
      makeCheck("Appropriate salutation", bodies.some(line => matches(line, formal ? FORMAL_GREETING : INFORMAL_GREETING)), "The greeting must match the recipient. A different correct greeting earns the same credit."),
      makeCheck("Opening / reason for writing", matches(text, REASON), "A clear purpose is needed, but 'Ich schreibe dir/Ihnen, weil …' is a learning model, not compulsory wording."),
      makeCheck("Required content points", null, "Use the separate task-point evidence below; phrases such as Erstens, Zweitens and Außerdem are optional."),
      makeCheck("Appropriate closing", matches(text, formal ? FORMAL_CLOSING : INFORMAL_CLOSING), "Check a natural, register-appropriate sign-off, without insisting on one exact formula."),
    );
    if (!shortA1) checks.push(makeCheck(
      "Readable organization",
      paragraphs.length >= 2 || matches(text, /\b(?:erstens|zweitens|au(?:ß|ss)erdem|zun(?:ä|a)chst|danach|schlie(?:ß|ss)lich|zum schluss|und|aber|weil|deshalb)\b/i),
      "Paragraph breaks and linking language help at A2/B1, but no particular connector is mandatory.",
    ));
  }

  return {
    level,
    kind,
    label: kind === "opinion" ? "B1 opinion essay" : kind === "formal" ? "Formal letter or email" : kind === "mixed" ? "A1 informal and formal letters" : "Informal letter or email",
    wordCount,
    advisoryOnly: true,
    templateOpeningsOptional: true,
    checks,
    teacherNote: kind === "mixed"
      ? "A1: review the informal and formal letters separately using the six published communicative points. Exact openings and paragraph markers are not required."
      : shortA1
      ? "A1: prioritize the published task points, suitable salutation and closing, and short correct sentences within the word limit. Do not require paragraph markers."
      : kind === "opinion"
        ? "B1: review the introduction, position, arguments with examples, counterview when asked, and conclusion. Do not require exact essay phrases or a letter greeting."
        : "A2/B1: assess the letter's register, purpose, task points and coherent body. Erstens, Zweitens and Außerdem are training aids, not mandatory keywords.",
  };
}
