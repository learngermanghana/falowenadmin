from pathlib import Path
import re


def replace_function(source, name, replacement):
    start_match = re.search(rf"(?:export\s+)?function\s+{re.escape(name)}\s*\(", source)
    if not start_match:
        raise SystemExit(f"{name} not found")
    start = start_match.start()
    next_match = re.search(r"\n(?:export\s+)?function\s+\w+\s*\(", source[start_match.end():])
    end = start_match.end() + next_match.start() if next_match else len(source)
    return source[:start] + replacement.rstrip() + "\n\n" + source[end:].lstrip()


path = Path("src/utils/autoMarking.js")
text = path.read_text()

if "function parsePrefixedObjectiveAnswer" not in text:
    helper = r'''function parsePrefixedObjectiveAnswer(line = "") {
  const trimmed = String(line || "").trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(?:ans(?:wer)?|antwort)\s*[:=.\-)\]]?\s*(.+)$/i);
  return match ? String(match[1] || "").trim() : "";
}
'''
    text = text.replace('function isObjectiveOptionAnswer(answer = "") {', helper + '\nfunction isObjectiveOptionAnswer(answer = "") {')

text = replace_function(text, "isObjectiveOptionAnswer", r'''function isObjectiveOptionAnswer(answer = "") {
  const normalized = normalizeAnswer(answer);
  return /^[A-FX]$/.test(normalized) || normalized === "R" || normalized === "F";
}''')

text = replace_function(text, "countObjectiveAnswerEvidence", r'''function countObjectiveAnswerEvidence(text = "") {
  return splitObjectiveAnswerTokens(text).reduce((count, token) => {
    const prefixedAnswer = parsePrefixedObjectiveAnswer(token);
    if (prefixedAnswer) return count + 1;

    const numbered = parseNumberedObjectiveLine(token);
    if (numbered && isObjectiveOptionAnswer(numbered.answer)) return count + 1;

    const optionOnly = token.match(new RegExp(`^(?:anzeige\\s*[).:-]?\\s*)?([${OBJECTIVE_OPTION_LETTERS}])(?:\\b|\\s|[).:-]|$)`, "i"));
    if (optionOnly && (/^anzeige\b/i.test(token) || token.length <= 2 || /^[A-FX]\s*[).:-]/i.test(token))) return count + 1;

    return isObjectiveOptionAnswer(token) ? count + 1 : count;
  }, 0);
}''')

text = replace_function(text, "parseStudentObjectiveAnswerTokens", r'''function parseStudentObjectiveAnswerTokens(tokens = [], { questionOffset = 0 } = {}) {
  const map = new Map();
  let orderedQuestion = 0;
  let pendingQuestion = null;

  for (const trimmed of tokens) {
    if (!trimmed) continue;

    const prefixedAnswer = parsePrefixedObjectiveAnswer(trimmed);
    if (prefixedAnswer) {
      if (pendingQuestion !== null) {
        map.set(questionOffset + pendingQuestion, prefixedAnswer);
        orderedQuestion = Math.max(orderedQuestion, pendingQuestion);
        pendingQuestion = null;
      } else {
        orderedQuestion += 1;
        map.set(questionOffset + orderedQuestion, prefixedAnswer);
      }
      continue;
    }

    const numbered = parseNumberedObjectiveLine(trimmed);
    if (numbered) {
      const question = questionOffset + numbered.question;
      map.set(question, numbered.answer);
      orderedQuestion = Math.max(orderedQuestion, numbered.question);
      pendingQuestion = numbered.question;
      continue;
    }

    const anzeigeOnly = trimmed.match(new RegExp(`^(?:anzeige\\s*[).:-]?\\s*)?([${OBJECTIVE_OPTION_LETTERS}])(?:\\b|\\s|[).:-]|$)`, "i"));
    if (anzeigeOnly && (/^anzeige\b/i.test(trimmed) || trimmed.length <= 2 || /^[A-FX]\s*[).:-]/i.test(trimmed))) {
      orderedQuestion += 1;
      map.set(questionOffset + orderedQuestion, anzeigeOnly[1].toUpperCase());
      pendingQuestion = null;
      continue;
    }

    if (isObjectiveOptionAnswer(trimmed)) {
      orderedQuestion += 1;
      map.set(questionOffset + orderedQuestion, trimmed);
      pendingQuestion = null;
    }
  }

  return { map, localQuestionCount: orderedQuestion };
}''')

text = replace_function(text, "alignLabeledPartialObjectiveAnswers", r'''function alignLabeledPartialObjectiveAnswers(studentAnswers, entries, submissionText = "") {
  if (!(studentAnswers instanceof Map) || !studentAnswers.size || studentAnswers.size >= entries.length) return studentAnswers;

  const parts = splitSubmissionIntoParts(submissionText).filter((part) => part.partId !== "unknown");
  const objectiveParts = parts.filter((part) => countObjectiveAnswerEvidence(part.text) > 0);
  if (!objectiveParts.length) return studentAnswers;

  const expectedKind = (value) => {
    const meta = expectedMetadata(value);
    const normalized = normalizeAnswer(meta.raw);
    if (normalized === "R" || normalized === "F") return "boolean";
    if (meta.correctLetter || extractOptionLetter(meta.raw)) return "choice";
    return "text";
  };

  const studentKind = (value) => {
    const normalized = normalizeAnswer(value);
    if (normalized === "R" || normalized === "F") return "boolean";
    if (extractOptionLetter(value)) return "choice";
    return "text";
  };

  const pairFitScore = (reference, studentRaw) => {
    if (!reference || !studentRaw) return -1000;
    const match = valuesMatch(reference.value, studentRaw);
    const typeBonus = expectedKind(reference.value) === studentKind(studentRaw) ? 1 : 0;
    return (match.status === "correct" ? 4 : 0) + typeBonus;
  };

  const mapFitScore = (answerMap) => [...answerMap.entries()].reduce((score, [question, studentRaw]) => {
    const reference = entries[question - 1];
    return reference ? score + pairFitScore(reference, studentRaw) : score;
  }, 0);

  if (objectiveParts.length > 1) {
    const aligned = new Map();
    let minimumGlobalQuestion = 1;

    objectiveParts.forEach((part, partIndex) => {
      const localParsed = parseStudentObjectiveAnswerTokens(splitObjectiveAnswerTokens(part.text));
      const localEntries = [...localParsed.map.entries()].sort(([left], [right]) => left - right);
      if (!localEntries.length) return;

      const minLocal = localEntries[0][0];
      const maxLocal = localEntries[localEntries.length - 1][0];
      let chosenOffset = 0;

      if (partIndex > 0) {
        const minOffset = Math.max(0, minimumGlobalQuestion - minLocal);
        const maxOffset = entries.length - maxLocal;
        const candidates = [];

        for (let offset = minOffset; offset <= maxOffset; offset += 1) {
          const score = localEntries.reduce((total, [question, studentRaw]) => {
            const reference = entries[question + offset - 1];
            return total + pairFitScore(reference, studentRaw);
          }, 0);
          candidates.push({ offset, score });
        }

        candidates.sort((left, right) => right.score - left.score || left.offset - right.offset);
        chosenOffset = candidates[0]?.offset ?? minOffset;
      }

      localEntries.forEach(([question, answer]) => aligned.set(question + chosenOffset, answer));
      minimumGlobalQuestion = Math.max(
        minimumGlobalQuestion,
        ...localEntries.map(([question]) => question + chosenOffset + 1),
      );
    });

    if (aligned.size && mapFitScore(aligned) > mapFitScore(studentAnswers)) return aligned;
  }

  if (objectiveParts.length !== 1 || objectiveParts[0].partId !== "teil2") return studentAnswers;

  const localEntries = [...studentAnswers.entries()].sort(([left], [right]) => left - right);
  const maxOffset = entries.length - Math.max(...localEntries.map(([question]) => question));
  if (maxOffset <= 0) return studentAnswers;

  const scoreOffset = (offset) => localEntries.reduce((score, [question, studentRaw]) => {
    const reference = entries[question + offset - 1];
    return score + (reference && valuesMatch(reference.value, studentRaw).status === "correct" ? 1 : 0);
  }, 0);
  const candidates = Array.from({ length: maxOffset + 1 }, (_, offset) => ({ offset, score: scoreOffset(offset) }))
    .sort((left, right) => right.score - left.score || right.offset - left.offset);
  const best = candidates[0];
  const unshiftedScore = scoreOffset(0);

  if (!best?.offset || best.score < 2 || best.score <= unshiftedScore) return studentAnswers;
  return new Map(localEntries.map(([question, answer]) => [question + best.offset, answer]));
}''')

path.write_text(text)

regression = Path("tests/a1-10-ans-prefix-parser.test.js")
regression.write_text(r'''import test from "node:test";
import assert from "node:assert/strict";
import { checkDeterministicObjectiveAnswers } from "../src/utils/autoMarking.js";

const referenceEntry = {
  assignmentKey: "A1-10",
  level: "A1",
  format: "objective",
  answers: {
    Answer1: "Falsch",
    Answer2: "Wahr",
    Answer3: "Falsch",
    Answer4: "Wahr",
    Answer5: "Wahr",
    Answer6: "Falsch",
    Answer7: "Wahr",
    Answer8: "Falsch",
    Answer9: "Falsch",
    Answer10: "Falsch",
    Answer11: "B) Einmal pro Woche",
    Answer12: "C) Apfel und Bananen",
    Answer13: "A) Ein halbes Kilo",
    Answer14: "B) 10 Euro",
    Answer15: "B) Einen schönen Tag",
  },
};

const submissionText = `Teil I

1) Der Autor geht Jeden Tag einkaufen?
Ans Falsch
2) Der Autor kauft im supermarkt obst Gemüse,Brot,milch und Eier.
Ans Falsch
3) Der Autor macht oft eine Einkaufsliste,um Geld zu sparen.
Ans Falsch
4) Der Autor geht gern auf den wochenmark, wei die Atmosphäre schon ist und die pradukte frisch sind
Ans Falsch
5) Letzten Samstag hat der Autor Tomaten,Gurken salat und kartoffein auf dem markt gekauft.
Ans wahr
6) Der verkäufer fragt den kuden ob er noch etwas mÖchte.
Ans Falsch.
7) Der Autor bereitet einen Tomatensalat mit Tomaten zwiebeln,salz, pfeffer und olivenel zu.
Ans wahr

Teil 2

1) Wie oft geht der sprecher einkaufen?
Ans B
2) was hat der sprecher zuerst gekauft?
Ans C
3) wie viele Tomaten hat der sprecher gekauft?
Ans A .
4) was hat dier gesamte Einkauf
Ans B
5) was hat die kassierein dem sprecher gewünscht
Ans B`;

test("A1-10 deterministic parser binds Ans lines and preserves missing questions before Teil 2", () => {
  const result = checkDeterministicObjectiveAnswers({ referenceEntry, submissionText });

  assert.equal(result.objectiveCorrect, 10);
  assert.equal(result.objectiveTotal, 15);
  assert.equal(result.objectiveScore, 67);
  assert.deepEqual(result.wrongAnswers.map(({ question }) => question), [2, 4]);
  assert.deepEqual(result.missingAnswers.map(({ question }) => question), [8, 9, 10]);
  assert.deepEqual(
    result.correctAnswers.filter(({ question }) => question >= 11).map(({ question, student }) => [question, student]),
    [[11, "B"], [12, "C"], [13, "A ."], [14, "B"], [15, "B"]],
  );
});
''')
