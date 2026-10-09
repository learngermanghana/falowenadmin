// Final A1 Days 21–24 content. Day 21/22 already have individually verified
// 11-question grammar/letter check banks in a1PresenterUnderstandingChecks.
// Retain those existing contracts; add separate quick and applied checks.
// Day 23/24 gain full 10 independent questions + an unaided exit check.
const q = (questionDe, answerDe, noteEn) => ({ questionDe, answerDe, noteEn });

export const A1_DAYS21_TO24_UNDERSTANDING = Object.freeze({
  "A1-14.2": [
    q("Welchen Fall verlangt „sehen“: Dativ oder Akkusativ?", "Akkusativ.", "sehen takes an accusative object: Ich sehe den Mann."),
    q("Welchen Fall verlangt „helfen“: Dativ oder Akkusativ?", "Dativ.", "helfen takes dative: Ich helfe dem Mann."),
    q("Welchen Fall verlangt „danken“?", "Dativ.", "danken takes a dative object: Wir danken dem Lehrer."),
    q("Ergänze: „Ich sehe ___ Mann.“ (der)", "Ich sehe den Mann.", "Masculine direct object der becomes den in accusative."),
    q("Ergänze: „Ich helfe ___ Mann.“ (der)", "Ich helfe dem Mann.", "Dative masculine der becomes dem after helfen."),
    q("Ergänze: „Sie hilft ___ Frau.“ (die)", "Sie hilft der Frau.", "Feminine dative uses der with helfen."),
    q("Ergänze: „Wir danken ___ Lehrer.“ (der)", "Wir danken dem Lehrer.", "danken controls dative, so the masculine noun takes dem."),
    q("Welche Frage passt zu „Ich sehe den Mann“: wen oder wem?", "Wen?", "Wen? asks about the accusative person being seen."),
    q("Welche Frage passt zu „Ich helfe dem Mann“: wen oder wem?", "Wem?", "Wem? asks for the dative person being helped."),
    q("Korrigiere: „Er hilft die Kinder.“", "Er hilft den Kindern.", "helfen takes dative; plural dative uses den Kindern, including the noun ending -n."),
    q("Exit-Check: Ergänze „Ich sehe ___ Mann, ich helfe ___ Mann und ich danke ___ Frau“.", "Ich sehe den Mann. Ich helfe dem Mann. Ich danke der Frau.", "Check accusative with sehen and dative with helfen/danken without revealing the answer first."),
  ],
  "A1-5.10": [
    q("Was passiert mit dem konjugierten Verb nach „weil“?", "Es steht am Ende des weil-Nebensatzes.", "weil introduces a subordinate clause with its finite verb at the end."),
    q("Was ist richtig: „weil ich krank bin“ oder „weil ich bin krank“?", "weil ich krank bin.", "After weil, bin goes to the end; do not keep main-clause word order."),
    q("Was ist richtig: „weil ich arbeiten muss“ oder „weil ich muss arbeiten“?", "weil ich arbeiten muss.", "With a modal, the conjugated muss comes after the infinitive arbeiten."),
    q("Ordne die Wörter: „weil · ich · krank · bin“.", "weil ich krank bin.", "Place the subject after weil and bin at the end."),
    q("Ordne die Wörter: „weil · ich · am Montag · arbeiten · muss“.", "weil ich am Montag arbeiten muss.", "With modal müssen, the conjugated modal is final in the weil-clause."),
    q("Korrigiere: „Ich kann nicht kommen, weil ich bin krank.“", "Ich kann nicht kommen, weil ich krank bin.", "Move bin to the end; keep the comma before weil."),
    q("Korrigiere: „Können wir Mittwoch treffen?“", "Können wir uns am Mittwoch treffen?", "sich treffen requires uns here; weekdays take am."),
    q("Welche Anrede passt zu einer Freundin?", "Liebe Anna,", "Informal message register uses Liebe plus the first name."),
    q("Welche Form passt zu einer Sprachschule: „Kannst du mir helfen?“ oder „Können Sie mir helfen?“", "Können Sie mir helfen?", "Use the formal Sie form with a language school."),
    q("Welches Wort zeigt einen Gegensatz: und, aber, oder oder denn?", "aber.", "aber shows contrast; these additional connectors are recognition-only."),
    q("Exit-Check: Korrigiere „Ich kann am Dienstag nicht kommen, weil ich muss arbeiten“ und formuliere eine höfliche Frage nach einem neuen Termin.", "Ich kann am Dienstag nicht kommen, weil ich arbeiten muss. Können wir uns am Mittwoch treffen?", "The final task applies verb-final weil and an appropriate appointment question. Do not require deshalb."),
  ],
});

export const A1_DAYS21_TO24_QUICK_CHECKS = Object.freeze({
  "A1-13": [
    q("Was bedeutet „Es regnet“?", "It is raining.", "Weather verb regnen stands without an additional ist."),
    q("Was bedeutet „Es ist windig“?", "It is windy.", "Weather adjectives follow es ist."),
  ],
  "A1-14.1": [
    q("Was bedeutet „Ich habe Fieber“?", "I have a fever.", "Fieber takes haben, not sein."),
    q("Was bedeutet „Mein Kopf tut weh“?", "My head hurts.", "A singular body part takes tut weh."),
  ],
  "A1-14.2": [
    q("Ist „Mann“ männlich oder weiblich?", "männlich.", "der Mann is masculine."),
    q("Welcher Fall wird mit „Wem?“ gefragt?", "Dativ.", "Wem? identifies a dative person."),
  ],
  "A1-5.10": [
    q("Welcher Konnektor leitet einen Grund ein: weil oder aber?", "weil.", "weil introduces a reason and changes verb placement."),
    q("Ist „Liebe Anna“ formell oder informell?", "informell.", "Use it for a friend, not a school office."),
  ],
});

export const A1_DAYS21_TO24_APPLICATION_CHECKS = Object.freeze({
  "A1-13": [
    q("Korrigiere: „Es ist regnet sehr stark.“", "Es regnet sehr stark.", "regnet is the weather verb and does not take ist."),
    q("Ordne: „können / wir / uns / am Montag / treffen“.", "Können wir uns am Montag treffen?", "Yes/no question begins with können and uses uns plus am + weekday."),
  ],
  "A1-14.1": [
    q("Korrigiere: „Ich habe krank.“", "Ich bin krank.", "krank is an adjective, so use sein."),
    q("Korrigiere: „Meine Beine tut weh.“", "Meine Beine tun weh.", "Plural Beine requires tun."),
  ],
  "A1-14.2": [
    q("Korrigiere: „Ich helfe den Mann.“", "Ich helfe dem Mann.", "helfen takes dative masculine dem."),
    q("Korrigiere: „Ich sehe dem Mann.“", "Ich sehe den Mann.", "sehen takes masculine accusative den."),
  ],
  "A1-5.10": [
    q("Korrigiere: „Ich bleibe zu Hause, weil ich bin krank.“", "Ich bleibe zu Hause, weil ich krank bin.", "The conjugated bin belongs at the end of the weil-clause."),
    q("Ordne: „weil / ich / mehr Informationen / brauche“.", "weil ich mehr Informationen brauche.", "Place the finite verb brauche at the end of the subordinate clause."),
  ],
});

export const A1_DAYS21_TO24_ASSIGNMENTS = Object.freeze(["A1-13", "A1-14.1", "A1-14.2", "A1-5.10"]);
const get = (table,id) => table[String(id||"").trim().toUpperCase()]||null;
export const getA1Days21To24UnderstandingChecks = (id) => get(A1_DAYS21_TO24_UNDERSTANDING,id);
export const getA1Days21To24QuickChecks = (id) => get(A1_DAYS21_TO24_QUICK_CHECKS,id);
export const getA1Days21To24ApplicationChecks = (id) => get(A1_DAYS21_TO24_APPLICATION_CHECKS,id);
