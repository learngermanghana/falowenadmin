// Deterministic social content assembly. No AI calls or invented lesson answers.
export const SOCIAL_VIDEO_TEMPLATES = [
  { id: "speaking", label: "Speaking challenge", hint: "A question, response pause and reviewed model answer" },
  { id: "grammar", label: "Grammar in 30 seconds", hint: "An authored rule and a lesson example" },
  { id: "vocabulary", label: "Vocabulary & phrases", hint: "Useful lesson language with optional teacher-approved meaning" },
  { id: "mistake", label: "Correct the mistake", hint: "An existing teacher mistake note with a correction you review" },
  { id: "exam", label: "Exam-style challenge", hint: "Practice question; never presented as an official exam item" },
];

function strings(values) {
  return (Array.isArray(values) ? values : [])
    .filter((value) => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}
function unique(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = (item.text || "").toLocaleLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
export function lessonAnswerSuggestions(slide = {}) {
  const examples = [
    ...(Array.isArray(slide.speakingModels) ? slide.speakingModels : []).map((model) => model?.modelAnswerDe),
    ...strings(slide.teacherSupport?.modelExamplesDe),
    ...strings(slide.modelExamplesDe),
    ...strings(slide.keyPhrasesDe),
  ];
  return [...new Set(examples.filter((value) => typeof value === "string").map((value) => value.trim()).filter(Boolean))];
}

export function lessonContentChoices(slide = {}, templateId = "speaking") {
  const support = slide.teacherSupport || {};
  const paired = (Array.isArray(slide.speakingModels) ? slide.speakingModels : [])
    .filter((model) => typeof model?.questionDe === "string" && model.questionDe.trim())
    .map((model) => ({
      text: model.questionDe.trim(),
      answer: String(model.modelAnswerDe || "").trim(),
      source: "speakingModels (verified question / model pair)",
    }));
  const questions = [
    ...paired,
    ...strings(slide.studentQuestionsDe).map((text) => ({ text, answer: "", source: "studentQuestionsDe" })),
    ...strings(slide.warmupQuestionsDe).map((text) => ({ text, answer: "", source: "warmupQuestionsDe" })),
  ];
  if (templateId === "speaking" || templateId === "exam") return unique(questions);
  if (templateId === "grammar") {
    const rules = strings(support.grammarFocusEn).concat(strings(slide.grammarFocusEn), strings(slide.grammarTeachEn));
    const examples = strings(support.modelExamplesDe).concat(strings(slide.modelExamplesDe));
    return unique(rules.map((text, i) => ({
      text,
      // Rules and examples are not reliably paired; show an independently sourced example only if reviewed.
      answer: "",
      suggestion: examples[i] || "",
      source: "authored grammar teaching note",
    })));
  }
  if (templateId === "vocabulary") {
    const phrases = strings(slide.keyPhrasesDe).concat(strings(slide.modelExamplesDe));
    return unique(phrases.map((text) => ({ text, answer: "", source: "keyPhrasesDe / modelExamplesDe" })));
  }
  if (templateId === "mistake") {
    return unique(strings(support.commonMistakesEn).map((text) => ({
      text, answer: "", source: "teacherSupport.commonMistakesEn",
    })));
  }
  return [];
}

export function socialScript({ entry = {}, templateId = "speaking", primary = "", answer = "", platform = "TikTok" } = {}) {
  const topic = String(entry.en || entry.de || "German").trim();
  const level = String(entry.assignment_id || "").split("-")[0] || "German";
  const main = String(primary || "").trim();
  const response = String(answer || "").trim();
  const lines = [
    "FALOWEN GERMAN CHALLENGE",
    "Level: " + level + " | Topic: " + topic + " | Platform: " + platform,
    "Source lesson: " + (entry.assignment_id || "Not selected"),
    "",
  ];
  if (templateId === "speaking" || templateId === "exam") {
    lines.push(
      "0-4s · HOOK: Can you answer this " + level + " German question?",
      "4-14s · SHOW AND READ: " + (main || "[Choose a question from the lesson]"),
      "14-20s · PAUSE: Say your answer aloud before the example appears.",
      "20-37s · MODEL ANSWER: " + (response || "[Teacher review needed: enter a verified model answer]"),
    );
    if (templateId === "exam") lines.push("Editorial note: This is Falowen exam-style practice, not an official Goethe exam question.");
  } else if (templateId === "grammar") {
    lines.push(
      "0-4s · HOOK: One " + level + " German grammar tip!",
      "4-19s · RULE: " + (main || "[Select an authored grammar note]"),
      "19-34s · EXAMPLE: " + (response || "[Teacher review needed: choose a verified example]"),
    );
  } else if (templateId === "vocabulary") {
    lines.push(
      "0-4s · HOOK: Do you know this " + level + " German phrase?",
      "4-16s · GERMAN: " + (main || "[Select a German phrase]"),
      "16-30s · EXPLAIN IN ENGLISH: " + (response || "[Teacher review needed: enter a verified meaning]"),
    );
  } else if (templateId === "mistake") {
    lines.push(
      "0-4s · HOOK: Avoid this German mistake!",
      "4-20s · TEACHER NOTE: " + (main || "[Choose an authored common-mistake note]"),
      "20-35s · CORRECTED EXAMPLE / EXPLANATION: " + (response || "[Teacher review needed: enter a verified correction]"),
    );
  }
  lines.push(
    "FINAL 5s · CTA: Practise more German with Falowen at falowen.app.",
    "",
    "Accuracy: Check all spoken German and on-screen text before publishing.",
  );
  return lines.join("\n");
}
export function socialCaption({ entry = {}, templateId = "speaking", primary = "" } = {}) {
  const level = String(entry.assignment_id || "").split("-")[0] || "German";
  const prompts = {
    speaking: "Can you answer this German speaking question?",
    exam: "Ready for this German exam-style practice question?",
    grammar: "One useful German grammar tip for today.",
    vocabulary: "Learn a useful German phrase!",
    mistake: "Avoid this common German mistake.",
  };
  const opening = prompts[templateId] || prompts.speaking;
  const excerpt = String(primary || "").trim();
  return [opening, excerpt.length <= 180 ? excerpt : excerpt.slice(0, 177) + "...", "Practise German with Falowen: https://www.falowen.app", "#Falowen #LearnGerman #" + level + "German #GermanPractice"].filter(Boolean).join("\n\n");
}
export function notebookPack({ entry = {}, templateId = "speaking", primary = "", answer = "", platform = "TikTok", captionOverride = "" } = {}) {
  return [
    "FALOWEN NOTEBOOKLM VIDEO SOURCE",
    "Lesson: " + (entry.assignment_id || "") + " — " + (entry.de || "") + " / " + (entry.en || ""),
    "Template: " + templateId,
    "This source was assembled from Falowen teaching material without AI.",
    "Any hand-edited content must be checked by a teacher.",
    "",
    "=== VIDEO SCRIPT ===",
    socialScript({ entry, templateId, primary, answer, platform }),
    "",
    "=== NOTEBOOKLM VIDEO INSTRUCTIONS ===",
    "Create a short, engaging educational video for learners of German.",
    "Use the exact German examples and explanations above. Do not invent answers, translations,",
    "exam claims, pronunciations or additional grammar rules.",
    "Use clean Falowen branding, large readable subtitles and a brief viewer-response pause.",
    "Use a vertical layout if supported; otherwise reformat in an editor for mobile 9:16.",
    "Show https://www.falowen.app in the closing frame.",
    "Do not present Falowen practice tasks as official Goethe exam materials.",
    "",
    "=== SOCIAL CAPTION ===",
    captionOverride || socialCaption({ entry, templateId, primary }),
  ].join("\n");
}
export function socialUseKey({ assignmentId, templateId, question, platform }) {
  return [assignmentId, templateId, question, platform].map((v) => String(v || "").trim().toLowerCase()).join("::");
}
