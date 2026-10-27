// Days 21–24 complete the A1 class comprehension pathway.
// Day 21 A1-13 and Day 22 A1-14.1 already have eleven independently
// authored checks in a1PresenterUnderstandingChecks.js; preserve those
// established and regression-tested question banks unchanged.
// Days 23/24 add banks; each day gets distinct unscored recall/application.
const q = (questionDe, answerDe, noteEn) => ({ questionDe, answerDe, noteEn });

export const A1_DAYS21_TO24_ADDITIONAL_UNDERSTANDING = Object.freeze({
  // Day 23: seeing takes accusative; helping/thanking take dative.
  "A1-14.2": [
    q("Welcher Fall steht nach „sehen“: Akkusativ oder Dativ?", "Akkusativ.", "sehen takes a direct object in the accusative: Ich sehe den Mann."),
    q("Welcher Fall steht nach „helfen“: Akkusativ oder Dativ?", "Dativ.", "helfen requires a dative object, even though English uses a direct object."),
    q("Welcher Fall steht nach „danken“: Akkusativ oder Dativ?", "Dativ.", "danken belongs to the small set of taught dative verbs."),
    q("Ergänze: „Ich sehe ___ Mann.“ (der)", "Ich sehe den Mann.", "The masculine accusative of der Mann is den Mann."),
    q("Ergänze: „Ich helfe ___ Mann.“ (der)", "Ich helfe dem Mann.", "The masculine dative of der Mann is dem Mann."),
    q("Ergänze: „Wir danken ___ Lehrer.“ (der)", "Wir danken dem Lehrer.", "danken selects dative, so der Lehrer becomes dem Lehrer."),
    q("Ergänze: „Sie hilft ___ Frau.“ (die)", "Sie hilft der Frau.", "Feminine dative die Frau becomes der Frau."),
    q("Ergänze: „Er sieht ___ Frau.“ (die)", "Er sieht die Frau.", "Feminine accusative die stays die; seeing takes accusative."),
    q("Welche Frage passt zu „Ich sehe den Mann“: Wen? oder Wem?", "Wen?", "Use Wen? to identify the direct accusative object of sehen."),
    q("Welche Frage passt zu „Ich helfe dem Mann“: Wen? oder Wem?", "Wem?", "Use Wem? to identify the dative object required by helfen."),
    q("Exit-Check: Ergänze „Ich sehe ___ Mann. Ich helfe ___ Mann. Sie dankt ___ Frau.“", "Ich sehe den Mann. Ich helfe dem Mann. Sie dankt der Frau.", "Distinguish masculine accusative den, masculine dative dem and feminine dative der without assistance."),
  ],

  // Day 24: the coursebook is the established conjunctions-5-10 page,
  // NOT the separately published final-mock-exam route that happens to share
  // the assignment registry key.
  "A1-5.10": [
    q("Was passiert mit dem konjugierten Verb nach weil?", "Es steht am Ende des weil-Nebensatzes.", "After weil, the conjugated verb moves to the end of the subordinate clause."),
    q("Was ist richtig: „weil ich krank bin“ oder „weil ich bin krank“?", "weil ich krank bin.", "After weil, the finite verb bin must be final."),
    q("Was ist richtig: „weil ich arbeiten muss“ oder „weil ich muss arbeiten“?", "weil ich arbeiten muss.", "With a modal, the infinitive arbeiten precedes the final conjugated muss."),
    q("Ordne die Wörter: „weil / ich / krank / bin“.", "weil ich krank bin.", "Put the subject after weil and the conjugated verb bin at the end."),
    q("Ordne die Wörter: „weil / ich / am Montag / arbeiten / muss“.", "weil ich am Montag arbeiten muss.", "The modal verb muss remains at the end after arbeiten."),
    q("Ordne die Wörter: „weil / ich / mehr Informationen / brauche“.", "weil ich mehr Informationen brauche.", "The finite verb brauche comes at the end of the weil clause."),
    q("Welche Anrede passt zur Sprachschule?", "Sehr geehrte Damen und Herren,", "A language school takes a formal opening and Sie/Ihnen in the message."),
    q("Korrigiere: „Ich kann nicht kommen, weil ich bin krank.“", "Ich kann nicht kommen, weil ich krank bin.", "Move the conjugated bin to the end after weil."),
    q("Korrigiere: „Können wir Mittwoch treffen?“", "Können wir uns am Mittwoch treffen?", "The reflexive phrase is uns treffen, with am before Mittwoch."),
    q("Welcher Konnektor zeigt einen Gegensatz: und, aber, oder oder denn?", "aber.", "aber indicates contrast; recognise it without requiring it in the final message."),
    q("Exit-Check: Korrigiere „Ich kann nicht kommen, weil ich bin krank“ und frage höflich nach einem Treffen am Mittwoch.", "Ich kann nicht kommen, weil ich krank bin. Können wir uns am Mittwoch treffen?", "Check both core learner-page repairs: weil verb-final and uns + am with the meeting question."),
  ],
});

// These two already-reviewed checks feed the opening ungraded practice stage.
// They must never disclose the independently sampled class-check answer.
export const A1_DAYS21_TO24_QUICK_CHECKS = Object.freeze({
  "A1-13": [
    q("Welches Wort ist ein Wetterverb: regnet oder windig?", "regnet.", "regnet is a conjugated weather verb; windig is an adjective."),
    q("Was bedeutet „Grad“ bei einer Wetterangabe?", "degrees (temperature).", "Use Grad to read a given temperature, as in Es sind 30 Grad."),
  ],
  "A1-14.1": [
    q("Ist „Fieber“ eine Krankheitssymptom-Angabe oder eine Uhrzeit?", "Ein Krankheitssymptom.", "Fieber is a symptom noun used with haben."),
    q("Welches Körperteil bedeutet „head“?", "der Kopf.", "Kopf is masculine; say der Kopf when teaching the noun."),
  ],
  "A1-14.2": [
    q("Was bedeutet „helfen“ auf Englisch?", "to help.", "The verb helfen requires dative in German."),
    q("Was bedeutet „sehen“ auf Englisch?", "to see.", "The verb sehen takes an accusative direct object."),
  ],
  "A1-5.10": [
    q("Was bedeutet „weil“?", "because.", "Weil introduces a reason and changes the verb order of its subordinate clause."),
    q("Ist „Sehr geehrte Damen und Herren“ formell oder informell?", "formell.", "Use this greeting when addressing an institution such as a language school."),
  ],
});

export const A1_DAYS21_TO24_APPLICATION_CHECKS = Object.freeze({
  "A1-13": [
    q("Korrigiere: „Es ist regnet heute.“", "Es regnet heute.", "regnet is already a verb; do not add ist."),
    q("Ergänze: „Wir treffen uns ___ Sonntag ___ 16 Uhr.“", "Wir treffen uns am Sonntag um 16 Uhr.", "am marks the weekday; um marks the exact clock time."),
  ],
  "A1-14.1": [
    q("Korrigiere: „Ich habe krank.“", "Ich bin krank.", "krank is an adjective; use bin rather than habe."),
    q("Korrigiere: „Meine Hände tut weh.“", "Meine Hände tun weh.", "Plural Hände takes tun, not singular tut."),
  ],
  "A1-14.2": [
    q("Korrigiere: „Ich helfe den Mann.“", "Ich helfe dem Mann.", "helfen selects dative dem Mann, not accusative den Mann."),
    q("Korrigiere: „Ich sehe dem Mann.“", "Ich sehe den Mann.", "sehen selects accusative den Mann, not dative dem Mann."),
  ],
  "A1-5.10": [
    q("Korrigiere: „Ich bleibe zu Hause, weil ich muss lernen.“", "Ich bleibe zu Hause, weil ich lernen muss.", "The conjugated modal muss is final in the subordinate clause."),
    q("Ordne: „ich / schreibe / Ihnen / weil / ich / Informationen / brauche“.", "Ich schreibe Ihnen, weil ich Informationen brauche.", "Formal Ihnen and final brauche are both required for this message."),
  ],
});

export const A1_DAYS21_TO24_ASSIGNMENTS = Object.freeze(["A1-13", "A1-14.1", "A1-14.2", "A1-5.10"]);
const get = (source, id) => source[String(id || "").trim().toUpperCase()] || null;
export const getA1Days21To24AdditionalUnderstandingChecks = (id) => get(A1_DAYS21_TO24_ADDITIONAL_UNDERSTANDING,id);
export const getA1Days21To24QuickChecks = (id) => get(A1_DAYS21_TO24_QUICK_CHECKS,id);
export const getA1Days21To24ApplicationChecks = (id) => get(A1_DAYS21_TO24_APPLICATION_CHECKS,id);
