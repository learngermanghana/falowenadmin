const clean = (value = "") => String(value || "").replace(/\s+/g, " ").trim();

function partText(source = "", partId = "") {
  const text = String(source || "").replace(/\r/g, "");
  const number = String(partId || "").toLowerCase().match(/teil\s*([1-4])|^teil([1-4])$/)?.[1]
    || String(partId || "").toLowerCase().match(/^teil([1-4])$/)?.[1];
  if (!number) return text.trim();

  const startPattern = new RegExp("(?:^|\\n)\\s*(?:teil|tiel|part)\\s*" + number + "\\b[^\\n]*\\n?", "i");
  const start = text.search(startPattern);
  if (start < 0) return "";

  const afterStart = text.slice(start);
  const header = afterStart.match(startPattern)?.[0] || "";
  const bodyStart = start + header.length;
  const tail = text.slice(bodyStart);
  const next = tail.search(/(?:^|\n)\s*(?:teil|tiel|part)\s*[1-4]\b[^\n]*/i);
  return (next >= 0 ? tail.slice(0, next) : tail).trim();
}

function sentences(source = "") {
  return String(source || "")
    .replace(/\r/g, "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map(clean)
    .filter(Boolean);
}

function sentenceFor(source = "", pattern) {
  return sentences(source).find((sentence) => pattern.test(sentence)) || "";
}

function row(label, met, evidence = "", reason = "") {
  return {
    label: clean(label),
    status: met ? "met" : "missing",
    evidence: met ? clean(evidence) : "",
    reason: met
      ? "The submission contains task-relevant evidence for this A1 point."
      : (reason || "No task-relevant evidence for this required A1 point was found."),
  };
}

function greeting(source = "", formal = false) {
  const pattern = formal
    ? /(?:^|\n)\s*sehr\s+geehrte(?:r|n)?\b|(?:^|\n)\s*sehr\s+geehrte\s+damen\s+und\s+herren\b/i
    : /(?:^|\n)\s*(?:hallo|liebe?r?|guten\s+(?:morgen|tag|abend))\b/i;
  return { met: pattern.test(source), evidence: sentenceFor(source, pattern) };
}

function closing(source = "", formal = false) {
  const pattern = formal
    ? /\bmit\s+freundlichen\s+gr(?:ü|u)(?:ß|ss)en\b/i
    : /\b(?:liebe|viele|herzliche|beste)\s+gr(?:ü|u)(?:ß|ss)e\b|\bbis\s+bald\b|\btsch(?:ü|u)ss\b/i;
  return { met: pattern.test(source), evidence: sentenceFor(source, pattern) };
}

function nameLine(source = "") {
  const lines = String(source || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return "";
  const candidate = lines.at(-1) || "";
  return /^[A-ZÄÖÜ][A-Za-zÄÖÜäöüß' -]{1,40}$/.test(candidate) ? candidate : "";
}

function countFamilyDetailTypes(source = "") {
  const patterns = [
    /\bheißt\b|\bname\s+ist\b/i,
    /\b\d{1,3}\s+jahre\s+alt\b/i,
    /\b(?:arbeitet|beruf|lehrer|lehrerin|student|studentin|ingenieur|ingenieurin|arzt|ärztin|fahrer|fahrerin|verkäufer|verkäuferin|näherin)\b/i,
    /\b(?:wohnt|wohnen)\s+in\b/i,
    /\b(?:hobby|gern)\b/i,
  ];
  return patterns.reduce((count, pattern) => count + (pattern.test(source) ? 1 : 0), 0);
}

function evaluateA11(taskPoints, source) {
  const g = greeting(source, false);
  const c = closing(source, false);
  const rules = [
    row(taskPoints[0], g.met, g.evidence),
    row(taskPoints[1], /\b(?:ich\s+heiße|mein\s+name\s+ist)\b/i.test(source), sentenceFor(source, /\b(?:ich\s+heiße|mein\s+name\s+ist)\b/i)),
    row(taskPoints[2], /\bich\s+komme\s+aus\b/i.test(source), sentenceFor(source, /\bich\s+komme\s+aus\b/i)),
    row(taskPoints[3], /\bich\s+wohne\s+in\b/i.test(source), sentenceFor(source, /\bich\s+wohne\s+in\b/i)),
    row(taskPoints[4], c.met, c.evidence),
  ];
  return rules;
}

function evaluateA112(taskPoints, source) {
  const g = greeting(source, false);
  return [
    row(taskPoints[0], g.met, g.evidence),
    row(taskPoints[1], /\b(?:ich\s+heiße|mein\s+name\s+ist)\b/i.test(source), sentenceFor(source, /\b(?:ich\s+heiße|mein\s+name\s+ist)\b/i)),
    row(taskPoints[2], /\bich\s+komme\s+aus\b/i.test(source), sentenceFor(source, /\bich\s+komme\s+aus\b/i)),
    row(taskPoints[3], /\bich\s+wohne\s+in\b/i.test(source), sentenceFor(source, /\bich\s+wohne\s+in\b/i)),
  ];
}

function evaluateA13(taskPoints, source) {
  const familyPattern = /\b(?:familie|mutter|vater|eltern|bruder|schwester|geschwister|sohn|tochter|kind(?:er)?|ehemann|ehefrau|oma|opa|großmutter|großvater|tante|onkel|cousin|cousine)\b/i;
  const memberPattern = /\b(?:mutter|vater|eltern|bruder|schwester|geschwister|sohn|tochter|kind(?:er)?|ehemann|ehefrau|oma|opa|großmutter|großvater|tante|onkel|cousin|cousine)\b/i;
  const detailCount = countFamilyDetailTypes(source);
  const extraPattern = /\b(?:wohnt|wohnen)\s+in\b|\b(?:hobby|gern)\b/i;
  return [
    row(taskPoints[0], familyPattern.test(source) && sentences(source).length >= 2, sentenceFor(source, familyPattern)),
    row(taskPoints[1], memberPattern.test(source), sentenceFor(source, memberPattern)),
    row(taskPoints[2], detailCount >= 2, sentences(source).filter((sentence) => /\bheißt\b|\bjahre\s+alt\b|\barbeitet\b|\bberuf\b/i.test(sentence)).slice(0, 2).join(" | ")),
    row(taskPoints[3], extraPattern.test(source), sentenceFor(source, extraPattern)),
  ];
}

function evaluateA1123(taskPoints, source) {
  const informal = partText(source, "teil1");
  const formal = partText(source, "teil2");

  const congratulations = /\b(?:alles\s+gute|herzlichen\s+gl[uü]ckwunsch|gratuliere|gratulieren)\b/i;
  const party = /\b(?:feier|party)\b[^?]{0,60}\?|\bgibt\s+es\s+(?:eine\s+)?(?:feier|party)\b/i;
  const familyCome = /\b(?:familie)\b[^?]{0,80}\b(?:mitkommen|kommen)\b|\bkann\s+meine\s+familie\s+mitkommen\b/i;

  const starts = /\bwann\s+beginnt\s+(?:der\s+)?kurs\b/i;
  const costs = /\bwie\s+viel\s+kostet\s+(?:der\s+)?kurs\b/i;
  const online = /\b(?:kann|darf)\s+ich\s+online\s+bezahlen\b|\bonline\s+bezahlen\b/i;

  return [
    row(taskPoints[0], congratulations.test(informal), sentenceFor(informal, congratulations)),
    row(taskPoints[1], party.test(informal), sentenceFor(informal, party)),
    row(taskPoints[2], familyCome.test(informal), sentenceFor(informal, familyCome)),
    row(taskPoints[3], starts.test(formal), sentenceFor(formal, starts)),
    row(taskPoints[4], costs.test(formal), sentenceFor(formal, costs)),
    row(taskPoints[5], online.test(formal), sentenceFor(formal, online)),
  ];
}
function evaluateA113(taskPoints, source) {
  const writing = partText(source, "teil3") || String(source || "");
  const cannotAttend = /\b(?:hochzeit|einladung)\b[^.!?]{0,120}\b(?:nicht\s+kommen|leider\s+nicht|kann\s+ich\s+nicht|ich\s+kann\s+leider\s+nicht)\b|\b(?:ich\s+kann\s+leider\s+nicht|leider\s+kann\s+ich\s+nicht|ich\s+kann\s+nicht)\b[^.!?]{0,120}\bhochzeit\b[^.!?]{0,60}\bkommen\b/i;
  const weatherReason = /\b(?:sturm|unwetter|gl[aä]tte|eis|schnee|schneit|stark(?:er|en|e)?\s+regen|regn(?:et|en)\s+(?:sehr\s+)?stark|schlechtes?\s+wetter)\b/i;
  const suggestion = /\b(?:treffen|anderes\s+mal|n[aä]chste\s+woche|neuer?\s+termin|wann\s+k[oö]nnen\s+wir|k[oö]nnen\s+wir\s+uns)\b/i;
  return [
    row(taskPoints[0], cannotAttend.test(writing), sentenceFor(writing, cannotAttend)),
    row(taskPoints[1], weatherReason.test(writing), sentenceFor(writing, weatherReason), "The message needs a concrete bad-weather reason for missing the wedding, not only a neutral weather description."),
    row(taskPoints[2], suggestion.test(writing), sentenceFor(writing, suggestion)),
  ];
}
function evaluateA1141(taskPoints, source) {
  const writing = partText(source, "teil2") || String(source || "");
  const cannotAttend = /\b(?:geburtstag|einladung)\b[^.!?]{0,120}\b(?:nicht\s+kommen|nicht\s+teilnehmen|leider\s+nicht|kann\s+ich\s+nicht|ich\s+kann\s+leider\s+nicht)\b|\b(?:ich\s+kann\s+leider\s+nicht|leider\s+kann\s+ich\s+nicht|ich\s+kann\s+nicht)\b[^.!?]{0,120}\bgeburtstag\b[^.!?]{0,60}\b(?:kommen|teilnehmen)\b/i;
  const healthReason = /\b(?:krank|fieber|husten|erk[aä]ltet|schmerzen?|weh|kopfschmerzen?|halsschmerzen?|bauchschmerzen?|arzt|grippe)\b/i;
  const otherTime = /\b(?:ander(?:er|es)\s+termin|anderes\s+mal|n[aä]chste\s+woche|treffen|wann\s+k[oö]nnen\s+wir|k[oö]nnen\s+wir\s+uns)\b/i;
  return [
    row(taskPoints[0], cannotAttend.test(writing), sentenceFor(writing, cannotAttend)),
    row(taskPoints[1], healthReason.test(writing), sentenceFor(writing, healthReason), "The message needs a concrete health problem as the reason for missing the birthday."),
    row(taskPoints[2], otherTime.test(writing), sentenceFor(writing, otherTime)),
  ];
}

export function evaluateA1WritingTaskEvidence(task = {}, source = "") {
  const taskPoints = Array.isArray(task.taskPoints) ? task.taskPoints : [];
  const assignmentKey = String(task.assignmentKey || "").trim().toUpperCase();

  if (assignmentKey === "A1-1.1") return evaluateA11(taskPoints, source);
  if (assignmentKey === "A1-1.2") return evaluateA112(taskPoints, source);
  if (assignmentKey === "A1-3") return evaluateA13(taskPoints, source);
  if (assignmentKey === "A1-12.3") return evaluateA1123(taskPoints, source);
  if (assignmentKey === "A1-13") return evaluateA113(taskPoints, source);
  if (assignmentKey === "A1-14.1") return evaluateA1141(taskPoints, source);

  return taskPoints.map((label) => ({
    label: clean(label),
    status: "review",
    evidence: "",
    reason: "No deterministic A1 evidence rule is configured for this task point.",
  }));
}
