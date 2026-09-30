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
    "Use this only when a grammar-focused application prompt is needed; do not turn it into a speaking-performance task.",
  );
}

function modelApplication(example, lessonLabel) {
  return check(
    `Change one clear detail in this model and say the full new sentence: “${clean(example)}”`,
    `Keep the same target pattern for ${lessonLabel}, but change one clear detail such as the person, action, object, food, time or place where appropriate.`,
    "The learner must say a different complete sentence, not simply repeat the model.",
  );
}

function mistakeReflection(mistake, lessonLabel) {
  return check(
    `Give one correct German example that avoids this mistake: ${clean(mistake)}`,
    `Accept one short correct example that demonstrates the ${lessonLabel} pattern without the stated error.`,
    "Ask for a concrete corrected example rather than an abstract explanation.",
  );
}

function languagePointReflection(point, lessonLabel) {
  return check(
    `Show this lesson point with one short German example: ${clean(point)}`,
    `Accept one correct A1 example that clearly demonstrates the ${lessonLabel} point.`,
    "Use only when another class question is needed to reach the full-class pool.",
  );
}

const A1_PRESENTER_UNDERSTANDING_OVERRIDES = {
  "A1-5": [
    check("What is a definite article? Give one German example.", "A definite article refers to a specific noun; for example, der Hund, die Lampe or das Buch."),
    check("What are the nominative definite articles for masculine, feminine, neuter and plural nouns?", "Masculine der, feminine die, neuter das and plural die."),
    check("How can you identify the nominative in a sentence?", "Find who or what performs the action. Ask: Who or what does the action?"),
    check("Give a short German sentence and point to its nominative subject.", "For example: Der Mann arbeitet. Der Mann is the nominative subject.", "A nominative is a case of a noun or pronoun, not a type of verb."),
    check("In ‘Der Mann kauft einen Apfel’, who is doing the action and what case is it?", "Der Mann is doing the action, so it is nominative."),
    check("How can you identify the accusative in a simple sentence?", "Find the direct object: who or what receives the action. Ask Wen? or Was? after the verb."),
    check("Use sehen or kaufen in a short German sentence. Point to the accusative object.", "For example: Ich sehe den Hund. Den Hund is the accusative object; ich is the nominative subject.", "Accept another correct masculine object with den or einen."),
    check("In ‘Der Mann kauft einen Apfel’, what is being bought and what case is it?", "Einen Apfel is being bought, so it is accusative."),
    check("What happens to masculine der in the accusative?", "Der changes to den: der Hund → den Hund."),
    check("Do feminine die, neuter das and plural die change in the accusative?", "No. They remain die, das and die."),
    check("Fill in the articles: ‘___ Mann sieht ___ Hund.’ Why are they different?", "Der Mann sieht den Hund. Der Mann performs the action; den Hund receives it."),
    check("For ‘der Hund’, give the definite article in nominative and accusative.", "Nominative der Hund; accusative den Hund."),
    check("Make a short sentence with a masculine object. Use sehen or kaufen. Identify its nominative and accusative parts.", "For example: Der Mann sieht den Hund. Der Mann is nominative; den Hund is accusative. Also accept a correct sentence with kaufen.", "The object must be masculine and use den or einen."),
    check("Give one short example each with sein, werden, haben and sehen. Which examples have a nominative complement, and which have an accusative object?", "Sein: Er ist ein Lehrer. Werden: Er wird ein Lehrer. Ein Lehrer is nominative in both. Haben: Ich habe einen Hund. Sehen: Ich sehe den Hund. Einen Hund and den Hund are accusative objects.", "Keep the examples simple; sein and werden link to a nominative noun, while haben and sehen take a direct object in these examples."),
  ],
  "A1-4": [
    check(
      "Change the subject to er: ‘Ich komme aus Frankreich.’",
      "Er kommt aus Frankreich.",
      "Check subject-verb agreement: ich komme → er kommt.",
    ),
    check(
      "Change the subject to sie: ‘Ich spreche Französisch.’",
      "Sie spricht Französisch.",
      "Here sie means one woman: ich spreche → sie spricht.",
    ),
    check(
      "What does wo ask about: a location, an origin, or a destination?",
      "A location.",
    ),
    check(
      "What does woher ask about: where someone is, where someone comes from, or where someone is going?",
      "Where someone comes from: the origin.",
    ),
    check(
      "What does wohin ask about: location, origin, or destination?",
      "A destination: where someone is going.",
    ),
    check(
      "Which question asks for someone’s country of origin: ‘Wo kommst du?’, ‘Woher kommst du?’ or ‘Wohin kommst du?’",
      "Woher kommst du?",
    ),
    check(
      "Complete the sentence: ‘Ich komme ___ Ghana.’",
      "Ich komme aus Ghana.",
    ),
    check(
      "Complete the sentence: ‘Ich fahre ___ Deutschland.’",
      "Ich fahre nach Deutschland.",
    ),
    check(
      "Complete the sentence: ‘Ich fahre ___ Schweiz.’",
      "Ich fahre in die Schweiz.",
    ),
    check(
      "Correct the sentence: ‘Er sprechen Deutsch.’",
      "Er spricht Deutsch.",
      "The verb must agree with er.",
    ),
    check(
      "Exit-Check: What is the difference between ‘Ich komme aus Deutschland’ and ‘Ich fahre nach Deutschland’?",
      "Ich komme aus Deutschland gives origin. Ich fahre nach Deutschland gives a destination.",
      "The learner should distinguish origin from destination without help.",
    ),
  ],
  "A1-4.7": [
    check(
      "In Teil 3, if you want to make a polite request, how could you start?",
      "For example: Kannst du mir bitte ...? / Können Sie mir bitte ...?",
      "The learner should produce a real request opener, not explain the exam format.",
    ),
    check(
      "Someone asks you: ‘Kannst du mir bitte den Stift geben?’ How can you respond positively?",
      "For example: Ja, gern. / Ja, natürlich. / Klar. / Kein Problem.",
      "Accept another natural positive A1 reaction.",
    ),
    check(
      "If you do not want to use können, what other simple way can you make a request?",
      "Use a polite imperative with bitte, for example: Gib mir bitte den Stift. / Geben Sie mir bitte den Stift.",
      "This checks that learners can request with an imperative as well as können.",
    ),
    check(
      "Make a polite request asking someone to open the window.",
      "For example: Kannst du bitte das Fenster öffnen? / Öffne bitte das Fenster. / Öffnen Sie bitte das Fenster.",
    ),
    check(
      "Your partner says: ‘Bitte schließen Sie die Tür.’ What could you say before doing it?",
      "For example: Ja, gern. / Natürlich. / Kein Problem.",
    ),
    check(
      "What word can you add to make a request sound more polite? Give an example.",
      "Use bitte, for example: Kannst du mir bitte helfen?",
    ),
    check(
      "How is a request with du different from a polite request with Sie? Give one example of each.",
      "For example: Kannst du mir bitte helfen? and Können Sie mir bitte helfen?",
    ),
    check(
      "You cannot do what your partner requests. How can you refuse politely at A1 level?",
      "For example: Tut mir leid, das geht leider nicht. / Entschuldigung, ich kann leider nicht.",
      "Accept a short polite refusal that clearly reacts to the request.",
    ),
    check(
      "Turn this direct command into a polite request: ‘Gib mir das Buch.’",
      "For example: Gib mir bitte das Buch. / Kannst du mir bitte das Buch geben?",
    ),
    check(
      "In Teil 3, is it enough to understand the request silently? What should you do?",
      "No. React verbally and appropriately, for example with Ja, gern / Natürlich / Tut mir leid, ... and then respond to the request.",
    ),
    check(
      "Make one complete Teil-3 exchange: ask your partner for something and give a suitable response.",
      "For example: Kannst du mir bitte den Stift geben? – Ja, natürlich.",
      "Use this as the final practical check: the learner must produce both the request and the reaction.",
    ),
  ],
  "A1-11": [
    check(
      "What is the word-order rule for the polite Sie-imperative?",
      "Verb first + Sie + the rest, for example: Gehen Sie geradeaus.",
    ),
    check(
      "Correct the grammar: ‘Sie gehen geradeaus.’ when it is meant as an instruction.",
      "Gehen Sie geradeaus. In the polite imperative, the verb comes first.",
    ),
    check(
      "Why is ‘Biegen Sie rechts ab’ correct but ‘Biegen Sie rechts’ incomplete?",
      "abbiegen is separable, so the prefix ab goes to the end.",
    ),
    check(
      "Build the polite Sie-imperative from ‘links abbiegen’.",
      "Biegen Sie links ab.",
    ),
    check(
      "Build the polite Sie-imperative from ‘die Straße überqueren’.",
      "Überqueren Sie die Straße.",
    ),
    check(
      "Where does bitte normally go in a polite direction such as ‘Gehen Sie ... geradeaus’?",
      "A natural A1 form is: Gehen Sie bitte geradeaus.",
    ),
    check(
      "What grammar difference do you see between ‘Sie gehen geradeaus’ and ‘Gehen Sie geradeaus’?",
      "The first is a statement; the second is the polite Sie-imperative with the verb first.",
    ),
    check(
      "Choose the correct contraction: ‘Wie komme ich ___ Bahnhof?’ and explain it.",
      "zum Bahnhof, because zu + dem = zum and Bahnhof is masculine.",
    ),
    check(
      "Choose the correct contraction: ‘Wie komme ich ___ Apotheke?’ and explain it.",
      "zur Apotheke, because zu + der = zur and Apotheke is feminine.",
    ),
    check(
      "Correct the grammar: ‘Biegen Sie an der Kreuzung links.’",
      "Biegen Sie an der Kreuzung links ab.",
    ),
    check(
      "Exit-Check: give one correct polite Sie-imperative with a separable verb.",
      "For example: Biegen Sie rechts ab.",
      "Use this as a grammar exit check, not a route-speaking performance task.",
    ),
  ],
  "A1-12.3": [
    check("How many CONTENT points must you answer in each A1-12.3 letter?", "Exactly three content points."),
    check("Is the greeting one of the three content points?", "No. The greeting is required letter form, but it is not one of the three content points."),
    check("For the birthday message, what are the three content points?", "Congratulate the friend, ask whether there is a party, and ask whether your family can come."),
    check("For the language-school email, what are the three content points?", "Ask when the course begins, ask how much it costs, and ask whether you can pay online."),
    check("Ordne die Wörter: Geburtstag · alles · Gute · zum", "Alles Gute zum Geburtstag.", "Build one sentence that can answer the birthday-congratulation point."),
    check("Ordne die Wörter: gibt · es · eine · Party", "Gibt es eine Party?", "Build the party question from the task point."),
    check("Ordne die Wörter: meine · Familie · kann · mitkommen", "Kann meine Familie mitkommen?", "Build the family question from the third content point."),
    check("Ordne die Wörter: wann · beginnt · der · Kurs", "Wann beginnt der Kurs?", "Build the formal course-start question."),
    check("Ordne die Wörter: viel · kostet · der · Kurs · wie", "Wie viel kostet der Kurs?", "Build the course-price question."),
    check("Ordne die Wörter: online · ich · kann · bezahlen", "Kann ich online bezahlen?", "Build the online-payment question."),
    check("Exit-Check: What is the A1 letter structure?", "Greeting + exactly three content points + closing + name.", "The learner must separate content points from letter form."),
  ],
  "A1-13": [
    check("How many CONTENT points does the Day 13 email have?", "Exactly three."),
    check("What are the three Day 13 content points?", "Say you cannot come to the wedding, give one concrete weather reason, and suggest another meeting."),
    check("Is ‘Liebe Bina’ one of the three content points?", "No. It is required informal letter form, not a content point."),
    check("If you write ‘Es ist sonnig’, have you completed the weather-reason point?", "No. It describes weather but does not explain why you cannot attend."),
    check("Ordne die Wörter: leider · kann · ich · nicht · kommen", "Leider kann ich nicht kommen.", "Build the first content point."),
    check("Ordne die Wörter: stark · es · regnet · sehr", "Es regnet sehr stark.", "Build the weather sentence before adding a consequence."),
    check("Ordne die Wörter: mein · Bus · fährt · nicht", "Mein Bus fährt nicht.", "Build the consequence that makes the weather reason useful."),
    check("Which is a better reason: ‘Es regnet’ or ‘Es regnet sehr stark, und mein Bus fährt nicht’?", "The second one, because it explains why attendance is not possible."),
    check("Ordne die Wörter: wir · uns · Sonntag · treffen · können", "Können wir uns Sonntag treffen?", "Build the third content point: another meeting suggestion."),
    check("You have greeting + point 1 + point 2 + closing, but no new meeting. What is missing?", "Content point 3: suggest another meeting."),
    check("Exit-Check: Give the three Day 13 content points in order.", "1. Cannot come. 2. Concrete weather reason. 3. Suggest another meeting.", "Do not include greeting or closing as task points."),
  ],
  "A1-14.1": [
    check("How many CONTENT points does the Day 14.1 email have?", "Exactly three."),
    check("What are the three Day 14.1 content points?", "Say you cannot come to the birthday, give one concrete health reason, and ask for or suggest another meeting."),
    check("Is ‘Lieber Felix’ one of the three content points?", "No. It is required informal letter form, not a content point."),
    check("Does ‘Ich habe einen Arm’ satisfy the health-reason point?", "No. It only names a body part; it does not describe a health problem."),
    check("Ordne die Wörter: leider · kann · ich · nicht · kommen", "Leider kann ich nicht kommen.", "Build the first content point."),
    check("Ordne die Wörter: habe · ich · Fieber", "Ich habe Fieber.", "Build a simple A1 health reason."),
    check("Ordne die Wörter: Kopf · mein · tut · weh", "Mein Kopf tut weh.", "Build another valid A1 health reason."),
    check("Do ‘Ich bin krank’ or ‘Ich habe Kopfschmerzen’ count as simple A1 health reasons?", "Yes. A clear simple health problem is enough at A1."),
    check("Ordne die Wörter: wir · uns · Woche · treffen · nächste", "Treffen wir uns nächste Woche?", "Build the third content point: another meeting suggestion."),
    check("You have greeting + point 1 + point 2 + closing, but no new meeting. What is missing?", "Content point 3: ask for or suggest another meeting."),
    check("Exit-Check: Give the three Day 14.1 content points in order.", "1. Cannot come. 2. Concrete health reason. 3. Ask for or suggest another meeting.", "Do not include greeting or closing as task points."),
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

  // A1 Presenter is a grammar diagnostic. The grammar page does the teaching;
  // these live checks verify rule recognition, correction and controlled transfer.
  // Do not dilute the pool with warm-up/speaking prompts.
  const applicationChecks = [
    ...conceptChecks,
    ...(Array.isArray(support.commonMistakesEn) ? support.commonMistakesEn : []).map((mistake) => mistakeReflection(mistake, lessonLabel)),
    ...(Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : []).map((example) => modelApplication(example, lessonLabel)),
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
