function check(questionDe, answerDe, noteEn = "", responseMode = "concept") {
  return { questionDe, answerDe, noteEn, responseMode };
}

// A1 Presenter Mode is deliberately concept-first. The workbook already contains
// controlled gap-fill and form drills, so the live/after-class check asks learners
// to explain the new idea, identify the rule, and give a simple example.
export const A1_GRAMMAR_CHECKS = {
  "A1-0.1": [
    check("What is the difference between du and Sie when speaking to someone?", "du is informal; Sie is formal and polite."),
    check("Why do we say ‘Wie geht es dir?’ to a friend but ‘Wie geht es Ihnen?’ formally?", "The pronoun changes according to the person and level of formality."),
    check("How do you decide between Guten Morgen, Guten Tag and Guten Abend?", "Choose the greeting according to the time of day."),
    check("What makes a German greeting formal or informal?", "The pronoun, greeting, and relationship with the person determine the level of formality."),
  ],
  "A1-0.2": [
    check("What is the purpose of learning the German alphabet at A1?", "It helps you spell names, addresses, email addresses, and unfamiliar words clearly."),
    check("What are Ä, Ö and Ü called, and why are they important?", "They are Umlauts. They are separate sounds and can change pronunciation and meaning."),
    check("What is ß in German?", "It is called Eszett or scharfes S and represents an s-sound in German spelling."),
    check("When would you need to spell a word letter by letter in real life?", "For names, addresses, email addresses, bookings, forms, or when someone does not understand a word."),
  ],
  "A1-1.1": [
    check("What are personal pronouns in German?", "Words such as ich, du, er, sie, es, wir, ihr and Sie that replace a person or thing as the subject."),
    check("What does verb conjugation mean?", "Changing the verb form so that it agrees with the subject."),
    check("Why do we say ‘ich wohne’ but ‘du wohnst’?", "Because the verb ending changes with the subject pronoun."),
    check("Where is the conjugated verb normally placed in a simple German statement?", "Usually in position 2."),
  ],
  "A1-1.1-PRACTICE": [
    check("What is the concept behind W-Wörter in German?", "W-Wörter ask for specific information. Examples include wer, was, wo, woher, wohin, wann, wie and warum."),
    check("Where does the conjugated verb go in a W-question?", "Directly after the W-word: W-word + verb + subject + …"),
    check("What is the difference between a W-question and a yes/no question?", "A W-question asks for specific information; a yes/no question can normally be answered with ja or nein."),
    check("What do ein and eine do in German?", "They are indefinite articles and show that we mean one non-specific noun; the form also reflects gender and case."),
  ],
  "A1-1.2": [
    check("What information does a German verb ending give you?", "It shows which person or subject is doing the action."),
    check("What usually happens to a regular verb before we add the personal ending?", "We remove -en or -n to find the verb stem and then add the correct ending."),
    check("Which subjects normally use the infinitive-like ending -en in the present tense?", "wir, Sie and usually sie (plural)."),
    check("Why is it important to learn a verb together with its conjugation pattern?", "Because the correct ending is needed to make the subject and verb agree."),
  ],
  "A1-2": [
    check("What is special about the order of German numbers from 21 to 99?", "The ones come before the tens: einundzwanzig literally means one-and-twenty."),
    check("Why is clear number pronunciation important for phone numbers and addresses?", "Because one wrong digit can change the whole contact detail."),
    check("How do Germans usually give a phone number in a simple A1 conversation?", "By saying the digits or small number groups clearly and confirming when necessary."),
    check("What question words or expressions help you ask for contact information?", "For example: Wie ist …? Wie lautet …? Wo wohnst du?"),
  ],
  "A1-1.3": [
    check("What is an indefinite article in German?", "ein or eine used when a noun is not yet specific or is being introduced."),
    check("How do you know whether to use ein or eine in the nominative?", "Use ein with masculine and neuter nouns, and eine with feminine nouns."),
    check("Why is noun gender important when learning German vocabulary?", "Because gender affects articles and later also case and adjective endings."),
    check("What is the basic word order of a simple German self-introduction sentence?", "Usually subject + conjugated verb + the remaining information."),
  ],
  "A1-2.3": [
    check("What do possessive articles such as mein and dein express?", "They show possession or relationship: my, your, and so on."),
    check("Why can mein change to meine?", "The ending changes according to the gender, number, and case of the noun."),
    check("How do you talk about hobbies naturally in German?", "Use a conjugated activity verb or expressions with gern, for example: Ich höre gern Musik."),
    check("What must happen to the verb when the subject changes from ich to mein Bruder or meine Eltern?", "The verb must be conjugated to match the new subject."),
  ],
  "A1-3": [
    check("What is the difference between kostet and kosten when asking about price?", "kostet is used with a singular subject; kosten is used with a plural subject."),
    check("What does gern express in German?", "It shows that you like doing an activity."),
    check("What is the difference between mögen and möchten?", "mögen expresses liking; möchten is used for a polite wish or something you would like."),
    check("What is the basic idea behind asking ‘Wie viel kostet …?’", "You are asking for the price of a singular item; with plural items use ‘Wie viel kosten …?’"),
  ],
  "A1-4": [
    check("What does aus express when talking about countries or origin?", "It expresses where someone comes from: Ich komme aus Ghana."),
    check("What is the difference between ‘Ich komme aus Ghana’ and ‘Ich spreche Deutsch’?", "The first gives origin; the second gives a language someone speaks."),
    check("Why do country and language names need to be learned as vocabulary, not translated word for word?", "German has its own names and sometimes different article or pronunciation patterns."),
    check("What must you remember about the verb when changing from ich to er or sie?", "The verb must be conjugated for er/sie, usually with -t for regular verbs."),
  ],
  "A1-5": [
    check("What is the main job of the nominative case?", "It marks the subject: the person or thing doing the action."),
    check("What is the main job of the accusative case?", "It often marks the direct object: the person or thing directly affected by the action."),
    check("What important article change happens with masculine nouns in the accusative?", "der becomes den and ein becomes einen."),
    check("How can you identify the subject and direct object in a simple sentence?", "Ask who or what does the action for the subject, and who or what receives the action for the direct object."),
  ],
  "A1-6": [
    check("What do possessive articles such as mein, dein and sein show?", "They show who something belongs to."),
    check("Why can a possessive article change its ending?", "Its form depends on the gender, number, and case of the noun that follows."),
    check("What happens to an adjective after sein in a sentence such as ‘Das Auto ist rot’?", "It stays in its basic form; it does not take an adjective ending there."),
    check("Why is it useful to learn nouns together with der, die or das?", "The noun gender helps you choose the correct articles and possessive forms."),
  ],
  "A1-7": [
    check("What does halb mean when telling time in German?", "It refers to half an hour before the next hour: halb acht means 7:30."),
    check("What is the idea behind nach and vor when telling time?", "nach means after the hour; vor means before the next hour."),
    check("Which preposition is normally used before a specific clock time?", "um, for example: um 18 Uhr."),
    check("What is the difference between formal digital time and everyday 12-hour expressions?", "Formal time often uses exact 24-hour forms; everyday speech often uses halb, Viertel, nach and vor."),
  ],
  "A1-8": [
    check("What is the main difference between the 12-hour and 24-hour clock in German?", "The 24-hour clock gives the exact hour from 00 to 23 and is common in schedules and formal contexts."),
    check("Which preposition is normally used with days and dates?", "am, for example: am Montag or am 5. Mai."),
    check("Why are ordinal numbers important when saying dates?", "German dates use ordinal forms such as der erste, der zweite, am fünften."),
    check("Where are 24-hour times especially common in German-speaking countries?", "On timetables, appointments, travel information, official schedules, and written notices."),
  ],
  "A1-3.5": [
    check("What pattern helps you build German numbers above 20?", "Usually ones + und + tens, for example zweiunddreißig."),
    check("What does halb mean in German time expressions?", "Half an hour before the next hour."),
    check("How are euros and cents normally expressed when giving a price?", "Say the euro amount and cent amount clearly, for example zwölf Euro fünfzig."),
    check("How do singular and plural items affect kostet and kosten?", "Use kostet for one item and kosten for plural items."),
  ],
  "A1-3.6": [
    check("What is a modal verb?", "A verb that adds meanings such as ability, necessity, permission, intention, or desire to another verb."),
    check("Where does the modal verb go in a simple German main clause?", "The conjugated modal verb normally goes in position 2."),
    check("Where does the second verb go when a modal verb is used?", "The second verb stays in the infinitive at the end of the clause."),
    check("What kinds of meanings do können, müssen and möchten express?", "können = ability/possibility, müssen = necessity, möchten = polite wish."),
  ],
  "A1-4.7": [
    check("What is tested in Teil 1 of the Goethe A1 speaking exam?", "Giving basic personal information and introducing yourself."),
    check("What is tested in Teil 2?", "Asking and answering simple questions on familiar topics."),
    check("What is tested in Teil 3?", "Making a request or instruction and reacting appropriately."),
    check("What is the main strategy for the A1 speaking exam?", "Use short complete sentences, listen carefully to the task, and respond directly to what is asked."),
  ],
  "A1-9": [
    check("What is the difference between kein and nicht?", "kein usually negates a noun with no definite article; nicht negates verbs, adjectives, adverbs, or other parts of the sentence."),
    check("Why can kein change to keine or keinen?", "It changes according to the noun's gender, number, and case."),
    check("When would you normally use kein with food vocabulary?", "When saying you have, eat, or want none of a noun, for example: Ich esse keinen Käse."),
    check("What question can help you decide between kein and nicht?", "Ask whether you are negating a noun with an article-like form or negating the action/quality/whole statement."),
  ],
  "A1-10": [
    check("What does gern tell us about an activity?", "It shows that the speaker likes doing that activity."),
    check("Where does the conjugated verb normally go when a time expression starts the sentence?", "The verb stays in position 2, so the subject usually comes after it."),
    check("Why do verbs still need conjugation when talking about daily routines?", "Because the verb form must agree with the person doing the activity."),
    check("How can you make a simple daily-routine sentence more informative?", "Add a time, frequency, food/activity, or place while keeping the verb in the correct position."),
  ],
  "A1-11": [
    check("How do you form the polite Sie-imperative for directions?", "Put the verb first, then Sie, then the rest: Gehen Sie geradeaus."),
    check("What happens to abbiegen in a polite direction?", "It separates: Biegen Sie links ab. / Biegen Sie rechts ab."),
    check("How can you politely ask for directions to a place?", "For example: Entschuldigung, wo ist der Bahnhof? / Wie komme ich zum Bahnhof? / Wie komme ich zur Apotheke?"),
    check("Which words help you build a short route?", "Use words such as geradeaus, links, rechts, Kreuzung, Straße, auf der linken/rechten Seite and neben."),
  ],
  "A1-12.1": [
    check("What is the main concept behind two-way prepositions?", "The same preposition can take dative for location and accusative for movement toward a destination."),
    check("What question helps you choose dative with a two-way preposition?", "Wo? — where is something located?"),
    check("What question helps you choose accusative with a two-way preposition?", "Wohin? — where is something moving or being placed?"),
    check("Why can ‘auf dem Tisch’ and ‘auf den Tisch’ both be correct?", "The first describes location; the second describes movement toward the table."),
  ],
  "A1-12.2": [
    check("What does als express when talking about a profession?", "It means ‘as’ in the role or profession: Ich arbeite als Lehrer."),
    check("What does bei often express in work sentences?", "Working at/for an employer, company, or person."),
    check("When is in useful for describing a workplace?", "When referring to being inside or working in a place such as a hospital, office, or school."),
    check("What does zur Arbeit express?", "Movement or direction to work; zur is a contraction of zu der."),
  ],
  "A1-5.9": [
    check("Teil 1: Introduce yourself with seven key points.", "Name, age, country, place of residence, languages, profession/study and hobby.", "", "performance"),
    check("Teil 1: What should you do if the examiner asks you to spell your surname?", "Spell it clearly, letter by letter, without adding a long explanation.", "", "knowledge"),
    check("Teil 2 · Wochenende: Make a suitable question.", "For example: Was machst du am Wochenende?", "", "performance"),
    check("Teil 2 · Familie: Make a suitable question.", "For example: Hast du Geschwister? / Wie viele Geschwister hast du?", "", "performance"),
    check("Teil 2 · Wohnort: Make a suitable question.", "For example: Wo wohnst du?", "", "performance"),
    check("Teil 2 · Getränke: Make a suitable yes/no question.", "For example: Trinkst du gern Kaffee?", "", "performance"),
    check("Teil 2: How should you answer your partner?", "Answer the question that was actually asked with one short complete sentence.", "", "knowledge"),
    check("Teil 3 · Stift: Make a polite request.", "For example: Können Sie mir bitte einen Stift geben?", "", "performance"),
    check("Teil 3 · Fenster: Make a polite request.", "For example: Können Sie bitte das Fenster öffnen?", "", "performance"),
    check("Teil 3: React naturally to a partner's request.", "For example: Ja, gern. / Ja, natürlich. / Kein Problem. / Tut mir leid.", "", "performance"),
    check("Final readiness: What should you do after a small mistake?", "Continue with simple German instead of stopping for a long time.", "", "knowledge"),
  ],
  "A1-12.3": [
    check("What is the difference between a formal and an informal German message?", "They use different greetings, pronouns, tone, and closing formulas."),
    check("How many content points must you answer in each A1-12.3 letter?", "Exactly three."),
    check("Do greeting, closing and name count as some of the three content points?", "No. They are required letter form, separate from the three content points."),
    check("What should you check before submitting the letter?", "All three content points are answered, the register is correct, and the greeting, closing and name are present."),
  ],
  "A1-13": [
    check("How many content points does the Day 13 email have?", "Exactly three."),
    check("What are the three Day 13 content points?", "Say you cannot come to the wedding, give one concrete weather reason, and suggest another meeting."),
    check("What is the difference between a weather description and a weather reason?", "A description only says what the weather is like. A reason explains why that weather prevents you from attending."),
    check("What is letter form and not an extra content point in Day 13?", "The informal greeting, closing and name."),
  ],
  "A1-14.1": [
    check("How many content points does the Day 14.1 email have?", "Exactly three."),
    check("What are the three Day 14.1 content points?", "Say you cannot come to the birthday, give one concrete health reason, and ask for or suggest another meeting."),
    check("What makes a health sentence useful for this writing task?", "It must describe a real health problem that functions as the reason for not attending."),
    check("What is letter form and not an extra content point in Day 14.1?", "The informal greeting, closing and name."),
  ],
  "A1-14.2": [
    check("What is the basic difference between dative and accusative objects?", "Accusative often marks the direct object; dative often marks the recipient or the object required by certain verbs."),
    check("Why must you learn verbs such as helfen and danken together with the dative?", "Because some German verbs require a specific case, and that case determines the article/pronoun form."),
    check("Which case does sehen normally take for the person or thing seen?", "Accusative."),
    check("What happens to masculine der in dative and accusative?", "der becomes dem in dative and den in accusative."),
  ],
  "A1-5.10": [
    check("What is the purpose of a conjunction?", "It connects words, phrases, or clauses and shows the relationship between ideas."),
    check("What relationship does aber express?", "A contrast."),
    check("What relationship does oder express?", "A choice or alternative."),
    check("What happens to normal main-clause word order after und, aber, oder and denn?", "The following main clause normally keeps verb-second word order."),
  ],
};

export function getA1GrammarChecks(assignmentId, slide = {}) {
  const key = String(assignmentId || "").trim().toUpperCase();
  const direct = A1_GRAMMAR_CHECKS[key];
  if (Array.isArray(direct) && direct.length) return direct;

  const support = slide.teacherSupport || {};
  const grammar = Array.isArray(support.grammarFocusEn) ? support.grammarFocusEn : [];
  const models = Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : [];
  const mistakes = Array.isArray(support.commonMistakesEn) ? support.commonMistakesEn : [];

  return [
    check("What is the main grammar or language concept in today's lesson?", grammar[0] || "Explain the main rule in your own words."),
    check("When do we use this concept in German?", models[0] || slide.keyPhrasesDe?.[0] || "Explain when the structure is useful."),
    check("What is one important rule or common mistake to remember?", mistakes[0] || "Explain one rule that helps you use the structure correctly."),
    check("Can you give one simple example that shows you understand the rule?", models[1] || models[0] || slide.keyPhrasesDe?.[1] || "Give one short correct example."),
  ];
}
