function check(questionDe, answerDe, noteEn = "") {
  return { questionDe, answerDe, noteEn };
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function questionKey(value) {
  return clean(value).toLocaleLowerCase("de-DE");
}

function uniqueChecks(items = []) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const questionDe = clean(item?.questionDe);
    const answerDe = clean(item?.answerDe);
    if (!questionDe || !answerDe) continue;
    const key = questionKey(questionDe);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...item, questionDe, answerDe });
  }
  return result;
}

function learnerPrompt(questionDe, lessonLabel) {
  return check(
    questionDe,
    `Accept a short correct A1 response that uses the target language for ${lessonLabel}. The teacher judges meaning and the lesson pattern, not perfect fluency.`,
    "Use this as an application question, not an automatic grade.",
  );
}

function modelApplication(example, lessonLabel) {
  return check(
    `Use the pattern in “${clean(example)}” to make a new sentence of your own.`,
    `Accept a new correct A1 sentence that follows the same target pattern for ${lessonLabel} without simply repeating the model.`,
    "The learner must transfer the model to new information.",
  );
}

function mistakeReflection(mistake, lessonLabel) {
  return check(
    `How would you avoid this common mistake: ${clean(mistake)}`,
    `The learner should state or demonstrate the correct ${lessonLabel} pattern and give a short corrected example.`,
    "Accept a correct rule explanation or corrected example.",
  );
}

function languagePointReflection(point, lessonLabel) {
  return check(
    `Explain this lesson point in your own words and give a short example: ${clean(point)}`,
    `Accept a simple explanation plus a correct A1 example that demonstrates the ${lessonLabel} point.`,
    "Use only when another class question is needed to reach the full-class pool.",
  );
}

const A1_PRESENTER_UNDERSTANDING_OVERRIDES = {
  "A1-13": [
    check("Why is es often used in German weather sentences?", "German commonly uses the impersonal subject es for weather expressions, for example: Es regnet."),
    check("What is the difference between ‘Es ist kalt’ and ‘Es regnet’?", "Es ist kalt uses sein + an adjective; Es regnet uses a weather verb."),
    check("How do you ask about the weather in German?", "A common A1 question is: Wie ist das Wetter?"),
    check("How do you express temperature in German?", "Use Grad with a number, for example: Es sind 30 Grad."),
    check("Which structure would you use with sonnig, windig or bewölkt?", "Use es ist + adjective, for example: Es ist sonnig, windig oder bewölkt."),
    check("Which structure would you use with regnen or schneien?", "Use the conjugated weather verb with es, for example: Es regnet or Es schneit."),
    check("How can you say that it is 25 degrees and sunny?", "For example: Es sind 25 Grad und es ist sonnig."),
    check("What is the difference between warm and heiß when describing weather?", "Both describe high temperature, but heiß is stronger than warm."),
    check("How can you make a short weather description more informative?", "Combine temperature with one or two weather details, for example: Es sind 20 Grad. Es ist bewölkt und windig."),
    check("If someone says ‘Es ist Sonne’, what should you correct?", "Use an adjective or a suitable weather expression: Es ist sonnig or Die Sonne scheint."),
    check("Give a two-sentence weather report for today without looking at the notes.", "A suitable answer gives the temperature and at least one weather condition, for example: Heute sind es 28 Grad. Es ist sonnig und warm."),
  ],
};

export function getA1PresenterUnderstandingChecks(assignmentId, fallbackChecks = [], context = {}) {
  const key = String(assignmentId || "").trim().toUpperCase();
  const override = A1_PRESENTER_UNDERSTANDING_OVERRIDES[key];
  if (Array.isArray(override) && override.length) return override;

  const slide = context?.slide || {};
  const support = context?.support || {};
  const lessonLabel = clean(slide.topic || slide.title || assignmentId || "this lesson");
  const fallback = uniqueChecks(Array.isArray(fallbackChecks) ? fallbackChecks : []);
  const exitCheck = fallback.length
    ? fallback[fallback.length - 1]
    : learnerPrompt(clean(slide.wrapUpTaskDe) || `Give one correct example for ${lessonLabel}.`, lessonLabel);
  const conceptChecks = fallback.length > 1 ? fallback.slice(0, -1) : fallback;

  const applicationChecks = [
    ...conceptChecks,
    ...(Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : []).map((question) => learnerPrompt(question, lessonLabel)),
    ...(Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : []).map((example) => modelApplication(example, lessonLabel)),
    ...(Array.isArray(support.commonMistakesEn) ? support.commonMistakesEn : []).map((mistake) => mistakeReflection(mistake, lessonLabel)),
    ...(Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : []).map((question) => learnerPrompt(question, lessonLabel)),
    ...(Array.isArray(support.grammarFocusEn) ? support.grammarFocusEn : []).map((point) => languagePointReflection(point, lessonLabel)),
    ...(Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : []).map((phrase) => modelApplication(phrase, lessonLabel)),
  ];

  const exitKey = questionKey(exitCheck.questionDe);
  const classChecks = uniqueChecks(applicationChecks)
    .filter((item) => questionKey(item.questionDe) !== exitKey)
    .slice(0, 10);

  if (classChecks.length < 10) {
    throw new Error(`${key || "A1 lesson"} does not provide enough distinct material for a 10-student understanding check.`);
  }

  return [...classChecks, exitCheck];
}

export { A1_PRESENTER_UNDERSTANDING_OVERRIDES };
