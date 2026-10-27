// Curated A1 Days 11–15: teacher-verifiable understanding checks, short
// application tasks and a dedicated exam-format orientation for Day 15.
// Answers and explanations concern the actual lesson objectives. These do
// not mark student work, create scores or change the Goethe A1-5.9 mock exam.
const check = (questionDe, answerDe, noteEn) => ({ questionDe, answerDe, noteEn });

export const A1_DAYS11_TO15_UNDERSTANDING = Object.freeze({
  "A1-7": [
    check("Wie spät ist es um 6:15?", "Es ist Viertel nach sechs.", "Viertel nach means a quarter past the hour."),
    check("Wie sagt man 7:30 mit halb?", "Es ist halb acht.", "halb names the NEXT hour: 7:30 is halb acht."),
    check("Was bedeutet „ab 10 Uhr“ auf einem Schild?", "Ab 10 Uhr bedeutet: geöffnet ab 10 Uhr / starting at 10:00.", "ab introduces a starting time, not a closing time."),
    check("Die Bibliothek ist von 9 bis 17 Uhr geöffnet. Ist sie um 18 Uhr offen?", "Nein, um 18 Uhr ist sie geschlossen.", "von … bis marks the opening interval."),
    check("Ergänze: „Der Laden ist ___ 18 Uhr geöffnet.“ (until)", "Der Laden ist bis 18 Uhr geöffnet.", "bis means until; ab means starting from."),
    check("Was ist der Unterschied: „Viertel vor acht“ und „vor 8 Uhr“?", "Viertel vor acht ist 7:45. Vor 8 Uhr ist jede Zeit vor 8:00.", "The quarter expression is exact; the before expression is a wider interval."),
    check("Es ist 10:00 Uhr. Sage eine passende Tageszeit.", "Es ist vormittags. / Es ist am Vormittag.", "Late morning is vormittags; boundaries are approximate."),
    check("Es ist 12:30 Uhr. Ist es vormittags, mittags oder nachts?", "Es ist mittags.", "Around 12:30 is midday."),
    check("Es ist 16:00 Uhr. Ergänze: „Ich kaufe ___ ein.“", "Ich kaufe nachmittags ein.", "nachmittags describes an afternoon activity, with the prefix ein at the end."),
    check("Korrigiere: „Ich aufstehe um 6 Uhr.“", "Ich stehe um 6 Uhr auf.", "In the main clause, conjugate stehen and move auf to the end."),
    check("Was ist der Unterschied zwischen „ab 10 Uhr“ und „abholen“?", "ab 10 Uhr = starting at ten; abholen is a separable verb, e.g. Ich hole Anna ab.", "The time word ab and the verb prefix ab- do not have the same function."),
    check("Exit-Check: Ergänze „Der Kurs ist ___ 8 ___ 10 Uhr. ___ gehe ich einkaufen.“", "Der Kurs ist von 8 bis 10 Uhr. Danach gehe ich einkaufen. / Nach dem Kurs gehe ich einkaufen.", "Require von … bis and a correct later-time expression without prompting."),
  ],
  "A1-8": [
    check("Was ist 6 Uhr abends im 24-Stunden-System?", "18:00 Uhr.", "6 PM is 18:00."),
    check("Wie sagt man 6 Uhr morgens?", "Sechs Uhr morgens.", "AM means before noon."),
    check("Wie sagt man 13:43 Uhr?", "Dreizehn Uhr dreiundvierzig.", "Say hour, Uhr, then the full minute number."),
    check("Wie sagt man 02:21 Uhr?", "Zwei Uhr einundzwanzig.", "Read minutes as a whole number."),
    check("Wie sagt man 14:21 Uhr?", "Vierzehn Uhr einundzwanzig.", "14 is the 24-hour clock hour."),
    check("Wie sagt man 07:05 Uhr?", "Sieben Uhr fünf.", "A leading zero in the minutes is not spoken."),
    check("Welcher Monat kommt nach März?", "April.", "March is März; April follows."),
    check("Welcher Monat ist der zwölfte Monat?", "Dezember.", "December is the twelfth month."),
    check("Wie sagt man 3. Mai?", "Der dritte Mai.", "The third is dritte."),
    check("Wie sagt man 23. Oktober?", "Der dreiundzwanzigste Oktober.", "Day numbers 20–31 normally take -ste."),
    check("Exit-Check: Sage 19:47 Uhr und den 21. September.", "Neunzehn Uhr siebenundvierzig · der einundzwanzigste September.", "Read an exact minute and an ordinal date without the year."),
  ],
  "A1-3.5": [
    check("Wie schreibt man die Zahl 32 auf Deutsch?", "zweiunddreißig.", "For two-digit numbers above 20, the ones come before und + tens."),
    check("Wie schreibt man 24 auf Deutsch?", "vierundzwanzig.", "Do not copy English tens-first order: vier comes before zwanzig."),
    check("Wie schreibt man 67 auf Deutsch?", "siebenundsechzig.", "Units first, then und and the tens."),
    check("Welche Uhrzeit ist „halb neun“?", "8:30 Uhr.", "halb nine is thirty minutes before nine o'clock."),
    check("Wie sagst du 7:10 mit nach?", "zehn nach sieben.", "nach refers to minutes after the named hour."),
    check("Wie sagst du 7:55 mit vor?", "fünf vor acht.", "Five minutes remain until eight o'clock."),
    check("Ergänze: „Das Buch ___ zwölf Euro fünfzig.“", "Das Buch kostet zwölf Euro fünfzig.", "A singular thing takes kostet."),
    check("Ergänze: „Die Bücher ___ vierundzwanzig Euro.“", "Die Bücher kosten vierundzwanzig Euro.", "Plural Bücher needs kosten."),
    check("Welcher Preis ist „zwölf Euro fünfzig“ in Ziffern?", "12,50 €.", "Euro and cent amounts are conventionally separated by a decimal comma."),
    check("Welcher Preis ist „vierundzwanzig Euro“ in Ziffern?", "24,00 €.", "The spoken amount is twenty-four euros, not four-and-twenty cents."),
    check("Exit-Check: Schreibe „32“, „halb neun“ und „Die Bücher ___ 24 Euro“ korrekt.", "zweiunddreißig · 8:30 Uhr · Die Bücher kosten 24 Euro.", "Review number order, the next-hour halb rule and plural kosten together."),
  ],
  "A1-3.6": [
    check("Welches Modalverb zeigt eine Fähigkeit: können, müssen oder möchten?", "können.", "können says what somebody is able to do."),
    check("Welches Modalverb zeigt eine Notwendigkeit?", "müssen.", "müssen expresses obligation or necessity, not a polite wish."),
    check("Welches Modalverb zeigt einen höflichen Wunsch?", "möchten.", "möchten expresses what somebody would like."),
    check("Ergänze: „Ich ___ Deutsch sprechen.“ (können)", "Ich kann Deutsch sprechen.", "ich takes kann; the second verb sprechen stays at the end."),
    check("Ergänze: „Wir ___ heute lernen.“ (müssen)", "Wir müssen heute lernen.", "wir takes müssen; lernen remains an infinitive at the end."),
    check("Ergänze: „Ich ___ einen Tee trinken.“ (möchten)", "Ich möchte einen Tee trinken.", "ich takes möchte and the second verb trinken is final."),
    check("Was ist richtig: „Ich kann Deutsch sprechen“ oder „Ich kann sprechen Deutsch“?", "Ich kann Deutsch sprechen.", "The infinitive goes at the end of a simple clause with a modal verb."),
    check("Wo steht das konjugierte Modalverb im Hauptsatz „Ich muss heute lernen“?", "Position 2.", "Ich is position one; muss is the conjugated verb in second position."),
    check("Korrigiere: „Ich kann spreche Deutsch.“", "Ich kann Deutsch sprechen.", "Do not conjugate the second verb; use infinitive sprechen last."),
    check("Korrigiere: „Er müssen morgen arbeiten.“", "Er muss morgen arbeiten.", "With er, müssen becomes muss, while arbeiten remains the final infinitive."),
    check("Exit-Check: Ergänze „Ich ___ Deutsch sprechen; wir ___ lernen; ich ___ Tee trinken“ mit können, müssen und möchten.", "Ich kann Deutsch sprechen. Wir müssen lernen. Ich möchte Tee trinken.", "One sentence for ability, necessity and a polite wish, with the infinitive at the end."),
  ],
  // Day 15 is an intentional Goethe A1 speaking-format introduction, not a
  // generic role-play lesson or the later A1-5.9 speaking-readiness mock exam.
  "A1-4.7": [
    check("Was macht man in Teil 1 der Goethe-A1-Sprechprüfung?", "Sich kurz vorstellen: Name, Alter, Land, Wohnort, Sprachen, Beruf und Hobby.", "Teil 1 uses brief personal information; students need not deliver an A2-level talk."),
    check("Was macht man in Teil 2 der Goethe-A1-Sprechprüfung?", "Eine einfache Frage zum Thema stellen und die Frage des Partners beantworten.", "Teil 2 is question plus relevant answer, not a memorized speech."),
    check("Was macht man in Teil 3 der Goethe-A1-Sprechprüfung?", "Eine höfliche Bitte formulieren und passend darauf reagieren.", "Teil 3 assesses both the request and the reaction."),
    check("In Teil 3, how can you make a polite request for a pen?", "Kannst du mir bitte den Stift geben? / Können Sie mir bitte einen Stift geben?", "Use bitte; an appropriate du or Sie form can both work according to the partner."),
    check("Someone asks ‘Kannst du mir bitte den Stift geben?’ How can you respond positively?", "Ja, gern. / Ja, natürlich.", "A short clear positive response is enough for this exam-level task."),
    check("If you do not want to use können, how can you make a polite request?", "Gib mir bitte den Stift. / Geben Sie mir bitte den Stift.", "A polite imperative with bitte is also a suitable A1 request."),
    check("How can you refuse a request politely?", "Tut mir leid, das geht leider nicht.", "A short polite refusal clearly reacts to the partner's request."),
    check("Welche Frage passt zu „Ich wohne in Accra“?", "Wo wohnst du?", "The question must match the actual answer and keep W-word + verb + subject order."),
    check("Bilde die Ja/Nein-Frage mit „du / gern / Kaffee / trinkst“.", "Trinkst du gern Kaffee?", "A yes/no question begins with the conjugated verb."),
    check("Was darf in Teil 3 nicht fehlen: eine Bitte oder nur eine Erklärung?", "Eine Bitte und eine passende Reaktion.", "The learner must actually ask or react, not merely explain the exam rules."),
    check("Exit-Check: Stelle höflich eine Bitte um einen Stift und reagiere dann auf eine solche Bitte.", "Können Sie mir bitte einen Stift geben? – Ja, gern.", "A short practical exchange shows awareness of Teil 3; the full mock remains in lesson A1-5.9."),
  ],
});

export const A1_DAYS11_TO15_QUICK_CHECKS = Object.freeze({
  "A1-7": [
    check("Was heißt halb acht als digitale Zeit?", "7:30.", "halb always refers to the next hour."),
    check("Das Museum öffnet ab 10 Uhr. Kannst du um 10:30 Uhr kommen?", "Ja, ab 10 Uhr ist es geöffnet.", "ab = starting from, not until."),
  ],
  "A1-8": [
    check("Welche Zahl ist eine 24-Stunden-Uhrzeit: 18:00 oder 6 Uhr abends?", "18:00.", "Use the 24-hour form to read written timetables."),
    check("Ist „am“ oder „um“ richtig vor Montag?", "am Montag.", "am marks weekdays and dates."),
  ],
  "A1-3.5": [
    check("Wie schreibt man 21 als Wort?", "einundzwanzig.", "The unit precedes und + tens."),
    check("Was bedeutet „kostet“: eine Sache oder mehrere Sachen?", "eine Sache.", "The verb ending -t is used with a singular item."),
  ],
  "A1-3.6": [
    check("Was bedeutet „ich kann“?", "I can / ich habe die Fähigkeit.", "kann is the ich form of können."),
    check("Welches Verb steht am Ende: „Ich muss heute ___“ (lernen)?", "lernen.", "The action verb remains in the infinitive at the end."),
  ],
  "A1-4.7": [
    check("Welcher Teil ist die Vorstellung: Teil 1, 2 oder 3?", "Teil 1.", "Teil 1 is the self-introduction section."),
    check("Welcher Teil prüft Bitten und Reaktionen?", "Teil 3.", "Polite requests and responding belong to Teil 3."),
  ],
});

export const A1_DAYS11_TO15_APPLICATION_CHECKS = Object.freeze({
  "A1-7": [
    check("Ergänze: „Ich lerne ___ Deutsch.“ (10:00 Uhr)", "Ich lerne vormittags Deutsch.", "vormittags is a suitable part of the day for 10:00."),
    check("Korrigiere: „Ich aufstehe um 6 Uhr.“", "Ich stehe um 6 Uhr auf.", "aufstehen splits: stehe … auf."),
  ],
  "A1-8": [
    check("Ergänze: „Wir treffen uns ___ Freitag ___ 17 Uhr.“", "Wir treffen uns am Freitag um 17 Uhr.", "am + weekday; um + clock time."),
    check("Lies die Zugzeit im Fahrplan: „RE 4 · 18:45 · Gleis 5“.", "Der RE 4 fährt um 18:45 Uhr ab.", "The platform number does not change the time."),
  ],
  "A1-3.5": [
    check("Korrigiere: „Die Bücher kostet 24 Euro.“", "Die Bücher kosten 24 Euro.", "Plural Bücher needs kosten."),
    check("Korrigiere: „halb neun = 9:30“.", "halb neun = 8:30.", "Half an hour before nine is 8:30."),
  ],
  "A1-3.6": [
    check("Korrigiere: „Ich muss lernen heute.“", "Ich muss heute lernen.", "In the simple modal structure the infinitive lernen follows the time phrase at the end."),
    check("Ordne die Wörter: „möchte / Kaffee / trinken / ich“.", "Ich möchte Kaffee trinken.", "The finite modal is in position two and the infinitive last."),
  ],
  "A1-4.7": [
    check("Reagiere positiv auf: „Können Sie bitte das Fenster öffnen?“", "Ja, natürlich. / Ja, gern.", "Respond to the request, not with an unrelated memorized introduction."),
    check("Korrigiere die Bitte: „Geben bitte Sie mir den Stift.“", "Geben Sie mir bitte den Stift.", "Polite Sie-imperative uses verb + Sie; bitte is natural after the recipient."),
  ],
});

export const A1_DAYS11_TO15_ASSIGNMENTS = Object.freeze(Object.keys(A1_DAYS11_TO15_UNDERSTANDING));
const lookup = (collection, id) => collection[String(id || "").trim().toUpperCase()] || null;
export const getA1Days11To15UnderstandingChecks = (id) => lookup(A1_DAYS11_TO15_UNDERSTANDING, id);
export const getA1Days11To15QuickChecks = (id) => lookup(A1_DAYS11_TO15_QUICK_CHECKS, id);
export const getA1Days11To15ApplicationChecks = (id) => lookup(A1_DAYS11_TO15_APPLICATION_CHECKS, id);
