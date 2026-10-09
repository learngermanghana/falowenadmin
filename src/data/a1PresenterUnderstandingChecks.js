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
  const prompt = clean(questionDe);
  if (!prompt) return null;
  return check(
    prompt,
    `Accept a short correct A1 response that uses the target language for ${lessonLabel}. The teacher judges meaning and the lesson pattern, not perfect fluency.`,
    "Keep the prompt concrete and tied to the lesson.",
  );
}

function directUnderstandingPrompt(questionDe, lessonLabel) {
  return check(
    clean(questionDe),
    `Accept a short correct A1 answer that shows the learner understands ${lessonLabel}.`,
    "Keep the question concrete and learner-facing. Do not ask the learner to analyse a teacher-note mistake.",
  );
}

const A1_PRESENTER_UNDERSTANDING_OVERRIDES = {
  "A1-0.2": [
    check("Wie viele Buchstaben hat das deutsche Standardalphabet?", "26 Buchstaben."),
    check("Welche vier zusätzlichen Zeichen benutzt man im Deutschen?", "Ä, Ö, Ü und ß."),
    check("Warum sind Ä, Ö und Ü wichtig?", "Sie haben eigene Laute und können die Aussprache und Bedeutung eines Wortes verändern."),
    check("Wie heißt ß?", "Eszett oder scharfes S."),
    check("Wie spricht man den Buchstaben V auf Deutsch aus?", "Vau."),
    check("Wie spricht man den Buchstaben W auf Deutsch aus?", "We."),
    check("Wie spricht man den Buchstaben I auf Deutsch aus?", "I."),
    check("Wie spricht man den Buchstaben A auf Deutsch aus?", "A."),
    check("Buchstabiere „Wasser“.", "W-A-S-S-E-R."),
    check("Wie buchstabierst du deinen Nachnamen?", "Accept any clearly spelled surname with its German letter names.", "The learner's surname is individual: listen for correct letter order and intelligible German letter names."),
    check("Exit-Check: Nenne die 26 Buchstaben als Standardalphabet und die vier zusätzlichen Zeichen Ä, Ö, Ü und ß.", "26 standard letters plus the additional characters Ä, Ö, Ü and ß."),
  ],
  "A1-1.1": [
    check("Welche Personalpronomen gibt es im Deutschen?", "ich, du, er, sie, es, wir, ihr, sie, Sie."),
    check("Welche Endung hat ein regelmäßiges Verb bei ich?", "-e, zum Beispiel: ich lerne."),
    check("Welche Endung hat ein regelmäßiges Verb bei du?", "-st, zum Beispiel: du lernst."),
    check("Welche Endung hat ein regelmäßiges Verb bei er, sie oder es?", "-t, zum Beispiel: er lernt / sie lernt / es lernt."),
    check("Welche Endung hat ein regelmäßiges Verb bei wir?", "-en, zum Beispiel: wir lernen."),
    check("Welche Endung hat ein regelmäßiges Verb bei ihr?", "-t, zum Beispiel: ihr lernt."),
    check("Welche Endung hat ein regelmäßiges Verb bei sie im Plural?", "-en, zum Beispiel: sie lernen."),
    check("Welche Endung hat ein regelmäßiges Verb bei Sie als höfliche Anrede?", "-en, zum Beispiel: Sie lernen."),
    check("Wie unterscheidest du sie und Sie?", "sie klein kann 'sie' singular oder 'sie' plural bedeuten; Sie groß ist die höfliche Anrede."),
    check("Korrigiere: „Wir lernt Deutsch.“", "Wir lernen Deutsch."),
    check("Korrigiere: „Ihr lernen Deutsch.“", "Ihr lernt Deutsch."),
    check("Korrigiere: „Sie lernt Deutsch.“ wenn Sie die höfliche Anrede meinen.", "Sie lernen Deutsch."),
    check("Korrigiere: „sie lernt Deutsch.“ wenn mehrere Personen gemeint sind.", "sie lernen Deutsch."),
    check("Konjugiere lernen vollständig.", "ich lerne · du lernst · er/sie/es lernt · wir lernen · ihr lernt · sie/Sie lernen."),
    check("Exit-Check: Du siehst das Pronomen „ihr“. Welche Verbendung erwartest du?", "-t."),
  ],
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
  "A1-8": [
    check("Lies die Uhrzeit 18:30 auf Deutsch.", "Achtzehn Uhr dreißig."),
    check("7 Uhr abends ist welche Uhrzeit im 24-Stunden-System?", "19:00 Uhr."),
    check("Welche Uhrzeit ist 08:15?", "Acht Uhr fünfzehn."),
    check("Welche Präposition benutzt du vor einem Wochentag?", "am, zum Beispiel: am Montag."),
    check("Welche Präposition benutzt du vor einer Uhrzeit?", "um, zum Beispiel: um 18 Uhr."),
    check("Ergänze: Der Kurs ist ___ Montag ___ 18 Uhr.", "am Montag um 18 Uhr."),
    check("Wie sagst du den 5. Mai mit am?", "am fünften Mai."),
    check("Was bedeutet das Datum 03.10.2026?", "Der dritte Oktober 2026."),
    check("Was ist der Unterschied zwischen „am Montag“ und „um 18 Uhr“?", "am nennt den Tag; um nennt die Uhrzeit."),
    check("Ein Zug fährt um 14:45 Uhr. Ist das vor oder nach 15 Uhr?", "Vor 15 Uhr."),
    check("Exit-Check: Sage einen Termin mit Tag, Datum und Uhrzeit.", "Accept a correct A1 example using am for the day/date and um for the time, for example: am Montag, am fünften Mai, um 18 Uhr."),
  ],
  "A1-3.6": [
    check("Was bedeutet können?", "Können bedeutet ability: etwas ist möglich / jemand hat die Fähigkeit."),
    check("Bilde einen Satz mit können.", "Zum Beispiel: Ich kann Deutsch sprechen."),
    check("Was bedeutet müssen?", "Müssen bedeutet necessity or obligation."),
    check("Bilde einen Satz mit müssen.", "Zum Beispiel: Ich muss heute lernen."),
    check("Was bedeutet möchten?", "Möchten drückt einen höflichen Wunsch aus."),
    check("Bilde einen Satz mit möchten.", "Zum Beispiel: Ich möchte einen Tee trinken."),
    check("Wo steht das konjugierte Modalverb in einem einfachen Hauptsatz?", "Normalerweise auf Position 2: Ich kann heute kommen."),
    check("Wo steht der zweite Verbteil nach können, müssen oder möchten?", "Der Infinitiv steht am Satzende: Ich kann Deutsch sprechen."),
    check("Korrigiere: „Ich kann spreche Deutsch.“", "Ich kann Deutsch sprechen."),
    check("Ergänze: „Wir ___ heute arbeiten.“ Benutze müssen.", "Wir müssen heute arbeiten."),
    check("Exit-Check: Bilde einen neuen Satz mit können, müssen oder möchten und einem Infinitiv am Ende.", "Accept one correct A1 sentence with a conjugated modal verb and a final infinitive."),
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
    check("Is ‘Liebe Anna’ one of the three content points?", "No. ‘Liebe Anna’ is the informal greeting. It is required letter form, but it is not one of the three content points."),
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
  // A1-13 presenter checks are weather/time application only; do not restore content-point recall here.
  "A1-13": [
    check("How do you say ‘It is raining’ in German?", "Es regnet.", "Check the weather verb directly."),
    check("How do you say ‘It is snowing’ in German?", "Es schneit.", "Check the second core weather verb."),
    check("How do you say ‘It is cold’ in German?", "Es ist kalt.", "Use Es ist + adjective."),
    check("Which is correct: ‘Es regnet’ or ‘Es ist regnet’?", "Es regnet.", "regnen is already the verb; do not add ist."),
    check("Which preposition do you use with seasons and months? Give one example.", "Use im: im Sommer, im Winter, im Januar, im Juli.", "Check that the learner can use im with a season or month."),
    check("Which preposition do you use with days? Give one example.", "Use am: am Montag, am Samstag.", "Check am + day."),
    check("Which preposition do you use with clock times? Give one example.", "Use um: um 8 Uhr, um 16 Uhr.", "Check um + clock time."),
    check("Ordne die Wörter: Sommer · im · warm · ist · es", "Im Sommer ist es warm.", "Sentence building with im + season."),
    check("Ordne die Wörter: Montag · am · uns · treffen · wir", "Wir treffen uns am Montag.", "Sentence building with am + day."),
    check("Ordne die Wörter: uns · wir · Montag · am · Uhr · 16 · treffen · können", "Können wir uns am Montag um 16 Uhr treffen?", "Sentence building with am + day and um + time for a letter."),
    check("Exit-Check: Cancel, give a weather reason, and suggest a new day and time.", "For example: Leider kann ich nicht kommen. Es regnet sehr stark. Können wir uns am Montag um 16 Uhr treffen?", "The learner should combine weather grammar with practical letter time expressions."),
  ],
  "A1-14.1": [
    check("Ergänze: Ich ___ krank. Ich ___ Fieber.", "Ich bin krank. Ich habe Fieber.", "Use sein + adjective; haben + symptom noun."),
    check("Was ist richtig: Mein Kopf tut weh oder Mein Kopf tun weh?", "Mein Kopf tut weh.", "A singular body part takes tut."),
    check("Ergänze: Meine Beine ___ weh.", "Meine Beine tun weh.", "Plural body parts take tun."),
    check("Korrigiere: Ich habe krank.", "Ich bin krank.", "krank is an adjective, so use sein, not haben."),
    check("Ordne die Wörter: leider · kann · ich · nicht · kommen", "Leider kann ich nicht kommen.", "After Leider, the conjugated modal verb is in position two; kommen goes last."),
    check("Korrigiere: Ich kann heute nicht komme.", "Ich kann heute nicht kommen.", "Use the infinitive kommen after kann."),
    check("Dein Freund sagt: Ich habe am Montag Zeit. Frage nach der Zeit mit wann.", "Wann hast du Zeit?", "W-word + conjugated verb + subject; du takes hast."),
    check("Frage die Kursleiterin höflich nach ihrer freien Zeit. Beginne mit wann und benutze Sie.", "Wann haben Sie Zeit?", "Formal Sie takes haben and is capitalized."),
    check("Ergänze: Wir treffen uns ___ Samstag ___ 15 Uhr.", "Wir treffen uns am Samstag um 15 Uhr.", "Use am with a day and um with a clock time, as in chapter 13."),
    check("Ordne die Wörter: können · wir · uns · nächste Woche · treffen", "Können wir uns nächste Woche treffen?", "In a yes/no question, the modal verb comes first and the infinitive last."),
    check("Exit-Check: Sage Felix, dass du nicht zu seinem Geburtstag kommen kannst. Nenne einen Gesundheitsgrund und schlage einen neuen Tag mit Uhrzeit vor.", "Zum Beispiel: Leider kann ich nicht zu deinem Geburtstag kommen. Ich habe Kopfschmerzen. Können wir uns am Montag um 16 Uhr treffen?", "Accept another clear A1 health reason and meeting time. Check cancellation, reason and new meeting in actual German sentences."),
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
  const fallbackExitQuestion =
    clean(slide.wrapUpTaskDe)
    || clean(slide.studentQuestionsDe?.[0])
    || clean(slide.warmupQuestionsDe?.[0]);
  const exitCheck = fallback.length
    ? fallback[fallback.length - 1]
    : learnerPrompt(fallbackExitQuestion, lessonLabel);
  const conceptChecks = fallback.length > 1 ? fallback.slice(0, -1) : fallback;

  // A1 live checks should ask what learners understand and can use.
  // Teacher-only mistake notes must never become learner-facing questions.
  const applicationChecks = [
    ...conceptChecks,
    ...(Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : []).map((question) => directUnderstandingPrompt(question, lessonLabel)),
    ...(Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : []).map((question) => directUnderstandingPrompt(question, lessonLabel)),
  ];

  const exitKey = exitCheck ? questionKey(exitCheck.questionDe) : "";
  const classChecks = uniqueChecks(applicationChecks)
    .filter((item) => questionKey(item.questionDe) !== exitKey)
    .slice(0, 10);

  if (classChecks.length < 10) {
    throw new Error(`${key || "A1 lesson"} does not provide enough distinct material for a 10-student understanding check.`);
  }

  return exitCheck ? [...classChecks, exitCheck] : classChecks;
}

export { A1_PRESENTER_UNDERSTANDING_OVERRIDES };

