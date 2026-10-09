// A1 Days 16–20: six regular workbook lesson blocks over four teaching days.
// Day 19 / A1-5.9 is intentionally NOT overridden: it has a dedicated Goethe
// exam-readiness Presenter. Each regular block has 10 independent class checks,
// one unaided exit check, two quick recalls and two short corrections.
// Every answer has specific, teacher-verified guidance, not a generic rubric.
const q = (questionDe, answerDe, noteEn) => ({ questionDe, answerDe, noteEn });

export const A1_DAYS16_TO20_UNDERSTANDING = Object.freeze({
  "A1-9": [
    q("Ergänze: „Ich habe ___ Milch.“ (keine/nicht)", "Ich habe keine Milch.", "Milch is a feminine noun: negate the noun phrase with keine, not nicht."),
    q("Ergänze: „Ich esse ___ Käse.“ (keinen/nicht)", "Ich esse keinen Käse.", "Käse is masculine; as the direct object, kein becomes keinen."),
    q("Ergänze: „Die Suppe ist ___ warm.“ (kein/nicht)", "Die Suppe ist nicht warm.", "Negate the adjective warm with nicht rather than kein."),
    q("Ergänze: „Ich koche heute ___.“ (kein/nicht)", "Ich koche heute nicht.", "nicht negates the action koche in this short statement."),
    q("Ergänze: „Ich trinke ___ Kaffee.“ (keinen/nicht)", "Ich trinke keinen Kaffee.", "Kaffee is masculine accusative after trinken: keinen Kaffee."),
    q("Was ist richtig: „Wir haben keine Milch“ oder „Wir haben nicht Milch“?", "Wir haben keine Milch.", "An article-less noun such as Milch takes a kein-form when saying none."),
    q("Was ist richtig: „Das Essen ist nicht kalt“ oder „Das Essen ist kein kalt“?", "Das Essen ist nicht kalt.", "kalt is an adjective, so it is negated by nicht."),
    q("Korrigiere: „Ich habe kein Banane.“", "Ich habe keine Banane.", "Banane is feminine, and its negating article is keine."),
    q("Korrigiere: „Ich esse nicht Käse“, wenn du keinen Käse isst.", "Ich esse keinen Käse.", "With a negated masculine direct-object noun, use keinen."),
    q("Was verneinst du mit „kein“: ein Nomen oder ein Adjektiv?", "Ein Nomen.", "kein works like an article with a noun; use nicht to negate an adjective or action."),
    q("Exit-Check: Ergänze „Ich habe ___ Milch; ich esse ___ Käse; die Suppe ist ___ warm“.", "Ich habe keine Milch. Ich esse keinen Käse. Die Suppe ist nicht warm.", "Test feminine keine, masculine accusative keinen and adjective negation nicht without help."),
  ],
  "A1-10": [
    q("Ergänze: „Morgens ___ ich Brot.“ (essen)", "Morgens esse ich Brot.", "When Morgens begins a statement, the conjugated verb is still in second position."),
    q("Was ist richtig: „Morgens ich esse Reis“ oder „Morgens esse ich Reis“?", "Morgens esse ich Reis.", "After a starting time word, use conjugated verb before the subject ich."),
    q("Ergänze: „Um sieben Uhr ___ ich auf.“ (aufstehen)", "Um sieben Uhr stehe ich auf.", "Separable aufstehen: stehe is second, prefix auf goes at the end."),
    q("Ergänze: „Mittags ___ ich Reis.“ (essen)", "Mittags esse ich Reis.", "The verb agrees with ich and follows the fronted time expression."),
    q("Ergänze: „Am Abend ___ ich gern.“ (kochen)", "Am Abend koche ich gern.", "The conjugated verb koche is in position two; gern signals liking the activity."),
    q("Wofür steht „gern“ in „Ich lese gern“?", "Die Person liest mit Freude / likes reading.", "gern modifies an action; it is not an adjective describing a person."),
    q("Was ist richtig: „Ich steht um 7 Uhr auf“ oder „Ich stehe um 7 Uhr auf“?", "Ich stehe um 7 Uhr auf.", "ich takes stehe, and the separable prefix appears at the end."),
    q("Was kommt zuerst im Tagesablauf: morgens oder abends?", "morgens.", "morgens means in the morning, while abends is in the evening."),
    q("Ordne die Wörter: „koche / ich / abends / gern“.", "Abends koche ich gern.", "Putting Abends first still keeps the conjugated verb in position two."),
    q("Ergänze: „Nach der Arbeit ___ ich nach Hause.“ (gehen)", "Nach der Arbeit gehe ich nach Hause.", "The initial time phrase occupies position one; gehe follows before ich."),
    q("Exit-Check: Korrigiere „Morgens ich esse Brot; Um sieben Uhr ich stehe auf; Am Abend ich koche gern“.", "Morgens esse ich Brot. Um sieben Uhr stehe ich auf. Am Abend koche ich gern.", "Check the verb-second rule and the separable verb prefix in three real daily-routine sentences."),
  ],
  "A1-11": [
    q("Wie sagst du „go straight on“ als höfliche Anweisung?", "Gehen Sie geradeaus.", "For the polite Sie-imperative, put the verb first, then Sie."),
    q("Wie sagst du „turn left“ als höfliche Anweisung?", "Biegen Sie links ab.", "The separable prefix ab moves to the end of the command."),
    q("Wie sagst du „turn right“ als höfliche Anweisung?", "Biegen Sie rechts ab.", "Use rechts for right; do not omit the separable prefix ab."),
    q("Wie sagst du „cross the street“ als höfliche Anweisung?", "Überqueren Sie die Straße.", "The Sie-imperative has verb + Sie; Straße is the direct object."),
    q("Was bedeutet „geradeaus“?", "Straight ahead / direkt weiter in dieselbe Richtung.", "geradeaus means continuing without turning left or right."),
    q("Welche Seite ist links: die linke oder die rechte?", "die linke Seite.", "links is left; rechts is right."),
    q("Ergänze: „Entschuldigung, wie komme ich ___ Bahnhof?“", "Entschuldigung, wie komme ich zum Bahnhof?", "zum = zu dem; Bahnhof is masculine."),
    q("Ergänze: „Wie komme ich ___ Apotheke?“", "Wie komme ich zur Apotheke?", "zur = zu der; Apotheke is feminine."),
    q("Was bedeutet „Kreuzung“?", "Intersection / die Kreuzung.", "A Kreuzung is where roads intersect, useful for route instructions."),
    q("Korrigiere die höfliche Anweisung: „Sie gehen bitte geradeaus.“", "Gehen Sie bitte geradeaus.", "This asks for the command form: move Gehen before Sie."),
    q("Exit-Check: Ergänze „___ Sie geradeaus. ___ Sie links ___. ___ Sie die Straße.“", "Gehen Sie geradeaus. Biegen Sie links ab. Überqueren Sie die Straße.", "The three core Sie-imperatives must be correctly formed, including separable ab."),
  ],
  "A1-12.1": [
    q("Welche Frage passt zu „Das Buch liegt auf dem Tisch“: Wo oder Wohin?", "Wo?", "liegen here describes a stationary location, so the two-way preposition uses dative."),
    q("Welche Frage passt zu „Ich lege das Buch auf den Tisch“: Wo oder Wohin?", "Wohin?", "legen expresses placing a book onto a destination, taking accusative after auf."),
    q("Ergänze den Ort: „Das Buch liegt auf ___ Tisch.“", "Das Buch liegt auf dem Tisch.", "For the static location Wo?, masculine der Tisch becomes dem Tisch."),
    q("Ergänze die Bewegung: „Ich lege das Buch auf ___ Tisch.“", "Ich lege das Buch auf den Tisch.", "For destination Wohin?, masculine der Tisch becomes den Tisch."),
    q("Ergänze: „Wir sind in ___ Küche.“", "Wir sind in der Küche.", "Stationary in + feminine dative: die Küche → der Küche."),
    q("Ergänze: „Wir gehen in ___ Küche.“", "Wir gehen in die Küche.", "Entering a destination takes feminine accusative in die Küche."),
    q("Was ist der Unterschied zwischen „auf dem Tisch“ und „auf den Tisch“?", "auf dem Tisch = Ort; auf den Tisch = Ziel einer Bewegung.", "The article signals static dative versus destination accusative after auf."),
    q("Was ist richtig: „Das Bild hängt an der Wand“ oder „Das Bild hängt an die Wand“?", "Das Bild hängt an der Wand.", "A picture already hanging is at a location: feminine dative an der Wand."),
    q("Welche Präposition steht in „Ich lege das Buch auf den Tisch“?", "auf.", "auf is one of the two-way prepositions in the taught location/destination examples."),
    q("Wann verwendet man den Dativ nach einer Wechselpräposition?", "Bei einer Ortsangabe mit Wo?, zum Beispiel auf dem Tisch.", "Teach the Wo? location question instead of memorising every preposition table."),
    q("Exit-Check: Ergänze „Das Buch liegt auf ___ Tisch; ich lege es auf ___ Tisch; wir sind in ___ Küche“.", "auf dem Tisch · auf den Tisch · in der Küche.", "Students must recognise location versus destination and choose dem/den/der."),
  ],
  "A1-12.2": [
    q("Ergänze den Beruf: „Ich arbeite ___ Lehrer.“", "Ich arbeite als Lehrer.", "als introduces a professional role, not the place of employment."),
    q("Ergänze: „Sie arbeitet ___ einer Bank.“", "Sie arbeitet bei einer Bank.", "bei names the employer or organisation and takes dative."),
    q("Ergänze: „Er arbeitet ___ einem Krankenhaus.“", "Er arbeitet in einem Krankenhaus.", "The workplace location is expressed by in + dative."),
    q("Ergänze: „Ich fahre morgens ___ Arbeit.“", "Ich fahre morgens zur Arbeit.", "zur = zu der; this fixed expression describes going to work."),
    q("Was bedeutet „als“ in „Ich arbeite als Ärztin“?", "in der Rolle als Ärztin / as a doctor.", "als answers the profession, not which employer."),
    q("Was bedeutet „bei“ in „Sie arbeitet bei einer Bank“?", "Bei einem Arbeitgeber / at or for a bank.", "bei links someone with an employer and normally takes dative."),
    q("Korrigiere: „Ich arbeite als einer Bank.“", "Ich arbeite bei einer Bank.", "Use bei for the employer; als is for the job role."),
    q("Korrigiere: „Sie fährt zu die Arbeit.“", "Sie fährt zur Arbeit.", "The contraction zu + der is zur."),
    q("Welche Präposition passt zum Arbeitsplatz: „in einem Krankenhaus“ oder „als einem Krankenhaus“?", "in einem Krankenhaus.", "Use in for the physical workplace, not als."),
    q("Welche der vier Formen nennt einen Beruf: als, bei, in oder zur Arbeit?", "als.", "als introduces the role; bei employer, in place, zur Arbeit direction."),
    q("Exit-Check: Ergänze „Ich arbeite ___ Lehrer; sie arbeitet ___ einer Bank; er arbeitet ___ einem Krankenhaus; wir fahren ___ Arbeit“.", "als Lehrer · bei einer Bank · in einem Krankenhaus · zur Arbeit.", "Contrast job role, employer, workplace and destination without interview role-play."),
  ],
  "A1-12.3": [
    q("Wie viele Inhaltspunkte muss eine A1-Nachricht in dieser Aufgabe beantworten?", "Genau drei Inhaltspunkte.", "The task has exactly three required content bullets; greeting and closing are separate."),
    q("Was gehört zur Briefform, nicht zu den drei Inhaltspunkten?", "Anrede, Grußformel und Name.", "Opening, ending and name are mandatory form, not counted as task bullets."),
    q("Welche Anrede passt zu einer Freundin: „Liebe Anna“ oder „Sehr geehrte Damen und Herren“?", "Liebe Anna,", "Use informal register for a familiar friend."),
    q("Welche Anrede passt zu einer Sprachschule?", "Sehr geehrte Damen und Herren,", "A formal recipient takes this standard greeting when no name is given."),
    q("Welche Grußformel passt zu einer formellen E-Mail?", "Mit freundlichen Grüßen", "Use a formal closing consistent with Sie/Ihnen."),
    q("Was gehört zum Geburtstagsbrief als erster Inhaltspunkt?", "Gratuliere zum Geburtstag: Alles Gute zum Geburtstag!", "Greeting the friend is form; the birthday wish is a content point."),
    q("Welche Frage fragt nach einer Geburtstagsparty?", "Gibt es eine Party?", "This fulfils the birthday task's party question."),
    q("Wie fragst du, ob deine Familie mitkommen darf?", "Kann meine Familie mitkommen?", "This covers the birthday task's third content point."),
    q("Ordne die Wörter: „wann / beginnt / der Kurs“.", "Wann beginnt der Kurs?", "A W-question about starting time uses verb-second order."),
    q("Wie fragst du nach der Möglichkeit, online zu bezahlen?", "Kann ich online bezahlen?", "Yes/no question starts with the conjugated modal verb."),
    q("Exit-Check: Nenne die drei Fragen/Inhaltspunkte zur Sprachschule und die erforderliche Briefform.", "Wann beginnt der Kurs? Wie viel kostet der Kurs? Kann ich online bezahlen? Dazu Anrede, Grußformel und Name.", "This matches the three published formal task bullets and separates them from letter structure."),
  ],
});

export const A1_DAYS16_TO20_QUICK_CHECKS = Object.freeze({
  "A1-9": [
    q("Ist „Milch“ ein Nomen oder ein Adjektiv?", "Ein Nomen.", "Recognise the noun before selecting a kein-form."),
    q("Ist „warm“ ein Nomen oder ein Adjektiv?", "Ein Adjektiv.", "The adjective warm is normally negated with nicht."),
  ],
  "A1-10": [
    q("Was heißt „morgens“ auf Englisch?", "in the morning.", "This word is a time expression."),
    q("Welches Verb ist „esse“: Infinitiv oder konjugierte Form?", "konjugierte Form von essen.", "Ich esse is the present-tense form, not the infinitive."),
  ],
  "A1-11": [
    q("Was bedeutet „links“ auf Englisch?", "left.", "Keep left and right direction words distinct."),
    q("Welches Wort bedeutet „station“: Bahnhof oder Bäckerei?", "Bahnhof.", "Bahnhof is the train station, not a bakery."),
  ],
  "A1-12.1": [
    q("Wofür steht die Frage „Wo?“", "Ort.", "Wo asks where an object is located."),
    q("Wofür steht die Frage „Wohin?“", "Ziel einer Bewegung.", "Wohin asks where an object is placed or someone is going."),
  ],
  "A1-12.2": [
    q("Was ist ein Beruf: Lehrer oder Krankenhaus?", "Lehrer.", "Lehrer is a job; Krankenhaus is a place."),
    q("Was ist ein Arbeitgeber: die Bank oder Ärztin?", "die Bank.", "A bank can employ a person; Ärztin is a professional role."),
  ],
  "A1-12.3": [
    q("Ist „Liebe Anna“ formell oder informell?", "informell.", "This greeting is suitable for a friend."),
    q("Sind „Mit freundlichen Grüßen“ und ein Name Inhaltspunkte?", "Nein, sie gehören zur Briefform.", "Keep message form separate from the three content bullets."),
  ],
});

export const A1_DAYS16_TO20_APPLICATION_CHECKS = Object.freeze({
  "A1-9": [
    q("Korrigiere: „Die Suppe ist kein warm.“", "Die Suppe ist nicht warm.", "Use nicht for an adjective, not kein."),
    q("Korrigiere: „Wir haben nicht Milch.“", "Wir haben keine Milch.", "Negate the feminine noun Milch with keine."),
  ],
  "A1-10": [
    q("Korrigiere: „Abends ich koche gern.“", "Abends koche ich gern.", "The conjugated verb must stay in position two."),
    q("Ordne: „stehe / ich / auf / um sieben Uhr“.", "Um sieben Uhr stehe ich auf.", "Separable auf follows the main clause at the end."),
  ],
  "A1-11": [
    q("Korrigiere: „Biegen Sie rechts.“", "Biegen Sie rechts ab.", "The separable verb abbiegen needs its prefix ab."),
    q("Korrigiere: „Gehen bitte Sie geradeaus.“", "Gehen Sie bitte geradeaus.", "The Sie-imperative starts with verb and Sie."),
  ],
  "A1-12.1": [
    q("Korrigiere die Ortsangabe: „Das Buch liegt auf den Tisch.“", "Das Buch liegt auf dem Tisch.", "Static Wo? requires dative dem."),
    q("Korrigiere die Bewegung: „Ich lege das Buch auf dem Tisch.“", "Ich lege das Buch auf den Tisch.", "Destination Wohin? requires accusative den."),
  ],
  "A1-12.2": [
    q("Korrigiere: „Er arbeitet bei Lehrer.“", "Er arbeitet als Lehrer.", "The phrase states a profession, not an employer."),
    q("Korrigiere: „Ich fahre zu der Arbeit“, benutze die Kurzform.", "Ich fahre zur Arbeit.", "Use the contraction zur when the noun has feminine dative article der."),
  ],
  "A1-12.3": [
    q("Ordne die Wörter: „wie / kostet / der Kurs / viel“.", "Wie viel kostet der Kurs?", "This is the published formal task's price question."),
    q("Ordne die Wörter: „eine Party / gibt / es“.", "Gibt es eine Party?", "This is the published informal birthday task's party question."),
  ],
});

export const A1_DAYS16_TO20_ASSIGNMENTS = Object.freeze(Object.keys(A1_DAYS16_TO20_UNDERSTANDING));
const resolve = (table, id) => table[String(id || "").trim().toUpperCase()] || null;
export const getA1Days16To20UnderstandingChecks = (id) => resolve(A1_DAYS16_TO20_UNDERSTANDING, id);
export const getA1Days16To20QuickChecks = (id) => resolve(A1_DAYS16_TO20_QUICK_CHECKS, id);
export const getA1Days16To20ApplicationChecks = (id) => resolve(A1_DAYS16_TO20_APPLICATION_CHECKS, id);
