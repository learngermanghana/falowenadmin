// A1 Days 6–10: lesson-authored comprehension rather than role-play.
// Exactly ten independent class checks and one unaided exit check per lesson.
// The teacher's explanation follows the *actual* workbook/grammar content;
// never infer submission status or score a student automatically.
const check = (questionDe, answerDe, noteEn) => ({ questionDe, answerDe, noteEn });

export const A1_DAYS6_TO10_UNDERSTANDING = Object.freeze({
  // Day 6 · Family/languages/hobbies, self-learning + group discussion, NOT scored.
  "A1-2.3": [
    check("Welches Wort passt: ___ Vater (mein oder meine)?", "mein Vater.", "Vater is masculine; the nominative possessive is mein."),
    check("Welches Wort passt: ___ Mutter (mein oder meine)?", "meine Mutter.", "Mutter is feminine, so the possessive takes -e."),
    check("Ergänze: „Ich ___ einen Bruder.“", "Ich habe einen Bruder.", "The conjugated form with ich is habe."),
    check("Ergänze: „Ich spreche ___ bisschen Deutsch.“", "Ich spreche ein bisschen Deutsch.", "The expression is ein bisschen, not just bisschen."),
    check("Was bedeutet „Ich spreche ein bisschen Deutsch“?", "I speak a little German.", "ein bisschen means a little, not fluently or not at all."),
    check("Welche Ja/Nein-Frage passt zu „Du sprichst Deutsch.“?", "Sprichst du Deutsch?", "Yes/no questions begin with the conjugated verb."),
    check("Ordne die Wörter zu einer Ja/Nein-Frage: „du / spielst / Fußball“.", "Spielst du Fußball?", "Keep the conjugated verb first and the subject second."),
    check("Welche Form ist richtig: „Spielt er Fußball?“ oder „Spielen er Fußball?“", "Spielt er Fußball?", "For er, regular spielen takes the -t ending."),
    check("Ergänze: „Ich ___ gern.“ (lesen)", "Ich lese gern.", "With ich, conjugate lesen and put gern with the activity."),
    check("Was zeigt „gern“ in „Ich koche gern“?", "Die Person kocht gerne / likes cooking.", "gern signals enjoyment of the activity; it is not an infinitive ending."),
    check("Exit-Check: Ergänze „___ Mutter“, „___ Vater“ und bilde die Frage zu „Du sprichst Deutsch.“", "meine Mutter · mein Vater · Sprichst du Deutsch?", "Test possessive forms and verb-first questions without asking for a dialogue or scored submission."),
  ],

  // Day 7 · Prices, pronouns, preference. Workbook: prices, family writing, hobbies.
  "A1-3": [
    check("Ergänze: „Wie viel ___ das Buch?“", "Wie viel kostet das Buch?", "A single book is singular: kostet."),
    check("Ergänze: „Wie viel ___ die Äpfel?“", "Wie viel kosten die Äpfel?", "Plural Äpfel takes kosten."),
    check("Was ist richtig: „Der Stuhl kostet 50 Euro“ oder „Der Stuhl kosten 50 Euro“?", "Der Stuhl kostet 50 Euro.", "Stuhl is singular, so the finite verb takes -t."),
    check("Welches Pronomen ersetzt „der Tisch“?", "er.", "Masculine nominative nouns can be replaced by er."),
    check("Welches Pronomen ersetzt „die Lampe“?", "sie.", "Feminine nominative nouns can be replaced by sie."),
    check("Welches Pronomen ersetzt „das Auto“?", "es.", "Neuter nominative nouns can be replaced by es."),
    check("Ergänze: „Das Buch ist neu. ___ kostet 20 Euro.“", "Es kostet 20 Euro.", "Buch is neuter: das → es; it remains singular."),
    check("Ergänze: „Ich ___ Pizza.“ (mögen)", "Ich mag Pizza.", "mögen is irregular: ich mag, not ich mögen."),
    check("Ergänze: „Ich ___ gern.“ (lesen)", "Ich lese gern.", "For an activity, use its conjugated verb with gern."),
    check("Was bedeutet „lieber“ in „Ich schwimme gern, aber ich spiele lieber Tennis“?", "Tennis ist meine stärkere Vorliebe / I prefer tennis.", "lieber compares preferences; gern describes enjoyment."),
    check("Exit-Check: Ergänze „Die Lampe ___ 15 Euro. ___ ist neu.“ und nenne die passende Verbform für „die Äpfel“.", "Die Lampe kostet 15 Euro. Sie ist neu. Die Äpfel kosten ... Euro.", "Check singular/plural cost verbs and feminine sie; the plural price amount may vary."),
  ],

  // Day 8 · Origin/languages, location/destination; travel Hören is separate.
  "A1-4": [
    check("Complete the sentence: ‘Ich komme ___ Ghana.’", "Ich komme aus Ghana.", "aus gives origin: the person comes from Ghana."),
    check("Welche Frage fragt nach Herkunft: wo, woher oder wohin?", "Woher?", "Woher asks about origin, not present location or destination."),
    check("Welche Frage fragt nach einem Ort: wo, woher oder wohin?", "Wo?", "Wo asks where someone or something is."),
    check("Welche Frage fragt nach einem Ziel: wo, woher oder wohin?", "Wohin?", "Wohin asks where someone is going, not where they come from."),
    check("Complete the sentence: ‘Ich fahre ___ Deutschland.’", "Ich fahre nach Deutschland.", "Most countries without an article use nach for destinations."),
    check("Complete the sentence: ‘Ich fahre ___ Schweiz.’", "Ich fahre in die Schweiz.", "Schweiz takes an article; destination is in die Schweiz, not nach die Schweiz."),
    check("Change the subject to sie: ‘Ich spreche Französisch.’", "Sie spricht Französisch.", "The verb changes from ich spreche to sie spricht for one woman."),
    check("Correct the sentence: ‘Er sprechen Deutsch.’", "Er spricht Deutsch.", "The irregular sprechen form with er is spricht."),
    check("Was ist richtig: „Ich komme aus Deutschland“ oder „Ich fahre aus Deutschland“, wenn du dein Herkunftsland nennst?", "Ich komme aus Deutschland.", "Distinguish origin from destination: kommen aus versus fahren nach."),
    check("Was bedeutet „Gestern war ich in Kumasi“?", "Yesterday I was in Kumasi.", "war is the simple past form of sein; this is recognition, not full Präteritum production."),
    check("Exit-Check: Ergänze „Ich komme ___ Ghana; ich fahre ___ Berlin; ich fahre ___ Schweiz“.", "aus Ghana · nach Berlin · in die Schweiz.", "The student must distinguish origin from destination with article-free and article-using place names."),
  ],

  // Day 9 · Nominative vs accusative; actual workbook uses der/die/das and den/die/das.
  "A1-5": [
    check("Was ist der Nominativ im Satz „Der Mann arbeitet“?", "Der Mann.", "The subject doing the action is in the nominative."),
    check("Was ist der Akkusativ im Satz „Ich sehe den Hund“?", "den Hund.", "The direct object after sehen is den Hund."),
    check("Welche Artikel stehen im Nominativ: der, die, das oder den?", "der, die und das.", "The workbook's singular nominative articles are der, die and das."),
    check("Was wird aus „der Hund“ als direktes Objekt?", "den Hund.", "Masculine der changes to den in the accusative."),
    check("Was wird aus „ein Hund“ als direktes Objekt?", "einen Hund.", "Masculine indefinite ein changes to einen in the accusative."),
    check("Bleibt „die Lampe“ im Akkusativ gleich?", "Ja: die Lampe.", "Feminine die is unchanged in these basic direct-object patterns."),
    check("Bleibt „das Buch“ im Akkusativ gleich?", "Ja: das Buch.", "Neuter das is unchanged in the nominative-to-accusative pattern."),
    check("Ergänze: „___ Mann sieht den Hund.“", "Der Mann sieht den Hund.", "The man is the nominative subject."),
    check("Ergänze: „Ich sehe ___ Mann.“", "Ich sehe den Mann.", "The direct object is masculine accusative: den Mann."),
    check("Wer handelt und was wird gekauft: „Der Mann kauft einen Apfel“?", "Der Mann = Nominativ; einen Apfel = Akkusativ.", "First find who does the action, then the direct object."),
    check("Exit-Check: Ergänze „___ Hund schläft. Ich sehe ___ Hund. Ich kaufe ___ Apfel.“", "Der Hund schläft. Ich sehe den Hund. Ich kaufe einen Apfel.", "Check nominative der, definite accusative den and recognition of indefinite accusative einen."),
  ],

  // Day 10 · Possessive forms + apartment/furniture workbook reading/listening.
  "A1-6": [
    check("Was ist richtig: „mein Tisch“ oder „meine Tisch“?", "mein Tisch.", "Tisch is masculine; the nominative possessive is mein."),
    check("Was ist richtig: „meine Lampe“ oder „mein Lampe“?", "meine Lampe.", "Lampe is feminine, so use meine."),
    check("Was ist richtig: „mein Buch“ oder „meine Buch“?", "mein Buch.", "Buch is neuter and uses mein in the nominative."),
    check("Ergänze: „Ich suche ___ Tisch.“ (mein)", "Ich suche meinen Tisch.", "A masculine direct object takes meinen, not mein."),
    check("Welche Farbe hat der Gegenstand: „Das Auto ist rot“?", "rot.", "An adjective after ist stays in its basic form."),
    check("Was ist ein „Wohnzimmer“?", "a living room / das Wohnzimmer.", "This is a room, not a piece of furniture."),
    check("Was bedeutet „Küche“ auf Englisch?", "kitchen.", "Küche is the room where people cook."),
    check("Was bedeutet „Schlafzimmer“ auf Englisch?", "bedroom.", "Schlafzimmer is a room, not a bed."),
    check("Was bedeutet „Balkon“ auf Englisch?", "balcony.", "The apartment reading/listening asks whether there is a balcony."),
    check("Was ist die höfliche Possessivform: „ihr Tisch“ oder „Ihr Tisch“, wenn du eine Person siezt?", "Ihr Tisch.", "Capital Ihr is used for the formal your; lowercase ihr has other meanings."),
    check("Exit-Check: Ergänze „Das ist ___ Lampe (mein); Ich suche ___ Stuhl (mein); ___ Tisch ist groß (mein).“", "Das ist meine Lampe. Ich suche meinen Stuhl. Mein Tisch ist groß.", "Distinguish feminine nominative meine, masculine accusative meinen and masculine nominative mein."),
  ],
});

export const A1_DAYS6_TO10_QUICK_CHECKS = Object.freeze({
  "A1-2.3": [
    check("Welches Familienwort bedeutet mother?", "die Mutter.", "Mutter is a family noun."),
    check("Was heißt „ein bisschen“ auf Englisch?", "a little.", "It is a fixed expression used with language ability."),
  ],
  "A1-3": [
    check("Ist „das Buch“ Einzahl oder Mehrzahl?", "Einzahl.", "Buch is singular, so it takes kostet."),
    check("Welches Wort drückt eine Vorliebe aus: gern oder sehr?", "gern.", "gern modifies a liked activity."),
  ],
  "A1-4": [
    check("Was bedeutet „Ich komme aus Ghana“?", "I come from Ghana.", "kommen aus marks someone's origin."),
    check("Welche Sprache spricht man in Deutschland?", "Deutsch.", "Language names are capitalised in German."),
  ],
  "A1-5": [
    check("Welchen Artikel hat „Tisch“ im Nominativ?", "der Tisch.", "Tisch is masculine."),
    check("Was bedeutet „direktes Objekt“?", "The person or thing receiving the action.", "Use Wen? or Was? after the verb to find the direct object."),
  ],
  "A1-6": [
    check("Wie heißt „living room“ auf Deutsch?", "das Wohnzimmer.", "The noun has a neuter definite article."),
    check("Welches Wort ist ein Möbelstück: „Stuhl“ oder „Küche“?", "der Stuhl.", "Stuhl is furniture; Küche is a room."),
  ],
});

export const A1_DAYS6_TO10_APPLICATION_CHECKS = Object.freeze({
  "A1-2.3": [
    check("Korrigiere: „Ich spreche bisschen Deutsch.“", "Ich spreche ein bisschen Deutsch.", "Do not omit ein in ein bisschen."),
    check("Ordne die Wörter: „du / Deutsch / sprichst“.", "Sprichst du Deutsch?", "Conjugated verb first in yes/no questions."),
  ],
  "A1-3": [
    check("Korrigiere: „Die Äpfel kostet fünf Euro.“", "Die Äpfel kosten fünf Euro.", "A plural subject takes kosten."),
    check("Ergänze: „Der Stuhl ist neu. ___ kostet 50 Euro.“", "Er kostet 50 Euro.", "Replace masculine der Stuhl with er."),
  ],
  "A1-4": [
    check("Korrigiere: „Ich fahre nach die Schweiz.“", "Ich fahre in die Schweiz.", "Article-using Schweiz takes in die for this destination."),
    check("Ordne die Wörter: „komme / Ghana / ich / aus“.", "Ich komme aus Ghana.", "Use kommen aus for origin."),
  ],
  "A1-5": [
    check("Korrigiere: „Ich sehe der Hund.“", "Ich sehe den Hund.", "Masculine direct object changes der → den."),
    check("Ergänze: „___ Frau kauft ___ Lampe.“ (die)", "Die Frau kauft die Lampe.", "Feminine definite die stays die in both cases."),
  ],
  "A1-6": [
    check("Korrigiere: „Das ist meine Tisch.“", "Das ist mein Tisch.", "Masculine nominative uses mein."),
    check("Ergänze: „Ich sehe ___ Lampe.“ (mein)", "Ich sehe meine Lampe.", "Feminine accusative remains meine."),
  ],
});

export const A1_DAYS6_TO10_ASSIGNMENTS = Object.freeze(Object.keys(A1_DAYS6_TO10_UNDERSTANDING));

const resolve = (collection, id) => collection[String(id || "").trim().toUpperCase()] || null;
export const getA1Days6To10UnderstandingChecks = (id) => resolve(A1_DAYS6_TO10_UNDERSTANDING, id);
export const getA1Days6To10QuickChecks = (id) => resolve(A1_DAYS6_TO10_QUICK_CHECKS, id);
export const getA1Days6To10ApplicationChecks = (id) => resolve(A1_DAYS6_TO10_APPLICATION_CHECKS, id);
