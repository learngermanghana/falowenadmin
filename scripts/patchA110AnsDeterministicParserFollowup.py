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

# `Ans B` / `Antwort Falsch` are answer prefixes, but `Answer1: B` is an
# explicit numbered answer and must continue through the numbered parser.
text = text.replace(
    'const match = trimmed.match(/^(?:ans(?:wer)?|antwort)\\s*[:=.\\-)\\]]?\\s*(.+)$/i);',
    'const match = trimmed.match(/^(?:ans(?:wer)?|antwort)\\b\\s*[:=.\\-)\\]]?\\s*(.+)$/i);',
)

text = replace_function(text, "findPartId", r'''function findPartId(value = "") {
  const normalized = normalizeForCompare(value);
  if (/\bteil\s*(?:1|eins|i)\b|\bpart\s*(?:1|one|i)\b/.test(normalized)) return "teil1";
  if (/\bteil\s*(?:2|zwei|ii)\b|\bpart\s*(?:2|two|ii)\b|\bschreiben\b|\bwriting\b/.test(normalized)) return "teil2";
  if (/\bteil\s*(?:3|drei|iii)\b|\bpart\s*(?:3|three|iii)\b|\blesen\b|\breading\b/.test(normalized)) return "teil3";
  if (/\bteil\s*(?:4|vier|iv)\b|\bpart\s*(?:4|four|iv)\b|\bhoren\b|\bhoeren\b|\blistening\b/.test(normalized)) return "teil4";
  return "unknown";
}''')

old_marker = r'''const markerRegex = /(?:^|\n)\s*((?:teil|part)\s*(?:[1-4]|eins|zwei|drei|vier|one|two|three|four)\b[^\n]*|(?:schreiben|lesen|h[oö]ren|hoeren|writing|reading|listening)\b[^\n]*)\s*:?\s*(?=\n|$)/gi;'''
new_marker = r'''const markerRegex = /(?:^|\n)\s*((?:teil|part)\s*(?:[1-4]|iv|iii|ii|i|eins|zwei|drei|vier|one|two|three|four)\b[^\n]*|(?:schreiben|lesen|h[oö]ren|hoeren|writing|reading|listening)\b[^\n]*)\s*:?\s*(?=\n|$)/gi;'''
if old_marker not in text:
    raise SystemExit("splitSubmissionIntoParts marker regex not found")
text = text.replace(old_marker, new_marker, 1)

path.write_text(text)

# Keep the regression focused on the public deterministic result shape.
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

test("A1-10 deterministic parser binds Ans lines, Roman Teil I, and preserves the missing gap", () => {
  const result = checkDeterministicObjectiveAnswers({ referenceEntry, submissionText });

  assert.equal(result.objectiveCorrect, 10);
  assert.equal(result.objectiveTotal, 15);
  assert.equal(result.objectiveScore, 67);
  assert.deepEqual(
    result.wrongAnswers.map(({ question, expected, student }) => ({ question, expected, student })),
    [
      { question: 2, expected: "R", student: "Falsch" },
      { question: 4, expected: "R", student: "Falsch" },
      { question: 8, expected: "F", student: "" },
      { question: 9, expected: "F", student: "" },
      { question: 10, expected: "F", student: "" },
    ],
  );
});
''')
