import { rubricFeedbackSentences } from "./writingRubric.js";

function writingSectionText(submission = "") {
  let source = String(submission || "").trim();
  const laterPart = source.search(/(?:^|\n)\s*(?:teil\s*[34]|lesen|reading|h[oö]ren|hoeren|listening)\b/i);
  if (laterPart >= 0) source = source.slice(0, laterPart);
  return source.replace(/^\s*teil\s*2\b[^\n]*[:·]?\s*/i, "").trim();
}

function sentenceList(source = "") {
  return String(source || "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function quoteSentence(source = "", pattern) {
  const sentence = sentenceList(source).find((value) => pattern.test(value));
  if (!sentence) return "";
  const clean = sentence.replace(/[.!?]+$/, "");
  return clean.length > 105 ? `${clean.slice(0, 102).trim()}…` : clean;
}

function unique(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function contextualA2Sentence(source = "") {
  const questionCount = (source.match(/\?/g) || []).length;
  const concreteDetail = /\b(?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|uhr|adresse|termin|telefon|e-mail|bahnhof|café|restaurant|arbeit|familie|wohnung|wochenende)\b/i.test(source);
  if (questionCount > 0 && concreteDetail) {
    return "The message includes concrete details and a relevant question, so the reader can understand both the situation and what response is needed";
  }
  if (concreteDetail) {
    return "The content includes practical details that make the message more useful than a short list of basic statements";
  }
  return "For a stronger A2 response, make each required point explicit and add one concrete detail that helps the reader act on the message";
}

function contextualB1FormalSentence(result = {}, source = "") {
  const assignmentKey = String(result.assignmentKey || result.assignmentId || result.assignment || "").toUpperCase();
  const viewingContext = /\b(?:wohnungsanzeige|wohnung|besichtig(?:en|ung)?)\b/i.test(source)
    || /^B1[-_. ]2\.5(?:\b|$)/i.test(assignmentKey);
  const asksAppointment = /\b(?:termin|besichtig|freitag|samstag|uhr)\b/i.test(source);
  const asksAddress = /\b(?:adresse|anschrift)\b/i.test(source);
  const asksDocuments = /\b(?:unterlagen|dokument|mitbringen)\b/i.test(source);
  const politeSentence = quoteSentence(source, /\b(?:wäre .{0,45} möglich|könnten sie|bitte bestätigen|teilen sie mir|möchte gern wissen)\b/i);

  if (viewingContext && asksAppointment && asksAddress && asksDocuments) {
    return "The formal letter is task-focused: it proposes a concrete appointment and asks for the practical information needed for the viewing";
  }
  if (politeSentence) {
    return `The request is expressed naturally and politely in “${politeSentence}”, which supports the formal register`;
  }
  return "The formal purpose is clear; the next improvement is to make the request more specific and support it with the exact practical detail the reader needs";
}

function contextualB1OpinionSentence(source = "") {
  const position = /\b(?:meiner meinung nach|ich bin der meinung|ich denke|ich finde|ich glaube|ich vertrete die ansicht)\b/i.test(source);
  const contrast = (/\beinerseits\b/i.test(source) && /\bandererseits\b/i.test(source))
    || /\b(?:jedoch|allerdings|dagegen|während)\b/i.test(source);
  const exampleSentence = quoteSentence(source, /\b(?:zum beispiel|beispielsweise|bei einer|ein beispiel|etwa)\b/i);

  if (position && contrast && exampleSentence) {
    return `The argument is developed rather than merely stated: it gives a clear position, considers another side and supports the point with “${exampleSentence}”`;
  }
  if (position && contrast) {
    return "The response has a genuine argumentative structure because the position is clear and a contrasting view is considered before the conclusion";
  }
  if (position) {
    return "The position is easy to identify; the next step is to develop it with a contrasting view and one concrete example before concluding";
  }
  return "For stronger B1 argumentation, state the position explicitly and develop one reason with a contrasting view, a concrete example and a short consequence";
}

export function writingDepthSentences(result = {}, submission = "", explicitLevel = "") {
  const level = String(explicitLevel || result.level || result.detectedLevel || result.ai?.detectedLevel || "").toUpperCase().match(/\b(A1|A2|B1)\b/)?.[1] || "";
  if (level !== "A2" && level !== "B1") return [];

  const source = writingSectionText(submission);
  const words = source.split(/\s+/).filter(Boolean).length;
  if (words < 20) return [];

  const rubric = rubricFeedbackSentences(result, submission, level);
  if (level === "A2") return unique([...rubric, contextualA2Sentence(source)]).slice(0, 4);

  const formal = /\bsehr geehrte\b/i.test(source) && /\bmit freundlichen gr(?:ü|u)(?:ß|ss)en\b/i.test(source);
  const opinion = /\b(?:meiner meinung nach|ich bin der meinung|ich denke|ich finde|ich glaube|einerseits|andererseits|zusammenfassend)\b/i.test(source);
  const contextual = formal && !opinion
    ? contextualB1FormalSentence(result, source)
    : contextualB1OpinionSentence(source);

  return unique([...rubric, contextual]).slice(0, 4);
}
