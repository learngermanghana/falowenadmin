import test from "node:test";
import assert from "node:assert/strict";
import {
  lessonContentChoices, lessonAnswerSuggestions, socialScript,
  socialCaption, notebookPack, socialUseKey,
} from "../src/utils/socialCourseTemplates.js";

const entry = { assignment_id: "A2-1.1", en: "Small Talk", de: "Small Talk" };
const slide = {
  speakingModels: [
    { questionDe: "Was machst du beruflich?", modelAnswerDe: "Ich arbeite als Verkäufer." },
  ],
  studentQuestionsDe: ["Was machst du beruflich?", "Was machst du gern?"],
  warmupQuestionsDe: ["Wie geht es dir?"],
  keyPhrasesDe: ["Ich arbeite als ..."],
  teacherSupport: {
    grammarFocusEn: ["For a simple statement the finite verb goes in position two."],
    modelExamplesDe: ["Ich arbeite heute im Büro."],
    commonMistakesEn: ["Putting the verb at the end of a simple statement."],
  },
};

test("speaking templates prioritize explicitly paired and verified question answers", () => {
  const choices = lessonContentChoices(slide, "speaking");
  assert.equal(choices.length, 3);
  assert.equal(choices[0].text, "Was machst du beruflich?");
  assert.equal(choices[0].answer, "Ich arbeite als Verkäufer.");
  assert.equal(choices[1].text, "Was machst du gern?");
  assert.equal(choices[1].answer, "");
});
test("grammar examples remain suggestions, never falsely treated as paired rule answers", () => {
  const choices = lessonContentChoices(slide, "grammar");
  assert.equal(choices.length, 1);
  assert.equal(choices[0].answer, "");
  assert.equal(choices[0].suggestion, "Ich arbeite heute im Büro.");
});
test("vocabulary does not invent English translations and mistakes do not invent corrections", () => {
  assert.equal(lessonContentChoices(slide, "vocabulary")[0].answer, "");
  assert.equal(lessonContentChoices(slide, "mistake")[0].answer, "");
  assert.equal(lessonContentChoices({}, "grammar").length, 0);
});
test("existing lesson examples can be selected and duplicate entries are removed", () => {
  const suggested = lessonAnswerSuggestions(slide);
  assert.ok(suggested.includes("Ich arbeite als Verkäufer."));
  assert.ok(suggested.includes("Ich arbeite heute im Büro."));
  assert.equal(new Set(suggested).size, suggested.length);
});
test("scripts show review placeholders rather than fabricating an answer", () => {
  const script = socialScript({ entry, templateId: "speaking", primary: "Was machst du gern?", platform: "TikTok" });
  assert.match(script, /Teacher review needed/);
  assert.match(script, /Was machst du gern/);
  assert.match(script, /falowen\.app/);
});
test("exam template does not misrepresent Goethe affiliation", () => {
  const script = socialScript({ entry, templateId: "exam", primary: "Was machst du beruflich?", answer: "Ich arbeite als Verkäufer." });
  assert.match(script, /not an official Goethe exam question/);
});
test("NotebookLM export contains the script, source, and edited caption", () => {
  const pack = notebookPack({
    entry, templateId: "speaking", primary: "Was machst du beruflich?",
    answer: "Ich arbeite als Verkäufer.", platform: "TikTok",
    captionOverride: "My reviewed caption",
  });
  assert.match(pack, /A2-1\.1/);
  assert.match(pack, /My reviewed caption/);
  assert.match(pack, /Do not invent answers/);
  assert.ok(!pack.includes("Teacher review needed"));
});
test("post captions and usage identity stay specific to the course source", () => {
  assert.match(socialCaption({ entry, primary: "Was machst du beruflich?" }), /#A2German/);
  const first = socialUseKey({ assignmentId: "A2-1.1", templateId: "speaking", question: "Frage 1", platform: "TikTok" });
  const other = socialUseKey({ assignmentId: "A2-1.1", templateId: "speaking", question: "Frage 2", platform: "TikTok" });
  assert.notEqual(first, other);
});
