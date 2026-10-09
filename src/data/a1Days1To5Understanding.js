// A1 Days 1–5: exactly ten comprehension checks and one fresh exit question
// for each published lesson block. Prompts are based on the existing curated
// teacher slides and their real Course Book tasks, not on fabricated submissions.
// noteEn is a concrete teacher explanation, not an automatically detected error.
const check = (questionDe, answerDe, noteEn) => ({ questionDe, answerDe, noteEn });

export const A1_DAYS1_TO5_UNDERSTANDING = Object.freeze({
  // Day 1 · Greetings, politeness and farewells.
  "A1-0.1": [
    check("Welche Begrüßung passt um 7 Uhr?", "Guten Morgen!", "Use Guten Morgen for the morning; the question provides the time."),
    check("Welche Begrüßung passt am Abend?", "Guten Abend!", "Gute Nacht normally ends the day or is said before bed; it is not the usual evening greeting."),
    check("Was sagst du zur Begrüßung am Nachmittag?", "Guten Tag!", "Guten Tag is a daytime greeting; it does not depend on knowing the person's name."),
    check("Welche Frage passt zu einem Freund: Wie geht es dir oder Wie geht es Ihnen?", "Wie geht es dir?", "With one friend, use informal du and the corresponding dative pronoun dir."),
    check("Welche Frage passt zu einer unbekannten erwachsenen Person?", "Wie geht es Ihnen?", "Formal Sie uses Ihnen in this well-being question, not dir."),
    check("Was kannst du auf „Wie geht es dir?“ antworten?", "Mir geht es gut, danke.", "A short and complete well-being answer is enough; other truthful A1 responses also count."),
    check("Ist „Tschüss!“ formell oder informell?", "Informell.", "Tschüss is an informal farewell; use Auf Wiedersehen when greater formality is appropriate."),
    check("Welche Verabschiedung ist höflich: Tschüss oder Auf Wiedersehen?", "Auf Wiedersehen!", "Auf Wiedersehen is a suitable neutral or formal goodbye."),
    check("Korrigiere die Abendbegrüßung: „Gute Nacht! Schön, dass Sie da sind.“", "Guten Abend! Schön, dass Sie da sind.", "Guten Abend is the greeting when meeting someone in the evening; Gute Nacht is a farewell."),
    check("Ergänze die höfliche Frage: Wie geht es ___?", "Wie geht es Ihnen?", "The formal question uses Ihnen with a capital I."),
    check("Exit-Check: Begrüße eine Lehrerin am Morgen, frage höflich nach ihrem Befinden und verabschiede dich.", "Guten Morgen! Wie geht es Ihnen? Auf Wiedersehen!", "Check the morning greeting, formal Ihnen and suitable goodbye; equivalent polite A1 answers are valid."),
  ],

  // Day 2, first block · German alphabet and letters heard in the workbook.
  "A1-0.2": [
    check("Wie viele Buchstaben hat das deutsche Standardalphabet?", "26 Buchstaben.", "German also uses Ä, Ö, Ü and ß, but these are not four extra standard alphabet letters."),
    check("Welche vier zusätzlichen Zeichen benutzt man im Deutschen?", "Ä, Ö, Ü und ß.", "Distinguish the three umlaut letters from ß (Eszett)."),
    check("Warum sind Ä, Ö und Ü wichtig?", "Sie haben eigene Laute und können die Aussprache und Bedeutung eines Wortes verändern.", "Umlauts affect pronunciation and may distinguish words; practise recognising them in writing and by ear."),
    check("Wie heißt ß?", "Eszett oder scharfes S.", "Do not mistake the symbol ß for the Latin letter B."),
    check("Wie spricht man den Buchstaben V auf Deutsch aus?", "Vau.", "This asks for the name of the letter, not its sound in every word."),
    check("Wie spricht man den Buchstaben W auf Deutsch aus?", "We.", "This asks for the German letter name."),
    check("Wie spricht man den Buchstaben I auf Deutsch aus?", "I.", "Keep the German letter name clear for the missing-letter listening task."),
    check("Wie spricht man den Buchstaben A auf Deutsch aus?", "A.", "Say the letter name rather than inventing a word beginning with A."),
    check("Buchstabiere „Wasser“.", "W-A-S-S-E-R.", "There are six letters, including two consecutive s; check sequence, not conversation fluency."),
    check("Wie buchstabierst du deinen Nachnamen?", "Accept any clearly spelled surname with its German letter names.", "Each surname is different. Listen for the correct letter sequence and clear German letter names."),
    check("Exit-Check: Nenne die 26 Buchstaben als Standardalphabet und die vier zusätzlichen Zeichen Ä, Ö, Ü und ß.", "26 Buchstaben im Standardalphabet; zusätzlich Ä, Ö, Ü und ß.", "Keep the alphabet count separate from the four additional writing characters."),
  ],

  // Day 2, second block · Pronouns and regular present-tense conjugation.
  "A1-1.1": [
    check("Welche Personalpronomen gibt es im Deutschen?", "ich, du, er, sie, es, wir, ihr, sie und Sie.", "The spelling of lowercase sie and formal capital Sie changes the meaning."),
    check("Welche Endung hat ein regelmäßiges Verb bei ich?", "-e, zum Beispiel: ich lerne.", "Remove -en from lernen to get lern-, then add the ich ending -e."),
    check("Welche Endung hat ein regelmäßiges Verb bei du?", "-st, zum Beispiel: du lernst.", "Do not leave the infinitive lernen after du."),
    check("Welche Endung hat ein regelmäßiges Verb bei er, sie oder es?", "-t, zum Beispiel: er lernt.", "These third-person singular pronouns normally take -t for a regular verb."),
    check("Welche Endung hat ein regelmäßiges Verb bei wir?", "-en, zum Beispiel: wir lernen.", "wir takes -en, not the er/sie/es ending -t."),
    check("Welche Endung hat ein regelmäßiges Verb bei ihr?", "-t, zum Beispiel: ihr lernt.", "ihr is plural, but uses -t, unlike wir and sie/Sie."),
    check("Welche Endung hat ein regelmäßiges Verb bei sie im Plural?", "-en, zum Beispiel: sie lernen.", "Plural sie takes -en; do not confuse it with singular sie lernt."),
    check("Welche Endung hat ein regelmäßiges Verb bei Sie als höfliche Anrede?", "-en, zum Beispiel: Sie lernen.", "Formal Sie is always capitalised and conjugates like plural sie."),
    check("Korrigiere: „Wir lernt Deutsch.“", "Wir lernen Deutsch.", "The subject wir requires -en, so use lernen."),
    check("Korrigiere: „Ihr lernen Deutsch.“", "Ihr lernt Deutsch.", "ihr requires the -t ending, not -en."),
    check("Exit-Check: Konjugiere lernen mit ich, du, er, wir, ihr und Sie.", "ich lerne · du lernst · er lernt · wir lernen · ihr lernt · Sie lernen.", "The subject changes the ending: -e, -st, -t, -en, -t, -en."),
  ],

  // Day 3, first block · Self-practice: ONLY definite articles, adjectives, W-questions.
  "A1-1.1-PRACTICE": [
    check("Welcher Artikel passt zu Tisch: der, die oder das?", "der Tisch.", "At this stage, learn each singular noun with its definite article."),
    check("Welcher Artikel passt zu Frau?", "die Frau.", "The definite feminine singular article is die."),
    check("Welcher Artikel passt zu Buch?", "das Buch.", "Buch is neuter and uses das in the nominative."),
    check("Welcher Artikel passt zu Schule?", "die Schule.", "Schule is feminine; teach the word as die Schule."),
    check("Welcher Artikel passt zu Auto?", "das Auto.", "Auto is neuter; teach das Auto as one vocabulary item."),
    check("Ergänze den Satz: „Der Ball ist ___.“ (klein)", "Der Ball ist klein.", "An adjective after ist stays in its basic form; no adjective ending is added."),
    check("Welche Struktur passt: „Die Frau ___ freundlich“?", "Die Frau ist freundlich.", "The simple descriptive pattern is noun + ist + adjective."),
    check("Antwort: „Ich heiße Ama.“ Welches W-Wort passt?", "Wie? – Wie heißt du?", "Wie asks for a name; the conjugated verb directly follows the W-word."),
    check("Antwort: „Ich wohne in Accra.“ Welches W-Wort passt?", "Wo? – Wo wohnst du?", "Wo asks for a current location; do not use Woher here."),
    check("Antwort: „Ich komme aus Ghana.“ Welches W-Wort passt?", "Woher? – Woher kommst du?", "Woher asks about origin, while Wo asks where someone lives or is."),
    check("Exit-Check: Ergänze der/die/das für Tisch, Frau und Buch und wähle das W-Wort für „Ich komme aus Ghana“.", "der Tisch · die Frau · das Buch · Woher?", "This self-practice exit check uses articles and W-questions only; do not introduce ein/eine."),
  ],

  // Day 3, second block · Verb endings including arbeiten and heißen.
  "A1-1.2": [
    check("Welche Endung braucht lernen bei ich?", "-e: ich lerne.", "Begin with the pronoun to choose the ending, then attach it to lern-."),
    check("Welche Endung braucht lernen bei du?", "-st: du lernst.", "du takes -st with a regular verb."),
    check("Welche Endung braucht lernen bei er, sie oder es?", "-t: er lernt / sie lernt / es lernt.", "The third-person singular forms take -t."),
    check("Welche Endung braucht lernen bei wir?", "-en: wir lernen.", "wir takes the infinitive-like -en ending, not -t."),
    check("Welche Endung braucht lernen bei ihr?", "-t: ihr lernt.", "ihr takes -t, even though it addresses multiple people."),
    check("Welche Pronomen nehmen bei lernen die Endung -en?", "wir, sie (Plural) und Sie.", "The lowercase plural sie and formal Sie both use -en."),
    check("Korrigiere: „Wir lernt Deutsch.“", "Wir lernen Deutsch.", "The conjugation must agree with wir."),
    check("Korrigiere: „Ihr lernen Deutsch.“", "Ihr lernt Deutsch.", "For ihr choose the -t ending."),
    check("Was ist richtig: „du arbeitst“ oder „du arbeitest“?", "du arbeitest.", "The extra e makes the -st ending pronounceable after the stem arbeit-."),
    check("Was ist richtig: „du heißst“ oder „du heißt“?", "du heißt.", "The sibilant stem of heißen produces du heißt without a second s."),
    check("Exit-Check: Ergänze die korrekten Formen: du ___ (arbeiten), ihr ___ (lernen), Sie ___ (heißen).", "du arbeitest · ihr lernt · Sie heißen.", "Check all three patterns without asking learners to build unrelated questions."),
  ],

  // Day 4 · Numbers (NOT phone/address dialogue drills).
  "A1-2": [
    check("Wie schreibt man die Zahl 16 auf Deutsch?", "sechzehn.", "Use sech- in sechzehn; sechszehn is incorrect."),
    check("Wie schreibt man die Zahl 17 auf Deutsch?", "siebzehn.", "Use sieb- in siebzehn; siebenzehn is incorrect."),
    check("Wie schreibt man die Zahl 25 auf Deutsch?", "fünfundzwanzig.", "For 21–99 the ones normally come before und + tens."),
    check("Wie schreibt man die Zahl 32 auf Deutsch?", "zweiunddreißig.", "Say two-and-thirty; zwanzigdreißig is not the German pattern."),
    check("Wie schreibt man die Zahl 98 auf Deutsch?", "achtundneunzig.", "The eight comes before und + neunzig."),
    check("Welche Zahl ist „vierundzwanzig“?", "24.", "Identify the units part vier and the tens part zwanzig."),
    check("Welche Zahl ist „neunundvierzig“?", "49.", "Do not reverse the order when writing the digits."),
    check("Wie sagt man die Zahl 222?", "zweihundertzweiundzwanzig.", "Keep hundert and the two-digit number in the same compound."),
    check("Wie sagt man die Zahl 509?", "fünfhundertneun.", "There is no invented tens group when the number is 509."),
    check("Wie sagt man die Zahl 2040?", "zweitausendvierzig.", "Say zweitausend plus vierzig; do not insert und."),
    check("Exit-Check: Schreibe 16, 25 und 2040 als deutsche Zahlwörter.", "sechzehn · fünfundzwanzig · zweitausendvierzig.", "This lesson checks German number writing; the Day 4 workbook has no Hören section."),
  ],

  // Day 5 · Independent consolidation of definite articles and W-questions.
  "A1-1.3": [
    check("Welcher Artikel passt zu Tisch?", "der Tisch.", "Learn der together with Tisch rather than memorising Tisch alone."),
    check("Welcher Artikel passt zu Lampe?", "die Lampe.", "Lampe is feminine, so say die Lampe."),
    check("Welcher Artikel passt zu Auto?", "das Auto.", "Auto is neuter, so say das Auto."),
    check("Ergänze: „___ Tisch ist groß.“", "Der Tisch ist groß.", "Use the definite article der for Tisch and keep the noun capitalised."),
    check("Ergänze: „Die Lampe ___ neu.“", "Die Lampe ist neu.", "A simple description uses subject + ist + adjective."),
    check("Korrigiere die Beschreibung: „Das Haus ist kleines.“", "Das Haus ist klein.", "After ist, the adjective stays in its basic form; do not add -es."),
    check("Welche W-Frage passt zu „Ich heiße Ama“?", "Wie heißt du?", "Wie asks for a person's name."),
    check("Welche W-Frage passt zu „Ich wohne in Accra“?", "Wo wohnst du?", "Wo asks about the current location."),
    check("Welche W-Frage passt zu „Ich komme aus Ghana“?", "Woher kommst du?", "Woher asks about origin; the verb comes directly after the W-word."),
    check("Ordne die Wörter zu einer Frage: „wo / du / wohnst“.", "Wo wohnst du?", "In a W-question the order is W-word + conjugated verb + subject."),
    check("Exit-Check: Ergänze die Artikel für Tisch, Lampe und Auto und bilde die Frage zu „Ich wohne in Accra“.", "der Tisch · die Lampe · das Auto · Wo wohnst du?", "Use only the definite articles, predicative adjective and W-question patterns taught by Day 5."),
  ],
});

// Two separate, unscored warm-up questions per block. They are not copied from
// the 10 independent class-check prompts (no advance answer reveal).
export const A1_DAYS1_TO5_QUICK_CHECKS = Object.freeze({
  "A1-0.1": [
    check("Was sagst du, wenn deine Freundin morgens kommt?", "Guten Morgen!", "Use the morning greeting without requiring a long dialogue."),
    check("Ist „Tschüss“ ein formelles Wort?", "Nein, „Tschüss“ ist informell.", "Formal farewells normally use Auf Wiedersehen."),
  ],
  "A1-0.2": [
    check("Wie heißt das Zeichen Ä?", "A-Umlaut.", "This is one of the three umlaut letters."),
    check("Welches Zeichen nennt man Eszett?", "ß.", "Eszett is a special character, not another name for B."),
  ],
  "A1-1.1": [
    check("Ergänze das Verb: „ich ___ Deutsch“ (lernen).", "ich lerne Deutsch.", "ich takes -e."),
    check("Ergänze: „ihr ___ Deutsch“ (lernen).", "ihr lernt Deutsch.", "ihr takes -t."),
  ],
  "A1-1.1-PRACTICE": [
    check("Ist „die Frau“ oder „das Frau“ richtig?", "die Frau.", "Frau is a feminine singular noun."),
    check("Ergänze den Satz: „Das Haus ___ groß.“", "Das Haus ist groß.", "Use ist + adjective without a further ending."),
  ],
  "A1-1.2": [
    check("Ist „wir lernt“ oder „wir lernen“ richtig?", "wir lernen.", "wir requires -en."),
    check("Welche Form passt zu er: „arbeitet“ oder „arbeitst“?", "er arbeitet.", "er takes -et here; du arbeitest takes -est."),
  ],
  "A1-2": [
    check("Wie schreibt man 21?", "einundzwanzig.", "Put ein before und + zwanzig."),
    check("Wie schreibt man 30?", "dreißig.", "This is an irregular tens word; do not write dreizig."),
  ],
  "A1-1.3": [
    check("Ist „die Lampe“ oder „das Lampe“ richtig?", "die Lampe.", "At Day 5 review the definite article with the noun."),
    check("Wie heißt das Fragewort für einen Ort?", "Wo.", "Wo asks for a location, not origin."),
  ],
});

// Controlled application tasks use the lesson's grammar. They are not
// mini-dialogues, speeches or automatic proficiency assessments.
export const A1_DAYS1_TO5_APPLICATION_CHECKS = Object.freeze({
  "A1-0.1": [
    check("Wähle die höfliche Frage: „Wie geht es dir?“ oder „Wie geht es Ihnen?“", "Wie geht es Ihnen?", "A formal conversation requires Ihnen."),
    check("Korrigiere: „Gute Nacht!“, wenn du jemanden am Abend begrüßt.", "Guten Abend!", "Gute Nacht is for ending the day."),
  ],
  "A1-0.2": [
    check("Buchstabiere „Haus“.", "H-A-U-S.", "Four letters in the correct order are sufficient."),
    check("Welche Zeichen sind die Umlautbuchstaben?", "Ä, Ö und Ü.", "ß is an additional character but not an umlaut."),
  ],
  "A1-1.1": [
    check("Korrigiere: „ich lernen Deutsch“.", "Ich lerne Deutsch.", "The ich verb ending is -e."),
    check("Korrigiere: „Sie lernt Deutsch“, wenn du höflich sprichst.", "Sie lernen Deutsch.", "Formal Sie takes -en."),
  ],
  "A1-1.1-PRACTICE": [
    check("Ordne die Wörter: „wohnst / wo / du“.", "Wo wohnst du?", "W-question order: W-word, conjugated verb, subject."),
    check("Korrigiere: „Der Ball ist kleiner“, wenn du nur sagen willst, dass der Ball klein ist.", "Der Ball ist klein.", "The lesson uses a basic ist + adjective description, not a comparison."),
  ],
  "A1-1.2": [
    check("Korrigiere: „du arbeitst“.", "du arbeitest.", "arbeiten inserts an e before the ending -st."),
    check("Korrigiere: „du heißst“.", "du heißt.", "heißen uses du heißt."),
  ],
  "A1-2": [
    check("Wie schreibt man 67 als Wort?", "siebenundsechzig.", "The units sieben come before the tens sechzig."),
    check("Wie schreibt man 315 als Wort?", "dreihundertfünfzehn.", "Combine the hundred and remaining fifteen."),
  ],
  "A1-1.3": [
    check("Ergänze: „Das Auto ___ schnell.“", "Das Auto ist schnell.", "The adjective follows ist without a special ending."),
    check("Ordne die Wörter: „du / wie / heißt“.", "Wie heißt du?", "Use Wie + conjugated verb + subject."),
  ],
});

export function getA1Days1To5QuickChecks(assignmentId = "") {
  return A1_DAYS1_TO5_QUICK_CHECKS[String(assignmentId || "").trim().toUpperCase()] || null;
}

export function getA1Days1To5ApplicationChecks(assignmentId = "") {
  return A1_DAYS1_TO5_APPLICATION_CHECKS[String(assignmentId || "").trim().toUpperCase()] || null;
}

export const A1_DAYS1_TO5_ASSIGNMENTS = Object.freeze(Object.keys(A1_DAYS1_TO5_UNDERSTANDING));

export function getA1Days1To5UnderstandingChecks(assignmentId = "") {
  const key = String(assignmentId || "").trim().toUpperCase();
  return A1_DAYS1_TO5_UNDERSTANDING[key] || null;
}
