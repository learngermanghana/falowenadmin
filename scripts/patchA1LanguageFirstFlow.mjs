import fs from "node:fs";

const presenterPath = new URL("../src/components/A1GrammarPresenter.jsx", import.meta.url);
let source = fs.readFileSync(presenterPath, "utf8");

const marker = "const A1_LANGUAGE_FIRST_FLOW_VERSION = 2;";

if (!source.includes(marker)) {
  const start = source.indexOf("function stageList(slide, topicLabel) {");
  const end = source.indexOf("\nexport default function A1GrammarPresenter", start);

  if (start < 0 || end < 0) {
    throw new Error("A1 language-first stageList anchors missing.");
  }

  const replacement = `const A1_LANGUAGE_FIRST_FLOW_VERSION = 2;

function cleanText(value = "") {
  return String(value || "").replace(/\\s+/g, " ").trim();
}

function uniqueText(items = []) {
  const seen = new Set();
  const result = [];
  for (const value of items) {
    const text = cleanText(value);
    const key = text.toLocaleLowerCase("de-DE");
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}

function makeCheck(questionDe, answerDe, noteEn = "") {
  return { questionDe: cleanText(questionDe), answerDe: cleanText(answerDe), noteEn: cleanText(noteEn) };
}

function buildSayItFirst(slide = {}, support = {}) {
  return uniqueText([
    ...(Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : []),
    ...(Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : []),
  ]).slice(0, 4);
}

function buildOneMinuteKnowledge(slide = {}, support = {}) {
  const grammar = uniqueText(Array.isArray(support.grammarFocusEn) ? support.grammarFocusEn : []).slice(0, 4);
  const items = grammar.map((item, index) => \`Rule \${index + 1}: \${item}\`);

  if (Number(slide.dayNumber) === 7) {
    items.unshift("Today has separate blocks: prices → pronouns → family writing → hobbies. Master one block at a time.");
  }

  if (Number(slide.dayNumber) === 8) {
    items.push("Recognition only today: notice war/hatte, vowel-changing verbs and man/Mann, but do not require active mastery before the country/language/travel patterns are secure.");
  }

  return uniqueText(items).slice(0, 5);
}

function buildPronunciationItems(slide = {}) {
  const haystack = cleanText([
    slide.title,
    slide.topic,
    ...(Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : []),
  ].join(" "));

  if (/alphabet|buchstab|letter|umlaut|ä|ö|ü|ß/i.test(haystack)) {
    return [
      "Say the letter names slowly before spelling whole words.",
      "Keep Ä, Ö and Ü distinct from A, O and U; do not replace them with the English vowel sounds.",
      "ß is called Eszett / scharfes S. Practise hearing it as part of a complete word.",
      "Spell one name and one short German word aloud before moving on.",
    ];
  }

  if (/zahl|nummer|uhr|zeit|datum|monat|wochentag/i.test(haystack)) {
    return [
      "Say the complete number or time phrase aloud, not only the digits.",
      "Listen for -zehn versus -zig and repeat the pair clearly.",
      "Practise the phrase once slowly, then once at normal speaking speed.",
    ];
  }

  if (/land|länder|sprache|sprachen|woher|reisen/i.test(haystack)) {
    return [
      "Practise country and language names as complete chunks: aus Ghana, aus Deutschland, Deutsch, Englisch.",
      "Keep the German w sound distinct from English w in words such as wo / wohnen.",
      "Repeat one Woher? question and answer with natural question intonation.",
    ];
  }

  if (/begrüß|greeting|heißen|vorstell|personal information/i.test(haystack)) {
    return [
      "Repeat the whole phrase, not isolated words: Wie heißt du? – Ich heiße ...",
      "Practise the difference between du and Sie with clear sentence stress.",
      "Say the mini-exchange once slowly and once naturally.",
    ];
  }

  return [];
}

function buildRetrievalChecks(slide = {}) {
  const day = Number(slide.dayNumber || 0);
  if (day <= 1) return [];

  const bank = [
    [2, "How do you greet someone in the morning?", "Guten Morgen!"],
    [3, "Ask someone their name with du.", "Wie heißt du?"],
    [4, "Say where you come from.", "For example: Ich komme aus Ghana."],
    [5, "Ask where someone comes from.", "Woher kommst du?"],
    [6, "Make one yes/no question with a conjugated verb first.", "For example: Sprichst du Deutsch? / Spielst du Fußball?"],
    [7, "Say one hobby with gern.", "For example: Ich lese gern."],
    [8, "Ask the price of one object.", "For example: Wie viel kostet das Buch?"],
    [9, "Say one country and one language in two short sentences.", "For example: Ich komme aus Ghana. Ich spreche Englisch."],
    [10, "Make one correct W-question.", "For example: Wo wohnst du? / Was machst du gern?"],
    [11, "Say one time in German.", "Accept one correctly formed time phrase appropriate to the material already studied."],
    [12, "Say today's date or one date in German.", "Accept one correctly formed A1 date expression."],
    [13, "Describe today's weather in one sentence.", "For example: Es ist sonnig. / Es regnet."],
    [14, "Make one sentence with kein or nicht.", "Accept one correct A1 negation sentence."],
    [15, "Give one simple direction or location sentence.", "Accept one correct A1 location/direction sentence from earlier lessons."],
    [16, "Make one polite request with bitte.", "For example: Kannst du mir bitte helfen?"],
    [17, "Connect two short sentences with und or aber.", "Accept a correct connected A1 sentence with normal main-clause word order."],
    [18, "Give one sentence about your daily routine.", "Accept one correct short A1 routine sentence."],
    [19, "Ask and answer one question about food, shopping or a daily need.", "Accept a short correct A1 exchange using earlier vocabulary."],
    [20, "Give one sentence in the perfect or past form already studied.", "Accept a correct example that matches the learner's completed A1 material."],
    [21, "Give one sentence with a modal verb.", "Accept one correct A1 modal-verb sentence."],
    [22, "Ask one question about a place, route or transport.", "Accept one correct A1 question from prior material."],
    [23, "Correct one earlier word-order rule from memory.", "The learner should state and demonstrate one correct A1 word-order pattern."],
    [24, "Connect two ideas with und, aber, oder or denn.", "Accept one correct connected A1 sentence."],
    [25, "Give a 3-sentence self-introduction without notes.", "The response should contain three correct pieces of personal information."],
    [26, "Ask your partner two different A1 questions without reading.", "Accept two correct questions from previously studied A1 topics."],
    [27, "Correct one common A1 error you remember from class.", "Accept a valid correction plus the correct sentence or rule."],
    [28, "Give a short A1 response combining personal information, time/place and one preference.", "Accept a connected short response using previously learned A1 language."],
  ];

  return bank
    .filter(([availableFrom]) => day >= availableFrom)
    .slice(-3)
    .map(([, questionDe, answerDe]) => makeCheck(questionDe, answerDe, "Retrieval from an earlier A1 lesson. Do not show the answer first."));
}

function buildSentenceChecks(slide = {}, support = {}) {
  const models = uniqueText(Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : []);
  const phrases = uniqueText(Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : []);
  const firstModel = models[0] || phrases[0] || cleanText(slide.wrapUpTaskDe);
  const secondModel = models[1] || phrases[1] || firstModel;

  return [
    makeCheck(
      firstModel ? \`Use this pattern to make a new sentence of your own: “\${firstModel}”\` : "Make one correct sentence with today's target language.",
      firstModel ? \`Example pattern: \${firstModel}. Accept a new correct sentence with the same structure.\` : "Accept one correct sentence using today's target language.",
      "The learner must produce new information, not simply repeat the model.",
    ),
    makeCheck(
      secondModel ? \`Change one detail in this sentence but keep the grammar correct: “\${secondModel}”\` : "Change one detail in a correct model sentence from today's lesson.",
      secondModel ? \`Keep the same structure as: \${secondModel}, but change a person, place, object, time or preference correctly.\` : "Accept a grammatically correct variation of a lesson model.",
      "Use this as a sentence-building task before the workbook.",
    ),
    makeCheck(
      "Create one question that uses today's lesson language, then answer it yourself.",
      "Accept one correct A1 question plus a matching short answer using today's target language.",
      "Keep the exchange short and usable.",
    ),
  ];
}

function buildMiniDialogueItems(slide = {}, support = {}) {
  const warmups = uniqueText(Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : []);
  const phrases = uniqueText(Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : []);
  const models = uniqueText(Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : []);
  const promptA = warmups[0] || "Ask one question from today's topic.";
  const promptB = phrases[0] || models[0] || "Answer in one complete A1 sentence.";

  return [
    \`Partner A: \${promptA}\`,
    \`Partner B: answer in a complete sentence. Useful language: \${promptB}\`,
    "Partner A: ask one follow-up question instead of ending the exchange immediately.",
    "Switch roles. Repeat the dialogue with different personal information.",
  ];
}

function buildExpandedClassChecks(baseChecks = [], slide = {}, support = {}) {
  const original = Array.isArray(baseChecks) ? baseChecks : [];
  const exitCheck = original[original.length - 1] || makeCheck(
    cleanText(slide.wrapUpTaskDe) || "Give one correct example from today's lesson.",
    "Accept one correct A1 example using today's target language.",
  );
  const main = original.length > 1 ? original.slice(0, -1) : [];
  const lessonLabel = cleanText(slide.topic || slide.title || "today's lesson");

  const extras = [
    ...(Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : []).map((question) => makeCheck(
      question,
      \`Accept a short correct A1 response using the target language for \${lessonLabel}.\`,
      "Application question for the selected student.",
    )),
    ...(Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : []).map((phrase) => makeCheck(
      \`Use this language in a new sentence: “\${phrase}”\`,
      \`Accept a new correct sentence that follows the pattern in “\${phrase}”.\`,
      "Do not accept simple repetition when the learner can reasonably personalise the phrase.",
    )),
    ...(Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : []).map((example) => makeCheck(
      \`Change one detail but keep this model correct: “\${example}”\`,
      \`Accept a correct variation of: \${example}\`,
      "Check the target structure rather than vocabulary sophistication.",
    )),
    ...(Array.isArray(support.commonMistakesEn) ? support.commonMistakesEn : []).map((mistake) => makeCheck(
      \`Correct or explain this common mistake: \${mistake}\`,
      "The learner should state or demonstrate the correct pattern and give a short corrected example.",
      "Accept a correct rule explanation or corrected example.",
    )),
  ];

  const seen = new Set();
  const classChecks = [];
  for (const item of [...main, ...extras]) {
    const key = cleanText(item?.questionDe).toLocaleLowerCase("de-DE");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    classChecks.push(item);
    if (classChecks.length === 15) break;
  }

  return { classChecks, exitCheck };
}

const A1_CHECKPOINTS = {
  5: [
    ["Greet someone formally and ask how they are.", "For example: Guten Tag. Wie geht es Ihnen?"],
    ["Spell your first name aloud.", "The learner should give the German letter names in the correct order."],
    ["Introduce yourself in three short sentences.", "For example: Ich heiße ... Ich komme aus ... Ich wohne in ..."],
    ["Ask a W-question about origin.", "Woher kommst du? / Woher kommen Sie?"],
    ["Give one correct der/die/das noun phrase.", "Accept one familiar noun with the correct article."],
    ["Correct: Ich kommen aus Ghana.", "Ich komme aus Ghana."],
    ["Correct: Wie du heißt?", "Wie heißt du?"],
    ["Ask one personal-information question and answer it.", "Accept one correct short question-answer pair."],
    ["Use one adjective in a simple sentence with sein.", "For example: Der Baum ist groß."],
    ["Give a 4-sentence self-introduction without notes.", "The answer should contain four correct pieces of A1 personal information."],
  ],
  10: [
    ["Ask a yes/no question about a hobby.", "For example: Spielst du gern Fußball?"],
    ["Say one hobby with gern and one preference with lieber.", "For example: Ich lese gern, aber ich reise lieber."],
    ["Ask the price of a singular object.", "For example: Wie viel kostet das Buch?"],
    ["Ask the price of plural objects.", "For example: Wie viel kosten die Bücher?"],
    ["Replace der Tisch with a pronoun.", "er"],
    ["Say your country and language.", "For example: Ich komme aus Ghana. Ich spreche Englisch."],
    ["Explain wo / woher / wohin with one example.", "wo = location, woher = origin, wohin = destination; accept a correct A1 example."],
    ["Correct: Ich spreche bisschen Deutsch.", "Ich spreche ein bisschen Deutsch."],
    ["Make one sentence with nach and one destination.", "For example: Ich fahre nach Berlin / nach Deutschland."],
    ["Role-play: ask one price question and one preference question.", "Accept a correct two-question mini-exchange."],
  ],
  15: [
    ["Say one time in German and ask your partner for the time.", "Accept a correct time phrase plus a correct question."],
    ["Say one date in German.", "Accept one correctly formed A1 date."],
    ["Describe the weather in two short sentences.", "For example: Es sind 25 Grad. Es ist sonnig."],
    ["Make one sentence with kein.", "Accept a correct noun-negation example."],
    ["Make one sentence with nicht.", "Accept a correct sentence-negation example."],
    ["Give one simple location sentence.", "Accept a correct A1 location sentence from the studied material."],
    ["Ask one direction or place question.", "Accept one correct A1 route/place question."],
    ["Correct one word-order mistake from an earlier lesson.", "The learner should provide a valid correction and short explanation."],
    ["Give a 3-turn mini-dialogue about time, date, weather or location.", "Accept a coherent short A1 exchange."],
    ["Use one earlier grammar rule in a new personal sentence.", "Accept a correct transfer sentence."],
  ],
  20: [
    ["Make one polite request with bitte.", "For example: Kannst du mir bitte helfen?"],
    ["Respond positively to a request.", "For example: Ja, gern. / Natürlich. / Kein Problem."],
    ["Refuse a request politely.", "For example: Tut mir leid, das geht leider nicht."],
    ["Give one sentence about your daily routine.", "Accept one correct A1 routine sentence."],
    ["Ask one question about shopping, food or another daily need.", "Accept one correct earlier A1 question."],
    ["Use a modal verb in one sentence.", "Accept one correct modal-verb sentence."],
    ["Connect two ideas with und or aber.", "Accept one correct connected main-clause sentence."],
    ["Give one reason with denn.", "Accept one correct sentence using denn with normal main-clause word order."],
    ["Role-play a 4-turn everyday exchange without notes.", "Accept a coherent A1 exchange using prior language."],
    ["Correct one common error and explain the correct pattern.", "Accept a valid correction plus a simple explanation."],
  ],
  25: [
    ["Introduce yourself in five sentences without notes.", "The response should include five correct pieces of personal information."],
    ["Ask three different question types: W-question, yes/no question and polite request.", "Accept three correct A1 questions."],
    ["Use und, aber and denn in three short examples.", "Accept three correct connected sentences."],
    ["Give one sentence with a modal verb and one with negation.", "Accept two correct A1 sentences."],
    ["Describe a simple daily situation in three connected sentences.", "Accept a coherent A1 mini-description."],
    ["Correct: denn ich müde bin.", "For a main clause after denn: denn ich bin müde."],
    ["Ask and answer one question about time or date.", "Accept one correct short exchange."],
    ["Ask and answer one question about place or direction.", "Accept one correct short exchange."],
    ["Give one preference and one reason.", "Accept a correct A1 preference plus a simple reason."],
    ["Complete a 60-second A1 conversation using at least four earlier lesson patterns.", "Accept a coherent beginner conversation using four previously studied patterns."],
  ],
};

function buildCheckpointChecks(slide = {}) {
  const source = A1_CHECKPOINTS[Number(slide.dayNumber)];
  if (!Array.isArray(source)) return [];
  return source.map(([questionDe, answerDe]) => makeCheck(questionDe, answerDe, "Cumulative A1 checkpoint. This deliberately revisits earlier material."));
}

function buildCanDoItems(slide = {}) {
  const topic = cleanText(slide.topic || slide.title || "today's topic");
  return [
    \`I can use at least three useful expressions from “\${topic}” without reading them.\`,
    "I can produce one correct sentence with today's main grammar pattern.",
    "I can correct one common mistake from today's lesson.",
    "I can ask and answer one short question using today's language.",
    "I am ready to complete the workbook/practice task with less teacher help.",
  ];
}

function buildWorkbookTransferItems(slide = {}, workbookParts = []) {
  if (workbookParts.length) {
    return workbookParts.map((part, index) => ({
      label: \`\${index + 1}. \${part.label}\`,
      detail: \`Do this: \${cleanText(part.detailEn)}\`,
    }));
  }

  return uniqueText(Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : [])
    .slice(0, 4)
    .map((question, index) => ({ label: \`Practice \${index + 1}\`, detail: question }));
}

function stageList(slide, topicLabel) {
  const support = buildTeacherSlideSupport(slide);
  const checks = getA1PresenterUnderstandingChecks(
    slide.assignmentId,
    getA1GrammarChecks(slide.assignmentId, slide),
    { slide, support },
  );
  const { classChecks, exitCheck } = buildExpandedClassChecks(checks, slide, support);
  const workbookParts = Array.isArray(slide.workbookConnection?.parts) ? slide.workbookConnection.parts : [];
  const retrievalChecks = buildRetrievalChecks(slide);
  const sayItFirst = buildSayItFirst(slide, support);
  const oneMinuteKnowledge = buildOneMinuteKnowledge(slide, support);
  const pronunciationItems = buildPronunciationItems(slide);
  const sentenceChecks = buildSentenceChecks(slide, support);
  const miniDialogueItems = buildMiniDialogueItems(slide, support);
  const checkpointChecks = buildCheckpointChecks(slide);
  const transferItems = buildWorkbookTransferItems(slide, workbookParts);
  const hasWorkbookPlan = workbookParts.length > 0;

  return [
    {
      id: "intro",
      type: "intro",
      kicker: \`\${slide.course || "A1"}\${slide.day ? \` · \${slide.day}\` : ""}\`,
      title: slide.title || "A1 lesson",
      topic: topicLabel || slide.topic || "",
      objective: slide.objective || "",
      duration: slide.estimatedDuration || "",
    },
    {
      id: "recall",
      type: "check",
      kicker: "Recall",
      title: "Remember before we start",
      items: retrievalChecks,
    },
    {
      id: "speak-first",
      type: "list",
      kicker: "Speak first",
      title: "Say it before we explain it",
      items: sayItFirst,
    },
    {
      id: "one-minute-knowledge",
      type: "list",
      kicker: "1 Minute",
      title: "1-minute knowledge",
      items: oneMinuteKnowledge,
    },
    {
      id: "phrases",
      type: "list",
      kicker: "Redemittel",
      title: "Useful language",
      items: Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : [],
    },
    {
      id: "pronunciation",
      type: "list",
      kicker: "Aussprache",
      title: "Pronunciation focus",
      items: pronunciationItems,
    },
    {
      id: "rule",
      type: "list",
      kicker: "Sprachfokus",
      title: "Muster und Regel verstehen",
      items: Array.isArray(support.grammarFocusEn) ? support.grammarFocusEn : [],
    },
    {
      id: "examples",
      type: "list",
      kicker: "Beispiele",
      title: "See the pattern",
      items: Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : [],
    },
    {
      id: "sentence-build",
      type: "check",
      kicker: "Satzbau",
      title: "Build the sentence",
      items: sentenceChecks,
    },
    {
      id: "mini-dialogue",
      type: "list",
      kicker: "Mini-Dialog",
      title: "Use it in a short conversation",
      items: miniDialogueItems,
    },
    {
      id: "grammar-check",
      type: "check",
      kicker: "Grammatik-Check",
      title: "Class challenge · up to 15 different questions",
      items: classChecks,
    },
    {
      id: "mistakes",
      type: "list",
      kicker: "Wrong → Correct",
      title: "Typical mistakes to fix",
      items: Array.isArray(support.commonMistakesEn) ? support.commonMistakesEn : [],
    },
    {
      id: "checkpoint",
      type: "check",
      kicker: "Checkpoint",
      title: \`Cumulative A1 checkpoint · Day \${slide.dayNumber || ""}\`,
      items: checkpointChecks,
    },
    {
      id: "can-do",
      type: "list",
      kicker: "Can you do this?",
      title: "Before you leave this lesson",
      items: buildCanDoItems(slide),
    },
    {
      id: "workbook",
      type: "workbook",
      kicker: "Transfer",
      title: hasWorkbookPlan ? "Now complete the workbook" : "Now apply it",
      items: transferItems,
      grammarUrl: slide.workbookConnection?.grammarUrl || "",
      workbookUrl: slide.workbookConnection?.workbookUrl || "",
    },
    {
      id: "exit-check",
      type: "check",
      kicker: "Abschluss",
      title: "Exit Check · answer without help",
      items: [exitCheck],
      exitCheck: true,
    },
  ].filter((stage) => {
    if (stage.type === "intro") return true;
    return Array.isArray(stage.items) && stage.items.length > 0;
  });
}
`;

  source = `${source.slice(0, start)}${replacement}${source.slice(end)}`;
}

source = source.replace(
  "Language focus → examples → understanding check → error correction → practice/workbook transfer → exit check.",
  "Recall → speak first → 1-minute knowledge → useful language → grammar pattern → sentence building → mini-dialogue → class challenge → error correction → can-do check → workbook transfer → exit check.",
);

source = source.replace(
  "The live understanding check gives each learner a unique question. Controlled gap-fill and form drills stay in the workbook when a workbook is linked.",
  "The live class challenge can provide up to 15 different lesson questions. Pronunciation appears only when relevant, and cumulative checkpoints revisit earlier A1 material on milestone days.",
);

source = source.replace(
  ">Open workbook</a>",
  ">Start workbook</a>",
);

fs.writeFileSync(presenterPath, source);
console.log("A1 language-first presenter flow is build-safe.");
