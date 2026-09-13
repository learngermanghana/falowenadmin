import fs from "node:fs";

const target = new URL("../src/utils/objectiveMarking.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");
let changed = false;

const before = `  let flatAnswers = flatMainReference ? chooseBestFlatAnswers(referenceItems, submissionText) : [];
  if (flatMainReference) {
    const sectionAnswers = sections
      .filter((section) => section.partId !== "main")
      .flatMap((section) => extractRestartedNumberingEntries(section.text).sort((a, b) => a.number - b.number).map((entry) => entry.answer));
    if (scoreFlatCandidate(referenceItems, sectionAnswers).correct > scoreFlatCandidate(referenceItems, flatAnswers).correct) flatAnswers = sectionAnswers;
  }`;

const after = `  let flatAnswers = flatMainReference ? chooseBestFlatAnswers(referenceItems, submissionText) : [];
  if (flatMainReference) {
    // Flat A1 answer keys often represent several workbook Teile as one
    // Answer1..AnswerN sequence. When the student explicitly labels those Teile
    // and restarts numbering at 1, preserve the section order instead of moving
    // answers around based on which alignment happens to score highest.
    //
    // Keep this narrow: it applies only to all-choice reference keys and either
    // (a) a submission that starts with Teil 1 and continues into another
    // choice section, or (b) explicit choice sections whose combined answer
    // count exactly fills the flat reference key. This protects partial trailing
    // blocks that intentionally rely on the legacy best-alignment fallback.
    const explicitChoiceSections = sections
      .filter((section) => section.partId !== "main")
      .map((section) => ({
        partId: section.partId,
        entries: extractRestartedNumberingEntries(section.text).sort((a, b) => a.number - b.number),
      }))
      .filter(({ entries }) => entries.length && entries.every((entry) => Boolean(extractOptionLetter(entry.answer))));
    const orderedExplicitChoiceAnswers = explicitChoiceSections.flatMap(({ entries }) => entries.map((entry) => entry.answer));
    const preserveExplicitChoiceOrder = referenceItems.every((item) => item.type === "choice")
      && explicitChoiceSections.length >= 2
      && (
        explicitChoiceSections[0]?.partId === "teil1"
        || orderedExplicitChoiceAnswers.length === referenceItems.length
      );

    if (preserveExplicitChoiceOrder) {
      flatAnswers = orderedExplicitChoiceAnswers;
    } else {
      const sectionAnswers = sections
        .filter((section) => section.partId !== "main")
        .flatMap((section) => extractRestartedNumberingEntries(section.text).sort((a, b) => a.number - b.number).map((entry) => entry.answer));
      if (scoreFlatCandidate(referenceItems, sectionAnswers).correct > scoreFlatCandidate(referenceItems, flatAnswers).correct) flatAnswers = sectionAnswers;
    }
  }`;

if (source.includes(after)) {
  console.log("Restarted Teil numbering for flat choice keys is already patched.");
} else if (source.includes(before)) {
  source = source.replace(before, after);
  changed = true;
  console.log("Flat A1 choice keys now preserve explicit Teil order when numbering restarts.");
} else {
  throw new Error("Could not patch restarted Teil numbering: objectiveMarking.js anchor changed.");
}

const stopwordBefore = `  "und", "oder", "zu", "in", "mit", "auf", "am", "im", "den", "dem", "des", "mein", "meine",
]);`;
const stopwordAfter = `  "und", "oder", "zu", "in", "mit", "auf", "am", "im", "den", "dem", "des", "mein", "meine",
  "meinem", "meinen", "meiner", "meines", "sein", "seine", "seinen", "seinem", "seiner", "seines",
  "ihr", "ihre", "ihren", "ihrem", "ihrer", "ihres", "unser", "unsere", "unseren", "unserem", "unserer", "unseres",
  "euer", "eure", "euren", "eurem", "eurer", "eures",
]);

const numberWordsBlock = `
const NUMBER_WORDS = new Map([
  ["null", "0"], ["eins", "1"], ["ein", "1"], ["eine", "1"], ["einen", "1"],
  ["zwei", "2"], ["drei", "3"], ["vier", "4"], ["funf", "5"], ["fuenf", "5"],
  ["sechs", "6"], ["sieben", "7"], ["acht", "8"], ["neun", "9"], ["zehn", "10"],
]);
`;

if (!source.includes("const NUMBER_WORDS = new Map([")) {
  if (!source.includes(stopwordBefore)) {
    throw new Error("Could not patch concise fill-in stopwords: objectiveMarking.js anchor changed.");
  }
  source = source.replace(stopwordBefore, stopwordAfter);
  source = source.replace(`${stopwordAfter}\n\nconst VOCABULARY_ALIASES`, `${stopwordAfter}\n${numberWordsBlock}\nconst VOCABULARY_ALIASES`);
  changed = true;
}

const rootsBefore = `function rootToken(token = "") {
  return normalizeAnswer(token).replace(/(chen|ern|en|er|em|es|e|n|s)$/i, "");
}

function meaningfulRoots(value = "") {
  return normalizeAnswer(value).split(/\\s+/).map(rootToken).filter((token) => token && token.length > 1 && !STOPWORDS.has(token));
}`;

const rootsAfter = `function canonicalSemanticToken(token = "") {
  const normalized = normalizeAnswer(token);
  return NUMBER_WORDS.get(normalized) || normalized;
}

function rootToken(token = "") {
  const canonical = canonicalSemanticToken(token);
  if (/^\\d+$/.test(canonical)) return canonical;
  return canonical.replace(/(chen|ern|en|er|em|es|e|n|s)$/i, "");
}

function meaningfulRoots(value = "") {
  return normalizeAnswer(value)
    .split(/\\s+/)
    .map(canonicalSemanticToken)
    .filter((token) => token && !STOPWORDS.has(token))
    .map(rootToken)
    .filter((token) => token && (/^\\d+$/.test(token) || token.length > 1));
}`;

if (!source.includes("function canonicalSemanticToken(token")) {
  if (!source.includes(rootsBefore)) {
    throw new Error("Could not patch concise fill-in semantic roots: objectiveMarking.js anchor changed.");
  }
  source = source.replace(rootsBefore, rootsAfter);
  changed = true;
}

if (changed) {
  fs.writeFileSync(target, source, "utf8");
  console.log("Concise A1 fill-in answers now use semantic number and possessive normalization.");
} else {
  console.log("Concise A1 fill-in semantic matching is already patched.");
}
