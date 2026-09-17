const clean = (value = "") => String(value || "").replace(/\s+/g, " ").trim();

export const WRITING_TEXT_TYPES = Object.freeze({
  WRITING: "writing",
  INFORMAL_EMAIL: "informal_email",
  FORMAL_EMAIL: "formal_email",
  FORMAL_LETTER: "formal_letter",
  OPINION_ESSAY: "opinion_essay",
  FORUM_POST: "forum_post",
  COMPLAINT: "complaint",
  APPLICATION: "application",
  INVITATION: "invitation",
  MESSAGE: "message",
});

export const WRITING_REGISTERS = Object.freeze({
  INFORMAL: "informal",
  FORMAL: "formal",
  UNSPECIFIED: "unspecified",
});

export function inferWritingRegister(detail = "", slide = {}) {
  const source = `${clean(detail)} ${clean(slide.topic)} ${clean(slide.title)}`.toLowerCase();
  if (/formal|complaint|beschwerde|application|bewerbung|landlord|vermieter|behörde|authority|customer service|kundenservice/.test(source)) {
    return WRITING_REGISTERS.FORMAL;
  }
  if (/friend|freund|freundin|family|familie|einladung|invitation|birthday|geburtstag/.test(source)) {
    return WRITING_REGISTERS.INFORMAL;
  }
  return WRITING_REGISTERS.UNSPECIFIED;
}

export function inferExpectedWritingTextType(detail = "", slide = {}, register = inferWritingRegister(detail, slide)) {
  const source = clean(detail).toLowerCase();
  if (/complaint|beschwerde/.test(source)) return WRITING_TEXT_TYPES.COMPLAINT;
  if (/application|bewerbung/.test(source)) return WRITING_TEXT_TYPES.APPLICATION;
  if (/forum|forum post|forumsbeitrag/.test(source)) return WRITING_TEXT_TYPES.FORUM_POST;
  if (/opinion|stellungnahme|argument|advantages?\s*\/\s*disadvantages?|vor-?\s*und\s*nachteile/.test(source)) return WRITING_TEXT_TYPES.OPINION_ESSAY;
  if (/invitation|einladung/.test(source)) return WRITING_TEXT_TYPES.INVITATION;
  if (/email|e-mail|mail/.test(source)) {
    return register === WRITING_REGISTERS.FORMAL ? WRITING_TEXT_TYPES.FORMAL_EMAIL : WRITING_TEXT_TYPES.INFORMAL_EMAIL;
  }
  if (/letter|brief/.test(source)) {
    return register === WRITING_REGISTERS.FORMAL ? WRITING_TEXT_TYPES.FORMAL_LETTER : WRITING_TEXT_TYPES.INFORMAL_EMAIL;
  }
  if (/message|nachricht/.test(source)) return WRITING_TEXT_TYPES.MESSAGE;
  return WRITING_TEXT_TYPES.WRITING;
}

export function extractWritingTaskPoints(detail = "") {
  const source = clean(detail);
  if (!source) return [];
  const afterColon = source.includes(":") ? source.slice(source.indexOf(":") + 1) : source;
  return [...new Set(
    afterColon
      .replace(/\.$/, "")
      .split(/\s*;\s*|\s*,\s*(?=(?:explain|describe|give|make|propose|ask|mention|discuss|justify|say|tell|write)\b)|\s+and\s+(?=(?:explain|describe|give|make|propose|ask|mention|discuss|justify|say|tell|write)\b)/i)
      .map(clean)
      .filter(Boolean),
  )].slice(0, 8);
}

function evidenceCount(source, patterns) {
  return patterns.reduce((count, pattern) => count + (pattern.test(source) ? 1 : 0), 0);
}

export function detectWritingTextType(text = "") {
  const source = String(text || "");
  const normalized = clean(source).toLowerCase();
  if (!normalized) return { detectedType: WRITING_TEXT_TYPES.WRITING, confidence: 0, evidence: [] };

  const candidates = [];
  const add = (detectedType, score, evidence) => candidates.push({ detectedType, score, evidence: evidence.filter(Boolean) });

  const essayEvidence = [
    /\bmeiner meinung nach\b/i,
    /\bmeine meinung ist\b/i,
    /\bich bin der auffassung\b/i,
    /\beinerseits\b/i,
    /\bandererseits\b/i,
    /\bzusammenfassend\b/i,
    /\babschließend\b/i,
    /\bvor-?\s*und\s*nachteile\b/i,
  ];
  const essayHits = essayEvidence.filter((pattern) => pattern.test(source));
  add(WRITING_TEXT_TYPES.OPINION_ESSAY, Math.min(0.98, essayHits.length * 0.22), essayHits.map((pattern) => pattern.source));

  const formalGreeting = /\bsehr geehrte(?:r|n)?\b/i.test(source);
  const formalClosing = /\bmit freundlichen gr(?:ü|u)(?:ß|ss)en\b/i.test(source);
  const formalAddress = /\b(?:ihnen|ihr(?:e|en|er|em)?|sie)\b/.test(normalized);
  const formalRequest = /\b(?:ich wäre ihnen dankbar|ich bitte sie|könnten sie|ich möchte mich|hiermit)\b/i.test(source);
  const complaintSignal = /\b(?:beschwer|reklam|unzufrieden|mangel|problem|erstattung|rückerstattung)\w*/i.test(source);
  const applicationSignal = /\b(?:bewerb|stelle|position|lebenslauf|qualifikation|berufserfahrung)\w*/i.test(source);
  const formalScore = (formalGreeting ? 0.34 : 0) + (formalClosing ? 0.24 : 0) + (formalAddress ? 0.16 : 0) + (formalRequest ? 0.16 : 0);
  add(complaintSignal ? WRITING_TEXT_TYPES.COMPLAINT : applicationSignal ? WRITING_TEXT_TYPES.APPLICATION : WRITING_TEXT_TYPES.FORMAL_EMAIL,
    Math.min(0.98, formalScore + (complaintSignal || applicationSignal ? 0.18 : 0)),
    [formalGreeting && "formal greeting", formalClosing && "formal closing", formalAddress && "formal address", formalRequest && "formal request", complaintSignal && "complaint language", applicationSignal && "application language"]);

  const informalGreeting = /(?:^|\n)\s*(?:hallo|liebe?r?)\b/i.test(source);
  const informalClosing = /\b(?:liebe gr(?:ü|u)(?:ß|ss)e|viele gr(?:ü|u)(?:ß|ss)e|bis bald|tschüss)\b/i.test(source);
  const informalAddress = /\b(?:du|dir|dich|dein(?:e|en|er|em)?)\b/i.test(source);
  const directInteraction = /\b(?:wie geht es dir|schreib mir|hast du zeit|was meinst du|wollen wir|können wir|lass uns)\b/i.test(source) || /\?/.test(source);
  const informalScore = (informalGreeting ? 0.34 : 0) + (informalClosing ? 0.22 : 0) + (informalAddress ? 0.18 : 0) + (directInteraction ? 0.2 : 0);
  add(WRITING_TEXT_TYPES.INFORMAL_EMAIL, Math.min(0.96, informalScore), [informalGreeting && "informal greeting", informalClosing && "informal closing", informalAddress && "direct informal address", directInteraction && "recipient interaction"]);

  const forumSignal = /\b(?:hallo zusammen|liebe forummitglieder|im forum|forumsbeitrag)\b/i.test(source);
  add(WRITING_TEXT_TYPES.FORUM_POST, forumSignal ? 0.82 : 0, [forumSignal && "forum address"]);

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0] || { detectedType: WRITING_TEXT_TYPES.WRITING, score: 0, evidence: [] };
  return {
    detectedType: best.score >= 0.45 ? best.detectedType : WRITING_TEXT_TYPES.WRITING,
    confidence: Number(best.score.toFixed(2)),
    evidence: best.evidence,
  };
}

export function writingTextTypesCompatible(expected = "", detected = "") {
  if (!expected || expected === WRITING_TEXT_TYPES.WRITING || !detected || detected === WRITING_TEXT_TYPES.WRITING) return true;
  if (expected === detected) return true;
  const formalFamily = new Set([WRITING_TEXT_TYPES.FORMAL_EMAIL, WRITING_TEXT_TYPES.FORMAL_LETTER, WRITING_TEXT_TYPES.COMPLAINT, WRITING_TEXT_TYPES.APPLICATION]);
  if (formalFamily.has(expected) && formalFamily.has(detected)) return true;
  const informalFamily = new Set([WRITING_TEXT_TYPES.INFORMAL_EMAIL, WRITING_TEXT_TYPES.INVITATION, WRITING_TEXT_TYPES.MESSAGE]);
  return informalFamily.has(expected) && informalFamily.has(detected);
}
